const fs = require('fs');
const path = require('path');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Parse .env.local manually
const envPath = path.join(__dirname, '.env.local');
const envFileContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envFileContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let key = match[1];
    let value = match[2] || '';
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.substring(1, value.length - 1);
    }
    env[key] = value;
  }
});

if (!env.FIREBASE_CREDENTIALS) {
  console.error("FIREBASE_CREDENTIALS not found in env file!");
  process.exit(1);
}

try {
  const serviceAccount = JSON.parse(env.FIREBASE_CREDENTIALS);
  initializeApp({
    credential: cert(serviceAccount)
  });
  const db = getFirestore();

  async function check() {
    console.log("Checking reservation 'MQCU09NX'...");
    const docSnap = await db.collection("rezervari").doc("MQCU09NX").get();
    if (docSnap.exists) {
      console.log("Reservation MQCU09NX data:", docSnap.data());
    } else {
      console.log("Reservation MQCU09NX does NOT exist in Firestore!");
    }

    console.log("\nChecking calendar for '2026-07-20'...");
    const calSnap = await db.collection("calendar").doc("2026-07-20").get();
    if (calSnap.exists) {
      console.log("Calendar date 2026-07-20 data:", calSnap.data());
    } else {
      console.log("Calendar date 2026-07-20 is NOT occupied/found!");
    }

    console.log("\nListing last 5 reservations:");
    const lastSnap = await db.collection("rezervari")
      .orderBy("created_at", "desc")
      .limit(5)
      .get();
    lastSnap.forEach(d => {
      console.log(` - ID: ${d.id}, status: ${d.data().status}, name: ${d.data().name}, date: ${d.data().event_date}`);
    });
  }

  check().catch(console.error);
} catch (e) {
  console.error("Initialization error:", e.message);
}
