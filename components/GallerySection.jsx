'use client';
import { useState, useEffect } from 'react';

// Map category doc IDs to display labels and emoji fallbacks
const CATEGORY_META = {
  nunti:       { label: 'Nunți',           emoji: '💍' },
  cumetrii:    { label: 'Cumetrii',        emoji: '👶' },
  cumetrie:    { label: 'Cumetrii',        emoji: '👶' },
  corporate:   { label: 'Corporate',       emoji: '🏢' },
  aniversari:  { label: 'Aniversări',      emoji: '🎉' },
  bal:         { label: 'Bal',             emoji: '🎉' },
  alte:        { label: 'Alte evenimente', emoji: '✨' },
};

function getLabel(id) {
  return CATEGORY_META[id]?.label || id;
}
function getEmoji(id) {
  return CATEGORY_META[id]?.emoji || '📷';
}

export default function GallerySection({ dict }) {
  const [categories, setCategories] = useState(null);
  const [activeTab, setActiveTab] = useState('toate');
  const [lightbox, setLightbox] = useState(null); // { photos, index }

  useEffect(() => {
    fetch('/api/gallery')
      .then(r => r.json())
      .then(data => {
        if (data.ok) setCategories(data.categories);
      })
      .catch(() => setCategories({}));
  }, []);

  // Predefined order to guarantee the desired grid layout
  const PREDEFINED_ORDER = ['nunti', 'cumetrie', 'cumetrii', 'corporate', 'bal', 'aniversari', 'alte'];

  // Build tab list from fetched categories
  const catIds = categories 
    ? Object.keys(categories).sort((a, b) => {
        const indexA = PREDEFINED_ORDER.indexOf(a);
        const indexB = PREDEFINED_ORDER.indexOf(b);
        return (indexA === -1 ? 99 : indexA) - (indexB === -1 ? 99 : indexB);
      })
    : [];
  const tabs = ['toate', ...catIds];

  // Items to show in grid based on active tab
  const gridItems = categories
    ? (activeTab === 'toate' ? catIds : catIds.filter(id => id === activeTab))
    : [];

  function openLightbox(catId, photoIndex) {
    const photos = categories[catId]?.photos || [];
    if (!photos.length) return;
    setLightbox({ photos, index: photoIndex });
  }

  function closeLightbox() { setLightbox(null); }
  function prevPhoto() { setLightbox(l => ({ ...l, index: (l.index - 1 + l.photos.length) % l.photos.length })); }
  function nextPhoto() { setLightbox(l => ({ ...l, index: (l.index + 1) % l.photos.length })); }

  // Keyboard navigation
  useEffect(() => {
    if (!lightbox) return;
    function onKey(e) {
      if (e.key === 'ArrowRight') nextPhoto();
      if (e.key === 'ArrowLeft') prevPhoto();
      if (e.key === 'Escape') closeLightbox();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightbox]);

  return (
    <>
      {/* TABS */}
      <div className="g-tabs">
        {tabs.map(t => (
          <button
            key={t}
            className={`g-tab${activeTab === t ? ' on' : ''}`}
            onClick={() => setActiveTab(t)}
          >
            {t === 'toate' ? (dict?.tabs?.[0] || 'Toate') : getLabel(t)}
          </button>
        ))}
      </div>

      {/* GRID */}
      {!categories ? (
        <div className="g-grid">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="g-item">
              <div className="g-inner g-skeleton" />
            </div>
          ))}
        </div>
      ) : gridItems.length === 0 ? (
        <p style={{ color: 'var(--muted)', textAlign: 'center', padding: '40px 0' }}>
          Nu există fotografii în această categorie.
        </p>
      ) : (
        <div className="g-grid">
          {gridItems.map((catId, idx) => {
            const cat = categories[catId];
            const photos = cat?.photos || [];
            // Both 'nunti' and 'cumetrie'/'cumetrii' are vertical (span 2 rows).
            const isVertical = catId === 'nunti' || catId === 'cumetrie' || catId === 'cumetrii';
            const itemClass = isVertical ? 'g-item g-item-vertical' : 'g-item';
            
            return (
              <div
                key={catId}
                data-cat={catId}
                className={itemClass}
                onClick={() => openLightbox(catId, 0)}
                title={`Vezi ${getLabel(catId)}`}
              >
                <div className="g-inner" style={cat?.cover ? { background: 'var(--dark2)' } : {}}>
                  {cat?.cover ? (
                    <img
                      src={cat.cover}
                      alt={getLabel(catId)}
                      style={{ 
                        position: 'absolute', 
                        inset: 0, 
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'cover',
                        objectPosition: 'center 25%' // Better framing for faces
                      }}
                    />
                  ) : (
                    <span className="g-ico">{getEmoji(catId)}</span>
                  )}
                </div>
                <div className="g-label">
                  {getLabel(catId)}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {dict?.note && (
        <p className="g-note">
          {dict.note}
        </p>
      )}

      {/* LIGHTBOX */}
      {lightbox && (
        <div className="lb-overlay" onClick={closeLightbox}>
          <button className="lb-close" onClick={closeLightbox}>✕</button>
          <button className="lb-arrow lb-prev" onClick={e => { e.stopPropagation(); prevPhoto(); }}>‹</button>
          <div className="lb-img-wrap" onClick={e => e.stopPropagation()}>
            <img
              src={lightbox.photos[lightbox.index]}
              alt=""
              className="lb-img"
            />
            <div className="lb-counter">{lightbox.index + 1} / {lightbox.photos.length}</div>
          </div>
          <button className="lb-arrow lb-next" onClick={e => { e.stopPropagation(); nextPhoto(); }}>›</button>
        </div>
      )}
    </>
  );
}
