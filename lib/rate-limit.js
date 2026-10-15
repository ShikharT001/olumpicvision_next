/**
 * In-memory rate limiter — works per serverless instance.
 * For multi-instance Vercel with heavy traffic, upgrade to Redis/Upstash.
 *
 * Usage:
 *   const { allowed, retryAfter } = checkRateLimit(ip, 'register', 3, 60_000);
 *   if (!allowed) return 429 response with Retry-After header
 */

// Map<key, { count, windowStart }>
const store = new Map();

// Cleanup stale entries every 5 minutes to avoid unbounded memory growth
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
        if (now - entry.windowStart > entry.windowMs * 2) {
            store.delete(key);
        }
    }
}, 5 * 60 * 1000);

/**
 * @param {string} identifier  e.g. IP address or phone number
 * @param {string} action      label for the bucket (e.g. 'register', 'upload')
 * @param {number} limit       max requests allowed in the window
 * @param {number} windowMs    window duration in milliseconds
 * @returns {{ allowed: boolean, retryAfter: number }}
 */
export function checkRateLimit(identifier, action, limit, windowMs) {
    const key = `${action}:${identifier}`;
    const now = Date.now();

    const entry = store.get(key);

    if (!entry || now - entry.windowStart >= windowMs) {
        store.set(key, { count: 1, windowStart: now, windowMs });
        return { allowed: true, retryAfter: 0 };
    }

    if (entry.count >= limit) {
        const retryAfter = Math.ceil((entry.windowStart + windowMs - now) / 1000);
        return { allowed: false, retryAfter };
    }

    entry.count += 1;
    return { allowed: true, retryAfter: 0 };
}

/**
 * Get the best available IP from Next.js request headers.
 * Works on Vercel (x-forwarded-for) and locally.
 */
export function getClientIp(request) {
    return (
        request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        request.headers.get('x-real-ip') ||
        '127.0.0.1'
    );
}
