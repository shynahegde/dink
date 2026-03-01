export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const radius = searchParams.get('radius') || '25000';

    if (!lat || !lng) {
      return NextResponse.json({ error: 'lat and lng required' }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    // Search for pickleball courts nearby
    const placesUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&keyword=pickleball+courts&key=${apiKey}`;

    const res = await fetch(placesUrl);
    const data = await res.json();

    // Transform results
    const courts = (data.results || []).map((place) => ({
      id: place.place_id,
      name: place.name,
      address: place.vicinity,
      lat: place.geometry.location.lat,
      lng: place.geometry.location.lng,
      rating: place.rating || null,
      totalRatings: place.user_ratings_total || 0,
      open: place.opening_hours?.open_now || null,
      photo: place.photos?.[0]
        ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${place.photos[0].photo_reference}&key=${apiKey}`
        : null,
    }));

    return NextResponse.json({ courts, total: courts.length });
  } catch (error) {
    console.error('Courts search error:', error);
    return NextResponse.json({ error: 'Failed to search courts' }, { status: 500 });
  }
}
