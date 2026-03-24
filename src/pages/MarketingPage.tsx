import React, { useState } from 'react';
import { Megaphone, Mail, MessageSquare, Users, BarChart2, Calendar, Gift, Send, Edit, Trash2, Plus } from 'lucide-react';
import CampaignForm from '../components/marketing/CampaignForm';
import Communications from '../components/marketing/Communications';
import Analytics from '../components/marketing/Analytics';

interface Campaign {
  id: string;
  name: string;
  type: 'email' | 'sms' | 'promotion';
  status: 'draft' | 'scheduled' | 'active' | 'completed';
  startDate: string;
  endDate: string;
  audience: string;
  description: string;
  metrics: {
    sent: number;
    opened: number;
    clicked: number;
    converted: number;
  };
}

const mockCampaigns: Campaign[] = [
  {
    id: '1',
    name: 'Spring Cleaning Special',
    type: 'email',
    status: 'active',
    startDate: '2024-03-01',
    endDate: '2024-03-31',
    audience: 'All Customers',
    description: '20% off all cleaning services for the month of March',
    metrics: {
      sent: 1200,
      opened: 850,
      clicked: 320,
      converted: 95
    }
  },
  {
    id: '2',
    name: 'Holiday Repair Discount',
    type: 'sms',
    status: 'scheduled',
    startDate: '2024-12-01',
    endDate: '2024-12-25',
    audience: 'Previous Customers',
    description: '$10 off any repair service over $50',
    metrics: {
      sent: 0,
      opened: 0,
      clicked: 0,
      converted: 0
    }
  }
];

export default function MarketingPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>(mockCampaigns);
  const [selectedTab, setSelectedTab] = useState<'campaigns' | 'communications' | 'analytics'>('campaigns');
  const [showCampaignForm, setShowCampaignForm] = useState(false);

  const handleCreateCampaign = (campaignData: any) => {
    const newCampaign: Campaign = {
      id: (campaigns.length + 1).toString(),
      name: campaignData.name,
      type: campaignData.type as 'email' | 'sms' | 'promotion',
      status: 'draft',
      startDate: campaignData.startDate,
      endDate: campaignData.endDate,
      audience: campaignData.audience,
      description: campaignData.description,
      metrics: {
        sent: 0,
        opened: 0,
        clicked: 0,
        converted: 0
      }
    };

    setCampaigns([...campaigns, newCampaign]);
    setShowCampaignForm(false);
  };

  const handleDeleteCampaign = (campaignId: string) => {
    setCampaigns(campaigns.filter(c => c.id !== campaignId));
  };

  const handleEditCampaign = (campaignId: string) => {
    // Implement edit functionality
    console.log('Edit campaign:', campaignId);
  };

  const getStatusColor = (status: Campaign['status']) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-700/50 text-gray-300';
      case 'scheduled':
        return 'bg-blue-900/40 text-blue-400';
      case 'active':
        return 'bg-green-900/40 text-green-400';
      case 'completed':
        return 'bg-purple-900/40 text-purple-400';
      default:
        return 'bg-gray-700/50 text-gray-300';
    }
  };

  const getTypeIcon = (type: Campaign['type']) => {
    switch (type) {
      case 'email':
        return <Mail className="h-5 w-5" />;
      case 'sms':
        return <MessageSquare className="h-5 w-5" />;
      case 'promotion':
        return <Gift className="h-5 w-5" />;
    }
  };

  const renderContent = () => {
    switch (selectedTab) {
      case 'communications':
        return <Communications />;
      case 'analytics':
        return <Analytics />;
      default:
        return (
          <div className="grid grid-cols-1 gap-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="card-bevel p-4 bg-gradient-to-br from-gray-800 to-gray-900">
                <div className="flex items-center gap-2 text-emerald-400 mb-2">
                  <Users className="h-5 w-5" />
                  <span className="text-gray-300">Total Customers</span>
                </div>
                <div className="text-2xl font-bold text-white">2,547</div>
                <div className="text-sm text-gray-400">+12% from last month</div>
              </div>

              <div className="card-bevel p-4 bg-gradient-to-br from-gray-800 to-gray-900">
                <div className="flex items-center gap-2 text-blue-400 mb-2">
                  <Megaphone className="h-5 w-5" />
                  <span className="text-gray-300">Active Campaigns</span>
                </div>
                <div className="text-2xl font-bold text-white">{campaigns.filter(c => c.status === 'active').length}</div>
                <div className="text-sm text-gray-400">{campaigns.filter(c => c.status === 'scheduled').length} scheduled</div>
              </div>

              <div className="card-bevel p-4 bg-gradient-to-br from-gray-800 to-gray-900">
                <div className="flex items-center gap-2 text-purple-400 mb-2">
                  <Mail className="h-5 w-5" />
                  <span className="text-gray-300">Email Open Rate</span>
                </div>
                <div className="text-2xl font-bold text-white">68%</div>
                <div className="text-sm text-gray-400">Industry avg: 45%</div>
              </div>

              <div className="card-bevel p-4 bg-gradient-to-br from-gray-800 to-gray-900">
                <div className="flex items-center gap-2 text-yellow-400 mb-2">
                  <Gift className="h-5 w-5" />
                  <span className="text-gray-300">Promotion Usage</span>
                </div>
                <div className="text-2xl font-bold text-white">245</div>
                <div className="text-sm text-gray-400">Last 30 days</div>
              </div>
            </div>

            {/* Campaigns List */}
            <div className="card-bevel rounded-lg overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900">
              <div className="p-4 border-b border-gray-700">
                <h2 className="text-lg font-semibold text-gray-200">Active Campaigns</h2>
              </div>
              <div className="divide-y divide-gray-700">
                {campaigns.map((campaign) => (
                  <div key={campaign.id} className="p-4 hover:bg-gray-700/50 transition-colors">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          {getTypeIcon(campaign.type)}
                          <span className="font-semibold text-white">{campaign.name}</span>
                          <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(campaign.status)} text-white`}>
                            {campaign.status}
                          </span>
                        </div>
                        <p className="text-gray-400 text-sm mb-2">{campaign.description}</p>
                        <div className="flex gap-4 text-sm text-gray-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {campaign.startDate} - {campaign.endDate}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {campaign.audience}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          className="p-2 hover:bg-gray-700 rounded transition-colors"
                          onClick={() => handleEditCampaign(campaign.id)}
                        >
                          <Edit className="h-5 w-5 text-gray-400" />
                        </button>
                        <button
                          className="p-2 hover:bg-gray-700 rounded transition-colors"
                          onClick={() => handleDeleteCampaign(campaign.id)}
                        >
                          <Trash2 className="h-5 w-5 text-gray-400" />
                        </button>
                      </div>
                    </div>
                    {campaign.status !== 'scheduled' && (
                      <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-700">
                        <div>
                          <div className="text-sm text-gray-400">Sent</div>
                          <div className="text-lg font-semibold text-white">{campaign.metrics.sent}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-400">Opened</div>
                          <div className="text-lg font-semibold text-white">{campaign.metrics.opened}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-400">Clicked</div>
                          <div className="text-lg font-semibold text-white">{campaign.metrics.clicked}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-400">Converted</div>
                          <div className="text-lg font-semibold text-white">{campaign.metrics.converted}</div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-200">Marketing</h1>
          <p className="text-gray-400">Manage marketing campaigns and communications</p>
        </div>
        <button
          className="flex items-center space-x-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          onClick={() => setShowCampaignForm(true)}
        >
          <Plus className="h-5 w-5" />
          <span>New Campaign</span>
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-4 mb-6">
        <button
          className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
            selectedTab === 'campaigns'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
          }`}
          onClick={() => setSelectedTab('campaigns')}
        >
          <Megaphone className="h-5 w-5" />
          Campaigns
        </button>
        <button
          className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
            selectedTab === 'communications'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
          }`}
          onClick={() => setSelectedTab('communications')}
        >
          <MessageSquare className="h-5 w-5" />
          Communications
        </button>
        <button
          className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
            selectedTab === 'analytics'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
          }`}
          onClick={() => setSelectedTab('analytics')}
        >
          <BarChart2 className="h-5 w-5" />
          Analytics
        </button>
      </div>

      {/* Main Content */}
      {renderContent()}

      {/* Campaign Form Modal */}
      {showCampaignForm && (
        <CampaignForm
          onClose={() => setShowCampaignForm(false)}
          onSubmit={handleCreateCampaign}
        />
      )}
    </div>
  );
}