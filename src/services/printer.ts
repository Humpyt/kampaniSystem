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
    brand?: string;
    color?: string;
    variation?: string;
    service?: string;
    notes?: string;
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

const printPdfInPage = (pdfBuffer: ArrayBuffer, title: string) => {
  const pdfUrl = URL.createObjectURL(new Blob([pdfBuffer], { type: 'application/pdf' }));
  const frame = document.createElement('iframe');
  frame.style.position = 'fixed';
  frame.style.right = '0';
  frame.style.bottom = '0';
  frame.style.width = '0';
  frame.style.height = '0';
  frame.style.border = '0';
  frame.setAttribute('aria-hidden', 'true');
  frame.title = escapeHtml(title);

  const cleanup = () => {
    window.setTimeout(() => {
      URL.revokeObjectURL(pdfUrl);
      frame.remove();
    }, 5000);
  };

  frame.onload = () => {
    window.setTimeout(() => {
      try {
        frame.contentWindow?.focus();
        frame.contentWindow?.print();
      } catch (error) {
        console.warn('In-page receipt print failed, opening PDF fallback:', error);
        window.open(pdfUrl, '_blank', 'noopener,noreferrer');
      } finally {
        cleanup();
      }
    }, 500);
  };

  frame.src = pdfUrl;
  document.body.appendChild(frame);
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
    const brand = compact(item?.brand || item?.itemBrand || item?.productBrand || '');
    const color = compact(item?.color || '');
    const variation = compact(item?.variation || item?.size || item?.category || item?.type || '');
    const notes = compact(item?.description || item?.notes || '');
    const service = Array.isArray(item?.services)
      ? item.services
          .map((svc: any) => compact(svc?.name || ''))
          .filter(Boolean)
          .join(', ')
      : '';

    return {
      description: compact(item?.description || item?.category || 'Service Item'),
      brand,
      color,
      variation,
      service,
      notes,
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
    brand: compact(item?.brand || item?.productBrand || ''),
    color: compact(item?.color || ''),
    variation: compact(item?.variation || item?.size || ''),
    notes: compact(item?.description || item?.notes || ''),
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
    const response = await axios.post<ArrayBuffer>(this.baseUrl + '/print/payment-receipt', data, {
      responseType: 'arraybuffer',
    });
    printPdfInPage(response.data, `Receipt ${compact(data.ticketNumber || data.ticketId || '')}`);
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
