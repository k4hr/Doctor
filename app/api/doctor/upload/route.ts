/* path: app/api/doctor/upload/route.ts */
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

type TgUser = {
  id: string;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
};

function verifyTelegramWebAppInitData(initData: string, botToken: string) {
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) return { ok: false as const, error: 'NO_HASH' as const };

  params.delete('hash');

  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');

  const secretKey = crypto
    .createHmac('sha256', 'WebAppData')
    .update(botToken)
    .digest();

  const computedHash = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');

  if (computedHash !== hash) return { ok: false as const, error: 'BAD_HASH' as const };

  const userStr = params.get('user');
  if (!userStr) return { ok: false as const, error: 'NO_USER' as const };

  let userJson: any;
  try {
    userJson = JSON.parse(userStr);
  } catch {
    return { ok: false as const, error: 'BAD_USER_JSON' as const };
  }

  if (!userJson?.id) return { ok: false as const, error: 'NO_USER_ID' as const };

  const user: TgUser = {
    id: String(userJson.id),
    username: userJson.username ? String(userJson.username) : null,
    first_name: userJson.first_name ? String(userJson.first_name) : null,
    last_name: userJson.last_name ? String(userJson.last_name) : null,
  };

  return { ok: true as const, user };
}

function safeExt(mime: string) {
  // ✅ фикс: НИКАКИХ "рынка" и прочей дичи :)
  if (mime === 'image/jpeg') return 'jpg';
  if (mime === 'image/png') return 'png';
  if (mime === 'image/webp') return 'webp';
  if (mime === 'application/pdf') return 'pdf';
  return 'bin';
}

function isAllowedMime(mime: string) {
  return (
    mime === 'image/jpeg' ||
    mime === 'image/png' ||
    mime === 'image/webp' ||
    mime === 'application/pdf'
  );
}

function makeS3() {
  const accountId = process.env.R2_ACCOUNT_ID!;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID!;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY!;

  return new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
}

/**
 * POST /api/doctor/upload
 * body: { initData, kind: "avatar" | "diploma", mime: "image/jpeg", size: number }
 * return: { ok, uploadUrl, key, publicUrl }
 */
export async function POST(req: Request) {
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      return NextResponse.json(
        { ok: false, error: 'NO_BOT_TOKEN', hint: 'Set TELEGRAM_BOT_TOKEN' },
        { status: 500 }
      );
    }

    const r2AccountId = process.env.R2_ACCOUNT_ID;
    const r2Bucket = process.env.R2_BUCKET;
    const r2PublicBaseUrl = process.env.R2_PUBLIC_BASE_URL; // например: https://cdn.yoursite.com (или прямой r2.dev)
    const r2AccessKeyId = process.env.R2_ACCESS_KEY_ID;
    const r2Secret = process.env.R2_SECRET_ACCESS_KEY;

    if (!r2AccountId || !r2Bucket || !r2AccessKeyId || !r2Secret) {
      return NextResponse.json(
        {
          ok: false,
          error: 'NO_R2_ENV',
          hint:
            'Set R2_ACCOUNT_ID, R2_BUCKET, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY (and optionally R2_PUBLIC_BASE_URL)',
        },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ ok: false, error: 'BAD_JSON' }, { status: 400 });
    }

    const initData = typeof body.initData === 'string' ? body.initData : '';
    if (!initData) {
      return NextResponse.json({ ok: false, error: 'NO_INIT_DATA' }, { status: 401 });
    }

    const v = verifyTelegramWebAppInitData(initData, botToken);
    if (!v.ok) return NextResponse.json({ ok: false, error: v.error }, { status: 401 });

    const telegramId = v.user.id;

    const kind = body.kind === 'avatar' || body.kind === 'diploma' ? body.kind : null;
    const mime = typeof body.mime === 'string' ? body.mime : '';
    const size = Number(body.size);

    if (!kind) {
      return NextResponse.json({ ok: false, error: 'VALIDATION_ERROR', field: 'kind' }, { status: 400 });
    }
    if (!mime || !isAllowedMime(mime)) {
      return NextResponse.json({ ok: false, error: 'VALIDATION_ERROR', field: 'mime' }, { status: 400 });
    }
    if (!Number.isFinite(size) || size <= 0) {
      return NextResponse.json({ ok: false, error: 'VALIDATION_ERROR', field: 'size' }, { status: 400 });
    }

    // лимиты (можешь поменять)
    const maxBytes = kind === 'avatar' ? 8 * 1024 * 1024 : 25 * 1024 * 1024;
    if (size > maxBytes) {
      return NextResponse.json(
        { ok: false, error: 'FILE_TOO_LARGE', maxBytes },
        { status: 400 }
      );
    }

    // врач должен существовать (создан на шаге анкеты)
    const doctor = await prisma.doctor.findUnique({
      where: { telegramId },
      select: { id: true },
    });

    if (!doctor) {
      return NextResponse.json(
        { ok: false, error: 'NO_DOCTOR', hint: 'Сначала сохраните анкету' },
        { status: 404 }
      );
    }

    const ext = safeExt(mime);
    const key = `doctors/${doctor.id}/${kind}-${Date.now()}.${ext}`;

    const s3 = makeS3();

    const cmd = new PutObjectCommand({
      Bucket: r2Bucket,
      Key: key,
      ContentType: mime,
      ContentLength: size,
      // можно включить кеширование
      CacheControl: 'public, max-age=31536000, immutable',
    });

    // подписываем PUT на 10 минут
    const uploadUrl = await getSignedUrl(s3, cmd, { expiresIn: 60 * 10 });

    const publicUrl = r2PublicBaseUrl ? `${r2PublicBaseUrl.replace(/\/$/, '')}/${key}` : null;

    return NextResponse.json({
      ok: true,
      kind,
      key,
      uploadUrl,
      publicUrl,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: 'UPLOAD_URL_FAILED' }, { status: 500 });
  }
}
