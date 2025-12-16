# UI Hooks

Reusable React hooks for common UI patterns and accessibility features.

## Available Hooks

### useFocusTrap

Traps keyboard focus within a container element, ensuring users can't accidentally tab out of modal dialogs, drawers, or other overlay components.

**Features:**
- Auto-focuses first focusable element when activated
- Traps Tab/Shift+Tab navigation within container
- Restores focus to previously focused element when deactivated
- Handles edge cases (no focusable elements, dynamic content)

**Usage:**
```tsx
import { useFocusTrap } from '@/components/ui';

function Dialog({ isOpen, onClose }) {
  const trapRef = useFocusTrap(isOpen, {
    autoFocus: true,      // Default: true
    restoreFocus: true,   // Default: true
  });

  if (!isOpen) return null;

  return (
    <div ref={trapRef} role="dialog">
      <button onClick={onClose}>Close</button>
      <input type="text" />
    </div>
  );
}
```

**Options:**
- `autoFocus?: boolean` - Auto-focus first focusable element when trap activates (default: true)
- `restoreFocus?: boolean` - Restore focus to previously focused element when trap deactivates (default: true)

**Type Parameters:**
- `T extends HTMLElement = HTMLElement` - The type of container element (e.g., `useFocusTrap<HTMLDivElement>`)

---

### useBodyScrollLock

Prevents body scrolling when an overlay (modal, drawer, etc.) is open, ensuring users can only scroll within the overlay content.

**Features:**
- Locks body scroll when active
- Restores original overflow value when deactivated
- Handles multiple overlays (each hook stores its own original value)
- Zero dependencies

**Usage:**
```tsx
import { useBodyScrollLock } from '@/components/ui';

function Modal({ isOpen }) {
  useBodyScrollLock(isOpen);

  if (!isOpen) return null;

  return (
    <div className="modal">
      <div className="modal-content">
        Content here
      </div>
    </div>
  );
}
```

**Parameters:**
- `isLocked: boolean` - Whether to lock body scroll

**Important Notes:**
When multiple hooks are active simultaneously, each hook stores its own original overflow value. When a hook unmounts, it restores its stored value, which may override other active hooks. For best results, ensure hooks are mounted/unmounted in a controlled order (e.g., using conditional rendering based on `isOpen` state).

---

## Testing

All hooks have comprehensive test coverage:

- **useFocusTrap**: 16 tests covering ref management, auto-focus, focus restoration, activation/deactivation, edge cases, and TypeScript types
- **useBodyScrollLock**: 15 tests covering scroll locking, cleanup, multiple overlays, edge cases, re-renders, and SSR safety

Run tests:
```bash
npm test -- src/components/ui/hooks/
```

---

## Used By

These hooks are currently used by:

- **Modal** (`modals/Modal.tsx`) - Uses both `useFocusTrap` and `useBodyScrollLock`
- **ConfirmationModal** (`modals/ConfirmationModal.tsx`) - Inherits from Modal

---

## Accessibility

Both hooks follow WAI-ARIA best practices:

- **useFocusTrap**: Implements the focus trap pattern for modal dialogs (ARIA APG Modal Dialog)
- **useBodyScrollLock**: Prevents scrolling confusion and ensures proper overlay focus management

---

## Implementation Details

### useFocusTrap

1. Queries all focusable elements using selector: `button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])`
2. Stores previously focused element on mount
3. Focuses first element if `autoFocus` is enabled
4. Listens for Tab key on container
5. Cycles focus between first and last focusable elements
6. Restores focus to previously focused element on unmount if `restoreFocus` is enabled

### useBodyScrollLock

1. Stores current `document.body.style.overflow` value on mount (when `isLocked=true`)
2. Sets `overflow: hidden` on body
3. Restores original overflow value on unmount or when `isLocked` changes to `false`

---

## Future Enhancements

Potential hooks to extract:

- `useClickOutside` - Detect clicks outside an element
- `useEscapeKey` - Handle Escape key press
- `useMediaQuery` - Respond to media query changes
- `useDebounce` - Debounce value changes
- `useLocalStorage` - Sync state with localStorage

---

## Contributing

When adding new hooks:

1. Create hook file in `hooks/` directory
2. Add comprehensive JSDoc comments
3. Export from `hooks/index.ts`
4. Create test file with `.test.ts` suffix
5. Update this README
6. Update main UI `index.ts` to export the hook
