import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { cache } from 'react';
import { Database } from '@/types/db';

export const createServerSupabaseClient = cache(() => {
  const myCookies = cookies();
  return createServerComponentClient<Database>({ cookies: () => myCookies });
});

export async function getSession() {
  const supabase = createServerSupabaseClient();
  try {
    const { data } = await supabase.auth.getSession();
    return data.session;
  } catch (error) {
    console.error('getSession error:', error);
    return;
  }
}

export async function getUser() {
  const supabase = createServerSupabaseClient();
  try {
    const { data } = await supabase.auth.getUser();
    return data.user;
  } catch (error) {
    console.error('getUser error:', error);
    return;
  }
}

export async function getSubscription() {
  const supabase = createServerSupabaseClient();
  try {
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*, prices(*, products(*))')
      .in('status', ['trialing', 'active'])
      .maybeSingle()
      .throwOnError();
    return subscription;
  } catch (error) {
    console.error('getSubscription error:', error);
    return;
  }
}

export async function getUserJokes() {
  const supabase = createServerSupabaseClient();
  try {
    const { data: userData } = await supabase.auth.getUser();
    const { user } = userData;
    if (user == null) return;

    const { data: jokes } = await supabase
      .from('saved_jokes')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    return jokes ?? [];
  } catch (error) {
    console.error('getUserJokes error:', error);
    return;
  }
}
