export type ExitFn = (code?: number) => never;

// Exported indirection over process.exit to allow tests to mock it safely
export const exit: ExitFn = ((code?: number) => {
  // eslint-disable-next-line n/no-process-exit
  // @ts-expect-error process.exit never returns
  return process.exit(code);
}) as ExitFn;


