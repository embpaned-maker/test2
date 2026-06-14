export default function ReviewCard({ stars = 5, text, initials, name, event }) {
  return (
    <div className="rev-card">
      <div className="rev-stars">{'★'.repeat(stars)}</div>
      <p className="rev-text">&quot;{text}&quot;</p>
      <div className="rev-author">
        <div className="rev-av">{initials}</div>
        <div>
          <div className="rev-name">{name}</div>
          <div className="rev-event">{event}</div>
        </div>
      </div>
    </div>
  );
}
