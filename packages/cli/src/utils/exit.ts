export type ExitFn = (code?: number) => never;

// Exported indirection over process.exit to allow tests to mock it safely
export const exit: ExitFn = ((code?: number) => {
  return process.exit(code);
}) as ExitFn;
