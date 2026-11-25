import { useCallback, useEffect, useMemo, useState } from "react";
import GuidebookForm from "../../features/guidebooks/GuidebookForm";
import GuidebookDetailModal from "../../features/guidebooks/GuidebookDetailModal";
import { GUIDEBOOK_ROLES, getRoleLabel } from "../../features/guidebooks/constants";
import {
  deleteGuidebook,
  getGuidebookById,
  getGuidebooks,
  updateGuidebook,
} from "../../services/guidebooks";
import "./guidebooks.css";

export default function GuidebooksManagePage({ onNavigate }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [statusMsg, setStatusMsg] = useState("");

  const [roleFilter, setRoleFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [selectedDetail, setSelectedDetail] = useState(null);
  const [editingGuidebook, setEditingGuidebook] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const loadGuidebooks = useCallback(async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const data = await getGuidebooks({ role: roleFilter });
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setErrorMsg(err?.message || "Gagal memuat daftar guidebook.");
    } finally {
      setLoading(false);
    }
  }, [roleFilter]);

  useEffect(() => {
    loadGuidebooks();
  }, [loadGuidebooks]);

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return items;
    return items.filter((gb) => {
      const inTitle = (gb.judul || "").toLowerCase().includes(q);
      const inRole = (gb.role || "").toLowerCase().includes(q);
      const inConclusion = (gb.kesimpulan || "").toLowerCase().includes(q);
      const inSections = Array.isArray(gb.sections)
        ? gb.sections.some(
            (s) =>
              (s.subjudul || "").toLowerCase().includes(q) ||
              (s.konten || "").toLowerCase().includes(q)
          )
        : false;
      return inTitle || inRole || inConclusion || inSections;
    });
  }, [items, searchQuery]);

  const handleOpenDetail = async (gb) => {
    setErrorMsg("");
    try {
      const full = await getGuidebookById(gb.id);
      setSelectedDetail(full || gb);
    } catch {
      setSelectedDetail(gb);
    }
  };

  const handleStartEdit = async (gb) => {
    setErrorMsg("");
    setStatusMsg("");
    try {
      const full = await getGuidebookById(gb.id);
      setEditingGuidebook(full || gb);
    } catch {
      setEditingGuidebook(gb);
    }
  };

  const handleUpdateSubmit = async (payload) => {
    if (!editingGuidebook?.id) return;
    setSavingEdit(true);
    setStatusMsg("");
    try {
      const res = await updateGuidebook(editingGuidebook.id, payload);
      setEditingGuidebook(null);
      setStatusMsg(res?.msg || "Guidebook berhasil diperbarui.");
      await loadGuidebooks();
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async (gb) => {
    const confirmed = window.confirm(
      `Hapus guidebook "${gb.judul}" beserta seluruh bagian dan gambarnya? Tindakan ini tidak dapat dibatalkan.`
    );
    if (!confirmed) return;

    setDeletingId(gb.id);
    setErrorMsg("");
    setStatusMsg("");
    try {
      const res = await deleteGuidebook(gb.id);
      setStatusMsg(res?.msg || "Guidebook berhasil dihapus.");
      setItems((prev) => prev.filter((item) => item.id !== gb.id));
    } catch (err) {
      setErrorMsg(err?.message || "Gagal menghapus guidebook.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <div className="gb-page">
        <div className="gb-page-header">
          <div>
            <h1 className="gb-page-title">Manajemen Guidebook (Superadmin)</h1>
            <p className="gb-page-desc">
              Kelola panduan aplikasi per role pengguna, pratinjau bagian, perbarui isi, atau hapus guidebook.
            </p>
          </div>
          <div className="gb-header-actions">
            <button
              type="button"
              className="gb-btn-secondary"
              onClick={loadGuidebooks}
              disabled={loading}
            >
              ↻ Muat Ulang
            </button>
            {onNavigate && (
              <button
                type="button"
                className="gb-btn-primary"
                onClick={() => onNavigate("guidebookCreate")}
              >
                + Buat Guidebook Baru
              </button>
            )}
          </div>
        </div>

        {statusMsg && (
          <div className="gb-alert gb-alert-success" role="status">
            <span>{statusMsg}</span>
            <button
              type="button"
              className="gb-btn-link"
              onClick={() => setStatusMsg("")}
            >
              Tutup
            </button>
          </div>
        )}

        {errorMsg && (
          <div className="gb-alert gb-alert-error" role="alert">
            <span>{errorMsg}</span>
            <button
              type="button"
              className="gb-btn-link"
              onClick={loadGuidebooks}
            >
              Coba Lagi
            </button>
          </div>
        )}

        {editingGuidebook ? (
          <section className="gb-card">
            <div className="gb-section-toolbar">
              <div>
                <h2 className="gb-card-title">
                  Edit Guidebook: {editingGuidebook.judul}
                </h2>
                <p className="gb-card-subtitle">
                  Perbarui judul, target role, gambar, kesimpulan, atau susunan bagian guidebook.
                </p>
              </div>
              <button
                type="button"
                className="gb-btn-ghost"
                onClick={() => setEditingGuidebook(null)}
                disabled={savingEdit}
              >
                ✕ Batal Edit
              </button>
            </div>

            <GuidebookForm
              initialData={editingGuidebook}
              onSubmit={handleUpdateSubmit}
              submitting={savingEdit}
              submitLabel="Simpan Perubahan"
              onCancel={() => setEditingGuidebook(null)}
            />
          </section>
        ) : (
          <section className="gb-card">
            <div className="gb-toolbar-filters">
              <div className="gb-field gb-filter-search">
                <label htmlFor="gb-search">Cari Guidebook</label>
                <input
                  id="gb-search"
                  type="text"
                  placeholder="Cari judul, subjudul, konten, atau kesimpulan..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="gb-field gb-filter-role">
                <label htmlFor="gb-filter-role">Filter Target Role</label>
                <select
                  id="gb-filter-role"
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                >
                  <option value="all">Semua Role</option>
                  {GUIDEBOOK_ROLES.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label} ({r.value})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {loading ? (
              <div className="gb-empty-state">Memuat data guidebook...</div>
            ) : filteredItems.length === 0 ? (
              <div className="gb-empty-state">
                <p>Belum ada guidebook yang sesuai dengan filter saat ini.</p>
                {onNavigate && (
                  <button
                    type="button"
                    className="gb-btn-primary"
                    onClick={() => onNavigate("guidebookCreate")}
                  >
                    + Buat Guidebook Pertama
                  </button>
                )}
              </div>
            ) : (
              <div className="gb-table-wrap">
                <table className="gb-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Judul Guidebook</th>
                      <th>Target Role</th>
                      <th>Jumlah Bagian</th>
                      <th>Gambar Utama</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map((gb) => {
                      const sectionCount = Array.isArray(gb.sections) ? gb.sections.length : 0;
                      return (
                        <tr key={gb.id}>
                          <td>#{gb.id}</td>
                          <td>
                            <div className="gb-table-title">{gb.judul}</div>
                            {gb.kesimpulan && (
                              <div className="gb-table-sub">
                                {gb.kesimpulan.slice(0, 80)}
                                {gb.kesimpulan.length > 80 ? "..." : ""}
                              </div>
                            )}
                          </td>
                          <td>
                            <span className="gb-role-badge">{getRoleLabel(gb.role)}</span>
                          </td>
                          <td>{sectionCount} bagian</td>
                          <td>{gb.image ? "Ada gambar" : "Tidak ada"}</td>
                          <td>
                            <div className="gb-row-actions">
                              <button
                                type="button"
                                className="gb-btn-ghost"
                                onClick={() => handleOpenDetail(gb)}
                              >
                                Detail
                              </button>
                              <button
                                type="button"
                                className="gb-btn-ghost"
                                onClick={() => handleStartEdit(gb)}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                className="gb-btn-danger-ghost"
                                disabled={deletingId === gb.id}
                                onClick={() => handleDelete(gb)}
                              >
                                {deletingId === gb.id ? "Menghapus..." : "Hapus"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        <GuidebookDetailModal
          guidebook={selectedDetail}
          onClose={() => setSelectedDetail(null)}
          onEdit={handleStartEdit}
        />
      </div>
    </>
  );
}