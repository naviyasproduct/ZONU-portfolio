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

    if (!id) return NextResponse.json({ success: false, error: 'missing id' }, { status: 400 });

    await adminDb.collection('timelineEvents').doc(id).delete();
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Admin timeline delete error:', err);
    return NextResponse.json({ success: false, error: err.message || String(err) }, { status: 500 });
  }
}
