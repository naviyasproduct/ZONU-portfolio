import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { adminDb } from '../../../../../lib/firebaseAdmin';
import admin from 'firebase-admin';

function cleanString(value) {
  const s = typeof value === 'string' ? value.trim() : '';
  return s ? s : null;
}

function cleanStringArray(value) {
  if (!Array.isArray(value)) return [];
  return value.map((v) => (typeof v === 'string' ? v.trim() : '')).filter(Boolean);
}

function cleanObject(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value;
}

function cleanBlocks(value) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((b) => b && typeof b === 'object' && typeof b.type === 'string')
    .map((b) => {
      const type = String(b.type);
      if (type === 'divider') return { type: 'divider' };
      if (type === 'text') return { type: 'text', content: cleanString(b.content) };
      if (type === 'quote') {
        return {
          type: 'quote',
          content: cleanString(b.content),
          citation: cleanString(b.citation) || undefined,
        };
      }
      if (type === 'image' || type === 'video' || type === 'audio') {
        return {
          type,
          url: cleanString(b.url),
          alignment: cleanString(b.alignment) || 'center',
          widthPercent: Number.isFinite(Number(b.widthPercent)) ? Number(b.widthPercent) : 80,
          caption: cleanString(b.caption) || undefined,
          alt: cleanString(b.alt) || undefined,
        };
      }
      return null;
    })
    .filter(Boolean);
}

export async function POST(req) {
  const cookieStore = await cookies();
  const isAdmin = cookieStore.get('admin-authenticated')?.value === 'true';
  if (!isAdmin) return NextResponse.json({ success: false, error: 'unauthorized' }, { status: 401 });

  try {
    const body = await req.json();

    const title = cleanString(body.title);
    if (!title) return NextResponse.json({ success: false, error: 'Title is required' }, { status: 400 });

    const docRef = await adminDb.collection('research').add({
      title,
      subtitle: cleanString(body.subtitle),
      abstract: cleanString(body.abstract),
      category: cleanString(body.category),
      status: cleanString(body.status),

      tags: cleanStringArray(body.tags),
      takeaways: cleanStringArray(body.takeaways),
      links: cleanObject(body.links),

      coverUrl: cleanString(body.coverUrl),
      coverType: cleanString(body.coverType),

      blocks: cleanBlocks(body.blocks),

      methods: cleanString(body.methods),
      results: cleanString(body.results),
      writeup: cleanString(body.writeup),
      references: cleanString(body.references),

      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ success: true, id: docRef.id });
  } catch (err) {
    console.error('Admin research create error:', err);
    return NextResponse.json({ success: false, error: err.message || String(err) }, { status: 500 });
  }
}
