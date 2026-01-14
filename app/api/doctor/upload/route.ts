import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAndParseInitData } from '@/lib/telegram';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import crypto from 'crypto';

function getS3() {
  const accountId = process.env.R2_ACCOUNT_ID!;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID!;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY!;
  const endpoint = process.env.R2_ENDPOINT || `https://${accountId}.r2.cloudflarestorage.com`;

  if (!accountId || !accessKeyId || !secretAccessKey) throw new Error('R2_ENV_MISSING');

  return new S3Client({
    region: 'auto',
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
  });
}

function safeExt(mime: string) {
  if (mime === рынка mime === 'image/jpeg') return 'jpg';
  if (mime === 'image/png') return 'png';
  if (mime === 'image/webp') return 'webp';
  return 'bin';
}

function publicUrlFor(key: string) {
  // Лучше всего сделать кастомный public домен для bucket (например cdn.vrachi.tut)
  // и положить его в R2_PUBLIC_BASE_URL
  const base = process.env.R2_PUBLIC_BASE_URL;
  if (base) return `${base.replace(/\/$/, '')}/${key}`;
  // fallback (не всегда публично работает — зависит от настроек бакета)
  return key;
}

async function putToR2(params: {
  key: string;
  body: Uint8Array;
  contentType: string;
}) {
  const Bucket = process.env.R2_BUCKET!;
  if (!Bucket) throw new Error('R2_BUCKET_MISSING');

  const s3 = getS3();
  await s3.send(
    new PutObjectCommand({
      Bucket,
      Key: params.key,
      Body: params.body,
      ContentType: params.contentType,
    })
  );
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const initData = String(form.get('initData') || '');

    const tg = verifyAndParseInitData(initData);
    if (!tg.ok) return NextResponse.json({ error: tg.error }, { status: 401 });

    const telegramId = String(tg.user.id);

    const doctor = await prisma.doctor.findUnique({
      where: { telegramId },
      select: { id: true },
    });

    if (!doctor) {
      return NextResponse.json({ error: 'DOCTOR_NOT_FOUND' }, { status: 404 });
    }

    const profile = form.get('profilePhoto');
    const diploma = form.get('diplomaPhoto');

    if (!(profile instanceof File) || !(diploma instanceof File)) {
      return NextResponse.json({ error: 'FILES_REQUIRED' }, { status: 400 });
    }

    // небольшой лимит, чтобы сервер не умер (можешь поднять)
    const maxBytes = 8 * 1024 * 1024; // 8MB
    if (profile.size > maxBytes || diploma.size > maxBytes) {
      return NextResponse.json({ error: 'FILE_TOO_LARGE' }, { status: 400 });
    }

    // только картинки
    const allowed = new Set(['image/jpeg', 'image/png', 'image/webp']);
    if (!allowed.has(profile.type) || !allowed.has(diploma.type)) {
      return NextResponse.json({ error: 'BAD_FILE_TYPE' }, { status: 400 });
    }

    const profileBuf = new Uint8Array(await profile.arrayBuffer());
    const diplomaBuf = new Uint8Array(await diploma.arrayBuffer());

    const rnd = crypto.randomBytes(8).toString('hex');
    const profileKey = `doctors/${doctor.id}/profile_${Date.now()}_${rnd}.${safeExt(profile.type)}`;
    const diplomaKey = `doctors/${doctor.id}/diploma_${Date.now()}_${rnd}.${safeExt(diploma.type)}`;

    await putToR2({ key: profileKey, body: profileBuf, contentType: profile.type });
    await putToR2({ key: diplomaKey, body: diplomaBuf, contentType: diploma.type });

    const profileUrl = publicUrlFor(profileKey);
    const diplomaUrl = publicUrlFor(diplomaKey);

    await prisma.doctor.update({
      where: { id: doctor.id },
      data: {
        profilePhotoKey: profileKey,
        profilePhotoUrl: profileUrl,
        diplomaPhotoKey: diplomaKey,
        diplomaPhotoUrl: diplomaUrl,
        docsUploadedAt: new Date(),
        status: 'PENDING',
      },
    });

    return NextResponse.json({ ok: true, profileUrl, diplomaUrl });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: 'SERVER_ERROR' }, { status: 500 });
  }
}
