import React from "react";
import { validateImageFile } from "./constants";
import { getGuidebookImageUrl } from "../../services/guidebooks";

export default function SectionEditorCard({
  section,
  index,
  totalSections,
  onChange,
  onRemove,
  onMove,
  onError,
}) {
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validationError = validateImageFile(file);
    if (validationError) {
      e.target.value = "";
      onError?.(validationError);
      return;
    }

    if (section.previewUrl) {
      URL.revokeObjectURL(section.previewUrl);
    }

    onChange(index, {
      ...section,
      file,
      previewUrl: URL.createObjectURL(file),
    });
  };

  const handleClearImage = () => {
    if (section.previewUrl) {
      URL.revokeObjectURL(section.previewUrl);
    }
    onChange(index, {
      ...section,
      file: null,
      previewUrl: "",
      existingImage: null,
    });
  };

  const activeImageSrc =
    section.previewUrl ||
    (section.existingImage ? getGuidebookImageUrl(section.existingImage) : "");

  return (
    <div className="gb-section-card">
      <div className="gb-section-header">
        <div className="gb-section-badge">
          Bagian #{index + 1} (Urutan {section.urutan || index + 1})
        </div>

        <div className="gb-section-actions">
          <button
            type="button"
            className="gb-btn-ghost"
            disabled={index === 0}
            onClick={() => onMove(index, index - 1)}
            title="Naikkan urutan"
          >
            ↑ Naik
          </button>
          <button
            type="button"
            className="gb-btn-ghost"
            disabled={index === totalSections - 1}
            onClick={() => onMove(index, index + 1)}
            title="Turunkan urutan"
          >
            ↓ Turun
          </button>
          {totalSections > 1 && (
            <button
              type="button"
              className="gb-btn-danger-ghost"
              onClick={() => onRemove(index)}
            >
              Hapus Bagian
            </button>
          )}
        </div>
      </div>

      <div className="gb-grid-2">
        <div className="gb-field">
          <label htmlFor={`sec-urutan-${section.localId}`}>
            Urutan <span className="gb-required">*</span>
          </label>
          <input
            id={`sec-urutan-${section.localId}`}
            type="number"
            min={1}
            value={section.urutan}
            onChange={(e) =>
              onChange(index, { ...section, urutan: Number(e.target.value) || index + 1 })
            }
            required
          />
        </div>

        <div className="gb-field">
          <label htmlFor={`sec-subjudul-${section.localId}`}>
            Subjudul Bagian <span className="gb-required">*</span>
          </label>
          <input
            id={`sec-subjudul-${section.localId}`}
            type="text"
            placeholder="Contoh: Langkah 1 — Membuka Menu Usulan Anggaran"
            value={section.subjudul}
            onChange={(e) => onChange(index, { ...section, subjudul: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="gb-field">
        <label htmlFor={`sec-konten-${section.localId}`}>
          Konten / Instruksi <span className="gb-required">*</span>
        </label>
        <textarea
          id={`sec-konten-${section.localId}`}
          rows={4}
          placeholder="Tuliskan langkah atau penjelasan detail untuk bagian ini..."
          value={section.konten}
          onChange={(e) => onChange(index, { ...section, konten: e.target.value })}
          required
        />
      </div>

      <div className="gb-field">
        <label htmlFor={`sec-image-${section.localId}`}>
          Gambar Bagian (Opsional, JPG/JPEG/PNG maks 5 MB)
        </label>
        <input
          id={`sec-image-${section.localId}`}
          type="file"
          accept=".png,.jpg,.jpeg,image/png,image/jpeg"
          onChange={handleFileChange}
        />

        {activeImageSrc && (
          <div className="gb-preview-box">
            <img
              src={activeImageSrc}
              alt={`Preview ${section.subjudul || `Bagian ${index + 1}`}`}
              className="gb-preview-img"
            />
            <div className="gb-preview-meta">
              <span className="gb-muted">
                {section.file
                  ? `File baru: ${section.file.name}`
                  : `Gambar tersimpan: ${section.existingImage}`}
              </span>
              <button
                type="button"
                className="gb-btn-danger-ghost"
                onClick={handleClearImage}
              >
                Hapus Gambar Bagian
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}