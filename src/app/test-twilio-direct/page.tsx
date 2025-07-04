'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';

export default function TestTwilioDirectPage() {
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('Hello! This is a test message from your gym lead system. Reply STOP to opt out.');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const sendTestMessage = async () => {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/test-twilio-direct', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone, message }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.details || data.error || 'Failed to send message');
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
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Direct Twilio Test</CardTitle>
          <CardDescription>
            Test Twilio import and message sending directly (bypassing twilio.ts)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+447931234567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="font-mono"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Test Message</Label>
            <Textarea
              id="message"
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          <Button 
            onClick={sendTestMessage} 
            disabled={loading || !phone || !message}
            className="w-full"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? 'Sending...' : 'Send Direct Test'}
          </Button>

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <h4 className="text-sm font-medium text-red-800">Error</h4>
              <p className="mt-1 text-sm text-red-700 whitespace-pre-wrap">{error}</p>
            </div>
          )}

          {result && (
            <div className="rounded-md bg-green-50 p-4">
              <h4 className="text-sm font-medium text-green-800">Success!</h4>
              <div className="mt-2 text-sm text-green-700 space-y-1">
                <p><strong>Message SID:</strong> {result.messageSid}</p>
                <p><strong>Status:</strong> {result.status}</p>
                <p><strong>To:</strong> {result.to}</p>
                <p><strong>From:</strong> {result.from}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}