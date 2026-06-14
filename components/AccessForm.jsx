'use client';
import { useState, useEffect } from 'react';

export default function AccessForm({ dict }) {
  const [status, setStatus] = useState('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [recentEvents, setRecentEvents] = useState([]);

  useEffect(() => {
    async function loadRecent() {
      try {
        const res = await fetch('/api/recent-events');
        const data = await res.json();
        if (data.ok && data.events) {
          setRecentEvents(data.events);
        }
      } catch (err) {
        console.error('Failed to load recent events', err);
      }
    }
    loadRecent();
  }, []);

  function formatEvDate(isoDate) {
    if (!isoDate) return "";
    const [y, m, d] = isoDate.split('-');
    return `${d}.${m}.${y}`;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const code = e.target.code.value.trim().toUpperCase();
    const date = e.target.date.value.trim();
    if (!code || !date) return;

    setStatus('loading');
    setErrorMsg('');

    try {
      const res = await fetch('/api/verify-gallery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, date })
      });
      const data = await res.json();
      
      if (data.ok && data.url) {
        window.location.href = data.url; // Redirecționare către linkul cu fotografii
      } else {
        setStatus('error');
        setErrorMsg(data.error || dict.error || 'Eroare la verificare');
      }
    } catch {
      setStatus('error');
      setErrorMsg(dict.error || 'Eroare la conectare');
    }
  }

  return (
    <div className="access-widget">
      <form onSubmit={handleSubmit}>
        <div style={{display:'flex', gap:'12px', marginBottom:'16px', flexWrap:'wrap'}}>
          <div style={{flex:1, minWidth:'140px'}}>
            <label style={{display:'block', fontSize:'11px', textTransform:'uppercase', color:'var(--muted)', marginBottom:'6px', letterSpacing:'0.05em'}}>{dict.inputTitle}</label>
            <input name="code" className="code-input" type="text" placeholder={dict.inputPlh} maxLength={20} required style={{width:'100%'}} />
          </div>
          <div style={{flex:1, minWidth:'140px'}}>
            <label style={{display:'block', fontSize:'11px', textTransform:'uppercase', color:'var(--muted)', marginBottom:'6px', letterSpacing:'0.05em'}}>{dict.dateTitle}</label>
            <input name="date" className="code-input" type="date" required style={{width:'100%'}} />
          </div>
        </div>
        <button type="submit" className="btn btn-gold" style={{width:'100%', padding:'12px', marginBottom:'16px'}} disabled={status === 'loading'}>
          {status === 'loading' ? '...' : dict.btn}
        </button>
        {status === 'error' && (
          <div style={{padding:'10px', background:'rgba(255,0,0,0.1)', border:'1px solid rgba(255,0,0,0.2)', color:'#fca5a5', fontSize:'13px', borderRadius:'6px', textAlign:'center', marginBottom:'12px'}}>
            {errorMsg}
          </div>
        )}
      </form>
      <p className="code-hint" dangerouslySetInnerHTML={{__html: dict.hint}} />
      
      {recentEvents.length > 0 && (
        <div className="recent-list">
          <div className="recent-label">{dict.recent}</div>
          {recentEvents.map(ev => (
            <div key={ev.id} className="recent-item">
              <span>{ev.emoji}</span>
              <span>{ev.eventType ? ev.eventType + ' ' : ''}{ev.displayName} — {formatEvDate(ev.date)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
