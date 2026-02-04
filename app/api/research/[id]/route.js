import { NextResponse } from 'next/server';
import { adminDb } from '../../../../lib/firebaseAdmin';

function toIso(value) {
  if (!value) return null;
  try {
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return new Date(value).toISOString();

    const seconds = value?._seconds ?? value?.seconds;
    if (typeof seconds === 'number') return new Date(seconds * 1000).toISOString();

    if (value instanceof Date) return value.toISOString();
  } catch {
    // ignore
  }
  return null;
}

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const ref = adminDb.collection('research').doc(String(id));
    const snap = await ref.get();

    if (!snap.exists) {
      return NextResponse.json({ success: false, error: 'Research item not found' }, { status: 404 });
    }

    const data = snap.data() || {};
    const item = {
      id: snap.id,
      ...data,
      createdAt: toIso(data.createdAt || data.publishedAt),
      updatedAt: toIso(data.updatedAt),
    };

    return NextResponse.json({ success: true, item });
  } catch (error) {
    console.error('Error fetching research item:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
