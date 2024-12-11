import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { Card } from '../components/ui/card';
import { formatCurrency } from '../utils/formatCurrency';
import { DollarSign } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

interface Sale {
  id: string;
  customer_name: string | null;
  sale_type: 'repair' | 'retail' | 'pickup';
  total_amount: number;
  payment_method: string;
  created_at: string;
  details: Array<{
    category?: string;
    service_name?: string;
    name?: string;
    price: number;
    quantity?: number;
  }>;
}

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [totalSales, setTotalSales] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSales();
  }, [startDate, endDate, selectedType]);

  const fetchSales = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let url = 'http://localhost:3000/api/sales';
      const params = new URLSearchParams();
      
      if (startDate) {
        params.append('startDate', startDate.toISOString());
      }
      if (endDate) {
        params.append('endDate', endDate.toISOString());
      }
      if (selectedType !== 'all') {
        params.append('saleType', selectedType);
      }

      const queryString = params.toString();
      if (queryString) {
        url += '?' + queryString;
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch sales data');
      }

      const data = await response.json();
      if (!Array.isArray(data)) {
        throw new Error('Invalid sales data received');
      }

      setSales(data);
      
      // Calculate total sales
      const total = data.reduce((sum: number, sale: Sale) => sum + (sale.total_amount || 0), 0);
      setTotalSales(total);
    } catch (error) {
      console.error('Error fetching sales:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch sales');
    } finally {
      setLoading(false);
    }
  };

  const renderSaleDetails = (sale: Sale) => {
    if (!sale.details?.length) return null;

    switch (sale.sale_type) {
      case 'repair':
        return sale.details.map((item, index) => (
          <div key={index} className="text-sm">
            {item.category && <div>{item.category}</div>}
            {item.service_name && (
              <div className="ml-4 text-gray-600">
                - {item.service_name}: {formatCurrency(item.price)}
              </div>
            )}
          </div>
        ));
      
      case 'retail':
        return sale.details.map((item, index) => (
          <div key={index} className="text-sm">
            {item.name} x{item.quantity} @ {formatCurrency(item.price)}
          </div>
        ));
      
      default:
        return null;
    }
  };

  if (error) {
    return (
      <div className="p-6">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4">Sales Overview</h1>
        
        <div className="flex gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">Start Date</label>
            <DatePicker
              selected={startDate}
              onChange={setStartDate}
              className="border rounded p-2"
              placeholderText="Select start date"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">End Date</label>
            <DatePicker
              selected={endDate}
              onChange={setEndDate}
              className="border rounded p-2"
              placeholderText="Select end date"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Sale Type</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="border rounded p-2"
            >
              <option value="all">All Types</option>
              <option value="repair">Repairs</option>
              <option value="retail">Retail</option>
              <option value="pickup">Pickups</option>
            </select>
          </div>
        </div>

        <Card className="p-4 bg-white shadow-sm">
          <div className="text-lg font-semibold">Total Sales</div>
          <div className="text-3xl font-bold text-green-600">
            {formatCurrency(totalSales)}
          </div>
        </Card>
      </div>

      {loading ? (
        <div className="text-center py-4">Loading sales data...</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Details</TableHead>
              <TableHead>Payment Method</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sales.map((sale) => (
              <TableRow key={sale.id}>
                <TableCell>
                  {new Date(sale.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell>{sale.customer_name || 'Walk-in Customer'}</TableCell>
                <TableCell className="capitalize">{sale.sale_type}</TableCell>
                <TableCell>{renderSaleDetails(sale)}</TableCell>
                <TableCell className="capitalize">{sale.payment_method}</TableCell>
                <TableCell className="text-right">
                  {formatCurrency(sale.total_amount)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
