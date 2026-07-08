const PHONEPE_ENDPOINTS = {
  sandbox: {
    auth: 'https://api-preprod.phonepe.com/apis/pg-sandbox/v1/oauth/token',
    pay: 'https://api-preprod.phonepe.com/apis/pg-sandbox/checkout/v2/pay',
    orderStatus:
      'https://api-preprod.phonepe.com/apis/pg-sandbox/checkout/v2/order',
    checkoutScript: 'https://mercury-stg.phonepe.com/web/bundle/checkout.js',
  },
  production: {
    auth: 'https://api.phonepe.com/apis/identity-manager/v1/oauth/token',
    pay: 'https://api.phonepe.com/apis/pg/checkout/v2/pay',
    orderStatus: 'https://api.phonepe.com/apis/pg/checkout/v2/order',
    checkoutScript: 'https://mercury.phonepe.com/web/bundle/checkout.js',
  },
};

let cachedToken = null;

function getPhonePeEnvironment() {
  const configuredEnvironment = String(
    process.env.PHONEPE_ENV || process.env.PHONEPE_MODE || 'production'
  ).toLowerCase();

  return ['sandbox', 'preprod', 'uat', 'test'].includes(configuredEnvironment)
    ? 'sandbox'
    : 'production';
}

function getPhonePeConfig() {
  const environment = getPhonePeEnvironment();
  const endpoints = PHONEPE_ENDPOINTS[environment];
  const clientId = process.env.PHONEPE_CLIENT_ID;
  const clientSecret = process.env.PHONEPE_CLIENT_SECRET;
  const clientVersion = process.env.PHONEPE_CLIENT_VERSION || '1';

  if (!clientId || !clientSecret || !clientVersion) {
    throw new Error('PhonePe credentials are not configured in .env.local');
  }

  return {
    clientId,
    clientSecret,
    clientVersion,
    authUrl: process.env.PHONEPE_AUTH_URL || endpoints.auth,
    payUrl: process.env.PHONEPE_PAY_URL || endpoints.pay,
    orderStatusUrl:
      process.env.PHONEPE_ORDER_STATUS_URL || endpoints.orderStatus,
    checkoutScriptUrl:
      process.env.PHONEPE_CHECKOUT_SCRIPT_URL || endpoints.checkoutScript,
  };
}

export function createMerchantOrderId(registrationId) {
  const compactId = String(registrationId).replace(/[^a-zA-Z0-9_-]/g, '');
  const uniqueSuffix = Date.now().toString(36).toUpperCase();

  return `BVM-${compactId.slice(0, 36)}-${uniqueSuffix}`.slice(0, 63);
}

export function getPhonePeCheckoutScriptUrl() {
  return getPhonePeConfig().checkoutScriptUrl;
}

async function getPhonePeAuthToken() {
  const nowInSeconds = Math.floor(Date.now() / 1000);

  if (cachedToken?.accessToken && cachedToken.expiresAt > nowInSeconds + 60) {
    return cachedToken;
  }

  const config = getPhonePeConfig();
  const formData = new URLSearchParams({
    client_id: config.clientId,
    client_version: config.clientVersion,
    client_secret: config.clientSecret,
    grant_type: 'client_credentials',
  });

  const response = await fetch(config.authUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData.toString(),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok || !payload.access_token) {
    throw new Error(payload?.message || 'Unable to authorize PhonePe request');
  }

  cachedToken = {
    accessToken: payload.access_token,
    tokenType: payload.token_type || 'O-Bearer',
    expiresAt: Number(payload.expires_at || nowInSeconds + 300),
  };

  return cachedToken;
}

async function getPhonePeHeaders() {
  const token = await getPhonePeAuthToken();

  return {
    'Content-Type': 'application/json',
    Authorization: `${token.tokenType} ${token.accessToken}`,
  };
}

export async function createPhonePePayment({
  merchantOrderId,
  amountPaise,
  registrationId,
  fullName,
  category,
  redirectUrl,
}) {
  const config = getPhonePeConfig();
  const headers = await getPhonePeHeaders();
  const response = await fetch(config.payUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      merchantOrderId,
      amount: amountPaise,
      expireAfter: 1200,
      paymentFlow: {
        type: 'PG_CHECKOUT',
        message: 'Boisar Varsha Marathon 2026 registration fee',
        merchantUrls: {
          redirectUrl,
        },
      },
      metaInfo: {
        udf1: String(registrationId),
        udf2: String(fullName || '').slice(0, 256),
        udf3: String(category || '').slice(0, 256),
      },
    }),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok || !payload.redirectUrl) {
    throw new Error(payload?.message || 'Unable to create PhonePe payment');
  }

  return payload;
}

export async function getPhonePeOrderStatus(merchantOrderId) {
  const config = getPhonePeConfig();
  const headers = await getPhonePeHeaders();
  const encodedOrderId = encodeURIComponent(merchantOrderId);
  const statusUrl = `${config.orderStatusUrl}/${encodedOrderId}/status?details=true&errorContext=true`;

  const response = await fetch(statusUrl, {
    method: 'GET',
    headers,
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload?.message || 'Unable to fetch PhonePe order status');
  }

  return payload;
}
