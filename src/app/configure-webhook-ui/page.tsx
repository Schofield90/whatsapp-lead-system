'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

export default function ConfigureWebhookPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const configureWebhook = async () => {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/configure-webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.details || data.error || 'Failed to configure webhook');
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

  const checkConfiguration = async () => {
    try {
      const response = await fetch('/api/check-webhook-config');
      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError('Failed to check configuration');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Configure Twilio Webhook</CardTitle>
          <CardDescription>
            Set up the webhook URL for incoming WhatsApp messages
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-4">
            <Button 
              onClick={configureWebhook} 
              disabled={loading}
              className="flex-1"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Configure Webhook
            </Button>
            
            <Button 
              onClick={checkConfiguration} 
              variant="outline"
              className="flex-1"
            >
              Check Configuration
            </Button>
          </div>

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
                  <h4 className="text-sm font-medium text-green-800">Configuration Result</h4>
                  <div className="mt-2 text-sm text-green-700 space-y-2">
                    <p><strong>Phone Number:</strong> {result.phoneNumber}</p>
                    <p><strong>Webhook URL:</strong> {result.webhookUrl || result.smsUrl || 'Not set'}</p>
                    <p><strong>HTTP Method:</strong> {result.method || result.smsMethod || 'Not set'}</p>
                    <p><strong>Is Configured:</strong> 
                      <span className={result.isWebhookConfigured ? 'text-green-600' : 'text-red-600'}>
                        {result.isWebhookConfigured ? ' ✅ Yes' : ' ❌ No'}
                      </span>
                    </p>
                    {result.expectedWebhook && (
                      <p><strong>Expected URL:</strong> {result.expectedWebhook}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="rounded-md bg-blue-50 p-4">
            <h4 className="text-sm font-medium text-blue-800">Expected Configuration</h4>
            <div className="mt-2 text-sm text-blue-700 space-y-1">
              <p><strong>Webhook URL:</strong> https://whatsapp-lead-system.vercel.app/api/webhooks/twilio</p>
              <p><strong>HTTP Method:</strong> POST</p>
              <p><strong>Phone Number:</strong> +447450308627</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}