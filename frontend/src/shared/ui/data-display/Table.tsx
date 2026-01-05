/**
 * Table compound component with semantic structure
 *
 * Provides consistent table styling using compound component pattern.
 * Use Table.Header, Table.Body, Table.Row, Table.HeaderCell, and Table.Cell.
 *
 * Example:
 * ```tsx
 * <Table>
 *   <Table.Header>
 *     <Table.Row>
 *       <Table.HeaderCell>Name</Table.HeaderCell>
 *       <Table.HeaderCell>Email</Table.HeaderCell>
 *     </Table.Row>
 *   </Table.Header>
 *   <Table.Body>
 *     <Table.Row>
 *       <Table.Cell>John</Table.Cell>
 *       <Table.Cell>john@example.com</Table.Cell>
 *     </Table.Row>
 *   </Table.Body>
 * </Table>
 * ```
 */

import type { HTMLAttributes, ReactNode, TdHTMLAttributes, ThHTMLAttributes } from 'react';
import { forwardRef } from 'react';
import { cn } from '@/shared/lib/cn';

// Table Root
export interface TableProps extends HTMLAttributes<HTMLTableElement> {
  children: ReactNode;
}

const TableRoot = forwardRef<HTMLTableElement, TableProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <div className="overflow-x-auto">
        <table
          ref={ref}
          className={cn('w-full border-collapse text-left text-sm', className)}
          {...props}
        >
          {children}
        </table>
      </div>
    );
  }
);

TableRoot.displayName = 'Table';

// Table.Header
export interface TableHeaderProps extends HTMLAttributes<HTMLTableSectionElement> {
  children: ReactNode;
}

export const TableHeader = forwardRef<HTMLTableSectionElement, TableHeaderProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <thead ref={ref} className={cn('bg-steel-800/30', className)} {...props}>
        {children}
      </thead>
    );
  }
);

TableHeader.displayName = 'TableHeader';

// Table.Body
export interface TableBodyProps extends HTMLAttributes<HTMLTableSectionElement> {
  children: ReactNode;
}

export const TableBody = forwardRef<HTMLTableSectionElement, TableBodyProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <tbody ref={ref} className={cn('divide-y divide-steel-800/50', className)} {...props}>
        {children}
      </tbody>
    );
  }
);

TableBody.displayName = 'TableBody';

// Table.Row
export interface TableRowProps extends HTMLAttributes<HTMLTableRowElement> {
  children: ReactNode;
}

export const TableRow = forwardRef<HTMLTableRowElement, TableRowProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <tr ref={ref} className={cn('transition-colors hover:bg-steel-800/30', className)} {...props}>
        {children}
      </tr>
    );
  }
);

TableRow.displayName = 'TableRow';

// Table.HeaderCell
export interface TableHeaderCellProps extends ThHTMLAttributes<HTMLTableCellElement> {
  children: ReactNode;
}

export const TableHeaderCell = forwardRef<HTMLTableCellElement, TableHeaderCellProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <th
        ref={ref}
        className={cn(
          'px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-steel-400',
          className
        )}
        {...props}
      >
        {children}
      </th>
    );
  }
);

TableHeaderCell.displayName = 'TableHeaderCell';

// Table.Cell
export interface TableCellProps extends TdHTMLAttributes<HTMLTableCellElement> {
  children?: ReactNode;
}

export const TableCell = forwardRef<HTMLTableCellElement, TableCellProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <td ref={ref} className={cn('px-6 py-4 text-white', className)} {...props}>
        {children}
      </td>
    );
  }
);

TableCell.displayName = 'TableCell';

// Attach compound components with proper typing
export const Table = Object.assign(TableRoot, {
  Header: TableHeader,
  Body: TableBody,
  Row: TableRow,
  HeaderCell: TableHeaderCell,
  Cell: TableCell,
});

export default Table;
