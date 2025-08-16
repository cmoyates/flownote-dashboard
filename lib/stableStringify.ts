export const stableStringify = (v: unknown) =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  JSON.stringify(v, Object.keys(v as any).sort());
