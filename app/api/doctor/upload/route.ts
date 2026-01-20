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

function verifyTelegramWebAppInitData(initData: string, botToken: string) {
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) return { ok: false as const, error: 'NO_HASH' as const };

  params.delete('hash');

  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');

  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
  const computedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

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
  if (mime === 'image/jpeg') return 'jpg';
  if (mime === 'image/png') return 'png';
  if (mime === 'image/webp') return 'webp';
  if (mime === 'application/pdf') return 'pdf';
  return 'bin';
}

function isAllowedMime(mime: string) {
  return mime === 'image/jpeg' || mime === 'image/png' || mime === 'image/webp' || mime === 'application/pdf';
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

function publicUrlForKey(key: string) {
  const base = (process.env.R2_PUBLIC_BASE_URL || '').trim();
  if (!base) return null;
  return `${base.replace(/\/$/, '')}/${key}`;
}

async function fileToBuffer(file: File) {
  const ab = await file.arrayBuffer();
  return Buffer.from(ab);
}

export async function POST(req: Request) {
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      return NextResponse.json({ ok: false, error: 'NO_BOT_TOKEN', hint: 'Set TELEGRAM_BOT_TOKEN' }, { status: 500 });
    }

    const r2AccountId = process.env.R2_ACCOUNT_ID;
    const r2Bucket = process.env.R2_BUCKET;
    const r2AccessKeyId = process.env.R2_ACCESS_KEY_ID;
    const r2Secret = process.env.R2_SECRET_ACCESS_KEY;

    if (!r2AccountId || !r2Bucket || !r2AccessKeyId || !r2Secret) {
      return NextResponse.json(
        {
          ok: false,
          error: 'NO_R2_ENV',
          hint:
            'Set R2_ACCOUNT_ID, R2_BUCKET, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY (and R2_PUBLIC_BASE_URL for public links)',
        },
        { status: 500 }
      );
    }

    const form = await req.formData();
    const initData = String(form.get('initData') || '').trim();

    const profileFile = form.get('profilePhoto');
    const diplomaFile = form.get('diplomaPhoto');

    if (!initData) return NextResponse.json({ ok: false, error: 'NO_INIT_DATA' }, { status: 401 });
    if (!(profileFile instanceof File) || !(diplomaFile instanceof File)) {
      return NextResponse.json({ ok: false, error: 'FILES_REQUIRED' }, { status: 400 });
    }

    const v = verifyTelegramWebAppInitData(initData, botToken);
    if (!v.ok) return NextResponse.json({ ok: false, error: v.error }, { status: 401 });

    const telegramId = v.user.id;

    const doctor = await prisma.doctor.findUnique({
      where: { telegramId },
      select: { id: true },
    });

    if (!doctor) {
      return NextResponse.json({ ok: false, error: 'NO_DOCTOR', hint: 'Сначала сохраните анкету' }, { status: 404 });
    }

    const profileMime = profileFile.type || '';
    const diplomaMime = diplomaFile.type || '';

    if (!isAllowedMime(profileMime)) {
      return NextResponse.json({ ok: false, error: 'BAD_MIME', field: 'profilePhoto' }, { status: 400 });
    }
    if (!isAllowedMime(diplomaMime)) {
      return NextResponse.json({ ok: false, error: 'BAD_MIME', field: 'diplomaPhoto' }, { status: 400 });
    }

    const maxAvatar = 8 * 1024 * 1024;
    const maxDiploma = 25 * 1024 * 1024;
    if (profileFile.size > maxAvatar)
      return NextResponse.json({ ok: false, error: 'FILE_TOO_LARGE', field: 'profilePhoto', maxBytes: maxAvatar }, { status: 400 });
    if (diplomaFile.size > maxDiploma)
      return NextResponse.json({ ok: false, error: 'FILE_TOO_LARGE', field: 'diplomaPhoto', maxBytes: maxDiploma }, { status: 400 });

    const s3 = makeS3();

    const profileKey = `doctors/${doctor.id}/avatar-${Date.now()}.${safeExt(profileMime)}`;
    const diplomaKey = `doctors/${doctor.id}/diploma-${Date.now()}.${safeExt(diplomaMime)}`;

    await s3.send(
      new PutObjectCommand({
        Bucket: r2Bucket,
        Key: profileKey,
        Body: await fileToBuffer(profileFile),
        ContentType: profileMime,
        CacheControl: 'public, max-age=31536000, immutable',
      })
    );

    await s3.send(
      new PutObjectCommand({
        Bucket: r2Bucket,
        Key: diplomaKey,
        Body: await fileToBuffer(diplomaFile),
        ContentType: diplomaMime,
        CacheControl: 'public, max-age=31536000, immutable',
      })
    );

    // делаем публичные ссылки (если задан base)
    const profileUrl = publicUrlForKey(profileKey);
    const diplomaUrl = publicUrlForKey(diplomaKey);

    await prisma.doctor.update({
      where: { id: doctor.id },
      data: {
        profilePhotoUrl: profileUrl || profileKey,
        diplomaPhotoUrl: diplomaUrl || diplomaKey,
        submittedAt: new Date(),
        status: 'PENDING',
      },
    });

    return NextResponse.json({
      ok: true,
      doctorId: doctor.id,
      profilePhotoUrl: profileUrl || profileKey,
      diplomaPhotoUrl: diplomaUrl || diplomaKey,
      submittedAt: new Date().toISOString(),
      status: 'PENDING',
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: 'UPLOAD_FAILED' }, { status: 500 });
  }
}
