import { NextResponse } from 'next/server';
import { adminDb } from '../../../lib/firebaseAdmin';

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

function serializeTimelineDoc(docSnap) {
  const data = docSnap.data() || {};
  const fallbackDate = data.year ? `${String(data.year).trim()}-01-01` : '';
  return {
    id: docSnap.id,
    eventDate: String(data.eventDate || fallbackDate || ''),
    dateNumber: Number(data.dateNumber || data.yearNumber || 0),
    title: typeof data.title === 'string' ? data.title : '',
    shortDescription: typeof data.shortDescription === 'string' ? data.shortDescription : (typeof data.desc === 'string' ? data.desc : ''),
    description: typeof data.description === 'string' ? data.description : (typeof data.details === 'string' ? data.details : ''),
    image: typeof data.image === 'string' ? data.image : '',
    createdAt: toIso(data.createdAt),
    updatedAt: toIso(data.updatedAt),
  };
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limitParam = Number(searchParams.get('limit') || '100');
    const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 250) : 100;

    const snap = await adminDb
      .collection('timelineEvents')
      .orderBy('dateNumber', 'asc')
      .limit(limit)
      .get();

    const items = snap.docs.map(serializeTimelineDoc);
    return NextResponse.json({ success: true, items });
  } catch (error) {
    console.error('Error fetching timeline list:', error);
    return NextResponse.json({ success: false, error: error.message || String(error) }, { status: 500 });
  }
}
