// Using global fetch

async function run() {
  const payload = {
    name: "Test Antigravity",
    phone: "060225455",
    email: "test@antigravity.ai",
    event_type: "Nuntă",
    event_date: "2026-07-20",
    package: "3 ore",
    guests: "100",
    message: "Test message from developer agent",
    is_offer: false
  };

  console.log("Sending POST to production /api/send-telegram...");
  try {
    const res = await fetch("https://oglinda-oglinjoara.vercel.app/api/send-telegram", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    console.log("Response status:", res.status);
    console.log("Response body:", data);
  } catch (err) {
    console.error("POST failed:", err.message);
  }
}

run();
