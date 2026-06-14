import { NextResponse } from 'next/server';

export async function POST(request) {
  const BOT_TOKEN = process.env.TG_BOT_TOKEN;

  try {
    const { initializeApp, cert, getApps } = await import("firebase-admin/app");
    const { getFirestore } = await import("firebase-admin/firestore");

    if (!getApps().length) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_CREDENTIALS || "{}");
      initializeApp({ credential: cert(serviceAccount) });
    }
    const db = getFirestore();

    const update = await request.json();

    // Gestionează callback de la butoane inline
    if (update.callback_query) {
      const cbData  = update.callback_query.data; // ex: "confirmat_ABC123"
      const chatId  = update.callback_query.message.chat.id;
      const msgId   = update.callback_query.message.message_id;
      const [action, requestId] = cbData.split("_");

      await handleAction(db, BOT_TOKEN, chatId, msgId, action, requestId, update.callback_query.id);
      return NextResponse.json({ ok: true });
    }

    // Gestionează comenzi text: /confirmat_ABC123 sau /refuzat_ABC123 sau /cal sau /block
    if (update.message?.text) {
      const text   = update.message.text;
      const chatId = update.message.chat.id;
      const msgId  = null;

      const matchConfirmat = text.match(/^\/confirmat_([A-Z0-9]+)/i);
      const matchRefuzat   = text.match(/^\/refuzat_([A-Z0-9]+)/i);
      const matchCal       = text.match(/^\/cal\s+(.+)$/i);
      const matchBlock     = text.match(/^\/block\s+(.+)$/i);
      const matchFree      = text.match(/^\/(free|liber|deblocheaza)\s+(.+)$/i);
      const matchHelp      = text.match(/^\/(help|ajutor|start)/i);
      const matchList      = text.match(/^\/(date|listeaza|rezervate|calendar)/i);

      if (matchConfirmat) {
        await handleAction(db, BOT_TOKEN, chatId, msgId, "confirmat", matchConfirmat[1], null);
      } else if (matchRefuzat) {
        await handleAction(db, BOT_TOKEN, chatId, msgId, "refuzat", matchRefuzat[1], null);
      } else if (matchBlock) {
        const parts = matchBlock[1].split("|").map(p => p.trim());
        const dateStr = parseDate(parts[0]);
        if (!dateStr) {
          await sendMessage(BOT_TOKEN, chatId, `❌ Data "${parts[0]}" nu este într-un format valid (folosiți ZZ.LL.AAAA sau AAAA-LL-ZZ).`);
        } else {
          const eventType = parts[1] || "Eveniment";
          const displayName = parts[2] || "";
          const emoji = parts[3] || "✨";
          const internalNotes = parts[4] || "";
          await handleBlockCommand(db, BOT_TOKEN, chatId, dateStr, eventType, displayName, emoji, internalNotes);
        }
      } else if (matchCal) {
        const parts = matchCal[1].split("|").map(p => p.trim());
        const firstParam = parts[0];
        const dateStr = parseDate(firstParam);
        
        if (dateStr) {
          // Utilizatorul a furnizat o dată ca prim parametru, facem update direct în calendar
          const eventType = parts[1] || "Eveniment";
          const displayName = parts[2] || "";
          const emoji = parts[3] || "✨";
          const internalNotes = parts[4] || "";
          
          await db.collection("calendar").doc(dateStr).set({
            status: "ocupat",
            eventType: eventType,
            displayName: displayName,
            emoji: emoji,
            internalNotes: internalNotes
          }, { merge: true });
          
          await sendMessage(BOT_TOKEN, chatId, `✅ Detaliile calendarului actualizate direct pentru data ${dateStr}!\n📛 ${displayName} | ${eventType}\n🎨 ${emoji}\n🕒 ${internalNotes}`);
        } else {
          // Tratăm primul parametru ca fiind ID-ul cererii (requestId)
          const requestId = firstParam;
          const displayName = parts[1] || "";
          const emoji = parts[2] || "✨";
          const internalNotes = parts[3] || "";
          await handleCalCommand(db, BOT_TOKEN, chatId, requestId, displayName, emoji, internalNotes);
        }
      } else if (matchFree) {
        const dateParam = matchFree[2].trim();
        const dateStr = parseDate(dateParam);
        if (!dateStr) {
          await sendMessage(BOT_TOKEN, chatId, `❌ Data "${dateParam}" nu este într-un format valid (folosiți ZZ.LL.AAAA sau AAAA-LL-ZZ).`);
        } else {
          await handleFreeCommand(db, BOT_TOKEN, chatId, dateStr);
        }
      } else if (matchHelp) {
        await handleHelpCommand(BOT_TOKEN, chatId);
      } else if (matchList) {
        await handleListCommand(db, BOT_TOKEN, chatId);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Webhook error:", err);
    return NextResponse.json({ ok: true }); // Always 200 for Telegram
  }
}

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

    // Editează toate mesajele originale din toate chaturile unde s-a trimis
    if (data.chat_ids && data.message_ids && data.chat_ids.length === data.message_ids.length) {
      for (let i = 0; i < data.chat_ids.length; i++) {
        try {
          await editMessage(BOT_TOKEN, data.chat_ids[i], data.message_ids[i],
            `✅ *CONFIRMAT — Cerere #${requestId}*\n👤 ${data.name} | 📞 ${data.phone}\n📅 ${data.event_date}`
          );
        } catch (e) {
          console.error(`Failed to edit message in chat ${data.chat_ids[i]}:`, e.message);
        }
      }
    } else if (msgId) {
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

    // Editează toate mesajele originale din toate chaturile unde s-a trimis
    if (data.chat_ids && data.message_ids && data.chat_ids.length === data.message_ids.length) {
      for (let i = 0; i < data.chat_ids.length; i++) {
        try {
          await editMessage(BOT_TOKEN, data.chat_ids[i], data.message_ids[i],
            `❌ *REFUZAT — Cerere #${requestId}*\n👤 ${data.name} | 📞 ${data.phone}\n📅 ${data.event_date}`
          );
        } catch (e) {
          console.error(`Failed to edit message in chat ${data.chat_ids[i]}:`, e.message);
        }
      }
    } else if (msgId) {
      await editMessage(BOT_TOKEN, chatId, msgId,
        `❌ *REFUZAT — Cerere #${requestId}*\n👤 ${data.name} | 📞 ${data.phone}\n📅 ${data.event_date}`
      );
    }
  }
}

async function sendMessage(token, chatId, text) {
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "Markdown" })
  });
  const data = await res.json();
  if (!data.ok) {
    throw new Error(data.description || "Failed to send message");
  }
}

async function editMessage(token, chatId, msgId, text) {
  const res = await fetch(`https://api.telegram.org/bot${token}/editMessageText`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, message_id: msgId, text, parse_mode: "Markdown" })
  });
  const data = await res.json();
  if (!data.ok) {
    throw new Error(data.description || "Failed to edit message");
  }
}

async function answerCallback(token, callbackQueryId, text) {
  const res = await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ callback_query_id: callbackQueryId, text })
  });
  const data = await res.json();
  if (!data.ok) {
    throw new Error(data.description || "Failed to answer callback query");
  }
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

async function handleFreeCommand(db, BOT_TOKEN, chatId, date) {
  const docRef = db.collection("calendar").doc(date);
  const docSnap = await docRef.get();

  if (!docSnap.exists) {
    await sendMessage(BOT_TOKEN, chatId, `❌ Data ${date} nu este înregistrată ca fiind ocupată/blocată în calendar.`);
    return;
  }

  await docRef.delete();
  await sendMessage(BOT_TOKEN, chatId, `🗑️ Data ${date} a fost deblocată și ștearsă din calendar cu succes!`);
}

async function handleHelpCommand(BOT_TOKEN, chatId) {
  const helpText = 
    `🛠️ *Comenzi Disponibile Bot Oglindă Oglinjoara:*\n\n` +
    `• \`/date\` sau \`/listeaza\` — Afișează toate datele rezervate începând de astăzi.\n` +
    `• \`/block DATA | Tip | Nume | Emoji | Detalii\` — Blochează o dată manual în calendar.\nExemplu:\n\`/block 2026-06-25 | Nuntă | Ana & Ion | 💍 | Restaurant Velvet\`\n` +
    `• \`/free DATA\` sau \`/liber DATA\` — Șterge/deblochează o dată din calendar.\nExemplu:\n\`/free 2026-06-25\`\n` +
    `• \`/cal ID | Nume | Emoji | Detalii\` — Modifică detaliile unei rezervări din calendar pe baza cererii.\nExemplu:\n\`/cal ABC123 | Ana & Ion | 💍 | Restaurant Velvet\`\n` +
    `• \`/confirmat_ID\` — Confirmă cererea cu ID-ul respectiv.\n` +
    `• \`/refuzat_ID\` — Refuză cererea cu ID-ul respectiv.`;

  await sendMessage(BOT_TOKEN, chatId, helpText);
}

async function handleListCommand(db, BOT_TOKEN, chatId) {
  const todayStr = new Date().toISOString().split('T')[0];
  const snap = await db.collection("calendar").where("status", "==", "ocupat").get();
  
  const docs = [];
  snap.forEach(doc => {
    if (doc.id >= todayStr) {
      docs.push({ id: doc.id, ...doc.data() });
    }
  });

  if (docs.length === 0) {
    await sendMessage(BOT_TOKEN, chatId, `📅 *Calendar:* Nu există nicio dată rezervată programată începând de astăzi.`);
    return;
  }

  // Sortează cronologic după ID-ul documentului (care este data YYYY-MM-DD)
  docs.sort((a, b) => a.id.localeCompare(b.id));

  let listText = `📅 *Date Rezervate (Astăzi + Viitor):*\n\n`;
  docs.forEach(d => {
    const notes = d.internalNotes ? ` | _${d.internalNotes}_` : "";
    listText += `• *${d.id}* — ${d.emoji || "✨"} ${d.displayName} (${d.eventType || "Eveniment"})${notes}\n`;
  });

  await sendMessage(BOT_TOKEN, chatId, listText);
}

function parseDate(str) {
  if (!str) return null;
  const cleaned = str.trim().replace(/[\/\.]/g, '-');
  
  // Format YYYY-MM-DD
  const matchYMD = cleaned.match(/^([0-9]{4})-([0-9]{2})-([0-9]{2})$/);
  if (matchYMD) {
    return `${matchYMD[1]}-${matchYMD[2]}-${matchYMD[3]}`;
  }
  
  // Format DD-MM-YYYY
  const matchDMY = cleaned.match(/^([0-9]{1,2})-([0-9]{1,2})-([0-9]{4})$/);
  if (matchDMY) {
    const d = matchDMY[1].padStart(2, '0');
    const m = matchDMY[2].padStart(2, '0');
    const y = matchDMY[3];
    return `${y}-${m}-${d}`;
  }
  
  return null;
}
