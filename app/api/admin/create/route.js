import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { adminDb } from '../../../../lib/firebaseAdmin';
import admin from 'firebase-admin';

// Server-side Firebase Admin SDK write endpoint
// This endpoint expects a POST with JSON: { title, content, mediaUrl, mediaType, additionalMedia }
// It verifies the isAdmin cookie (set by /api/auth/login) and writes to Firestore

export async function POST(req) {
  const cookieStore = await cookies();
  const isAdmin = cookieStore.get('admin-authenticated')?.value === 'true';
  if (!isAdmin) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = await req.json();
  const { title, content, mediaUrl, mediaType, additionalMedia } = body;

  try {
    console.log('💾 Saving to Firestore:', {
      title,
      contentLength: content?.length,
      hasMediaUrl: !!mediaUrl,
      additionalMediaCount: Array.isArray(additionalMedia) ? additionalMedia.length : 0,
    });
    
    const docRef = await adminDb.collection('thoughts').add({
      title: title || null,
      content: content || null,
      mediaUrl: mediaUrl || null,
      mediaType: mediaType || null,
      additionalMedia: additionalMedia || [],  // Default to empty array instead of null
      likeCount: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    console.log('✅ Successfully saved with ID:', docRef.id);
    return NextResponse.json({ id: docRef.id });
  } catch (err) {
    console.error('❌ Admin create error:', err?.message || err);
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}

