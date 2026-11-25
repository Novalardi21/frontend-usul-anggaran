export const GUIDEBOOK_ROLES = [
  { value: "operator", label: "Operator" },
  { value: "pimpinan_unit", label: "Pimpinan Unit" },
  { value: "tim_sakip", label: "Tim SAKIP" },
  { value: "spi", label: "SPI" },
  { value: "kpa", label: "KPA" },
];

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png"];
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export function getRoleLabel(roleValue) {
  const found = GUIDEBOOK_ROLES.find((r) => r.value === roleValue);
  return found ? `${found.label} (${found.value})` : roleValue || "-";
}

export function createEmptySection(urutan = 1) {
  return {
    localId: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    urutan,
    subjudul: "",
    konten: "",
    file: null,
    previewUrl: "",
    existingImage: null,
  };
}

export function mapGuidebookToFormState(guidebook) {
  if (!guidebook) {
    return {
      judul: "",
      role: "operator",
      kesimpulan: "",
      existingMainImage: null,
      sections: [createEmptySection(1)],
    };
  }

  const mappedSections = Array.isArray(guidebook.sections) && guidebook.sections.length > 0
    ? guidebook.sections.map((sec, idx) => ({
        localId: `sec-${sec.id || idx}-${Math.random().toString(36).slice(2, 6)}`,
        urutan: Number(sec.urutan) || idx + 1,
        subjudul: sec.subjudul || "",
        konten: sec.konten || "",
        file: null,
        previewUrl: "",
        existingImage: sec.image || null,
      }))
    : [createEmptySection(1)];

  return {
    judul: guidebook.judul || "",
    role: guidebook.role || "operator",
    kesimpulan: guidebook.kesimpulan || "",
    existingMainImage: guidebook.image || null,
    sections: mappedSections,
  };
}

export function validateImageFile(file) {
  if (!file) return null;
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return "Format gambar harus JPG, JPEG, atau PNG.";
  }
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return "Ukuran gambar maksimal 5 MB.";
  }
  return null;
}

export function buildGuidebookFormData({
  judul,
  role,
  kesimpulan,
  mainImageFile,
  sections,
  hapusGambar = false,
}) {
  const formData = new FormData();
  formData.append("judul", judul.trim());
  formData.append("role", role);
  formData.append("kesimpulan", (kesimpulan || "").trim());

  if (hapusGambar) {
    formData.append("hapus_gambar", "true");
  }

  if (mainImageFile) {
    formData.append("image", mainImageFile);
  }

  const normalizedSections = (sections || []).map((sec, idx) => ({
    urutan: Number(sec.urutan) || idx + 1,
    subjudul: (sec.subjudul || "").trim(),
    konten: (sec.konten || "").trim(),
    ...(sec.existingImage ? { image: sec.existingImage } : {}),
  }));

  formData.append("sections", JSON.stringify(normalizedSections));

  (sections || []).forEach((sec, idx) => {
    if (sec.file) {
      formData.append(`section_${idx}_image`, sec.file);
    }
  });

  return formData;
}