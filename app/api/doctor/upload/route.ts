/* path: app/api/doctor/upload/route.ts */
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type TgUser = {
  id: string;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
};

function timingSafeEqualHex(a: string, b: string) {
  try {
    const ab = Buffer.from(a, 'hex');
    const bb = Buffer.from(b, 'hex');
    if (ab.length !== bb.length) return false;
    return crypto.timingSafeEqual(ab, bb);
  } catch {
    return false;
  }
}

function verifyTelegramWebAppInitData(initData: string, botToken: string) {
  try {
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    if (!hash) return { ok: false as const, error: 'NO_HASH' as const };

    params.delete('hash');

    const dataCheckString = [...params.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join('\n');

    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();

    const computedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    if (!timingSafeEqualHex(computedHash, hash)) {
      return { ok: false as const, error: 'BAD_HASH' as const };
    }

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
  } catch {
    return { ok: false as const, error: 'BAD_INITDATA' as const };
  }
}

function safeExt(mime: string) {
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

async function putObjectToR2(opts: {
  bucket: string;
  key: string;
  contentType: string;
  bytes: Uint8Array;
}) {
  const s3 = makeS3();
  const cmd = new PutObjectCommand({
    Bucket: opts.bucket,
    Key: opts.key,
    Body: opts.bytes,
    ContentType: opts.contentType,
    CacheControl: 'public, max-age=31536000, immutable',
  });
  await s3.send(cmd);
}

function publicUrlFor(key: string) {
  const base = process.env.R2_PUBLIC_BASE_URL || '';
  if (!base) return null;
  return `${base.replace(/\/$/, '')}/${key}`;
}

export async function POST(req: Request) {
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      return NextResponse.json(
        { ok: false, error: 'NO_BOT_TOKEN', hint: 'Set TELEGRAM_BOT_TOKEN' },
        { status: 500 }
      );
    }

    const r2Bucket = process.env.R2_BUCKET;
    const r2AccountId = process.env.R2_ACCOUNT_ID;
    const r2AccessKeyId = process.env.R2_ACCESS_KEY_ID;
    const r2Secret = process.env.R2_SECRET_ACCESS_KEY;

    if (!r2Bucket || !r2AccountId || !r2AccessKeyId || !r2Secret) {
      return NextResponse.json(
        {
          ok: false,
          error: 'NO_R2_ENV',
          hint:
            'Set R2_ACCOUNT_ID, R2_BUCKET, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY (and R2_PUBLIC_BASE_URL)',
        },
        { status: 500 }
      );
    }

    const fd = await req.formData();
    const initData = String(fd.get('initData') || '').trim();
    const profileFile = fd.get('profilePhoto');
    const diplomaFile = fd.get('diplomaPhoto');

    if (!initData) return NextResponse.json({ ok: false, error: 'NO_INIT_DATA' }, { status: 401 });

    const v = verifyTelegramWebAppInitData(initData, botToken);
    if (!v.ok) return NextResponse.json({ ok: false, error: v.error }, { status: 401 });

    const telegramId = v.user.id;

    if (!(profileFile instanceof File) || !(diplomaFile instanceof File)) {
      return NextResponse.json(
        { ok: false, error: 'FILES_REQUIRED', hint: 'Need profilePhoto and diplomaPhoto' },
        { status: 400 }
      );
    }

    if (!isAllowedMime(profileFile.type) || !isAllowedMime(diplomaFile.type)) {
      return NextResponse.json({ ok: false, error: 'BAD_MIME' }, { status: 400 });
    }

    // лимиты (можешь поменять)
    const maxProfile = 8 * 1024 * 1024;
    const maxDiploma = 25 * 1024 * 1024;

    if (profileFile.size > maxProfile) {
      return NextResponse.json({ ok: false, error: 'PROFILE_TOO_LARGE', maxBytes: maxProfile }, { status: 400 });
    }
    if (diplomaFile.size > maxDiploma) {
      return NextResponse.json({ ok: false, error: 'DIPLOMA_TOO_LARGE', maxBytes: maxDiploma }, { status: 400 });
    }

    const doctor = await prisma.doctor.findUnique({
      where: { telegramId },
      select: { id: true, status: true },
    });

    if (!doctor) {
      return NextResponse.json(
        { ok: false, error: 'NO_DOCTOR', hint: 'Сначала сохраните анкету' },
        { status: 404 }
      );
    }

    const now = Date.now();

    const profileKey = `doctors/${doctor.id}/profile-${now}.${safeExt(profileFile.type)}`;
    const diplomaKey = `doctors/${doctor.id}/diploma-${now}.${safeExt(diplomaFile.type)}`;

    const profileBytes = new Uint8Array(await profileFile.arrayBuffer());
    const diplomaBytes = new Uint8Array(await diplomaFile.arrayBuffer());

    await putObjectToR2({
      bucket: r2Bucket,
      key: profileKey,
      contentType: profileFile.type,
      bytes: profileBytes,
    });

    await putObjectToR2({
      bucket: r2Bucket,
      key: diplomaKey,
      contentType: diplomaFile.type,
      bytes: diplomaBytes,
    });

    const profileUrl = publicUrlFor(profileKey);
    const diplomaUrl = publicUrlFor(diplomaKey);

    // отметим как отправлено на модерацию
    await prisma.doctor.update({
      where: { telegramId },
      data: {
        profilePhotoUrl: profileUrl,
        diplomaPhotoUrl: diplomaUrl,
        submittedAt: new Date(),
        status: 'PENDING',
      },
    });

    return NextResponse.json({
      ok: true,
      profilePhotoUrl: profileUrl,
      diplomaPhotoUrl: diplomaUrl,
      status: 'PENDING',
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: 'UPLOAD_FAILED' }, { status: 500 });
  }
}
