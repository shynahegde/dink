export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { getAuthUser } from '@/lib/auth';

// GET /api/data?collection=tournaments
export async function GET(request) {
  try {
    const user = getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const collection = searchParams.get('collection');

    if (!['tournaments', 'partners', 'matches', 'gear'].includes(collection)) {
      return NextResponse.json({ error: 'Invalid collection' }, { status: 400 });
    }

    const db = getAdminDb();
    const snapshot = await db
      .collection('users')
      .doc(user.uid)
      .collection(collection)
      .orderBy('createdAt', 'desc')
      .get();

    const items = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ items });
  } catch (error) {
    console.error('Data fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}

// POST /api/data  { collection: "tournaments", data: { ... } }
export async function POST(request) {
  try {
    const user = getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { collection, data } = await request.json();

    if (!['tournaments', 'partners', 'matches', 'gear'].includes(collection)) {
      return NextResponse.json({ error: 'Invalid collection' }, { status: 400 });
    }

    const db = getAdminDb();
    const docRef = await db
      .collection('users')
      .doc(user.uid)
      .collection(collection)
      .add({
        ...data,
        createdAt: new Date().toISOString(),
      });

    return NextResponse.json({ id: docRef.id, ...data });
  } catch (error) {
    console.error('Data create error:', error);
    return NextResponse.json({ error: 'Failed to create' }, { status: 500 });
  }
}

// PUT /api/data  { collection, id, data }
export async function PUT(request) {
  try {
    const user = getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { collection, id, data } = await request.json();

    if (!['tournaments', 'partners', 'matches', 'gear'].includes(collection)) {
      return NextResponse.json({ error: 'Invalid collection' }, { status: 400 });
    }

    const db = getAdminDb();
    await db
      .collection('users')
      .doc(user.uid)
      .collection(collection)
      .doc(id)
      .update({
        ...data,
        updatedAt: new Date().toISOString(),
      });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Data update error:', error);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}

// DELETE /api/data?collection=tournaments&id=abc123
export async function DELETE(request) {
  try {
    const user = getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const collection = searchParams.get('collection');
    const id = searchParams.get('id');

    if (!['tournaments', 'partners', 'matches', 'gear'].includes(collection) || !id) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const db = getAdminDb();
    await db
      .collection('users')
      .doc(user.uid)
      .collection(collection)
      .doc(id)
      .delete();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Data delete error:', error);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
