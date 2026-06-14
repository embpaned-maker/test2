'use client';
import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

function getDaysInMonth(y, m) { return new Date(y, m, 0).getDate(); }
function getFirstDay(y, m) { const d = new Date(y, m-1, 1).getDay(); return d === 0 ? 6 : d-1; }

export default function Calendar({ onSelectDate, selectedDate, dict }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [occupied, setOccupied] = useState(new Set());

  useEffect(() => {
    async function load() {
      try {
        const snap = await getDocs(collection(db, 'calendar'));
        const set = new Set();
        snap.forEach(doc => { if (doc.data().status === 'ocupat') set.add(doc.id); });
        setOccupied(set);
        if (typeof window !== 'undefined') window._occupiedDates = set;
      } catch (e) { console.error('Firebase calendar error:', e); }
    }
    load();
  }, []);

  const isPrevDisabled = year < now.getFullYear() || (year === now.getFullYear() && month <= now.getMonth() + 1);
  const prev = () => {
    if (isPrevDisabled) return;
    if (month === 1) { setMonth(12); setYear(y => y - 1); } else setMonth(m => m - 1);
  };
  const next = () => { if (month === 12) { setMonth(1); setYear(y => y+1); } else setMonth(m => m+1); };
  const firstDay = getFirstDay(year, month);
  const daysInMonth = getDaysInMonth(year, month);
  const handleClick = useCallback((key) => { if (onSelectDate) onSelectDate(key); }, [onSelectDate]);

  // Using JS date localization for the month name
  const monthName = new Date(year, month - 1).toLocaleString(dict.days[0] === 'Пн' ? 'ru-RU' : 'ro-RO', { month: 'long' });
  const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);

  return (
    <div className="cal-box">
      <div className="cal-top">
        <span className="cal-month-label">{capitalizedMonth} {year}</span>
        <div className="cal-nav">
          <button onClick={prev} disabled={isPrevDisabled} style={isPrevDisabled ? { opacity: 0.3, cursor: 'not-allowed' } : {}}>‹</button>
          <button onClick={next}>›</button>
        </div>
      </div>
      <div className="cal-grid">
        {dict.days.map(d => <div key={d} className="cal-lbl">{d}</div>)}
        {Array.from({length: firstDay}, (_, i) => <div key={`e${i}`} className="day empty" />)}
        {Array.from({length: daysInMonth}, (_, i) => {
          const d = i + 1;
          const key = `${year}-${String(month).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
          const isBusy = occupied.has(key);
          const isToday = year === now.getFullYear() && month === now.getMonth()+1 && d === now.getDate();
          const isSelected = key === selectedDate;
          
          const dateObj = new Date(year, month - 1, d);
          const todayObj = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const isPast = dateObj < todayObj;
          
          let cls = 'day';
          if (isBusy) cls += ' busy';
          else if (isPast) cls += ' past';
          else if (isSelected) cls += ' selected';
          else if (isToday) cls += ' today';
          
          return (
            <div 
              key={key} 
              className={cls} 
              style={!isBusy && !isPast && !isToday ? {cursor:'pointer'} : {}} 
              title={isBusy ? dict.booked : isPast ? '' : dict.available}
              onClick={() => !isBusy && !isPast && handleClick(key)}
            >
              {d}
            </div>
          );
        })}
      </div>
    </div>
  );
}
