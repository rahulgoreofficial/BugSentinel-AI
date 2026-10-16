import React, { useEffect } from 'react';
import { X, ExternalLink, Maximize2 } from 'lucide-react';

interface ScreenshotModalProps {
  imageUrl: string | null;
  title: string;
  onClose: () => void;
}

export const ScreenshotModal: React.FC<ScreenshotModalProps> = ({
  imageUrl,
  title,
  onClose,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!imageUrl) return null;

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="screenshot-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title-area">
            <Maximize2 size={16} className="text-cyan" />
            <span className="modal-title">{title}</span>
            <span className="modal-badge font-mono">PNG ARTIFACT</span>
          </div>

          <div className="modal-actions">
            <a
              href={imageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary btn-sm"
              title="Open full image in a new tab"
            >
              <ExternalLink size={14} />
              <span>Open Raw</span>
            </a>
            <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Image Viewport */}
        <div className="modal-image-viewport">
          <img
            src={imageUrl}
            alt={`Playwright failure evidence for ${title}`}
            className="modal-screenshot-img"
          />
        </div>

        {/* Modal Footer Note */}
        <div className="modal-footer">
          <span>Captured autonomously by Playwright Chromium during assertion failure.</span>
          <span className="font-mono text-muted text-xs">{imageUrl}</span>
        </div>
      </div>
    </div>
  );
};
