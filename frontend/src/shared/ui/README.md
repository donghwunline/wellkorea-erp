# UI Components Library

A comprehensive, organized design system for the WellKorea ERP application.

## Directory Structure

The UI components are organized by functional categories for better findability and maintainability:

```
ui/
├── primitives/      # Atomic building blocks (Button, Input, Badge, Spinner, Icon, IconButton)
├── forms/           # Form-specific components (FormField, DatePicker, Combobox)
├── feedback/        # User feedback and status (Alert, ErrorAlert, LoadingState, EmptyState)
├── data-display/    # Data presentation (Table, Card, StatCard)
├── navigation/      # Navigation and filtering (Pagination, SearchBar, FilterBar, Tabs, TabOverflow)
├── modals/          # Modal dialogs (Modal, ConfirmationModal, ModalActions)
└── layout/          # Page structure (PageHeader)
```

**Related shared modules:**

- `@/shared/hooks` - UI primitive hooks (useFocusTrap, useBodyScrollLock)
- `@/shared/utils` - Utility functions (cn for className merging)

## Usage

All components are exported through a single barrel export:

```typescript
import { Button, Table, Modal, Alert, Icon, Combobox, DatePicker, Tabs } from '@/shared/ui';
```

For hooks and utilities, import from shared modules:

```typescript
import { useFocusTrap, useBodyScrollLock } from '@/shared/hooks';
import { cn } from '@/shared/utils';
```

## Component Categories

### Primitives

**Purpose**: Atomic, self-contained building blocks with minimal dependencies.

| Component | Description |
|-----------|-------------|
| `Button` | Action button with variants, sizes, and loading state |
| `Input` | Text input with label and error handling |
| `Icon` | SVG icon component with named icons (Heroicons outline style) |
| `IconButton` | Icon-only button variant |
| `Badge` | Status indicators and labels |
| `Spinner` | Loading indicator |

**Example**:

```tsx
<Button variant="primary" onClick={handleSave} isLoading={saving}>
  Save Changes
</Button>

<Icon name="users" size="md" className="text-copper-500" />
```

### Forms

**Purpose**: Form-specific components for data entry and validation.

| Component | Description |
|-----------|-------------|
| `FormField` | Input wrapper with label and error display |
| `DatePicker` | Calendar-based date picker with single/range modes |
| `Combobox` | Searchable dropdown with local/async filtering |

#### FormField

```tsx
<FormField
  label="Email"
  type="email"
  value={email}
  onChange={setEmail}
  error={emailError}
  required
/>
```

#### DatePicker

A beautiful, accessible date picker with calendar popover. Supports single date and range selection.

```tsx
// Single date
<DatePicker
  mode="single"
  value={dueDate}
  onChange={setDueDate}
  min={new Date().toISOString().split('T')[0]}  // Today onwards
  label="Due Date"
  required
/>

// Date range
<DatePicker
  mode="range"
  value={{ start: startDate, end: endDate }}
  onChange={setDateRange}
  label="Date Range"
/>
```

#### Combobox

A fully accessible, searchable dropdown supporting both local filtering and async data loading. Implements the WAI-ARIA Combobox pattern.

**Two modes of operation:**

```tsx
// LOCAL MODE - Client-side filtering (small lists)
<Combobox
  options={[
    { id: 1, label: 'Samsung Electronics' },
    { id: 2, label: 'LG Display' },
  ]}
  value={customerId}
  onChange={(id, option) => setCustomerId(id)}
  label="Customer"
/>

// ASYNC MODE - Server-side search (large datasets)
<Combobox
  loadOptions={async (query) => {
    const res = await fetch(`/api/customers?search=${query}`);
    return res.json();
  }}
  value={customerId}
  onChange={(id, option) => setCustomerId(id)}
  initialLabel={customer?.name}  // Shows label before options load
  label="Customer"
/>

// With "Create New" action
<Combobox
  options={customers}
  value={customerId}
  onChange={(id) => setCustomerId(id)}
  onCreateNew={(name) => createCustomer(name)}
  label="Customer"
/>
```

### Feedback

**Purpose**: User feedback, status indicators, and state communication.

| Component | Description |
|-----------|-------------|
| `Alert` | Contextual messages (info, success, warning, error) |
| `ErrorAlert` | Specialized error message display |
| `LoadingState` | Loading placeholders with variants |
| `EmptyState` | Empty data placeholders |

**Example**:

```tsx
<Alert variant="success" onDismiss={() => setSuccess(null)}>
  User created successfully!
</Alert>

<LoadingState variant="table" />

<EmptyState
  icon="inbox"
  title="No projects found"
  description="Create your first project to get started."
/>
```

### Data Display

**Purpose**: Components for presenting structured data and content.

| Component | Description |
|-----------|-------------|
| `Table` | Compound component for tabular data |
| `Card` | Content containers with variants |
| `StatCard` | Dashboard statistics display |

**Example**:

```tsx
<Table>
  <Table.Header>
    <Table.Row>
      <Table.HeaderCell>Name</Table.HeaderCell>
      <Table.HeaderCell>Email</Table.HeaderCell>
    </Table.Row>
  </Table.Header>
  <Table.Body>
    {users.map(user => (
      <Table.Row key={user.id}>
        <Table.Cell>{user.name}</Table.Cell>
        <Table.Cell>{user.email}</Table.Cell>
      </Table.Row>
    ))}
  </Table.Body>
</Table>

<Card variant="interactive" onClick={handleClick}>
  Interactive card content
</Card>

<StatCard
  title="Active Projects"
  value={42}
  icon="folder"
  trend="+12%"
/>
```

### Navigation

**Purpose**: Navigation, search, filtering, pagination, and tabs.

| Component | Description |
|-----------|-------------|
| `Pagination` | Page navigation controls |
| `SearchBar` | Search input with clear button |
| `FilterBar` | Compound component for filter controls |
| `Tabs` | Tab navigation with URL hash routing support |
| `TabOverflow` | Overflow tabs dropdown for narrow viewports |

#### FilterBar

```tsx
<FilterBar>
  <FilterBar.Field label="Status">
    <FilterBar.Select
      value={statusFilter}
      onValueChange={setStatusFilter}
      options={[
        { value: 'all', label: 'All' },
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
      ]}
    />
  </FilterBar.Field>
</FilterBar>
```

#### Tabs (Compound Component)

Tab navigation with optional URL hash routing and badge support.

```tsx
<Tabs defaultTab="overview" hash={true}>
  <TabList>
    <Tab id="overview" icon="home">Overview</Tab>
    <Tab id="quotation" badge={2} badgeVariant="warning">Quotation</Tab>
    <Tab id="process">Process</Tab>
    <Tab id="delivery" disabled>Delivery</Tab>
  </TabList>
  <TabPanel id="overview">
    <OverviewContent />
  </TabPanel>
  <TabPanel id="quotation">
    <QuotationContent />
  </TabPanel>
  <TabPanel id="process">
    <ProcessContent />
  </TabPanel>
</Tabs>
```

#### TabOverflow

Displays overflow tabs in a dropdown menu for narrow viewports.

```tsx
<TabList>
  <Tab id="overview">Overview</Tab>
  <Tab id="quotation">Quotation</Tab>
  <TabOverflow activeTab={activeTab} onTabSelect={setActiveTab}>
    <TabOverflow.Item id="documents" icon="folder">Documents</TabOverflow.Item>
    <TabOverflow.Item id="finance" badge={2}>Finance</TabOverflow.Item>
  </TabOverflow>
</TabList>
```

### Modals

**Purpose**: Modal dialogs and confirmations with accessibility features.

| Component | Description |
|-----------|-------------|
| `Modal` | Base modal with focus trap, ESC handling, and scroll lock |
| `ConfirmationModal` | Pre-built confirmation dialog for dangerous actions |
| `ModalActions` | Standardized modal footer button layout |

**Example**:

```tsx
<Modal isOpen={isOpen} onClose={handleClose} title="Edit User">
  <form>
    {/* Form content */}
  </form>
  <ModalActions>
    <Button variant="ghost" onClick={handleClose}>Cancel</Button>
    <Button variant="primary" onClick={handleSave}>Save</Button>
  </ModalActions>
</Modal>

<ConfirmationModal
  isOpen={isDeleteOpen}
  onClose={() => setDeleteOpen(false)}
  onConfirm={handleDelete}
  title="Delete User"
  message="Are you sure you want to delete this user? This action cannot be undone."
  variant="danger"
  confirmLabel="Delete"
/>
```

### Layout

**Purpose**: Page-level structural components.

| Component | Description |
|-----------|-------------|
| `PageHeader` | Compound component for page title and actions |

**Example**:

```tsx
<PageHeader>
  <PageHeader.Title
    title="User Management"
    description="Manage system users and their roles"
  />
  <PageHeader.Actions>
    <Button onClick={() => setCreateOpen(true)}>
      Create User
    </Button>
  </PageHeader.Actions>
</PageHeader>
```

## Shared Hooks

UI primitive hooks are located in `@/shared/hooks`:

| Hook | Description |
|------|-------------|
| `useFocusTrap` | Traps keyboard focus within a container (for modals, dialogs) |
| `useBodyScrollLock` | Prevents body scrolling when overlays are open |

**Example**:

```tsx
import { useFocusTrap, useBodyScrollLock } from '@/shared/hooks';

function CustomDialog({ isOpen, onClose }) {
  const dialogRef = useFocusTrap(isOpen, {
    autoFocus: true,
    restoreFocus: true
  });
  useBodyScrollLock(isOpen);

  if (!isOpen) return null;

  return (
    <div ref={dialogRef} role="dialog">
      <h2>Dialog Title</h2>
      <button onClick={onClose}>Close</button>
    </div>
  );
}
```

## Utilities

### `cn` - ClassName Utility

Located in `@/shared/utils`. Utility function for conditional className merging:

```typescript
import { cn } from '@/shared/utils';

<div className={cn(
  'base-classes',
  condition && 'conditional-classes',
  customClassName
)} />
```

## Design Tokens

### Color Palette (Steel/Copper Theme)

- **Copper** (`copper-*`): Primary actions, emphasis, highlights
- **Steel** (`steel-*`): Neutral backgrounds, borders, secondary elements
- **Semantic Colors**:
    - Green: Success states
    - Red: Errors, danger, destructive actions
    - Blue: Info messages
    - Orange: Warnings
    - Purple: Special categories (e.g., Sales role)

### Component Variants

Most components follow a consistent variant system:

| Component | Variants |
|-----------|----------|
| `Button` | `primary`, `secondary`, `ghost`, `danger` |
| `Alert` | `info`, `success`, `warning`, `error` |
| `Badge` | `default`, `copper`, `success`, `info`, `danger`, `purple` |
| `Card` | `default`, `table`, `interactive`, `stat` |

### Sizes

Components support standard size variants:

- `sm`: Small (compact)
- `md`: Medium (default)
- `lg`: Large

## Accessibility

All components are built with accessibility in mind:

- **ARIA attributes**: Proper `role`, `aria-label`, `aria-describedby`, etc.
- **Keyboard navigation**: Full keyboard support (Tab, Enter, Esc, Arrow keys)
- **Focus management**: Modal focus trap, focus restoration
- **Semantic HTML**: Proper heading hierarchy, button types, form labels
- **Screen reader support**: Meaningful labels, status announcements

### WAI-ARIA Patterns Implemented

| Component | Pattern |
|-----------|---------|
| `Combobox` | [WAI-ARIA Combobox](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/) |
| `Tabs` | [WAI-ARIA Tabs](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/) |
| `Modal` | [WAI-ARIA Dialog](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/) |

## Testing

All components have comprehensive test coverage:

- Unit tests with React Testing Library
- Accessibility tests (ARIA attributes, keyboard navigation)
- Variant and prop testing
- Ref forwarding tests

Run tests:

```bash
# All UI component tests
npm test src/components/ui

# Specific component
npm test src/components/ui/forms/Combobox
```

## Contributing

When adding new components:

1. **Choose the right category**: Place component in the appropriate category folder
2. **Follow naming conventions**: PascalCase for components, camelCase for utilities
3. **Export types**: Always export prop interfaces
4. **Add tests**: Create corresponding `.test.tsx` file
5. **Update category barrel**: Add exports to category `index.ts`
6. **Document usage**: Add JSDoc comments with usage examples
7. **Update this README**: Add component to appropriate section

## Component Architecture Patterns

### Compound Components

Used for complex components with multiple related parts (Table, Tabs, FilterBar, PageHeader):

```tsx
// Definition
const Table = Object.assign(TableRoot, {
  Header: TableHeader,
  Body: TableBody,
  Row: TableRow,
  Cell: TableCell,
});

// Usage
<Table>
  <Table.Header>...</Table.Header>
  <Table.Body>...</Table.Body>
</Table>
```

### Portal Rendering

Used by Combobox and DatePicker dropdowns to escape parent overflow/backdrop-blur:

```tsx
createPortal(
  <div className="dropdown">...</div>,
  document.body
)
```

### Controlled vs Uncontrolled

Most form components support both patterns:

```tsx
// Controlled (value + onChange)
<Combobox value={selected} onChange={setSelected} />

// Uncontrolled with default (Tabs)
<Tabs defaultTab="overview" onTabChange={handleChange} />
```
