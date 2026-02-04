import { NextResponse } from 'next/server';
import { adminDb } from '../../../lib/firebaseAdmin';

function toIso(value) {
  if (!value) return null;
  try {
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return new Date(value).toISOString();

    // Firestore admin Timestamp can expose _seconds or seconds
    const seconds = value?._seconds ?? value?.seconds;
    if (typeof seconds === 'number') return new Date(seconds * 1000).toISOString();

    if (value instanceof Date) return value.toISOString();
  } catch {
    // ignore
  }
  return null;
}

function serializeResearchDoc(docSnap) {
  const data = docSnap.data() || {};
  return {
    id: docSnap.id,
    ...data,
    createdAt: toIso(data.createdAt || data.publishedAt),
    updatedAt: toIso(data.updatedAt),
  };
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limitParam = Number(searchParams.get('limit') || '100');
    const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 250) : 100;

    const snap = await adminDb
      .collection('research')
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();

    const items = snap.docs.map(serializeResearchDoc);
    return NextResponse.json({ success: true, items });
  } catch (error) {
    console.error('Error fetching research list:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
