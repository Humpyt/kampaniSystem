import axios from 'axios';

interface PrinterConfig {
  type?: string;
  interface?: string;
  characterSet?: string;
  width?: number;
  options?: { timeout?: number; };
}

export interface ReceiptData {
  orderNumber: string;
  customerName: string;
  customerPhone?: string;
  items: Array<{ description: string; quantity: number; price: number; }>;
  subtotal: number;
  tax?: number;
  total: number;
  date: Date;
  promisedDate?: Date;
  notes?: string;
}

export interface PolicyPrintData {
  ticketNumber: string;
  date: string;
  customerNumber: string;
  customerName: string;
}

export interface PaymentBreakdown {
  method: string;
  amount: number;
}

export interface PaymentReceiptPayload {
  ticketId?: string;
  ticketNumber?: string | null;
  customerName?: string;
  customerPhone?: string;
  items: Array<{
    description?: string;
    price?: number;
    amount?: number;
    quantity?: number;
    services?: Array<{ name: string; price: number }>;
  }>;
  subtotal: number;
  discount?: number;
  total: number;
  amountPaid: number;
  balance?: number;
  paymentMethod?: string;
  date?: string;
}

const toTitleCase = (value: string) =>
  value
    .split(/[_\s]+/)
    .filter(Boolean)
    .map(segment => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');

const compact = (value: string | null | undefined) => String(value || '').replace(/\s+/g, ' ').trim();
const escapeHtml = (value: string | null | undefined) =>
  compact(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const openPrintWindow = () => {
  const printWindow = window.open('', '_blank', 'noopener,noreferrer,width=420,height=900');
  if (!printWindow) {
    throw new Error('Popup blocked. Allow popups for this site to print receipts directly.');
  }
  return printWindow;
};

const writePdfToPrintWindow = (printWindow: Window, pdfBuffer: ArrayBuffer, title: string) => {
  const pdfUrl = URL.createObjectURL(new Blob([pdfBuffer], { type: 'application/pdf' }));
  const safeTitle = escapeHtml(title);

  printWindow.document.open();
  printWindow.document.write(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${safeTitle}</title>
    <style>
      html, body, iframe {
        width: 100%;
        height: 100%;
        margin: 0;
        border: 0;
        background: #ffffff;
      }
      .fallback {
        position: fixed;
        left: 12px;
        bottom: 12px;
        z-index: 1;
        font-family: Arial, sans-serif;
        font-size: 12px;
      }
    </style>
  </head>
  <body>
    <iframe id="receiptPdf" src="${pdfUrl}" title="${safeTitle}"></iframe>
    <a class="fallback" href="${pdfUrl}" target="_blank" rel="noopener noreferrer">Open receipt PDF</a>
    <script>
      const receiptFrame = document.getElementById('receiptPdf');
      const printReceipt = () => {
        window.setTimeout(() => {
          try {
            receiptFrame.contentWindow.focus();
            receiptFrame.contentWindow.print();
          } catch (_) {
            window.print();
          }
        }, 500);
      };
      receiptFrame.addEventListener('load', printReceipt, { once: true });
      window.addEventListener('beforeunload', () => URL.revokeObjectURL('${pdfUrl}'));
    </script>
  </body>
</html>`);
  printWindow.document.close();
};

export function buildPaymentReceiptPayload(operation: any, payments: PaymentBreakdown[]): PaymentReceiptPayload {
  const uniqueMethods = Array.from(
    new Set(
      (payments || [])
        .map(payment => compact(payment?.method))
        .filter(Boolean)
        .map(toTitleCase)
    )
  );

  const repairItems = (operation?.shoes || operation?.items || []).map((item: any) => {
    const details = [
      compact(item?.description || item?.category || 'Service Item'),
      compact(item?.size ? `Sz ${item.size}` : ''),
      compact(item?.color || ''),
    ].filter(Boolean);

    return {
      description: details.join(' | ') || 'Service Item',
      services: Array.isArray(item?.services)
        ? item.services.map((service: any) => ({
            name: compact(service?.name || 'Service'),
            price: Number(service?.price) || 0,
          }))
        : [],
    };
  });

  const retailItems = (operation?.retailItems || []).map((item: any) => ({
    description: compact(`Product | ${item?.productName || item?.name || 'Retail Item'}`),
    quantity: Number(item?.quantity) || 1,
    price:
      Number(item?.totalPrice) ||
      (Number(item?.unitPrice || item?.price || 0) * Number(item?.quantity || 1)),
  }));

  const total = Number(operation?.totalAmount ?? operation?.total ?? 0) || 0;
  const discount = Number(operation?.discount ?? operation?.discountAmount ?? 0) || 0;
  const subtotal = Number(operation?.subtotal ?? operation?.originalTotal ?? (total + discount)) || total;
  const amountPaid = (payments || []).reduce((sum, payment) => sum + (Number(payment?.amount) || 0), 0);
  const balance =
    operation?.balance !== undefined && operation?.balance !== null
      ? Number(operation.balance) || 0
      : Math.max(0, total - (Number(operation?.paidAmount) || 0));

  return {
    ticketId: operation?.id,
    ticketNumber: operation?.ticketNumber || operation?.orderNumber || operation?.id,
    customerName: operation?.customer?.name || operation?.customerName || 'Walk-in Customer',
    customerPhone: operation?.customer?.phone || operation?.customerPhone || '',
    items: [...repairItems, ...retailItems],
    subtotal,
    discount,
    total,
    amountPaid,
    balance,
    paymentMethod: uniqueMethods.join(' + ') || 'Cash',
    date: new Date().toLocaleString('en-UG', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }),
  };
}

class PrinterService {
  private config: PrinterConfig;
  private baseUrl = '/api/printer';

  constructor(config: PrinterConfig = {}) {
    this.config = { width: 42, ...config };
  }

  async getConfig(): Promise<PrinterConfig> {
    try {
      const response = await axios.get(this.baseUrl + '/config');
      this.config = response.data;
      return this.config;
    } catch (error) {
      console.error('Failed to get printer config:', error);
      throw error;
    }
  }

  async updateConfig(config: Partial<PrinterConfig>): Promise<PrinterConfig> {
    try {
      const response = await axios.put(this.baseUrl + '/config', config);
      this.config = response.data;
      return this.config;
    } catch (error) {
      console.error('Failed to update printer config:', error);
      throw error;
    }
  }

  /** Open order receipt PDF in a new browser tab (GET — backend returns inline PDF) */
  async printOrder(orderId: string): Promise<void> {
    window.open(
      this.baseUrl + '/print/order/' + encodeURIComponent(orderId) + '?format=html&autoprint=1',
      '_blank',
      'noopener,noreferrer'
    );
  }

  async printQuotation(quotationId: string): Promise<void> {
    try {
      await axios.post(this.baseUrl + '/print/quotation/' + quotationId);
    } catch (error) {
      console.error('Failed to print quotation:', error);
      throw error;
    }
  }

  /** Opens receipt PDF — just forwards to printOrder */
  async printReceipt(data: ReceiptData): Promise<void> {
    if (!data.orderNumber) throw new Error('No order number provided');
    await this.printOrder(data.orderNumber);
  }

  async printPaymentReceipt(data: PaymentReceiptPayload): Promise<void> {
    const printWindow = openPrintWindow();
    const response = await axios.post<ArrayBuffer>(this.baseUrl + '/print/payment-receipt', data, {
      responseType: 'arraybuffer',
    });
    writePdfToPrintWindow(
      printWindow,
      response.data,
      `Receipt ${compact(data.ticketNumber || data.ticketId || '')}`
    );
  }

  /** Open policy slip PDF in a new browser tab (GET — backend returns inline PDF) */
  async printPolicy(data: PolicyPrintData): Promise<void> {
    const params = new URLSearchParams({
      ticketNumber: data.ticketNumber || '',
      date: data.date || '',
      customerNumber: data.customerNumber || '',
      customerName: data.customerName || '',
    });
    window.open(this.baseUrl + '/print/policy?' + params.toString(), '_blank');
  }
}

export const printerService = new PrinterService();
