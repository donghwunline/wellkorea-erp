# Company Domain Model

## Overview

This document describes the domain model for companies, products, and procurement in the WellKorea ERP system. The unified company model supports multiple roles (Customer, Vendor, Outsourcing Partner) through a role-based design pattern.

### Key Concepts

- **Company**: A unified entity that can play multiple roles (customer, vendor, outsource partner)
- **Company Role**: Defines the specific role a company plays with role-specific attributes
- **Product**: Items sold to customers with pricing and categorization
- **Service Category**: Categories of outsourced services (CNC, painting, etc.)
- **Vendor Offering**: A vendor's specific service with pricing and lead times
- **Purchase Request / RFQ**: Request for quotation workflow for procurement

### Design Decisions

1. **Unified Company Model**: Instead of separate Customer, Vendor, and Outsourcing Partner tables, we use a single `COMPANY` table with a `COMPANY_ROLE` junction table. This allows:
   - A single company to be both a customer and a vendor
   - Centralized contact information management
   - Simplified reporting and analytics

2. **Role-Specific Attributes**: Each role type has specific attributes (e.g., `credit_limit` for customers, `lead_time_days` for vendor offerings)

3. **Service Catalog**: Vendor service offerings are linked to standardized service categories, enabling comparison and procurement workflows

## Domain Diagram

```mermaid
erDiagram
%% === 거래처 통합 ===
    COMPANY {
        bigint id PK
        string name
        string registration_number UK "사업자등록번호"
        string representative "대표자명"
        string business_type "업태"
        string business_category "업종"
        string contact_person
        string phone
        string email
        text address
        string bank_account
        boolean is_active
        timestamp created_at
    }

    COMPANY_ROLE {
        bigint id PK
        bigint company_id FK
        string role_type "CUSTOMER|VENDOR|OUTSOURCE"
        decimal credit_limit
        int default_payment_days
        timestamp created_at
    }

%% === 판매 품목 (기존 Product 유지) ===
    PRODUCT {
        bigint id PK
        string sku UK
        string name
        text description
        bigint product_type_id FK
        decimal base_unit_price
        string unit
        boolean is_active
        timestamp created_at
    }

    PRODUCT_TYPE {
        bigint id PK
        string name
        text description
    }

%% === 구매/외주 서비스 카테고리 ===
    SERVICE_CATEGORY {
        bigint id PK
        string name "CNC, etching, painting..."
        text description
        boolean is_active
        timestamp created_at
    }

    VENDOR_SERVICE_OFFERING {
        bigint id PK
        bigint vendor_company_id FK
        bigint service_category_id FK
        string vendor_service_code "업체측 서비스 코드"
        decimal unit_price
        string currency
        int lead_time_days
        int min_order_qty
        date effective_from
        date effective_to
        boolean is_preferred
        timestamp created_at
    }

%% === 프로젝트 (기존 유지) ===
    PROJECT {
        bigint id PK
        string job_code UK
        bigint customer_company_id FK
        string project_name
        string requester_name
        date due_date
        bigint internal_owner_id FK
        string status
        timestamp created_at
    }

%% === 구매 요청 (기존 RFQ 확장) ===
    PURCHASE_REQUEST {
        bigint id PK
        bigint project_id FK "nullable - 프로젝트 연계 또는 일반 구매"
        bigint service_category_id FK
        string description
        decimal quantity
        string uom
        date required_date
        string status "DRAFT|RFQ_SENT|VENDOR_SELECTED|CLOSED"
        bigint created_by_id FK
        timestamp created_at
    }

    RFQ_ITEM {
        bigint id PK
        bigint purchase_request_id FK
        bigint vendor_company_id FK
        bigint vendor_offering_id FK "nullable - 카탈로그 참조"
        string status "SENT|REPLIED|NO_RESPONSE|SELECTED"
        decimal quoted_price
        int quoted_lead_time
        text notes
        timestamp sent_at
        timestamp replied_at
    }

    PURCHASE_ORDER {
        bigint id PK
        bigint rfq_item_id FK "선정된 RFQ 항목"
        bigint project_id FK "nullable"
        bigint vendor_company_id FK
        string po_number UK
        decimal total_amount
        date expected_delivery
        string status "DRAFT|SENT|CONFIRMED|RECEIVED|CANCELED"
        timestamp created_at
    }

%% === 관계 ===
    COMPANY ||--o{ COMPANY_ROLE : has
    COMPANY ||--o{ PROJECT : "customer_of"
    COMPANY ||--o{ VENDOR_SERVICE_OFFERING : "offers_service"
    SERVICE_CATEGORY ||--o{ VENDOR_SERVICE_OFFERING : "offered_as"

    PROJECT ||--o{ PURCHASE_REQUEST : has
    SERVICE_CATEGORY ||--o{ PURCHASE_REQUEST : "requests"
    PURCHASE_REQUEST ||--o{ RFQ_ITEM : has
    COMPANY ||--o{ RFQ_ITEM : "receives_rfq"
    VENDOR_SERVICE_OFFERING ||--o{ RFQ_ITEM : "references"

    RFQ_ITEM ||--o| PURCHASE_ORDER : "becomes"
    COMPANY ||--o{ PURCHASE_ORDER : "vendor_of"
    PROJECT ||--o{ PURCHASE_ORDER : has

    PRODUCT_TYPE ||--o{ PRODUCT : has
```
