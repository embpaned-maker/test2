'use client';
import { useState } from 'react';

export default function FaqAccordion({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`faq-item${open ? ' open' : ''}`}>
      <button className="faq-btn" onClick={() => setOpen(!open)}>
        {q}
        <span className="faq-ico">+</span>
      </button>
      <div className="faq-ans">{a}</div>
    </div>
  );
}
