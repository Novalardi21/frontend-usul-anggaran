import React from "react";
import { getGuidebookImageUrl } from "../../services/guidebooks";
import { getRoleLabel } from "./constants";

export default function GuidebookDetailModal({ guidebook, onClose, onEdit }) {
  if (!guidebook) return null;

  const mainImageSrc = guidebook.image ? getGuidebookImageUrl(guidebook.image) : "";
  const sortedSections = Array.isArray(guidebook.sections)
    ? [...guidebook.sections].sort((a, b) => (a.urutan || 0) - (b.urutan || 0))
    : [];

  return (
    <div
      className="gb-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="gb-detail-title"
      onClick={onClose}
    >
      <div className="gb-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="gb-modal-header">
          <div>
            <span className="gb-role-badge">{getRoleLabel(guidebook.role)}</span>
            <h2 id="gb-detail-title" className="gb-modal-title">
              {guidebook.judul}
            </h2>
          </div>
          <button
            type="button"
            className="gb-btn-ghost"
            onClick={onClose}
            aria-label="Tutup detail"
          >
            ✕ Tutup
          </button>
        </div>

        <div className="gb-modal-body">
          {mainImageSrc && (
            <div className="gb-detail-cover-wrap">
              <img
                src={mainImageSrc}
                alt={guidebook.judul}
                className="gb-detail-cover"
              />
            </div>
          )}

          <div className="gb-detail-sections">
            <h3 className="gb-detail-subtitle">
              Bagian Panduan ({sortedSections.length})
            </h3>

            {sortedSections.length === 0 ? (
              <p className="gb-muted">Belum ada bagian/section pada guidebook ini.</p>
            ) : (
              sortedSections.map((sec, idx) => {
                const secImgSrc = sec.image ? getGuidebookImageUrl(sec.image) : "";
                return (
                  <article key={sec.id || idx} className="gb-detail-section-item">
                    <div className="gb-detail-section-head">
                      <strong>
                        {sec.urutan || idx + 1}. {sec.subjudul}
                      </strong>
                    </div>
                    <p className="gb-detail-text">{sec.konten}</p>
                    {secImgSrc && (
                      <img
                        src={secImgSrc}
                        alt={sec.subjudul}
                        className="gb-detail-sec-img"
                      />
                    )}
                  </article>
                );
              })
            )}
          </div>

          {guidebook.kesimpulan && (
            <div className="gb-detail-conclusion">
              <h3 className="gb-detail-subtitle">Kesimpulan</h3>
              <p className="gb-detail-text">{guidebook.kesimpulan}</p>
            </div>
          )}
        </div>

        <div className="gb-modal-footer">
          {onEdit && (
            <button
              type="button"
              className="gb-btn-secondary"
              onClick={() => {
                onClose();
                onEdit(guidebook);
              }}
            >
              Edit Guidebook
            </button>
          )}
          <button type="button" className="gb-btn-primary" onClick={onClose}>
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
}