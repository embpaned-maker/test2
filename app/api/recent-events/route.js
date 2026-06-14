import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

export async function GET() {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    
    // Fetch all calendar docs, then filter in memory
    const calSnap = await getDocs(collection(db, 'calendar'));
    
    const events = [];
    calSnap.forEach(doc => {
      const data = doc.data();
      // Only past/today events with a display name
      if (data.status === 'ocupat' && data.displayName && doc.id <= todayStr) {
        events.push({
          id: doc.id,
          date: doc.id,
          eventType: data.eventType || '',
          displayName: data.displayName,
          emoji: data.emoji || '✨'
          // NO internalNotes returned!
        });
      }
    });

    // Sort descending by date
    events.sort((a, b) => b.date.localeCompare(a.date));

    // Returnăm doar primele 3
    return NextResponse.json({ ok: true, events: events.slice(0, 3) });
  } catch (err) {
    console.error('Error fetching recent events:', err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
