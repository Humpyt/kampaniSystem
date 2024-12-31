import React, { useState, useEffect } from 'react';
import { QrCode, Plus, Search, Tag, Package, Download, Trash2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import axios from 'axios';
import toast from 'react-hot-toast';

interface QRCodeItem {
  id: string;
  type: 'drop' | 'sales';
  label: string;
  data: string;
  createdAt: string;
}

export default function QRCodesPage() {
  const [qrCodes, setQrCodes] = useState<QRCodeItem[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedType, setSelectedType] = useState<'drop' | 'sales'>('drop');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    customerName: '',
    serviceType: '',
    dueDate: '',
    notes: '',
    itemName: '',
    category: '',
    price: '',
    sku: ''
  });

  // Fetch existing QR codes
  useEffect(() => {
    const fetchQRCodes = async () => {
      try {
        const response = await axios.get('http://localhost:3000/api/qrcodes');
        setQrCodes(response.data);
      } catch (error) {
        console.error('Error fetching QR codes:', error);
        toast.error('Failed to load QR codes');
      }
    };
    fetchQRCodes();
  }, []);

  const handleGenerateQR = async (type: 'drop' | 'sales') => {
    setSelectedType(type);
    setFormData({
      customerName: '',
      serviceType: '',
      dueDate: '',
      notes: '',
      itemName: '',
      category: '',
      price: '',
      sku: ''
    });
    setShowModal(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveQR = async () => {
    // Validate form data
    if (selectedType === 'drop') {
      if (!formData.customerName || !formData.serviceType || !formData.dueDate) {
        toast.error('Please fill in all required fields');
        return;
      }
    } else {
      if (!formData.itemName || !formData.category || !formData.price) {
        toast.error('Please fill in all required fields');
        return;
      }
    }

    setLoading(true);
    try {
      const data = selectedType === 'drop' 
        ? {
            customerName: formData.customerName,
            serviceType: formData.serviceType,
            dueDate: formData.dueDate,
            notes: formData.notes
          }
        : {
            itemName: formData.itemName,
            category: formData.category,
            price: formData.price,
            sku: formData.sku
          };

      const response = await axios.post('http://localhost:3000/api/qrcodes', {
        type: selectedType,
        data: JSON.stringify(data),
        label: selectedType === 'drop' 
          ? `Drop Ticket - ${formData.customerName} - ${formData.serviceType}`
          : `Sales Item - ${formData.itemName}`
      });

      setQrCodes([response.data, ...qrCodes]);
      toast.success('QR code generated successfully');
      setShowModal(false);
    } catch (error) {
      console.error('Error generating QR code:', error);
      toast.error('Failed to generate QR code');
    }
    setLoading(false);
  };

  const handleDeleteQR = async (id: string) => {
    try {
      await axios.delete(`http://localhost:3000/api/qrcodes/${id}`);
      setQrCodes(qrCodes.filter(code => code.id !== id));
      toast.success('QR code deleted successfully');
    } catch (error) {
      console.error('Error deleting QR code:', error);
      toast.error('Failed to delete QR code');
    }
  };

  const handleDownloadQR = (qrCode: QRCodeItem) => {
    const svg = document.getElementById(`qr-${qrCode.id}`) as HTMLElement;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `${qrCode.label}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  const filteredQRCodes = qrCodes.filter(code => 
    code.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">QR Code Management</h1>
          <p className="text-gray-400">Generate and manage QR codes for drop tickets and sales items</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => handleGenerateQR('drop')}
            className="btn-bevel accent-primary px-6 py-3 rounded-lg flex items-center"
          >
            <Package className="h-5 w-5 mr-2" />
            Drop Ticket QR
          </button>
          <button 
            onClick={() => handleGenerateQR('sales')}
            className="btn-bevel accent-secondary px-6 py-3 rounded-lg flex items-center"
          >
            <Tag className="h-5 w-5 mr-2" />
            Sales Item QR
          </button>
        </div>
      </div>

      <div className="card-bevel p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-indigo-400">Generated QR Codes</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search QR codes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-gray-800 text-white pl-10 pr-4 py-2 rounded-lg border border-gray-700 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredQRCodes.map((qrCode) => (
            <div 
              key={qrCode.id}
              className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-indigo-500 transition-all"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-white font-medium">{qrCode.label}</h3>
                  <p className="text-gray-400 text-sm">
                    {new Date(qrCode.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDownloadQR(qrCode)}
                    className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <Download className="h-5 w-5 text-indigo-400" />
                  </button>
                  <button
                    onClick={() => handleDeleteQR(qrCode.id)}
                    className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-5 w-5 text-red-400" />
                  </button>
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg flex justify-center">
                <QRCodeSVG
                  id={`qr-${qrCode.id}`}
                  value={qrCode.data}
                  size={150}
                  level="H"
                  includeMargin
                />
              </div>
            </div>
          ))}
        </div>

        {filteredQRCodes.length === 0 && (
          <div className="text-center py-8">
            <QrCode className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No QR codes found</p>
          </div>
        )}
      </div>

      {/* QR Code Generation Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-white mb-4">
              Generate {selectedType === 'drop' ? 'Drop Ticket' : 'Sales Item'} QR Code
            </h2>
            
            {selectedType === 'drop' ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-400 text-sm font-medium mb-2">
                    Customer Name
                  </label>
                  <input
                    type="text"
                    name="customerName"
                    value={formData.customerName}
                    onChange={handleInputChange}
                    className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:outline-none focus:border-indigo-500"
                    placeholder="Enter customer name"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-sm font-medium mb-2">
                    Service Type
                  </label>
                  <select
                    name="serviceType"
                    value={formData.serviceType}
                    onChange={handleInputChange}
                    className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">Select service</option>
                    <option value="repair">Repair</option>
                    <option value="cleaning">Cleaning</option>
                    <option value="polish">Polish</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-400 text-sm font-medium mb-2">
                    Due Date
                  </label>
                  <input
                    type="date"
                    name="dueDate"
                    value={formData.dueDate}
                    onChange={handleInputChange}
                    className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-sm font-medium mb-2">
                    Notes
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:outline-none focus:border-indigo-500"
                    rows={3}
                    placeholder="Enter any special instructions"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-400 text-sm font-medium mb-2">
                    Item Name
                  </label>
                  <input
                    type="text"
                    name="itemName"
                    value={formData.itemName}
                    onChange={handleInputChange}
                    className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:outline-none focus:border-indigo-500"
                    placeholder="Enter item name"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-sm font-medium mb-2">
                    Category
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">Select category</option>
                    <option value="polish">Polish</option>
                    <option value="laces">Laces</option>
                    <option value="insoles">Insoles</option>
                    <option value="accessories">Accessories</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-400 text-sm font-medium mb-2">
                    Price
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:outline-none focus:border-indigo-500"
                    placeholder="Enter price"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-sm font-medium mb-2">
                    SKU
                  </label>
                  <input
                    type="text"
                    name="sku"
                    value={formData.sku}
                    onChange={handleInputChange}
                    className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:outline-none focus:border-indigo-500"
                    placeholder="Enter SKU"
                  />
                </div>
              </div>
            )}
            
            <div className="flex justify-end gap-4 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveQR}
                disabled={loading}
                className="btn-bevel accent-primary px-6 py-2 rounded-lg"
              >
                {loading ? 'Generating...' : 'Generate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}