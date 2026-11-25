import { buildGuidebookFormData } from "../features/guidebooks/constants";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/+$/, "");

async function parseResponse(response) {
  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await response.json()
    : { msg: await response.text() };

  if (!response.ok) {
    throw new Error(data?.msg || data?.message || `Request gagal (${response.status})`);
  }

  return data;
}

export function getGuidebookImageUrl(filenameOrUrl) {
  if (!filenameOrUrl) return "";
  if (/^https?:\/\//i.test(filenameOrUrl)) {
    return filenameOrUrl;
  }
  const cleanName = String(filenameOrUrl).replace(/^\/+/, "");
  if (cleanName.startsWith("storage/guidebook/")) {
    const fileOnly = cleanName.replace(/^storage\/guidebook\//, "");
    return `${API_BASE_URL}/guidebooks/image/${encodeURIComponent(fileOnly)}`;
  }
  return `${API_BASE_URL}/guidebooks/image/${encodeURIComponent(cleanName)}`;
}

export async function getGuidebooks(params = {}) {
  const query = new URLSearchParams();
  if (params.role && params.role !== "all") {
    query.set("role", params.role);
  }

  const qs = query.toString() ? `?${query.toString()}` : "";
  const response = await fetch(`${API_BASE_URL}/guidebooks${qs}`, {
    method: "GET",
    credentials: "include",
  });

  return parseResponse(response);
}

export async function getGuidebookById(id) {
  const response = await fetch(`${API_BASE_URL}/guidebooks/${id}`, {
    method: "GET",
    credentials: "include",
  });

  return parseResponse(response);
}

export async function createGuidebook(payload) {
  const body = buildGuidebookFormData(payload);

  const response = await fetch(`${API_BASE_URL}/guidebooks`, {
    method: "POST",
    credentials: "include",
    body,
  });

  return parseResponse(response);
}

export async function updateGuidebook(id, payload) {
  const body = buildGuidebookFormData(payload);

  const response = await fetch(`${API_BASE_URL}/guidebooks/${id}`, {
    method: "PATCH",
    credentials: "include",
    body,
  });

  return parseResponse(response);
}

export async function deleteGuidebook(id) {
  const response = await fetch(`${API_BASE_URL}/guidebooks/${id}`, {
    method: "DELETE",
    credentials: "include",
  });

  return parseResponse(response);
}