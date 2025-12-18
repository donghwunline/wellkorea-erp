# UI Components Library

A comprehensive, organized design system for the WellKorea ERP application.

## Directory Structure

The UI components are organized by functional categories for better findability and maintainability:

```
ui/
├── primitives/      # Atomic building blocks (Button, Input, Badge, Spinner, Icon, IconButton)
├── forms/           # Form-specific components (FormField)
├── feedback/        # User feedback and status (Alert, ErrorAlert, LoadingState, EmptyState)
├── data-display/    # Data presentation (Table, Card, StatCard)
├── navigation/      # Navigation and filtering (Pagination, SearchBar, FilterBar)
├── modals/          # Modal dialogs (Modal, ConfirmationModal, ModalActions)
└── layout/          # Page structure (PageHeader)
```

**Related shared modules:**

- `@/shared/hooks` - UI primitive hooks (useFocusTrap, useBodyScrollLock)
- `@/shared/utils` - Utility functions (cn for className merging)

## Usage

All components are exported through a single barrel export:

```typescript
import { Button, Table, Modal, Alert, Icon } from '@/components/ui';
```

For hooks and utilities, import from shared modules:

```typescript
import { useFocusTrap, useBodyScrollLock } from '@/shared/hooks';
import { cn } from '@/shared/utils';
```

## Component Categories

### Primitives

**Purpose**: Atomic, self-contained building blocks with minimal dependencies.

- `Button` - Action button with variants, sizes, and loading state
- `Input` - Text input with label and error handling
- `Icon` - SVG icon component with named icons (Heroicons outline style)
- `IconButton` - Icon-only button variant
- `Badge` - Status indicators and labels
- `Spinner` - Loading indicator

**Example**:

```tsx
<Button variant="primary" onClick={handleSave} isLoading={saving}>
  Save Changes
</Button>

<Icon name="users" size="md" className="text-copper-500" />
```

### Forms

**Purpose**: Form-specific components for data entry.

- `FormField` - Input wrapper with label and error display

**Example**:

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

### Feedback

**Purpose**: User feedback, status indicators, and state communication.

- `Alert` - Contextual messages (info, success, warning, error)
- `ErrorAlert` - Specialized error message display
- `LoadingState` - Loading placeholders with variants
- `EmptyState` - Empty data placeholders

**Example**:

```tsx
<Alert variant="success" onDismiss={() => setSuccess(null)}>
  User created successfully!
</Alert>
```

### Data Display

**Purpose**: Components for presenting structured data and content.

- `Table` - Compound component for tabular data (Table.Header, Table.Body, Table.Row, etc.)
- `Card` - Content containers with variants
- `StatCard` - Dashboard statistics display

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
```

### Navigation

**Purpose**: Navigation, search, filtering, and pagination components.

- `Pagination` - Page navigation controls
- `SearchBar` - Search input with clear button
- `FilterBar` - Compound component for filter controls (FilterBar.Field, FilterBar.Select)

**Example**:

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

### Modals

**Purpose**: Modal dialogs and confirmations with accessibility features.

- `Modal` - Base modal with focus trap, ESC handling, and scroll lock
- `ConfirmationModal` - Pre-built confirmation dialog for dangerous actions
- `ModalActions` - Standardized modal footer button layout

**Example**:

```tsx
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

- `PageHeader` - Compound component for page title and actions (PageHeader.Title, PageHeader.Actions)

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

- `useFocusTrap` - Traps keyboard focus within a container (for modals, dialogs)
- `useBodyScrollLock` - Prevents body scrolling when overlays are open

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

- **Button**: `primary` | `secondary` | `ghost` | `danger`
- **Alert**: `info` | `success` | `warning` | `error`
- **Badge**: `default` | `copper` | `success` | `info` | `danger` | `purple`
- **Card**: `default` | `table` | `interactive` | `stat`

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

## Testing

All components have comprehensive test coverage:

- Unit tests with React Testing Library
- Accessibility tests (ARIA attributes, keyboard navigation)
- Variant and prop testing
- Ref forwarding tests

Run tests:

```bash
npm test src/components/ui
```

## Contributing

When adding new components:

1. **Choose the right category**: Place component in the appropriate category folder
2. **Follow naming conventions**: PascalCase for components, camelCase for utilities
3. **Export types**: Always export prop interfaces
4. **Add tests**: Create corresponding `.test.tsx` file
5. **Update category barrel**: Add exports to category `index.ts`
6. **Document usage**: Add JSDoc comments with usage examples

## Future Extensions

Potential additions as the ERP grows:

- **visualizations/**: Charts, graphs for production tracking
- **pickers/**: Date/time pickers for delivery scheduling
- **uploads/**: File upload components for quotation attachments
- **Advanced Table features**: Sorting hooks, selection hooks, filtering utilities
