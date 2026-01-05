import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Table } from './Table';

describe('Table', () => {
  it('renders table with children', () => {
    render(
      <Table>
        <tbody>
          <tr>
            <td>Cell Content</td>
          </tr>
        </tbody>
      </Table>
    );
    expect(screen.getByText('Cell Content')).toBeInTheDocument();
  });

  it('wraps table in overflow container', () => {
    const { container } = render(
      <Table>
        <tbody>
          <tr>
            <td>Content</td>
          </tr>
        </tbody>
      </Table>
    );
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('overflow-x-auto');
  });

  it('applies table styling classes', () => {
    const { container } = render(
      <Table>
        <tbody>
          <tr>
            <td>Content</td>
          </tr>
        </tbody>
      </Table>
    );
    const table = container.querySelector('table');
    expect(table).toHaveClass('w-full');
    expect(table).toHaveClass('border-collapse');
  });

  it('merges custom className', () => {
    const { container } = render(
      <Table className="custom-table">
        <tbody>
          <tr>
            <td>Content</td>
          </tr>
        </tbody>
      </Table>
    );
    const table = container.querySelector('table');
    expect(table).toHaveClass('custom-table');
    expect(table).toHaveClass('w-full');
  });

  it('forwards ref correctly', () => {
    const ref = { current: null as HTMLTableElement | null };
    render(
      <Table ref={ref}>
        <tbody>
          <tr>
            <td>Content</td>
          </tr>
        </tbody>
      </Table>
    );
    expect(ref.current).toBeInstanceOf(HTMLTableElement);
  });
});

describe('Table.Header', () => {
  it('renders thead element', () => {
    const { container } = render(
      <Table>
        <Table.Header>
          <tr>
            <th>Header</th>
          </tr>
        </Table.Header>
      </Table>
    );
    const thead = container.querySelector('thead');
    expect(thead).toBeInTheDocument();
    expect(screen.getByText('Header')).toBeInTheDocument();
  });

  it('applies header styling', () => {
    const { container } = render(
      <Table>
        <Table.Header>
          <tr>
            <th>Header</th>
          </tr>
        </Table.Header>
      </Table>
    );
    const thead = container.querySelector('thead');
    expect(thead).toHaveClass('bg-steel-800/30');
  });

  it('forwards ref correctly', () => {
    const ref = { current: null as HTMLTableSectionElement | null };
    render(
      <Table>
        <Table.Header ref={ref}>
          <tr>
            <th>Header</th>
          </tr>
        </Table.Header>
      </Table>
    );
    expect(ref.current).toBeInstanceOf(HTMLTableSectionElement);
  });
});

describe('Table.Body', () => {
  it('renders tbody element', () => {
    const { container } = render(
      <Table>
        <Table.Body>
          <tr>
            <td>Body</td>
          </tr>
        </Table.Body>
      </Table>
    );
    const tbody = container.querySelector('tbody');
    expect(tbody).toBeInTheDocument();
    expect(screen.getByText('Body')).toBeInTheDocument();
  });

  it('applies body styling with dividers', () => {
    const { container } = render(
      <Table>
        <Table.Body>
          <tr>
            <td>Body</td>
          </tr>
        </Table.Body>
      </Table>
    );
    const tbody = container.querySelector('tbody');
    expect(tbody).toHaveClass('divide-y');
    expect(tbody).toHaveClass('divide-steel-800/50');
  });

  it('forwards ref correctly', () => {
    const ref = { current: null as HTMLTableSectionElement | null };
    render(
      <Table>
        <Table.Body ref={ref}>
          <tr>
            <td>Body</td>
          </tr>
        </Table.Body>
      </Table>
    );
    expect(ref.current).toBeInstanceOf(HTMLTableSectionElement);
  });
});

describe('Table.Row', () => {
  it('renders tr element', () => {
    const { container } = render(
      <Table>
        <Table.Body>
          <Table.Row>
            <td>Row</td>
          </Table.Row>
        </Table.Body>
      </Table>
    );
    const tr = container.querySelector('tr');
    expect(tr).toBeInTheDocument();
    expect(screen.getByText('Row')).toBeInTheDocument();
  });

  it('applies row hover styling', () => {
    const { container } = render(
      <Table>
        <Table.Body>
          <Table.Row>
            <td>Row</td>
          </Table.Row>
        </Table.Body>
      </Table>
    );
    const tr = container.querySelector('tr');
    expect(tr).toHaveClass('hover:bg-steel-800/30');
  });

  it('forwards ref correctly', () => {
    const ref = { current: null as HTMLTableRowElement | null };
    render(
      <Table>
        <Table.Body>
          <Table.Row ref={ref}>
            <td>Row</td>
          </Table.Row>
        </Table.Body>
      </Table>
    );
    expect(ref.current).toBeInstanceOf(HTMLTableRowElement);
  });
});

describe('Table.HeaderCell', () => {
  it('renders th element', () => {
    render(
      <Table>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Name</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
      </Table>
    );
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Name').tagName).toBe('TH');
  });

  it('applies header cell styling', () => {
    const { container } = render(
      <Table>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Name</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
      </Table>
    );
    const th = container.querySelector('th');
    expect(th).toHaveClass('px-6');
    expect(th).toHaveClass('py-3');
    expect(th).toHaveClass('uppercase');
    expect(th).toHaveClass('text-steel-400');
  });

  it('forwards ref correctly', () => {
    const ref = { current: null as HTMLTableCellElement | null };
    render(
      <Table>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell ref={ref}>Header</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
      </Table>
    );
    expect(ref.current).toBeInstanceOf(HTMLTableCellElement);
  });
});

describe('Table.Cell', () => {
  it('renders td element', () => {
    render(
      <Table>
        <Table.Body>
          <Table.Row>
            <Table.Cell>Data</Table.Cell>
          </Table.Row>
        </Table.Body>
      </Table>
    );
    expect(screen.getByText('Data')).toBeInTheDocument();
    expect(screen.getByText('Data').tagName).toBe('TD');
  });

  it('applies cell styling', () => {
    const { container } = render(
      <Table>
        <Table.Body>
          <Table.Row>
            <Table.Cell>Data</Table.Cell>
          </Table.Row>
        </Table.Body>
      </Table>
    );
    const td = container.querySelector('td');
    expect(td).toHaveClass('px-6');
    expect(td).toHaveClass('py-4');
    expect(td).toHaveClass('text-white');
  });

  it('can render without children', () => {
    const { container } = render(
      <Table>
        <Table.Body>
          <Table.Row>
            <Table.Cell />
          </Table.Row>
        </Table.Body>
      </Table>
    );
    const td = container.querySelector('td');
    expect(td).toBeInTheDocument();
    expect(td?.textContent).toBe('');
  });

  it('forwards ref correctly', () => {
    const ref = { current: null as HTMLTableCellElement | null };
    render(
      <Table>
        <Table.Body>
          <Table.Row>
            <Table.Cell ref={ref}>Cell</Table.Cell>
          </Table.Row>
        </Table.Body>
      </Table>
    );
    expect(ref.current).toBeInstanceOf(HTMLTableCellElement);
  });
});

describe('Table compound usage', () => {
  it('renders complete table structure', () => {
    render(
      <Table>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Name</Table.HeaderCell>
            <Table.HeaderCell>Email</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          <Table.Row>
            <Table.Cell>John Doe</Table.Cell>
            <Table.Cell>john@example.com</Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.Cell>Jane Smith</Table.Cell>
            <Table.Cell>jane@example.com</Table.Cell>
          </Table.Row>
        </Table.Body>
      </Table>
    );

    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
  });
});
