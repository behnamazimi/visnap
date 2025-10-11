declare module "figlet" {
  export function textSync(
    text: string,
    options?: {
      font?: string;
      horizontalLayout?: string;
      verticalLayout?: string;
    }
  ): string;
}

declare module "ora" {
  export interface Ora {
    start(text?: string): Ora;
    stop(): Ora;
    succeed(text?: string): Ora;
    fail(text?: string): Ora;
    warn(text?: string): Ora;
    text: string;
    isSpinning: boolean;
  }

  export default function ora(text?: string): Ora;
}

declare module "cli-table3" {
  export interface TableOptions {
    head?: string[];
    colWidths?: number[];
    style?: {
      head?: string[];
      border?: string[];
    };
  }

  export class Table {
    constructor(options?: TableOptions);
    push(row: string[]): void;
    toString(): string;
  }
}

declare module "open" {
  export default function open(target: string): Promise<void>;
}
