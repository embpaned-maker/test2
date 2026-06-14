export default function Footer({ dict }) {
  return (
    <footer>
      <div className="foot-in">
        <div className="foot-links">
          <a href="#pachete">Pachete</a>
          <a href="#rezervare">Rezervare</a>
          <a href="#galerie">Galerie</a>
          <a href="#recenzii">Recenzii</a>
          <a href="#faq">FAQ</a>
          <a href="#contact">Contact</a>
        </div>
        <div className="foot-brand" style={{ display: 'flex', justifyContent: 'center' }}>
          <img src="/logo alb.svg" alt="Oglinda Oglinjoara" style={{ height: '80px', width: 'auto' }} />
        </div>
        <div className="foot-copy" style={{ textAlign: 'right' }}>{dict.copy}</div>
      </div>
    </footer>
  );
}
