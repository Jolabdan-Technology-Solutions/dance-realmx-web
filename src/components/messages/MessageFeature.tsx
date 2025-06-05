import React, { useState } from 'react';
import { FeatureGuard } from '@/components/guards/FeatureGuard';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface MessageFeatureProps {
  recipientId?: number;
}

export const MessageFeature: React.FC<MessageFeatureProps> = ({ recipientId }) => {
  const [message, setMessage] = useState('');
  const queryClient = useQueryClient();

  const { data: messages, isLoading } = useQuery({
    queryKey: ['messages', recipientId],
    queryFn: async () => {
      const response = await api.get(`/messages${recipientId ? `?recipientId=${recipientId}` : ''}`);
      return response.data;
    },
    enabled: !!recipientId,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await api.post('/messages', {
        recipientId,
        content,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', recipientId] });
      setMessage('');
    },
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      sendMessageMutation.mutate(message);
    }
  };

  return (
    <FeatureGuard requiredSubscription={true}>
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Messages</h2>
        
        {isLoading ? (
          <div>Loading messages...</div>
        ) : (
          <div className="space-y-4">
            <div className="h-96 overflow-y-auto border rounded-lg p-4">
              {messages?.map((msg: any) => (
                <div
                  key={msg.id}
                  className={`mb-4 ${
                    msg.sender_id === recipientId ? 'text-left' : 'text-right'
                  }`}
                >
                  <div
                    className={`inline-block p-3 rounded-lg ${
                      msg.sender_id === recipientId
                        ? 'bg-gray-100'
                        : 'bg-blue-100'
                    }`}
                  >
                    <p className="text-sm">{msg.content}</p>
                    <span className="text-xs text-gray-500">
                      {new Date(msg.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleSendMessage} className="flex space-x-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={sendMessageMutation.isPending}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                Send
              </button>
            </form>
          </div>
        )}
      </div>
    </FeatureGuard>
  );
}; 