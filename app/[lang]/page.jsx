import Hero from '@/components/Hero';
import PackageCard from '@/components/PackageCard';
import SectionHeader from '@/components/SectionHeader';
import ReviewsSlider from '@/components/ReviewsSlider';
import FaqAccordion from '@/components/FaqAccordion';
import ContactForm from '@/components/ContactForm';
import ReservationSection from '@/components/ReservationSection';
import GallerySection from '@/components/GallerySection';
import AccessForm from '@/components/AccessForm';
import { getDictionary } from '@/lib/dictionaries';

export default async function Home({ params }) {
  const lang = (await params).lang || 'ro';
  const dict = await getDictionary(lang);

  return (
    <>
      {/* ═══ HERO ═══ */}
      <Hero dict={dict.hero} />

      {/* ═══ PACHETE ═══ */}
      <section className="sec sec-dark" id="pachete">
        <div className="wrap">
          <SectionHeader eyebrow={dict.pachete.eyebrow} title={dict.pachete.title} desc={dict.pachete.desc} light />
          <div className="pkg-grid">
            <PackageCard hours={2} price={270} dict={dict.pachete} />
            <PackageCard hours={3} price={320} best dict={dict.pachete} />
            <PackageCard hours={4} price={370} dict={dict.pachete} />
            <PackageCard hours={5} price={420} dict={dict.pachete} />
          </div>
          <div className="promo-bar">
            <div><p>{dict.pachete.promo.title}</p><small>{dict.pachete.promo.desc}</small></div>
            <a href="#rezervare" className="btn btn-gold">{dict.pachete.promo.btn}</a>
          </div>
        </div>
      </section>

      {/* ═══ CE INCLUDE ═══ */}
      <section className="sec sec-cream">
        <div className="wrap">
          <SectionHeader eyebrow={dict.inclus.eyebrow} title={dict.inclus.title} />
          <div className="inc-grid">
            {dict.inclus.items.map((item, i) => (
              <div key={i} className="inc-card">
                <div className="inc-ico">{item.ico}</div>
                <div>
                  <div className="inc-title">{item.title}</div>
                  <div className="inc-desc">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ PASI ═══ */}
      <section className="sec sec-cream pt-0">
        <div className="wrap">
          <SectionHeader eyebrow={dict.steps.eyebrow} title={dict.steps.title} desc={dict.steps.desc} center />
          <div className="steps">
            {dict.steps.items.map((item, i) => (
              <div key={i} className="step">
                <div className="step-num">{item.num}</div>
                <div className="step-title">{item.title}</div>
                <p className="step-desc">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ REZERVARE ═══ */}
      <section className="sec sec-cream pt-0" id="rezervare">
        <div className="wrap">
          <SectionHeader eyebrow={dict.rezervare.eyebrow} title={dict.rezervare.title} />
          <ReservationSection dict={dict.rezervare} lang={lang} />
        </div>
      </section>

      {/* ═══ GALERIE ═══ */}
      <section className="sec sec-cream pt-0" id="galerie">
        <div className="wrap">
          <SectionHeader eyebrow={dict.galerie.eyebrow} title={dict.galerie.title} />
          <GallerySection dict={dict.galerie} />
        </div>
      </section>

      {/* ═══ ACCESEAZA FOTOGRAFII ═══ */}
      <section className="sec sec-dark" id="fotografii">
        <div className="wrap">
          <div className="access-grid">
            <div>
              <div className="eyebrow" style={{color:'var(--gold)'}}>{dict.acces.eyebrow}</div>
              <h2 className="sec-title sec-title-light" dangerouslySetInnerHTML={{__html: dict.acces.title}} />
              <p className="sec-desc sec-desc-light">{dict.acces.desc}</p>
            </div>
            <AccessForm dict={dict.acces} />
          </div>
        </div>
      </section>

      {/* ═══ RECENZII ═══ */}
      <section className="sec sec-dark pt-0" id="recenzii">
        <div className="wrap">
          <ReviewsSlider dict={dict.recenzii} />
        </div>
      </section>

      {/* ═══ AVANTAJE ═══ */}
      <section className="sec sec-cream">
        <div className="wrap">
          <SectionHeader eyebrow={dict.avantaje.eyebrow} title={dict.avantaje.title} center />
          <div className="adv-grid">
            {dict.avantaje.items.map((item, i) => (
              <div key={i} className="adv">
                <div className="adv-ico">{item.ico}</div>
                <div className="adv-title">{item.title}</div>
                <div className="adv-desc">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FAQ ═══ */}
      <section className="sec sec-cream pt-0" id="faq">
        <div className="wrap">
          <SectionHeader eyebrow={dict.faq.eyebrow} title={dict.faq.title} />
          <div className="faq-wrap">
            {dict.faq.items.map((f, i) => (
              <FaqAccordion key={i} q={f.q} a={f.a} />
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CONTACT ═══ */}
      <section className="sec sec-cream pt-0" id="contact">
        <div className="wrap">
          <div className="contact-grid">
            <div className="contact-info">
              <div className="eyebrow">{dict.contact.eyebrow}</div>
              <h2 className="sec-title" dangerouslySetInnerHTML={{__html: dict.contact.title}} />
              <div className="ch-list">
                <a href="tel:060225455" className="ch-link">
                  <span className="ch-ico">📞</span>
                  <div><div className="ch-lbl">{dict.contact.phoneLabel}</div><div className="ch-val">060225455</div></div>
                </a>
                <a href="mailto:hello@oglindaoglinjoara.md" className="ch-link">
                  <span className="ch-ico">✉️</span>
                  <div><div className="ch-lbl">{dict.contact.emailLabel}</div><div className="ch-val">hello@oglindaoglinjoara.md</div></div>
                </a>
                <a href="https://instagram.com/oglindaoglinjoara.md" target="_blank" rel="noopener noreferrer" className="ch-link">
                  <span className="ch-ico">📷</span>
                  <div><div className="ch-lbl">Instagram</div><div className="ch-val">@oglindaoglinjoara.md</div></div>
                </a>
                <a href="https://facebook.com/oglindaoglinjoara.md" target="_blank" rel="noopener noreferrer" className="ch-link">
                  <span className="ch-ico">👍</span>
                  <div><div className="ch-lbl">Facebook</div><div className="ch-val">Oglinda Oglinjoara</div></div>
                </a>
                <a href="https://tiktok.com/@oglindaoglinjoara.md" target="_blank" rel="noopener noreferrer" className="ch-link">
                  <span className="ch-ico">🎵</span>
                  <div><div className="ch-lbl">TikTok</div><div className="ch-val">@oglindaoglinjoara.md</div></div>
                </a>
                <a href="https://wa.me/37360225455" target="_blank" rel="noopener noreferrer" className="ch-link">
                  <span className="ch-ico">💬</span>
                  <div><div className="ch-lbl">WhatsApp / Viber</div><div className="ch-val">060 225 455</div></div>
                </a>
              </div>
            </div>
            <ContactForm dict={dict.contact} />
          </div>
        </div>
      </section>
    </>
  );
}
