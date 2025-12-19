# Phase 1: Data Model Design

**Date**: 2025-11-24 (Updated: 2025-12-01)
**Branch**: `001-erp-core`
**Status**: Complete

**Key Update (2025-12-01)**: **Project** is the core domain entity. **JobCode** is a unique business identifier (natural key) on the Project entity. Approval workflows extracted into separate Approval domain.

**Key Update (2025-12-19)**: **Multi-level sequential approval** (결재 라인) implemented. Approval levels reference specific users (팀장, 부서장, 사장), not RBAC roles. Fixed chains per entity type, configurable by Admin.

---

## Entity-Relationship Overview

The WellKorea ERP data model centers on **Project** as the primary aggregate. JobCode (format: WK2{year}-{sequence}-{date}) is the unique business identifier for each Project. All other entities relate directly or transitively to a specific Project:

```
Project (root aggregate)
├── Customer (many-to-one)
├── Quotation (one-to-many)
│   ├── QuotationLineItem (one-to-many)
│   │   └── Product (many-to-one)
│   └── ApprovalRequest (one-to-one, via Approval domain)
├── WorkProgressSheet (one-to-many, per-product)
│   ├── Product (many-to-one)
│   └── WorkProgressStep (one-to-many)
├── Delivery (one-to-many)
│   ├── DeliveryLineItem (one-to-many)
│   │   └── Product (many-to-one)
│   └── Document (many-to-one, link to PDF)
├── TaxInvoice (one-to-many)
│   ├── InvoiceLineItem (one-to-many)
│   │   └── Product (many-to-one)
│   └── Document (many-to-one, link to PDF)
├── Payment (one-to-many)
├── Document (one-to-many, links to S3 files)
└── RFQ (one-to-many, purchase requests)
    └── PurchaseOrder (one-to-many)

ApprovalChainTemplate (approval configuration per entity type)
├── ApprovalChainLevel (one-to-many, ordered approvers: 팀장 → 부서장 → 사장)
│   └── User (many-to-one, specific approver at this level)
└── ApprovalRequest (one-to-many, workflow instances)
    ├── ApprovalLevelDecision (one-to-many, decision at each level)
    ├── ApprovalHistory (one-to-many, audit trail)
    └── ApprovalComment (one-to-many, discussions/rejection reasons)

User (cross-cutting)
├── Role (many-to-many)
└── AuditLog (records all data changes)

Supplier (cross-cutting, used by RFQ/PO)
└── SupplierResponse (to RFQ)

Product (catalog, referenced by quotations and invoices)
└── ProductType (category)
    └── WorkProgressStepTemplate (one-to-many: multiple step templates per product type)
```

---

## Core Entities

### 1. Project (Aggregate Root)

**Purpose**: Core domain entity representing a customer work request. JobCode is the unique business identifier for the Project.

**Table Name**: `projects`

**Fields**:

| Field | Type | Required | Unique | Notes |
|-------|------|----------|--------|-------|
| id | BigInt | Yes | Yes (PK) | Surrogate primary key |
| job_code | String(20) | Yes | Yes | Unique business identifier: WK2{year}-{sequence}-{date} |
| customer_id | FK | Yes | No | References Customer |
| project_name | String(255) | Yes | No | Customer's project description |
| requester_name | String(100) | No | No | Customer contact who requested |
| due_date | Date | Yes | No | Delivery deadline |
| internal_owner_id | FK | Yes | No | References User (staff responsible) |
| status | Enum | Yes | No | DRAFT, ACTIVE, COMPLETED, ARCHIVED |
| created_by_id | FK | Yes | No | References User (who created) |
| created_at | Timestamp | Yes | No | UTC |
| updated_at | Timestamp | Yes | No | UTC, auto-updated |
| is_deleted | Boolean | No | No | Soft delete; default false |

**Validation Rules**:
- `job_code` matches pattern: `WK2\d{4}-\d{6}-\d{8}` (year-sequence-date YYYYMMDD)
- `job_code` must be unique across all time (prevent reuse)
- `project_name` non-empty, max 255 chars
- `due_date` must be >= today (at creation)
- `customer_id` must exist in customers table
- `internal_owner_id` must exist in users table

**Indices**:
- Primary: (id)
- Unique: (job_code)
- Search: (customer_id, created_at)
- Search: (internal_owner_id)
- Search: (status)

**Relationships**:
- 1:N → Quotation
- 1:N → WorkProgressSheet
- 1:N → Delivery
- 1:N → TaxInvoice
- 1:N → Payment
- 1:N → Document
- 1:N → RFQ
- M:1 → Customer
- M:1 → User (internal_owner)

---

### 2. Customer

**Purpose**: External party receiving quotations and invoices.

**Fields**:

| Field | Type | Required | Unique | Notes |
|-------|------|----------|--------|-------|
| id | UUID/BigInt | Yes | Yes (PK) | Database ID |
| name | String(255) | Yes | No | Company name |
| registration_number | String(20) | No | Yes | 사업자등록번호 (if Korean company) |
| tax_id | String(20) | No | No | Used for tax invoice |
| contact_person | String(100) | No | No | Primary contact name |
| phone | String(20) | No | No | Phone number |
| email | String(255) | No | No | Email address (may differ from sales rep) |
| address | Text | No | No | Full address |
| payment_terms | Enum | No | No | NET30, NET60, COD, etc. |
| created_at | Timestamp | Yes | No | UTC |
| is_deleted | Boolean | No | No | Soft delete |

**Validation Rules**:
- `name` non-empty, max 255 chars
- `registration_number` unique if provided
- `email` valid format if provided
- `payment_terms` in predefined list

**Indices**:
- Primary: (id)
- Unique: (registration_number) where is_deleted = false
- Search: (name)

**Relationships**:
- 1:N → JobCode
- 1:N → TaxInvoice

---

### 3. Product (Catalog)

**Purpose**: Pre-defined product that can be quoted, produced, and invoiced.

**Fields**:

| Field | Type | Required | Unique | Notes |
|-------|------|----------|--------|-------|
| id | UUID/BigInt | Yes | Yes (PK) | Database ID |
| sku | String(50) | Yes | Yes | Product code |
| name | String(255) | Yes | No | Product name |
| description | Text | No | No | Detailed description |
| product_type_id | FK | Yes | No | References ProductType (e.g., "Bracket", "Frame") |
| base_unit_price | Decimal(10,2) | No | No | Optional catalog price (may be overridden per quote) |
| unit | String(20) | No | No | Unit of measure (EA, M, KG, etc.) |
| is_active | Boolean | Yes | No | Soft deactivation; default true |
| created_at | Timestamp | Yes | No | UTC |

**Validation Rules**:
- `sku` non-empty, max 50 chars, unique
- `name` non-empty, max 255 chars
- `base_unit_price` >= 0 if provided
- `product_type_id` must exist

**Indices**:
- Primary: (id)
- Unique: (sku) where is_active = true
- Search: (product_type_id)
- Search: (name) for full-text search

**Relationships**:
- M:1 → ProductType
- 1:N → QuotationLineItem
- 1:N → WorkProgressSheet
- 1:N → InvoiceLineItem
- 1:1 → WorkProgressStepTemplate

---

### 4. ProductType

**Purpose**: Category/classification of products; defines work progress steps.

**Fields**:

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | UUID/BigInt | Yes | Primary key |
| name | String(100) | Yes | E.g., "Brackets", "Frames", "Enclosures" |
| description | Text | No | Category description |

**Relationships**:
- 1:N → Product
- 1:N → WorkProgressStepTemplate (one ProductType has multiple step templates defining the manufacturing process)

---

### 5. WorkProgressStepTemplate

**Purpose**: Defines standard work steps for a product type (e.g., "Cut", "Weld", "Paint", "QC").

**Fields**:

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | UUID/BigInt | Yes | Primary key |
| product_type_id | FK | Yes | References ProductType |
| step_number | Integer | Yes | 1, 2, 3, ... (execution order) |
| step_name | String(100) | Yes | E.g., "Cutting", "Welding", "Painting" |
| estimated_hours | Decimal(5,2) | No | Baseline time estimate |

**Relationships**:
- M:1 → ProductType
- 1:N → WorkProgressStep (instances in actual JobCodes)

---

### 6. Quotation

**Purpose**: Commercial offer to customer for specific products/quantities/pricing.

**Fields**:

| Field | Type | Required | Unique | Notes |
|-------|------|----------|--------|-------|
| id | UUID/BigInt | Yes | Yes (PK) | Database ID |
| jobcode_id | FK | Yes | No | References JobCode |
| version | Integer | Yes | No | 1, 2, 3, ... auto-increment per JobCode |
| status | Enum | Yes | No | Draft, Pending, Approved, Sent, Rejected, Accepted |
| quotation_date | Date | Yes | No | Date quotation created |
| created_by_id | FK | Yes | No | References User (creator) |
| submitted_at | Timestamp | No | No | When submitted for approval |
| approved_at | Timestamp | No | No | When approved |
| approved_by_id | FK | No | No | References User (approver) |
| rejection_reason | Text | No | No | If status = Rejected, reason from approver |
| sent_to_customer_date | Date | No | No | When sent for customer review |
| customer_accepted_date | Date | No | No | When customer confirmed acceptance |
| total_amount | Decimal(12,2) | Yes | No | Sum of all line items (calculated) |
| created_at | Timestamp | Yes | No | UTC |
| updated_at | Timestamp | Yes | No | UTC |

**Validation Rules**:
- `jobcode_id` must exist and belong to same customer
- `version` auto-incremented per JobCode
- `status` transitions follow workflow: Draft → Pending → Approved → Sent → Accepted OR Rejected (returns to Draft)
- `total_amount` = SUM(quantity × unit_price) from QuotationLineItem
- If `status` = Rejected, `rejection_reason` required
- Only Admin/Finance can approve; Sales can create/submit

**Indices**:
- Primary: (id)
- Unique: (jobcode_id, version)
- Search: (status, created_at)
- Search: (created_by_id)

**Relationships**:
- M:1 → JobCode
- 1:N → QuotationLineItem
- 1:N → Approval (approval history)
- M:1 → User (created_by, approved_by)

---

### 7. QuotationLineItem

**Purpose**: Individual product row in a quotation.

**Fields**:

| Field | Type | Required | Unique | Notes |
|-------|------|----------|--------|-------|
| id | UUID/BigInt | Yes | Yes (PK) | Database ID |
| quotation_id | FK | Yes | No | References Quotation |
| product_id | FK | Yes | No | References Product (selected from catalog) |
| sequence | Integer | Yes | No | Display order (1, 2, 3, ...) |
| quantity | Decimal(10,2) | Yes | No | How many units requested |
| unit_price | Decimal(10,2) | Yes | No | Price for this quote (may differ from catalog) |
| line_total | Decimal(12,2) | Yes | No | quantity × unit_price (calculated) |
| created_at | Timestamp | Yes | No | UTC |

**Validation Rules**:
- `product_id` must exist in Product table
- `quantity` > 0
- `unit_price` >= 0
- `line_total` = quantity × unit_price
- If Quotation approved, QuotationLineItem cannot be changed (immutable)

**Indices**:
- Primary: (id)
- Foreign: (quotation_id)
- Foreign: (product_id)

**Relationships**:
- M:1 → Quotation
- M:1 → Product

---

### 8. Approval Domain (Multi-Level Sequential Approval)

**Purpose**: Multi-level sequential approval workflow (승인/결재) for quotations, purchase orders, and other approvable entities. Supports configurable approval chains with position-based approvers (팀장, 부서장, 사장).

**Key Design**:
- Fixed approval chains per entity type (all Quotations use same chain)
- Sequential processing: Level 1 must approve before Level 2 can act
- Position-based: Each level assigned to specific user (not RBAC roles)
- Configurable: Admin assigns specific users to approval levels

#### 8a. ApprovalChainTemplate

**Purpose**: Defines the approval chain configuration for each entity type.

**Table Name**: `approval_chain_templates`

| Field | Type | Required | Unique | Notes |
|-------|------|----------|--------|-------|
| id | BigInt | Yes | Yes (PK) | Primary key |
| entity_type | String(50) | Yes | Yes | QUOTATION, PURCHASE_ORDER |
| name | String(100) | Yes | No | "견적서 결재", "발주서 결재" |
| description | Text | No | No | Chain description |
| is_active | Boolean | Yes | No | Default true |
| created_at | Timestamp | Yes | No | UTC |
| updated_at | Timestamp | Yes | No | UTC |

**Relationships**:
- 1:N → ApprovalChainLevel

---

#### 8b. ApprovalChainLevel

**Purpose**: Ordered sequence of approval levels within a chain. Each level references a specific user.

**Table Name**: `approval_chain_levels`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | BigInt | Yes | Primary key |
| chain_template_id | FK | Yes | References ApprovalChainTemplate |
| level_order | Int | Yes | 1, 2, 3... (execution order) |
| level_name | String(100) | Yes | Position title: "팀장", "부서장", "사장" |
| approver_user_id | FK | Yes | References User (specific approver) |
| is_required | Boolean | Yes | Can this level be skipped? Default true |
| created_at | Timestamp | Yes | UTC |

**Validation Rules**:
- Unique constraint on (chain_template_id, level_order)
- level_order > 0

**Default Configuration**:
- **Quotation**: Level 1 (팀장) → Level 2 (부서장) → Level 3 (사장, if needed)
- **PurchaseOrder**: Level 1 (팀장) → Level 2 (부서장) → Level 3 (사장, if needed)

**Relationships**:
- M:1 → ApprovalChainTemplate
- M:1 → User (approver)

---

#### 8c. ApprovalRequest

**Purpose**: Tracks approval workflow instance for a specific entity.

**Table Name**: `approval_requests`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | BigInt | Yes | Primary key |
| entity_type | String(50) | Yes | QUOTATION, PURCHASE_ORDER |
| entity_id | BigInt | Yes | ID of entity being approved |
| entity_description | String(500) | No | "견적서 v3 - WK2K25-0001-0104" |
| chain_template_id | FK | Yes | References ApprovalChainTemplate |
| current_level | Int | Yes | Which level awaiting approval (default 1) |
| total_levels | Int | Yes | Total levels in chain |
| status | Enum | Yes | PENDING, APPROVED, REJECTED |
| submitted_by_id | FK | Yes | References User |
| submitted_at | Timestamp | Yes | When submitted |
| completed_at | Timestamp | No | When final decision made |
| created_at | Timestamp | Yes | UTC |
| updated_at | Timestamp | Yes | UTC |

**Validation Rules**:
- Unique constraint on (entity_type, entity_id) - one active approval per entity
- Status: PENDING until all levels approve, APPROVED when complete, REJECTED if any level rejects

**Relationships**:
- M:1 → ApprovalChainTemplate
- M:1 → User (submitted_by)
- 1:N → ApprovalLevelDecision
- 1:N → ApprovalHistory
- 1:N → ApprovalComment

---

#### 8d. ApprovalLevelDecision

**Purpose**: Tracks the decision at each level of the approval chain.

**Table Name**: `approval_level_decisions`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | BigInt | Yes | Primary key |
| approval_request_id | FK | Yes | References ApprovalRequest |
| level_order | Int | Yes | Which level this decision is for |
| expected_approver_id | FK | Yes | References User (who should approve) |
| decision | Enum | Yes | PENDING, APPROVED, REJECTED (default PENDING) |
| decided_by_id | FK | No | References User (who actually decided) |
| decided_at | Timestamp | No | When decision was made |
| comments | Text | No | Approval/rejection comments |
| created_at | Timestamp | Yes | UTC |
| updated_at | Timestamp | Yes | UTC |

**Validation Rules**:
- Unique constraint on (approval_request_id, level_order)
- decided_by_id should match expected_approver_id (enforced in business logic)

**Relationships**:
- M:1 → ApprovalRequest
- M:1 → User (expected_approver)
- M:1 → User (decided_by)

---

#### 8e. ApprovalHistory

**Purpose**: Audit trail of all approval workflow actions.

**Table Name**: `approval_history`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | BigInt | Yes | Primary key |
| approval_request_id | FK | Yes | References ApprovalRequest |
| level_order | Int | No | Which level (null for SUBMITTED) |
| action | Enum | Yes | SUBMITTED, APPROVED, REJECTED |
| actor_id | FK | Yes | References User |
| comments | Text | No | Action comments |
| created_at | Timestamp | Yes | UTC |

**Relationships**:
- M:1 → ApprovalRequest
- M:1 → User (actor)

---

#### 8f. ApprovalComment

**Purpose**: Discussion comments on approval requests (including mandatory rejection reasons).

**Table Name**: `approval_comments`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | BigInt | Yes | Primary key |
| approval_request_id | FK | Yes | References ApprovalRequest |
| commenter_id | FK | Yes | References User |
| comment_text | Text | Yes | Comment content |
| is_rejection_reason | Boolean | Yes | True if mandatory rejection reason |
| created_at | Timestamp | Yes | UTC |

**Relationships**:
- M:1 → ApprovalRequest
- M:1 → User (commenter)

---

### 9. WorkProgressSheet

**Purpose**: Track production steps for a specific product within a JobCode.

**Key Design**: One WorkProgressSheet per (JobCode, Product) combination. This enables:
- Different products in same JobCode to have independent progress
- Partial delivery (e.g., complete Product A, still working on Product B)

**Fields**:

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | UUID/BigInt | Yes | Primary key |
| jobcode_id | FK | Yes | References JobCode |
| product_id | FK | Yes | References Product |
| sequence | Integer | Yes | Which product row in quotation (for display) |
| status | Enum | Yes | Not Started, In Progress, Completed |
| created_at | Timestamp | Yes | UTC |
| updated_at | Timestamp | Yes | UTC |

**Validation Rules**:
- Unique constraint on (jobcode_id, product_id)
- Only one WorkProgressSheet per product per JobCode

**Relationships**:
- M:1 → JobCode
- M:1 → Product
- 1:N → WorkProgressStep (instances of template steps)

---

### 10. WorkProgressStep

**Purpose**: Instance of a work step for a specific product in a JobCode.

**Fields**:

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | UUID/BigInt | Yes | Primary key |
| sheet_id | FK | Yes | References WorkProgressSheet |
| step_template_id | FK | Yes | References WorkProgressStepTemplate |
| step_number | Integer | Yes | Order (1, 2, 3, ...) |
| status | Enum | Yes | Not Started, In Progress, Completed |
| started_at | Timestamp | No | When work began |
| completed_at | Timestamp | No | When work finished |
| completed_by_id | FK | No | References User (who completed) |
| notes | Text | No | Work notes, issues, observations |
| created_at | Timestamp | Yes | UTC |

**Validation Rules**:
- `status` progression: Not Started → In Progress → Completed
- If `completed_at` set, `status` must be Completed
- `completed_by_id` required if status = Completed

**Relationships**:
- M:1 → WorkProgressSheet
- M:1 → WorkProgressStepTemplate
- M:1 → User (completed_by)

---

### 11. Delivery

**Purpose**: Record when products are shipped to customer.

**Fields**:

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | UUID/BigInt | Yes | Primary key |
| jobcode_id | FK | Yes | References JobCode |
| delivery_date | Date | Yes | Date of delivery |
| status | Enum | Yes | Pending, Delivered, Returned |
| delivered_by_id | FK | Yes | References User (staff who recorded delivery) |
| created_at | Timestamp | Yes | UTC |

**Relationships**:
- M:1 → JobCode
- 1:N → DeliveryLineItem
- M:1 → User (delivered_by)

---

### 12. DeliveryLineItem

**Purpose**: Which products were delivered in this shipment.

**Fields**:

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | UUID/BigInt | Yes | Primary key |
| delivery_id | FK | Yes | References Delivery |
| product_id | FK | Yes | References Product |
| quantity_delivered | Decimal(10,2) | Yes | How many units delivered |

**Validation Rules**:
- `quantity_delivered` > 0
- `quantity_delivered` <= quantity from relevant QuotationLineItem (prevent over-delivery)

**Relationships**:
- M:1 → Delivery
- M:1 → Product

---

### 13. TaxInvoice

**Purpose**: Official tax invoice (세금계산서) sent to customer for payment.

**Fields**:

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | UUID/BigInt | Yes | Primary key |
| jobcode_id | FK | Yes | References JobCode |
| invoice_number | String(50) | Yes | Unique identifier (e.g., INV-2025-001234) |
| issue_date | Date | Yes | Date invoice issued |
| quotation_version | Integer | Yes | Which quotation version this invoice references |
| status | Enum | Yes | Draft, Issued, Paid, Partially Paid, Overdue, Cancelled |
| total_before_tax | Decimal(12,2) | Yes | Subtotal (calculated) |
| tax_rate | Decimal(5,2) | Yes | E.g., 10.0 for 10% VAT |
| total_tax | Decimal(12,2) | Yes | total_before_tax × tax_rate / 100 |
| total_amount | Decimal(12,2) | Yes | total_before_tax + total_tax |
| due_date | Date | Yes | Payment deadline |
| created_by_id | FK | Yes | References User |
| created_at | Timestamp | Yes | UTC |
| issued_to_customer_date | Date | No | When officially sent to customer |

**Validation Rules**:
- `invoice_number` unique across all time
- `quotation_version` must match approved Quotation
- `total_before_tax`, `total_tax`, `total_amount` calculated from InvoiceLineItem
- `due_date` >= issue_date
- Tax rate typically 10% (Korean VAT) but configurable
- Status transitions: Draft → Issued → Paid/PartiallyPaid/Overdue/Cancelled

**Indices**:
- Primary: (id)
- Unique: (invoice_number)
- Search: (jobcode_id, status)
- Search: (due_date) for aging analysis

**Relationships**:
- M:1 → JobCode
- 1:N → InvoiceLineItem
- 1:N → Payment (partial payments tracked separately)
- M:1 → User (created_by)
- 1:1 → Document (link to PDF invoice)

---

### 14. InvoiceLineItem

**Purpose**: Which products are in this invoice and how much has been invoiced.

**Key Design**: Granular invoicing—tracks exactly what has been invoiced to prevent double-billing.

**Fields**:

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | UUID/BigInt | Yes | Primary key |
| invoice_id | FK | Yes | References TaxInvoice |
| product_id | FK | Yes | References Product |
| quantity_invoiced | Decimal(10,2) | Yes | How many units in this invoice |
| unit_price | Decimal(10,2) | Yes | Price per unit (from QuotationLineItem) |
| line_total | Decimal(12,2) | Yes | quantity_invoiced × unit_price (before tax) |

**Validation Rules**:
- `unit_price` must match QuotationLineItem for same product in same quotation
- `quantity_invoiced` > 0
- Across all invoices for same (JobCode, Product), sum of quantities cannot exceed quotation quantity
  (prevents double-billing)
- `line_total` = quantity_invoiced × unit_price

**Relationships**:
- M:1 → TaxInvoice
- M:1 → Product

---

### 15. Payment

**Purpose**: Record customer payment toward invoices (supports partial/installment payments).

**Fields**:

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | UUID/BigInt | Yes | Primary key |
| invoice_id | FK | Yes | References TaxInvoice |
| payment_date | Date | Yes | When payment received |
| amount | Decimal(12,2) | Yes | Payment amount |
| payment_method | Enum | Yes | Bank Transfer, Credit Card, Check, Cash, etc. |
| reference_number | String(100) | No | Bank confirmation number, check number, etc. |
| notes | Text | No | Additional details |
| recorded_by_id | FK | Yes | References User (who recorded) |
| created_at | Timestamp | Yes | UTC |

**Validation Rules**:
- `amount` > 0
- For single invoice, sum of all payments cannot exceed invoice total_amount
- `reference_number` stored for audit trail

**Relationships**:
- M:1 → TaxInvoice
- M:1 → User (recorded_by)

---

### 16. Document

**Purpose**: Link to files stored in S3/MinIO (quotations, invoices, work photos, CAD files, RFQ attachments, etc.).

**Fields**:

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | UUID/BigInt | Yes | Primary key |
| owner_type | Enum | Yes | JobCode, Quotation, TaxInvoice, Delivery, RFQ, etc. |
| owner_id | UUID/BigInt | Yes | ID of owner (e.g., jobcode_id) |
| document_type | Enum | Yes | Quotation PDF, Invoice PDF, Work Photo, Drawing, RFQ Attachment, PO PDF |
| filename | String(255) | Yes | Original filename |
| file_key | String(500) | Yes | Path in S3 (e.g., "jobcodes/WK2-2025-001/quotation-v1.pdf") |
| mime_type | String(100) | Yes | application/pdf, image/jpeg, etc. |
| file_size | Long | Yes | Bytes |
| version | Integer | No | If document versioned (e.g., drawing revisions) |
| uploaded_by_id | FK | Yes | References User |
| created_at | Timestamp | Yes | UTC |
| is_deleted | Boolean | No | Soft delete for audit trail |

**Validation Rules**:
- `owner_id` must exist in referenced table
- `file_key` must be unique in S3
- Quotation documents accessible only by Admin/Finance
- Work photos accessible by Production staff assigned to JobCode
- File uploads validated by MIME type and size limits

**Indices**:
- Search: (owner_type, owner_id) to find all docs for a JobCode
- Search: (document_type) for filtering

**Relationships**:
- M:1 → User (uploaded_by)
- Owner relationship is polymorphic (links to JobCode, Quotation, TaxInvoice, etc.)

---

### 17. RFQ (Request for Quotation)

**Purpose**: Internal form to request supplier quotes for materials/services needed for a JobCode.

**Fields**:

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | UUID/BigInt | Yes | Primary key |
| jobcode_id | FK | Yes | References JobCode |
| rfq_number | String(50) | Yes | Unique ID (e.g., RFQ-2025-001) |
| item_description | Text | Yes | What you're requesting from suppliers |
| quantity | Decimal(10,2) | Yes | How many units needed |
| due_date | Date | Yes | When you need supplier responses |
| created_by_id | FK | Yes | References User |
| status | Enum | Yes | Draft, Sent, Responses Received, Closed |
| created_at | Timestamp | Yes | UTC |

**Relationships**:
- M:1 → JobCode
- 1:N → RFQLine (to send RFQ to multiple suppliers)
- M:1 → User (created_by)

---

### 18. PurchaseOrder

**Purpose**: Official order to supplier based on RFQ response.

**Fields**:

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | UUID/BigInt | Yes | Primary key |
| rfq_id | FK | Yes | References RFQ |
| supplier_id | FK | Yes | References Supplier |
| po_number | String(50) | Yes | Unique ID (e.g., PO-2025-001) |
| order_date | Date | Yes | When order placed |
| delivery_date | Date | Yes | Expected delivery |
| total_amount | Decimal(12,2) | Yes | Order total |
| status | Enum | Yes | Draft, Sent, Confirmed, Received, Cancelled |
| created_by_id | FK | Yes | References User |
| created_at | Timestamp | Yes | UTC |

**Relationships**:
- M:1 → RFQ
- M:1 → Supplier
- M:1 → User (created_by)

---

### 19. Supplier

**Purpose**: External vendor for raw materials or outsourced services.

**Fields**:

| Field | Type | Required | Unique | Notes |
|-------|------|----------|--------|-------|
| id | UUID/BigInt | Yes | Yes (PK) | Database ID |
| name | String(255) | Yes | No | Company name |
| registration_number | String(20) | No | Yes | 사업자등록번호 |
| contact_person | String(100) | No | No | Primary contact |
| phone | String(20) | No | No | Phone |
| email | String(255) | No | No | Email |
| address | Text | No | No | Address |
| created_at | Timestamp | Yes | No | UTC |

**Relationships**:
- 1:N → PurchaseOrder

---

### 20. User

**Purpose**: Staff member with login credentials and role assignments.

**Fields**:

| Field | Type | Required | Unique | Notes |
|-------|------|----------|--------|-------|
| id | UUID/BigInt | Yes | Yes (PK) | Database ID |
| username | String(100) | Yes | Yes | Login ID |
| email | String(255) | Yes | Yes | Email address |
| password_hash | String(255) | Yes | No | Bcrypt or similar |
| first_name | String(100) | No | No | Given name |
| last_name | String(100) | No | No | Family name |
| is_active | Boolean | Yes | No | Deactivate without deleting |
| department | String(100) | No | No | Production, Sales, Finance, Admin |
| assigned_jobcodes | Text | No | No | JSON array of JobCode IDs (for scoped visibility) |
| created_at | Timestamp | Yes | No | UTC |

**Validation Rules**:
- `username` unique, alphanumeric + underscore
- `email` unique, valid format
- `password_hash` never stored in plaintext

**Relationships**:
- M:N → Role (through UserRole junction table)
- 1:N → AuditLog (records all actions)

---

### 21. Role

**Purpose**: Permission set assigned to users (Admin, Finance, Sales, Production).

**Fields**:

| Field | Type | Required | Unique | Notes |
|-------|------|----------|--------|-------|
| id | UUID/BigInt | Yes | Yes (PK) | Database ID |
| name | String(50) | Yes | Yes | Admin, Finance, Sales, Production |
| description | String(255) | No | No | What this role can do |

**Built-in Roles**:
1. **Admin**: Full system access; user/role management; quotation approval override
2. **Finance**: Create/approve quotations; post invoices; post payments; AR/AP reporting
3. **Sales**: Create quotations (READ-ONLY others' approved); view customer quotations
4. **Production**: Update work progress; upload photos; cannot see quotations/pricing

**Relationships**:
- M:N ← User (through UserRole junction table)
- 1:N → Permission (fine-grained access control)

---

### 22. AuditLog

**Purpose**: Immutable record of all data changes for compliance.

**Fields**:

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | UUID/BigInt | Yes | Primary key |
| entity_type | String(100) | Yes | JobCode, Quotation, TaxInvoice, Payment, etc. |
| entity_id | UUID/BigInt | Yes | ID of changed entity |
| action | Enum | Yes | Create, Update, Delete |
| user_id | FK | Yes | References User (who made change) |
| timestamp | Timestamp | Yes | When change occurred (UTC) |
| old_values | JSON | No | Before-values for updates/deletes |
| new_values | JSON | Yes | After-values |
| ip_address | String(50) | No | Source IP for security audit |

**Validation Rules**:
- AuditLog table has no delete capability (immutable)
- Only Admin can query audit logs
- All financial transactions (invoice creation, payment posting) must have audit record

**Indices**:
- Search: (entity_type, entity_id, action)
- Search: (user_id, timestamp) for "who did what when"
- Search: (timestamp) for time-range audits

---

## Database Constraints & Relationships

### Foreign Keys

All foreign keys use ON DELETE RESTRICT (prevent deletion of referenced entities unless cascading is explicit):

```
JobCode
├─ FK → Customer (ON DELETE RESTRICT)
└─ FK → User (ON DELETE RESTRICT)

Quotation
├─ FK → JobCode (ON DELETE RESTRICT)
├─ FK → User (ON DELETE RESTRICT)
└─ M:N → Approval

QuotationLineItem
├─ FK → Quotation (ON DELETE CASCADE—delete item if quotation deleted)
└─ FK → Product (ON DELETE RESTRICT)

WorkProgressSheet
├─ FK → JobCode (ON DELETE CASCADE)
└─ FK → Product (ON DELETE RESTRICT)

WorkProgressStep
├─ FK → WorkProgressSheet (ON DELETE CASCADE)
├─ FK → WorkProgressStepTemplate (ON DELETE RESTRICT)
└─ FK → User (ON DELETE RESTRICT)

Delivery
├─ FK → JobCode (ON DELETE CASCADE)
└─ FK → User (ON DELETE RESTRICT)

DeliveryLineItem
├─ FK → Delivery (ON DELETE CASCADE)
└─ FK → Product (ON DELETE RESTRICT)

TaxInvoice
├─ FK → JobCode (ON DELETE RESTRICT—don't allow deleting JobCode with invoices)
├─ FK → User (ON DELETE RESTRICT)
└─ 1:N → InvoiceLineItem

InvoiceLineItem
├─ FK → TaxInvoice (ON DELETE CASCADE)
└─ FK → Product (ON DELETE RESTRICT)

Payment
├─ FK → TaxInvoice (ON DELETE RESTRICT—preserve payment records)
└─ FK → User (ON DELETE RESTRICT)

Document
├─ Polymorphic owner_id (may reference JobCode, Quotation, TaxInvoice, etc.)
└─ FK → User (ON DELETE RESTRICT)

RFQ
├─ FK → JobCode (ON DELETE CASCADE)
└─ FK → User (ON DELETE RESTRICT)

PurchaseOrder
├─ FK → RFQ (ON DELETE RESTRICT)
├─ FK → Supplier (ON DELETE RESTRICT)
└─ FK → User (ON DELETE RESTRICT)

AuditLog
└─ FK → User (ON DELETE RESTRICT—preserve audit trail)

User
└─ M:N → Role (through UserRole junction table)

UserRole (junction)
├─ FK → User (ON DELETE CASCADE)
└─ FK → Role (ON DELETE CASCADE)
```

### Unique Constraints

| Table | Columns | Condition | Reason |
|-------|---------|-----------|--------|
| JobCode | (jobcode_string) | Always | Prevent duplicate JobCodes |
| Quotation | (jobcode_id, version) | Always | Prevent duplicate versions per JobCode |
| TaxInvoice | (invoice_number) | Always | Prevent duplicate invoice numbers |
| InvoiceLineItem | (invoice_id, product_id) | Always | One invoice line per product per invoice |
| WorkProgressSheet | (jobcode_id, product_id) | Always | One progress sheet per product per JobCode |
| Product | (sku) | WHERE is_active = true | Allow archived duplicates; prevent active duplicates |
| Customer | (registration_number) | WHERE is_deleted = false | Allow soft-deleted duplicates |
| User | (username, email) | Always | Prevent duplicate logins/emails |

---

## Indexes for Performance

**High-Priority Indexes**:
```sql
-- JobCode lookups
CREATE INDEX idx_jobcode_string ON job_codes(jobcode_string);
CREATE INDEX idx_jobcode_customer ON job_codes(customer_id);
CREATE INDEX idx_jobcode_status ON job_codes(status);

-- Quotation lookups
CREATE INDEX idx_quotation_jobcode_version ON quotations(jobcode_id, version);
CREATE INDEX idx_quotation_status ON quotations(status);

-- Invoice lookups
CREATE INDEX idx_invoice_jobcode ON tax_invoices(jobcode_id);
CREATE INDEX idx_invoice_number ON tax_invoices(invoice_number);
CREATE INDEX idx_invoice_due_date ON tax_invoices(due_date); -- For aging analysis

-- Payment lookups
CREATE INDEX idx_payment_invoice ON payments(invoice_id);

-- Work progress tracking
CREATE INDEX idx_workprogress_jobcode_product ON work_progress_sheets(jobcode_id, product_id);

-- Audit logging
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_user_time ON audit_logs(user_id, timestamp);

-- Document searches
CREATE INDEX idx_document_owner ON documents(owner_type, owner_id);
```

---

## Soft Deletes & Data Retention

**Soft Delete Strategy**:
- `JobCode`, `Product`, `User`, `Customer`: Use `is_deleted` boolean; queries filter WHERE is_deleted = false
- `Document`: Use `is_deleted` to preserve file audit trail even if document "removed"
- `AuditLog`: No delete ever (immutable audit trail)

**Data Retention**:
- Active data (current year): Full access
- Archive data (1–7 years): Accessible but read-only; separate query optimization
- Audit logs: Retained forever (financial compliance)
- Documents: Retained 7 years minimum (tax requirement)

---

## State Machine Diagrams

### JobCode Status

```
Draft → Active → Completed
   ↑
   └─ Archived (from any state)
```

### Quotation Status

```
Draft ──→ Pending ──→ Approved ──→ Sent ──→ Accepted
   ↓         ↓          ↓
   └─────────Rejected ──┘
   (return to Draft with comments)
```

### TaxInvoice Status

```
Draft ──→ Issued ──→ Paid
   ↓        ↓
   └─ Partially Paid
   └─ Overdue (if due_date passed and not fully paid)
   └─ Cancelled (by Admin only)
```

### WorkProgressStep Status

```
Not Started → In Progress → Completed
```

---

## Next Steps: API Contract Design

The API contracts (`/contracts/` directory) will define REST endpoints for:
1. JobCode CRUD (create, read, update, list)
2. Quotation creation, approval, versioning
3. Work progress tracking
4. Delivery & invoicing
5. Payment posting
6. Document upload/download
7. Admin functions (users, roles, products)
8. Reporting (dashboards, exports)

Each endpoint will include:
- HTTP method and path
- Request schema (OpenAPI/Swagger)
- Response schema
- Authorization (role-based)
- Error codes

See `/contracts/` directory for OpenAPI specification.
