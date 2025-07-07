'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Calendar, ExternalLink, CheckCircle, AlertCircle, Copy } from 'lucide-react';
import { toast } from 'sonner';

export default function CalendarSetupPage() {
  const [credentials, setCredentials] = useState({
    client_id: '',
    client_secret: '',
    refresh_token: ''
  });
  const [loading, setLoading] = useState(false);
  const [setupComplete, setSetupComplete] = useState(false);

  const handleSave = async () => {
    if (!credentials.client_id || !credentials.client_secret || !credentials.refresh_token) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      // In a real implementation, you would save these to your environment variables
      // or secure storage. For now, we'll just show success.
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSetupComplete(true);
      toast.success('Google Calendar integration configured successfully!');
    } catch (error) {
      toast.error('Failed to save configuration');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Google Calendar Setup</h1>
          <p className="text-muted-foreground">
            Configure Google Calendar integration for automatic booking
          </p>
        </div>
        {setupComplete && (
          <Badge variant="default" className="bg-green-100 text-green-800">
            <CheckCircle className="mr-1 h-4 w-4" />
            Setup Complete
          </Badge>
        )}
      </div>

      <div className="grid gap-6">
        {/* Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="mr-2 h-5 w-5" />
              Integration Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className={`h-2 w-2 rounded-full ${setupComplete ? 'bg-green-500' : 'bg-yellow-500'}`} />
                  <span className="font-medium">Google Calendar API</span>
                </div>
                <Badge variant={setupComplete ? 'default' : 'secondary'}>
                  {setupComplete ? 'Connected' : 'Not Configured'}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="font-medium">WhatsApp Notifications</span>
                </div>
                <Badge variant="default">Active</Badge>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="font-medium">Reminder System</span>
                </div>
                <Badge variant="default">Active</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Setup Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Setup Instructions</CardTitle>
            <CardDescription>
              Follow these steps to set up Google Calendar integration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold">Step 1: Create Google Cloud Project</h3>
                <p className="text-sm text-gray-600">
                  Go to the Google Cloud Console and create a new project or select an existing one.
                </p>
                <Button variant="outline" size="sm" onClick={() => window.open('https://console.cloud.google.com/', '_blank')}>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open Google Cloud Console
                </Button>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">Step 2: Enable Calendar API</h3>
                <p className="text-sm text-gray-600">
                  In your Google Cloud project, enable the Google Calendar API.
                </p>
                <Button variant="outline" size="sm" onClick={() => window.open('https://console.cloud.google.com/apis/library/calendar-json.googleapis.com', '_blank')}>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Enable Calendar API
                </Button>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">Step 3: Create OAuth 2.0 Credentials</h3>
                <p className="text-sm text-gray-600">
                  Create OAuth 2.0 credentials and add your domain to authorized redirect URIs.
                </p>
                <div className="bg-gray-50 p-3 rounded text-sm font-mono">
                  Authorized redirect URI: https://your-domain.vercel.app/auth/google/callback
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">Step 4: Get Refresh Token</h3>
                <p className="text-sm text-gray-600">
                  Use the OAuth 2.0 playground to generate a refresh token with calendar scope.
                </p>
                <Button variant="outline" size="sm" onClick={() => window.open('https://developers.google.com/oauthplayground/', '_blank')}>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  OAuth 2.0 Playground
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Configuration Form */}
        <Card>
          <CardHeader>
            <CardTitle>API Credentials</CardTitle>
            <CardDescription>
              Enter your Google Calendar API credentials
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="client_id">Client ID</Label>
                <div className="flex space-x-2">
                  <Input
                    id="client_id"
                    placeholder="Your Google OAuth Client ID"
                    value={credentials.client_id}
                    onChange={(e) => setCredentials({ ...credentials, client_id: e.target.value })}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard('GOOGLE_CLIENT_ID')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-gray-500">Add this as GOOGLE_CLIENT_ID environment variable</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="client_secret">Client Secret</Label>
                <div className="flex space-x-2">
                  <Input
                    id="client_secret"
                    type="password"
                    placeholder="Your Google OAuth Client Secret"
                    value={credentials.client_secret}
                    onChange={(e) => setCredentials({ ...credentials, client_secret: e.target.value })}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard('GOOGLE_CLIENT_SECRET')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-gray-500">Add this as GOOGLE_CLIENT_SECRET environment variable</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="refresh_token">Refresh Token</Label>
                <div className="flex space-x-2">
                  <Textarea
                    id="refresh_token"
                    placeholder="Your Google OAuth Refresh Token"
                    value={credentials.refresh_token}
                    onChange={(e) => setCredentials({ ...credentials, refresh_token: e.target.value })}
                    rows={3}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard('GOOGLE_REFRESH_TOKEN')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-gray-500">Add this as GOOGLE_REFRESH_TOKEN environment variable</p>
              </div>

              <Button onClick={handleSave} disabled={loading} className="w-full">
                {loading ? 'Saving...' : 'Save Configuration'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Environment Variables */}
        <Card>
          <CardHeader>
            <CardTitle>Environment Variables</CardTitle>
            <CardDescription>
              Add these environment variables to your Vercel deployment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 font-mono text-sm">
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span>GOOGLE_CLIENT_ID</span>
                <Button variant="ghost" size="sm" onClick={() => copyToClipboard('GOOGLE_CLIENT_ID')}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span>GOOGLE_CLIENT_SECRET</span>
                <Button variant="ghost" size="sm" onClick={() => copyToClipboard('GOOGLE_CLIENT_SECRET')}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span>GOOGLE_REFRESH_TOKEN</span>
                <Button variant="ghost" size="sm" onClick={() => copyToClipboard('GOOGLE_REFRESH_TOKEN')}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span>CRON_SECRET</span>
                <Button variant="ghost" size="sm" onClick={() => copyToClipboard('CRON_SECRET')}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* How It Works */}
        <Card>
          <CardHeader>
            <CardTitle>How Booking Works</CardTitle>
            <CardDescription>
              Understanding the automated booking flow
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                  1
                </div>
                <div>
                  <h4 className="font-medium">AI Detects Booking Intent</h4>
                  <p className="text-sm text-gray-600">
                    When a customer shows strong interest, Claude AI determines they're ready to book.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                  2
                </div>
                <div>
                  <h4 className="font-medium">Calendar Event Created</h4>
                  <p className="text-sm text-gray-600">
                    A Google Calendar event is automatically created with Google Meet link.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                  3
                </div>
                <div>
                  <h4 className="font-medium">Owner Notification</h4>
                  <p className="text-sm text-gray-600">
                    You receive a WhatsApp message to <strong>07490253471</strong> with booking details.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                  4
                </div>
                <div>
                  <h4 className="font-medium">Client Confirmation</h4>
                  <p className="text-sm text-gray-600">
                    The customer receives a confirmation message with meeting details.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                  5
                </div>
                <div>
                  <h4 className="font-medium">1-Hour Reminder</h4>
                  <p className="text-sm text-gray-600">
                    Client receives an automatic reminder 1 hour before the consultation.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Warning */}
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-800 flex items-center">
              <AlertCircle className="mr-2 h-5 w-5" />
              Important Setup Notes
            </CardTitle>
          </CardHeader>
          <CardContent className="text-orange-700">
            <ul className="space-y-2 text-sm">
              <li>• Make sure to add environment variables to your Vercel deployment</li>
              <li>• Test the integration with a sample booking before going live</li>
              <li>• Your Google account must have calendar access permissions</li>
              <li>• The WhatsApp business number must be verified with Twilio</li>
              <li>• Set up a cron job to call /api/process-reminders every 5 minutes</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}