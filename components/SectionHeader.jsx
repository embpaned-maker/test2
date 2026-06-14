export default function SectionHeader({ eyebrow, title, desc, light = false, center = false }) {
  return (
    <div className={`sec-head${center ? ' center' : ''}`}>
      <div className="eyebrow" style={light ? {color:'var(--gold)'} : {}}>
        {eyebrow}
      </div>
      <h2 className={`sec-title${light ? ' sec-title-light' : ''}`} dangerouslySetInnerHTML={{__html: title}} />
      {desc && <p className={`sec-desc${light ? ' sec-desc-light' : ''}`} style={center ? {margin:'0 auto'} : {}}>{desc}</p>}
    </div>
  );
}
