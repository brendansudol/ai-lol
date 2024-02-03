import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { Database } from '@/types/db';

export async function POST(req: NextRequest) {
  if (req.method !== 'POST') return errorResponse('Unknown', 405);

  const { id, punchlineIndex } = await req.json();

  if (id == null || punchlineIndex == null) {
    return errorResponse('Invalid inputs');
  }

  const supabase = createRouteHandlerClient<Database>({ cookies });
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;

  if (userId == null) {
    return errorResponse('Must be signed in');
  }

  const { data: jokes } = await supabase
    .from('generated_jokes')
    .select('*')
    .eq('id', id);

  const [joke] = jokes ?? [];

  if (joke == null || joke['user_id'] !== userId) {
    return errorResponse('Invalid joke');
  }

  const { setup, results } = joke;
  const punchline = Array.isArray(results)
    ? (results[punchlineIndex] as string)
    : undefined;

  if (punchline == null) {
    return errorResponse('No punchline');
  }

  const newEntry = { gen_joke_id: id, user_id: userId, setup, punchline };
  const { data, error } = await supabase
    .from('saved_jokes')
    .insert([newEntry])
    .select('*')
    .single();

  if (error != null) {
    console.log(error);
    return errorResponse('Error saving joke');
  }

  return NextResponse.json({ status: 'success', data });
}

function errorResponse(reason: string, status = 500) {
  return NextResponse.json({ status: 'error', reason }, { status });
}
