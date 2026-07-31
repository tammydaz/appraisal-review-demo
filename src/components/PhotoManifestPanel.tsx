import type { PhotoCheckItem, PhotoCheckStatus } from '../types/Appraisal';

const REQ_LABEL: Record<string, string> = {
  required: 'Required',
  conditional: 'Conditional',
  optional: 'Optional',
};

export default function PhotoManifestPanel({ items }: { items: PhotoCheckItem[] }) {
  return (
    <div className="section-block photo-manifest">
      <h3>UAD 3.6 Photo Package Check</h3>
      <p className="section-hint">
        Compared zip image files to UAD 3.6 Photo Job Aid requirements — verify only, not a value
        opinion.
      </p>
      <ul className="photos-check photos-check-detailed">
        {items.map((p) => (
          <li key={p.id} className={`photo-${p.status as PhotoCheckStatus}`}>
            <span className="photo-icon">
              {p.status === 'pass' ? '✓' : p.status === 'fail' ? '✗' : '!'}
            </span>
            <div className="photo-detail">
              <span className="photo-label">{p.label}</span>
              <span className="photo-meta">
                {p.section && <span className="photo-section">{p.section}</span>}
                {p.requirement && (
                  <span className={`photo-req photo-req-${p.requirement}`}>
                    {REQ_LABEL[p.requirement] ?? p.requirement}
                  </span>
                )}
              </span>
              {p.note && <span className="photo-note-inline">{p.note}</span>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
