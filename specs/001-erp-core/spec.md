# Feature Specification: WellKorea Integrated Work System (ERP)

**Feature Branch**: `001-erp-core`
**Created**: 2025-11-24
**Status**: Draft

## Overview

The WellKorea Integrated Work System consolidates fragmented job lifecycle data (currently spread across handwritten ledgers, multiple Excel files, legacy order software, and folder trees) into a unified web application. The system manages the complete workflow from customer request through JobCode creation, quotation & approval (with products from catalog), production tracking per product, granular delivery/invoicing (by product and quantity), payments, and financial reporting.

**Key Design Principle**: Quotations list customer-requested products from a pre-defined catalog with quantities and unit prices. Production progress is tracked via TaskFlow (DAG-based task management per project). Invoicing is granular—allowing any combination of products and quantities to be invoiced independently, with the system preventing double-billing by tracking what's been invoiced.

---

## Clarifications

### Session 2025-11-24

- Q: Sales role quotation access scope? → A: Sales role has READ-ONLY access to quotations they created and approved quotations for assigned customers.
- Q: Quotation rejection workflow? → A: Quotation rejection returns to DRAFT with mandatory approver comments; creator must address comments before resubmitting.
- Q: Expected JobCode volume for capacity planning? → A: Medium volume (500–1000 JobCodes/month) for capacity planning baseline.
- Q: Production staff visibility scope? → A: Flexible per-user assignment by Admin (to JobCodes, departments, or full plant visibility).
- Q: Quotation revision after "Sent" status? → A: New version created with automatic versioning AND optional email notification to customer (Admin chooses whether to notify).

### Session 2025-12-19

- Q: Single-level or multi-level approval? → A: **Multi-level sequential approval required** (결재 라인). Approval must proceed through ordered levels (e.g., 팀장 → 부서장 → 사장).
- Q: How should approval levels be configured? → A: **Fixed chains per entity type**, configurable by Admin. All quotations use the same approval chain; all purchase orders use the same chain.
- Q: How should approval positions (팀장, 부서장, 사장) be defined? → A: **Specific approver users** are assigned to each level. Each level references a specific user ID, not RBAC roles. Admin assigns who is 팀장, 부서장, 사장 for each entity type.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - JobCode Creation & Request Intake (Priority: P1)

**Description**: Operations staff receives a customer request (via email, phone, or system) and creates a new JobCode in a single place, recording all essential information (customer, project name, requester, due date, internal owner) once. This single entry powers order status, production tracking (TaskFlow), quotations, and AR/AP records without re-entry.

**Why this priority**: This is the foundational data entry point. Without a reliable JobCode creation workflow, the entire system falls apart. All downstream features depend on this core entity existing in one place.

**Independent Test**: Can be fully tested by:
1. Creating a new request (customer, project name, due date, internal owner)
2. Verifying JobCode is auto-generated per rule (WK2{year}-{sequence}-{date})
3. Confirming no data re-entry is needed for subsequent quotation, production, or AR/AP processes
4. Validating that JobCode is editable and unique
5. Checking that order status view pulls from this single source

This story delivers the MVP for job intake and centralized project identity.

**Acceptance Scenarios**:

1. **Given** a customer request arrives, **When** staff creates a new job in the system with customer name, project name, due date, and internal owner, **Then** a unique JobCode is generated automatically (format: WK2{year}-{sequence}-{date}) and the job record is created in one place.

2. **Given** a JobCode has been created, **When** an admin views the job details, **Then** all fields (customer, project name, JobCode, due date, internal owner) are editable to correct data entry or reflect late-arriving information.

3. **Given** multiple users attempt to create jobs simultaneously, **When** both request sequential JobCodes, **Then** the system assigns unique sequence numbers and prevents duplicate JobCodes.

4. **Given** a JobCode exists, **When** a user navigates to quotation, production, or AR/AP sections, **Then** the customer, project name, and JobCode are pre-populated (no re-entry needed).

---

### User Story 2 - Quotation Creation from Product Catalog & Approval Workflow (Priority: P1)

**Description**: Sales/finance staff creates a quotation from a JobCode by selecting products from a pre-defined product catalog (e.g., "Aluminum bracket," "Steel frame," "Custom enclosure"). For each product, staff manually enter the quantity and unit price for that specific quotation (prices vary per quote, not fixed from catalog). An internal approval workflow (승인/결재) records who approved and when. Quotation line items and totals automatically flow into downstream delivery/invoicing without manual re-entry.

**Why this priority**: Quotations are the commercial contract; automating their creation with a product catalog, approval tracking, and cascade to invoicing removes manual re-keying, prevents pricing errors, and enables real-time AR tracking. The approval trail is a compliance requirement.

**Independent Test**: Can be fully tested by:
1. Creating a quotation from an existing JobCode by selecting 3–5 products from the catalog
2. Entering quantities and unit prices for each product (different prices than catalog if needed)
3. Submitting quotation for internal approval
4. Approving the quotation and verifying approval history is logged (approver name, date, time)
5. Generating a PDF quotation for customer delivery
6. Editing a line item's unit price/quantity and confirming subsequent invoices reference the updated version
7. Verifying quotation history is preserved (showing all versions)
8. Confirming partial invoicing works (e.g., 50% of Product A, 100% of Product B can be invoiced separately)

This story delivers the MVP for commercial document generation and granular invoicing control.

**Acceptance Scenarios**:

1. **Given** a JobCode with a customer, **When** staff creates a quotation and selects products from the catalog (e.g., "Aluminum bracket," "Steel frame"), **Then** each product appears as a line item where staff can enter quantity and unit price specific to this quotation.

2. **Given** a quotation with multiple products, **When** staff save the quotation, **Then** the system calculates the total per product (quantity × unit price) and the grand total, and stores all line items with their prices for later invoicing.

3. **Given** a quotation is ready for approval, **When** a manager submits it for internal approval, **Then** the quotation status changes to "Pending Approval" and an approval record is created with manager name, date, and time.

4. **Given** a quotation pending approval, **When** an approver reviews and approves it, **Then** the quotation status changes to "Approved", the approver name and timestamp are recorded, and the quotation can be sent to the customer.

4a. **Given** a quotation pending approval, **When** an approver rejects it with mandatory comments, **Then** the quotation status returns to "Draft", the approver's rejection comments are attached and visible to the creator, and the creator must resubmit after addressing the comments.

5. **Given** an approved quotation, **When** staff edits a line item's unit price or quantity (e.g., customer negotiates a discount), **Then** the change is saved as a new quotation version, and subsequent invoices reference this new version without manual re-entry.

6. **Given** a quotation with multiple products, **When** staff request a PDF, **Then** a professional quotation document is generated listing products, quantities, unit prices, line totals, and grand total, ready for download/email.

---

### User Story 3 - Product Catalog Management (Priority: P2)

**Description**: Admin staff create and maintain a pre-defined product catalog used for quotations. Each product has a name, description, and optionally a base unit price (which can be overridden per quotation). Products are searchable and categorized (e.g., "Brackets," "Frames," "Enclosures").

**Why this priority**: A product catalog standardizes what customers can order and speeds quotation creation. However, it's P2 because the MVP can launch with manual product entry first, and add a catalog later.

**Independent Test**: Can be fully tested by:
1. Creating 10–20 products in the catalog with names, descriptions, and optional base prices
2. Categorizing products (e.g., "Sheet Metal," "Custom Components")
3. Searching for a product by name and confirming results are returned
4. Selecting a product in a quotation and confirming base price (if set) is suggested but can be overridden
5. Editing a product's description and confirming new quotations see the updated description
6. Retiring a product and confirming old quotations still reference it, but new ones don't offer it

This story delivers the MVP for product standardization.

**Acceptance Scenarios**:

1. **Given** an admin user, **When** they access the product catalog, **Then** they can create a new product with name, description, category, and optional base unit price.

2. **Given** a product catalog with 20+ products, **When** staff create a quotation and begin selecting products, **Then** they can search by product name and the system returns matching products quickly.

3. **Given** a product with a base unit price in the catalog, **When** staff select it for a quotation, **Then** the base price is suggested but staff can override it with a different unit price for that specific quotation.

4. **Given** a product in the catalog, **When** an admin edits the product description, **Then** new quotations see the updated description, but existing quotations remain unchanged.

---

### User Story 4 - Production Tracking: TaskFlow DAG (Priority: P2) - **UPDATED 2026-01-08**

**Description**: Production staff view and manage tasks for a project using a visual DAG (Directed Acyclic Graph) interface powered by React Flow. Each project has one TaskFlow containing task nodes that can be connected with edges to define dependencies. For each task node, staff record title, assignee, deadline, and progress (0-100%). The visual interface allows drag-and-drop positioning of nodes and connecting nodes with dependency edges. Overdue tasks are highlighted based on deadline.

**Implementation Note (2026-01-08)**: Originally specified as "Work Progress Sheet Per Product" with fixed manufacturing steps. Implemented as TaskFlow (DAG-based task management) which provides more flexibility - arbitrary tasks and dependencies rather than predefined manufacturing step sequences. This better reflects the reality of varied job types and custom workflows.

**Why this priority**: This replaces the Excel work progress sheet and provides real-time visibility into project production status with a flexible, visual task management system. It supports arbitrary task dependencies and parallel processes. However, it's P2 because the MVP can initially launch with basic task tracking before sophisticated filtering is added.

**Independent Test**: Can be fully tested by:
1. Creating a TaskFlow for a project with multiple task nodes
2. For each task node, setting title, assignee, deadline, and updating progress (0-100%)
3. Connecting task nodes with edges to define dependencies
4. Dragging nodes to reposition them in the visual canvas
5. Identifying overdue tasks based on deadline (highlighted in UI)
6. Viewing overall project progress from aggregated node progress
7. Editing task details without losing node positions or connections

This story delivers the MVP for flexible task management, replacing Excel sheets.

**Acceptance Scenarios**:

1. **Given** a project, **When** staff access the production section, **Then** they see a visual TaskFlow canvas where they can add, edit, and connect task nodes.

2. **Given** a TaskFlow for a project, **When** a user adds a new task node, **Then** they can set title, assignee, deadline, and the node appears in the canvas at the specified position.

3. **Given** a task node in the TaskFlow, **When** production staff update the progress to a percentage (e.g., 50%), **Then** the progress bar reflects this and overall project progress is recalculated.

4. **Given** two task nodes, **When** staff connect them with an edge, **Then** the dependency relationship is visualized and persisted, showing the flow of work.

5. **Given** a project with multiple task nodes at different progress levels, **When** management views the project detail, **Then** they see overall project progress aggregated from all node progress percentages.

---

### User Story 5 - Delivery Tracking & Granular Invoicing by Product & Quantity (Priority: P2)

**Description**: Staff record delivery events per product in a JobCode. For each delivery, they specify which products and quantities are being shipped. The system tracks what's been invoiced to prevent double-billing. Transaction statements (거래명세서) and tax invoices are generated with only the shipped products/quantities, reflecting the quotation prices. A "final delivery date" is recorded for reporting compatibility.

**Why this priority**: Granular delivery/invoicing is core to financial accuracy. It enables partial deliveries, split shipments, and staggered invoicing per product. However, it's P2 because the MVP can defer sophisticated split-shipment UI until after basic delivery tracking is proven.

**Independent Test**: Can be fully tested by:
1. Recording a single delivery (all 3 products, full quantities)
2. Recording a split delivery (1st shipment: Product A 100%, Product B 50%, Product C 0%; 2nd shipment: Product B 50%)
3. For each delivery, confirming transaction statements are generated with only shipped products/quantities
4. Attempting to invoice the same product/quantity twice and confirming the system prevents double-billing
5. Updating quotation unit price after 1st delivery and confirming 2nd delivery uses the new price
6. Marking final delivery and confirming it appears in reporting
7. Generating PDF transaction statements for customer delivery

This story delivers the MVP for granular delivery tracking and invoice automation.

**Acceptance Scenarios**:

1. **Given** a JobCode with 3 quoted products (Bracket @ qty 10, Frame @ qty 5, Enclosure @ qty 2), **When** staff record a delivery, **Then** they specify which products and quantities are shipped (e.g., Bracket 10, Frame 0, Enclosure 2 for 1st shipment).

2. **Given** a delivery recorded, **When** staff request a transaction statement, **Then** the document includes only the shipped products/quantities with their unit prices from the quotation, and totals are calculated automatically.

3. **Given** products shipped in 1st delivery, **When** staff attempt to invoice the same products/quantities again in a 2nd delivery, **Then** the system shows a warning that Bracket qty 10 has already been shipped and prompts confirmation.

4. **Given** multiple deliveries for different products in a JobCode, **When** staff view the job detail, **Then** they see a delivery status (e.g., "Bracket delivered 10/10, Frame delivered 0/5, Enclosure delivered 2/2").

5. **Given** the final delivery is recorded, **When** staff mark it as "Final Delivery", **Then** the final delivery date is recorded and appears in reporting dashboards.

---

### User Story 6 - Tax Invoices & Payments with Granular Product/Quantity Tracking (Priority: P2)

**Description**: Finance staff create tax invoices (sales and purchase) tied to deliveries. Each sales tax invoice lists the products and quantities delivered (auto-populated from the delivery), with unit prices from the quotation. Staff record one or more payments (deposits or disbursements) per invoice. The system calculates remaining receivable/payable automatically. Outstanding AR/AP is tracked per product-quantity delivered to prevent discrepancies. Views aggregate sales/purchases and outstanding AR/AP by customer, supplier, date range, and internal owner.

**Why this priority**: AR/AP management is core to financial visibility and compliance. However, it's P2 because quotation and delivery tracking can launch first, with detailed invoicing added once the commercial document flow is proven.

**Independent Test**: Can be fully tested by:
1. Creating a sales tax invoice for a delivery (auto-populated with shipped products/quantities)
2. Recording a partial payment (deposit) and confirming remaining receivable is calculated
3. Recording additional payments until invoice is fully paid
4. Viewing outstanding AR by customer, with aging (30/60/90+ days)
5. Creating a purchase tax invoice and recording partial vendor payments
6. Generating an AR/AP report by customer/supplier showing total and outstanding amounts
7. Filtering AR/AP by internal owner to see workload distribution
8. Confirming that invoiced product/quantities are marked as such to prevent re-invoicing

This story delivers the MVP for financial tracking and reporting.

**Acceptance Scenarios**:

1. **Given** a delivery is recorded with specific products/quantities, **When** finance staff create a sales tax invoice, **Then** the invoice auto-populates with the delivered products, quantities, and unit prices from the quotation.

2. **Given** a sales tax invoice, **When** a customer payment is received, **Then** staff record a deposit (date, amount, payment method) and the system calculates remaining receivable automatically.

3. **Given** a sales tax invoice with multiple partial payments, **When** all payments total the invoice amount, **Then** the invoice status changes to "Paid" and is removed from the outstanding AR view.

4. **Given** multiple sales invoices across different customers, **When** finance staff request an AR report, **Then** the system shows total AR by customer, days overdue (30/60/90+), and internal owner for follow-up.

5. **Given** outstanding AR/AP records, **When** staff request a cash flow view, **Then** the system shows total receivable and payable by month for the next 3 months, supporting cash planning.

6. **Given** a delivery with 3 products partially shipped, **When** an invoice is created for only the shipped portion, **Then** the remaining unshipped products are noted separately for future invoicing.

---

### User Story 7 - Outsourcing Blueprint Attachments (Priority: P3) - **UPDATED 2026-01-08** (TaskFlow integration)

**Description**: When production staff place an outsourcing order (외주) for a task, they can attach blueprint/drawing files (PDF, DXF, DWG, etc.) to the task node in the TaskFlow. These attachments are sent along with the RFQ email to vendors and remain associated with the task node for reference. The system provides simple file management for these attachments - upload, download, and view associated files per task node. CAD file editing is not supported; files are managed and opened with local CAD tools.

**Implementation Note (2026-01-08)**: Originally specified for WorkProgressStep, now integrated with TaskFlow. BlueprintAttachment references the TaskFlow (flow_id) and TaskNode (node_id) rather than WorkProgressStep.

**Why this priority**: Blueprint attachments are essential for outsourcing communication - vendors need drawings to quote accurately. However, it's P3 because outsourcing can initially be tracked manually (via notes field) before file attachment is implemented.

**Independent Test**: Can be fully tested by:
1. Creating a task node in TaskFlow for outsourced work
2. Uploading a blueprint file (PDF or DXF) to the task node
3. Viewing the list of attached files on the task node detail panel
4. Downloading an attached file and confirming it opens correctly in local CAD tools
5. Confirming the RFQ email includes the attached blueprint file
6. Uploading additional files to the same task node

This story delivers the MVP for blueprint attachment to outsourcing orders.

**Acceptance Scenarios**:

1. **Given** a task node in the TaskFlow for outsourced work, **When** staff click "Attach Blueprint", **Then** they can select and upload one or more drawing files (PDF, DXF, DWG, JPG, PNG up to 50MB each).

2. **Given** a task node with attached blueprints, **When** staff view the task node detail panel, **Then** they see a list of attached files with filename, file size, upload date, and download link.

3. **Given** a task node with attached blueprints, **When** staff send an RFQ email to the vendor, **Then** the attached blueprints are included in the email as attachments.

4. **Given** an attached blueprint file, **When** staff click download, **Then** the file downloads and can be opened with local CAD tools (e.g., AutoCAD, DraftSight).

5. **Given** a task node, **When** staff need to add additional drawings after initial upload, **Then** they can upload more files without replacing existing attachments.

---

### User Story 8 - Purchasing & Automated RFQ (Priority: P3)

**Description**: Staff create a purchase request for a JobCode (or general purchase not tied to a JobCode), specifying a material/service category (e.g., "CNC machining," "etching," "painting"). The system suggests suitable vendors based on stored "who sells what" mappings. RFQ emails are auto-generated and sent with JobCode, product info, drawings (if attached), and delivery deadline. Vendor responses, selected vendor, and final purchase price are tracked. Purchase costs are linked to the JobCode for profitability analysis.

**Why this priority**: Automated RFQ reduces manual email creation and ensures consistent vendor communication. However, it's P3 because the MVP can initially support manual purchase order entry before RFQ automation is added.

**Independent Test**: Can be fully tested by:
1. Creating a purchase request for a JobCode with category (e.g., "CNC machining")
2. System suggests 3–5 suitable vendors based on stored mappings
3. Selecting vendors and auto-generating RFQ email with attachments
4. Sending RFQ to vendors and tracking response status
5. Recording vendor quotes and selecting the best vendor
6. Linking the final purchase to the JobCode for cost tracking
7. Viewing all purchases by JobCode with total purchased costs

This story delivers the MVP for vendor management and RFQ tracking.

**Acceptance Scenarios**:

1. **Given** a JobCode with a manufacturing need (e.g., "outsource CNC machining"), **When** staff create a purchase request and specify the service needed, **Then** the system suggests vendors who provide that service based on stored mappings.

2. **Given** a list of suggested vendors, **When** staff select vendors to request quotes from, **Then** an RFQ email is auto-generated with JobCode, product description, drawings (if attached), required quantity, and delivery deadline.

3. **Given** an RFQ sent to multiple vendors, **When** staff track responses, **Then** vendor names, quote prices, and response dates are recorded.

4. **Given** multiple vendor quotes, **When** staff select the winning vendor and final price, **Then** a purchase order is created and the selected vendor and price are recorded.

5. **Given** a completed purchase, **When** staff link it to a JobCode, **Then** the purchase cost is aggregated with other JobCode costs for profitability analysis (sales vs. total cost).

---

### User Story 9 - Role-Based Access Control & Quotation Protection (Priority: P1)

**Description**: The system enforces role-based access control with roles: Admin, Finance, Production, Sales. Only Admin and Finance roles can view all quotations and financial data (invoices, AR/AP). Production staff see only production-relevant data (TaskFlow/task nodes, deliveries, documents tagged for production). Sales staff see quotations and customer data but not financial/payables data. Admin accounts manage users and permissions. Access to sensitive documents (quotations, financial reports) is logged for audit.

**Why this priority**: This is critical for security and compliance. A previous data leak of quotations necessitates strict access control from day one. This must ship with P1.

**Independent Test**: Can be fully tested by:
1. Creating 4 user roles with appropriate permissions
2. Logging in as Production user and verifying quotations are not visible
3. Logging in as Finance user and verifying all quotations and AR/AP are visible
4. Logging in as Sales user and verifying quotations are visible, but AR/AP/invoice details are not
5. Logging in as Admin and verifying user management is accessible
6. Attempting to access a quotation as a Production user and confirming access denied with error message
7. Checking audit log showing who accessed which quotations and when
8. Changing a user's role from Production to Finance and confirming access immediately updates

This story delivers security MVP and must ship with P1.

**Acceptance Scenarios**:

1. **Given** a system with multiple users in different roles, **When** a Production staff member logs in, **Then** they see only production-relevant data (TaskFlow with task nodes, deliveries for their JobCodes, documents tagged for production view) and NOT quotations, pricing, or financial data.

2. **Given** a Sales staff member logged in, **When** they access the quotation list, **Then** they see quotations for customers they manage, along with approval status and PDF download option.

3. **Given** a Finance staff member logged in, **When** they access the quotation list, **Then** they see all quotations for all customers, along with approval history and cost breakdown.

4. **Given** an Admin user, **When** they access the user management page, **Then** they can create, edit, delete users, and assign roles (Admin, Finance, Production, Sales).

5. **Given** a sensitive document like a quotation, **When** any user accesses it, **Then** an audit log entry is created recording user name, date, time, action (view, download, edit), and document ID.

6. **Given** a user's role is changed (e.g., Production → Finance), **When** the change is saved, **Then** the user's access immediately reflects the new role on their next session or page refresh.

---

### Edge Cases

- What happens when a quotation unit price is updated after a partial delivery? (Answer: subsequent deliveries use the new price; past deliveries retain their original prices)
- How does the system handle a project with no task nodes defined? (Answer: system allows creating a TaskFlow but it starts empty; user must manually add task nodes)
- What if a vendor RFQ is sent but no responses are received by the deadline? (Answer: system shows "no response" status; user can manually close or extend the deadline)
- How does the system handle editing a JobCode that is already in production? (Answer: JobCode is always editable, but changes are logged; TaskFlow, vendor commitments, and delivery status are separate from JobCode data)
- What happens if a user uploads a duplicate filename to the same JobCode/product? (Answer: system appends a version suffix and archives the old file, with version history preserved)
- How does the system handle refunds or negative payments? (Answer: system accepts negative amounts as refunds, reducing the receivable/payable balance and adjusting the invoice status)
- What if a delivery is recorded but not yet invoiced? (Answer: delivery is marked as "pending invoice"; the system calculates what remains to be invoiced and prevents double-invoicing)

---

## Requirements *(mandatory)*

### Functional Requirements

**Core JobCode & Project Management**:

- **FR-001**: System MUST auto-generate a unique JobCode per rule WK2{year}-{sequence}-{date} (e.g., WK2K25-0600-1017)
- **FR-002**: System MUST allow JobCode editing after creation while maintaining uniqueness
- **FR-003**: System MUST store customer, project name, requester, internal owner, requested due date in the JobCode record
- **FR-004**: System MUST prevent duplication of JobCode values across all records
- **FR-005**: System MUST maintain a complete JobCode history with creation date, last modified date, and modifier name

**Product Catalog**:

- **FR-006**: System MUST support a pre-defined product catalog with product name, description, and optional base unit price
- **FR-007**: System MUST allow product search by name and category
- **FR-008**: System MUST allow categorizing products (e.g., "Sheet Metal," "Custom Components")
- **FR-009**: System MUST allow retiring/deactivating products while preserving them in past quotations
- **FR-010**: System MUST allow editing product descriptions; new quotations see updated descriptions, old quotations remain unchanged

**Quotation & Approval Workflow**:

- **FR-011**: System MUST support quotation creation by selecting products from the catalog
- **FR-012**: System MUST allow staff to enter quotation-specific quantity and unit price per line item (independent of catalog base price)
- **FR-013**: System MUST calculate line totals (quantity × unit price) and grand total per quotation
- **FR-014**: System MUST support internal approval workflow (승인/결재) with approver name, date, and time recording
- **FR-015**: System MUST preserve all quotation versions and show version history
- **FR-016**: System MUST generate PDF quotations with professional formatting ready for customer delivery
- **FR-017**: System MUST track quotation status (Draft, Pending Approval, Approved, Sent, Accepted, Rejected) and allow rejection with mandatory approver comments that return quotation to Draft
- **FR-018**: System MUST store and display approver rejection comments visibly to the quotation creator for reference when revising
- **FR-018a**: System MUST track which quotation version was sent to the customer with send date/time
- **FR-018b**: System MUST allow Admin to revise a "Sent" quotation, creating a new version automatically while preserving previous versions in history
- **FR-018c**: System MUST provide Admin with option to email customer notification of quotation revision (Admin chooses whether to send automatic notification or manual follow-up required)

**Production Tracking with TaskFlow** *(UPDATED 2026-01-08)*:

- **FR-019**: System MUST provide a visual TaskFlow (DAG-based task management) per project for production tracking
- **FR-020**: System MUST allow creating task nodes with title, assignee, deadline, and progress (0-100%) in the TaskFlow
- **FR-021**: System MUST allow connecting task nodes with edges to define dependencies between tasks
- **FR-022**: System MUST allow recording progress (0-100%), deadline, and assignee per task node
- **FR-023**: System MUST support task nodes for outsourced work (allowing blueprint attachment and vendor association)
- **FR-024**: System MUST allow deleting or archiving task nodes that are no longer needed
- **FR-025**: System MUST support parallel task execution (multiple task nodes can be in progress simultaneously)
- **FR-026**: System MUST show aggregated production progress on project detail view (calculated from task node progress percentages)
- **FR-027**: System MUST preserve task history and allow editing task details without losing node positions or connections

**Delivery Tracking & Granular Invoicing**:

- **FR-028**: System MUST support recording deliveries specifying which products and quantities are shipped per JobCode
- **FR-029**: System MUST track what has been invoiced per product-quantity to prevent double-billing
- **FR-030**: System MUST auto-generate transaction statements (거래명세서) with only shipped products/quantities, reflecting quotation unit prices
- **FR-031**: System MUST support single and split deliveries (1st, 2nd, … shipments)
- **FR-032**: System MUST allow recording a final delivery date for reporting compatibility
- **FR-033**: System MUST generate PDF transaction statements ready for customer delivery
- **FR-034**: System MUST show delivery status on job detail (e.g., "Product A 10/10 shipped, Product B 2/5 shipped")

**Tax Invoices & Payments**:

- **FR-035**: System MUST support creating sales tax invoices tied to deliveries (auto-populated with delivered products/quantities)
- **FR-036**: System MUST support creating purchase tax invoices (vendor, amount, JobCode reference if applicable)
- **FR-037**: System MUST support recording one or more payments (deposits/disbursements) per invoice with date, amount, payment method
- **FR-038**: System MUST auto-calculate remaining receivable/payable after each payment
- **FR-039**: System MUST support negative payments (refunds) for AR/AP records
- **FR-040**: System MUST track invoice status (draft, issued, partially paid, paid, overdue)
- **FR-041**: System MUST provide AR/AP reports by customer, supplier, date range, and internal owner
- **FR-042**: System MUST provide cash flow forecasting (receivable/payable by month for next 3 months)
- **FR-043**: System MUST aggregate sales and purchases by period (monthly, quarterly, yearly)

**Outsourcing Blueprint Attachments** *(UPDATED 2026-01-08)*:

- **FR-044**: System MUST support uploading blueprint/drawing files (PDF, DXF, DWG, JPG, PNG) to task nodes in TaskFlow
- **FR-045**: System MUST store uploaded files with metadata linking them to the specific TaskFlow and task node
- **FR-046**: System MUST allow multiple file attachments per task node (not limited to one file)
- **FR-047**: System MUST display attached files on task node detail panel with filename, file size, upload date, and download link
- **FR-048**: System MUST include attached blueprint files as email attachments when sending RFQ to vendor
- **FR-049**: System MUST allow direct file download for opening in local CAD tools (no web-based CAD editing)
- **FR-050**: System MUST support file size limits (max 50MB per file)
- **FR-051**: System MUST allow adding additional files to a task node without replacing existing attachments

**Purchasing & RFQ**:

- **FR-052**: System MUST support creating purchase requests from a JobCode or as general (non-JobCode) purchases
- **FR-053**: System MUST store a "who sells what" mapping of vendors to service categories (machining, etching, painting, etc.)
- **FR-054**: System MUST suggest suitable vendors based on the purchase request category
- **FR-055**: System MUST auto-generate RFQ emails with JobCode, product description, drawings (if attached), and delivery deadline
- **FR-056**: System MUST track RFQ status (draft, sent, responded, no response, closed) per vendor
- **FR-057**: System MUST allow recording vendor quotes and selecting final vendor/price
- **FR-058**: System MUST link purchases to JobCodes for cost aggregation and profitability analysis
- **FR-059**: System MUST show all purchases per JobCode with total purchase costs

**Role-Based Access Control**:

- **FR-060**: System MUST enforce role-based access control with roles: Admin, Finance, Production, Sales
- **FR-061**: System MUST restrict quotation EDITING to Admin and Finance roles only
- **FR-062**: System MUST allow Sales role READ-ONLY access to quotations they created and approved quotations for their assigned customers
- **FR-063**: System MUST restrict financial data (AR/AP, invoices, purchase prices) to Admin and Finance roles
- **FR-064**: System MUST allow Admin to assign Production staff visibility scope: by JobCode, by manufacturing department/step, or full plant visibility
- **FR-065**: System MUST restrict production data (TaskFlow/task nodes, deliveries, tagged documents) visibility per assigned scope for Production staff
- **FR-066**: System MUST allow Admin to manage users and assign roles and visibility scopes
- **FR-067**: System MUST maintain an audit log of access to sensitive documents (quotations, financial reports) with user name, date, time, and action
- **FR-068**: System MUST apply role and visibility scope changes immediately on the user's next session refresh

---

### Key Entities

- **JobCode**: Unique human-readable identifier (WK2{year}-{sequence}-{date}), customer reference, project name, internal owner, requested due date, status, created date, last updated date. Primary key is a database ID (not the JobCode string).

- **Product**: Name, description, category, optional base unit price, active flag, created date. Used in quotations.

- **Product Type**: Name (e.g., "Sheet Metal", "Custom Component"). Used for product categorization.

- **Quotation**: JobCode reference, line items (product reference, quantity, unit price, total per line), total amount, approval status, approver name, approval date/time, version number, created date, last updated date, status (Draft/Pending/Approved/Sent/Accepted/Rejected).

- **Quotation Line Item**: Quotation reference, product reference, quantity, unit price (quotation-specific, may differ from catalog base price), line total.

- **TaskFlow** *(UPDATED 2026-01-08)*: Project reference (unique - one per project), nodes collection, edges collection, created date, last updated date. Aggregate root for DAG-based task management.

- **TaskNode** *(UPDATED 2026-01-08)*: NodeId (UUID for React Flow), title, assignee, deadline, progress (0-100%), positionX, positionY. Value object embedded in TaskFlow. Tracks individual task progress within a project.

- **TaskEdge** *(UPDATED 2026-01-08)*: EdgeId (UUID), sourceNodeId, targetNodeId. Value object embedded in TaskFlow. Represents dependency relationship between two task nodes.

- **Delivery**: JobCode reference, delivery date, delivery number (1st, 2nd, etc.), final delivery flag, created date.

- **Delivery Line Item**: Delivery reference, product reference, quantity shipped, unit price (from quotation at time of delivery), line total.

- **Transaction Statement**: JobCode reference, delivery reference, customer info (from JobCode), items (product, quantity, unit price), total amount, document type (거래명세서), created date.

- **Tax Invoice**: Type (sales/purchase), JobCode reference (if applicable), customer/supplier reference, invoice date, amount, status (draft/issued/partially paid/paid/overdue), created date, last updated date.

- **Invoice Line Item**: Tax invoice reference, product reference (if applicable), quantity, unit price (from quotation at time of invoice), line total. Tracks what's been invoiced to prevent double-billing.

- **Payment**: Tax invoice reference, payment date, amount, payment method, remarks, created date.

- **Blueprint Attachment** *(UPDATED 2026-01-08)*: File name, file type (PDF, DXF, DWG, JPG, PNG), file size, storage path, TaskFlow reference (flow_id), TaskNode reference (node_id), upload date, uploader name. Used to attach drawings to task nodes for outsourcing communication.

- **Customer/Company**: Company name, site/location, department, contact person, phone, email, billing address, payment terms.

- **Supplier/Vendor**: Company name, site/location, contact person, phone, email, service categories (machining, etching, painting, etc.), billing address, payment terms.

- **Purchase Request**: JobCode reference (if applicable), category/service needed, status (draft, RFQ sent, responded, vendor selected, closed), created date, last updated date.

- **RFQ**: Purchase request reference, vendor reference, RFQ email sent date, response status (sent, responded, no response, closed), vendor quote amount (if responded), notes, created date, last updated date.

- **Purchase Order**: RFQ reference (if applicable), vendor reference, JobCode reference (if applicable), item description, quantity, unit price, total, delivery date, status (ordered, received, partial, invoiced), created date, last updated date.

- **User**: User name, email, password (hashed), role (Admin, Finance, Production, Sales), active flag, created date, last login date.

- **Audit Log**: User reference, document/entity accessed (e.g., "Quotation-ID-123"), action (view, download, edit, approve, delete), timestamp, IP address (optional), notes.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can create a JobCode and enter project data in under 2 minutes, with automatic JobCode generation and no re-entry needed in quotations or production workflows.

- **SC-002**: Quotations are created from a JobCode by selecting catalog products and entering quantities/prices in under 5 minutes. Quotation PDFs are generated and downloadable within 10 seconds.

- **SC-003**: Production staff can update task progress (percentage, deadline, assignee) for any task node in TaskFlow in under 1 minute per update. The updated progress is visible on the project detail view within 5 seconds.

- **SC-004**: A delivery is recorded with shipped products/quantities in under 3 minutes. Transaction statements are generated automatically within 10 seconds without manual re-entry of customer, product, or price data.

- **SC-005**: Document uploads complete in under 30 seconds for files up to 100MB. Document search by JobCode/product/customer/document type returns results in under 3 seconds across 10,000+ documents.

- **SC-006**: Sales/purchases can be aggregated and AR/AP reports can be generated (by customer, date range, internal owner, aging) in under 5 seconds. Cash flow forecasting is available with a single button click.

- **SC-007**: Role-based access control prevents unauthorized access to quotations and financial data. Audit logs record 100% of sensitive document accesses within 1 second of access.

- **SC-008**: The system handles concurrent access by 10+ users without data loss or corruption. JobCode uniqueness is maintained even with simultaneous creation attempts.

- **SC-009**: Vendor RFQ emails are auto-generated and sent within 30 seconds. Vendor response tracking and purchase order creation complete in under 3 minutes.

- **SC-010**: Management sees real-time visibility: project status (TaskFlow progress % aggregated from task nodes), on-time delivery %, sales by month, outstanding AR/AP aging (30/60/90+ days), and project profitability (quotation vs. cost) all within 5 seconds of opening the dashboard.

- **SC-011**: Partial/split deliveries and granular invoicing work correctly—the system prevents double-invoicing of the same product-quantity combination and allows invoicing any subset of products independently.

- **SC-012**: 90% of users successfully create and approve a quotation on their first attempt without support; production staff successfully record delivery and generate transaction statements independently.

---

## Assumptions

- **Data Volume**: Expected medium volume of 500–1000 JobCodes created per month. System should support at least 12 months of operational data (6,000–12,000 JobCodes) at launch with scalability to 24+ months. Each JobCode may have 1–5 quoted products; 5–20 task nodes per project TaskFlow; 1–4 deliveries per JobCode; multiple quotation versions per JobCode.

- **Database**: System uses a relational database (SQL-based) with foreign key relationships between JobCode, products, quotations, deliveries, invoices, and payments. Database should support ACID transactions for quotation approval and payment recording.

- **Product Catalog**: Products are created and maintained by admin users. Initial product data is manually entered or bulk-imported from existing systems. Catalog expected to contain 50–200 products at launch.

- **Document Storage**: Files are stored on a centralized server (S3, local file system, or cloud storage) with metadata in the database. No web-based CAD editing is implemented.

- **Email Integration**: Automated RFQ emails are sent via SMTP or external email service (SendGrid, AWS SES). Customer and vendor email addresses are stored in the system.

- **PDF Generation**: Quotations and transaction statements use server-side or cloud PDF generation with professional templates.

- **Authentication**: Session-based login (username/password). Passwords are hashed using industry-standard algorithms (bcrypt, Argon2).

- **Audit Logging**: All access to sensitive documents is logged. Audit logs are immutable and retained for at least 1 year.

- **Localization**: System supports Korean language for customer-facing documents (quotations, transaction statements, tax invoices). English UI is acceptable initially.

- **Time Zone**: All timestamps stored in UTC, displayed in user's local time (Korea Standard Time - KST).

- **Reporting**: Management dashboards are read-only for non-admin users. Excel export of financial data available to Finance and Admin roles.

- **Integration with Hometax/Bizform**: Manual entry and reconciliation expected in MVP. Data import/export to Excel files is out of scope for phase 1.

- **Mobile Support**: MVP focuses on web application (desktop/tablet). Mobile app is out of scope.

- **CAD Support**: No web-based CAD editing or viewing. Files are managed and opened with local CAD tools.

---

## Dependencies & Constraints

- **Customer data must pre-exist**: Customers and suppliers should be pre-loaded or manually entered before creating quotations. Bulk import is out of scope for MVP.

- **JobCode uniqueness**: JobCode values must be unique across all records. Sequence number generation must be atomic to prevent duplicates in high-concurrency scenarios.

- **TaskFlow flexibility**: TaskFlow provides flexible task management without predefined templates. Production staff can create task nodes as needed per project. System supports manual customization per JobCode.

- **Quotation-to-invoice traceability**: All invoices must link to a quotation line item to prevent discrepancies. System must prevent invoicing products/quantities not in the quotation.

- **Double-billing prevention**: System must track what has been invoiced and prevent invoicing the same product-quantity combination twice.

- **File storage capacity**: Central document storage must support at least 100GB and be scalable to 1TB+.

- **Audit log retention**: Audit logs must be immutable and retained for at least 1 year.

- **Concurrent access**: System must support 10+ concurrent users without data loss or performance degradation.

---
