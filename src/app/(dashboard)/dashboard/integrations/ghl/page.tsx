import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  Link, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  ExternalLink,
  Zap
} from 'lucide-react';

export default function GHLIntegrationPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">GoHighLevel Integration</h1>
          <p className="text-muted-foreground">
            Connect your GHL account to sync leads, bookings, and email campaigns
          </p>
        </div>
        <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
          <AlertCircle className="mr-1 h-3 w-3" />
          Coming Soon
        </Badge>
      </div>

      {/* Integration Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Link className="h-5 w-5" />
            <span>Connection Status</span>
          </CardTitle>
          <CardDescription>
            Current status of your GoHighLevel integration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <XCircle className="h-5 w-5 text-red-500" />
              <span className="text-sm">Not Connected</span>
            </div>
            <Button variant="outline" size="sm">
              <Settings className="mr-2 h-4 w-4" />
              Configure Integration
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Setup Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Setup Instructions</CardTitle>
          <CardDescription>
            How to connect your GoHighLevel account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div className="flex items-start space-x-3">
              <div className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">
                1
              </div>
              <div>
                <h4 className="font-medium">Get your GHL API Key</h4>
                <p className="text-sm text-gray-600">
                  Go to Settings → Integrations → API in your GHL account
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">
                2
              </div>
              <div>
                <h4 className="font-medium">Configure Webhooks</h4>
                <p className="text-sm text-gray-600">
                  Set up webhooks to sync leads and appointments automatically
                </p>
                <div className="mt-2 p-3 bg-gray-50 rounded-lg text-sm font-mono">
                  https://your-domain.com/api/integrations/ghl/webhook
                </div>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">
                3
              </div>
              <div>
                <h4 className="font-medium">Test the Connection</h4>
                <p className="text-sm text-gray-600">
                  We'll verify the connection and sync existing contacts
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configuration Form */}
      <Card>
        <CardHeader>
          <CardTitle>Configuration</CardTitle>
          <CardDescription>
            Enter your GoHighLevel API credentials
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="ghl-api-key">GHL API Key</Label>
              <Input 
                id="ghl-api-key" 
                type="password" 
                placeholder="Enter your GHL API key"
                disabled
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="ghl-location-id">Location ID</Label>
              <Input 
                id="ghl-location-id" 
                placeholder="Enter your GHL Location ID"
                disabled
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="webhook-secret">Webhook Secret (Optional)</Label>
              <Input 
                id="webhook-secret" 
                placeholder="Enter webhook verification secret"
                disabled
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch id="enable-integration" disabled />
            <Label htmlFor="enable-integration">Enable GHL Integration</Label>
          </div>
          
          <Button disabled className="w-full">
            <Zap className="mr-2 h-4 w-4" />
            Save Configuration
          </Button>
        </CardContent>
      </Card>

      {/* Integration Features */}
      <Card>
        <CardHeader>
          <CardTitle>Integration Features</CardTitle>
          <CardDescription>
            What will be synced between systems
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h4 className="font-medium">From GHL to WhatsApp System:</h4>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>• New leads and contacts</li>
                <li>• Appointment bookings</li>
                <li>• Lead status updates</li>
                <li>• Custom field data</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">From WhatsApp System to GHL:</h4>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>• WhatsApp conversation summaries</li>
                <li>• Lead qualification status</li>
                <li>• Meeting confirmations</li>
                <li>• AI insights and notes</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Benefits */}
      <Card>
        <CardHeader>
          <CardTitle>Benefits of Integration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center space-y-2">
              <div className="bg-green-100 text-green-600 rounded-full w-12 h-12 flex items-center justify-center mx-auto">
                <CheckCircle className="h-6 w-6" />
              </div>
              <h4 className="font-medium">Unified Lead Management</h4>
              <p className="text-sm text-gray-600">
                All leads in one place with full conversation history
              </p>
            </div>
            
            <div className="text-center space-y-2">
              <div className="bg-blue-100 text-blue-600 rounded-full w-12 h-12 flex items-center justify-center mx-auto">
                <Zap className="h-6 w-6" />
              </div>
              <h4 className="font-medium">Automated Workflows</h4>
              <p className="text-sm text-gray-600">
                Trigger email campaigns based on WhatsApp interactions
              </p>
            </div>
            
            <div className="text-center space-y-2">
              <div className="bg-purple-100 text-purple-600 rounded-full w-12 h-12 flex items-center justify-center mx-auto">
                <ExternalLink className="h-6 w-6" />
              </div>
              <h4 className="font-medium">Seamless Transition</h4>
              <p className="text-sm text-gray-600">
                Gradually migrate from GHL while keeping existing workflows
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}