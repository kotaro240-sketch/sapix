// localStorage を使ったデータ永続化
// スプレッドシートの window.storage と同じインターフェース

export function storageGet(key) {
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : null;
  } catch {
    return null;
  }
}

export function storageSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('storage error:', e);
  }
}

export function storageRemove(key) {
  try {
    localStorage.removeItem(key);
  } catch {}
}
