import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

export const runtime = 'nodejs';

// Uploads can be slow on poor connections — allow 30s
export const maxDuration = 30;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request) {
    // ── Rate limit: max 10 uploads per IP per 10 minutes ───────────────────────
    const ip = getClientIp(request);
    const { allowed, retryAfter } = checkRateLimit(ip, 'upload', 10, 10 * 60_000);

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

        if (!file || typeof file === 'string') {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json(
                { error: 'Invalid file type. Please upload JPG, PNG, WEBP, or PDF.' },
                { status: 400 }
            );
        }

        // Validate file size – max 5 MB
        const MAX_SIZE_BYTES = 5 * 1024 * 1024;
        if (file.size > MAX_SIZE_BYTES) {
            return NextResponse.json(
                { error: 'File is too large. Maximum allowed size is 5 MB.' },
                { status: 400 }
            );
        }

        // Convert to buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Upload to Cloudinary with quality reduction for images (faster, smaller)
        const uploaded = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: 'boisar_varsha_marathon/documents',
                    resource_type: 'auto',
                    public_id: `${label}_${Date.now()}`,
                    tags: ['marathon-registration', label],
                    // Compress images to reduce storage & bandwidth costs
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
    } catch (error) {
        console.error('Document upload error:', error);
        return NextResponse.json(
            { error: 'Upload failed. Please try again.' },
            { status: 500 }
        );
    }
}
