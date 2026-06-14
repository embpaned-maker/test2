import { NextResponse } from 'next/server';

export async function POST(request) {
  const BOT_TOKEN = process.env.TG_BOT_TOKEN;
  const CHAT_IDS = process.env.TG_CHAT_ID ? process.env.TG_CHAT_ID.split(',').map(id => id.trim()) : [];

  try {
    const body = await request.json();
    const { name, phone, email, event_type, event_date, package: pkg, guests, message, is_offer } = body;

    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';

    // 1. Initializează Firebase devreme pentru verificarea rate-limit-ului
    const firebaseCreds = process.env.FIREBASE_CREDENTIALS;
    let db = null;
    if (firebaseCreds) {
      try {
        const { initializeApp, cert, getApps } = await import("firebase-admin/app");
        const { getFirestore } = await import("firebase-admin/firestore");

        if (!getApps().length) {
          initializeApp({ credential: cert(JSON.parse(firebaseCreds)) });
        }
        db = getFirestore();
      } catch (fbErr) {
        console.warn("Firebase init failed:", fbErr.message);
      }
    }

    // 2. Verificare Rate Limit (maxim 3 cereri pe oră de pe același IP)
    if (db && ip !== '127.0.0.1') {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const ipSnap = await db.collection("rezervari")
        .where("client_ip", "==", ip)
        .where("created_at", ">=", oneHourAgo)
        .get();

      if (ipSnap.size >= 3) {
        return NextResponse.json({ 
          ok: false, 
          error: "Prea multe încercări. Te rugăm să ne contactezi direct la numărul 060225455 sau să încerci mai târziu." 
        }, { status: 429 });
      }
    }

    function formatDate(iso) {
      if (!iso) return "—";
      const [y, m, d] = iso.split("-");
      return `${d}.${m}.${y}`;
    }

    const requestId = Date.now().toString(36).toUpperCase();

    const text = is_offer
      ? `📩 *SOLICITARE OFERTĂ #${requestId}*\n\n` +
        `👤 *Nume:* ${name || "—"}\n` +
        `📞 *Telefon:* ${phone || "—"}\n` +
        `📧 *Email:* ${email || "—"}\n` +
        `💬 *Mesaj:* ${message || "—"}\n\n` +
        `⏰ _${new Date().toLocaleString("ro-RO")}_\n\n` +
        `━━━━━━━━━━━━━━━━━━\n` +
        `✅ /confirmat\\_${requestId}\n` +
        `❌ /refuzat\\_${requestId}\n\n` +
        `⚠️ _Reminder în 1h dacă nu răspunzi!_`
      : `🎉 *REZERVARE NOUĂ #${requestId}*\n\n` +
        `👤 *Nume:* ${name || "—"}\n` +
        `📞 *Telefon:* ${phone || "—"}\n` +
        `📧 *Email:* ${email || "—"}\n` +
        `🎊 *Tip eveniment:* ${event_type || "—"}\n` +
        `📅 *Data:* ${formatDate(event_date)}\n` +
        `📦 *Pachet:* ${pkg || "—"}\n` +
        `👥 *Nr. invitați:* ${guests || "—"}\n` +
        `💬 *Mesaj:* ${message || "—"}\n\n` +
        `⏰ _${new Date().toLocaleString("ro-RO")}_\n\n` +
        `━━━━━━━━━━━━━━━━━━\n` +
        `✅ /confirmat\\_${requestId}\n` +
        `❌ /refuzat\\_${requestId}\n\n` +
        `⚠️ _Reminder în 1h dacă nu răspunzi!_`;

    // Trimite mesaj Telegram către toți
    const sendPromises = CHAT_IDS.map(chat_id => 
      fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chat_id,
          text,
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [[
              { text: "✅ Confirmat", callback_data: `confirmat_${requestId}` },
              { text: "❌ Refuzat",  callback_data: `refuzat_${requestId}` }
            ]]
          }
        })
      }).then(res => res.json())
    );

    const results = await Promise.all(sendPromises);
    const successfulSends = results.filter(data => data.ok);
    
    if (successfulSends.length === 0) {
      const firstFailed = results.find(data => !data.ok);
      throw new Error(firstFailed?.description || "Failed to send message to Telegram");
    }

    // 3. Salvează în Firebase pentru remindere
    if (db) {
      try {
        const successfulChatIds = [];
        const successfulMessageIds = [];
        results.forEach((r, idx) => {
          if (r.ok && r.result) {
            successfulChatIds.push(CHAT_IDS[idx]);
            successfulMessageIds.push(r.result.message_id);
          }
        });

        await db.collection("rezervari").doc(requestId).set({
          requestId,
          name:          name || "",
          phone:         phone || "",
          email:         email || "",
          event_type:    event_type || "",
          event_date:    event_date || "",
          package:       pkg || "",
          guests:        guests || "",
          message:       message || "",
          is_offer:      is_offer || false,
          status:        "nou",
          created_at:    new Date().toISOString(),
          message_ids:   successfulMessageIds,
          chat_ids:      successfulChatIds,
          reminder1_sent: false,
          reminder2_sent: false,
          client_ip:     ip
        });
      } catch (fbErr) {
        console.warn("Firebase save failed (non-critical):", fbErr.message);
      }
    }

    return NextResponse.json({ ok: true, requestId });

  } catch (err) {
    console.error("Error:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
