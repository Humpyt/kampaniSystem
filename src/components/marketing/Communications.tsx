import React, { useState } from 'react';
import { Mail, MessageSquare, Search, Filter, Send } from 'lucide-react';

interface Communication {
  id: string;
  type: 'email' | 'sms';
  recipient: string;
  subject?: string;
  content: string;
  status: 'sent' | 'failed' | 'scheduled';
  timestamp: string;
}

const mockCommunications: Communication[] = [
  {
    id: '1',
    type: 'email',
    recipient: 'john.doe@example.com',
    subject: 'Your Shoe Repair is Ready',
    content: 'Your shoes are ready for pickup. Total: $45.00',
    status: 'sent',
    timestamp: '2024-03-15 14:30'
  },
  {
    id: '2',
    type: 'sms',
    recipient: '+1234567890',
    content: 'Your bag repair is complete. Ready for pickup.',
    status: 'sent',
    timestamp: '2024-03-15 15:45'
  }
];

export default function Communications() {
  const [communications] = useState<Communication[]>(mockCommunications);
  const [showNewMessage, setShowNewMessage] = useState(false);

  const getStatusColor = (status: Communication['status']) => {
    switch (status) {
      case 'sent':
        return 'text-emerald-500';
      case 'failed':
        return 'text-red-500';
      case 'scheduled':
        return 'text-blue-500';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex justify-between items-center">
        <div className="flex gap-4 flex-1">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search communications..."
              className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg pl-10"
            />
            <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
          </div>
          <select className="bg-gray-700 text-white px-4 py-2 rounded-lg">
            <option value="all">All Types</option>
            <option value="email">Email</option>
            <option value="sms">SMS</option>
          </select>
        </div>
        <button
          onClick={() => setShowNewMessage(true)}
          className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Send size={20} />
          New Message
        </button>
      </div>

      {/* Communications List */}
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white">Recent Communications</h2>
        </div>
        <div className="divide-y divide-gray-700">
          {communications.map((comm) => (
            <div key={comm.id} className="p-4 hover:bg-gray-700">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  {comm.type === 'email' ? (
                    <Mail className="h-5 w-5 text-blue-400 mt-1" />
                  ) : (
                    <MessageSquare className="h-5 w-5 text-green-400 mt-1" />
                  )}
                  <div>
                    <div className="font-medium text-white">
                      {comm.recipient}
                      {comm.subject && (
                        <span className="text-gray-400 ml-2">- {comm.subject}</span>
                      )}
                    </div>
                    <div className="text-sm text-gray-400 mt-1">{comm.content}</div>
                    <div className="flex items-center gap-4 mt-2 text-sm">
                      <span className={getStatusColor(comm.status)}>{comm.status}</span>
                      <span className="text-gray-400">{comm.timestamp}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* New Message Modal */}
      {showNewMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">New Message</h2>
              <button
                onClick={() => setShowNewMessage(false)}
                className="text-gray-400 hover:text-white"
              >
                ×
              </button>
            </div>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Message Type
                </label>
                <select className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white">
                  <option value="email">Email</option>
                  <option value="sms">SMS</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Recipient
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  placeholder="Enter email or phone number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Subject (Email only)
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  placeholder="Enter subject"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Message
                </label>
                <textarea
                  rows={4}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  placeholder="Enter your message"
                />
              </div>
              <div className="flex justify-end gap-4 mt-6">
                <button
                  type="button"
                  onClick={() => setShowNewMessage(false)}
                  className="px-4 py-2 text-gray-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg"
                >
                  Send Message
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
