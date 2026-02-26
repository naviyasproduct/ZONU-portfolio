import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { adminDb } from '../../../../../lib/firebaseAdmin';
import admin from 'firebase-admin';

function cleanString(value) {
  const s = typeof value === 'string' ? value.trim() : '';
  return s ? s : '';
}

export async function POST(req) {
  const cookieStore = await cookies();
  const isAdmin = cookieStore.get('admin-authenticated')?.value === 'true';
  if (!isAdmin) return NextResponse.json({ success: false, error: 'unauthorized' }, { status: 401 });

  try {
    const body = await req.json();

    const eventDate = cleanString(body.eventDate);
    const title = cleanString(body.title);
    const shortDescription = cleanString(body.shortDescription);
    const description = cleanString(body.description);
    const image = cleanString(body.image);
    const dateNumber = Number(new Date(eventDate).getTime());

    if (!eventDate || !Number.isFinite(dateNumber)) {
      return NextResponse.json({ success: false, error: 'Valid date is required' }, { status: 400 });
    }
    if (!title) {
      return NextResponse.json({ success: false, error: 'Title is required' }, { status: 400 });
    }
    if (!shortDescription) {
      return NextResponse.json({ success: false, error: 'Short description is required' }, { status: 400 });
    }
    if (!description) {
      return NextResponse.json({ success: false, error: 'Description is required' }, { status: 400 });
    }
    if (!image) {
      return NextResponse.json({ success: false, error: 'Image is required' }, { status: 400 });
    }

    const docRef = await adminDb.collection('timelineEvents').add({
      eventDate,
      dateNumber,
      title,
      shortDescription,
      description,
      image,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ success: true, id: docRef.id });
  } catch (err) {
    console.error('Admin timeline create error:', err);
    return NextResponse.json({ success: false, error: err.message || String(err) }, { status: 500 });
  }
}
