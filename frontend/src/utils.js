export function normalizeName(name) {
  return name.trim().toLowerCase();
}

export function shortAddress(addr) {
  return addr.slice(0, 6) + "..." + addr.slice(-4);
}

export async function hashFile(file) {
  const buffer = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return "0x" + [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}