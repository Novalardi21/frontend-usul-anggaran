import React, { useEffect, useState } from "react";
import {
  GUIDEBOOK_ROLES,
  createEmptySection,
  mapGuidebookToFormState,
  validateImageFile,
} from "./constants";
import { getGuidebookImageUrl } from "../../services/guidebooks";
import SectionEditorCard from "./SectionEditorCard";

export default function GuidebookForm({
  initialData = null,
  onSubmit,
  submitting = false,
  onCancel,
  submitLabel = "Simpan Guidebook",
}) {
  const [judul, setJudul] = useState("");
  const [role, setRole] = useState("operator");
  const [kesimpulan, setKesimpulan] = useState("");
  const [existingMainImage, setExistingMainImage] = useState(null);
  const [hapusGambar, setHapusGambar] = useState(false);
  const [mainImageFile, setMainImageFile] = useState(null);
  const [mainPreviewUrl, setMainPreviewUrl] = useState("");
  const [sections, setSections] = useState([createEmptySection(1)]);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    const state = mapGuidebookToFormState(initialData);
    setJudul(state.judul);
    setRole(state.role);
    setKesimpulan(state.kesimpulan);
    setExistingMainImage(state.existingMainImage);
    setHapusGambar(false);
    setMainImageFile(null);
    setMainPreviewUrl("");
    setSections(state.sections);
    setFormError("");
  }, [initialData]);

  const handleMainImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const errMsg = validateImageFile(file);
    if (errMsg) {
      e.target.value = "";
      setFormError(errMsg);
      return;
    }

    setFormError("");
    if (mainPreviewUrl) {
      URL.revokeObjectURL(mainPreviewUrl);
    }
    setMainImageFile(file);
    setMainPreviewUrl(URL.createObjectURL(file));
    setHapusGambar(false);
  };

  const handleRemoveMainImage = () => {
    if (mainPreviewUrl) {
      URL.revokeObjectURL(mainPreviewUrl);
    }
    setMainImageFile(null);
    setMainPreviewUrl("");
    if (existingMainImage) {
      setExistingMainImage(null);
      setHapusGambar(true);
    }
  };

  const handleAddSection = () => {
    setSections((prev) => [...prev, createEmptySection(prev.length + 1)]);
  };

  const handleSectionChange = (index, updatedSection) => {
    setSections((prev) => prev.map((item, idx) => (idx === index ? updatedSection : item)));
  };

  const handleRemoveSection = (index) => {
    setSections((prev) => {
      const target = prev[index];
      if (target?.previewUrl) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev
        .filter((_, idx) => idx !== index)
        .map((sec, idx) => ({ ...sec, urutan: idx + 1 }));
    });
  };

  const handleMoveSection = (fromIdx, toIdx) => {
    if (toIdx < 0 || toIdx >= sections.length) return;
    setSections((prev) => {
      const next = [...prev];
      const [moved] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, moved);
      return next.map((sec, idx) => ({ ...sec, urutan: idx + 1 }));
    });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!judul.trim()) {
      setFormError("Judul guidebook wajib diisi.");
      return;
    }

    if (!role) {
      setFormError("Target role guidebook wajib dipilih.");
      return;
    }

    for (let i = 0; i < sections.length; i++) {
      const sec = sections[i];
      if (!sec.subjudul.trim() || !sec.konten.trim()) {
        setFormError(`Bagian #${i + 1} wajib memiliki subjudul dan konten.`);
        return;
      }
    }

    try {
      await onSubmit({
        judul,
        role,
        kesimpulan,
        mainImageFile,
        hapusGambar,
        sections,
      });

      if (!initialData) {
        setJudul("");
        setRole("operator");
        setKesimpulan("");
        setExistingMainImage(null);
        setHapusGambar(false);
        setMainImageFile(null);
        if (mainPreviewUrl) URL.revokeObjectURL(mainPreviewUrl);
        setMainPreviewUrl("");
        sections.forEach((s) => s.previewUrl && URL.revokeObjectURL(s.previewUrl));
        setSections([createEmptySection(1)]);
      }
    } catch (err) {
      setFormError(err?.message || "Gagal menyimpan guidebook.");
    }
  };

  const activeMainImageSrc =
    mainPreviewUrl || (existingMainImage ? getGuidebookImageUrl(existingMainImage) : "");

  return (
    <form className="gb-form" onSubmit={handleFormSubmit} noValidate>
      {formError && (
        <div className="gb-alert gb-alert-error" role="alert">
          {formError}
        </div>
      )}

      <section className="gb-card">
        <h2 className="gb-card-title">Informasi Utama Guidebook</h2>

        <div className="gb-grid-2">
          <div className="gb-field">
            <label htmlFor="gb-judul">
              Judul Guidebook <span className="gb-required">*</span>
            </label>
            <input
              id="gb-judul"
              type="text"
              placeholder="Contoh: Panduan Pengajuan Usulan Anggaran"
              value={judul}
              onChange={(e) => setJudul(e.target.value)}
              required
            />
          </div>

          <div className="gb-field">
            <label htmlFor="gb-role">
              Target Role Pengguna <span className="gb-required">*</span>
            </label>
            <select
              id="gb-role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              required
            >
              {GUIDEBOOK_ROLES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label} ({item.value})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="gb-field">
          <label htmlFor="gb-main-image">
            Gambar Sampul / Utama (Opsional, JPG/JPEG/PNG maks 5 MB)
          </label>
          <input
            id="gb-main-image"
            type="file"
            accept=".png,.jpg,.jpeg,image/png,image/jpeg"
            onChange={handleMainImageChange}
          />
          {activeMainImageSrc && (
            <div className="gb-preview-box">
              <img
                src={activeMainImageSrc}
                alt="Preview gambar utama guidebook"
                className="gb-preview-img"
              />
              <div className="gb-preview-meta">
                <span className="gb-muted">
                  {mainImageFile
                    ? `File baru: ${mainImageFile.name}`
                    : `Gambar tersimpan: ${existingMainImage}`}
                </span>
                <button
                  type="button"
                  className="gb-btn-danger-ghost"
                  onClick={handleRemoveMainImage}
                >
                  Hapus Gambar Utama
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="gb-field">
          <label htmlFor="gb-kesimpulan">Kesimpulan / Catatan Penutup (Opsional)</label>
          <textarea
            id="gb-kesimpulan"
            rows={3}
            placeholder="Ringkasan atau catatan akhir setelah seluruh langkah selesai..."
            value={kesimpulan}
            onChange={(e) => setKesimpulan(e.target.value)}
          />
        </div>
      </section>

      <section className="gb-card">
        <div className="gb-section-toolbar">
          <div>
            <h2 className="gb-card-title">Bagian / Subjudul Guidebook</h2>
            <p className="gb-card-subtitle">
              Susun langkah atau topik panduan berurutan. Setiap bagian dapat dilengkapi gambar.
            </p>
          </div>
          <button
            type="button"
            className="gb-btn-secondary"
            onClick={handleAddSection}
            disabled={submitting}
          >
            + Tambah Bagian
          </button>
        </div>

        <div className="gb-sections-list">
          {sections.map((section, idx) => (
            <SectionEditorCard
              key={section.localId}
              section={section}
              index={idx}
              totalSections={sections.length}
              onChange={handleSectionChange}
              onRemove={handleRemoveSection}
              onMove={handleMoveSection}
              onError={setFormError}
            />
          ))}
        </div>
      </section>

      <div className="gb-footer-actions">
        {onCancel && (
          <button
            type="button"
            className="gb-btn-secondary"
            onClick={onCancel}
            disabled={submitting}
          >
            Batal
          </button>
        )}
        <button
          type="submit"
          className="gb-btn-primary"
          disabled={submitting}
        >
          {submitting ? "Menyimpan..." : submitLabel}
        </button>
      </div>
    </form>
  );
}