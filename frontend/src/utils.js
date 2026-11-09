import { hexlify } from "ethers";

export function normalizeName(name) {
  return name.trim().toLowerCase();
}

export function shortAddress(addr) {
  return addr.slice(0, 6) + "..." + addr.slice(-4);
}

export async function hashFile(file) {
  const buffer = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return hexlify(new Uint8Array(digest));
}