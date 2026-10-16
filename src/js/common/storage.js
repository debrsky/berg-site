// Storage is optional: privacy settings must not block forms or navigation.
export function readStorage(kind, key) {
  try {
    const value = window[kind].getItem(key);
    const data = JSON.parse(value);
    return data && typeof data === "object" && !Array.isArray(data)
      ? data
      : null;
  } catch (_) {
    return null;
  }
}

export function writeStorage(kind, key, value) {
  try {
    if (value === null) window[kind].removeItem(key);
    else window[kind].setItem(key, JSON.stringify(value));
  } catch (_) {
    // Continue without persistence.
  }
}
