import { createClient } from '@/lib/supabase/server';
import { Database } from '@/types/database';
import { redirect } from 'next/navigation';

export async function getUser() {
  const supabase = await createClient();
  
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return null;
  }
  
  return user;
}

export async function getUserProfile() {
  const supabase = await createClient();
  
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    return null;
  }
  
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('*, organization:organizations(*)')
    .eq('id', user.id)
    .single();
  
  if (profileError) {
    return null;
  }
  
  return {
    ...user,
    profile,
  };
}

export async function requireAuth() {
  const user = await getUser();
  
  if (!user) {
    redirect('/login');
  }
  
  return user;
}

export async function requireOrganization() {
  const userProfile = await getUserProfile();
  
  if (!userProfile || !userProfile.profile?.organization_id) {
    redirect('/onboarding');
  }
  
  return userProfile;
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}