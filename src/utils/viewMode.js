// src/utils/viewMode.js
export function readViewMode() {
  try {
    return localStorage.getItem("tao:viewMode") || "both";
  } catch {
    return "both";
  }
}

export function writeViewMode(v) {
  try {
    localStorage.setItem("tao:viewMode", v);
  } catch {}
}
