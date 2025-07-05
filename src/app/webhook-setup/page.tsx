'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle } from 'lucide-react';

export default function WebhookSetupPage() {
  const [checking, setChecking] = useState(false);
  const [configuring, setConfiguring] = useState(false);
  const [status, setStatus] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const checkWebhook = async () => {
    setChecking(true);
    setError(null);
    try {
      const response = await fetch('/api/check-webhook-config');
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      setError('Failed to check webhook configuration');
    } finally {
      setChecking(false);
    }
  };

  const configureWebhook = async () => {
    setConfiguring(true);
    setError(null);
    try {
      const response = await fetch('/api/configure-webhook', {
        method: 'POST',
      });
      const data = await response.json();
      if (data.success) {
        await checkWebhook(); // Refresh status
      } else {
        setError(data.error || 'Failed to configure webhook');
      }
    } catch (error) {
      setError('Failed to configure webhook');
    } finally {
      setConfiguring(false);
    }
  };

  return (
    <div className="container mx-auto max-w-4xl p-8">
      <Card>
        <CardHeader>
          <CardTitle>WhatsApp Webhook Setup</CardTitle>
          <CardDescription>
            Configure your Twilio WhatsApp webhook to receive messages
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold mb-2">Setup Instructions:</h3>
            <ol className="list-decimal ml-5 space-y-2">
              <li>Click "Check Current Configuration" to see your webhook status</li>
              <li>If the webhook URL is incorrect, click "Configure Webhook"</li>
              <li>Make sure you're using the WhatsApp Sandbox or a verified WhatsApp Business number</li>
              <li>The webhook URL should be: <code className="bg-gray-100 px-2 py-1 rounded">https://whatsapp-lead-system.vercel.app/api/webhooks/twilio</code></li>
            </ol>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button onClick={checkWebhook} disabled={checking}>
              {checking ? 'Checking...' : 'Check Current Configuration'}
            </Button>
            <Button onClick={configureWebhook} disabled={configuring} variant="outline">
              {configuring ? 'Configuring...' : 'Configure Webhook'}
            </Button>
          </div>

          {/* Error Display */}
          {error && (
            <Alert className="border-red-200 bg-red-50">
              <XCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}

          {/* Status Display */}
          {status && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Current Configuration:</h4>
                <dl className="space-y-2">
                  <div>
                    <dt className="font-medium text-gray-500">Phone Number:</dt>
                    <dd className="text-gray-900">{status.phoneNumber || 'Not found'}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-gray-500">Current Webhook URL:</dt>
                    <dd className="text-gray-900 break-all">{status.smsUrl || 'Not configured'}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-gray-500">Expected Webhook URL:</dt>
                    <dd className="text-gray-900 break-all">{status.expectedWebhook}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-gray-500">Status:</dt>
                    <dd className="flex items-center gap-2">
                      {status.isWebhookConfigured ? (
                        <>
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          <span className="text-green-600">Configured Correctly</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-5 w-5 text-red-600" />
                          <span className="text-red-600">Not Configured</span>
                        </>
                      )}
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Manual Configuration Instructions */}
              {!status.isWebhookConfigured && (
                <Alert className="border-yellow-200 bg-yellow-50">
                  <AlertDescription>
                    <h4 className="font-semibold mb-2">Manual Configuration Required:</h4>
                    <ol className="list-decimal ml-5 space-y-2">
                      <li>Go to your Twilio Console</li>
                      <li>Navigate to Phone Numbers → Manage → Active Numbers</li>
                      <li>Click on your WhatsApp number: {status.phoneNumber}</li>
                      <li>Set the webhook URL for "A message comes in" to:
                        <code className="block bg-gray-100 px-2 py-1 rounded mt-1">
                          https://whatsapp-lead-system.vercel.app/api/webhooks/twilio
                        </code>
                      </li>
                      <li>Set the method to "HTTP POST"</li>
                      <li>Save the configuration</li>
                    </ol>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* WhatsApp Sandbox Note */}
          <Alert>
            <AlertDescription>
              <strong>Note:</strong> If you're using the Twilio Sandbox for WhatsApp:
              <ol className="list-decimal ml-5 mt-2">
                <li>Go to Twilio Console → Messaging → Try it out → Send a WhatsApp message</li>
                <li>Make sure you've joined the sandbox by sending the join code</li>
                <li>Configure the sandbox webhook URL to point to your app</li>
              </ol>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}