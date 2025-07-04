'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

export default function CreateTestLeadPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const createTestLead = async () => {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/create-test-lead', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.details || data.error || 'Failed to create test lead');
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
          <CardTitle>Create Test Lead</CardTitle>
          <CardDescription>
            Create a test lead for phone +447450308627 to enable WhatsApp messaging
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md bg-blue-50 p-4">
            <h4 className="text-sm font-medium text-blue-800">Why This Is Needed</h4>
            <div className="mt-2 text-sm text-blue-700 space-y-1">
              <p>• WhatsApp webhook expects leads to exist in the database</p>
              <p>• This creates a test lead for your phone number: +447450308627</p>
              <p>• After creating, you can send WhatsApp messages and get responses</p>
            </div>
          </div>

          <Button 
            onClick={createTestLead} 
            disabled={loading}
            className="w-full"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Test Lead
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
                  <p className="mt-1 text-sm text-green-700">Test lead created successfully</p>
                  <div className="mt-3 space-y-2">
                    <div className="bg-white p-3 rounded border">
                      <p><strong>Lead ID:</strong> {result.lead?.id}</p>
                      <p><strong>Name:</strong> {result.lead?.name}</p>
                      <p><strong>Phone:</strong> {result.lead?.phone}</p>
                      <p><strong>Status:</strong> {result.lead?.status}</p>
                    </div>
                    <div className="bg-white p-3 rounded border">
                      <p><strong>Conversation ID:</strong> {result.conversation?.id}</p>
                      <p><strong>Status:</strong> {result.conversation?.status}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="rounded-md bg-amber-50 p-4">
            <h4 className="text-sm font-medium text-amber-800">Next Steps</h4>
            <div className="mt-2 text-sm text-amber-700 space-y-1">
              <p>1. Click "Create Test Lead" above</p>
              <p>2. Send a WhatsApp message to +447450308627</p>
              <p>3. You should receive an automated response</p>
              <p>4. Check Vercel logs to see the conversation processing</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}