import * as React from "react";

// Types for table rows and sections
type ApiRowBase = {
  // The API item's name (e.g., prop name, option key, method name)
  name: string;
  // The type signature or description of the type
  type: string | React.ReactNode;
  // Human-friendly description, supports rich content
  description?: React.ReactNode;
  // Mark item as deprecated, optionally with reason
  deprecated?: boolean | string;
  // Optional: explicit href to link the name to (e.g., '#section-id')
  // When not provided, the name renders as plain text without a link
  href?: string;
};

// Discriminated union enforcing required/default combos:
// - Required rows cannot specify a default
export type RequiredRow = ApiRowBase & {
  required: true;
};

// - Optional rows may specify a default
export type OptionalRowWithDefault = ApiRowBase & {
  required?: false;
  default: string | React.ReactNode;
};

// - Optional rows without a default
export type OptionalRowWithoutDefault = ApiRowBase & {
  required?: false;
};

export type ApiRow =
  | RequiredRow
  | OptionalRowWithDefault
  | OptionalRowWithoutDefault;

export type ApiSection = {
  title?: string;
  description?: React.ReactNode;
  rows: readonly ApiRow[];
};

type ColumnVisibility = {
  required?: boolean;
  default?: boolean;
  deprecated?: boolean;
};

type BaseProps = {
  // Optional title displayed above the table
  title?: string;
  // Optional caption for accessibility; shown below title and above table
  caption?: string;
  // Compact density (smaller paddings)
  dense?: boolean;
  // Toggle individual columns
  show?: ColumnVisibility;
  // Generate element ids for name anchors (useful for deep links)
  anchorPrefix?: string;
  // When true, include the anchorPrefix before the row name when generating ids (e.g., "prefix-name").
  // Defaults to false to match Fumadocs-style heading ids based solely on the slugified name.
  usePrefixInAnchor?: boolean;
  className?: string;
};

type RowsProps = BaseProps & {
  rows: readonly ApiRow[];
  sections?: never;
};

type SectionsProps = BaseProps & {
  sections: readonly ApiSection[];
  rows?: never;
};

export type ApiTableProps = RowsProps | SectionsProps;

// Helper creators for excellent type inference without casts
export function defineApiRows<T extends readonly ApiRow[]>(rows: T): T {
  return rows;
}

export function defineApiSections<T extends readonly ApiSection[]>(
  sections: T
): T {
  return sections;
}

function slugify(input: string): string {
  // Insert hyphens between camelCase/PascalCase boundaries: diffColor -> diff-Color
  const withWordBoundaries = input
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2');

  return withWordBoundaries
    .replace(/[._/]+/g, '-')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // remove punctuation
    .replace(/\s+/g, '-') // spaces to hyphens
    .replace(/-+/g, '-'); // collapse multiple hyphens
}

const Badge = ({
  children,
  variant = "muted",
  title,
}: {
  children: React.ReactNode;
  variant?: "muted" | "attention" | "danger" | "success";
  title?: string;
}) => {
  const variants: Record<string, string> = {
    muted: "bg-muted text-muted-foreground",
    attention:
      "bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-200",
    danger: "bg-destructive/10 text-destructive",
    success:
      "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-200",
  };
  return (
    <span
      className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium ${variants[variant]}`}
      title={title}
    >
      {children}
    </span>
  );
};

const HeaderCell = ({ children }: { children: React.ReactNode }) => (
  <th className="text-left text-sm font-semibold text-foreground/90 dark:text-foreground px-3 py-2 border-b border-border">
    {children}
  </th>
);

const Cell = ({ children }: { children: React.ReactNode }) => (
  <td className="align-top text-sm text-foreground/90 px-3 py-2 border-b border-border">
    {children}
  </td>
);

const NameCell = ({ href, selfId, children }: { href?: string; selfId?: string; children: React.ReactNode }) => (
  <td className="align-top text-sm font-medium text-foreground px-3 py-2 border-b border-border">
    {href ? (
      <a href={href} id={selfId} className="hover:underline decoration-border/80 underline-offset-4">
        {children}
      </a>
    ) : (
      <span id={selfId}>{children}</span>
    )}
  </td>
);

function renderDeprecated(deprecated: ApiRow["deprecated"]): React.ReactNode {
  if (!deprecated) return null;
  const title = typeof deprecated === "string" ? deprecated : "Deprecated";
  return (
    <Badge variant="danger" title={title}>
      Deprecated
    </Badge>
  );
}

function normalizeColumns(show?: ColumnVisibility) {
  return {
    required: show?.required ?? true,
    default: show?.default ?? true,
    deprecated: show?.deprecated ?? false,
  } as const;
}

function SectionBlock({
  section,
  columns,
  dense,
  anchorPrefix,
  usePrefixInAnchor,
}: {
  section: ApiSection;
  columns: ReturnType<typeof normalizeColumns>;
  dense: boolean | undefined;
  anchorPrefix?: string;
  usePrefixInAnchor?: boolean;
}) {
  const rowClass = dense ? "py-1.5" : "py-2";
  return (
    <tbody>
      {(section.title || section.description) && (
        <tr className="bg-muted/40">
          <td
            colSpan={
              2 +
              (columns.required ? 1 : 0) +
              (columns.default ? 1 : 0) +
              (columns.deprecated ? 1 : 0)
            }
            className={`px-3 ${rowClass} border-b border-border`}
          >
            {section.title && (
              <div className="text-sm font-semibold text-foreground">
                {section.title}
              </div>
            )}
            {section.description && (
              <div className="text-sm text-foreground/80 mt-0.5">
                {section.description}
              </div>
            )}
          </td>
        </tr>
      )}
      {section.rows.map(row => {
        // Only generate self-id for anchor positioning if no explicit href provided
        const base = slugify(row.name);
        const selfId = anchorPrefix && usePrefixInAnchor ? `${slugify(anchorPrefix)}-${base}` : base;
        return (
          <tr key={row.name} className="even:bg-background odd:bg-background">
            <NameCell href={row.href} selfId={selfId}>{row.name}</NameCell>
            <Cell>
              <code className="text-[13px] whitespace-pre-wrap">
                {row.type}
              </code>
            </Cell>
            {columns.required && (
              <Cell>
                {row.required ? (
                  <Badge variant="attention" title="Required">
                    Required
                  </Badge>
                ) : (
                  <span className="text-foreground/70">Optional</span>
                )}
              </Cell>
            )}
            {columns.default && (
              <Cell>
                {"default" in row ? (
                  <code className="text-[13px] whitespace-pre-wrap">
                    {row.default}
                  </code>
                ) : (
                  <span className="text-foreground/50">—</span>
                )}
              </Cell>
            )}
            {columns.deprecated && (
              <Cell>
                {renderDeprecated(row.deprecated) ?? (
                  <span className="text-foreground/50">—</span>
                )}
              </Cell>
            )}
            <Cell>{row.description}</Cell>
          </tr>
        );
      })}
    </tbody>
  );
}

type ApiTableComponent = React.FC<ApiTableProps> & {
  defineRows: typeof defineApiRows;
  defineSections: typeof defineApiSections;
};

export const ApiTable: ApiTableComponent = (props: ApiTableProps) => {
  const columns = normalizeColumns(props.show);
  const dense = props.dense;

  const headerCells = (
    <thead>
      <tr>
        <HeaderCell>
          <span className="sr-only">Anchor</span>
          Name
        </HeaderCell>
        <HeaderCell>Type</HeaderCell>
        {columns.required && <HeaderCell>Required</HeaderCell>}
        {columns.default && <HeaderCell>Default</HeaderCell>}
        {columns.deprecated && <HeaderCell>Deprecated</HeaderCell>}
        <HeaderCell>Description</HeaderCell>
      </tr>
    </thead>
  );

  const table = (
    <table className={`w-full text-sm`}>
      {headerCells}
      {"rows" in props && props.rows && (
          <SectionBlock
          section={{ rows: props.rows }}
          columns={columns}
          dense={dense}
            anchorPrefix={props.anchorPrefix}
            usePrefixInAnchor={props.usePrefixInAnchor}
        />
      )}
      {"sections" in props && props.sections && (
        <>
          {props.sections.map((section, idx) => (
              <SectionBlock
              key={section.title ?? `section-${idx}`}
              section={section}
              columns={columns}
              dense={dense}
                anchorPrefix={props.anchorPrefix}
                usePrefixInAnchor={props.usePrefixInAnchor}
            />
          ))}
        </>
      )}
    </table>
  );

  if (!props.title && !props.caption) return table;

  return (
    <figure className={props.className}>
      {props.title && (
        <figcaption className="mb-2 text-base font-semibold text-foreground">
          {props.title}
          {props.caption && (
            <div className="text-sm font-normal text-foreground/75">
              {props.caption}
            </div>
          )}
        </figcaption>
      )}
      {!props.title && props.caption && (
        <figcaption className="mb-2 text-sm text-foreground/75">
          {props.caption}
        </figcaption>
      )}
      {table}
    </figure>
  );
};

ApiTable.defineRows = defineApiRows;
ApiTable.defineSections = defineApiSections;

export default ApiTable;

/**
 * Usage examples (in MDX or TSX):
 *
 * <ApiTable
 *   title="Component Props"
 *   sections={defineApiSections([
 *     {
 *       title: 'General',
 *       rows: defineApiRows([
 *         { name: 'id', type: 'string', description: 'Unique id for the input' },
 *         { name: 'disabled', type: 'boolean', default: 'false', description: 'Disable interactions' },
 *         { name: 'onChange', type: '(value: string) => void', required: true, description: 'Change handler' },
 *       ]),
 *     },
 *     {
 *       title: 'Accessibility',
 *       rows: defineApiRows([
 *         { name: 'aria-label', type: 'string', description: 'Accessible label for screen readers' },
 *         { name: 'aria-describedby', type: 'string', description: 'Element id providing description' },
 *       ]),
 *     },
 *   ])}
 *   show={{ deprecated: true }}
 * />
 */
