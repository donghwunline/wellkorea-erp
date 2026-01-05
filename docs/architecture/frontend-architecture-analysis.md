# Frontend Architecture Analysis & Proposed Redesign

> **⚠️ Document Status (January 2026)**
>
> This document was written as a proposal for FSD migration. The migration has been completed with some pattern updates:
>
> **Key Changes from Original Proposal:**
> 1. **No `query/` segment** - Queries and commands both live in `api/` segment
> 2. **Query Factory Pattern** - Use `queryOptions()` directly instead of custom hooks like `useQuotation()`
> 3. **Group Slices in features/** - No barrel exports at group level (e.g., no `features/quotation/index.ts`)
>
> **Current Pattern Reference:**
> - See `entities/quotation/` for reference entity implementation
> - See [fsd-public-api-guidelines.md](./fsd-public-api-guidelines.md) for export rules
> - See `CLAUDE.md` for up-to-date architecture documentation

This document analyzes the current WellKorea ERP frontend architecture, identifies pain points, and proposes a redesigned architecture following **Feature-Sliced Design (FSD-lite)** principles aligned with the backend's DDD + CQS patterns.

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current Architecture Analysis](#current-architecture-analysis)
   - [Layer Structure](#layer-structure)
   - [Data Flow Patterns](#data-flow-patterns)
   - [State Management](#state-management)
3. [Pain Points & Issues](#pain-points--issues)
   - [P1: Missing Domain Layer](#p1-missing-domain-layer-high-priority)
   - [P2: Type Sprawl & DTO Coupling](#p2-type-sprawl--dto-coupling-medium-priority)
   - [P3: Component Complexity](#p3-component-complexity-medium-priority)
   - [P4: Thin Service Layer](#p4-thin-service-layer-medium-priority)
   - [P5: No Query/Command Separation](#p5-no-querycommand-separation-medium-priority)
4. [Proposed Architecture: FSD-Lite](#proposed-architecture-fsd-lite)
   - [Directory Structure](#directory-structure)
   - [Layer Definitions & Responsibilities](#layer-definitions--responsibilities)
   - [Dependency Rules](#dependency-rules)
5. [Key Architecture Decisions](#key-architecture-decisions)
6. [Domain Modeling Strategy](#domain-modeling-strategy)
   - [Entity Layer Design](#entity-layer-design)
   - [DTO to Domain Mapping](#dto-to-domain-mapping)
   - [Domain Behavior](#domain-behavior)
7. [Query/Command Separation with TanStack Query](#querycommand-separation-with-tanstack-query)
   - [Query Pattern (Read Operations)](#query-pattern-read-operations)
   - [Command Pattern (Write Operations)](#command-pattern-write-operations)
   - [Optimistic Updates](#optimistic-updates)
8. [Migration Strategy](#migration-strategy)
9. [Appendix: File Mappings](#appendix-file-mappings)
10. [Future Enhancements (Optional)](#future-enhancements-optional)

---

## Executive Summary

### Current State

The WellKorea ERP frontend follows a **strict layered architecture** with good separation of concerns:
- **API Layer**: HTTP infrastructure with automatic token refresh
- **Service Layer**: Thin API wrappers with basic DTO normalization
- **State Layer**: Minimal global state (Zustand for auth only)
- **Component Layer**: Pages, smart feature components, dumb UI components

**Strengths:**
- ESLint-enforced layer boundaries
- Well-organized project structure
- Consistent patterns across features
- Good TypeScript coverage

**Critical Gaps:**
1. **No Domain Layer** - Components work directly with API DTOs
2. **No Query/Command Separation** - Manual `useState` + `useEffect` for all data fetching
3. **Type Sprawl** - 87 types scattered across 9 `types.ts` files
4. **Business Logic in Components** - Calculations, validations scattered in UI

### Proposed Solution

Adopt **FSD-Lite (Feature-Sliced Design)** with:
1. **Entities Layer** - Domain models with behavior, separate from API DTOs
2. **Features Layer** - User actions/workflows as isolated units
3. **TanStack Query** - Query/Command separation matching backend CQS
4. **Domain Language** - Frontend uses same terms as backend DDD

---

## Current Architecture Analysis

### Layer Structure

```
Current Structure:
┌─────────────────────────────────────────────────────────────┐
│  pages/           (Top Level - Route Orchestration)         │
├─────────────────────────────────────────────────────────────┤
│  components/features/  (Smart Components + Hooks)           │
├─────────────────────────────────────────────────────────────┤
│  stores/          (Zustand - Auth Only)                     │
│  shared/hooks/    (Generic Hooks)                           │
├─────────────────────────────────────────────────────────────┤
│  services/        (API Wrappers)                            │
├─────────────────────────────────────────────────────────────┤
│  api/             (HTTP Client)                             │
├─────────────────────────────────────────────────────────────┤
│  components/ui/   (Dumb Components)                         │
│  shared/types/    (TypeScript Types)                        │
│  shared/utils/    (Utilities)                               │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow Patterns

**Current Flow (No Domain Layer):**
```
API Response → Service (normalize) → Component (useState) → Render
                     ↓
             QuotationDetails DTO (API shape)
                     ↓
             Component uses DTO directly
             Business logic IN component:
             - Total calculation
             - Status validation
             - Derived fields
```

**Example: Quotation Total Calculation (Current)**
```typescript
// components/features/quotations/QuotationForm.tsx
// Business logic embedded in component
const totalAmount = formState.lineItems.reduce(
  (sum, item) => sum + item.quantity * item.unitPrice,
  0
);
```

### State Management

**Current 4-Tier State Separation:**

| Tier | Location  | What                            | Tool                     |
|------|-----------|---------------------------------|--------------------------|
| 1    | Component | Form inputs, modals, loading    | `useState`               |
| 2    | Page      | Search, pagination, filters     | `useState`               |
| 3    | Component | Server data (users, quotations) | `useState` + `useEffect` |
| 4    | Global    | Auth state only                 | Zustand                  |

**Problems with Current Approach:**

1. **No Caching** - Every component refetches on mount
2. **No Deduplication** - Same data fetched by multiple components
3. **Manual Invalidation** - `refreshTrigger` prop pattern
4. **Repetitive Boilerplate** - Every table component has same 50 lines of state management

---

## Pain Points & Issues

### P1: Missing Domain Layer (HIGH PRIORITY)

**Impact: Critical** - Business logic is scattered, hard to test, no reuse

**Current State:**
- Components work directly with `QuotationDetails`, `ProjectDetails` DTOs
- No `Quotation`, `Project` domain classes with methods
- Business rules embedded in components and hooks

**Evidence:**

```typescript
// QuotationForm.tsx - Status logic in component
const canEdit = quotation?.status === 'DRAFT';
const canSubmit = quotation?.status === 'DRAFT' && lineItems.length > 0;

// ProductSelector.tsx - Calculation in component
const lineTotal = quantity * unitPrice;
const totalAmount = lineItems.reduce((sum, i) => sum + i.lineTotal, 0);
```

**Backend Comparison:**
```java
// Backend has rich domain model
public class Quotation {
  public boolean canBeEdited() { return status == DRAFT; }
  public Money calculateTotalAmount() { ... }
  public void submit(User submitter) {
    validateBeforeSubmit();
    this.status = PENDING;
    publishEvent(new QuotationSubmittedEvent(...));
  }
}
```

**Frontend has only DTOs - no domain behavior.**

---

### P2: Type Sprawl & DTO Coupling (MEDIUM PRIORITY)

**Impact: Medium** - Types are API-coupled, change propagation is fragile

**Current State:**
- 87 type definitions across 9 `types.ts` files
- All types are API DTOs (1:1 mirror of backend responses)
- Components import types from `@/services` (API layer)

**Type File Distribution:**

| File                           | Interface Count | Type Count |
|--------------------------------|-----------------|------------|
| `services/quotations/types.ts` | 17              | 5          |
| `services/projects/types.ts`   | 9               | 3          |
| `services/companies/types.ts`  | 11              | 2          |
| `services/users/types.ts`      | 8               | 3          |
| `services/products/types.ts`   | 7               | 2          |
| `services/catalog/types.ts`    | 8               | 2          |
| `api/types.ts`                 | 10              | 3          |
| `shared/types/auth.ts`         | 3               | 1          |
| `services/auth/types.ts`       | 4               | 1          |

**Problems:**
1. Components depend on API DTO shapes
2. Backend API change = frontend-wide type update
3. No separation between:
   - API DTOs (what backend sends)
   - Domain Models (what business logic uses)
   - View Models (what UI renders)

---

### P3: Component Complexity (MEDIUM PRIORITY)

**Impact: Medium** - Repetitive code, poor testability

**Current Pattern (Every Table Component):**
```typescript
export function ProjectTable({ page, search, refreshTrigger, ... }) {
  // 1. Server state (manual)
  const [projects, setProjects] = useState<ProjectDetails[]>([]);
  const [pagination, setPagination] = useState<PaginationMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 2. Fetch function
  const fetchProjects = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await projectService.getProjects({ page, size: 10, search });
      setProjects(result.data);
      setPagination(result.pagination);
    } catch {
      setError('Failed to load projects');
    } finally {
      setIsLoading(false);
    }
  }, [page, search]);

  // 3. Effect for refetch
  useEffect(() => { fetchProjects(); }, [fetchProjects, refreshTrigger]);

  // 4. Render...
}
```

**This pattern is duplicated in:**
- `ProjectTable.tsx` (213 lines)
- `QuotationTable.tsx` (~250 lines)
- `CompanyTable.tsx` (~200 lines)
- `UserManagementTable.tsx` (295 lines)

**Problems:**
- 50+ lines of boilerplate per table
- No caching, no request deduplication
- Manual `refreshTrigger` prop for invalidation
- Hard to test (fetch logic mixed with UI)

---

### P4: Thin Service Layer (MEDIUM PRIORITY)

**Impact: Medium** - Services are just API proxies

**Current Service Pattern:**
```typescript
// services/projects/projectService.ts
export const projectService = {
  async getProjects(params?: ProjectListParams): Promise<PaginatedProjects> {
    const response = await httpClient.requestWithMeta<PagedResponse<ProjectDetails>>({
      method: 'GET',
      url: PROJECT_ENDPOINTS.BASE,
      params,
    });
    // Only transformation: pagination + string trim
    const paginated = transformPagedResponse(response.data, response.metadata);
    return {
      ...paginated,
      data: paginated.data.map(transformProjectDetails),
    };
  },
}

function transformProjectDetails(dto: ProjectDetails): ProjectDetails {
  return {
    ...dto,
    projectName: dto.projectName?.trim() ?? '',  // Just normalization
    requesterName: dto.requesterName?.trim() ?? null,
  };
}
```

**What Services Do:**
- Call HTTP endpoints
- Transform pagination metadata
- Normalize strings (`.trim()`, null coalescing)

**What Services DON'T Do:**
- Business logic
- Domain validation
- Cross-entity operations
- Data aggregation

---

### P5: No Query/Command Separation (MEDIUM PRIORITY)

**Impact: Medium** - Frontend doesn't match backend CQS pattern

**Backend CQS Pattern:**
```java
// Command: Returns only ID
public Long createQuotation(CreateQuotationCommand cmd) {
  Quotation quotation = new Quotation(...);
  return quotationRepository.save(quotation).getId();
}

// Query: Returns full data
public QuotationDetailView getQuotation(Long id) {
  return quotationQueryRepository.findDetailViewById(id);
}
```

**Frontend Current State:**
```typescript
// All operations use same pattern - no distinction
async createQuotation(request: CreateQuotationRequest): Promise<CommandResult> {
  return httpClient.post<CommandResult>(QUOTATION_ENDPOINTS.BASE, request);
}

async getQuotation(id: number): Promise<QuotationDetails> {
  return httpClient.get<QuotationDetails>(QUOTATION_ENDPOINTS.byId(id));
}
```

**What's Missing:**
- Query caching and invalidation (TanStack Query)
- Command handling with loading/error states
- Optimistic updates for better UX
- Mutation callbacks (onSuccess, onError)

---

## Proposed Architecture: FSD-Lite

### Directory Structure

```
src/
├── app/                      # Application setup
│   ├── providers/           # QueryClient, i18n, theme providers
│   ├── router/              # Route configuration
│   └── styles/              # Global styles
│
├── pages/                    # Route-level components (ASSEMBLY ONLY)
│   ├── login/
│   ├── dashboard/
│   ├── projects/
│   │   ├── list/
│   │   └── [id]/
│   ├── quotations/
│   │   ├── list/
│   │   ├── create/
│   │   └── [id]/
│   └── admin/
│       └── users/
│
├── widgets/                  # Composite UI blocks (FEATURE COMPOSITION)
│   ├── quotation/
│   │   ├── QuotationDetailActionsPanel.tsx  # Combines approve/reject/submit
│   │   ├── QuotationListToolbar.tsx         # Bulk actions, filters
│   │   └── index.ts
│   ├── project/
│   │   └── ProjectStatusPanel.tsx
│   └── approval/
│       └── ApprovalWorkflowPanel.tsx
│
├── features/                 # User actions / workflows (ISOLATED UNITS)
│   ├── quotation/
│   │   ├── create/          # Create quotation workflow
│   │   │   ├── ui/         # CreateQuotationForm
│   │   │   ├── model/      # useCreateQuotation hook
│   │   │   └── index.ts
│   │   ├── approve/         # Approval workflow
│   │   │   ├── ui/         # ApprovalDialog
│   │   │   ├── model/      # useApproveQuotation hook
│   │   │   └── index.ts
│   │   ├── submit/          # Submit for approval
│   │   └── generate-pdf/    # PDF generation
│   ├── project/
│   │   ├── create/
│   │   └── update-status/
│   ├── auth/
│   │   ├── login/
│   │   └── logout/
│   └── user/
│       ├── create/
│       ├── assign-roles/
│       └── manage-customers/
│
├── entities/                 # Domain models (TYPES + RULES + QUERIES)
│   ├── quotation/
│   │   ├── model/           # Domain types and pure functions
│   │   │   ├── quotation.ts           # Quotation type + quotationRules
│   │   │   ├── line-item.ts           # LineItem type + lineItemRules
│   │   │   └── quotation-status.ts    # Status enum + display config
│   │   ├── api/             # API layer (queries + commands)
│   │   │   ├── quotation.dto.ts       # API DTOs (internal)
│   │   │   ├── quotation.mapper.ts    # DTO ↔ Domain mapping (internal)
│   │   │   ├── quotation.queries.ts   # Query factory with queryOptions()
│   │   │   ├── get-quotation.ts       # HTTP GET operations (internal)
│   │   │   ├── create-quotation.ts    # Command: Input + validation + POST
│   │   │   └── update-quotation.ts    # Command: Input + validation + PUT
│   │   ├── ui/              # Entity-level UI components
│   │   │   ├── QuotationCard.tsx
│   │   │   ├── QuotationTable.tsx     # Display only, no fetching
│   │   │   └── QuotationStatusBadge.tsx
│   │   └── index.ts
│   ├── project/
│   │   ├── model/
│   │   ├── api/
│   │   └── ui/
│   ├── company/
│   ├── user/
│   └── approval/
│
├── shared/                   # Cross-cutting concerns
│   ├── api/                 # HTTP infrastructure
│   │   ├── http-client.ts
│   │   ├── api-error.ts
│   │   └── interceptors/
│   ├── ui/                  # Design system
│   │   ├── button/
│   │   ├── table/
│   │   ├── modal/
│   │   └── index.ts
│   ├── lib/                 # Pure utilities
│   │   ├── date.ts
│   │   ├── money.ts
│   │   └── validation.ts
│   └── types/               # Only truly shared types
│       ├── pagination.ts
│       └── api-response.ts
│
└── stores/                   # Global state (minimal)
    └── auth/
        └── auth.store.ts
```

### Layer Definitions & Responsibilities

#### 1. `app/` - Application Bootstrap

**Responsibility:** Initialize application, configure providers

```typescript
// app/providers/query-provider.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30,   // 30 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export function QueryProvider({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

---

#### 2. `pages/` - Route Components (ASSEMBLY ONLY)

**Responsibility:** Route handling, layout, compose features

**Rules:**
- NO business logic
- NO direct service/API calls
- Only import from: `features/`, `entities/`, `shared/`
- Compose features and entity UI components

```typescript
// pages/quotations/list/QuotationListPage.tsx
import { QuotationTable, useQuotations } from '@/entities/quotation';
import { CreateQuotationButton } from '@/features/quotation/create';
import { PageLayout, SearchBar } from '@/shared/ui';

export function QuotationListPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);

  // Query from entity layer
  const { data, isLoading, error } = useQuotations({ search, page });

  return (
    <PageLayout>
      <PageLayout.Header>
        <SearchBar value={search} onChange={setSearch} />
        <CreateQuotationButton />  {/* Feature action */}
      </PageLayout.Header>

      <QuotationTable            {/* Entity display component */}
        data={data?.items ?? []}
        isLoading={isLoading}
        error={error}
        pagination={data?.pagination}
        onPageChange={setPage}
      />
    </PageLayout>
  );
}
```

---

### Quick Reference: Where Does This Component Go?

Use this table when deciding where to place a new component:

| Component Type | Layer | Example | Key Indicator |
|----------------|-------|---------|---------------|
| Single entity display (read-only) | `entities/*/ui` | `QuotationCard`, `ProjectBadge`, `QuotationTable` | Displays ONE entity type, no actions |
| User action button/form | `features/*/ui` | `SubmitQuotationButton`, `CreateQuotationForm` | Triggers mutation, contains action logic |
| Multi-feature composition | `widgets/*` | `QuotationDetailActionsPanel`, `ProjectStatusPanel` | Combines 2+ features OR multiple entity displays |
| Route-level view | `pages/*` | `QuotationListPage`, `ProjectDetailPage` | URL params + layout assembly only |

**Quick Decision Tree:**
```
Does it trigger a mutation or side-effect?
├─ YES → features/*/ui
└─ NO
   └─ Does it display a single entity?
      ├─ YES → entities/*/ui
      └─ NO (combines multiple things)
         └─ Is it reused across pages?
            ├─ YES → widgets/*
            └─ NO (page-specific) → pages/*
```

---

#### 3. `widgets/` - Composite UI Blocks (FEATURE COMPOSITION)

**Responsibility:** Combine multiple features into reusable UI panels

**Why widgets?** In ERP systems, pages often need multiple related actions (approve/reject/submit/version-up) in one section. Without widgets, pages become bloated with composition logic. Widgets provide a buffer layer that keeps pages as "assembly only."

**Rules:**
- Combines multiple features into cohesive UI blocks
- Imports from: `features/`, `entities/`, `shared/`
- NO business logic - only composition and layout
- Each widget is a self-contained, reusable panel

> ⚠️ **Widget Behavior Boundary**
>
> Widgets can use domain rules for **visibility/display decisions ONLY**:
> - ✅ `quotationRules.canSubmit(quotation)` → show/hide SubmitButton
> - ✅ `quotationRules.isExpired(quotation)` → show warning badge
> - ✅ `quotationRules.daysUntilExpiry(quotation)` → display countdown
>
> Widgets must **NEVER**:
> - ❌ Call mutations directly (`useMutation`, `mutate()`)
> - ❌ Trigger UX side-effects (`toast()`, `navigate()`, modal state)
> - ❌ Make business decisions beyond visibility
>
> **All actual behavior (mutations + side-effects) lives in feature components**, which widgets compose but don't control.
>
> ```typescript
> // ✅ Widget controls visibility only
> {quotationRules.canApprove(quotation) && <ApproveButton id={id} />}
>
> // ❌ Widget should NEVER do this
> const { mutate } = useApprove();
> <button onClick={() => mutate(id)}>Approve</button>
> ```

> ⚠️ **Widget Data Fetching Rule**
>
> **Principle:** Prefer pages to fetch data and pass to widgets via props.
>
> **When widget self-fetches (`useQuery` inside widget):**
> - Data dependencies become hidden (page layout doesn't show what queries are needed)
> - Risk of waterfall loading if page and widget both query the same data
> - React Query deduplication helps, but loading UX can become fragmented
>
> **Rule:**
> ```typescript
> // ✅ Default: Page fetches, widget receives props
> function QuotationDetailPage({ id }) {
>   const { data: quotation } = useQuotation(id);
>   return <QuotationActionsPanel quotation={quotation} />;  // Props!
> }
>
> // ⚠️ Exception: Widget self-fetches ONLY when:
> // 1. Widget is reused across 2+ pages, AND
> // 2. Required data differs per page (can't pass consistent props)
> function QuotationActionsPanel({ quotationId }) {
>   const { data: quotation } = useQuotation(quotationId);  // Self-fetch
>   // ...
> }
> ```
>
> **Decision Tree:**
> ```
> Is this widget reused across multiple pages?
> ├─ NO → Page fetches, pass via props
> └─ YES
>    └─ Can all pages provide the same props?
>       ├─ YES → Page fetches, pass via props
>       └─ NO → Widget may self-fetch (document why)
> ```

**When to create a widget (and when NOT to):**

> ⚠️ **widgets/ Usage Criteria**
>
> **Create a widget when:**
> - ✅ Combining **2+ features** into a single panel (e.g., ApproveButton + RejectButton + SubmitButton)
> - ✅ Same composition logic repeats across **2+ pages** (DRY)
> - ✅ Page component would exceed **~30 lines** of composition code
>
> **Do NOT create a widget when:**
> - ❌ Using only **1 feature** - import directly in page
> - ❌ Composition is **page-specific** and won't repeat
> - ❌ Widget would just be a **pass-through wrapper** adding no value
>
> **Examples:**
> ```typescript
> // ❌ Bad: Single feature - no widget needed
> // widgets/quotation/CreateQuotationPanel.tsx
> export function CreateQuotationPanel() {
>   return <CreateQuotationButton />;  // Just wrapping one component!
> }
>
> // ✅ Good: Multiple features composed
> // widgets/quotation/QuotationDetailActionsPanel.tsx
> export function QuotationDetailActionsPanel({ quotationId }) {
>   return (
>     <ActionPanel>
>       <SubmitButton />
>       <ApproveButton />
>       <RejectButton />
>       <GeneratePdfButton />
>     </ActionPanel>
>   );
> }
> ```

```typescript
// widgets/quotation/QuotationDetailActionsPanel.tsx
import { ApproveButton } from '@/features/quotation/approve';
import { RejectButton } from '@/features/quotation/reject';
import { SubmitButton } from '@/features/quotation/submit';
import { GeneratePdfButton } from '@/features/quotation/generate-pdf';
import { quotationRules, type Quotation } from '@/entities/quotation';

interface Props {
  quotation: Quotation;  // ✅ Receive via props (follows Widget Data Fetching Rule)
}

export function QuotationDetailActionsPanel({ quotation }: Props) {
  return (
    <ActionPanel>
      {quotationRules.canSubmit(quotation) && <SubmitButton id={quotation.id} />}
      {quotationRules.canApprove(quotation) && <ApproveButton id={quotation.id} />}
      {quotationRules.canReject(quotation) && <RejectButton id={quotation.id} />}
      {quotationRules.canGeneratePdf(quotation) && <GeneratePdfButton id={quotation.id} />}
    </ActionPanel>
  );
}
```

**Page usage (page fetches, widget receives props):**
```typescript
// pages/quotations/[id]/QuotationDetailPage.tsx
import { QuotationDetailActionsPanel } from '@/widgets/quotation';
import { QuotationCard, useQuotation } from '@/entities/quotation';

export function QuotationDetailPage({ id }: { id: number }) {
  const { data: quotation, isLoading } = useQuotation(id);

  if (isLoading || !quotation) return <LoadingSpinner />;

  return (
    <PageLayout>
      <QuotationCard quotation={quotation} />
      <QuotationDetailActionsPanel quotation={quotation} />  {/* Props! */}
    </PageLayout>
  );
}
```

---

#### 4. `features/` - User Actions (ISOLATED WORKFLOWS)

**Responsibility:** Encapsulate complete user actions with UI + logic

**Rules:**
- One feature = one user action or workflow
- Contains: UI components, hooks, validation
- Imports from: `entities/`, `shared/`
- Each feature exports a single entry point
- Features do NOT import from other features (use widgets for composition)

```typescript
// features/quotation/create/index.ts
export { CreateQuotationButton } from './ui/CreateQuotationButton';
export { CreateQuotationForm } from './ui/CreateQuotationForm';
```

```typescript
// features/quotation/create/model/use-create-quotation.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  quotationApi,
  quotationQueryKeys,
  quotationQueryFns,
  quotationValidation,
  quotationCommandMapper,
} from '@/entities/quotation';
import type { CreateQuotationInput } from './types';

export function useCreateQuotation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateQuotationInput) => {
      // 1. Validate domain rules (using command mapper first)
      const command = quotationCommandMapper.toCommand(input);
      quotationValidation.validateCreate(command);

      // 2. Map command to API DTO and call API
      return quotationApi.create(quotationCommandMapper.toCreateDto(command));
    },
    onSuccess: (result) => {
      // Invalidate list queries
      queryClient.invalidateQueries({
        queryKey: quotationQueryKeys.lists()
      });

      // Prefetch the new quotation (MUST reuse quotationQueryFns for cache consistency)
      queryClient.prefetchQuery({
        queryKey: quotationQueryKeys.detail(result.id),
        queryFn: quotationQueryFns.detail(result.id),  // ✅ Domain model in cache
      });
    },
    onError: (error) => {
      // Error handling
    },
  });
}
```

---

#### 5. `entities/` - Domain Models (TYPES + BEHAVIOR + QUERIES)

**Responsibility:** Domain knowledge, types, API, queries

**Structure per entity:**
- `model/` - Domain types and pure functions for behavior
- `api/` - DTOs, mappers, query factory, command functions
- `ui/` - Entity display components (tables, cards, badges)

**Rules:**
- Contains business logic (validation, calculations, status rules)
- Separates API DTOs from domain models
- Imports from: `shared/` only
- Exports: models, hooks, types, UI components

**Bounded Context Guidance (Scaling entities/):**

> ⚠️ **Organize entities by domain/bounded context, not by technical type**
>
> As the ERP grows (payment, settlement, production, logistics...), prevent `entities/` from becoming a monolith:
>
> **Current (small scale):**
> ```
> entities/
> ├── quotation/
> ├── project/
> ├── company/
> ├── user/
> └── approval/
> ```
>
> **Future (large scale - group by bounded context):**
> ```
> entities/
> ├── sales/           # Bounded context: Sales
> │   ├── quotation/
> │   ├── order/
> │   └── customer/
> ├── production/      # Bounded context: Production
> │   ├── work-order/
> │   ├── bom/
> │   └── routing/
> ├── inventory/       # Bounded context: Inventory
> │   ├── stock/
> │   └── warehouse/
> └── core/            # Shared core entities
>     ├── user/
>     └── company/
> ```
>
> **Key Principle:** Entities within the same bounded context can share types and reference each other. Cross-BC references should go through IDs only (not direct imports).

**Query Factory Read-Only Rule:**

> ⚠️ **Query factory in entities/*/api/ must remain read-only (no business decisions)**
>
> Query factory methods (`quotationQueries.detail()`, etc.) are strictly for:
> 1. **Data fetching** - API calls via `queryFn`
> 2. **DTO → Domain mapping** - Transform API responses to domain models
> 3. **Cache configuration** - `staleTime`, `gcTime`, `placeholderData`
>
> **Forbidden in query factory:**
> - ❌ Business decisions (if-else based on status, role checks)
> - ❌ Side effects beyond caching (toast notifications, navigation)
> - ❌ Calling other mutations or commands
>
> **Why this matters:** The `entities/` layer can become a monolith if query factory starts accumulating business logic. Keep queries "dumb" - they fetch, map, and cache. Business decisions belong in `features/` or `quotationRules`.

> ⚠️ **Team Rule: UX Side-Effects belong in features/ ONLY**
>
> The following side-effects must NEVER appear in `entities/`:
> - ❌ `toast()` / notification calls
> - ❌ `navigate()` / `router.push()`
> - ❌ Modal open/close state changes
> - ❌ Analytics tracking
> - ❌ `console.log` for user feedback
>
> **All UX side-effects go in `features/` mutation hooks:**
> ```typescript
> // ✅ features/quotation/approve/model/use-approve-quotation.ts
> onSuccess: () => {
>   toast.success('Quotation approved');
>   navigate(`/quotations/${id}`);
> }
>
> // ❌ entities/quotation/api/quotation.queries.ts
> // NEVER add side-effects in query factory
> ```
>
> **Why this matters:** Once side-effects enter entities, testing becomes harder and the layer loses its "pure data" nature. Features own user interactions; entities own data.

**entities/ui/ Special Rules (Maintaining Reusability):**

> ⚠️ **Keep entities/ui as "truly dumb" components**
>
> Components in `entities/*/ui/` live or die by their reusability. They must **never include:**
>
> 1. **Router dependencies** - `useNavigate`, `useParams`, `Link`, etc.
>    - ❌ Direct navigation on row click in `QuotationTable`
>    - ✅ Delegate routing via `onRowClick` callback prop
>
> 2. **Feature-specific action buttons** - "Approve", "Submit for Approval", etc.
>    - ❌ Hardcoding "Submit for Approval" button in `QuotationCard`
>    - ✅ Inject via `actions` slot or `renderActions` prop
>
> 3. **Mutation hooks** - `useCreateQuotation`, `useApprove`, etc.
>    - entities/ui is read-only (display only)
>    - Write actions should be composed in `features/ui`

**Good Example:**
```typescript
// entities/quotation/ui/QuotationTable.tsx (DUMB)
interface QuotationTableProps {
  data: Quotation[];
  onRowClick?: (quotation: Quotation) => void;  // Delegate routing via callback
  renderActions?: (quotation: Quotation) => ReactNode;  // Action slot
}
```

**Bad Example:**
```typescript
// ❌ entities/quotation/ui/QuotationTable.tsx
import { useNavigate } from 'react-router-dom';  // Router dependency!
import { useSubmitForApproval } from '@/features/quotation/submit';  // Feature dependency!

function QuotationTable({ data }) {
  const navigate = useNavigate();
  const { mutate: submit } = useSubmitForApproval();

  // This belongs in features/quotation/list/ui/QuotationListTable.tsx
}
```

> ⚠️ **Team Rule: Cross-Entity Aggregation Goes to widgets/**
>
> When a UI component needs data from **multiple entities** (e.g., project + quotations + approvals), it belongs in `widgets/`, NOT in `entities/`.
>
> **Why?** Keeping entities isolated prevents:
> - Circular dependencies between entities
> - entities/ becoming a monolith
> - Harder testing (cross-entity mocks)
>
> **Examples:**
> ```typescript
> // ❌ Bad: entities/project/ui/ProjectDashboard.tsx
> // This imports from multiple entities - violates single-entity rule
> import { useProject } from '@/entities/project';
> import { useQuotations } from '@/entities/quotation';
> import { useApprovals } from '@/entities/approval';
>
> // ✅ Good: widgets/project/ProjectDashboardPanel.tsx
> // Widget can compose multiple entities
> import { useProject } from '@/entities/project';
> import { useQuotations } from '@/entities/quotation';
> import { useApprovals } from '@/entities/approval';
> import { ProjectSummaryCard } from '@/entities/project';
> import { QuotationTable } from '@/entities/quotation';
> import { ApprovalBadge } from '@/entities/approval';
>
> export function ProjectDashboardPanel({ projectId }) {
>   // Aggregation logic lives here
> }
> ```
>
> **Quick Rule:** If your component imports from 2+ entities, move it to `widgets/`.

---

#### 6. `shared/` - Cross-cutting Concerns

**Responsibility:** Infrastructure, utilities, design system

**Sub-layers:**
- `api/` - HTTP client, error handling
- `ui/` - Button, Modal, Table, FormField
- `lib/` - Pure functions (date formatting, money formatting)
- `types/` - Only truly shared types (Pagination, ApiResponse)

**Rules:**
- NO imports from any other layer
- Must be truly generic and reusable
- Design system components are dumb (no data fetching)

---

### Dependency Rules

```
┌────────────────────────────────────────────────────────────┐
│                          pages/                            │
│  Imports: widgets/, features/, entities/, shared/          │
│  ASSEMBLY ONLY - no business logic                         │
└────────────────────────────────────────────────────────────┘
                              ↓
┌────────────────────────────────────────────────────────────┐
│                        widgets/                            │
│  Imports: features/, entities/, shared/                    │
│  Composition layer - combines multiple features            │
└────────────────────────────────────────────────────────────┘
                              ↓
┌────────────────────────────────────────────────────────────┐
│                        features/                           │
│  Imports: entities/, shared/                               │
│  NOT: other features (isolated!) - use widgets to compose  │
└────────────────────────────────────────────────────────────┘
                              ↓
┌────────────────────────────────────────────────────────────┐
│                        entities/                           │
│  Imports: shared/ ONLY                                     │
│  NOT: features/, widgets/, pages/                          │
└────────────────────────────────────────────────────────────┘
                              ↓
┌────────────────────────────────────────────────────────────┐
│                         shared/                            │
│  Imports: NOTHING (base layer)                             │
└────────────────────────────────────────────────────────────┘
```

**ESLint Enforcement:**
```javascript
// eslint.config.js
{
  files: ['src/entities/**/*'],
  rules: {
    '@typescript-eslint/no-restricted-imports': ['error', {
      patterns: [
        { group: ['@/features/*'], message: 'entities cannot import features' },
        { group: ['@/widgets/*'], message: 'entities cannot import widgets' },
        { group: ['@/pages/*'], message: 'entities cannot import pages' },
      ],
    }],
  },
},
{
  files: ['src/features/**/*'],
  rules: {
    '@typescript-eslint/no-restricted-imports': ['error', {
      patterns: [
        { group: ['@/pages/*'], message: 'features cannot import pages' },
        // Allow features to import entities, but NOT other features
        { group: ['@/features/*'], message: 'features should be isolated - use widgets for composition' },
      ],
    }],
  },
},
```

> ⚠️ **Operational Tip: Feature Internal Imports**
>
> The `@/features/*` restriction will block ALL feature imports, including internal imports within the same feature if alias paths are used.
>
> **Solution:**
> 1. **Within a feature:** Use **relative imports** only
>    ```typescript
>    // features/quotation/create/ui/CreateQuotationForm.tsx
>    import { useCreateQuotation } from '../model/use-create-quotation';  // ✅ Relative
>    import { useCreateQuotation } from '@/features/quotation/create';    // ❌ Blocked by ESLint
>    ```
>
> 2. **From outside a feature:** Import from **public barrel export** only
>    ```typescript
>    // widgets/quotation/QuotationDetailActionsPanel.tsx
>    import { SubmitButton } from '@/features/quotation/submit';  // ✅ Public API
>    import { useSubmitMutation } from '@/features/quotation/submit/model/use-submit';  // ❌ Internal path
>    ```
>
> **ESLint can enforce this by pattern:**
> ```javascript
> // Additional rule to enforce internal relative imports within features
> {
>   files: ['src/features/**/*'],
>   rules: {
>     'no-restricted-imports': ['error', {
>       patterns: [{
>         group: ['@/features/**/*'],  // Block deep imports to internal modules
>         message: 'Use relative imports within feature, or import from feature barrel export',
>       }],
>     }],
>   },
> },
> ```
>
> **IDE Configuration Tip:**
>
> When enforcing relative imports within features, ensure your IDE auto-import settings are configured correctly:
>
> - **VS Code (TypeScript):** In `settings.json`:
>   ```json
>   "typescript.preferences.importModuleSpecifier": "relative"
>   ```
>   Or per-project in `.vscode/settings.json` scoped to feature folders.
>
> - **WebStorm/IntelliJ:** Settings → Editor → Code Style → TypeScript → Imports → "Use relative path"
>
> Without this, IDE auto-imports may continue generating `@/features/...` paths that ESLint will reject, causing refactoring friction.

---

## Key Architecture Decisions

This section documents critical architectural decisions that affect the entire frontend.

### Decision 1: Domain Model Implementation (Plain Object + Pure Functions)

**Options Considered:**
1. **Class-based** - Classes with methods (`quotation.canEdit()`)
2. **Plain object + pure functions** - Interfaces with standalone functions (`canEdit(quotation)`)

**Decision: Plain Object + Pure Functions** (Recommended)

**Rationale:**
- **React Query DevTools** - Plain objects serialize properly; class instances lose methods
- **Structural sharing** - React Query optimizes re-renders via shallow comparison; classes break this
- **Simpler debugging** - JSON.stringify works without custom serializers
- **No `new` keyword** - Mappers return plain objects, not class instances
- **Team familiarity** - More idiomatic for React/TypeScript codebases

**Implementation:**

```typescript
// entities/quotation/model/quotation.ts
import { isPast, getNow } from '@/shared/lib/date';

// Domain type (plain interface)
export interface Quotation {
  readonly id: number;
  readonly projectId: number;
  readonly status: QuotationStatus;
  readonly expiryDate: string;  // ISO date string: "2025-01-30"
  readonly lineItems: readonly LineItem[];
  // ... other fields
}

// Pure functions for domain behavior
export const quotationRules = {
  canEdit(quotation: Quotation): boolean {
    return quotation.status === QuotationStatus.DRAFT;
  },

  canSubmit(quotation: Quotation): boolean {
    return (
      quotation.status === QuotationStatus.DRAFT &&
      quotation.lineItems.length > 0 &&
      quotationRules.calculateTotal(quotation) > 0
    );
  },

  calculateTotal(quotation: Quotation): number {
    return quotation.lineItems.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );
  },

  /**
   * Check if quotation is expired.
   * Uses centralized date utilities - never use new Date(string) directly!
   * @param now - Optional for deterministic unit testing
   */
  isExpired(quotation: Quotation, now: Date = getNow()): boolean {
    return isPast(quotation.expiryDate, now);
  },
};

// Static validation (for commands)
export const quotationValidation = {
  validateCreate(command: CreateQuotationCommand): void {
    if (!command.projectId) throw new Error('Project is required');
    if (command.lineItems.length === 0) throw new Error('At least one line item required');
  },
};
```

**Usage in Component:**
```typescript
import { quotationRules } from '@/entities/quotation';

function QuotationActions({ quotation }: { quotation: Quotation }) {
  return (
    <>
      {quotationRules.canEdit(quotation) && <EditButton />}
      {quotationRules.canSubmit(quotation) && <SubmitButton />}
    </>
  );
}
```

> ⚠️ **Protecting Domain Invariants with Plain Objects**
>
> Since we use plain objects (not classes), anyone can create `{ ...quotation, status: 'APPROVED' }` bypassing domain rules. To maintain invariants:
>
> **Rule: Domain objects are created ONLY through mappers**
>
> ```typescript
> // ✅ Correct: Create domain objects via mapper
> const quotation = quotationMapper.toDomain(dto);
>
> // ✅ Correct: Update via API + cache invalidation (server ensures rules)
> await quotationApi.approve(id);
> queryClient.invalidateQueries({ queryKey: quotationQueryKeys.detail(id) });
>
> // ❌ Wrong: Manually create domain object
> const fakeQuotation: Quotation = { id: 1, status: 'APPROVED', ... };
>
> // ❌ Wrong: Mutate cache directly (bypasses server validation)
> queryClient.setQueryData(queryKeys.detail(id), { ...old, status: 'APPROVED' });
> ```
>
> **Exception: Optimistic updates** may temporarily set cache to expected state, but must ALWAYS invalidate/refetch after mutation settles to get server-validated data.
>
> **For high-risk domains (money, quantities):** Consider branded types from Future Enhancements to catch mixing errors at compile time.

---

### Decision 2: Cache Data Format (Always Domain Models)

**Rule: Query hooks always return domain models, never DTOs.**

This applies to:
- `useQuery` return values
- `prefetchQuery` calls
- `setQueryData` calls

**Correct Pattern:**

```typescript
// entities/quotation/query/use-quotation.ts
export function useQuotation(id: number) {
  return useQuery({
    queryKey: quotationQueryKeys.detail(id),
    queryFn: async (): Promise<Quotation> => {
      const dto = await quotationApi.getById(id);
      return quotationMapper.toDomain(dto);  // Always map
    },
  });
}

// features/quotation/create/model/use-create-quotation.ts
export function useCreateQuotation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: quotationApi.create,
    onSuccess: async (result) => {
      // Option A: Invalidate and let React Query refetch
      queryClient.invalidateQueries({
        queryKey: quotationQueryKeys.lists()
      });

      // Option B: Prefetch with SAME queryFn pattern (includes mapper)
      // Extract the queryFn to avoid duplication
      queryClient.prefetchQuery({
        queryKey: quotationQueryKeys.detail(result.id),
        queryFn: async () => {
          const dto = await quotationApi.getById(result.id);
          return quotationMapper.toDomain(dto);  // Same mapping!
        },
      });
    },
  });
}
```

**Best Practice: Extract Common QueryFn (Required Standard)**

> ⚠️ **Team Rule: Extracting and reusing queryFn is mandatory**
>
> You **must reuse the same queryFn** in `prefetchQuery`, `ensureQueryData`, `fetchQuery`, etc.
> This ensures DTO→Domain mapping is always applied consistently and prevents cache data format mismatches.

```typescript
// entities/quotation/query/query-fns.ts
export const quotationQueryFns = {
  detail: (id: number) => async (): Promise<Quotation> => {
    const dto = await quotationApi.getById(id);
    return quotationMapper.toDomain(dto);
  },
  list: (page: number, size: number, search: string, status?: QuotationStatus) =>
    async () => {
      const response = await quotationApi.list({ page, size, search, status });
      return {
        items: response.data.map(quotationMapper.toDomain),
        pagination: response.pagination,
      };
    },
};

// Usage in hook
useQuery({
  queryKey: quotationQueryKeys.detail(id),
  queryFn: quotationQueryFns.detail(id),
});

// Usage in prefetch - MUST use same queryFn
queryClient.prefetchQuery({
  queryKey: quotationQueryKeys.detail(id),
  queryFn: quotationQueryFns.detail(id),  // Same function!
});

// Usage in ensureQueryData - MUST use same queryFn
const quotation = await queryClient.ensureQueryData({
  queryKey: quotationQueryKeys.detail(id),
  queryFn: quotationQueryFns.detail(id),  // Same function!
});
```

**Why This Matters:**
- If you only map in `useQuery` but cache raw DTOs in `prefetchQuery`, type mismatches occur
- Using the same queryFn at all cache entry points guarantees cache data is always in Domain format

---

### Decision 3: QueryKey Stability

**Problem:** Object filters in query keys can cause cache instability if recreated every render.

```typescript
// BAD: New object every render = cache key changes
function QuotationListPage() {
  const { data } = useQuotations({ page, size: 10, search });
  //                               ^--- new object each render
}
```

**Solution: Use primitive values in query keys**

```typescript
// entities/quotation/query/query-keys.ts
export const quotationQueryKeys = {
  all: ['quotations'] as const,
  lists: () => [...quotationQueryKeys.all, 'list'] as const,

  // Use individual primitives, NOT an object
  list: (page: number, size: number, search: string, status?: QuotationStatus) =>
    [...quotationQueryKeys.lists(), page, size, search, status] as const,

  details: () => [...quotationQueryKeys.all, 'detail'] as const,
  detail: (id: number) => [...quotationQueryKeys.details(), id] as const,
};

// entities/quotation/query/use-quotations.ts
interface UseQuotationsParams {
  page: number;
  size?: number;
  search?: string;
  status?: QuotationStatus;
}

export function useQuotations({ page, size = 10, search = '', status }: UseQuotationsParams) {
  // Normalize all optional params to prevent undefined in queryKey
  const normalized = {
    page,
    size: size ?? 10,
    search: (search ?? '').trim(),
    status: status ?? null,  // Use null, never undefined
  };

  return useQuery({
    // Primitives ensure stable cache key
    queryKey: quotationQueryKeys.list(normalized.page, normalized.size, normalized.search, normalized.status),
    queryFn: () => quotationApi.list(normalized),
  });
}
```

**QueryKey Rules (Two-Part Policy):**

> ⚠️ **Rule A: Prefer primitives-only for query keys** (default)
>
> **Why we chose this stricter rule:**
> - **Standardization**: Consistent pattern across all queries
> - **Debugging**: Easier to inspect keys in React Query DevTools
> - **Education cost**: Simpler rule for onboarding
>
> **Technical reality:** TanStack Query uses content-based hashing, so plain objects with the same content produce the same cache key—even if they're new object instances each render. However, objects are still discouraged because:
> 1. Certain types cause actual key instability (see forbidden list below)
> 2. Debugging is harder when keys contain nested objects
> 3. Team consistency is easier to enforce with "primitives-only"
>
> **Forbidden types** (cause actual instability):
> - ❌ Functions
> - ❌ `Date` instances (use ISO strings instead)
> - ❌ Class instances
> - ❌ `Map`, `Set`, `WeakMap`, `WeakSet`
> - ❌ Circular references
> - ❌ `undefined` values in objects (use `null` or omit)
>
> Plain JSON objects with sorted keys *would* work, but primitives-only is simpler.

> ⚠️ **Rule A+: Normalize optional params (never undefined in queryKey)**
>
> ```typescript
> // In query hooks, always normalize optional parameters:
> const normalized = {
>   page,
>   size: size ?? 10,           // Default value
>   search: (search ?? '').trim(),  // Empty string, trimmed
>   status: status ?? null,     // null, not undefined
> };
>
> queryKey: quotationQueryKeys.list(
>   normalized.page,
>   normalized.size,
>   normalized.search,
>   normalized.status
> );
> ```
>
> **Why:** `undefined` in arrays can cause subtle cache misses. Always use explicit defaults (`null`, `''`, `0`) to ensure cache key stability.
>
> **Team Standard: "No Filter" Token Values**
>
> | Parameter Type | No Filter Value | Example |
> |----------------|-----------------|---------|
> | Enum/status filters | `null` | `status: null` means "all statuses" |
> | Search text | `''` (empty string) | `search: ''` means "no search" |
> | Numeric with default | default value | `size: 10` (never undefined) |
> | Boolean toggle | `null` | `isActive: null` means "show all" |
> | Array filters | `null` (not empty array) | `companyIds: null` means "all companies" |
>
> **Why `null` instead of `'ALL'` or `''` for enums?**
> - `null` is semantically correct: "no value specified"
> - Avoids collision with actual enum values (e.g., if `'ALL'` becomes a real status)
> - API can handle `null` as "skip this filter"
>
> **Consistency Check:** Before adding a new filter, verify the "no filter" token matches this table.

> **Rule B: If objects are necessary, serialize to stable string**
>
> For complex filter objects, use a stable serialization function:
>
> ```typescript
> // shared/lib/query-utils.ts
>
> // Type-safe: Only flat objects allowed (prevents nested structure bugs)
> type FlatFilterValue = string | number | boolean | null;
> type FlatFilters = Record<string, FlatFilterValue>;
>
> export function stableSerialize(obj: FlatFilters): string {
>   // Sort keys for consistent serialization
>   const sorted = Object.keys(obj)
>     .sort()
>     .reduce((acc, key) => {
>       const value = obj[key];
>       if (value !== undefined && value !== null && value !== '') {
>         acc[key] = value;
>       }
>       return acc;
>     }, {} as FlatFilters);
>   return JSON.stringify(sorted);
> }
>
> // Usage: TypeScript will error if nested objects are passed
> stableSerialize({ status: 'DRAFT', page: 1 });           // ✅ OK
> stableSerialize({ range: { from: '2025-01' } });         // ❌ Type error!
> ```
>
> **Why strict typing?** The `FlatFilters` type makes nested object violations a compile-time error, not a runtime cache bug.
>
> ```typescript
> // Usage in queryKey (escape hatch)
> list: (filters: QuotationFilters) =>
>   [...quotationQueryKeys.lists(), stableSerialize(filters)] as const,
> ```
>
> **When to use Rule B:**
> - Filters have 5+ optional fields
> - Filter structure may change frequently
> - Team agrees object-based keys improve DX
>
> **⚠️ Limitation:** `stableSerialize` only sorts **top-level keys**. Nested objects/arrays are not recursively sorted.
>
> ```typescript
> // ✅ Works correctly (flat object)
> stableSerialize({ status: 'DRAFT', page: 1 })
>
> // ⚠️ Unstable if nested object key order varies
> stableSerialize({ range: { from: '2025-01', to: '2025-12' }, sort: ['date', 'id'] })
> ```
>
> **Team Policy:** If using Rule B, **filters must be flat objects only** (no nested objects/arrays). For complex filters, decompose into primitives for Rule A.
>
> **Handling Array Params (e.g., `companyIds: [1, 3, 5]`):**
>
> ```typescript
> // Option 1: Sort and join to string (recommended)
> const companyIdsKey = companyIds ? [...companyIds].sort().join(',') : null;
> queryKey: quotationQueryKeys.list(page, size, search, status, companyIdsKey);
>
> // Option 2: Include in stableSerialize (if using Rule B)
> // Ensure array is sorted before serialization
> stableSerialize({ ...filters, companyIds: [...companyIds].sort() });
> ```
>
> **Default to Rule A** unless there's a strong reason for B.

---

### Decision 4: Date/Timezone Handling

**Context:** Backend uses:
- `LocalDate` for date-only fields (quotationDate, dueDate) → ISO format `"2025-01-15"`
- `LocalDateTime` for timestamps (createdAt, updatedAt) → ISO format `"2025-01-15T10:30:00"`

**Rules:**

1. **Date-only fields (`LocalDate`)** - Store as strings, parse only for display
2. **Datetime fields (`LocalDateTime`)** - Store as strings, parse only when needed for calculations
3. **All parsing through utility functions** in `shared/lib/date.ts`

> ⚠️ **Team Rule: Domain models store dates as ISO strings, NOT Date objects**
>
> This is critical for:
> - **React Query cache serialization** - Date objects lose prototype on dehydrate/hydrate
> - **SSR compatibility** - Date objects don't serialize correctly across server/client boundary
> - **Cache persistence** - localStorage/IndexedDB require JSON-serializable data
> - **DevTools inspection** - ISO strings are human-readable
>
> **Correct Pattern:**
> ```typescript
> interface Quotation {
>   readonly expiryDate: string;  // ✅ ISO string: "2025-01-30"
>   readonly createdAt: string;   // ✅ ISO string: "2025-01-15T10:30:00"
> }
>
> // Parse only when needed for comparison/calculation
> quotationRules.isExpired(quotation);  // internally calls parseLocalDate()
> ```
>
> **Anti-Pattern:**
> ```typescript
> interface Quotation {
>   readonly expiryDate: Date;  // ❌ Breaks serialization
> }
> ```

**Implementation:**

```typescript
// shared/lib/date.ts

/**
 * Parse ISO date string (LocalDate from backend: "2025-01-15")
 * Returns string for display, Date for comparison
 */
export function parseLocalDate(isoDate: string): Date {
  // LocalDate has no timezone, treat as local timezone
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Parse ISO datetime string (LocalDateTime from backend: "2025-01-15T10:30:00")
 *
 * ⚠️ BROWSER TRAP: `new Date("2025-01-15T10:30:00")` behavior varies:
 *   - Some browsers treat as local time
 *   - Some browsers treat as UTC
 *
 * This function assumes server sends KST time without offset.
 * If server includes offset (recommended), parsing is straightforward.
 */
export function parseLocalDateTime(isoDateTime: string): Date {
  // If server includes offset (e.g., "2025-01-15T10:30:00+09:00"), use directly
  if (isoDateTime.includes('+') || isoDateTime.endsWith('Z')) {
    return new Date(isoDateTime);
  }

  // Server sends without offset - assume KST (+09:00)
  // Append KST offset to ensure consistent parsing across browsers
  return new Date(isoDateTime + '+09:00');
}

/**
 * Format date for display (localized)
 *
 * ⚠️ IMPORTANT: For string inputs, must distinguish between:
 *   - LocalDate ("2025-01-15") - use parseLocalDate()
 *   - LocalDateTime ("2025-01-15T10:30:00") - use parseLocalDateTime()
 */
export function formatDate(date: Date | string, locale = 'ko-KR'): string {
  let d: Date;

  if (typeof date === 'string') {
    // LocalDate format: exactly 10 chars (YYYY-MM-DD)
    if (date.length === 10) {
      d = parseLocalDate(date);
    } else {
      // LocalDateTime format
      d = parseLocalDateTime(date);
    }
  } else {
    d = date;
  }

  return d.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Check if date is in the past (for expiry checks)
 *
 * @param date - Date to check
 * @param now - Current time for comparison (optional, defaults to new Date())
 *              Pass explicit value for deterministic unit testing
 */
export function isPast(date: Date | string, now: Date = new Date()): boolean {
  const d = typeof date === 'string' ? parseLocalDate(date) : date;
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  return d < today;
}

/**
 * Get current date/time.
 * Use this instead of new Date() directly for testability.
 * Can be mocked in tests.
 */
export function getNow(): Date {
  return new Date();
}
```

**Usage in Domain Model:**

```typescript
// entities/quotation/model/quotation.ts
import { parseLocalDate, isPast, getNow } from '@/shared/lib/date';

export interface Quotation {
  // Keep as strings in the model
  readonly quotationDate: string;  // "2025-01-15"
  readonly expiryDate: string;     // "2025-01-30"
  readonly createdAt: string;      // "2025-01-15T10:30:00"
}

export const quotationRules = {
  /**
   * Check if quotation is expired.
   * @param now - Optional for testing. Defaults to current time.
   */
  isExpired(quotation: Quotation, now: Date = getNow()): boolean {
    return isPast(quotation.expiryDate, now);
  },

  /**
   * Calculate days until expiry.
   * @param now - Optional for testing. Defaults to current time.
   */
  daysUntilExpiry(quotation: Quotation, now: Date = getNow()): number {
    const expiry = parseLocalDate(quotation.expiryDate);
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const diffTime = expiry.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  },
};
```

> ⚠️ **Team Rule: Inject `now` for time-dependent domain rules**
>
> Functions like `isExpired`, `daysUntilExpiry`, or any logic comparing against "current time" should accept an optional `now` parameter:
> - **Production**: Defaults to `getNow()` for convenience
> - **Testing**: Pass explicit `Date` for deterministic assertions
>
> This pattern ensures:
> - Unit tests don't flake due to timing
> - Edge cases (exactly on expiry date) can be tested
> - Functions remain pure when `now` is provided

**Timezone Contract (Team Agreement Required):**

> ⚠️ **Backend-Frontend Contract Specification**
>
> This document assumes the following default contract:
> - **LocalDate** (quotationDate, expiryDate): `"2025-01-15"` format, no timezone
> - **LocalDateTime** (createdAt, updatedAt): `"2025-01-15T10:30:00"` format, **interpreted as KST**
>
> The team must choose and document one of the following:
> 1. "All datetime values include KST offset in ISO format from server" (e.g., `2025-01-15T10:30:00+09:00`) **(Recommended)**
> 2. "Datetime values without timezone are assumed to be KST"
>
> Time-related bugs will occur if this contract is not clearly defined.
>
> **Recommended Long-term Strategy:**
>
> For future-proofing (multi-timezone, international expansion, daylight saving):
> 1. **Backend should send `OffsetDateTime` or UTC with 'Z' suffix** in API responses
> 2. **Frontend assumes offset is present** and removes KST fallback logic
> 3. **Add e2e/unit tests** that verify datetime parsing matches expected timezone behavior
>
> The current KST assumption is acceptable for Korea-only deployment but creates technical debt for internationalization.

---

### Decision 5: Public API via Barrel Exports

**Rule:** External layers only import from `index.ts` barrel exports. Direct imports to internal modules are prohibited.

```typescript
// entities/quotation/index.ts (PUBLIC API)
// Types
export type { Quotation, LineItem, QuotationStatus } from './model/types';
export type { CreateQuotationCommand, UpdateQuotationCommand } from './model/quotation';

// Domain rules
export { quotationRules, quotationValidation } from './model/quotation';

// Query hooks and queryFns
export { useQuotation, useQuotations } from './query';
export { quotationQueryKeys } from './query/query-keys';
export { quotationQueryFns } from './query/query-fns';

// API (for features that need direct API access)
export { quotationApi } from './api/quotation.api';
export { quotationMapper } from './api/quotation.mapper';
export { quotationCommandMapper } from './api/quotation.command-mapper';

// UI components
export { QuotationStatusBadge } from './ui/QuotationStatusBadge';
export { QuotationCard } from './ui/QuotationCard';
```

**ESLint Enforcement:**

```javascript
// eslint.config.js
{
  files: ['src/pages/**/*', 'src/features/**/*'],
  rules: {
    '@typescript-eslint/no-restricted-imports': ['error', {
      patterns: [
        {
          group: ['@/entities/*/model/*', '@/entities/*/api/*', '@/entities/*/query/*', '@/entities/*/ui/*'],
          message: 'Import from @/entities/{entity} barrel export, not internal modules',
        },
      ],
    }],
  },
},
```

**Allowed Import Paths (Quick Reference for Onboarding):**

Official entry points for team onboarding:

| Import Path | Purpose | Examples |
|-------------|---------|----------|
| `@/entities/quotation` | Quotation domain models, rules, query hooks | `quotationRules`, `useQuotation`, `Quotation` |
| `@/entities/project` | Project domain | `useProject`, `Project` |
| `@/entities/company` | Company domain | `useCompanies`, `Company` |
| `@/entities/user` | User domain | `useUsers`, `User` |
| `@/entities/approval` | Approval domain | `useApprovals`, `ApprovalDetails` |
| `@/features/quotation/*` | Quotation-related features | `CreateQuotationForm`, `useCreateQuotation` |
| `@/features/auth/*` | Authentication features | `LoginForm`, `useLogin` |
| `@/shared/ui` | Design system components | `Button`, `Modal`, `Table` |
| `@/shared/lib/date` | Date utilities | `parseLocalDate`, `formatDate`, `isPast`, `getNow` |
| `@/shared/lib/money` | Money formatting | `Money.format()` |
| `@/stores/auth` | Auth global state | `useAuthStore` |

> **Rule:** Direct imports from internal paths not listed above (e.g., `@/entities/quotation/model/quotation`) are prohibited

---

## Domain Modeling Strategy

### Entity Layer Design

Each entity in `entities/` follows this structure:

```
entities/quotation/
├── model/
│   ├── quotation.ts           # Domain type + quotationRules (pure functions)
│   ├── quotation-command.ts   # Command types + quotationValidation
│   ├── line-item.ts           # LineItem type + lineItemRules
│   ├── quotation-status.ts    # Status enum + display config
│   └── types.ts               # Type exports
├── api/
│   ├── quotation.dto.ts       # API DTOs (match backend response)
│   ├── quotation.mapper.ts    # DTO ↔ Domain mapping (read-side)
│   ├── quotation.command-mapper.ts  # Command → DTO mapping (write-side)
│   └── quotation.api.ts       # API call functions
├── query/
│   ├── query-keys.ts          # Query key factory
│   ├── use-quotation.ts       # Single item query
│   └── use-quotations.ts      # List query with pagination
├── ui/
│   ├── QuotationCard.tsx
│   ├── QuotationTable.tsx
│   └── QuotationStatusBadge.tsx
└── index.ts
```

> ⚠️ **File Naming Convention for Commands**
>
> To clearly separate "domain rules" from "command validation":
>
> | File | Contains | Purpose |
> |------|----------|---------|
> | `model/quotation.ts` | `Quotation` type, `quotationRules` | Read-side domain (can/cannot checks, calculations) |
> | `model/quotation-command.ts` | `CreateQuotationCommand`, `quotationValidation` | Write-side domain (input types + validation) |
> | `api/quotation.mapper.ts` | `quotationMapper.toDomain()` | DTO → Domain (read path) |
> | `api/quotation.command-mapper.ts` | `quotationCommandMapper.toDto()` | Command → DTO (write path) |
>
> **Why separate mappers?** As entities grow, a single mapper file handling both read and write becomes bloated. Separating into `.mapper.ts` (read) and `.command-mapper.ts` (write) maintains single-responsibility and makes code reviews easier.

### DTO to Domain Mapping

**API DTOs (Match Backend Exactly):**

```typescript
// entities/quotation/api/quotation.dto.ts

/**
 * API Response DTO - matches backend QuotationDetailView
 */
export interface QuotationDTO {
  id: number;
  projectId: number;
  projectName: string;
  jobCode: string;
  version: number;
  status: string;  // 'DRAFT' | 'PENDING' | ...
  quotationDate: string;
  validityDays: number;
  expiryDate: string;
  totalAmount: number;
  notes: string | null;
  createdById: number;
  createdByName: string;
  submittedAt: string | null;
  approvedAt: string | null;
  approvedById: number | null;
  approvedByName: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
  lineItems: LineItemDTO[] | null;
}

export interface LineItemDTO {
  id: number;
  productId: number;
  productSku: string;
  productName: string;
  sequence: number;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  notes: string | null;
}

/**
 * Create request DTO - matches backend CreateQuotationRequest
 */
export interface CreateQuotationDTO {
  projectId: number;
  validityDays?: number;
  notes?: string;
  lineItems: LineItemRequestDTO[];
}

export interface LineItemRequestDTO {
  productId: number;
  quantity: number;
  unitPrice: number;
  notes?: string;
}
```

**Domain Models (Plain Object + Pure Functions):**

Following [Decision 1](#decision-1-domain-model-implementation-plain-object--pure-functions), domain models use interfaces with pure functions for behavior.

```typescript
// entities/quotation/model/quotation-status.ts
export const QuotationStatus = {
  DRAFT: 'DRAFT',
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  SENT: 'SENT',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
} as const;

export type QuotationStatus = typeof QuotationStatus[keyof typeof QuotationStatus];

export const QuotationStatusConfig: Record<QuotationStatus, {
  label: string;
  color: 'gray' | 'yellow' | 'blue' | 'cyan' | 'green' | 'red';
}> = {
  DRAFT: { label: 'Draft', color: 'gray' },
  PENDING: { label: 'Pending Approval', color: 'yellow' },
  APPROVED: { label: 'Approved', color: 'blue' },
  SENT: { label: 'Sent', color: 'cyan' },
  ACCEPTED: { label: 'Accepted', color: 'green' },
  REJECTED: { label: 'Rejected', color: 'red' },
};
```

```typescript
// entities/quotation/model/line-item.ts
import { Money } from '@/shared/lib/money';

/**
 * LineItem type (plain interface)
 */
export interface LineItem {
  readonly id: number;
  readonly productId: number;
  readonly productSku: string;
  readonly productName: string;
  readonly sequence: number;
  readonly quantity: number;
  readonly unitPrice: number;
  readonly notes: string | null;
}

/**
 * LineItem pure functions for calculations
 */
export const lineItemRules = {
  /** Calculate line total */
  getLineTotal(item: LineItem): number {
    return item.quantity * item.unitPrice;
  },

  /** Format line total as currency */
  getFormattedLineTotal(item: LineItem): string {
    return Money.format(lineItemRules.getLineTotal(item));
  },
};
```

```typescript
// entities/quotation/model/quotation.ts
import { QuotationStatus, QuotationStatusConfig } from './quotation-status';
import type { LineItem } from './line-item';
import { lineItemRules } from './line-item';
import { Money } from '@/shared/lib/money';
import { isPast, getNow } from '@/shared/lib/date';

/**
 * Quotation type (plain interface)
 * Dates stored as ISO strings for serialization
 */
export interface Quotation {
  readonly id: number;
  readonly projectId: number;
  readonly projectName: string;
  readonly jobCode: string;
  readonly version: number;
  readonly status: QuotationStatus;
  readonly quotationDate: string;  // ISO date: "2025-01-15"
  readonly validityDays: number;
  readonly expiryDate: string;     // ISO date: "2025-01-30"
  readonly notes: string | null;
  readonly createdById: number;
  readonly createdByName: string;
  readonly submittedAt: string | null;
  readonly approvedAt: string | null;
  readonly approvedById: number | null;
  readonly approvedByName: string | null;
  readonly rejectionReason: string | null;
  readonly createdAt: string;      // ISO datetime: "2025-01-15T10:30:00"
  readonly updatedAt: string;
  readonly lineItems: readonly LineItem[];
}

/**
 * Quotation pure functions for business rules
 */
export const quotationRules = {
  // ==================== COMPUTED VALUES ====================

  /** Calculate total amount from line items */
  calculateTotal(quotation: Quotation): number {
    return quotation.lineItems.reduce(
      (sum, item) => sum + lineItemRules.getLineTotal(item),
      0
    );
  },

  /** Format total amount as currency */
  getFormattedTotal(quotation: Quotation): string {
    return Money.format(quotationRules.calculateTotal(quotation));
  },

  /** Get status display configuration */
  getStatusConfig(quotation: Quotation) {
    return QuotationStatusConfig[quotation.status];
  },

  /** Check if quotation is expired (accepts optional now for testing) */
  isExpired(quotation: Quotation, now: Date = getNow()): boolean {
    return isPast(quotation.expiryDate, now);
  },

  /** Get number of line items */
  getItemCount(quotation: Quotation): number {
    return quotation.lineItems.length;
  },

  // ==================== BUSINESS RULES ====================

  /** Check if quotation can be edited */
  canEdit(quotation: Quotation): boolean {
    return quotation.status === QuotationStatus.DRAFT;
  },

  /** Check if quotation can be submitted for approval */
  canSubmit(quotation: Quotation): boolean {
    return (
      quotation.status === QuotationStatus.DRAFT &&
      quotation.lineItems.length > 0 &&
      quotationRules.calculateTotal(quotation) > 0
    );
  },

  /** Check if quotation can be approved (approver's perspective) */
  canApprove(quotation: Quotation): boolean {
    return quotation.status === QuotationStatus.PENDING;
  },

  /** Check if quotation can be rejected (approver's perspective) */
  canReject(quotation: Quotation): boolean {
    return quotation.status === QuotationStatus.PENDING;
  },

  /** Check if quotation can create a new version */
  canCreateNewVersion(quotation: Quotation): boolean {
    return [
      QuotationStatus.APPROVED,
      QuotationStatus.REJECTED,
      QuotationStatus.SENT,
    ].includes(quotation.status);
  },

  /** Check if quotation can be sent to customer */
  canSend(quotation: Quotation): boolean {
    return (
      quotation.status === QuotationStatus.APPROVED &&
      !quotationRules.isExpired(quotation)
    );
  },

  /** Check if PDF can be generated */
  canGeneratePdf(quotation: Quotation): boolean {
    return quotation.lineItems.length > 0;
  },
};

```

```typescript
// entities/quotation/model/quotation-command.ts
// (Separate file for command types + validation - see File Naming Convention)

/**
 * Command types (owned by entities layer - NOT feature-specific)
 * Features map their input types to these commands before validation/API calls.
 */
export interface CreateQuotationCommand {
  readonly projectId: number;
  readonly validityDays?: number;
  readonly notes?: string;
  readonly lineItems: readonly {
    readonly productId: number;
    readonly quantity: number;
    readonly unitPrice: number;
    readonly notes?: string;
  }[];
}

export interface UpdateQuotationCommand {
  readonly validityDays?: number;
  readonly notes?: string;
  readonly lineItems: readonly {
    readonly productId: number;
    readonly quantity: number;
    readonly unitPrice: number;
    readonly notes?: string;
  }[];
}

/**
 * Quotation validation (for commands)
 * Validates domain commands, NOT feature-specific input types.
 */
export const quotationValidation = {
  /** Validate create command before API call */
  validateCreate(command: CreateQuotationCommand): void {
    if (!command.projectId) {
      throw new Error('Project is required');
    }
    if (command.lineItems.length === 0) {
      throw new Error('At least one line item is required');
    }
    for (const item of command.lineItems) {
      if (item.quantity <= 0) {
        throw new Error('Quantity must be greater than 0');
      }
      if (item.unitPrice < 0) {
        throw new Error('Unit price cannot be negative');
      }
    }
  },

  /** Validate update command before API call */
  validateUpdate(command: UpdateQuotationCommand): void {
    if (command.lineItems.length === 0) {
      throw new Error('At least one line item is required');
    }
    for (const item of command.lineItems) {
      if (item.quantity <= 0) {
        throw new Error('Quantity must be greater than 0');
      }
      if (item.unitPrice < 0) {
        throw new Error('Unit price cannot be negative');
      }
    }
  },
};
```

**Mapper (DTO ↔ Domain):**

Following the plain object approach from [Decision 1](#decision-1-domain-model-implementation-plain-object--pure-functions), mappers return plain objects:

```typescript
// entities/quotation/api/quotation.mapper.ts
import type { Quotation, QuotationListItem } from '../model/quotation';
import type { LineItem } from '../model/line-item';
import { quotationRules } from '../model/quotation';
import type { QuotationStatus } from '../model/quotation-status';
import type { QuotationDTO, LineItemDTO } from './quotation.dto';

/**
 * Summary type for list views (lighter than full Quotation)
 */
export interface QuotationListItem {
  readonly id: number;
  readonly jobCode: string;
  readonly projectName: string;
  readonly version: number;
  readonly status: QuotationStatus;
  readonly totalAmount: number;
  readonly createdAt: string;
}

export const lineItemMapper = {
  /**
   * Map API DTO to domain model (plain object)
   */
  toDomain(dto: LineItemDTO): LineItem {
    return {
      id: dto.id,
      productId: dto.productId,
      productSku: dto.productSku,
      productName: dto.productName,
      sequence: dto.sequence,
      quantity: dto.quantity,
      unitPrice: dto.unitPrice,
      notes: dto.notes?.trim() ?? null,
    };
  },
};

export const quotationMapper = {
  /**
   * Map API DTO to domain model (plain object)
   * Dates kept as ISO strings for serialization compatibility
   */
  toDomain(dto: QuotationDTO): Quotation {
    return {
      id: dto.id,
      projectId: dto.projectId,
      projectName: dto.projectName.trim(),
      jobCode: dto.jobCode,
      version: dto.version,
      status: dto.status as QuotationStatus,
      quotationDate: dto.quotationDate,           // Keep as ISO string
      validityDays: dto.validityDays,
      expiryDate: dto.expiryDate,                 // Keep as ISO string
      notes: dto.notes?.trim() ?? null,
      createdById: dto.createdById,
      createdByName: dto.createdByName.trim(),
      submittedAt: dto.submittedAt,               // Keep as ISO string
      approvedAt: dto.approvedAt,                 // Keep as ISO string
      approvedById: dto.approvedById,
      approvedByName: dto.approvedByName?.trim() ?? null,
      rejectionReason: dto.rejectionReason?.trim() ?? null,
      createdAt: dto.createdAt,                   // Keep as ISO string
      updatedAt: dto.updatedAt,                   // Keep as ISO string
      lineItems: (dto.lineItems ?? []).map(lineItemMapper.toDomain),
    };
  },

  /**
   * Map domain model to list summary (for optimized caching)
   */
  toListItem(quotation: Quotation): QuotationListItem {
    return {
      id: quotation.id,
      jobCode: quotation.jobCode,
      projectName: quotation.projectName,
      version: quotation.version,
      status: quotation.status,
      totalAmount: quotationRules.calculateTotal(quotation),
      createdAt: quotation.createdAt,
    };
  },
};

/**
 * Command mappers for write operations
 * Two-step mapping: Feature Input → Command (for validation) → API DTO (for API call)
 */
export const quotationCommandMapper = {
  /**
   * Map feature input to domain command (for validation)
   * Handles string→number conversion and normalization.
   */
  toCommand(input: CreateQuotationInput): CreateQuotationCommand {
    return {
      projectId: input.projectId,
      validityDays: input.validityDays ?? 30,  // Default value
      notes: input.notes?.trim() || undefined,
      lineItems: input.lineItems.map(item => ({
        productId: item.productId,
        quantity: Number(item.quantity),  // Ensure number (form inputs may be strings)
        unitPrice: Number(item.unitPrice),
        notes: item.notes?.trim() || undefined,
      })),
    };
  },

  /**
   * Map validated command to API DTO
   * Command is already validated, just transform to API shape.
   */
  toCreateDto(command: CreateQuotationCommand): CreateQuotationDTO {
    return {
      projectId: command.projectId,
      validityDays: command.validityDays,
      notes: command.notes,
      lineItems: command.lineItems.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        notes: item.notes,
      })),
    };
  },

  /**
   * Map feature input to update command (for validation)
   */
  toUpdateCommand(input: UpdateQuotationInput): UpdateQuotationCommand {
    return {
      validityDays: input.validityDays,
      notes: input.notes?.trim() || undefined,
      lineItems: input.lineItems.map(item => ({
        productId: item.productId,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        notes: item.notes?.trim() || undefined,
      })),
    };
  },

  /**
   * Map validated update command to API DTO
   */
  toUpdateDto(command: UpdateQuotationCommand): UpdateQuotationDTO {
    return {
      validityDays: command.validityDays,
      notes: command.notes,
      lineItems: command.lineItems.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        notes: item.notes,
      })),
    };
  },
};
```

> ⚠️ **Team Rule: Two-step command mapping for all write operations**
>
> **Type Boundary Diagram:**
>
> ```
> ┌─────────────────────────────────────────────────────────────────────────────┐
> │                           WRITE OPERATION TYPES                             │
> ├─────────────────────┬─────────────────────┬─────────────────────────────────┤
> │  CreateQuotationInput │ CreateQuotationCommand │ CreateQuotationDTO        │
> ├─────────────────────┼─────────────────────┼─────────────────────────────────┤
> │  Owner: features/   │  Owner: entities/   │  Owner: entities/api/           │
> ├─────────────────────┼─────────────────────┼─────────────────────────────────┤
> │  • Form field types │  • Validated types  │  • Backend contract             │
> │  • strings allowed  │  • numbers required │  • Matches API spec             │
> │  • nullable/optional│  • normalized       │  • Ready to send                │
> │  • UI convenience   │  • business-ready   │                                 │
> ├─────────────────────┼─────────────────────┼─────────────────────────────────┤
> │  quantity: string   │  quantity: number   │  quantity: number               │
> │  price: string | '' │  unitPrice: number  │  unitPrice: number              │
> │  notes?: string     │  notes?: string     │  notes?: string                 │
> └─────────────────────┴─────────────────────┴─────────────────────────────────┘
>           │                     │                      │
>           │   toCommand()       │   toCreateDto()      │
>           ├────────────────────►├─────────────────────►│
>           │                     │                      │
>           │              validateCreate()              │
>           │                     ▼                      │
>           │              [throws if invalid]           │
> ```
>
> **Key Principle:** Validation runs on **Command** types only (entities-owned).
> This prevents entities from depending on feature types (dependency inversion).
>
> **Pattern:**
> ```typescript
> // In feature hook
> const command = quotationCommandMapper.toCommand(input);  // Feature → Command
> quotationValidation.validateCreate(command);              // Validate command (throws if invalid)
> quotationApi.create(quotationCommandMapper.toCreateDto(command));  // Command → DTO
> ```

> ⚠️ **Team Rule: Error-to-Field Mapping**
>
> When validation fails, errors should be mapped back to form fields for UX:
>
> 1. **`toCommand()` parsing errors** → Return field-specific errors (e.g., `{ field: 'quantity', message: 'Must be a number' }`)
> 2. **`validateCreate()` domain errors** → Include field path in error (e.g., `{ field: 'lineItems[0].unitPrice', message: 'Cannot be negative' }`)
> 3. **API errors** → Map server validation errors to field names when possible
>
> This enables form libraries (react-hook-form, etc.) to highlight specific fields.
>
> **Standard Error Type (entities layer):**
>
> ```typescript
> // shared/lib/errors.ts
>
> /**
>  * DomainValidationError - Use class (not interface casting) for:
>  * - Proper instanceof checks
>  * - Correct Error.name and stack trace
>  * - Type guards that work at runtime
>  */
> export class DomainValidationError extends Error {
>   readonly code: string;           // Machine-readable: 'REQUIRED', 'INVALID_FORMAT', 'OUT_OF_RANGE'
>   readonly fieldPath: string;      // Form field path: 'projectId', 'lineItems[0].quantity'
>
>   constructor(code: string, fieldPath: string, message: string) {
>     super(message);
>     this.name = 'DomainValidationError';  // Ensures error.name is correct
>     this.code = code;
>     this.fieldPath = fieldPath;
>
>     // Maintains proper stack trace in V8 environments (Node, Chrome)
>     if (Error.captureStackTrace) {
>       Error.captureStackTrace(this, DomainValidationError);
>     }
>   }
> }
>
> // Type guard for safe narrowing
> export function isDomainValidationError(error: unknown): error is DomainValidationError {
>   return error instanceof DomainValidationError;
> }
>
> // Usage in validateCreate()
> if (item.quantity <= 0) {
>   throw new DomainValidationError(
>     'OUT_OF_RANGE',
>     `lineItems[${index}].quantity`,
>     'Quantity must be greater than 0'
>   );
> }
> ```
>
> **Why class instead of interface casting?**
> - ✅ `instanceof` works correctly: `error instanceof DomainValidationError`
> - ✅ `error.name` is `'DomainValidationError'` (not `'Error'`)
> - ✅ Stack trace points to throw site, not Error constructor
> - ❌ Interface casting (`as DomainValidationError`) loses all of the above
>
> **Feature layer converts to form errors:**
>
> ```typescript
> // features/quotation/create/lib/error-mapper.ts
> import type { FieldErrors } from 'react-hook-form';
> import { isDomainValidationError } from '@/shared/lib/errors';
>
> export function toFormErrors(error: unknown): FieldErrors {
>   if (isDomainValidationError(error)) {  // Uses type guard
>     return { [error.fieldPath]: { message: error.message } };
>   }
>   // Handle API errors, generic errors...
> }
> ```
>
> **Key Principle:** entities layer throws structured errors (knows nothing about UI). features layer maps to form library format (knows about react-hook-form).
>
> See [Validation Result Pattern](#validation-result-pattern) in Future Enhancements for a non-throwing alternative.

> ⚠️ **Team Rule: Unified Error Normalization**
>
> All error sources should normalize to `DomainValidationError` for consistent handling in feature hooks.
>
> **Error Sources and Normalization:**
>
> | Error Source | Where it occurs | Normalization |
> |--------------|-----------------|---------------|
> | `toCommand()` parsing | Command mapper | Throw `DomainValidationError` |
> | `validateCreate()` | Domain validation | Throw `DomainValidationError` |
> | API 400 response | Feature hook `onError` | Normalize via helper |
>
> **Shared Helper for API Error Normalization:**
>
> ```typescript
> // shared/lib/errors.ts
>
> /** API 400 validation error shape (from backend) */
> interface ApiValidationError {
>   code: string;
>   field?: string;
>   message: string;
> }
>
> /**
>  * Normalize API 400 errors to DomainValidationError array.
>  * Backend should return: { errors: [{ code, field, message }] }
>  */
> export function normalizeApiErrors(
>   apiResponse: unknown
> ): DomainValidationError[] {
>   if (!isApiErrorResponse(apiResponse)) {
>     return [new DomainValidationError('UNKNOWN', '', 'Unknown error occurred')];
>   }
>
>   return apiResponse.errors.map(
>     (err: ApiValidationError) =>
>       new DomainValidationError(
>         err.code,
>         err.field ?? '',  // Some errors may not have field
>         err.message
>       )
>   );
> }
>
> function isApiErrorResponse(obj: unknown): obj is { errors: ApiValidationError[] } {
>   return (
>     typeof obj === 'object' &&
>     obj !== null &&
>     'errors' in obj &&
>     Array.isArray((obj as { errors: unknown }).errors)
>   );
> }
> ```
>
> **Usage in Feature Hook:**
>
> ```typescript
> // features/quotation/create/model/use-create-quotation.ts
> import { normalizeApiErrors, isDomainValidationError } from '@/shared/lib/errors';
>
> useMutation({
>   mutationFn: async (input) => {
>     try {
>       const command = quotationCommandMapper.toCommand(input);  // May throw
>       quotationValidation.validateCreate(command);               // May throw
>       return quotationApi.create(quotationCommandMapper.toCreateDto(command));
>     } catch (error) {
>       if (isDomainValidationError(error)) {
>         throw error;  // Already normalized
>       }
>       throw error;    // Let onError handle API errors
>     }
>   },
>
>   onError: (error) => {
>     // All errors normalized to same shape for form handling
>     if (isDomainValidationError(error)) {
>       setFormErrors(toFormErrors(error));
>     } else if (isAxiosError(error) && error.response?.status === 400) {
>       const domainErrors = normalizeApiErrors(error.response.data);
>       setFormErrors(toFormErrors(domainErrors[0]));  // Or handle multiple
>     } else {
>       toast.error('An unexpected error occurred');
>     }
>   },
> });
> ```
>
> **Benefits of Unified Normalization:**
> - Feature hooks have ONE error handling pattern
> - Form error injection is consistent across all mutations
> - Easy to extend (add new error sources without changing handlers)

### Domain Behavior

**Key Principle:** Business logic lives in pure functions, not scattered in components

**Before (Component - Logic Embedded):**
```typescript
// components/features/quotations/QuotationActions.tsx
function QuotationActions({ quotation }) {
  // Business logic scattered in component
  const canSubmit =
    quotation.status === 'DRAFT' &&
    quotation.lineItems.length > 0 &&
    quotation.totalAmount > 0;

  const canEdit = quotation.status === 'DRAFT';

  // ...
}
```

**After (Pure Functions - Centralized Logic):**
```typescript
// entities/quotation/model/quotation.ts
export const quotationRules = {
  canSubmit(quotation: Quotation): boolean {
    return (
      quotation.status === QuotationStatus.DRAFT &&
      quotation.lineItems.length > 0 &&
      quotationRules.calculateTotal(quotation) > 0
    );
  },

  canEdit(quotation: Quotation): boolean {
    return quotation.status === QuotationStatus.DRAFT;
  },
};

// Usage in component - clean and testable
import { quotationRules } from '@/entities/quotation';

function QuotationActions({ quotation }: { quotation: Quotation }) {
  return (
    <>
      {quotationRules.canEdit(quotation) && <EditButton />}
      {quotationRules.canSubmit(quotation) && <SubmitButton />}
    </>
  );
}
```

**Benefits of Pure Functions:**
- Testable without component rendering
- Reusable across components
- Serialization-friendly (works with React Query cache)
- Clear domain vocabulary aligned with backend

---

## Query/Command Separation with TanStack Query

### Query Pattern (Read Operations)

**Query Keys Factory (Primitive-Based):**

Following [Decision 3](#decision-3-querykey-stability), query keys use **individual primitives** instead of objects:

```typescript
// entities/quotation/query/query-keys.ts
export const quotationQueryKeys = {
  all: ['quotations'] as const,

  lists: () => [...quotationQueryKeys.all, 'list'] as const,
  // Primitives only - NOT an object!
  list: (page: number, size: number, search: string, status?: QuotationStatus) =>
    [...quotationQueryKeys.lists(), page, size, search, status] as const,

  details: () => [...quotationQueryKeys.all, 'detail'] as const,
  detail: (id: number) => [...quotationQueryKeys.details(), id] as const,
};
```

**Single Entity Query:**

```typescript
// entities/quotation/query/use-quotation.ts
import { useQuery } from '@tanstack/react-query';
import { quotationApi } from '../api/quotation.api';
import { quotationMapper } from '../api/quotation.mapper';
import { quotationQueryKeys } from './query-keys';
import type { Quotation } from '../model/quotation';

interface UseQuotationOptions {
  enabled?: boolean;
}

export function useQuotation(id: number, options?: UseQuotationOptions) {
  return useQuery({
    queryKey: quotationQueryKeys.detail(id),
    queryFn: async (): Promise<Quotation> => {
      const dto = await quotationApi.getById(id);
      return quotationMapper.toDomain(dto);
    },
    enabled: options?.enabled ?? true,
    staleTime: 1000 * 60 * 5,  // 5 minutes
  });
}
```

**Paginated List Query:**

```typescript
// entities/quotation/query/use-quotations.ts
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { quotationQueryKeys } from './query-keys';
import { quotationQueryFns } from './query-fns';  // MUST use for cache consistency
import type { QuotationStatus } from '../model/quotation-status';

interface UseQuotationsParams {
  page: number;
  size?: number;
  status?: QuotationStatus;
  search?: string;
}

export function useQuotations({
  page,
  size = 10,
  search = '',
  status,
}: UseQuotationsParams) {
  return useQuery({
    // Primitives ensure stable cache key (see Decision 3)
    queryKey: quotationQueryKeys.list(page, size, search, status),
    // MUST use quotationQueryFns for cache consistency (see Decision 2)
    queryFn: quotationQueryFns.list(page, size, search, status),
    placeholderData: keepPreviousData,  // Smooth pagination
    staleTime: 1000 * 60 * 2,  // 2 minutes
  });
}
```

**Benefits:**
- Automatic caching (no duplicate requests)
- Background refetch when stale
- Pagination with `keepPreviousData`
- Domain models returned (not DTOs)

---

### Command Pattern (Write Operations)

**Feature Hook (useCreateQuotation):**

```typescript
// features/quotation/create/model/use-create-quotation.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  quotationApi,
  quotationQueryKeys,
  quotationQueryFns,
  quotationValidation,
  quotationCommandMapper,
} from '@/entities/quotation';
import type { CreateQuotationInput } from './types';

interface UseCreateQuotationOptions {
  onSuccess?: (result: { id: number }) => void;
  onError?: (error: Error) => void;
}

export function useCreateQuotation(options?: UseCreateQuotationOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateQuotationInput) => {
      // 1. Convert feature input → domain command (string→number, normalize)
      const command = quotationCommandMapper.toCommand(input);

      // 2. Validate using domain rules (on Command type, not Input)
      quotationValidation.validateCreate(command);

      // 3. Convert command → API DTO and call API
      return quotationApi.create(quotationCommandMapper.toCreateDto(command));
    },

    onSuccess: (result) => {
      // 4. Invalidate list cache
      queryClient.invalidateQueries({
        queryKey: quotationQueryKeys.lists()
      });

      // 5. Prefetch the new quotation (use queryFns for cache consistency)
      queryClient.prefetchQuery({
        queryKey: quotationQueryKeys.detail(result.id),
        queryFn: quotationQueryFns.detail(result.id),
      });

      // 6. Call provided callback
      options?.onSuccess?.(result);
    },

    onError: (error) => {
      options?.onError?.(error);
    },
  });
}
```

> ⚠️ **Team Rule: prefetch vs ensureQueryData for Navigation**
>
> When navigating to detail page immediately after mutation success, choose the right cache strategy:
>
> **Option A: `prefetchQuery` (fire-and-forget)** - Good for background warming
> ```typescript
> onSuccess: (result) => {
>   queryClient.prefetchQuery({...});  // Non-blocking
>   navigate(`/quotations/${result.id}`);  // Navigate immediately
> }
> ```
> - Detail page may show loading spinner briefly if prefetch hasn't completed
> - Good when you want fast navigation and loading spinner is acceptable
>
> **Option B: `ensureQueryData` (await before navigate)** - Guarantees data is ready
> ```typescript
> onSuccess: async (result) => {
>   await queryClient.ensureQueryData({
>     queryKey: quotationQueryKeys.detail(result.id),
>     queryFn: quotationQueryFns.detail(result.id),
>   });  // Wait for data to be in cache
>   navigate(`/quotations/${result.id}`);  // Navigate with data ready
> }
> ```
> - No loading flash on detail page (data is already in cache)
> - Slightly slower perceived navigation, but smoother UX
>
> **Recommendation:** Use `ensureQueryData` when navigating to detail immediately after create/update to avoid loading flash.

**Feature Hook (useSubmitForApproval):**

> ⚠️ **Client Validation Policy (Team Agreement Required)**
>
> Cache-based validation serves as **UX-oriented early fail**:
> - Provides quick feedback before user clicks the button
> - Prevents unnecessary network requests
>
> **The server always guarantees final consistency.**
> - Cases where cache is stale and says "can submit" but server rejects always exist
> - Server 4xx/5xx responses must always be handled
> - Passing client validation ≠ guaranteed server success
>
> **When to Block vs Warn:**
>
> | Validation Type | Action | Example |
> |-----------------|--------|---------|
> | **Deterministic fail** (impossible state) | ❌ Block API call | `lineItems.length === 0`, `amount < 0` |
> | **Cache-dependent** (may be stale) | ⚠️ Warn, but allow API call | `canSubmit()` returns false (status may have changed) |
> | **Server-only** (needs fresh data) | ✅ Let server decide | Concurrent edit conflicts, permission checks |
>
> **Error Recovery UX Location:**
> - **Blocking errors** → Feature hook throws, feature UI displays inline error
> - **Server rejections (4xx)** → Feature hook's `onError` shows toast + optional inline message
> - **Network errors (5xx)** → Feature hook's `onError` shows generic retry toast

```typescript
// features/quotation/submit/model/use-submit-for-approval.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  quotationApi,
  quotationQueryKeys,
  quotationQueryFns,
  quotationRules,
  approvalQueryKeys,
  type Quotation,
} from '@/entities/quotation';

export function useSubmitForApproval() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (quotationId: number) => {
      // 1. Try cache first, fallback to fetch if not available
      let quotation = queryClient.getQueryData<Quotation>(
        quotationQueryKeys.detail(quotationId)
      );

      if (!quotation) {
        // Cache miss: fetch fresh data for validation
        quotation = await quotationQueryFns.detail(quotationId)();
      }

      // 2. Deterministic validation (BLOCK if impossible state)
      //    These checks are data-structure based, not cache-dependent
      if (quotation.lineItems.length === 0) {
        throw new Error('Cannot submit quotation with no line items');
      }
      if (quotationRules.calculateTotal(quotation) <= 0) {
        throw new Error('Cannot submit quotation with zero or negative amount');
      }

      // 3. Cache-dependent validation (WARN but allow - server decides)
      //    canSubmit() checks status which may be stale in cache
      //    We proceed anyway; server will reject if status changed
      // Note: UI should show warning if !canSubmit() before user clicks

      // 4. Call API (server performs final consistency validation)
      return quotationApi.submit(quotationId);
    },

    onSuccess: (_, quotationId) => {
      // Invalidate quotation (status changed)
      queryClient.invalidateQueries({
        queryKey: quotationQueryKeys.detail(quotationId)
      });

      // Invalidate list
      queryClient.invalidateQueries({
        queryKey: quotationQueryKeys.lists()
      });

      // Invalidate approvals (new approval created)
      queryClient.invalidateQueries({
        queryKey: approvalQueryKeys.all
      });
    },

    onError: (error) => {
      // Handle server rejection
      // (cache was stale, client validation passed but server rejected)
      console.error('Submit failed:', error);
    },
  });
}
```

**Benefits:**
- Clear separation: Query hooks in `entities/`, Command hooks in `features/`
- Domain validation before API calls
- Automatic cache invalidation
- Loading/error states built-in (`mutation.isPending`, `mutation.error`)

---

### Optimistic Updates

For better UX, apply optimistic updates on command operations. **Plain objects make this easy** - just spread and override:

```typescript
// features/quotation/approve/model/use-approve-quotation.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  quotationApi,
  quotationQueryKeys,
  QuotationStatus,
  type Quotation,
} from '@/entities/quotation';

export function useApproveQuotation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { id: number; comments?: string }) =>
      quotationApi.approve(params.id, params.comments),

    // Optimistic update
    onMutate: async ({ id }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: quotationQueryKeys.detail(id)
      });

      // Snapshot previous value
      const previous = queryClient.getQueryData<Quotation>(
        quotationQueryKeys.detail(id)
      );

      // Optimistically update using plain object spread
      if (previous) {
        const optimistic: Quotation = {
          ...previous,
          status: QuotationStatus.APPROVED,
          approvedAt: new Date().toISOString(),
          // approvedById/approvedByName would come from auth context
        };
        queryClient.setQueryData(quotationQueryKeys.detail(id), optimistic);
      }

      return { previous };
    },

    onError: (err, { id }, context) => {
      // Rollback on error
      if (context?.previous) {
        queryClient.setQueryData(
          quotationQueryKeys.detail(id),
          context.previous
        );
      }
    },

    onSettled: (_, __, { id }) => {
      // Always refetch after mutation to get server-confirmed data
      queryClient.invalidateQueries({
        queryKey: quotationQueryKeys.detail(id)
      });
    },
  });
}
```

**Why Plain Objects Make Optimistic Updates Easy:**
- Use spread operator: `{ ...previous, status: 'APPROVED' }`
- No need to instantiate classes or call constructors
- Rollback is simple: restore the previous plain object
- Serializable by default for DevTools inspection

> ⚠️ **Team Rule: Pure Update Functions for Optimistic Updates**
>
> Ad-hoc spread patterns in `onMutate` become inconsistent as the codebase grows. Define **pure update functions** in `entities/*/model/` to ensure immutability and reuse.
>
> **Pattern:**
> ```typescript
> // entities/quotation/model/quotation-updates.ts
> import type { Quotation } from './quotation';
> import { QuotationStatus } from './quotation-status';
>
> /**
>  * Pure update functions for optimistic cache updates.
>  * Always return a new object (immutable).
>  */
> export const quotationUpdates = {
>   /** Apply approval to quotation */
>   applyApproval(
>     quotation: Quotation,
>     approver: { id: number; name: string }
>   ): Quotation {
>     return {
>       ...quotation,
>       status: QuotationStatus.APPROVED,
>       approvedAt: new Date().toISOString(),
>       approvedById: approver.id,
>       approvedByName: approver.name,
>     };
>   },
>
>   /** Apply rejection to quotation */
>   applyRejection(
>     quotation: Quotation,
>     reason: string
>   ): Quotation {
>     return {
>       ...quotation,
>       status: QuotationStatus.REJECTED,
>       rejectionReason: reason,
>     };
>   },
>
>   /** Apply submission to quotation */
>   applySubmission(quotation: Quotation): Quotation {
>     return {
>       ...quotation,
>       status: QuotationStatus.PENDING,
>       submittedAt: new Date().toISOString(),
>     };
>   },
> };
> ```
>
> **Usage in mutation hook:**
> ```typescript
> // features/quotation/approve/model/use-approve-quotation.ts
> import { quotationUpdates } from '@/entities/quotation';
>
> onMutate: async ({ id }) => {
>   const previous = queryClient.getQueryData<Quotation>(
>     quotationQueryKeys.detail(id)
>   );
>
>   if (previous) {
>     const optimistic = quotationUpdates.applyApproval(
>       previous,
>       { id: currentUser.id, name: currentUser.name }
>     );
>     queryClient.setQueryData(quotationQueryKeys.detail(id), optimistic);
>   }
>
>   return { previous };
> },
> ```
>
> **Benefits:**
> - ✅ Centralized update logic (easy to find, test, and fix)
> - ✅ Consistent immutability (pure functions always return new object)
> - ✅ Reusable across features (approve, bulk-approve use same function)
> - ✅ Testable without React/cache dependencies
>
> **When to create update functions:**
> - Any optimistic update that modifies 2+ fields
> - Any update pattern used by multiple features
> - Complex transformations (status transitions, calculated fields)

---

## Migration Strategy

### Phase 1: Add TanStack Query (2-3 days)

1. Install `@tanstack/react-query`
2. Set up `QueryClientProvider` in app
3. Create query keys and hooks for one entity (start with `quotation`)
4. Migrate one table component to use query hook
5. Verify caching and invalidation work

**Files to create:**
- `app/providers/query-provider.tsx`
- `entities/quotation/query/query-keys.ts`
- `entities/quotation/query/use-quotations.ts`

**Files to modify:**
- `main.tsx` - Add provider
- One table component - Use query hook

### Phase 2: Extract Domain Models (1 week)

1. Create `entities/` directory structure
2. Define domain models (plain objects) + rules (pure functions) for one entity
3. Create DTO ↔ Domain mappers (including command mappers for write operations)
4. Update query hooks to return domain models
5. Update components to use domain rules (pure functions)

**Entity priority order:**
1. `quotation` (most complex, good reference)
2. `project` (frequently used)
3. `company` (simpler)
4. `user` (already has some domain logic in auth)
5. `approval` (depends on quotation)

### Phase 3: Extract Features (1 week)

1. Create `features/` directory structure
2. Move action hooks from `components/features/*/hooks/` to `features/*/model/`
3. Move form components to `features/*/ui/`
4. Ensure features only import from `entities/` and `shared/`

**Feature examples:**
- `features/quotation/create/`
- `features/quotation/submit/`
- `features/quotation/approve/`
- `features/project/create/`
- `features/auth/login/`

### Phase 4: Clean Up (Ongoing)

1. Remove old services layer (replaced by `entities/api/`)
2. Remove manual `useState` + `useEffect` patterns
3. Update ESLint rules for new structure
4. Update imports across codebase
5. Remove unused types

---

## Appendix: File Mappings

### Current → Proposed Location

| Current Location                                              | Proposed Location                                         | Notes                      |
|---------------------------------------------------------------|-----------------------------------------------------------|----------------------------|
| `services/quotations/types.ts`                                | `entities/quotation/api/quotation.dto.ts`                 | API DTOs only              |
| -                                                             | `entities/quotation/model/quotation.ts`                   | NEW: Domain model          |
| `services/quotations/quotationService.ts`                     | `entities/quotation/api/quotation.api.ts`                 | Thin API layer             |
| -                                                             | `entities/quotation/query/use-quotation.ts`               | NEW: Query hooks           |
| `components/features/quotations/hooks/useQuotationActions.ts` | `features/quotation/create/model/use-create-quotation.ts` | Split by action            |
| `components/features/quotations/QuotationForm.tsx`            | `features/quotation/create/ui/CreateQuotationForm.tsx`    | Feature UI                 |
| `components/features/quotations/QuotationTable.tsx`           | `entities/quotation/ui/QuotationTable.tsx`                | Display component          |
| `shared/hooks/useServiceAction.ts`                            | DELETE                                                    | Replaced by TanStack Query |
| `stores/authStore.ts`                                         | `stores/auth/auth.store.ts`                               | Keep minimal               |

### Query Key Strategy

**Note:** Following [Decision 3](#decision-3-querykey-stability), all query keys use **primitive values only** (no objects).

```typescript
// Centralized query key factory (PRIMITIVES ONLY)
export const queryKeys = {
  // Quotations
  quotations: {
    all: ['quotations'] as const,
    lists: () => [...queryKeys.quotations.all, 'list'] as const,
    // Primitives: page, size, search, status
    list: (page: number, size: number, search: string, status?: string) =>
      [...queryKeys.quotations.lists(), page, size, search, status] as const,
    details: () => [...queryKeys.quotations.all, 'detail'] as const,
    detail: (id: number) => [...queryKeys.quotations.details(), id] as const,
  },

  // Projects
  projects: {
    all: ['projects'] as const,
    lists: () => [...queryKeys.projects.all, 'list'] as const,
    // Primitives: page, size, search, status
    list: (page: number, size: number, search: string, status?: string) =>
      [...queryKeys.projects.lists(), page, size, search, status] as const,
    details: () => [...queryKeys.projects.all, 'detail'] as const,
    detail: (id: number) => [...queryKeys.projects.details(), id] as const,
    summary: (id: number) => [...queryKeys.projects.detail(id), 'summary'] as const,
  },

  // Approvals
  approvals: {
    all: ['approvals'] as const,
    lists: () => [...queryKeys.approvals.all, 'list'] as const,
    // Primitives: page, size, entityType, status
    list: (page: number, size: number, entityType?: string, status?: string) =>
      [...queryKeys.approvals.lists(), page, size, entityType, status] as const,
    myPending: () => [...queryKeys.approvals.lists(), 'my-pending'] as const,
    byEntity: (entityType: string, entityId: number) =>
      [...queryKeys.approvals.all, entityType, entityId] as const,
  },
};
```

---

## Future Enhancements (Optional)

This section documents advanced patterns that may be considered as the codebase matures. These are **not required** for the initial implementation but can add value in specific scenarios.

### Value Objects with Branded Types

**Use case:** Prevent accidentally mixing semantically different numbers (e.g., passing quantity where money is expected).

```typescript
// shared/lib/value-objects.ts

// Branded type pattern
type Brand<K, T> = K & { __brand: T };

export type Money = Brand<number, 'Money'>;
export type Quantity = Brand<number, 'Quantity'>;

// Constructor functions
export function money(value: number): Money {
  return value as Money;
}

export function quantity(value: number): Quantity {
  if (value < 0 || !Number.isInteger(value)) {
    throw new Error('Quantity must be a non-negative integer');
  }
  return value as Quantity;
}

// Type-safe operations
export function calculateLineTotal(qty: Quantity, price: Money): Money {
  return (qty * price) as Money;  // Compile-time checked
}
```

**Trade-offs:**
- ✅ Compile-time safety prevents mixing unrelated values
- ⚠️ Adds complexity to form handling (form inputs are strings)
- ⚠️ Requires type guards and conversion at boundaries

**Recommendation:** Consider when domain logic involves complex financial calculations or when bugs from mixing values have occurred.

### Validation Result Pattern

**Use case:** Return validation errors instead of throwing, enabling accumulation of all errors.

```typescript
// shared/lib/validation.ts
export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; errors: ValidationError[] };

export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

// Usage in validation
export function validateCreateQuotation(
  command: CreateQuotationCommand
): ValidationResult<CreateQuotationCommand> {
  const errors: ValidationError[] = [];

  if (!command.projectId) {
    errors.push({ field: 'projectId', message: 'Project is required' });
  }
  if (command.lineItems.length === 0) {
    errors.push({ field: 'lineItems', message: 'At least one line item required' });
  }

  return errors.length > 0
    ? { success: false, errors }
    : { success: true, data: command };
}
```

**Trade-offs:**
- ✅ Collects all errors at once (better UX for forms)
- ✅ Explicit error handling (no try/catch)
- ⚠️ Every caller must handle both cases
- ⚠️ More verbose than throwing

**When to use throw vs Result:**

| Scenario                                         | Pattern  | Reason                            |
|--------------------------------------------------|----------|-----------------------------------|
| Single critical error (invalid ID, auth failure) | `throw`  | Fail fast, single message         |
| Form validation (multiple fields)                | `Result` | Collect all errors for UX         |
| Command validation (before API)                  | `throw`  | Consistent with current pattern   |
| Complex wizard with cross-field validation       | `Result` | Need to highlight multiple fields |

**Recommendation:** Start with `throw` (current pattern). Migrate to `Result` only when forms need to display multiple errors simultaneously.

### Runtime API Parsing (Zod/Valibot)

**Use case:** Validate API responses at runtime to catch backend contract violations early.

```typescript
// entities/quotation/api/quotation.dto.ts
import { z } from 'zod';

// Define schema
const LineItemDTOSchema = z.object({
  id: z.number(),
  productId: z.number(),
  productSku: z.string(),
  productName: z.string(),
  sequence: z.number(),
  quantity: z.number(),
  unitPrice: z.number(),
  lineTotal: z.number(),
  notes: z.string().nullable(),
});

const QuotationDTOSchema = z.object({
  id: z.number(),
  projectId: z.number(),
  status: z.enum(['DRAFT', 'PENDING', 'APPROVED', 'SENT', 'ACCEPTED', 'REJECTED']),
  // ... other fields
  lineItems: z.array(LineItemDTOSchema).nullable(),
});

// Use in mapper
export const quotationMapper = {
  toDomain(dto: unknown): Quotation {
    // Parse and validate at runtime
    const parsed = QuotationDTOSchema.parse(dto);
    return {
      id: parsed.id,
      // ... mapping
    };
  },
};
```

**Trade-offs:**
- ✅ Catches API contract violations at runtime
- ✅ Self-documenting schema
- ⚠️ Bundle size increase (~12KB for zod)
- ⚠️ Performance overhead (parsing on every response)

**Recommendation:**
- **Internal APIs:** Optional - TypeScript types usually sufficient
- **External/3rd-party APIs:** Strongly recommended for safety
- **Complex nested structures:** Recommended if backend schema changes frequently

---

**Document Version:** 1.0
**Last Updated:** 2025-12-30
**Author:** Claude (Architecture Analysis)
