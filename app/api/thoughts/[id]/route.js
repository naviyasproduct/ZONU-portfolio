import { NextResponse } from 'next/server';
import { adminDb } from '../../../../lib/firebaseAdmin';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    
    const docRef = adminDb.collection('thoughts').doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json(
        { success: false, error: 'Thought not found' },
        { status: 404 }
      );
    }

    const data = docSnap.data();
    const thought = {
      id: docSnap.id,
      ...data,
      createdAt: data.createdAt?._seconds ? new Date(data.createdAt._seconds * 1000).toISOString() : null,
      updatedAt: data.updatedAt?._seconds ? new Date(data.updatedAt._seconds * 1000).toISOString() : null,
    };

    return NextResponse.json({ success: true, thought });
  } catch (error) {
    console.error('Error fetching thought:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, blocks } = body;

    if (!title || !title.trim()) {
      return NextResponse.json(
        { success: false, error: 'Title is required' },
        { status: 400 }
      );
    }

    const docRef = adminDb.collection('thoughts').doc(id);
    
    // Check if document exists
    const docSnap = await docRef.get();
    if (!docSnap.exists) {
      return NextResponse.json(
        { success: false, error: 'Thought not found' },
        { status: 404 }
      );
    }

    await docRef.update({
      title: title.trim(),
      blocks: blocks || [],
      updatedAt: new Date(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating thought:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
