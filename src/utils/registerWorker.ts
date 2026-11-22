export function registerWorker() {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return
  window.addEventListener('load', () => {
    const url = new URL('./sw.js', document.baseURI)
    void navigator.serviceWorker.register(url, { updateViaCache: 'none' })
      .then((registration) => registration.update())
      .catch(() => {
        // The online game is also available when installation or storage is disabled.
      })
  }, { once: true })
}
