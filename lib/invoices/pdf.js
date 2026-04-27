import PDFDocument from 'pdfkit'

// Colours matching brand
const NAVY  = '#0D1F3C'
const TEAL  = '#00B4A6'
const MUTED = '#718096'
const TEXT  = '#1A202C'
const LIGHT = '#F4F7F6'
const BORDER = '#E2E8F0'

const YUKTRA_AI = {
  name:    'Yuktra AI Solutions',
  gstin:   '21FTOPS3270J1ZA',
  address: 'Flat No-403, Sailashree Vihar, Rashmi Annex,\nChandrasekharpur, Bhubaneswar, Khordha, Odisha - 751021',
  email:   'info@yuktraai.com',
  website: 'edudraftai.com',
}

const HSN_SAC = '998314'

const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen']
const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']

function numberToWords(n) {
  if (n === 0) return 'Zero'
  if (n < 20)  return ones[n]
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
  return words + ' Only'
}

function fmt(n) {
  return 'Rs.' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function computeAmounts(totalPaise) {
  const total = totalPaise / 100
  const base  = Math.round((total / 1.18) * 100) / 100
  const gst   = Math.round((total - base) * 100) / 100
  const cgst  = Math.round((gst / 2) * 100) / 100
  return { total, base, gst, cgst, sgst: cgst }
}

/**
 * Generate a GST invoice PDF as a Buffer.
 */
export function generateInvoicePDF({ invoiceNumber, date, buyer, credits, amountPaise, invoiceType }) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4', bufferPages: true })
    const buffers = []
    doc.on('data', chunk => buffers.push(chunk))
    doc.on('end',  ()    => resolve(Buffer.concat(buffers)))
    doc.on('error', reject)

    const { total, base, gst, cgst, sgst } = computeAmounts(amountPaise)
    const perCreditRate = Math.round((base / credits) * 100) / 100
    const invoiceLabel  = invoiceType === 'personal_purchase'
      ? 'Personal Credit Purchase'
      : 'College Credit Pool Purchase'

    const pageW = doc.page.width
    const margin = 50
    const contentW = pageW - margin * 2

    // ── Header background ─────────────────────────────────────────────────────
    doc.rect(0, 0, pageW, 90).fill(NAVY)

    doc.fillColor('#FFFFFF')
       .font('Helvetica-Bold').fontSize(20)
       .text('EduDraftAI', margin, 28)

    doc.fillColor(TEAL)
       .font('Helvetica-Bold').fontSize(11)
       .text('by Yuktra AI Solutions', margin, 52)

    // TAX INVOICE label top-right
    doc.fillColor('#FFFFFF')
       .font('Helvetica-Bold').fontSize(14)
       .text('TAX INVOICE', 0, 38, { align: 'right', width: pageW - margin })

    // ── Seller info strip ─────────────────────────────────────────────────────
    doc.rect(0, 90, pageW, 48).fill(LIGHT)

    doc.fillColor(MUTED).font('Helvetica').fontSize(8)
       .text(`GSTIN: ${YUKTRA_AI.gstin}   |   ${YUKTRA_AI.address.replace('\n', ', ')}   |   ${YUKTRA_AI.email}   |   ${YUKTRA_AI.website}`,
             margin, 104, { width: contentW })

    // ── Invoice meta + Billed To (two columns) ────────────────────────────────
    const metaTop = 158
    const colW    = contentW / 2 - 10

    // Left column — invoice details
    doc.fillColor(MUTED).font('Helvetica-Bold').fontSize(8)
       .text('INVOICE DETAILS', margin, metaTop)

    const metaRows = [
      ['Invoice No.', invoiceNumber],
      ['Date',        date],
      ['Type',        invoiceLabel],
      ['Supply Type', 'Intra-State (Odisha)'],
    ]
    let my = metaTop + 14
    for (const [label, value] of metaRows) {
      doc.fillColor(MUTED).font('Helvetica').fontSize(9).text(label, margin, my, { width: 80, continued: false })
      doc.fillColor(TEXT).font('Helvetica-Bold').fontSize(9).text(value, margin + 82, my)
      my += 14
    }

    // Right column — billed to
    const rx = margin + colW + 20
    doc.fillColor(MUTED).font('Helvetica-Bold').fontSize(8)
       .text('BILLED TO', rx, metaTop)

    doc.fillColor(TEXT).font('Helvetica-Bold').fontSize(11)
       .text(buyer.name || 'N/A', rx, metaTop + 14)
    doc.fillColor(MUTED).font('Helvetica').fontSize(9)
       .text(buyer.email || '', rx, metaTop + 28)
    if (buyer.college) {
      doc.fillColor(MUTED).font('Helvetica').fontSize(9)
         .text(buyer.college, rx, metaTop + 40)
    }

    // Separator
    const tableTop = metaTop + 90
    doc.moveTo(margin, tableTop - 8).lineTo(pageW - margin, tableTop - 8)
       .strokeColor(BORDER).lineWidth(1).stroke()

    // ── Items table header ────────────────────────────────────────────────────
    const cols = {
      no:   { x: margin,       w: 24  },
      desc: { x: margin + 24,  w: 200 },
      hsn:  { x: margin + 224, w: 70  },
      qty:  { x: margin + 294, w: 50  },
      rate: { x: margin + 344, w: 80  },
      amt:  { x: margin + 424, w: 70  },
    }

    doc.rect(margin, tableTop, contentW, 20).fill('#E8EDF4')

    const thY = tableTop + 6
    doc.fillColor(MUTED).font('Helvetica-Bold').fontSize(8)
    doc.text('#',           cols.no.x + 2,   thY)
    doc.text('Description', cols.desc.x + 2, thY)
    doc.text('HSN/SAC',     cols.hsn.x + 2,  thY)
    doc.text('Qty',         cols.qty.x + 2,  thY)
    doc.text('Rate',        cols.rate.x + 2, thY)
    doc.text('Amount',      cols.amt.x + 2,  thY)

    // Row
    const rowY = tableTop + 24
    doc.fillColor(TEXT).font('Helvetica').fontSize(9)
    doc.text('1', cols.no.x + 2, rowY)
    doc.text(`EduDraftAI Credits — ${credits} credits`, cols.desc.x + 2, rowY, { width: cols.desc.w - 4 })
    doc.fillColor(MUTED).font('Helvetica').fontSize(8)
       .text('AI-powered content generation credits', cols.desc.x + 2, rowY + 12, { width: cols.desc.w - 4 })
    doc.fillColor(TEXT).font('Helvetica').fontSize(9)
    doc.text(HSN_SAC,          cols.hsn.x + 2,  rowY)
    doc.text(String(credits),  cols.qty.x + 2,  rowY)
    doc.text(fmt(perCreditRate), cols.rate.x + 2, rowY)
    doc.font('Helvetica-Bold').text(fmt(base), cols.amt.x + 2, rowY)

    // ── Totals section ────────────────────────────────────────────────────────
    const totTop = rowY + 48
    doc.moveTo(margin, totTop).lineTo(pageW - margin, totTop)
       .strokeColor(BORDER).lineWidth(0.5).stroke()

    const totRows = [
      ['Subtotal (excl. GST)', fmt(base)],
      ['CGST @ 9%',            fmt(cgst)],
      ['SGST @ 9%',            fmt(sgst)],
      ['Total GST (18%)',      fmt(gst)],
    ]
    let ty = totTop + 8
    for (const [label, value] of totRows) {
      doc.fillColor(MUTED).font('Helvetica').fontSize(9)
         .text(label, margin, ty, { width: contentW - 80, align: 'right' })
      doc.fillColor(TEXT).font('Helvetica').fontSize(9)
         .text(value, pageW - margin - 75, ty, { width: 75, align: 'right' })
      ty += 16
    }

    // Total amount bar
    doc.rect(margin, ty, contentW, 26).fill(NAVY)
    doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(11)
       .text('Total Amount', margin, ty + 8, { width: contentW - 80, align: 'right' })
    doc.fillColor(TEAL).font('Helvetica-Bold').fontSize(13)
       .text(fmt(total), pageW - margin - 75, ty + 7, { width: 75, align: 'right' })

    // Amount in words
    const wordsY = ty + 36
    doc.rect(margin, wordsY, contentW, 22).fillAndStroke(LIGHT, BORDER)
    doc.fillColor(MUTED).font('Helvetica-Bold').fontSize(8)
       .text('Amount in Words: ', margin + 8, wordsY + 7, { continued: true })
    doc.fillColor(TEXT).font('Helvetica-Oblique').fontSize(8)
       .text(amountInWords(total))

    // ── Footer ────────────────────────────────────────────────────────────────
    const footerY = wordsY + 40
    doc.moveTo(margin, footerY).lineTo(pageW - margin, footerY)
       .strokeColor(BORDER).lineWidth(0.5).stroke()

    doc.fillColor(MUTED).font('Helvetica').fontSize(8)
       .text(
         'This is a computer-generated invoice. No signature required.',
         margin, footerY + 10, { align: 'center', width: contentW }
       )
    doc.fillColor(MUTED).font('Helvetica').fontSize(8)
       .text(
         `${YUKTRA_AI.email}  |  ${YUKTRA_AI.website}`,
         margin, footerY + 22, { align: 'center', width: contentW }
       )

    doc.end()
  })
}
