/**
 * Guide Ledger (src/ui/guideLedger.js)
 * Single source of truth for guide impressions across scenes.
 * - Stores seen/retired guides in sessionStorage + in-memory Set fallback.
 * - 'retire(id)': called when user acts on or dismisses the guide.
 * - 'seen(id)': returns true if retired or completed.
 * - 'reset()': clears all recorded guides (supports ?guide=reset).
 */

const mem = new Set();
const KEY = 'khaohom-guide-v9';

function read() {
  if (typeof sessionStorage === 'undefined') return [];
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function write(arr) {
  if (typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.setItem(KEY, JSON.stringify(arr));
  } catch {}
}

export const ledger = {
  seen(id) {
    if (!id) return false;
    return mem.has(id) || read().includes(id);
  },
  retire(id) {
    if (!id) return;
    mem.add(id);
    const curr = read();
    if (!curr.includes(id)) {
      write([...curr, id]);
    }
  },
  reset() {
    mem.clear();
    if (typeof sessionStorage !== 'undefined') {
      try {
        sessionStorage.removeItem(KEY);
        sessionStorage.removeItem('tourSeen');
        sessionStorage.removeItem('firstMemoryGuideSeen');
        sessionStorage.removeItem('exploreFirstSeen');
        sessionStorage.removeItem('flightSkipSeen');
      } catch {}
    }
  }
};
