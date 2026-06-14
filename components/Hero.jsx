import Link from 'next/link';

export default function Hero({ dict }) {
  return (
    <section className="hero" style={{paddingTop:0}}>
      <div className="hero-grid">
        <div className="hero-left">
          <div className="eyebrow fu">{dict.eyebrow}</div>
          <hr style={{border:'none',borderTop:'1.5px solid rgba(46,42,30,0.12)',margin:'18px auto 22px',width:'80px'}} />
          <h1 className="hero-title fu fu1" dangerouslySetInnerHTML={{__html: dict.title}}></h1>
          <p className="hero-sub fu fu2" dangerouslySetInnerHTML={{__html: dict.subtitle}}></p>
          <div className="hero-btns fu fu3">
            <Link href="#rezervare" className="btn btn-gold">{dict.rezerva}</Link>
            <Link href="#pachete" className="btn btn-outline">{dict.vezi_pachetele}</Link>
          </div>
          <div className="hero-pills fu fu4">
            <div className="hero-pill"><span className="hero-pill-dot"></span>{dict.pills.print}</div>
            <div className="hero-pill"><span className="hero-pill-dot"></span>{dict.pills.album}</div>
            <div className="hero-pill"><span className="hero-pill-dot"></span>{dict.pills.slim}</div>
            {dict.pills.video360 && <div className="hero-pill"><span className="hero-pill-dot"></span>{dict.pills.video360}</div>}
            <div className="hero-pill"><span className="hero-pill-dot"></span>{dict.pills.preturi}</div>
            <div className="hero-pill"><span className="hero-pill-dot"></span>{dict.pills.moldova}</div>
          </div>
        </div>
      </div>
    </section>
  );
}
