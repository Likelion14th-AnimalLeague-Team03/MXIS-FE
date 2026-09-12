declare const __DEV__: boolean | undefined;

export function logCharmDebug(message: string, ...details: unknown[]) {
  if (typeof __DEV__ !== "undefined" && !__DEV__) {
    return;
  }

  console.debug(message, ...details);
}
