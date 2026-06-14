exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const BOT_TOKEN = process.env.TG_BOT_TOKEN;
  const CHAT_ID   = process.env.TG_CHAT_ID;

  try {
    const body = JSON.parse(event.body);
    const { name, phone, email, event_type, event_date, package: pkg, guests, message, is_offer } = body;

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

    // Trimite mesaj Telegram
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id:    CHAT_ID,
        text,
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [[
            { text: "✅ Confirmat", callback_data: `confirmat_${requestId}` },
            { text: "❌ Refuzat",  callback_data: `refuzat_${requestId}` }
          ]]
        }
      })
    });

    const data = await res.json();
    if (!data.ok) throw new Error(data.description);

    // Salvează în Firebase pentru remindere (doar dacă avem credentials)
    const firebaseCreds = process.env.FIREBASE_CREDENTIALS;
    if (firebaseCreds) {
      try {
        const { initializeApp, cert, getApps } = await import("firebase-admin/app");
        const { getFirestore } = await import("firebase-admin/firestore");

        if (!getApps().length) {
          initializeApp({ credential: cert(JSON.parse(firebaseCreds)) });
        }
        const db = getFirestore();

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
          message_id:    data.result.message_id,
          chat_id:       CHAT_ID,
          reminder1_sent: false,
          reminder2_sent: false,
        });
      } catch (fbErr) {
        console.warn("Firebase save failed (non-critical):", fbErr.message);
      }
    }

    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ ok: true, requestId })
    };

  } catch (err) {
    console.error("Error:", err);
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ ok: false, error: err.message })
    };
  }
};
