// Email utilities using Resend API
// Documentation: https://resend.com/docs

const RESEND_API_URL = 'https://api.resend.com/emails';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
  headers?: Record<string, string>;
}

export interface OrderEmailData {
  orderId: string;
  sessionId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  shippingStreet: string;
  shippingCity: string;
  shippingPostalCode: string;
  shippingMethod?: string;
  items: Array<{
    id: number;
    name: string;
    price: number;
    quantity: number;
    selectedSize: string;
    image?: string;
  }>;
  subtotal: number; // in grosze
  shippingCost: number; // in grosze
  totalAmount: number; // in grosze
}

/**
 * Send an email using Resend API
 */
export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
  const resendApiKey = Deno.env.get('RESEND_API_KEY');
  const fromEmail = Deno.env.get('EMAIL_FROM') || 'Nova Style <zamowienia@novastyle.pl>';

  if (!resendApiKey) {
    console.error('RESEND_API_KEY not configured');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const response = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: Array.isArray(options.to) ? options.to : [options.to],
        subject: options.subject,
        html: options.html,
        reply_to: options.replyTo,
        headers: options.headers,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Resend API error:', result);
      return { success: false, error: result.message || 'Failed to send email' };
    }

    console.log('Email sent successfully:', result.id);
    return { success: true };
  } catch (error) {
    console.error('Email sending error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Format price from grosze to PLN string
 */
function formatPrice(grosze: number): string {
  return (grosze / 100).toFixed(2).replace('.', ',') + ' PLN';
}

/**
 * Get shipping method label
 */
function getShippingLabel(method?: string): string {
  if (method === 'pickup') return 'Odbiór osobisty - Nowa Sól';
  return 'Kurier InPost';
}

/**
 * Generate customer order confirmation email HTML
 */
export function generateCustomerEmailHtml(order: OrderEmailData): string {
  const itemsHtml = order.items.map(item => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e5e5e5;">
        <strong>${item.name}</strong><br>
        <span style="color: #666; font-size: 14px;">Rozmiar: ${item.selectedSize}</span>
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e5e5; text-align: center;">${item.quantity}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e5e5; text-align: right;">${formatPrice(item.price * 100 * item.quantity)}</td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Potwierdzenie zamówienia</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <!-- Header -->
    <div style="background-color: #1a1a1a; padding: 30px 40px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 300; letter-spacing: 3px;">NOVA STYLE</h1>
    </div>

    <!-- Content -->
    <div style="padding: 40px;">
      <h2 style="color: #1a1a1a; margin: 0 0 20px 0; font-size: 24px; font-weight: 500;">Dziękujemy za zamówienie!</h2>

      <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
        Cześć ${order.customerName.split(' ')[0]},<br><br>
        Twoje zamówienie zostało przyjęte i opłacone. Poniżej znajdziesz szczegóły zamówienia.
      </p>

      <!-- Order Info -->
      <div style="background-color: #f9f9f9; padding: 20px; margin-bottom: 30px; border-left: 4px solid #d4a574;">
        <p style="margin: 0; color: #666; font-size: 14px;">
          <strong>Numer zamówienia:</strong> ${order.sessionId.substring(0, 20)}<br>
          <strong>Metoda dostawy:</strong> ${getShippingLabel(order.shippingMethod)}
        </p>
      </div>

      <!-- Items Table -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <thead>
          <tr style="background-color: #f5f5f5;">
            <th style="padding: 12px; text-align: left; font-weight: 600; color: #333;">Produkt</th>
            <th style="padding: 12px; text-align: center; font-weight: 600; color: #333;">Ilość</th>
            <th style="padding: 12px; text-align: right; font-weight: 600; color: #333;">Cena</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <!-- Summary -->
      <div style="border-top: 2px solid #1a1a1a; padding-top: 20px;">
        <table style="width: 100%;">
          <tr>
            <td style="padding: 5px 0; color: #666;">Produkty:</td>
            <td style="padding: 5px 0; text-align: right;">${formatPrice(order.subtotal)}</td>
          </tr>
          <tr>
            <td style="padding: 5px 0; color: #666;">Dostawa:</td>
            <td style="padding: 5px 0; text-align: right;">${order.shippingCost === 0 ? 'Gratis' : formatPrice(order.shippingCost)}</td>
          </tr>
          <tr>
            <td style="padding: 15px 0 5px 0; font-size: 18px; font-weight: 600; color: #1a1a1a;">Do zapłaty:</td>
            <td style="padding: 15px 0 5px 0; text-align: right; font-size: 18px; font-weight: 600; color: #1a1a1a;">${formatPrice(order.totalAmount)}</td>
          </tr>
        </table>
      </div>

      <!-- Shipping Address -->
      <div style="margin-top: 30px; padding: 20px; background-color: #f9f9f9;">
        <h3 style="margin: 0 0 10px 0; font-size: 16px; color: #333;">Adres dostawy:</h3>
        <p style="margin: 0; color: #666; line-height: 1.6;">
          ${order.customerName}<br>
          ${order.shippingStreet}<br>
          ${order.shippingPostalCode} ${order.shippingCity}
        </p>
      </div>

      <!-- Footer Note -->
      <p style="color: #666; font-size: 14px; line-height: 1.6; margin-top: 30px;">
        Jeśli masz pytania dotyczące zamówienia, odpowiedz na ten email lub napisz do nas na
        <a href="mailto:novastylebutik@gmail.com" style="color: #d4a574;">novastylebutik@gmail.com</a>
      </p>
    </div>

    <!-- Footer -->
    <div style="background-color: #1a1a1a; padding: 20px 40px; text-align: center;">
      <p style="color: #999; font-size: 12px; margin: 0;">
        Nova Style | Nowa Sól<br>
        <a href="mailto:novastylebutik@gmail.com" style="color: #d4a574; text-decoration: none;">novastylebutik@gmail.com</a>
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Generate store owner notification email HTML
 */
export function generateOwnerEmailHtml(order: OrderEmailData): string {
  const itemsHtml = order.items.map(item => `
    <tr>
      <td style="padding: 10px; border: 1px solid #ddd;">${item.name}</td>
      <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${item.selectedSize}</td>
      <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${item.quantity}</td>
      <td style="padding: 10px; border: 1px solid #ddd; text-align: right;">${formatPrice(item.price * 100)}</td>
      <td style="padding: 10px; border: 1px solid #ddd; text-align: right;">${formatPrice(item.price * 100 * item.quantity)}</td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nowe zamówienie</title>
</head>
<body style="margin: 0; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 700px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <h1 style="color: #2e7d32; margin: 0 0 20px 0; font-size: 24px; border-bottom: 2px solid #2e7d32; padding-bottom: 10px;">
      🛒 Nowe zamówienie!
    </h1>

    <!-- Order Summary -->
    <div style="background-color: #e8f5e9; padding: 15px; border-radius: 6px; margin-bottom: 25px;">
      <p style="margin: 0; font-size: 16px;">
        <strong>ID zamówienia:</strong> ${order.sessionId}<br>
        <strong>Kwota:</strong> <span style="color: #2e7d32; font-size: 20px; font-weight: bold;">${formatPrice(order.totalAmount)}</span>
      </p>
    </div>

    <!-- Customer Info -->
    <h2 style="color: #333; font-size: 18px; margin: 0 0 15px 0; border-bottom: 1px solid #eee; padding-bottom: 8px;">
      👤 Dane klienta
    </h2>
    <table style="width: 100%; margin-bottom: 25px;">
      <tr>
        <td style="padding: 5px 0; color: #666; width: 140px;">Imię i nazwisko:</td>
        <td style="padding: 5px 0; font-weight: 500;">${order.customerName}</td>
      </tr>
      <tr>
        <td style="padding: 5px 0; color: #666;">Email:</td>
        <td style="padding: 5px 0;"><a href="mailto:${order.customerEmail}" style="color: #1976d2;">${order.customerEmail}</a></td>
      </tr>
      <tr>
        <td style="padding: 5px 0; color: #666;">Telefon:</td>
        <td style="padding: 5px 0;">${order.customerPhone || 'Nie podano'}</td>
      </tr>
    </table>

    <!-- Shipping Info -->
    <h2 style="color: #333; font-size: 18px; margin: 0 0 15px 0; border-bottom: 1px solid #eee; padding-bottom: 8px;">
      📦 Dostawa: ${getShippingLabel(order.shippingMethod)}
    </h2>
    <div style="background-color: #fff3e0; padding: 15px; border-radius: 6px; margin-bottom: 25px; border-left: 4px solid #ff9800;">
      <p style="margin: 0; line-height: 1.6;">
        <strong>${order.customerName}</strong><br>
        ${order.shippingStreet}<br>
        ${order.shippingPostalCode} ${order.shippingCity}
      </p>
    </div>

    <!-- Items -->
    <h2 style="color: #333; font-size: 18px; margin: 0 0 15px 0; border-bottom: 1px solid #eee; padding-bottom: 8px;">
      🏷️ Zamówione produkty
    </h2>
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
      <thead>
        <tr style="background-color: #f5f5f5;">
          <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Produkt</th>
          <th style="padding: 10px; border: 1px solid #ddd; text-align: center;">Rozmiar</th>
          <th style="padding: 10px; border: 1px solid #ddd; text-align: center;">Ilość</th>
          <th style="padding: 10px; border: 1px solid #ddd; text-align: right;">Cena jedn.</th>
          <th style="padding: 10px; border: 1px solid #ddd; text-align: right;">Razem</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>

    <!-- Totals -->
    <table style="width: 300px; margin-left: auto;">
      <tr>
        <td style="padding: 5px 0; color: #666;">Produkty:</td>
        <td style="padding: 5px 0; text-align: right;">${formatPrice(order.subtotal)}</td>
      </tr>
      <tr>
        <td style="padding: 5px 0; color: #666;">Dostawa:</td>
        <td style="padding: 5px 0; text-align: right;">${order.shippingCost === 0 ? 'Gratis' : formatPrice(order.shippingCost)}</td>
      </tr>
      <tr style="font-size: 18px; font-weight: bold;">
        <td style="padding: 10px 0; border-top: 2px solid #333;">SUMA:</td>
        <td style="padding: 10px 0; text-align: right; border-top: 2px solid #333; color: #2e7d32;">${formatPrice(order.totalAmount)}</td>
      </tr>
    </table>

    <!-- Footer -->
    <p style="color: #999; font-size: 12px; margin-top: 30px; text-align: center; border-top: 1px solid #eee; padding-top: 15px;">
      Ten email został wygenerowany automatycznie przez system Nova Style
    </p>
  </div>
</body>
</html>
  `;
}

/**
 * Generate a unique reference ID for email threading prevention
 */
function generateEmailRefId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Format current date for email subject (Polish format)
 */
function formatDateForSubject(): string {
  const now = new Date();
  const day = now.getDate().toString().padStart(2, '0');
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const year = now.getFullYear();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  return `${day}.${month}.${year} ${hours}:${minutes}`;
}

/**
 * Send order confirmation emails to customer and store owner(s)
 */
export async function sendOrderEmails(order: OrderEmailData): Promise<{ customer: boolean; owner: boolean }> {
  const storeOwnerEmailsRaw = Deno.env.get('STORE_OWNER_EMAIL') || 'novastylebutik@gmail.com';
  // Support multiple emails separated by comma
  const storeOwnerEmails = storeOwnerEmailsRaw.split(',').map(e => e.trim()).filter(e => e);

  const results = {
    customer: false,
    owner: false,
  };

  // Generate unique reference IDs to prevent email threading
  const customerRefId = generateEmailRefId();
  const ownerRefId = generateEmailRefId();
  const orderDate = formatDateForSubject();

  // Use full session ID for better uniqueness
  const orderRef = order.sessionId.substring(0, 8).toUpperCase();

  // Send customer confirmation email
  // Clean subject for customer - just order number, no timestamp clutter
  const customerResult = await sendEmail({
    to: order.customerEmail,
    subject: `Twoje zamówienie #${orderRef} - Nova Style`,
    html: generateCustomerEmailHtml(order),
    replyTo: storeOwnerEmails[0],
    headers: {
      'X-Entity-Ref-ID': customerRefId,
    },
  });
  results.customer = customerResult.success;

  // Send owner notification email to all owners
  // More details for owner including amount and timestamp
  const ownerResult = await sendEmail({
    to: storeOwnerEmails,
    subject: `Zamówienie #${orderRef} | ${formatPrice(order.totalAmount)} | ${orderDate}`,
    html: generateOwnerEmailHtml(order),
    replyTo: order.customerEmail,
    headers: {
      'X-Entity-Ref-ID': ownerRefId,
    },
  });
  results.owner = ownerResult.success;

  console.log('Email results:', results);
  return results;
}
