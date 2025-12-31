/**
 * Navigation helpers that depend on window.location.
 */

const hasLocation = globalThis?.location !== undefined;

export const navigation = {
  redirectToLogin(): void {
    if (!hasLocation) return;
    globalThis.location.href = '/login';
  },

  reloadPage(): void {
    if (!hasLocation) return;
    globalThis.location.reload();
  },
};
