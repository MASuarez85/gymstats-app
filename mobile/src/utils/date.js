// Helpers de fecha compartidos entre pantallas, portados de la versión web.
export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function formatDateHuman(iso) {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'short' });
}

export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
