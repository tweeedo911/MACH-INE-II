// Wake Lock — impedisce sleep dello schermo durante la performance

export class WakeLockManager {
  constructor() {
    this._lock = null;
    this._active = false;
    this._onVisibilityChange = () => {
      if (!document.hidden && this._active) this.acquire();
    };
  }

  async acquire() {
    if (!('wakeLock' in navigator)) {
      console.warn('Wake Lock API non supportata');
      return false;
    }
    try {
      this._lock = await navigator.wakeLock.request('screen');
      this._active = true;
      document.addEventListener('visibilitychange', this._onVisibilityChange);
      this._lock.addEventListener('release', () => { this._lock = null; });
      return true;
    } catch (err) {
      console.warn('Wake Lock fallito:', err.message);
      return false;
    }
  }

  release() {
    this._active = false;
    document.removeEventListener('visibilitychange', this._onVisibilityChange);
    this._lock?.release();
    this._lock = null;
  }
}
