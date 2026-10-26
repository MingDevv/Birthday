/**
 * =========================================================================
 * 💖 Progress Manager: แหล่งความจริงเดียวของการสำรวจความทรงจำ
 * จัดการ visited set, คำนวณดาวถัดไป (getNextMemoryId) และแจ้งเตือน event
 * =========================================================================
 */

export function getNextMemoryId(visited, order = [1, 2, 3, 4, 5]) {
  return order.find((id) => !visited.has(id)) ?? null;
}

export function createProgressManager({ order = [1, 2, 3, 4, 5] } = {}) {
  const visited = new Set();
  const listeners = new Set();

  function notify(changedId = null) {
    const nextId = getNextMemoryId(visited, order);
    const payload = {
      visited: new Set(visited),
      visitedCount: visited.size,
      total: order.length,
      nextId,
      isComplete: visited.size >= order.length,
      changedId
    };

    listeners.forEach((fn) => {
      try {
        fn(payload);
      } catch (err) {
        console.warn('Progress listener error:', err);
      }
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('progress-changed', { detail: payload }));
    }
    return payload;
  }
  return {
    visited,
    get size() {
      return visited.size;
    },
    get total() {
      return order.length;
    },
    getNextId() {
      return getNextMemoryId(visited, order);
    },
    isVisited(id) {
      return visited.has(id);
    },
    isComplete() {
      return visited.size >= order.length;
    },
    markVisited(id) {
      const numId = Number(id);
      if (!visited.has(numId)) {
        visited.add(numId);
        return notify(numId);
      }
      return this.getState();
    },
    getState() {
      const nextId = getNextMemoryId(visited, order);
      return {
        visited: new Set(visited),
        visitedCount: visited.size,
        total: order.length,
        nextId,
        isComplete: visited.size >= order.length
      };
    },
    onChange(fn) {
      listeners.add(fn);
      // Immediately call with current state
      fn(this.getState());
      return () => listeners.delete(fn);
    },
    reset() {
      visited.clear();
      return notify(null);
    }
  };
}
