import { useState } from "react";
import GuidebookForm from "../../features/guidebooks/GuidebookForm";
import { createGuidebook } from "../../services/guidebooks";
import "./guidebooks.css";

export default function GuidebookCreatePage({ onNavigate }) {
  const [submitting, setSubmitting] = useState(false);
  const [createdResult, setCreatedResult] = useState(null);

  const handleCreate = async (payload) => {
    setSubmitting(true);
    setCreatedResult(null);
    try {
      const res = await createGuidebook(payload);
      setCreatedResult(res?.data || { judul: payload.judul });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="gb-page">
        <div className="gb-page-header">
          <div>
            <h1 className="gb-page-title">Buat Guidebook (Superadmin)</h1>
            <p className="gb-page-desc">
              Buat panduan penggunaan aplikasi berdasarkan role pengguna beserta bagian dan gambar pendukung.
            </p>
          </div>
          {onNavigate && (
            <button
              type="button"
              className="gb-btn-secondary"
              onClick={() => onNavigate("guidebooks")}
            >
              Kembali ke Daftar Guidebook
            </button>
          )}
        </div>

        {createdResult && (
          <div className="gb-alert gb-alert-success" role="status">
            <div>
              <strong>Guidebook berhasil dibuat:</strong>{" "}
              {createdResult.judul || "Guidebook baru"}
            </div>
            {onNavigate && (
              <button
                type="button"
                className="gb-btn-link"
                onClick={() => onNavigate("guidebooks")}
              >
                Lihat di Daftar →
              </button>
            )}
          </div>
        )}

        <GuidebookForm
          onSubmit={handleCreate}
          submitting={submitting}
          submitLabel="Simpan Guidebook"
          onCancel={onNavigate ? () => onNavigate("guidebooks") : undefined}
        />
      </div>
    </>
  );
}