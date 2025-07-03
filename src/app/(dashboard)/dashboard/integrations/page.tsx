'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { 
  Settings, 
  Plus, 
  Edit, 
  Trash2, 
  Check, 
  X,
  MessageSquare,
  Calendar,
  Mail,
  Brain,
  Facebook
} from 'lucide-react';
import { toast } from 'sonner';

interface Integration {
  id: string;
  service_name: string;
  is_active: boolean;
  created_at: string;
}

interface LeadSource {
  id: string;
  name: string;
  source_type: string;
  webhook_token: string;
  is_active: boolean;
  created_at: string;
}

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [leadSources, setLeadSources] = useState<LeadSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingIntegration, setEditingIntegration] = useState<Integration | null>(null);
  const [formData, setFormData] = useState({
    service_name: '',
    credentials: {} as Record<string, string>,
  });

  const supabase = createClient();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userProfile } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (!userProfile) return;

      const [integrationsResult, leadSourcesResult] = await Promise.all([
        supabase
          .from('organization_secrets')
          .select('id, service_name, is_active, created_at')
          .eq('organization_id', userProfile.organization_id),
        supabase
          .from('lead_sources')
          .select('*')
          .eq('organization_id', userProfile.organization_id)
      ]);

      setIntegrations(integrationsResult.data || []);
      setLeadSources(leadSourcesResult.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userProfile } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (!userProfile) return;

      if (editingIntegration) {
        // Update existing integration
        const { error } = await supabase
          .from('organization_secrets')
          .update({
            encrypted_credentials: formData.credentials,
          })
          .eq('id', editingIntegration.id);

        if (error) {
          toast.error('Error updating integration');
        } else {
          toast.success('Integration updated successfully');
        }
      } else {
        // Create new integration
        const { error } = await supabase
          .from('organization_secrets')
          .insert({
            organization_id: userProfile.organization_id,
            service_name: formData.service_name,
            encrypted_credentials: formData.credentials,
          });

        if (error) {
          toast.error('Error creating integration');
        } else {
          toast.success('Integration created successfully');
        }
      }

      setIsDialogOpen(false);
      setEditingIntegration(null);
      setFormData({ service_name: '', credentials: {} });
      fetchData();
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const toggleIntegration = async (id: string, isActive: boolean) => {
    const { error } = await supabase
      .from('organization_secrets')
      .update({ is_active: !isActive })
      .eq('id', id);

    if (error) {
      toast.error('Error updating integration status');
    } else {
      toast.success('Integration status updated');
      fetchData();
    }
  };

  const deleteIntegration = async (id: string) => {
    const { error } = await supabase
      .from('organization_secrets')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Error deleting integration');
    } else {
      toast.success('Integration deleted successfully');
      fetchData();
    }
  };

  const createLeadSource = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userProfile } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (!userProfile) return;

      const { error } = await supabase
        .from('lead_sources')
        .insert({
          organization_id: userProfile.organization_id,
          name: 'Facebook Lead Ads',
          source_type: 'facebook',
          webhook_token: crypto.randomUUID(),
        });

      if (error) {
        toast.error('Error creating lead source');
      } else {
        toast.success('Lead source created successfully');
        fetchData();
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    }
  };

  const getIntegrationIcon = (serviceName: string) => {
    switch (serviceName) {
      case 'twilio': return MessageSquare;
      case 'google_calendar': return Calendar;
      case 'email': return Mail;
      case 'claude': return Brain;
      default: return Settings;
    }
  };

  const integrationConfigs = {
    twilio: {
      name: 'Twilio WhatsApp',
      description: 'Send and receive WhatsApp messages',
      fields: ['account_sid', 'auth_token', 'whatsapp_number']
    },
    google_calendar: {
      name: 'Google Calendar',
      description: 'Schedule meetings and create Google Meet links',
      fields: ['client_id', 'client_secret', 'refresh_token']
    },
    email: {
      name: 'Email Service',
      description: 'Send booking confirmations and reminders',
      fields: ['api_key', 'from_email']
    },
    claude: {
      name: 'Claude AI',
      description: 'Power intelligent conversations',
      fields: ['api_key']
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Integrations</h1>
          <p className="text-muted-foreground">
            Connect external services to power your lead conversion system
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Integration
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingIntegration ? 'Edit Integration' : 'Add Integration'}
              </DialogTitle>
              <DialogDescription>
                Configure your service credentials securely
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="service_name">Service</Label>
                <select
                  id="service_name"
                  value={formData.service_name}
                  onChange={(e) => setFormData({ ...formData, service_name: e.target.value })}
                  className="w-full p-2 border rounded-md"
                  disabled={!!editingIntegration}
                  required
                >
                  <option value="">Select a service</option>
                  {Object.entries(integrationConfigs).map(([key, config]) => (
                    <option key={key} value={key}>{config.name}</option>
                  ))}
                </select>
              </div>
              
              {formData.service_name && (
                <div className="space-y-4">
                  <h4 className="font-medium">Credentials</h4>
                  {integrationConfigs[formData.service_name as keyof typeof integrationConfigs]?.fields.map((field) => (
                    <div key={field} className="space-y-2">
                      <Label htmlFor={field}>{field.replace('_', ' ').toUpperCase()}</Label>
                      <Input
                        id={field}
                        type={field.includes('secret') || field.includes('token') || field.includes('key') ? 'password' : 'text'}
                        value={formData.credentials[field] || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          credentials: { ...formData.credentials, [field]: e.target.value }
                        })}
                        required
                      />
                    </div>
                  ))}
                </div>
              )}
              
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Saving...' : editingIntegration ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Active Integrations */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Object.entries(integrationConfigs).map(([key, config]) => {
          const integration = integrations.find(i => i.service_name === key);
          const Icon = getIntegrationIcon(key);
          
          return (
            <Card key={key}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center space-x-2">
                  <Icon className="h-5 w-5" />
                  <CardTitle className="text-lg">{config.name}</CardTitle>
                </div>
                {integration ? (
                  <Badge variant={integration.is_active ? 'default' : 'secondary'}>
                    {integration.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                ) : (
                  <Badge variant="outline">Not Connected</Badge>
                )}
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-4">
                  {config.description}
                </CardDescription>
                
                <div className="flex space-x-2">
                  {integration ? (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleIntegration(integration.id, integration.is_active)}
                      >
                        {integration.is_active ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingIntegration(integration);
                          setFormData({ service_name: integration.service_name, credentials: {} });
                          setIsDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="outline">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Integration</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this integration? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteIntegration(integration.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => {
                        setFormData({ service_name: key, credentials: {} });
                        setIsDialogOpen(true);
                      }}
                    >
                      Connect
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Lead Sources */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Lead Sources</CardTitle>
            <CardDescription>
              Webhook endpoints for capturing leads from external sources
            </CardDescription>
          </div>
          <Button onClick={createLeadSource}>
            <Plus className="mr-2 h-4 w-4" />
            Add Source
          </Button>
        </CardHeader>
        <CardContent>
          {leadSources.length > 0 ? (
            <div className="space-y-4">
              {leadSources.map((source) => (
                <div key={source.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Facebook className="h-5 w-5" />
                      <h4 className="font-medium">{source.name}</h4>
                      <Badge variant={source.is_active ? 'default' : 'secondary'}>
                        {source.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Created {new Date(source.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div>
                      <Label className="text-xs">Webhook URL</Label>
                      <div className="flex items-center space-x-2">
                        <Input
                          value={`${window.location.origin}/api/webhooks/facebook/${source.webhook_token}`}
                          readOnly
                          className="text-xs"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            navigator.clipboard.writeText(`${window.location.origin}/api/webhooks/facebook/${source.webhook_token}`);
                            toast.success('Webhook URL copied to clipboard');
                          }}
                        >
                          Copy
                        </Button>
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-xs">Verification Token</Label>
                      <div className="flex items-center space-x-2">
                        <Input
                          value={source.webhook_token}
                          readOnly
                          className="text-xs"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            navigator.clipboard.writeText(source.webhook_token);
                            toast.success('Token copied to clipboard');
                          }}
                        >
                          Copy
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Facebook className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No lead sources configured</h3>
              <p className="text-gray-500 mb-4">
                Add a lead source to start receiving leads from Facebook Lead Ads
              </p>
              <Button onClick={createLeadSource}>
                <Plus className="mr-2 h-4 w-4" />
                Create Lead Source
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}