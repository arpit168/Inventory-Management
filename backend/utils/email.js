import nodemailer from 'nodemailer';

export const sendEmail = async ({ to, subject, html, text }) => {
  if (!to) {
    console.warn('sendEmail called without recipient email address.');
    return false;
  }

  const host = process.env.EMAIL_HOST || process.env.SMTP_HOST;
  const user = process.env.EMAIL_USER || process.env.SMTP_USER;
  const pass = process.env.EMAIL_PASS || process.env.SMTP_PASS;
  const port = Number(process.env.EMAIL_PORT || process.env.SMTP_PORT || 587);
const from = process.env.EMAIL_FROM || process.env.SMTP_FROM || process.env.FROM_EMAIL;
  if (host && user && pass && user !== 'your_email@gmail.com') {
    try {
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });

      const info = await transporter.sendMail({
        from,
        to,
        subject,
        text: text || subject,
        html,
      });
      console.log('✅ SMTP Email sent successfully: %s', info.messageId);
      return true;
    } catch (err) {
      console.error('❌ Failed to send SMTP email:', err.message);
    }
  }

  // Graceful dev logging if SMTP is unconfigured or placeholders used
  console.log('====================================================');
  console.log('📬 [EMAIL DISPATCH LOG] (Dev / Placeholder Mode)');
  console.log(`From: ${from}`);
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(`Preview: ${text || 'HTML Content generated'}`);
  console.log('====================================================');
  return true;
};

export const generateLedgerEmailTemplate = ({
  businessName = 'Our Shop',
  customerName,
  transactionType,
  amount,
  previousBalance,
  updatedBalance,
  date = new Date(),
  notes = '-',
}) => {
  const isCredit = transactionType === 'credit';
  const typeLabel = isCredit ? 'Credit Given (Due Added)' : 'Payment Received';
  const color = isCredit ? '#ef4444' : '#10b981'; // Red for credit due, Green for payment got
  const formattedDate = new Date(date).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f6f9; margin: 0; padding: 20px; color: #334155; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
        .header { background: #1e293b; color: #ffffff; padding: 25px 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; letter-spacing: -0.5px; }
        .content { padding: 30px; }
        .greeting { font-size: 16px; margin-bottom: 20px; }
        .badge { display: inline-block; padding: 6px 14px; border-radius: 20px; font-weight: bold; font-size: 14px; color: #fff; background-color: ${color}; margin-bottom: 20px; }
        .table-box { width: 100%; border-collapse: collapse; margin: 20px 0; background: #f8fafc; border-radius: 8px; overflow: hidden; }
        .table-box th, .table-box td { padding: 12px 16px; text-align: left; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
        .table-box th { background: #f1f5f9; color: #64748b; font-weight: 600; width: 40%; }
        .amount { font-size: 18px; font-weight: bold; color: ${color}; }
        .footer { background: #f8fafc; padding: 20px 30px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${businessName}</h1>
        </div>
        <div class="content">
          <p class="greeting">Dear <strong>${customerName}</strong>,</p>
          <p>A new transaction has been recorded in your ledger account.</p>
          <div><span class="badge">${typeLabel}</span></div>
          
          <table class="table-box">
            <tr>
              <th>Transaction Amount</th>
              <td class="amount">₹${Number(amount).toFixed(2)}</td>
            </tr>
            <tr>
              <th>Previous Balance</th>
              <td>₹${Number(previousBalance).toFixed(2)}</td>
            </tr>
            <tr>
              <th>Updated Net Balance</th>
              <td style="font-weight: bold; color: #0f172a;">₹${Number(updatedBalance).toFixed(2)}</td>
            </tr>
            <tr>
              <th>Date & Time</th>
              <td>${formattedDate}</td>
            </tr>
            <tr>
              <th>Notes / Description</th>
              <td>${notes}</td>
            </tr>
          </table>

          <p style="font-size: 14px; color: #64748b; margin-top: 25px;">
            If you have any queries regarding this transaction, please contact us directly. Thank you for your business!
          </p>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} ${businessName}. Sent automatically via Inventory & Khatabook System.
        </div>
      </div>
    </body>
    </html>
  `;
};

export const generateInvoiceEmailTemplate = ({
  businessName = 'Our Shop',
  customerName,
  invoiceNumber,
  grandTotal,
  dueDate,
  items = [],
  notes = '',
}) => {
  const formattedDueDate = new Date(dueDate).toLocaleDateString('en-IN', { dateStyle: 'medium' });

  const itemsRows = items
    .map(
      (item) => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${item.name}</td>
      <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: center;">${item.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: right;">₹${Number(item.unitPrice).toFixed(2)}</td>
      <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: bold;">₹${Number(item.total).toFixed(2)}</td>
    </tr>
  `
    )
    .join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f6f9; margin: 0; padding: 20px; color: #334155; }
        .container { max-width: 650px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
        .header { background: #3b82f6; color: #ffffff; padding: 30px; display: flex; justify-content: space-between; align-items: center; }
        .header h1 { margin: 0; font-size: 26px; }
        .content { padding: 30px; }
        .total-box { background: #eff6ff; border: 1px solid #bfdbfe; padding: 15px 20px; border-radius: 8px; margin: 20px 0; text-align: right; }
        .total-box span { font-size: 22px; font-weight: bold; color: #1d4ed8; }
        .items-table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px; }
        .items-table th { background: #f8fafc; padding: 12px 10px; text-align: left; border-bottom: 2px solid #cbd5e1; color: #475569; }
        .footer { background: #f8fafc; padding: 20px 30px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div>
            <h1>${businessName}</h1>
            <p style="margin: 5px 0 0 0; opacity: 0.9; font-size: 14px;">Invoice Statement</p>
          </div>
          <div style="text-align: right;">
            <strong style="font-size: 18px;">${invoiceNumber}</strong>
            <div style="font-size: 13px; opacity: 0.9;">Due: ${formattedDueDate}</div>
          </div>
        </div>
        <div class="content">
          <p>Dear <strong>${customerName}</strong>,</p>
          <p>Thank you for doing business with us. Below is a summary of your invoice ${invoiceNumber}.</p>
          
          <table class="items-table">
            <thead>
              <tr>
                <th>Item Description</th>
                <th style="text-align: center;">Qty</th>
                <th style="text-align: right;">Price</th>
                <th style="text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRows}
            </tbody>
          </table>

          <div class="total-box">
            Grand Total Due: <span>₹${Number(grandTotal).toFixed(2)}</span>
          </div>

          ${notes ? `<p style="font-size: 13px; color: #64748b; background: #f8fafc; padding: 12px; border-radius: 6px;"><strong>Notes:</strong> ${notes}</p>` : ''}

          <p style="font-size: 14px; color: #64748b; margin-top: 30px;">
            Please ensure timely settlement. If you have already paid, please ignore this notice.
          </p>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} ${businessName}. Automated Billing Service.
        </div>
      </div>
    </body>
    </html>
  `;
};
