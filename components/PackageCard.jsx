import Link from 'next/link';

const features = ['Fotografii printate instant','Fotografii digitale','Plicuri personalizate','Magneți foto','Recuzită premium','Asistent dedicat','Album foto CADOU'];

export default function PackageCard({ hours, price, best, dict }) {
  return (
    <div className={`pkg${best ? ' best' : ''}`}>
      {best && <div className="pkg-star">{dict.cel_mai_ales}</div>}
      <div className="pkg-dur">{hours}<sup>{dict.ore}</sup></div>
      <div className="pkg-price">{price} € <span>{dict.per_pachet}</span></div>
      <div className="pkg-divider"></div>
      <ul className="pkg-list">
        <li>{dict.list.print}</li>
        <li>{dict.list.digital}</li>
        <li>{dict.list.plicuri}</li>
        <li>{dict.list.magneti}</li>
        <li>{dict.list.recuzita}</li>
        <li>{dict.list.asistent}</li>
        <li>{dict.list.album}</li>
        {hours >= 4 && <li>{dict.list.pauza}</li>}
      </ul>
      <a href="#rezervare" className="btn btn-pkg pkg-btn">{dict.promo?.btn || 'Rezervă acum'}</a>
    </div>
  );
}
