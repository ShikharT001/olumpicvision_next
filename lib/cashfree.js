const CASHFREE_ENDPOINTS = {
    sandbox: 'https://sandbox.cashfree.com/pg/orders',
    production: 'https://api.cashfree.com/pg/orders'
};

function getCashfreeConfig() {
    const appId = process.env.CASHFREE_APP_ID;
    const secretKey = process.env.CASHFREE_SECRET_KEY;
    const env = (process.env.CASHFREE_ENV || 'sandbox').toLowerCase();

    if (!appId || !secretKey) {
        throw new Error('Cashfree credentials (CASHFREE_APP_ID / CASHFREE_SECRET_KEY) are not configured in .env.local');
    }

    const endpoint = env === 'production' ? CASHFREE_ENDPOINTS.production : CASHFREE_ENDPOINTS.sandbox;

    return {
        appId,
        secretKey,
        env,
        endpoint,
    };
}

export function createCashfreeOrderId(registrationId) {
    const compactId = String(registrationId).replace(/[^a-zA-Z0-9_-]/g, '');
    const uniqueSuffix = Date.now().toString(36).toUpperCase();

    return `BVM-${compactId.slice(0, 16)}-${uniqueSuffix}`.slice(0, 45);
}

export async function createCashfreeOrder({
    orderId,
    amountRupees,
    registrationId,
    fullName,
    phone,
    returnUrl,
}) {
    const config = getCashfreeConfig();

    // Validate customer_phone length: Cashfree expects 10 digits
    let cleanPhone = String(phone || '').replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
        cleanPhone = '9999999999';
    }

    // Ensure customer_id is alphanumeric
    const customerId = `cust_${String(registrationId).replace(/[^a-zA-Z0-9_\-]/g, '') || 'temp'}`.slice(0, 45);

    const requestBody = {
        order_id: orderId,
        order_amount: parseFloat(amountRupees),
        order_currency: 'INR',
        customer_details: {
            customer_id: customerId,
            customer_phone: cleanPhone,
            customer_name: fullName || 'Participant',
        },
        order_meta: {
            return_url: returnUrl,
        },
    };

    const response = await fetch(config.endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-version': '2023-08-01',
            'x-client-id': config.appId,
            'x-client-secret': config.secretKey,
        },
        body: JSON.stringify(requestBody),
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok || !payload.payment_session_id) {
        console.error('Cashfree order creation error payload:', payload);
        throw new Error(payload?.message || 'Unable to create Cashfree order');
    }

    return payload;
}

export async function getCashfreeOrderStatus(orderId) {
    const config = getCashfreeConfig();
    const getUrl = `${config.endpoint}/${encodeURIComponent(orderId)}`;

    const response = await fetch(getUrl, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'x-api-version': '2023-08-01',
            'x-client-id': config.appId,
            'x-client-secret': config.secretKey,
        },
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
        console.error('Cashfree fetch order error payload:', payload);
        throw new Error(payload?.message || 'Unable to fetch Cashfree order status');
    }

    return payload;
}

export async function getCashfreeOrderPayments(orderId) {
    const config = getCashfreeConfig();
    const getUrl = `${config.endpoint}/${encodeURIComponent(orderId)}/payments`;

    const response = await fetch(getUrl, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'x-api-version': '2023-08-01',
            'x-client-id': config.appId,
            'x-client-secret': config.secretKey,
        },
    });

    const payload = await response.json().catch(() => ([]));

    if (!response.ok) {
        console.error('Cashfree fetch order payments error payload:', payload);
        throw new Error(payload?.message || 'Unable to fetch Cashfree order payments');
    }

    return payload;
}
