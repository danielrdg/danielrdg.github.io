export function safe(name, fn) {
  try {
    return fn();
  } catch (err) {
    console.warn('[safe]', name, err);
    return undefined;
  }
}
