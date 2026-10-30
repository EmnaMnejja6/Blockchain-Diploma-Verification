export function normalizeName(name) {
  return name.trim().toLowerCase();
}

export function shortAddress(addr) {
  return addr.slice(0, 6) + "..." + addr.slice(-4);
}