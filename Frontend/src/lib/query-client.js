/**
 * Query Client abstraction placeholder for Vytalis Intelligence.
 * Prepares architectural container for future TanStack Query integration.
 */

export const queryClient = {
  // Simple event emitter or invalidation placeholder
  listeners: new Set(),

  invalidateQueries: function (key) {
    this.listeners.forEach((listener) => listener(key));
  },

  subscribe: function (listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  },
};
