'use client';
import { useState } from 'react';
import { sendRequest } from '@/lib/sendRequest';

export default function ContactForm({ dict }) {
  const [mountedAt] = useState(Date.now());
  const [status, setStatus] = useState('idle');

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
      name: form.cname.value.trim(),
      phone: form.phone.value.trim(),
      email: form.email.value.trim(),
      message: form.message.value.trim(),
      is_offer: true,
    };
    if (!payload.name || !payload.phone || !payload.message) {
      alert(dict.alert);
      return;
    }
    setStatus('sending');
    try {
      await sendRequest(payload);
      setStatus('success');
    } catch {
      setStatus('error');
    }
  }

  return (
    <div className="cform">
      <h3>{dict.formTitle}</h3>
      <form onSubmit={handleSubmit}>
        <input type="text" name="address_verification" style={{ display: 'none' }} tabIndex="-1" autoComplete="off" />
        <div className="fg"><label>{dict.nume}</label><input type="text" name="cname" placeholder={dict.numePlh} /></div>
        <div className="fg-row">
          <div className="fg"><label>{dict.phoneLabel}</label><input type="tel" name="phone" placeholder="+373 xxx xxx" /></div>
          <div className="fg"><label>{dict.emailForm}</label><input type="email" name="email" placeholder="email@..." /></div>
        </div>
        <div className="fg"><label>{dict.mesaj}</label><textarea name="message" placeholder={dict.mesajPlh} required style={{minHeight:'100px'}}></textarea></div>
        
        <div className="fg-checkbox" style={{marginBottom:'16px'}}>
          <label style={{display:'flex', alignItems:'center', gap:'8px', cursor:'pointer', fontSize:'13px', color:'var(--ink)', userSelect:'none'}}>
            <input type="checkbox" required name="gdpr" style={{width:'auto', margin:0, transform:'scale(1.1)'}} />
            {dict.gdpr}
          </label>
        </div>

        {status !== 'success' && (
          <button className="btn btn-gold" type="submit" disabled={status === 'sending'} style={{width:'100%',marginTop:'8px'}}>
            {status === 'sending' ? '...' : dict.submit}
          </button>
        )}
        {status === 'success' && (
          <div style={{marginTop:'16px',padding:'16px',background:'#f0fdf4',border:'1px solid #86efac',borderRadius:'6px',textAlign:'center'}}>
            <div style={{fontSize:'20px',marginBottom:'6px'}}>✅</div>
            <div style={{fontWeight:600,color:'#166534',fontSize:'15px'}}>{dict.success}</div>
          </div>
        )}
        {status === 'error' && (
          <div style={{marginTop:'12px',padding:'12px',background:'#fef2f2',border:'1px solid #fca5a5',borderRadius:'6px',textAlign:'center',fontSize:'13px',color:'#991b1b'}}>
            ❌ {dict.error}
          </div>
        )}
      </form>
    </div>
  );
}
