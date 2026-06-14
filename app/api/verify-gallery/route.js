import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export async function POST(request) {
  try {
    const { code, date } = await request.json();
    if (!code || !date) {
      return NextResponse.json({ ok: false, error: 'Cod sau dată lipsă' }, { status: 400 });
    }

    const docRef = doc(db, 'galerii', code);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return NextResponse.json({ ok: false, error: 'Cod sau dată incorectă' });
    }

    const rawData = docSnap.data();
    
    // Creăm un obiect nou cu toate cheile cu litere mici ca să nu avem probleme cu Date vs date sau Link vs link
    const data = Object.keys(rawData).reduce((acc, key) => {
      acc[key.toLowerCase()] = rawData[key];
      return acc;
    }, {});
    
    // Client sends date as YYYY-MM-DD from <input type="date">
    // Make sure we match both YYYY-MM-DD and DD.MM.YYYY (which the user typed)
    const [y, m, d] = date.split('-');
    const alternateDate = `${d}.${m}.${y}`; // "14.06.2025"
    
    if (data.date !== date && data.date !== alternateDate) {
      return NextResponse.json({ ok: false, error: 'Cod sau dată incorectă' });
    }

    const finalLink = data.link || data.Link || data.url || data.URL;

    if (!finalLink) {
      return NextResponse.json({ ok: false, error: 'Galeria încă nu este disponibilă' });
    }

    return NextResponse.json({ ok: true, url: finalLink });

  } catch (err) {
    console.error("Gallery verify error:", err);
    return NextResponse.json({ ok: false, error: 'Eroare server. Încearcă mai târziu.' }, { status: 500 });
  }
}
