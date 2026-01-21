/* path: app/api/doctor/upload/route.ts */
/* ОБНОВЛЁН: принимает profilePhotos (до 3) и docPhotos (до 10), плюс совместимость со старыми profilePhoto/diplomaPhoto */
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

function verifyTelegramWebAppInitData(
  initData: string,
  botToken: string,
  maxAgeSec = 60 * 60 * 24
) {
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) return { ok: false as const, error: 'NO_HASH' as const };

  const authDateStr = params.get('auth_date');
  if (!authDateStr) return { ok: false as const, error: 'NO_AUTH_DATE' as const };

  const authDate = Number(authDateStr);
  if (!Number.isFinite(authDate)) return { ok: false as const, error: 'BAD_AUTH_DATE' as const };

  const nowSec = Math.floor(Date.now() / 1000);
  if (authDate > nowSec + 60) return { ok: false as const, error: 'AUTH_DATE_IN_FUTURE' as const };
  if (nowSec - authDate > maxAgeSec) return { ok: false as const, error: 'INITDATA_EXPIRED' as const };

  params.delete('hash');

  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');

  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
  const computedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

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
}

function safeExt(mime: string) {
  if (mime === 'image/jpeg') return 'jpg';
  if (mime === 'image/png') return 'png';
  if (mime === 'image/webp') return 'webp';
  if (mime === 'application/pdf') return 'pdf';
  return 'bin';
}

function isProfileMime(mime: string) {
  return mime === 'image/jpeg' || mime === 'image/png' || mime === 'image/webp';
}

function isDocMime(mime: string) {
  // Документы — можно фото + pdf
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

function publicUrlForKey(key: string) {
  const base = (process.env.R2_PUBLIC_BASE_URL || '').trim();
  if (!base) return null;
  return `${base.replace(/\/$/, '')}/${key}`;
}

async function fileToBuffer(file: File) {
  const ab = await file.arrayBuffer();
  return Buffer.from(ab);
}

function asFiles(v: unknown): File[] {
  return Array.isArray(v) ? v.filter((x) => x instanceof File) as File[] : [];
}

function rand() {
  return crypto.randomBytes(6).toString('hex');
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
    if (!initData) return NextResponse.json({ ok: false, error: 'NO_INIT_DATA' }, { status: 401 });

    const v = verifyTelegramWebAppInitData(initData, botToken);
    if (!v.ok) return NextResponse.json({ ok: false, error: v.error }, { status: 401 });

    const telegramId = v.user.id;

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

    // НОВЫЕ КЛЮЧИ (массивы)
    const profilePhotos = asFiles(form.getAll('profilePhotos'));
    const docPhotos = asFiles(form.getAll('docPhotos'));

    // Совместимость со старыми ключами (если фронт вдруг старый)
    const legacyProfile = form.get('profilePhoto');
    const legacyDiploma = form.get('diplomaPhoto');

    const finalProfile = profilePhotos.length
      ? profilePhotos
      : legacyProfile instanceof File
        ? [legacyProfile]
        : [];

    const finalDocs = docPhotos.length
      ? docPhotos
      : legacyDiploma instanceof File
        ? [legacyDiploma]
        : [];

    const MAX_PROFILE = 3;
    const MAX_DOCS = 10;

    if (finalProfile.length === 0 || finalDocs.length === 0) {
      return NextResponse.json({ ok: false, error: 'FILES_REQUIRED' }, { status: 400 });
    }
    if (finalProfile.length > MAX_PROFILE) {
      return NextResponse.json(
        { ok: false, error: 'TOO_MANY_FILES', field: 'profilePhotos', max: MAX_PROFILE },
        { status: 400 }
      );
    }
    if (finalDocs.length > MAX_DOCS) {
      return NextResponse.json(
        { ok: false, error: 'TOO_MANY_FILES', field: 'docPhotos', max: MAX_DOCS },
        { status: 400 }
      );
    }

    // Валидация mime + размер
    const maxAvatar = 8 * 1024 * 1024;   // 8MB на файл профиля
    const maxDoc = 25 * 1024 * 1024;     // 25MB на документ

    for (const f of finalProfile) {
      const mime = f.type || '';
      if (!isProfileMime(mime)) {
        return NextResponse.json(
          { ok: false, error: 'BAD_MIME', field: 'profilePhotos', mime },
          { status: 400 }
        );
      }
      if (f.size > maxAvatar) {
        return NextResponse.json(
          { ok: false, error: 'FILE_TOO_LARGE', field: 'profilePhotos', maxBytes: maxAvatar },
          { status: 400 }
        );
      }
    }

    for (const f of finalDocs) {
      const mime = f.type || '';
      if (!isDocMime(mime)) {
        return NextResponse.json(
          { ok: false, error: 'BAD_MIME', field: 'docPhotos', mime },
          { status: 400 }
        );
      }
      if (f.size > maxDoc) {
        return NextResponse.json(
          { ok: false, error: 'FILE_TOO_LARGE', field: 'docPhotos', maxBytes: maxDoc },
          { status: 400 }
        );
      }
    }

    const s3 = makeS3();

    // Грузим по очереди (надёжнее по памяти, чем Promise.all на 13 файлов сразу)
    const uploadedProfile: string[] = [];
    for (let i = 0; i < finalProfile.length; i++) {
      const f = finalProfile[i];
      const mime = f.type || '';
      const key = `doctors/${doctor.id}/avatar-${Date.now()}-${i + 1}-${rand()}.${safeExt(mime)}`;

      await s3.send(
        new PutObjectCommand({
          Bucket: r2Bucket,
          Key: key,
          Body: await fileToBuffer(f),
          ContentType: mime,
          CacheControl: 'public, max-age=31536000, immutable',
        })
      );

      uploadedProfile.push(publicUrlForKey(key) || key);
    }

    const uploadedDocs: string[] = [];
    for (let i = 0; i < finalDocs.length; i++) {
      const f = finalDocs[i];
      const mime = f.type || '';
      const key = `doctors/${doctor.id}/doc-${Date.now()}-${i + 1}-${rand()}.${safeExt(mime)}`;

      await s3.send(
        new PutObjectCommand({
          Bucket: r2Bucket,
          Key: key,
          Body: await fileToBuffer(f),
          ContentType: mime,
          CacheControl: 'public, max-age=31536000, immutable',
        })
      );

      uploadedDocs.push(publicUrlForKey(key) || key);
    }

    // ВАЖНО ПРО СХЕМУ:
    // У тебя в Doctor сейчас, судя по коду, есть ТОЛЬКО profilePhotoUrl и diplomaPhotoUrl (строки).
    // Поэтому делаем так:
    // - если 1 файл — сохраняем строкой как раньше
    // - если много — сохраняем JSON-строкой массива (чтобы ничего не потерять)
    const profileValue = uploadedProfile.length === 1 ? uploadedProfile[0] : JSON.stringify(uploadedProfile);
    const docsValue = uploadedDocs.length === 1 ? uploadedDocs[0] : JSON.stringify(uploadedDocs);

    await prisma.doctor.update({
      where: { id: doctor.id },
      data: {
        profilePhotoUrl: profileValue,
        diplomaPhotoUrl: docsValue,
        submittedAt: new Date(),
        status: 'PENDING',
      },
    });

    return NextResponse.json({
      ok: true,
      doctorId: doctor.id,
      profilePhotos: uploadedProfile,
      docPhotos: uploadedDocs,
      submittedAt: new Date().toISOString(),
      status: 'PENDING',
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: 'UPLOAD_FAILED' }, { status: 500 });
  }
}
