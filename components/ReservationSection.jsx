'use client';
import { useState } from 'react';
import Calendar from '@/components/Calendar';
import ReservationForm from '@/components/ReservationForm';

export default function ReservationSection({ dict }) {
  const [selectedDate, setSelectedDate] = useState('');
  return (
    <div className="cal-form-grid">
      <Calendar onSelectDate={setSelectedDate} selectedDate={selectedDate} dict={dict.calendar} />
      <ReservationForm selectedDate={selectedDate} dict={dict.form} />
    </div>
  );
}
