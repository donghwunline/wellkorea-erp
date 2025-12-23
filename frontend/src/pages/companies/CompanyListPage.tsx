/**
 * Company List Page
 *
 * Main page for viewing and managing companies.
 * Features role-based filtering via tabs (All, Customer, Vendor, Outsource).
 *
 * Pure composition layer following Constitution Principle VI:
 * - Composes feature components and UI components
 * - No direct service calls (feature components own their service calls)
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Button,
  Icon,
  PageHeader,
  SearchBar,
  Tabs,
  TabList,
  Tab,
} from '@/components/ui';
import { CompanyTable } from '@/components/features/companies';
import { usePaginatedSearch } from '@/shared/hooks';
import type { RoleType } from '@/services';
import { ROLE_TYPE_LABELS } from '@/services';

type RoleFilter = RoleType | 'ALL';

const ROLE_TABS: { id: RoleFilter; label: string }[] = [
  { id: 'ALL', label: '전체' },
  { id: 'CUSTOMER', label: ROLE_TYPE_LABELS.CUSTOMER },
  { id: 'VENDOR', label: ROLE_TYPE_LABELS.VENDOR },
  { id: 'OUTSOURCE', label: ROLE_TYPE_LABELS.OUTSOURCE },
];

export function CompanyListPage() {
  const navigate = useNavigate();

  // Page UI State (Tier 2) - pagination and search
  const {
    page,
    setPage,
    search,
    searchInput,
    handleSearchChange,
    handleSearchSubmit,
    handleClearSearch,
  } = usePaginatedSearch();

  // Local UI State (Tier 1) - Role filter and error message
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('ALL');
  const [error, setError] = useState<string | null>(null);

  // Navigation handlers
  const handleCreate = () => {
    navigate('/companies/new');
  };

  const handleView = (company: { id: number }) => {
    navigate(`/companies/${company.id}`);
  };

  const handleEdit = (company: { id: number }) => {
    navigate(`/companies/${company.id}/edit`);
  };

  // Handle tab change - reset page to 0 when switching tabs
  const handleTabChange = (tabId: string) => {
    setRoleFilter(tabId as RoleFilter);
    setPage(0);
  };

  return (
    <div className="min-h-screen bg-steel-950 p-8">
      {/* Header */}
      <PageHeader>
        <PageHeader.Title
          title="Companies"
          description="Manage customers, vendors, and outsource partners"
        />
        <PageHeader.Actions>
          <Button onClick={handleCreate}>
            <Icon name="plus" className="h-5 w-5" />
            New Company
          </Button>
        </PageHeader.Actions>
      </PageHeader>

      {/* Role Filter Tabs */}
      <Tabs defaultTab="ALL" onTabChange={handleTabChange}>
        <TabList className="mb-6">
          {ROLE_TABS.map(tab => (
            <Tab key={tab.id} id={tab.id}>
              {tab.label}
            </Tab>
          ))}
        </TabList>
      </Tabs>

      {/* Search Bar */}
      <div className="mb-6 flex gap-3">
        <SearchBar
          value={searchInput}
          onValueChange={handleSearchChange}
          onClear={handleClearSearch}
          placeholder="Search by company name, email, or registration number..."
          className="flex-1"
          onKeyDown={e => e.key === 'Enter' && handleSearchSubmit()}
        />
        <Button variant="secondary" onClick={handleSearchSubmit}>
          Search
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <Alert variant="error" className="mb-6" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Company Table (handles data fetching) */}
      <CompanyTable
        page={page}
        search={search}
        roleType={roleFilter === 'ALL' ? undefined : roleFilter}
        onPageChange={setPage}
        onView={handleView}
        onEdit={handleEdit}
        onError={setError}
      />
    </div>
  );
}
