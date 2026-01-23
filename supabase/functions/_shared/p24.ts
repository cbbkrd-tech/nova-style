// Przelewy24 API utilities
// Documentation: https://developers.przelewy24.pl/

export const P24_CONFIG = {
  // Sandbox environment
  SANDBOX_API_URL: 'https://sandbox.przelewy24.pl',
  SANDBOX_SECURE_URL: 'https://sandbox.przelewy24.pl',
  // Production environment
  PROD_API_URL: 'https://secure.przelewy24.pl',
  PROD_SECURE_URL: 'https://secure.przelewy24.pl',
};

export interface P24Credentials {
  merchantId: number;
  posId: number;
  crcKey: string;
  apiKey: string;
  sandbox: boolean;
}

export interface P24TransactionRequest {
  sessionId: string;
  amount: number; // in grosze (1/100 PLN)
  currency: string;
  description: string;
  email: string;
  country: string;
  language: string;
  urlReturn: string;
  urlStatus: string;
  client?: string;
  address?: string;
  zip?: string;
  city?: string;
  phone?: string;
}

export interface P24TransactionResponse {
  data?: {
    token: string;
  };
  error?: string;
  code?: number;
}

export interface P24VerifyRequest {
  sessionId: string;
  orderId: number;
  amount: number;
  currency: string;
}

/**
 * Generate SHA384 signature for P24 API (REST API format)
 * P24 REST API requires JSON format: {"sessionId":"x","merchantId":123,"amount":100,"currency":"PLN","crc":"key"}
 */
export async function generateP24Sign(data: Record<string, string | number>, crcKey: string): Promise<string> {
  const encoder = new TextEncoder();

  // Create JSON object with crc key included
  const signObject = { ...data, crc: crcKey };

  // Convert to JSON string (P24 expects exact JSON format)
  const stringToSign = JSON.stringify(signObject);

  // Calculate SHA384 hash
  const dataBuffer = encoder.encode(stringToSign);
  const hashBuffer = await crypto.subtle.digest('SHA-384', dataBuffer);

  // Convert to hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  return hashHex;
}

/**
 * Get P24 API base URL based on environment
 */
export function getP24BaseUrl(sandbox: boolean): string {
  return sandbox ? P24_CONFIG.SANDBOX_API_URL : P24_CONFIG.PROD_API_URL;
}

/**
 * Create Basic Auth header for P24 API
 */
export function createP24AuthHeader(posId: number, apiKey: string): string {
  const credentials = `${posId}:${apiKey}`;
  const encoded = btoa(credentials);
  return `Basic ${encoded}`;
}

/**
 * Register a new transaction with P24
 */
export async function registerP24Transaction(
  credentials: P24Credentials,
  transaction: P24TransactionRequest
): Promise<P24TransactionResponse> {
  const baseUrl = getP24BaseUrl(credentials.sandbox);
  const endpoint = `${baseUrl}/api/v1/transaction/register`;

  // Prepare sign data
  const signData = {
    sessionId: transaction.sessionId,
    merchantId: credentials.merchantId,
    amount: transaction.amount,
    currency: transaction.currency,
    crc: credentials.crcKey,
  };

  const sign = await generateP24Sign(
    {
      sessionId: signData.sessionId,
      merchantId: signData.merchantId,
      amount: signData.amount,
      currency: signData.currency,
    },
    credentials.crcKey
  );

  const requestBody = {
    merchantId: credentials.merchantId,
    posId: credentials.posId,
    sessionId: transaction.sessionId,
    amount: transaction.amount,
    currency: transaction.currency,
    description: transaction.description,
    email: transaction.email,
    country: transaction.country,
    language: transaction.language,
    urlReturn: transaction.urlReturn,
    urlStatus: transaction.urlStatus,
    client: transaction.client,
    address: transaction.address,
    zip: transaction.zip,
    city: transaction.city,
    phone: transaction.phone,
    sign: sign,
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': createP24AuthHeader(credentials.posId, credentials.apiKey),
    },
    body: JSON.stringify(requestBody),
  });

  const result = await response.json();

  if (!response.ok) {
    return {
      error: result.error || 'Transaction registration failed',
      code: result.code,
    };
  }

  return result;
}

/**
 * Verify a completed transaction with P24
 */
export async function verifyP24Transaction(
  credentials: P24Credentials,
  verification: P24VerifyRequest
): Promise<{ success: boolean; error?: string }> {
  const baseUrl = getP24BaseUrl(credentials.sandbox);
  const endpoint = `${baseUrl}/api/v1/transaction/verify`;

  const sign = await generateP24Sign(
    {
      sessionId: verification.sessionId,
      orderId: verification.orderId,
      amount: verification.amount,
      currency: verification.currency,
    },
    credentials.crcKey
  );

  const requestBody = {
    merchantId: credentials.merchantId,
    posId: credentials.posId,
    sessionId: verification.sessionId,
    orderId: verification.orderId,
    amount: verification.amount,
    currency: verification.currency,
    sign: sign,
  };

  const response = await fetch(endpoint, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': createP24AuthHeader(credentials.posId, credentials.apiKey),
    },
    body: JSON.stringify(requestBody),
  });

  const result = await response.json();

  if (!response.ok) {
    return {
      success: false,
      error: result.error || 'Transaction verification failed',
    };
  }

  return { success: true };
}

/**
 * Get P24 payment redirect URL
 */
export function getP24RedirectUrl(token: string, sandbox: boolean): string {
  const baseUrl = sandbox ? P24_CONFIG.SANDBOX_SECURE_URL : P24_CONFIG.PROD_SECURE_URL;
  return `${baseUrl}/trnRequest/${token}`;
}
