import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

function driveToDirectUrl(url) {
  if (!url) return null;
  // Extract file ID from various Drive URL formats
  const match = url.match(/(?:\/d\/|id=)([a-zA-Z0-9_-]+)/);
  if (match) {
    return `https://lh3.googleusercontent.com/d/${match[1]}`;
  }
  return url;
}

export async function GET() {
  try {
    const snapshot = await getDocs(collection(db, 'galerie-categorii'));
    const categories = {};

    snapshot.forEach((doc) => {
      const raw = doc.data();
      // Normalize all keys to lowercase
      const data = Object.keys(raw).reduce((acc, key) => {
        acc[key.toLowerCase()] = raw[key];
        return acc;
      }, {});

      // Collect photos: supports both array field and photo1/photo2/... fields
      let photos = [];
      if (Array.isArray(data.photos)) {
        photos = data.photos.map(driveToDirectUrl).filter(Boolean);
      } else {
        // Support photo1, photo2, photo3, ... up to photo20
        for (let i = 1; i <= 20; i++) {
          const val = data[`photo${i}`];
          if (val) photos.push(driveToDirectUrl(val));
        }
      }

      categories[doc.id] = {
        cover: driveToDirectUrl(data.cover) || photos[0] || null,
        photos,
        label: data.label || doc.id,
      };
    });

    return NextResponse.json({ ok: true, categories });
  } catch (err) {
    console.error('Gallery fetch error:', err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
