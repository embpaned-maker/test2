'use client';
import { useState, useEffect } from 'react';
import { sendRequest } from '@/lib/sendRequest';

export default function ReservationForm({ selectedDate, dict }) {
  const [mountedAt] = useState(Date.now());
  const [date, setDate] = useState('');
  const [status, setStatus] = useState('idle');
  const [dateWarning, setDateWarning] = useState(false);

  useEffect(() => { if (selectedDate) setDate(selectedDate); }, [selectedDate]);

  const todayStr = new Date().toISOString().split('T')[0];

  function handleDateChange(e) {
    const val = e.target.value;
    const isPast = val && val < todayStr;
    if (isPast) {
      setDate('');
    } else if (typeof window !== 'undefined' && window._occupiedDates?.has(val)) {
      setDateWarning(true); setDate('');
      setTimeout(() => setDateWarning(false), 4000);
    } else { setDateWarning(false); setDate(val); }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const form = e.target;

    // Honeypot validation
    if (form.address_verification?.value) {
      setStatus('success');
      return;
    }

    // Submission speed validation
    if (Date.now() - mountedAt < 3000) {
      setStatus('success');
      return;
    }

    const payload = {
      name: form.rname.value.trim(), phone: form.phone.value.trim(),
      email: form.email.value.trim(), event_type: form.event_type.value,
      event_date: date, package: form.pkg.value,
      guests: form.guests.value, message: form.message.value.trim(), is_offer: false,
    };
    if (!payload.name || !payload.phone || !payload.event_date || !payload.message) {
      alert('Te rugăm completează: Nume, Telefon, Data evenimentului și Descrierea.'); return;
    }
    if (payload.event_date < todayStr) {
      alert('Te rugăm selectează o dată validă (de astăzi sau din viitor).'); return;
    }
    if (typeof window !== 'undefined' && window._occupiedDates?.has(payload.event_date)) {
      alert('Această dată este deja rezervată.'); return;
    }
    setStatus('sending');
    try { await sendRequest(payload); setStatus('success'); }
    catch { setStatus('error'); }
  }

  return (
    <div className="form-box">
      <h3>{dict.title}</h3>
      <form onSubmit={handleSubmit}>
        <input type="text" name="address_verification" style={{ display: 'none' }} tabIndex="-1" autoComplete="off" />
        <div className="fg-row">
          <div className="fg"><label>{dict.nume}</label><input type="text" name="rname" placeholder={dict.numePlh} /></div>
          <div className="fg"><label>{dict.tel}</label><input type="tel" name="phone" placeholder="+373 xxx xxx" /></div>
        </div>
        <div className="fg"><label>{dict.email}</label><input type="email" name="email" placeholder="email@exemplu.com" /></div>
        <div className="fg-row">
          <div className="fg"><label>{dict.tip}</label>
            <select name="event_type">
              {dict.tipOptions.map((o, i) => <option key={i}>{o}</option>)}
            </select>
          </div>
          <div className="fg"><label>{dict.data}</label>
            <input type="date" name="event_date" min={todayStr} value={date} onChange={handleDateChange} />
            {dateWarning && <div style={{marginTop:'6px',fontSize:'12px',color:'#c0392b',fontWeight:600}}>⚠️ Această dată este rezervată.</div>}
          </div>
        </div>
        <div className="fg-row">
          <div className="fg"><label>{dict.pachet}</label>
            <select name="pkg">
              <option>2 ore</option><option>3 ore</option><option>4 ore</option><option>5 ore</option>
            </select>
          </div>
          <div className="fg"><label>{dict.invitati}</label><input type="number" name="guests" placeholder="ex: 150" /></div>
        </div>
        <div className="fg"><label>{dict.mesaj}</label><textarea name="message" placeholder={dict.mesajPlh} required style={{minHeight:'80px'}}></textarea></div>
        
        <div className="fg-checkbox" style={{marginBottom:'16px'}}>
          <label style={{display:'flex', alignItems:'center', gap:'8px', cursor:'pointer', fontSize:'13px', color:'var(--ink)', userSelect:'none'}}>
            <input type="checkbox" required name="gdpr" style={{width:'auto', margin:0, transform:'scale(1.1)'}} />
            {dict.gdpr}
          </label>
        </div>

        {status !== 'success' && (
          <button className="btn btn-gold" type="submit" style={{width:'100%',marginTop:'8px'}} disabled={status === 'sending'}>
            {status === 'sending' ? '...' : dict.submit}
          </button>
        )}
        {status === 'success' && (
          <div style={{marginTop:'16px',padding:'16px',background:'#f0fdf4',border:'1px solid #86efac',borderRadius:'6px',textAlign:'center'}}>
            <div style={{fontSize:'20px',marginBottom:'6px'}}>✅</div>
            <div style={{fontWeight:600,color:'#166534',fontSize:'15px'}}>{dict.success || 'Cererea a fost trimisă cu succes! Vă vom contacta în curând.'}</div>
          </div>
        )}
        {status === 'error' && (
          <div style={{marginTop:'12px',padding:'12px',background:'#fef2f2',border:'1px solid #fca5a5',borderRadius:'6px',textAlign:'center',fontSize:'13px',color:'#991b1b'}}>
            ❌ {dict.error || 'Eroare la trimitere. Vă rugăm să ne telefonați direct sau să ne scrieți un mesaj la nr. 060225455'}
          </div>
        )}
      </form>
    </div>
  );
}
