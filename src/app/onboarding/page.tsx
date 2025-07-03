'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { generateSlug } from '@/lib/utils';

export default function OnboardingPage() {
  const [organizationName, setOrganizationName] = useState('');
  const [domain, setDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const supabase = createClient();

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError('User not authenticated');
        setLoading(false);
        return;
      }

      // Create organization
      const { data: organization, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: organizationName,
          domain: domain || generateSlug(organizationName),
        })
        .select()
        .single();

      if (orgError) {
        setError(orgError.message);
        setLoading(false);
        return;
      }

      // Create user profile
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: user.id,
          organization_id: organization.id,
          email: user.email!,
          name: user.user_metadata.name || '',
          role: 'owner',
        });

      if (profileError) {
        setError(profileError.message);
        setLoading(false);
        return;
      }

      // Create default lead source
      const { error: leadSourceError } = await supabase
        .from('lead_sources')
        .insert({
          organization_id: organization.id,
          name: 'Facebook Lead Ads',
          source_type: 'facebook',
          webhook_token: crypto.randomUUID(),
        });

      if (leadSourceError) {
        console.error('Error creating lead source:', leadSourceError);
        // Don't fail the onboarding for this
      }

      router.push('/dashboard');
    } catch (error) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Set Up Your Organization</CardTitle>
          <CardDescription>
            Let's get your gym set up with the lead conversion system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="organizationName">Gym/Business Name</Label>
              <Input
                id="organizationName"
                type="text"
                placeholder="e.g., FitLife Gym"
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="domain">Domain (optional)</Label>
              <Input
                id="domain"
                type="text"
                placeholder="e.g., fitlife-gym"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
              />
              <p className="text-sm text-gray-500">
                Leave blank to auto-generate from business name
              </p>
            </div>
            {error && (
              <div className="text-red-500 text-sm">{error}</div>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Setting up...' : 'Complete Setup'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}