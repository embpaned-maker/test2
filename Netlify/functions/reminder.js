export default async (req) => {
  const BOT_TOKEN = process.env.TG_BOT_TOKEN;

  try {
    const { initializeApp, cert, getApps } = await import("firebase-admin/app");
    const { getFirestore } = await import("firebase-admin/firestore");

    if (!getApps().length) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_CREDENTIALS || "{}");
      initializeApp({ credential: cert(serviceAccount) });
    }
    const db = getFirestore();

    const now        = new Date();
    const oneHourAgo = new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString();
    const fiveHrsAgo = new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString();

    const snapshot = await db.collection("rezervari")
      .where("status", "==", "nou")
      .get();

    let sent = 0;

    for (const doc of snapshot.docs) {
      const data      = doc.data();
      const createdAt = data.created_at;

      // ── Reminder 1: după 1 oră ──
      if (createdAt <= oneHourAgo && !data.reminder1_sent) {
        const msg =
          `⏰ *REMINDER #1 — Cerere #${data.requestId}*\n\n` +
          `👤 ${data.name} — 📞 ${data.phone}\n` +
          `📅 ${data.event_date || "—"} | ${data.event_type || "—"}\n\n` +
          `⚠️ _Nu ai confirmat această cerere de *1 oră*!_\n\n` +
          `/confirmat_${data.requestId} — am contactat ✅\n` +
          `/refuzat_${data.requestId} — refuzat ❌`;

        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id:     data.chat_id,
            text:        msg,
            parse_mode:  "Markdown",
            reply_markup: {
              inline_keyboard: [[
                { text: "✅ Confirmat", callback_data: `confirmat_${data.requestId}` },
                { text: "❌ Refuzat",  callback_data: `refuzat_${data.requestId}`  }
              ]]
            }
          })
        });

        await doc.ref.update({ reminder1_sent: true });
        sent++;
      }

      // ── Reminder 2: după 5 ore ──
      if (createdAt <= fiveHrsAgo && !data.reminder2_sent) {
        const msg =
          `🚨 *REMINDER #2 — Cerere #${data.requestId}*\n\n` +
          `👤 ${data.name} — 📞 ${data.phone}\n` +
          `📅 ${data.event_date || "—"} | ${data.event_type || "—"}\n\n` +
          `🔴 _Cerere necontactată de *5 ore*! Riști să pierzi clientul!_\n\n` +
          `/confirmat_${data.requestId} — am contactat ✅\n` +
          `/refuzat_${data.requestId} — refuzat ❌`;

        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id:     data.chat_id,
            text:        msg,
            parse_mode:  "Markdown",
            reply_markup: {
              inline_keyboard: [[
                { text: "✅ Confirmat", callback_data: `confirmat_${data.requestId}` },
                { text: "❌ Refuzat",  callback_data: `refuzat_${data.requestId}`  }
              ]]
            }
          })
        });

        await doc.ref.update({ reminder2_sent: true });
        sent++;
      }
    }

    return new Response(JSON.stringify({ ok: true, reminders_sent: sent }));
  } catch (err) {
    console.error("Reminder error:", err);
    return new Response(JSON.stringify({ ok: false, error: err.message }), { status: 500 });
  }
};

export const config = {
  schedule: "*/15 * * * *"  // verifică la fiecare 15 minute
};
