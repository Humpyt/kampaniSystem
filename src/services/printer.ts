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
    window.open(this.baseUrl + '/print/order/' + encodeURIComponent(orderId), '_blank');
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
