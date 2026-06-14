// Primește comenzile /confirmat_ID și /refuzat_ID de la Telegram
exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 200, body: "OK" };
  }

  const BOT_TOKEN = process.env.TG_BOT_TOKEN;

  try {
    const { initializeApp, cert, getApps } = await import("firebase-admin/app");
    const { getFirestore } = await import("firebase-admin/firestore");

    if (!getApps().length) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_CREDENTIALS || "{}");
      initializeApp({ credential: cert(serviceAccount) });
    }
    const db = getFirestore();

    const update = JSON.parse(event.body);

    // Gestionează callback de la butoane inline
    if (update.callback_query) {
      const cbData  = update.callback_query.data; // ex: "confirmat_ABC123"
      const chatId  = update.callback_query.message.chat.id;
      const msgId   = update.callback_query.message.message_id;
      const [action, requestId] = cbData.split("_");

      await handleAction(db, BOT_TOKEN, chatId, msgId, action, requestId, update.callback_query.id);
      return { statusCode: 200, body: "OK" };
    }

    // Gestionează comenzi text: /confirmat_ABC123 sau /refuzat_ABC123 sau /cal sau /block
    if (update.message?.text) {
      const text   = update.message.text;
      const chatId = update.message.chat.id;
      const msgId  = null;

      const matchConfirmat = text.match(/^\/confirmat_([A-Z0-9]+)/i);
      const matchRefuzat   = text.match(/^\/refuzat_([A-Z0-9]+)/i);
      const matchCal       = text.match(/^\/cal\s+([A-Z0-9]+)\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*(.+)/i);
      const matchBlock     = text.match(/^\/block\s+([0-9]{4}-[0-9]{2}-[0-9]{2})\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*(.+)/i);

      if (matchConfirmat) {
        await handleAction(db, BOT_TOKEN, chatId, msgId, "confirmat", matchConfirmat[1], null);
      } else if (matchRefuzat) {
        await handleAction(db, BOT_TOKEN, chatId, msgId, "refuzat", matchRefuzat[1], null);
      } else if (matchCal) {
        await handleCalCommand(db, BOT_TOKEN, chatId, matchCal[1], matchCal[2].trim(), matchCal[3].trim(), matchCal[4].trim());
      } else if (matchBlock) {
        await handleBlockCommand(db, BOT_TOKEN, chatId, matchBlock[1], matchBlock[2].trim(), matchBlock[3].trim(), matchBlock[4].trim(), matchBlock[5].trim());
      }
    }

    return { statusCode: 200, body: "OK" };
  } catch (err) {
    console.error("Webhook error:", err);
    return { statusCode: 200, body: "OK" }; // Always 200 for Telegram
  }
};

async function handleAction(db, BOT_TOKEN, chatId, msgId, action, requestId, callbackQueryId) {
  const docRef  = db.collection("rezervari").doc(requestId);
  const docSnap = await docRef.get();

  if (!docSnap.exists) {
    await sendMessage(BOT_TOKEN, chatId, `❌ Cererea #${requestId} nu a fost găsită.`);
    return;
  }

  const data = docSnap.data();

  if (data.status !== "nou") {
    const statusText = data.status === "confirmat" ? "✅ deja confirmată" : "❌ deja refuzată";
    await sendMessage(BOT_TOKEN, chatId, `ℹ️ Cererea #${requestId} este ${statusText}.`);
    if (callbackQueryId) await answerCallback(BOT_TOKEN, callbackQueryId, "Deja procesată");
    return;
  }

  if (action === "confirmat") {
    await docRef.update({
      status: "confirmat",
      confirmed_at: new Date().toISOString()
    });

    // Salvare automată în Calendar
    let emoji = "✨";
    const tip = (data.event_type || "").toLowerCase();
    if (tip.includes("nunt")) emoji = "💍";
    else if (tip.includes("cumetri")) emoji = "👶";
    else if (tip.includes("corporat")) emoji = "🏢";
    else if (tip.includes("aniversar")) emoji = "🎉";

    if (data.event_date) {
      await db.collection("calendar").doc(data.event_date).set({
        status: "ocupat",
        eventType: data.event_type || "Eveniment",
        displayName: data.name || "Client",
        emoji: emoji,
        internalNotes: ""
      }, { merge: true });
    }

    const msg =
      `✅ *Cerere #${requestId} CONFIRMATĂ*\n\n` +
      `👤 ${data.name} — 📞 ${data.phone}\n` +
      `📅 ${data.event_date} | ${data.event_type}\n` +
      `📦 ${data.package}\n\n` +
      `_A fost adăugat în calendar automat!_ 🎉\n\n` +
      `✏️ Pentru a afișa numele pe site și a adăuga ora pentru tine, răspunde cu:\n` +
      `/cal ${requestId} | ${data.name || "Nume"} | ${emoji} | ora/locația`;

    await sendMessage(BOT_TOKEN, chatId, msg);
    if (callbackQueryId) await answerCallback(BOT_TOKEN, callbackQueryId, "✅ Confirmat și adăugat!");

    // Editează mesajul original să arate confirmat
    if (msgId) {
      await editMessage(BOT_TOKEN, chatId, msgId,
        `✅ *CONFIRMAT — Cerere #${requestId}*\n👤 ${data.name} | 📞 ${data.phone}\n📅 ${data.event_date}`
      );
    }

  } else if (action === "refuzat") {
    await docRef.update({
      status: "refuzat",
      refused_at: new Date().toISOString()
    });

    const msg =
      `❌ *Cerere #${requestId} REFUZATĂ*\n\n` +
      `👤 ${data.name} — 📞 ${data.phone}\n` +
      `📅 ${data.event_date}\n\n` +
      `_Cererea a fost marcată ca refuzată._`;

    await sendMessage(BOT_TOKEN, chatId, msg);
    if (callbackQueryId) await answerCallback(BOT_TOKEN, callbackQueryId, "❌ Refuzat");
  }
}

async function sendMessage(token, chatId, text) {
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "Markdown" })
  });
}

async function editMessage(token, chatId, msgId, text) {
  await fetch(`https://api.telegram.org/bot${token}/editMessageText`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, message_id: msgId, text, parse_mode: "Markdown" })
  });
}

async function answerCallback(token, callbackQueryId, text) {
  await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ callback_query_id: callbackQueryId, text })
  });
}

async function handleCalCommand(db, BOT_TOKEN, chatId, requestId, displayName, emoji, internalNotes) {
  const docRef = db.collection("rezervari").doc(requestId);
  const docSnap = await docRef.get();

  if (!docSnap.exists) {
    await sendMessage(BOT_TOKEN, chatId, `❌ Nu am găsit rezervarea #${requestId}`);
    return;
  }

  const data = docSnap.data();
  if (!data.event_date) {
    await sendMessage(BOT_TOKEN, chatId, `❌ Rezervarea #${requestId} nu are o dată setată.`);
    return;
  }

  await db.collection("calendar").doc(data.event_date).set({
    status: "ocupat",
    eventType: data.event_type || "Eveniment",
    displayName: displayName,
    emoji: emoji,
    internalNotes: internalNotes
  }, { merge: true });

  await sendMessage(BOT_TOKEN, chatId, `✅ Detaliile calendarului actualizate!\n📅 ${data.event_date}\n📛 ${displayName}\n🎨 ${emoji}\n🕒 ${internalNotes}`);
}

async function handleBlockCommand(db, BOT_TOKEN, chatId, date, eventType, displayName, emoji, internalNotes) {
  await db.collection("calendar").doc(date).set({
    status: "ocupat",
    eventType: eventType,
    displayName: displayName,
    emoji: emoji,
    internalNotes: internalNotes
  }, { merge: true });

  await sendMessage(BOT_TOKEN, chatId, `🔒 Data ${date} a fost blocată direct în calendar!\n📛 ${displayName} | ${eventType}\n🎨 ${emoji}\n🕒 ${internalNotes}`);
}
