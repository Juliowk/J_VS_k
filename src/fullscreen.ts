export async function enterFullscreen() {
  if (!document.fullscreenElement) {
    try { await document.documentElement.requestFullscreen(); } catch { /* ignorado */ }
  }
}
