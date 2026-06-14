'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar({ dict, lang }) {
  const [shadow, setShadow] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setShadow(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const links = [
    { href: '#pachete', label: dict.pachete },
    { href: '#rezervare', label: dict.rezervare },
    { href: '#galerie', label: dict.galerie },
    { href: '#recenzii', label: dict.recenzii },
    { href: '#faq', label: dict.faq },
  ];

  function scrollTo(e, href) {
    e.preventDefault();
    setMenuOpen(false);
    const id = href.replace('#', '');
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <>
      <nav id="nav" className={shadow ? 'shadow' : ''}>
        <div className="nav-in">
          <Link href={`/${lang}`} className="nav-brand">
            <img src="/logo.svg" alt="Oglinda Oglinjoara" />
          </Link>
          <ul className="nav-links">
            {links.map(l => (
              <li key={l.href}>
                <a href={l.href} onClick={(e) => scrollTo(e, l.href)}>{l.label}</a>
              </li>
            ))}
          </ul>
          <div className="nav-actions nav-btns">
            <a href="#contact" className="btn btn-outline nav-contact-btn" onClick={(e) => scrollTo(e, '#contact')}>{dict.contact}</a>
            <a href="#rezervare" className="btn btn-gold nav-rezerva-btn" onClick={(e) => scrollTo(e, '#rezervare')}>{dict.rezerva_data}</a>
            
            {/* Lang Switcher */}
            <div className="lang-switcher">
              <Link href="/ro" className={lang === 'ro' ? 'active' : ''}>RO</Link>
              <span className="sep">|</span>
              <Link href="/ru" className={lang === 'ru' ? 'active' : ''}>RU</Link>
            </div>
          </div>
          <button className={`hamburger${menuOpen ? ' open' : ''}`} onClick={() => setMenuOpen(true)} aria-label="Menu">
            <span></span><span></span><span></span>
          </button>
        </div>
      </nav>
      <div className={`mobile-menu${menuOpen ? ' open' : ''}`}>
        <button className="mobile-menu-close" onClick={() => setMenuOpen(false)}>✕</button>
        <nav className="mobile-menu-nav">
          {links.map(l => (
            <a key={l.href} href={l.href} className="mm-link" onClick={(e) => scrollTo(e, l.href)}>{l.label}</a>
          ))}
          <a href="#contact" className="mm-cta mm-cta-outline" onClick={(e) => scrollTo(e, '#contact')}>{dict.contact}</a>
          <a href="#rezervare" className="mm-cta" onClick={(e) => scrollTo(e, '#rezervare')}>{dict.rezerva_data}</a>
          
          <div style={{display:'flex', gap:'16px', marginTop:'32px', justifyContent:'center', fontSize:'16px', fontWeight:'600'}}>
            <Link href="/ro" style={{color: lang === 'ro' ? 'var(--dark)' : 'var(--muted)', textDecoration:'none'}}>RO</Link>
            <span style={{color:'var(--muted)'}}>|</span>
            <Link href="/ru" style={{color: lang === 'ru' ? 'var(--dark)' : 'var(--muted)', textDecoration:'none'}}>RU</Link>
          </div>
        </nav>
      </div>
      <div className={`mobile-menu-overlay${menuOpen ? ' open' : ''}`} onClick={() => setMenuOpen(false)}></div>
    </>
  );
}
