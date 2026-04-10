import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { Invoice } from '../entities/invoice.entity';
import { Rental } from '../entities/rental.entity';

function escapePdfText(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function buildPdf(lines: string[]) {
  const contentLines = [
    'BT',
    '/F1 12 Tf',
    '50 780 Td',
    '16 TL',
    ...lines.flatMap((line, index) => [
      index === 0 ? `(${escapePdfText(line)}) Tj` : `T* (${escapePdfText(line)}) Tj`,
    ]),
    'ET',
  ];

  const content = `${contentLines.join('\n')}\n`;
  const objects = [
    '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj',
    '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj',
    '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj',
    '4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj',
    `5 0 obj << /Length ${Buffer.byteLength(content, 'utf8')} >> stream\n${content}endstream\nendobj`,
  ];

  let pdf = '%PDF-1.4\n';
  const offsets = [0];

  for (const object of objects) {
    offsets.push(Buffer.byteLength(pdf, 'utf8'));
    pdf += `${object}\n`;
  }

  const xrefOffset = Buffer.byteLength(pdf, 'utf8');
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';

  for (let index = 1; index < offsets.length; index += 1) {
    pdf += `${String(offsets[index]).padStart(10, '0')} 00000 n \n`;
  }

  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\n`;
  pdf += `startxref\n${xrefOffset}\n%%EOF`;

  return Buffer.from(pdf, 'utf8');
}

@Injectable()
export class PdfGeneratorService {
  async generateInvoicePdf(invoice: Invoice, rental: Rental): Promise<string> {
    const pdfDir = path.join(process.cwd(), 'public', 'pdfs');
    if (!fs.existsSync(pdfDir)) {
      fs.mkdirSync(pdfDir, { recursive: true });
    }

    const filePath = path.join(pdfDir, `${invoice.invoiceNumber}.pdf`);
    const lines = [
      `Documento: ${invoice.documentType} ${invoice.invoiceNumber}`,
      `Cliente: ${rental.customer.fullName}`,
      `Documento: ${rental.customer.documentId}`,
      `Telefono: ${rental.customer.phone}`,
      `Fecha salida: ${new Date(rental.rentDate).toLocaleDateString('es-CO')}`,
      `Fecha devolucion estimada: ${new Date(rental.estimatedReturnDate).toLocaleDateString('es-CO')}`,
      ...rental.items.map(
        (item) =>
          `${item.equipment.name} x${item.quantity} - $${Number(item.lineTotal).toLocaleString('es-CO')}`,
      ),
      `Subtotal: $${Number(rental.subtotal).toLocaleString('es-CO')}`,
      `Total: $${Number(invoice.totalAmount).toLocaleString('es-CO')}`,
      'La devolucion debe realizarse usando este numero de factura.',
    ];

    fs.writeFileSync(filePath, buildPdf(lines));

    return `/pdfs/${invoice.invoiceNumber}.pdf`;
  }
}
