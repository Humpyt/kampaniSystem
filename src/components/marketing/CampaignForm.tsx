import React from 'react';
import { X } from 'lucide-react';

interface CampaignFormProps {
  onClose: () => void;
  onSubmit: (campaign: any) => void;
}

export default function CampaignForm({ onClose, onSubmit }: CampaignFormProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const campaign = {
      name: formData.get('name'),
      type: formData.get('type'),
      startDate: formData.get('startDate'),
      endDate: formData.get('endDate'),
      audience: formData.get('audience'),
      description: formData.get('description'),
      content: formData.get('content'),
      status: 'draft'
    };
    onSubmit(campaign);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Create New Campaign</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Campaign Name
            </label>
            <input
              type="text"
              name="name"
              required
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
              placeholder="Enter campaign name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Campaign Type
            </label>
            <select
              name="type"
              required
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
            >
              <option value="email">Email Campaign</option>
              <option value="sms">SMS Campaign</option>
              <option value="promotion">Promotion</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Start Date
              </label>
              <input
                type="date"
                name="startDate"
                required
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                End Date
              </label>
              <input
                type="date"
                name="endDate"
                required
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Target Audience
            </label>
            <select
              name="audience"
              required
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
            >
              <option value="all">All Customers</option>
              <option value="previous">Previous Customers</option>
              <option value="recent">Recent Customers (Last 30 Days)</option>
              <option value="inactive">Inactive Customers (90+ Days)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description
            </label>
            <textarea
              name="description"
              required
              rows={3}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
              placeholder="Enter campaign description"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Campaign Content
            </label>
            <textarea
              name="content"
              required
              rows={5}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
              placeholder="Enter campaign content/message"
            />
          </div>

          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-300 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg"
            >
              Create Campaign
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
