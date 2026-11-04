import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const maxDuration = 30;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request) {
  const ip = getClientIp(request);
  const { allowed, retryAfter } = checkRateLimit(ip, 'upload', 30, 10 * 60_000);

  if (!allowed) {
    return NextResponse.json(
      { error: `Too many upload attempts. Please wait ${retryAfter} seconds.` },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const label = formData.get('label') || 'auction-player-photo';

    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const isImage =
      file.type?.startsWith('image/') ||
      ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/pjpeg', 'image/x-png', 'image/heic', 'image/heif'].includes(
        file.type
      );

    if (!isImage) {
      return NextResponse.json(
        { error: 'File must be an image (JPG, PNG, WEBP).' },
        { status: 400 }
      );
    }

    const MAX_SIZE_BYTES = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { error: 'Image is too large. Maximum allowed photo size is 5 MB.' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const hasCloudinary = Boolean(
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
    );

    if (hasCloudinary) {
      try {
        const uploaded = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: 'auction_players/photos',
              resource_type: 'image',
              public_id: `${label}_${Date.now()}`,
              tags: ['auction-player-photo', label],
              quality: 'auto:good',
              fetch_format: 'auto',
            },
            (err, res) => {
              if (err) reject(err);
              else resolve(res);
            }
          );
          uploadStream.end(buffer);
        });

        return NextResponse.json({
          success: true,
          url: uploaded.secure_url,
          publicId: uploaded.public_id,
          label,
        });
      } catch (cloudErr) {
        console.warn('Cloudinary upload fallback to base64 Data URL:', cloudErr.message);
      }
    }

    // Fallback: convert file buffer to base64 Data URL so photo upload always succeeds!
    const mimeType = file.type || 'image/jpeg';
    const base64Url = `data:${mimeType};base64,${buffer.toString('base64')}`;

    return NextResponse.json({
      success: true,
      url: base64Url,
      label,
    });
  } catch (error) {
    console.error('Photo upload error:', error);
    return NextResponse.json(
      { error: 'Unable to process photo upload. Please try again.' },
      { status: 500 }
    );
  }
}

