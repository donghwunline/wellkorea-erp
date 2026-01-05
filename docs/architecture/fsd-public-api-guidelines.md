# FSD Public API Guidelines

> **Rule**: Each slice/segment should expose only what consumers actually need. Internal implementation details must stay hidden.

## The Problem

Exporting too many internals from a slice creates:
1. **Tight coupling** - Consumers depend on implementation details
2. **Refactoring friction** - Can't change internals without breaking imports
3. **Cognitive overload** - Too many options confuse developers
4. **Leaky abstractions** - Internal patterns become external contracts

## The Solution: Strict Public API

Each entity/feature should have **one `index.ts`** that exports only:
- What consumers **actually use**
- What consumers **need to know about**

Everything else stays internal.

---

## Slice Encapsulation Rules

### What to Export via `index.ts`

| Segment | Export? | Example |
|---------|---------|---------|
| `model/*.ts` | ✅ YES | Domain types, business rules |
| `api/*.queries.ts` | ✅ YES | Query factory (`quotationQueries`) |
| `api/create-*.ts` | ✅ YES | Command functions + Input types |
| `api/update-*.ts` | ✅ YES | Command functions + Input types |
| `ui/*.tsx` | ✅ YES | Display components |
| `api/*.mapper.ts` | ❌ NO | Response types + mappers are internal |
| `api/get-*.ts` | ❌ NO | GET operations are internal (used by queries) |

**No segment-level barrel exports**: Only `{slice}/index.ts` is public. Never create `model/index.ts`, `api/index.ts`, etc.

---

## Group Slices vs Slices

The `features/` layer uses **Group slices** for domain-based organization:

```
features/
├── approval/           # Group slice (NO index.ts here!)
│   ├── approve/        # Slice - HAS index.ts
│   │   ├── ui/
│   │   ├── model/
│   │   └── index.ts    # ✅ Public API
│   └── reject/         # Slice - HAS index.ts
│       ├── ui/
│       ├── model/
│       └── index.ts    # ✅ Public API
├── quotation/          # Group slice (NO index.ts here!)
│   ├── form/           # Slice
│   ├── line-items/     # Slice
│   └── notify/         # Slice
```

**Rules**:
- **Group slice** (`approval/`, `quotation/`): Organizational folder only. **NO `index.ts`**.
- **Slice** (`approve/`, `reject/`, `form/`): Actual feature unit. **HAS `index.ts`** as public API.
- Import from slice, not group: `from '@/features/approval/approve'` ✅, `from '@/features/approval'` ❌

---

## Entity File Structure (Reference: `user/`)

```
entities/{entity}/
├── index.ts                    # Public API (single entry point)
├── model/
│   ├── {entity}.ts            # Domain types + business rules
│   ├── {entity}-status.ts     # Status enum + config (if applicable)
│   └── {child}.ts             # Child domain types (e.g., line-item.ts)
├── api/
│   ├── {entity}.mapper.ts     # Response type + mapper (Response→Domain)
│   ├── {entity}.queries.ts    # Query factory for TanStack Query v5
│   ├── get-{entity}-list.ts   # HTTP GET list operation (internal)
│   ├── get-{entity}-by-id.ts  # HTTP GET single operation (internal)
│   ├── create-{entity}.ts     # Request type inline + Input + POST
│   ├── update-{entity}.ts     # Request type inline + Input + PUT
│   └── {action}-{entity}.ts   # Request type inline + action command
└── ui/
    ├── {Entity}StatusBadge.tsx
    ├── {Entity}Card.tsx
    └── {Entity}Table.tsx
```

### API Type Distribution Pattern

**No centralized `{entity}.dto.ts` file.** Instead:

- **Response types** (`*Response`) → defined in `{entity}.mapper.ts`
  - Shared across queries and commands that return data
  - Lives with the mapper that transforms it to domain model
  - Naming: `UserDetailsResponse`, `QuotationListItemResponse`

- **Request types** (`*Request`) → inlined in each command file
  - Each request type is used by exactly one command
  - Private implementation detail (not exported)
  - Makes each command file self-contained
  - Naming: `CreateUserRequest`, `UpdateQuotationRequest`

**Note**: The `httpClient` auto-unwraps `ApiResponse<T>` and returns `T` directly.

---

## Entity Layer Guidelines

### What TO Export (Public)

```typescript
// entities/{entity}/index.ts

// =============================================================================
// DOMAIN TYPES
// Types that appear in component props, state, or function signatures
// =============================================================================

export type { Quotation, QuotationListItem } from './model/quotation';
export type { LineItem } from './model/line-item';

// =============================================================================
// STATUS
// Status enum and config for conditional rendering and business logic
// =============================================================================

export { QuotationStatus, QuotationStatusConfig } from './model/quotation-status';

// =============================================================================
// BUSINESS RULES
// Pure functions for domain logic (canEdit, canSubmit, calculations)
// =============================================================================

export { quotationRules } from './model/quotation';

// =============================================================================
// QUERY FACTORY (TanStack Query v5)
// Use with useQuery() directly - no custom hooks needed
// =============================================================================

export {
  quotationQueries,
  type QuotationListQueryParams,
  type PaginatedQuotations,
} from './api/quotation.queries';

// =============================================================================
// COMMAND FUNCTIONS (with validation)
// Use with useMutation() directly
// =============================================================================

export { createQuotation, type CreateQuotationInput, type LineItemInput } from './api/create-quotation';
export { updateQuotation, type UpdateQuotationInput } from './api/update-quotation';
export { submitQuotation } from './api/submit-quotation';

// =============================================================================
// UI COMPONENTS
// Display-only components with no side effects
// =============================================================================

export { QuotationStatusBadge } from './ui/QuotationStatusBadge';
export { QuotationCard } from './ui/QuotationCard';
export { QuotationTable } from './ui/QuotationTable';
```

### What NOT to Export (Internal)

| Internal Item | Why It's Internal |
|---------------|-------------------|
| `*Response` types | Implementation detail of API layer |
| `*Request` types | Used inside command functions |
| `*Params` types | Used inside query factory |
| `{entity}Mapper` | Used inside query factory |
| `get{Entity}` functions | Used inside query factory |
| `httpClient` calls | Abstracted by command/query functions |
| Helper/validation functions | Internal to command modules |
| `*Props` types | Internal to UI components |

---

## API Layer Patterns

### 1. Mapper with Response Type (`{entity}.mapper.ts`)

```typescript
// Response type defined in mapper file
// Naming: {Entity}DetailsResponse, {Entity}ListItemResponse

import type { RoleName } from '../model/role';
import type { UserDetails } from '../model/user';

// =============================================================================
// RESPONSE TYPE
// =============================================================================

export interface UserDetailsResponse {
  id: number;
  username: string;
  email: string;
  fullName: string;
  isActive: boolean;
  roles: RoleName[];
  createdAt: string;
  lastLoginAt: string | null;
}

// =============================================================================
// MAPPER
// =============================================================================

export const userMapper = {
  toDomain(response: UserDetailsResponse): UserDetails {
    return {
      id: response.id,
      username: response.username.trim(),
      email: response.email.toLowerCase().trim(),
      // ... rest of mapping
    };
  },
};
```

### 2. Query Factory Pattern (`quotation.queries.ts`)

```typescript
import { queryOptions, keepPreviousData } from '@tanstack/react-query';

export const quotationQueries = {
  // Hierarchical keys
  all: () => ['quotations'] as const,
  lists: () => [...quotationQueries.all(), 'list'] as const,
  details: () => [...quotationQueries.all(), 'detail'] as const,

  // Query with options (use directly with useQuery)
  list: (params: QuotationListQueryParams) =>
    queryOptions({
      queryKey: [...quotationQueries.lists(), params.page, params.size, ...] as const,
      queryFn: async () => {
        const response = await getQuotations(params);
        return { data: response.data.map(mapper.toDomain), ... };
      },
      placeholderData: keepPreviousData,
    }),

  detail: (id: number) =>
    queryOptions({
      queryKey: [...quotationQueries.details(), id] as const,
      queryFn: async () => {
        const dto = await getQuotation(id);
        return quotationMapper.toDomain(dto);
      },
      staleTime: 1000 * 60 * 5,
    }),
};

// Usage in components:
// const { data } = useQuery(quotationQueries.detail(id));
// const { data } = useQuery(quotationQueries.list({ page: 0, size: 10, ... }));

// Invalidation:
// queryClient.invalidateQueries({ queryKey: quotationQueries.lists() });
```

### 3. Command Function Pattern (`create-user.ts`)

Each command combines: **Request type (inline) + Input types + Mapping + API call**

```typescript
import { httpClient, USER_ENDPOINTS } from '@/shared/api';
import type { RoleName } from '../model/role';
import type { UserDetailsResponse } from './user.mapper';

// =============================================================================
// REQUEST TYPE (internal - not exported)
// =============================================================================

interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  fullName: string;
  roles: RoleName[];
}

// =============================================================================
// INPUT TYPES (exported for form usage)
// =============================================================================

export interface CreateUserInput {
  username: string;
  email: string;
  password: string;
  fullName: string;
  roles: RoleName[];
}

// =============================================================================
// MAPPING (Input → Request)
// =============================================================================

function toCreateRequest(input: CreateUserInput): CreateUserRequest {
  return {
    username: input.username.trim().toLowerCase(),
    email: input.email.trim().toLowerCase(),
    password: input.password,
    fullName: input.fullName.trim(),
    roles: input.roles,
  };
}

// =============================================================================
// API FUNCTION (exported)
// =============================================================================

export async function createUser(input: CreateUserInput): Promise<UserDetailsResponse> {
  const request = toCreateRequest(input);
  return httpClient.post<UserDetailsResponse>(USER_ENDPOINTS.BASE, request);
}
```

### 4. Getter Functions (`get-{entity}-by-id.ts`, `get-{entity}-list.ts`)

Simple HTTP GET operations, return response types (mapping happens in query factory):

```typescript
export async function getQuotation(id: number): Promise<QuotationDetailsResponse> {
  return httpClient.get<QuotationDetailsResponse>(QUOTATION_ENDPOINTS.byId(id));
}

export async function getQuotations(params?: QuotationListParams): Promise<Paginated<QuotationDetailsResponse>> {
  const response = await httpClient.requestWithMeta<PagedResponse<QuotationDetailsResponse>>({
    method: 'GET',
    url: QUOTATION_ENDPOINTS.BASE,
    params,
  });
  return transformPagedResponse(response.data, response.metadata);
}
```

---

## Usage Examples

### In Pages (Data Fetching)

```typescript
import { useQuery } from '@tanstack/react-query';
import { quotationQueries, QuotationTable, quotationRules } from '@/entities/quotation';

function QuotationListPage() {
  const { data, isLoading } = useQuery(
    quotationQueries.list({ page: 0, size: 10, search: '', status: null, projectId: null })
  );

  return (
    <QuotationTable
      quotations={data?.data ?? []}
      onRowClick={q => navigate(`/quotations/${q.id}`)}
      renderActions={q => quotationRules.canEdit(q) && <EditButton />}
    />
  );
}
```

### In Features (Mutations)

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createQuotation, quotationQueries, type CreateQuotationInput } from '@/entities/quotation';

export function useCreateQuotation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateQuotationInput) => createQuotation(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: quotationQueries.lists() });
    },
  });
}
```

---

## Feature Layer Guidelines

### Structure: Group Slices

Features are organized as **group slices** (see [Group Slices vs Slices](#group-slices-vs-slices)):

```
features/quotation/          # Group slice - NO index.ts here!
├── create/                  # Slice
│   ├── model/use-create-quotation.ts
│   └── index.ts            # ✅ Public API
├── update/                  # Slice
│   ├── model/use-update-quotation.ts
│   └── index.ts            # ✅ Public API
├── form/                    # Slice
│   ├── ui/QuotationForm.tsx
│   └── index.ts            # ✅ Public API
└── notify/                  # Slice
    ├── model/use-send-notification.ts
    ├── ui/EmailNotificationModal.tsx
    └── index.ts            # ✅ Public API
```

### What TO Export (per slice)

```typescript
// features/quotation/create/index.ts
export { useCreateQuotation, type UseCreateQuotationOptions } from './model/use-create-quotation';

// features/quotation/form/index.ts
export { QuotationForm, type QuotationFormProps } from './ui/QuotationForm';
```

### Import Pattern

```typescript
// ✅ Correct: Import from slice
import { useCreateQuotation } from '@/features/quotation/create';
import { QuotationForm } from '@/features/quotation/form';

// ❌ Wrong: No group-level barrel export exists
import { useCreateQuotation, QuotationForm } from '@/features/quotation';
```

### What NOT to Export

- Internal mutation logic
- Validation helpers used only inside mutations
- Internal UI components used only by exported components

---

## Shared Layer Guidelines

Unlike entities/features, shared layer exports **per segment**:

```
shared/
├── ui/index.ts          # Button, Card, Modal, etc.
├── api/index.ts         # httpClient, endpoints, DomainValidationError
├── formatting/index.ts  # formatDate, Money
├── pagination/index.ts  # usePaginatedSearch
└── types/index.ts       # Pagination, ApiResponse
```

Each segment has its own public API.

---

## Checklist Before Adding an Export

Before adding any export to `index.ts`, ask:

1. **Do consumers need this directly?**
   - If only used internally → Don't export

2. **Is this an implementation detail?**
   - Response/Request types, mappers, internal helpers → Don't export

3. **Can consumers achieve this through existing exports?**
   - If yes → Don't add redundant export

4. **Will changing this break external code?**
   - If you want freedom to refactor → Don't export

---

## ESLint Enforcement

To prevent importing from internal modules, configure ESLint:

```javascript
// .eslintrc.js
'@typescript-eslint/no-restricted-imports': ['error', {
  patterns: [
    {
      group: ['@/entities/*/model/*', '@/entities/*/api/*', '@/entities/*/ui/*'],
      message: 'Import from @/entities/{entity} barrel export, not internal modules',
    },
    {
      group: ['@/features/*/*'],
      message: 'Import from @/features/{feature} barrel export, not internal modules',
    },
  ],
}]
```

---

## Migration Strategy

When reducing exports:

1. **Find usages** of items you want to make internal
2. **Refactor consumers** to use public API instead
3. **Remove from barrel** export
4. **Verify** with `npm run build`

---

## Summary

| Layer | Public API Pattern |
|-------|-------------------|
| `entities/` | One `index.ts` per entity, minimal exports |
| `features/` | One `index.ts` per feature, only hooks + shared UI |
| `shared/` | One `index.ts` per segment |
| `widgets/` | One `index.ts` per widget |
| `pages/` | One `index.ts` per page (usually just the component) |

**Remember**: Less is more. When in doubt, don't export it.
