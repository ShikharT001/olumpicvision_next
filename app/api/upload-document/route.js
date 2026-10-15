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
    const { allowed, retryAfter } = checkRateLimit(ip, 'upload', 15, 10 * 60_000);

    if (!allowed) {
        return NextResponse.json(
            { error: `Too many upload attempts. Please wait ${retryAfter} seconds.` },
            { status: 429, headers: { 'Retry-After': String(retryAfter) } }
        );
    }

    try {
        const formData = await request.formData();
        const file = formData.get('file');
        const label = formData.get('label') || 'document';
        const isPdvlPlayerPhoto = label === 'pdvl-player-photo';

        if (!file || typeof file === 'string') {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // Validate file type — accept image types flexibly
        const isImage = file.type?.startsWith('image/') || ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/pjpeg', 'image/x-png', 'image/heic', 'image/heif'].includes(file.type);
        const isPdf = file.type === 'application/pdf';

        if (!isImage && (!isPdf || isPdvlPlayerPhoto)) {
            return NextResponse.json(
                { error: 'Player photo must be an image (JPG, PNG, WEBP).' },
                { status: 400 }
            );
        }

        // Validate file size – allow up to 2 MB for player photo, 5 MB for document
        const MAX_SIZE_BYTES = isPdvlPlayerPhoto ? 2 * 1024 * 1024 : 5 * 1024 * 1024;
        if (file.size > MAX_SIZE_BYTES) {
            return NextResponse.json(
                { error: `File is too large. Maximum allowed photo size is 2 MB.` },
                { status: 400 }
            );
        }

        // Convert to buffer
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
                            folder: isPdvlPlayerPhoto ? 'pdvl_2026/player_photos' : 'boisar_varsha_marathon/documents',
                            resource_type: 'auto',
                            public_id: `${label}_${Date.now()}`,
                            tags: [isPdvlPlayerPhoto ? 'pdvl-registration' : 'marathon-registration', label],
                            ...(file.type !== 'application/pdf' && {
                                quality: 'auto:good',
                                fetch_format: 'auto',
                            }),
                        },
                        (error, result) => {
                            if (error) reject(error);
                            else resolve(result);
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
                console.warn('Cloudinary upload failed, falling back to base64 Data URL:', cloudErr.message);
            }
        }

        // Fallback: convert file buffer to base64 Data URL so photo upload NEVER fails!
        const mimeType = file.type || 'image/jpeg';
        const base64Url = `data:${mimeType};base64,${buffer.toString('base64')}`;

        return NextResponse.json({
            success: true,
            url: base64Url,
            label,
        });
    } catch (error) {
        console.error('Document upload error:', error);
        return NextResponse.json(
            { error: 'Unable to process photo upload. Please try again.' },
            { status: 500 }
        );
    }
}

