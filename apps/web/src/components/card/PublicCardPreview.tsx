export interface PublicCardPreviewProps {
  slug: string;
}

export function PublicCardPreview({ slug }: PublicCardPreviewProps) {
  return (
    <div className="preview-card" aria-label={`Shared card ${slug}`}>
      <div className="preview-card-content">
        <div className="preview-rating">??</div>
        <div className="preview-name">Mystery Card</div>
        <div className="preview-meta">Tap to reveal</div>
      </div>
    </div>
  );
}
