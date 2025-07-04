import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    console.log('Test upload endpoint called');
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    console.log('File received:', {
      name: file.name,
      size: file.size,
      type: file.type
    });

    // Test Supabase connection
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    console.log('User auth status:', { user: !!user, error: userError?.message });

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Test storage bucket access
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    console.log('Available buckets:', buckets?.map(b => b.name), bucketError?.message);

    return NextResponse.json({
      success: true,
      message: 'Test upload successful',
      file: {
        name: file.name,
        size: file.size,
        type: file.type
      },
      user: !!user,
      buckets: buckets?.map(b => b.name) || []
    });

  } catch (error) {
    console.error('Test upload error:', error);
    return NextResponse.json({
      error: 'Test upload failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}