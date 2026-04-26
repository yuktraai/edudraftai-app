// ── Seller constants (hardcoded — do not move to env vars) ───────────────────
const YUKTRA_AI = {
  name:    'Yuktra AI Solutions',
  gstin:   '21FTOPS3270J1ZA',
  address: 'Flat No-403, Sailashree Vihar, Rashmi Annex, Chandrasekharpur, Bhubaneswar, Khordha, Odisha – 751021',
  email:   'info@yuktraai.com',
  website: 'edudraftai.com',
}

// HSN/SAC code for "Information technology software development services"
const HSN_SAC = '998314'

// ── Amount computation ────────────────────────────────────────────────────────
export function computeInvoiceAmounts(totalPaise) {
  const total = totalPaise / 100
  const base  = Math.round((total / 1.18) * 100) / 100
  const gst   = Math.round((total - base) * 100) / 100
  const cgst  = Math.round((gst / 2) * 100) / 100
  const sgst  = cgst
  return { total, base, gst, cgst, sgst }
}

// ── Amount-in-words helper ────────────────────────────────────────────────────
const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen']
const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']

function numberToWords(n) {
  if (n === 0) return 'Zero'
  if (n < 20) return ones[n]
  if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '')
  if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + numberToWords(n % 100) : '')
  if (n < 100000) return numberToWords(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + numberToWords(n % 1000) : '')
  if (n < 10000000) return numberToWords(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + numberToWords(n % 100000) : '')
  return numberToWords(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + numberToWords(n % 10000000) : '')
}

function amountInWords(amount) {
  const rupees = Math.floor(amount)
  const paise  = Math.round((amount - rupees) * 100)
  let words = 'Rupees ' + numberToWords(rupees)
  if (paise > 0) words += ' and ' + numberToWords(paise) + ' Paise'
  words += ' Only'
  return words
}

// ── Main HTML generator ───────────────────────────────────────────────────────
export function generateInvoiceHTML({ invoiceNumber, date, buyer, credits, amountPaise, invoiceType }) {
  const { total, base, gst, cgst, sgst } = computeInvoiceAmounts(amountPaise)

  const perCreditRate = Math.round((base / credits) * 100) / 100

  const fmt = (n) => n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const invoiceLabel = invoiceType === 'personal_purchase' ? 'Personal Credit Purchase' : 'College Credit Pool Purchase'

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Tax Invoice ${invoiceNumber}</title>
</head>
<body style="margin:0;padding:0;background:#F4F7F6;font-family:Arial,Helvetica,sans-serif;color:#1A202C;">

<div style="max-width:700px;margin:0 auto;background:#ffffff;border:1px solid #E2E8F0;border-radius:8px;overflow:hidden;">

  <!-- ── Header ── -->
  <div style="background:#0D1F3C;padding:28px 32px;">
    <div style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.3px;">Yuktra AI Solutions</div>
    <div style="font-size:12px;color:#94a3b8;margin-top:4px;">GSTIN: ${YUKTRA_AI.gstin}</div>
    <div style="font-size:12px;color:#94a3b8;margin-top:2px;max-width:480px;line-height:1.5;">${YUKTRA_AI.address}</div>
    <div style="font-size:12px;color:#94a3b8;margin-top:2px;">${YUKTRA_AI.email} &nbsp;|&nbsp; ${YUKTRA_AI.website}</div>
  </div>

  <!-- ── TAX INVOICE title ── -->
  <div style="background:#00B4A6;padding:10px 32px;text-align:center;">
    <span style="font-size:15px;font-weight:700;color:#ffffff;letter-spacing:2px;text-transform:uppercase;">TAX INVOICE</span>
  </div>

  <!-- ── Invoice meta + Billed To ── -->
  <div style="display:table;width:100%;border-bottom:1px solid #E2E8F0;box-sizing:border-box;">
    <div style="display:table-row;">
      <!-- Left: invoice details -->
      <div style="display:table-cell;width:50%;padding:20px 24px 20px 32px;vertical-align:top;border-right:1px solid #E2E8F0;">
        <div style="font-size:11px;color:#718096;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">Invoice Details</div>
        <table style="border-collapse:collapse;width:100%;">
          <tr>
            <td style="font-size:12px;color:#718096;padding:2px 0;width:110px;">Invoice No.</td>
            <td style="font-size:12px;font-weight:700;color:#0D1F3C;padding:2px 0;">${invoiceNumber}</td>
          </tr>
          <tr>
            <td style="font-size:12px;color:#718096;padding:2px 0;">Date</td>
            <td style="font-size:12px;color:#1A202C;padding:2px 0;">${date}</td>
          </tr>
          <tr>
            <td style="font-size:12px;color:#718096;padding:2px 0;">Type</td>
            <td style="font-size:12px;color:#1A202C;padding:2px 0;">${invoiceLabel}</td>
          </tr>
          <tr>
            <td style="font-size:12px;color:#718096;padding:2px 0;">Supply Type</td>
            <td style="font-size:12px;color:#1A202C;padding:2px 0;">Intra-State (Odisha)</td>
          </tr>
        </table>
      </div>
      <!-- Right: billed to -->
      <div style="display:table-cell;width:50%;padding:20px 32px 20px 24px;vertical-align:top;">
        <div style="font-size:11px;color:#718096;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">Billed To</div>
        <div style="font-size:13px;font-weight:700;color:#0D1F3C;">${buyer.name}</div>
        <div style="font-size:12px;color:#718096;margin-top:2px;">${buyer.email}</div>
        ${buyer.college ? `<div style="font-size:12px;color:#718096;margin-top:2px;">${buyer.college}</div>` : ''}
      </div>
    </div>
  </div>

  <!-- ── Items table ── -->
  <div style="padding:24px 32px 0;">
    <table style="width:100%;border-collapse:collapse;font-size:12px;">
      <thead>
        <tr style="background:#F4F7F6;">
          <th style="padding:10px 8px;text-align:left;color:#718096;font-weight:600;border:1px solid #E2E8F0;">#</th>
          <th style="padding:10px 8px;text-align:left;color:#718096;font-weight:600;border:1px solid #E2E8F0;">Description</th>
          <th style="padding:10px 8px;text-align:center;color:#718096;font-weight:600;border:1px solid #E2E8F0;">HSN/SAC</th>
          <th style="padding:10px 8px;text-align:center;color:#718096;font-weight:600;border:1px solid #E2E8F0;">Qty</th>
          <th style="padding:10px 8px;text-align:right;color:#718096;font-weight:600;border:1px solid #E2E8F0;">Rate (₹)</th>
          <th style="padding:10px 8px;text-align:right;color:#718096;font-weight:600;border:1px solid #E2E8F0;">Amount (₹)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="padding:12px 8px;border:1px solid #E2E8F0;text-align:left;color:#1A202C;">1</td>
          <td style="padding:12px 8px;border:1px solid #E2E8F0;color:#1A202C;">
            EduDraftAI Credits &mdash; ${credits} credits<br/>
            <span style="font-size:11px;color:#718096;">AI-powered teaching content generation credits</span>
          </td>
          <td style="padding:12px 8px;border:1px solid #E2E8F0;text-align:center;color:#1A202C;">${HSN_SAC}</td>
          <td style="padding:12px 8px;border:1px solid #E2E8F0;text-align:center;color:#1A202C;">${credits}</td>
          <td style="padding:12px 8px;border:1px solid #E2E8F0;text-align:right;color:#1A202C;">${fmt(perCreditRate)}</td>
          <td style="padding:12px 8px;border:1px solid #E2E8F0;text-align:right;font-weight:600;color:#1A202C;">₹${fmt(base)}</td>
        </tr>
      </tbody>
      <tfoot>
        <tr>
          <td colspan="5" style="padding:8px 8px;border:1px solid #E2E8F0;text-align:right;color:#718096;">Subtotal (excl. GST)</td>
          <td style="padding:8px 8px;border:1px solid #E2E8F0;text-align:right;color:#1A202C;">₹${fmt(base)}</td>
        </tr>
        <tr>
          <td colspan="5" style="padding:8px 8px;border:1px solid #E2E8F0;text-align:right;color:#718096;">CGST @ 9%</td>
          <td style="padding:8px 8px;border:1px solid #E2E8F0;text-align:right;color:#1A202C;">₹${fmt(cgst)}</td>
        </tr>
        <tr>
          <td colspan="5" style="padding:8px 8px;border:1px solid #E2E8F0;text-align:right;color:#718096;">SGST @ 9%</td>
          <td style="padding:8px 8px;border:1px solid #E2E8F0;text-align:right;color:#1A202C;">₹${fmt(sgst)}</td>
        </tr>
        <tr>
          <td colspan="5" style="padding:8px 8px;border:1px solid #E2E8F0;text-align:right;color:#718096;">Total GST (18%)</td>
          <td style="padding:8px 8px;border:1px solid #E2E8F0;text-align:right;color:#1A202C;">₹${fmt(gst)}</td>
        </tr>
        <tr style="background:#0D1F3C;">
          <td colspan="5" style="padding:12px 8px;text-align:right;font-weight:700;color:#ffffff;font-size:13px;">Total Amount</td>
          <td style="padding:12px 8px;text-align:right;font-weight:800;color:#00B4A6;font-size:14px;">₹${fmt(total)}</td>
        </tr>
      </tfoot>
    </table>
  </div>

  <!-- ── Amount in words ── -->
  <div style="padding:16px 32px;background:#E6FFFA;border-left:4px solid #00B4A6;margin:20px 32px 0;border-radius:0 4px 4px 0;">
    <span style="font-size:12px;color:#718096;font-weight:600;">Amount in Words: </span>
    <span style="font-size:12px;color:#0D1F3C;font-style:italic;">${amountInWords(total)}</span>
  </div>

  <!-- ── Footer ── -->
  <div style="padding:20px 32px 24px;margin-top:20px;border-top:1px solid #E2E8F0;text-align:center;">
    <div style="font-size:11px;color:#718096;margin-bottom:4px;">This is a computer-generated invoice. No signature required.</div>
    <div style="font-size:11px;color:#a0aec0;">${YUKTRA_AI.email} &nbsp;&bull;&nbsp; ${YUKTRA_AI.website}</div>
  </div>

</div>
</body>
</html>`
}
