import dotenv from 'dotenv';
dotenv.config();

import nodemailer, { Transporter } from 'nodemailer';

// ─── Email Transporter ──────────────────────────────────────────────────────
let transporter: Transporter | null = null;

function createTransporter(): Transporter {
  const user = (process.env.SMTP_USER || '').trim();
  const pass = (process.env.SMTP_PASS || '').replace(/\s+/g, '');
  const host = (process.env.SMTP_HOST || '').trim();
  const port = Number(process.env.SMTP_PORT || 587);

  // 1. Gmail SMTP (Optimized)
  if (host.includes('gmail') || user.endsWith('@gmail.com')) {
    console.log(`[NotificationService] Configuring Gmail SMTP for ${user}`);
    return nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass },
    });
  }

  // 2. Custom SMTP Host
  if (host && user) {
    console.log(`[NotificationService] Configuring custom SMTP host: ${host}:${port}`);
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  }

  // 3. Fallback mock / ethereal (handled asynchronously if needed)
  console.log('[NotificationService] No SMTP configured, fallback to JSON transport');
  return nodemailer.createTransport({
    jsonTransport: true,
  });
}

function getTransporter(): Transporter {
  if (!transporter) {
    transporter = createTransporter();
  }
  return transporter;
}

// ─── HTML Email Template ────────────────────────────────────────────────────
function buildInvoiceEmailHtml(sale: any): string {
  const date = new Date(sale.createdAt || Date.now()).toLocaleString('en-LK', {
    dateStyle: 'full',
    timeStyle: 'short',
  });

  const itemsHtml = (sale.items || [])
    .map(
      (item: any) => `
      <tr>
        <td style="padding:12px 14px;border-bottom:1px solid #f0fdf4;font-size:13px;color:#1e293b;font-weight:600;">${item.productName}</td>
        <td style="padding:12px 14px;border-bottom:1px solid #f0fdf4;font-size:13px;color:#64748b;text-align:center;">${item.quantity}</td>
        <td style="padding:12px 14px;border-bottom:1px solid #f0fdf4;font-size:13px;color:#64748b;text-align:right;">Rs. ${Number(item.unitPrice).toFixed(2)}</td>
        <td style="padding:12px 14px;border-bottom:1px solid #f0fdf4;font-size:13px;font-weight:700;color:#059669;text-align:right;">Rs. ${Number(item.lineTotal).toFixed(2)}</td>
      </tr>`
    )
    .join('');

  const loyaltyPoints = Math.floor(Number(sale.total) / 50);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Your Mathara Stores Invoice — ${sale.invoiceNumber}</title>
</head>
<body style="margin:0;padding:0;background:#f0fdf4;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:580px;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 25px 65px rgba(16,185,129,0.18);border:1px solid #d1fae5;">

        <!-- Header Banner -->
        <tr>
          <td style="background:linear-gradient(135deg,#059669 0%,#0d9488 50%,#0891b2 100%);padding:40px 32px;text-align:center;">
            <div style="font-size:32px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;text-shadow:0 2px 10px rgba(0,0,0,0.15);">
              🛒 මාතර ස්ටෝරස්
            </div>
            <div style="font-size:14px;font-weight:600;color:#a7f3d0;margin-top:4px;letter-spacing:2px;text-transform:uppercase;">
              Mathara Stores — Official Invoice & Receipt
            </div>
            <div style="margin-top:20px;display:inline-block;background:rgba(255,255,255,0.18);border-radius:14px;padding:10px 24px;border:1px solid rgba(255,255,255,0.35);backdrop-filter:blur(10px);">
              <div style="font-size:10px;font-weight:700;color:#d1fae5;text-transform:uppercase;letter-spacing:1.5px;">Invoice Number</div>
              <div style="font-size:22px;font-weight:900;color:#ffffff;letter-spacing:1.5px;">${sale.invoiceNumber}</div>
            </div>
          </td>
        </tr>

        <!-- Thank You Greeting -->
        <tr>
          <td style="padding:30px 32px 16px;text-align:center;">
            <div style="font-size:24px;font-weight:800;color:#059669;margin-bottom:6px;">Thank You for Shopping With Us! 🎉</div>
            <div style="font-size:13px;color:#64748b;line-height:1.5;">We truly appreciate your visit to Mathara Stores. Here is your digital tax invoice and itemized purchase breakdown.</div>
          </td>
        </tr>

        <!-- Invoice Meta Details -->
        <tr>
          <td style="padding:0 32px 20px;">
            <table width="100%" style="background:#f8fafc;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
              <tr>
                <td style="padding:14px 16px;border-right:1px solid #e2e8f0;width:50%;">
                  <div style="font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;margin-bottom:3px;font-weight:700;">Date & Time</div>
                  <div style="font-size:13px;font-weight:700;color:#1e293b;">${date}</div>
                </td>
                <td style="padding:14px 16px;width:50%;">
                  <div style="font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;margin-bottom:3px;font-weight:700;">Cashier / Terminal</div>
                  <div style="font-size:13px;font-weight:700;color:#1e293b;">${sale.cashierName || 'Cashier Terminal #01'}</div>
                </td>
              </tr>
              <tr>
                <td style="padding:14px 16px;border-top:1px solid #e2e8f0;border-right:1px solid #e2e8f0;">
                  <div style="font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;margin-bottom:3px;font-weight:700;">Customer Name</div>
                  <div style="font-size:13px;font-weight:700;color:#1e293b;">${sale.customerName || 'Walk-in Customer'}</div>
                </td>
                <td style="padding:14px 16px;border-top:1px solid #e2e8f0;">
                  <div style="font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;margin-bottom:3px;font-weight:700;">Payment Method</div>
                  <div style="font-size:13px;font-weight:700;color:#059669;">${sale.paymentMethod || 'CASH'}</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Items Table -->
        <tr>
          <td style="padding:0 32px 20px;">
            <div style="font-size:12px;font-weight:800;color:#059669;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;">📦 Itemized Bill</div>
            <table width="100%" style="border-collapse:collapse;border-radius:14px;overflow:hidden;border:1px solid #dcfce7;">
              <thead>
                <tr style="background:linear-gradient(90deg,#dcfce7,#ccfbf1);">
                  <th style="padding:12px 14px;font-size:11px;font-weight:800;color:#065f46;text-align:left;text-transform:uppercase;letter-spacing:0.5px;">Product</th>
                  <th style="padding:12px 14px;font-size:11px;font-weight:800;color:#065f46;text-align:center;text-transform:uppercase;letter-spacing:0.5px;">Qty</th>
                  <th style="padding:12px 14px;font-size:11px;font-weight:800;color:#065f46;text-align:right;text-transform:uppercase;letter-spacing:0.5px;">Price</th>
                  <th style="padding:12px 14px;font-size:11px;font-weight:800;color:#065f46;text-align:right;text-transform:uppercase;letter-spacing:0.5px;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>
          </td>
        </tr>

        <!-- Totals Breakdown -->
        <tr>
          <td style="padding:0 32px 20px;">
            <table width="100%" style="background:#f8fafc;border-radius:16px;border:1px solid #e2e8f0;overflow:hidden;">
              <tr>
                <td style="padding:12px 18px;font-size:13px;color:#64748b;font-weight:600;">Subtotal</td>
                <td style="padding:12px 18px;font-size:13px;color:#1e293b;font-weight:700;text-align:right;">Rs. ${Number(sale.subtotal || 0).toFixed(2)}</td>
              </tr>
              ${Number(sale.discount) > 0 ? `<tr><td style="padding:10px 18px;font-size:13px;color:#ef4444;font-weight:600;">Discount</td><td style="padding:10px 18px;font-size:13px;color:#ef4444;font-weight:700;text-align:right;">- Rs. ${Number(sale.discount).toFixed(2)}</td></tr>` : ''}
              ${Number(sale.tax) > 0 ? `<tr><td style="padding:10px 18px;font-size:13px;color:#64748b;font-weight:600;">Tax / VAT</td><td style="padding:10px 18px;font-size:13px;color:#1e293b;font-weight:700;text-align:right;">+ Rs. ${Number(sale.tax).toFixed(2)}</td></tr>` : ''}
              <tr style="background:linear-gradient(90deg,#dcfce7,#ccfbf1);">
                <td style="padding:16px 18px;font-size:16px;font-weight:900;color:#065f46;">TOTAL PAID</td>
                <td style="padding:16px 18px;font-size:22px;font-weight:900;color:#059669;text-align:right;">Rs. ${Number(sale.total).toFixed(2)}</td>
              </tr>
              ${Number(sale.paymentAmount) ? `<tr><td style="padding:10px 18px;font-size:13px;color:#64748b;">Amount Tendered</td><td style="padding:10px 18px;font-size:13px;color:#1e293b;font-weight:600;text-align:right;">Rs. ${Number(sale.paymentAmount).toFixed(2)}</td></tr>` : ''}
              ${Number(sale.change) > 0 ? `<tr><td style="padding:10px 18px;font-size:13px;color:#64748b;">Change Returned</td><td style="padding:10px 18px;font-size:13px;color:#64748b;font-weight:600;text-align:right;">Rs. ${Number(sale.change).toFixed(2)}</td></tr>` : ''}
            </table>
          </td>
        </tr>

        <!-- Loyalty Points Badge -->
        ${loyaltyPoints > 0 ? `
        <tr>
          <td style="padding:0 32px 20px;">
            <table width="100%" style="background:linear-gradient(135deg,#fef3c7,#fde68a);border-radius:16px;padding:16px;border:1px solid #f59e0b;">
              <tr>
                <td width="40" align="center" style="font-size:26px;">⭐</td>
                <td>
                  <div style="font-size:14px;font-weight:800;color:#92400e;">SuperPoints Loyalty Reward</div>
                  <div style="font-size:12px;color:#a16207;margin-top:2px;">You earned <strong>+${loyaltyPoints} SuperPoints</strong> on this purchase! Redeem points on your next visit.</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>` : ''}

        <!-- Store Footer Details -->
        <tr>
          <td style="background:linear-gradient(135deg,#065f46,#0f766e);padding:32px;text-align:center;">
            <div style="font-size:18px;font-weight:800;color:#ffffff;margin-bottom:6px;">මාතර ස්ටෝරස් — Mathara Stores</div>
            <div style="font-size:13px;color:#a7f3d0;margin-bottom:4px;font-weight:500;">14 පොදු වෙලද සංකීර්ණය, දුම් රියපොල මාර්ගය, වාද්දුව</div>
            <div style="font-size:13px;color:#6ee7b7;font-weight:700;">Tel: 071 073 7822</div>
            <div style="margin-top:20px;font-size:11px;color:#34d399;opacity:0.8;">Thank you for your valuable patronage! This is a computer-generated tax invoice.</div>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ─── Send Invoice Email ──────────────────────────────────────────────────────
export async function sendInvoiceEmail(toEmail: string, sale: any): Promise<{ success: boolean; previewUrl?: string; error?: string }> {
  try {
    const t = getTransporter();
    const fromAddress = process.env.SMTP_USER || 'nadunsankalpadesilva27@gmail.com';

    const info = await t.sendMail({
      from: `"මාතර ස්ටෝරස් (Mathara Stores)" <${fromAddress}>`,
      to: toEmail.trim(),
      subject: `🧾 Official Receipt — ${sale.invoiceNumber} (Rs. ${Number(sale.total).toFixed(2)})`,
      html: buildInvoiceEmailHtml(sale),
    });

    console.log(`[NotificationService] Email sent successfully to ${toEmail}. MessageId:`, info.messageId);
    return { success: true };
  } catch (err: any) {
    console.error('[NotificationService] Email error:', err.message);
    return { success: false, error: err.message };
  }
}

// ─── Send Invoice SMS ────────────────────────────────────────────────────────
// Normalizes Sri Lankan and international phone numbers
function normalizePhoneNumber(rawPhone: string): { local: string; international: string } {
  let cleaned = rawPhone.replace(/[\s\-()]/g, '');
  
  // If starts with 0 (e.g. 0710737822), convert to 94710737822 for Sri Lanka
  let international = cleaned;
  if (cleaned.startsWith('0') && cleaned.length === 10) {
    international = '94' + cleaned.substring(1);
  } else if (cleaned.startsWith('+')) {
    international = cleaned.substring(1);
  }

  let local = cleaned;
  if (international.startsWith('94') && international.length === 11) {
    local = '0' + international.substring(2);
  }

  return { local, international };
}

// ─── Bilingual Greeting SMS Templates (Sinhala & English) ─────────────────────
function buildInvoiceSmsText(_sale?: any): string {
  return [
    `*මාතර ස්ටෝර්ස් (MATHARA STORES)*`,
    ``,
    `අප සමඟ සාප්පු සවාරි කළ ඔබට බොහොමත්ම ස්තූතියි!`,
    `Thank you for shopping with us!`,
    ``,
    `ඔබට සේවය කිරීමට ලැබීම අපට මහත් සතුටකි. නැවතත් පැමිණෙන්න!`,
    `We truly appreciate your visit and look forward to serving you again!`,
    ``,
    `*HOTLINE:* 071 073 7822`,
    `*ADDRESS:* 14 පොදු වෙළඳ සංකීර්ණය, දුම්රියපොළ මාර්ගය, වාද්දුව`,
    `(14 Podu Velada Samkeernaya, Railway Station Rd, Wadduwa)`,
  ].join('\n');
}

function buildCompactInvoiceSmsText(_sale?: any): string {
  return [
    `*MATHARA STORES*`,
    `Thank you for shopping with us!`,
    `අප සමඟ සාප්පු සවාරි කළ ඔබට ස්තූතියි!`,
    `Hotline: 071 073 7822`,
    `14 Podu Velada Samkeernaya, Wadduwa`,
    `Please visit us again!`,
  ].join('\n');
}

export async function sendInvoiceSMS(toPhone: string, sale: any): Promise<{ success: boolean; provider?: string; error?: string }> {
  try {
    dotenv.config();
    const { local, international } = normalizePhoneNumber(toPhone);

    // Build the primary beautiful detailed SMS message
    let message = buildInvoiceSmsText(sale);

    const provider = (process.env.SMS_PROVIDER || 'mock').toLowerCase();

    // 1. NotifyLK (Sri Lanka SMS Gateway)
    if (provider === 'notify_lk' || process.env.NOTIFYLK_API_KEY) {
      const userId = (process.env.NOTIFYLK_USER_ID || '').trim();
      const apiKey = (process.env.NOTIFYLK_API_KEY || '').trim();
      let preferredSenderId = (process.env.NOTIFYLK_SENDER_ID || 'NotifyDEMO').trim();

      // TRCSL & NotifyLK rules: Sender ID must be standard ASCII alphanumeric, max 11 chars
      // If non-ASCII (e.g. Sinhala) or > 11 chars, automatically use official 'NotifyDEMO'
      if (!preferredSenderId || /[^\x20-\x7E]/.test(preferredSenderId) || preferredSenderId.length > 11) {
        console.log(`[NotificationService] Sender ID "${preferredSenderId}" is invalid for TRCSL rules, defaulting to "NotifyDEMO"`);
        preferredSenderId = 'NotifyDEMO';
      }

      if (userId && apiKey) {
        console.log(`[NotificationService] Sending SMS via NotifyLK to ${international} using sender: ${preferredSenderId}...`);

        const sendViaNotifyLK = async (sid: string) => {
          const params = new URLSearchParams({
            user_id: userId,
            api_key: apiKey,
            sender_id: sid,
            to: international,
            message: message,
          });

          const res = await fetch('https://app.notify.lk/api/v1/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params.toString(),
          });
          return await res.json();
        };

        let resData: any = await sendViaNotifyLK(preferredSenderId);
        console.log('[NotificationService] NotifyLK response:', resData);

        // Auto-retry with NotifyDEMO if custom sender ID is unapproved/unregistered
        if (resData?.status !== 'success' && preferredSenderId !== 'NotifyDEMO') {
          console.log('[NotificationService] Retrying NotifyLK with approved default sender ID "NotifyDEMO"...');
          resData = await sendViaNotifyLK('NotifyDEMO');
          console.log('[NotificationService] NotifyDEMO fallback response:', resData);
        }

        // If NotifyLK reports insufficient balance for a multi-part message, auto-retry with compact template
        if (
          resData?.status !== 'success' &&
          ((typeof resData?.errors === 'string' && resData.errors.toLowerCase().includes('balance')) ||
            (Array.isArray(resData?.errors) && resData.errors.some((e: any) => String(e).toLowerCase().includes('balance'))))
        ) {
          console.log('[NotificationService] Account balance limited, auto-retrying with compact SMS template...');
          const compactMsg = buildCompactInvoiceSmsText(sale);
          const compactParams = new URLSearchParams({
            user_id: userId,
            api_key: apiKey,
            sender_id: 'NotifyDEMO',
            to: international,
            message: compactMsg,
          });
          const compactRes = await fetch('https://app.notify.lk/api/v1/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: compactParams.toString(),
          });
          resData = await compactRes.json();
          console.log('[NotificationService] Compact NotifyLK response:', resData);
        }

        if (resData?.status === 'success') {
          console.log(`[NotificationService] SMS successfully delivered via NotifyLK to ${international}!`);
          return { success: true, provider: 'NotifyLK' };
        } else {
          const errorDetail = resData?.errors ? (Array.isArray(resData.errors) ? resData.errors.join(', ') : JSON.stringify(resData.errors)) : (resData?.message || 'NotifyLK sending failed');
          console.error('[NotificationService] NotifyLK dispatch failed:', errorDetail);
          return { success: false, provider: 'NotifyLK', error: errorDetail };
        }
      }
    }

    // 2. Twilio SMS Gateway
    if (provider === 'twilio' || (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN)) {
      const sid = process.env.TWILIO_ACCOUNT_SID;
      const token = process.env.TWILIO_AUTH_TOKEN;
      const from = process.env.TWILIO_PHONE_NUMBER;

      if (sid && token && from) {
        console.log(`[NotificationService] Sending SMS via Twilio to +${international}...`);
        const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;
        const body = new URLSearchParams({
          From: from,
          To: `+${international}`,
          Body: message,
        });

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            Authorization: 'Basic ' + Buffer.from(`${sid}:${token}`).toString('base64'),
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: body.toString(),
        });
        const resData: any = await res.json();
        if (res.ok) {
          console.log('[NotificationService] Twilio SMS sent:', resData.sid);
          return { success: true, provider: 'Twilio' };
        } else {
          console.error('[NotificationService] Twilio error:', resData);
          return { success: false, provider: 'Twilio', error: resData.message };
        }
      }
    }

    // 3. Generic Custom HTTP SMS API Gateway
    if (process.env.SMS_GATEWAY_URL) {
      let url = process.env.SMS_GATEWAY_URL
        .replace('{{to}}', encodeURIComponent(international))
        .replace('{{message}}', encodeURIComponent(message));
      
      console.log(`[NotificationService] Sending SMS via Custom HTTP Gateway to ${international}...`);
      const res = await fetch(url);
      console.log(`[NotificationService] Custom SMS Gateway HTTP status:`, res.status);
      return { success: res.ok, provider: 'Custom HTTP Gateway' };
    }

    // 4. Default / Dev / Mock SMS (Clean, fully formatted log and simulation)
    console.log(`\n======================================================`);
    console.log(`📱 [SMS DISPATCH SIMULATOR - MATHARA STORES]`);
    console.log(`To Local:         ${local}`);
    console.log(`To International: +${international}`);
    console.log(`Timestamp:        ${new Date().toISOString()}`);
    console.log(`------------------------------------------------------`);
    console.log(message);
    console.log(`======================================================\n`);

    return { success: true, provider: 'Mock/Local Gateway' };
  } catch (err: any) {
    console.error('[NotificationService] SMS dispatch error:', err.message);
    return { success: false, error: err.message };
  }
}
