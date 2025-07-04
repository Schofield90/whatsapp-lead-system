'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

export default function MessagingServiceConfigPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const configureMessagingService = async () => {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/configure-messaging-service', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.details || data.error || 'Failed to configure messaging service');
        console.error('Error details:', data);
      } else {
        setResult(data);
      }
    } catch (err) {
      setError('Network error: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Configure Messaging Service Webhook</CardTitle>
          <CardDescription>
            Your WhatsApp is routed through a Messaging Service that needs webhook configuration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md bg-amber-50 p-4 flex items-start space-x-2">
            <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-amber-800">Issue Found</h4>
              <p className="mt-1 text-sm text-amber-700">
                Your WhatsApp number uses a "Default Messaging Service for Conversations" 
                which currently has no webhook URL configured. This is why incoming messages 
                aren't reaching your system.
              </p>
            </div>
          </div>

          <Button 
            onClick={configureMessagingService} 
            disabled={loading}
            className="w-full"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Configure Messaging Service Webhook
          </Button>

          {error && (
            <div className="rounded-md bg-red-50 p-4 flex items-start space-x-2">
              <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-red-800">Error</h4>
                <p className="mt-1 text-sm text-red-700 whitespace-pre-wrap">{error}</p>
              </div>
            </div>
          )}

          {result && (
            <div className="rounded-md bg-green-50 p-4">
              <div className="flex items-start space-x-2">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-green-800">Success!</h4>
                  <p className="mt-1 text-sm text-green-700">{result.message}</p>
                  {result.services && (
                    <div className="mt-3 space-y-2">
                      {result.services.map((service: any) => (
                        <div key={service.sid} className="bg-white p-3 rounded border">
                          <p><strong>Service:</strong> {service.friendlyName}</p>
                          <p><strong>Webhook URL:</strong> {service.inboundRequestUrl}</p>
                          <p><strong>Method:</strong> {service.inboundMethod}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="rounded-md bg-blue-50 p-4">
            <h4 className="text-sm font-medium text-blue-800">What This Does</h4>
            <div className="mt-2 text-sm text-blue-700 space-y-1">
              <p>• Configures the "Default Messaging Service for Conversations"</p>
              <p>• Sets webhook URL to: https://whatsapp-lead-system.vercel.app/api/webhooks/twilio</p>
              <p>• Enables incoming WhatsApp messages to reach your system</p>
              <p>• After this, send a test message and check your Vercel logs!</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}