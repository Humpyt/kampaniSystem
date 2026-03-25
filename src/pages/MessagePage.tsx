import React, { useState } from 'react';
import { 
  MessageSquare, Search, History, User, 
  Send, FileText, Plus, Edit2, Trash2,
  CheckCircle, AlertCircle, Clock, Phone
} from 'lucide-react';
import { whatsappService } from '../services/whatsapp';
import WhatsAppConfig from '../components/WhatsAppConfig';

interface MessageTemplate {
  id: string;
  name: string;
  content: string;
  category: 'status' | 'reminder' | 'promotion';
  variables: string[];
  whatsappTemplate?: string;
}

interface MessageHistory {
  id: string;
  templateId: string;
  customerName: string;
  content: string;
  sentAt: string;
  status: 'delivered' | 'failed' | 'pending';
}

const mockMessageHistory: MessageHistory[] = [
  {
    id: '1',
    templateId: '1',
    customerName: 'John Smith',
    content: 'Hello John Smith, your order #1234 is ready for pickup at RepairPRO. Total amount: UGX 75,000. We\'re open Mon-Sat, 9AM-6PM.',
    sentAt: '2024-03-15T14:30:00',
    status: 'delivered'
  },
  {
    id: '2',
    templateId: '2',
    customerName: 'Sarah Johnson',
    content: 'Hi Sarah Johnson, this is a reminder for your repair appointment tomorrow at 2:00 PM. Please bring your leather boots.',
    sentAt: '2024-03-15T13:45:00',
    status: 'delivered'
  },
  {
    id: '3',
    templateId: '3',
    customerName: 'Michael Brown',
    content: 'Dear Michael Brown, enjoy 20% off on all repairs this week! Book your appointment now.',
    sentAt: '2024-03-15T12:15:00',
    status: 'failed'
  },
  {
    id: '4',
    templateId: '1',
    customerName: 'Emma Wilson',
    content: 'Hello Emma Wilson, your order #1235 is ready for pickup at RepairPRO. Total amount: UGX 45,000. We\'re open Mon-Sat, 9AM-6PM.',
    sentAt: '2024-03-15T11:30:00',
    status: 'pending'
  }
];

const defaultTemplates: MessageTemplate[] = [
  {
    id: '1',
    name: 'Order Ready',
    content: 'Hello {customerName}, your order #{orderNumber} is ready for pickup at RepairPRO. Total amount: {amount}. We\'re open Mon-Sat, 9AM-6PM.',
    category: 'status',
    variables: ['customerName', 'orderNumber', 'amount', 'phone'],
    whatsappTemplate: 'order_ready'
  },
  {
    id: '2',
    name: 'Appointment Reminder',
    content: 'Hi {customerName}, this is a reminder for your repair appointment tomorrow at {time}. Please bring your {itemType}.',
    category: 'reminder',
    variables: ['customerName', 'time', 'itemType', 'phone'],
    whatsappTemplate: 'appointment_reminder'
  },
  {
    id: '3',
    name: 'Special Offer',
    content: 'Dear {customerName}, enjoy {discount} off on all repairs until {validUntil}! Book your appointment now.',
    category: 'promotion',
    variables: ['customerName', 'discount', 'validUntil', 'phone'],
    whatsappTemplate: 'promotion'
  }
];

export default function MessagePage() {
  const [templates, setTemplates] = useState<MessageTemplate[]>(defaultTemplates);
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [previewData, setPreviewData] = useState<Record<string, string>>({});
  const [filterCategory, setFilterCategory] = useState<MessageTemplate['category'] | 'all'>('all');
  const [showHistory, setShowHistory] = useState(false);
  const [messageHistory, setMessageHistory] = useState<MessageHistory[]>(mockMessageHistory);
  const [showConfig, setShowConfig] = useState(false);

  const handleTemplateSelect = (template: MessageTemplate) => {
    setSelectedTemplate(template);
    const initialData = template.variables.reduce((acc, variable) => ({
      ...acc,
      [variable]: `[${variable}]`
    }), {});
    setPreviewData(initialData);
  };

  const handlePreviewDataChange = (variable: string, value: string) => {
    setPreviewData(prev => ({
      ...prev,
      [variable]: value
    }));
  };

  const getPreviewContent = () => {
    if (!selectedTemplate) return '';
    let content = selectedTemplate.content;
    Object.entries(previewData).forEach(([key, value]) => {
      content = content.replace(`{${key}}`, value);
    });
    return content;
  };

  const getStatusIcon = (status: MessageHistory['status']) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const handleSendMessage = async () => {
    if (!selectedTemplate || !previewData.phone) {
      alert('Please fill in all required fields, including phone number');
      return;
    }

    try {
      let response;
      switch (selectedTemplate.whatsappTemplate) {
        case 'order_ready':
          response = await whatsappService.sendOrderReady(
            previewData.phone,
            previewData.customerName,
            previewData.orderNumber,
            parseFloat(previewData.amount)
          );
          break;
        case 'appointment_reminder':
          response = await whatsappService.sendAppointmentReminder(
            previewData.phone,
            previewData.customerName,
            previewData.time,
            previewData.itemType
          );
          break;
        case 'promotion':
          response = await whatsappService.sendPromotion(
            previewData.phone,
            previewData.customerName,
            previewData.discount,
            previewData.validUntil
          );
          break;
        default:
          alert('Invalid template type');
          return;
      }

      if (response.success) {
        alert('Message sent successfully!');
        // Add to message history
        const newMessage: MessageHistory = {
          id: Date.now().toString(),
          templateId: selectedTemplate.id,
          customerName: previewData.customerName,
          content: getPreviewContent(),
          sentAt: new Date().toISOString(),
          status: 'delivered'
        };
        setMessageHistory(prev => [newMessage, ...prev]);
      } else {
        throw new Error('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      console.error('Error response:', error.response?.data || error.message);
      console.error('Error details:', error);
      alert('Failed to send message. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Message Center</h1>
          <p className="text-gray-400">Manage customer communications</p>
        </div>
        <div className="flex space-x-4">
          <button 
            className="btn-bevel accent-secondary px-6 py-3 rounded-lg flex items-center"
            onClick={() => setShowConfig(!showConfig)}
          >
            <MessageSquare className="h-5 w-5 mr-2" />
            WhatsApp Settings
          </button>
          <button 
            className="btn-bevel accent-primary px-6 py-3 rounded-lg flex items-center"
            onClick={() => setShowHistory(false)}
          >
            <Plus className="h-5 w-5 mr-2" />
            New Template
          </button>
          <button 
            className={`btn-bevel ${showHistory ? 'accent-primary' : 'accent-secondary'} px-6 py-3 rounded-lg flex items-center`}
            onClick={() => setShowHistory(!showHistory)}
          >
            <History className="h-5 w-5 mr-2" />
            Message History
          </button>
        </div>
      </div>

      {showConfig ? (
        <WhatsAppConfig />
      ) : showHistory ? (
        // Message History View
        <div className="card-bevel p-6">
          <div className="space-y-4">
            {messageHistory.map((message) => (
              <div 
                key={message.id}
                className="bg-gray-800 p-4 rounded-lg flex items-start justify-between"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="font-medium">{message.customerName}</span>
                    <span className="text-gray-400">•</span>
                    <span className="text-sm text-gray-400">
                      {new Date(message.sentAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-gray-300">{message.content}</p>
                </div>
                <div className="ml-4 flex items-center space-x-2">
                  {getStatusIcon(message.status)}
                  <span className="text-sm capitalize">{message.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        // Template Management View
        <div className="grid grid-cols-3 gap-6">
          {/* Left Panel - Template List */}
          <div className="col-span-1 space-y-4">
            <div className="card-bevel p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search templates..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-700 rounded-lg border border-gray-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="mt-4">
                <select
                  className="w-full px-4 py-2 bg-gray-700 rounded-lg border border-gray-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value as MessageTemplate['category'] | 'all')}
                >
                  <option value="all">All Categories</option>
                  <option value="status">Status Updates</option>
                  <option value="reminder">Reminders</option>
                  <option value="promotion">Promotions</option>
                </select>
              </div>
            </div>

            <div className="card-bevel p-4">
              <div className="space-y-2">
                {templates
                  .filter(template => 
                    template.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
                    (filterCategory === 'all' || template.category === filterCategory)
                  )
                  .map((template) => (
                    <button
                      key={template.id}
                      onClick={() => handleTemplateSelect(template)}
                      className={`w-full text-left p-4 rounded-lg transition-all ${
                        selectedTemplate?.id === template.id
                          ? 'bg-indigo-600'
                          : 'bg-gray-700 hover:bg-gray-600'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">{template.name}</h3>
                          <p className="text-sm text-gray-400 mt-1">
                            {template.content.substring(0, 50)}...
                          </p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          template.category === 'reminder' ? 'bg-blue-100 text-blue-800' :
                          template.category === 'status' ? 'bg-green-100 text-green-800' :
                          'bg-purple-100 text-purple-800'
                        }`}>
                          {template.category}
                        </span>
                      </div>
                    </button>
                  ))}
              </div>
            </div>
          </div>

          {/* Right Panel - Template Editor */}
          <div className="col-span-2 card-bevel p-6">
            {selectedTemplate ? (
              <div className="space-y-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-bold">{selectedTemplate.name}</h2>
                    <p className="text-sm text-gray-400 mt-1">
                      {selectedTemplate.category.charAt(0).toUpperCase() + selectedTemplate.category.slice(1)} template
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button className="p-2 bg-gray-700 rounded-lg hover:bg-gray-600">
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button className="p-2 bg-red-600 rounded-lg hover:bg-red-500">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Template Variables
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      {selectedTemplate.variables.map((variable) => (
                        <div key={variable} className="space-y-1">
                          <label className="block text-sm text-gray-400">
                            {variable}
                          </label>
                          <input
                            type="text"
                            value={previewData[variable] || ''}
                            onChange={(e) => handlePreviewDataChange(variable, e.target.value)}
                            className="w-full px-3 py-2 bg-gray-700 rounded-lg border border-gray-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Preview
                    </label>
                    <div className="bg-gray-700 p-4 rounded-lg">
                      <p className="text-gray-300">{getPreviewContent()}</p>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-4">
                    <button 
                      className="btn-bevel accent-secondary px-6 py-2 rounded-lg flex items-center"
                      onClick={() => {
                        // Preview message in a modal or alert
                        alert(getPreviewContent());
                      }}
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Preview
                    </button>
                    <button 
                      className="btn-bevel accent-primary px-6 py-2 rounded-lg flex items-center"
                      onClick={handleSendMessage}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Send via WhatsApp
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-400">No Template Selected</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Select a template from the list to view and edit
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}