import { NextResponse } from 'next/server';
import { adminDb } from '../../../../../lib/firebaseAdmin';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    
    const commentsSnap = await adminDb.collection('comments')
      .where('thoughtId', '==', id)
      .get();
    
    const comments = commentsSnap.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?._seconds ? new Date(data.createdAt._seconds * 1000).toISOString() : new Date().toISOString(),
      };
    });

    // Sort by newest first
    comments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return NextResponse.json({ success: true, comments });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
