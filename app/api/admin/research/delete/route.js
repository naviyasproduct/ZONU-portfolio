import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { adminDb } from '../../../../../lib/firebaseAdmin';

export async function POST(req) {
  const cookieStore = await cookies();
  const isAdmin = cookieStore.get('admin-authenticated')?.value === 'true';
  if (!isAdmin) return NextResponse.json({ success: false, error: 'unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const id = body?.id ? String(body.id) : '';
    const coverUrl = body?.coverUrl ? String(body.coverUrl) : '';

    if (!id) return NextResponse.json({ success: false, error: 'missing id' }, { status: 400 });

    await adminDb.collection('research').doc(id).delete();

    if (coverUrl) {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_VERCEL_URL || 'http://localhost:3000'}/api/cloudinary/delete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: coverUrl }),
        });
      } catch (cloudinaryErr) {
        console.warn('Cloudinary delete failed (non-fatal):', cloudinaryErr);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Admin research delete error:', err);
    return NextResponse.json({ success: false, error: err.message || String(err) }, { status: 500 });
  }
}
