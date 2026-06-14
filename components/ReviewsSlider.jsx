'use client';

import { useRef } from 'react';
import ReviewCard from './ReviewCard';

export default function ReviewsSlider({ dict }) {
  const sliderRef = useRef(null);

  const scrollLeft = () => {
    if (sliderRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = sliderRef.current;
      const card = sliderRef.current.children[0];
      if (card) {
        const cardWidth = card.offsetWidth;
        const gap = 20; // Match gap in CSS
        if (scrollLeft <= 10) {
          sliderRef.current.scrollTo({ left: scrollWidth - clientWidth, behavior: 'smooth' });
        } else {
          sliderRef.current.scrollBy({ left: -(cardWidth + gap), behavior: 'smooth' });
        }
      }
    }
  };

  const scrollRight = () => {
    if (sliderRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = sliderRef.current;
      const card = sliderRef.current.children[0];
      if (card) {
        const cardWidth = card.offsetWidth;
        const gap = 20; // Match gap in CSS
        if (scrollLeft + clientWidth >= scrollWidth - 15) {
          sliderRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          sliderRef.current.scrollBy({ left: cardWidth + gap, behavior: 'smooth' });
        }
      }
    }
  };

  const items = dict.items || [];

  return (
    <div className="rev-slider-wrapper">
      <div className="rev-slider-header">
        <div className="rev-slider-title-wrapper">
          <div className="eyebrow" style={{ color: 'var(--gold)' }}>
            {dict.eyebrow}
          </div>
          <h2 className="sec-title sec-title-light" dangerouslySetInnerHTML={{ __html: dict.title }} />
        </div>
        {items.length > 3 && (
          <div className="rev-header-controls">
            <button onClick={scrollLeft} className="rev-btn-arrow" aria-label="Slide Left">
              ←
            </button>
            <button onClick={scrollRight} className="rev-btn-arrow" aria-label="Slide Right">
              →
            </button>
          </div>
        )}
      </div>

      <div ref={sliderRef} className="rev-slider-container">
        {items.map((r, i) => (
          <div key={i} className="rev-slider-slide">
            <ReviewCard
              stars={5}
              text={r.text}
              initials={r.av}
              name={r.name}
              event={r.ev}
            />
          </div>
        ))}
      </div>

      {dict.note && (
        <div className="rev-facebook-note">
          {dict.note}
        </div>
      )}
    </div>
  );
}
