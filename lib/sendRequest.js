export async function sendRequest(payload) {
  const res = await fetch('/api/send-telegram', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.error || 'Eroare server');
  return data;
}
