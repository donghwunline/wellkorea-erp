/**
 * Company List Page
 *
 * Main page for viewing and managing companies.
 * Features role-based filtering via tabs (All, Customer, Vendor, Outsource).
 *
 * FSD Layer: pages
 * - Composes widgets, features, entities, and shared components
 * - Uses useQuery directly with entity query factory
 */

import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Alert,
  Button,
  Card,
  Icon,
  PageHeader,
  Pagination,
  SearchBar,
  Spinner,
  Tab,
  TabList,
  Tabs,
} from '@/shared/ui';
import { usePaginatedSearch } from '@/shared/lib/pagination';

// Entity imports (FSD)
import {
  type CompanyListItem,
  companyQueries,
  CompanyTable,
  type RoleType,
} from '@/entities/company';

type RoleFilter = RoleType | 'ALL';

export function CompanyListPage() {
  const { t } = useTranslation('companies');
  const { t: tCommon } = useTranslation('common');
  const navigate = useNavigate();

  // Role tabs using i18n
  const ROLE_TABS: { id: RoleFilter; label: string }[] = [
    { id: 'ALL', label: t('filters.all') },
    { id: 'CUSTOMER', label: t('roleType.CUSTOMER') },
    { id: 'VENDOR', label: t('roleType.VENDOR') },
    { id: 'OUTSOURCE', label: t('roleType.OUTSOURCE') },
  ];

  // Page UI State - pagination and search
  const {
    page,
    setPage,
    search,
    searchInput,
    handleSearchChange,
    handleSearchSubmit,
    handleClearSearch,
  } = usePaginatedSearch();

  // Local UI State - Role filter and error message
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('ALL');
  const [error, setError] = useState<string | null>(null);

  // Server State - Company list via TanStack Query
  const {
    data: companiesData,
    isLoading,
    error: queryError,
  } = useQuery(
    companyQueries.list({
      page,
      size: 10,
      search,
      roleType: roleFilter === 'ALL' ? null : roleFilter,
    })
  );

  // Navigation handlers
  const handleCreate = useCallback(() => {
    navigate('/companies/new');
  }, [navigate]);

  const handleRowClick = useCallback(
    (company: CompanyListItem) => {
      navigate(`/companies/${company.id}`);
    },
    [navigate]
  );

  // Handle tab change - reset page to 0 when switching tabs
  const handleTabChange = useCallback(
    (tabId: string) => {
      setRoleFilter(tabId as RoleFilter);
      setPage(0);
    },
    [setPage]
  );

  // Render actions for table rows
  const renderActions = useCallback(
    (company: CompanyListItem) => (
      <>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/companies/${company.id}`)}
          aria-label={t('actions.view')}
        >
          <Icon name="eye" className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/companies/${company.id}/edit`)}
          aria-label={t('actions.edit')}
        >
          <Icon name="pencil" className="h-4 w-4" />
        </Button>
      </>
    ),
    [navigate, t]
  );

  const companies = companiesData?.data ?? [];
  const pagination = companiesData?.pagination;

  return (
    <div className="min-h-screen bg-steel-950 p-8">
      {/* Header */}
      <PageHeader>
        <PageHeader.Title
          title={t('title')}
          description={t('description')}
        />
        <PageHeader.Actions>
          <Button onClick={handleCreate}>
            <Icon name="plus" className="h-5 w-5" />
            {t('list.new')}
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
          placeholder={t('list.searchPlaceholder')}
          className="flex-1"
          onKeyDown={e => e.key === 'Enter' && handleSearchSubmit()}
        />
        <Button variant="secondary" onClick={handleSearchSubmit}>
          {tCommon('buttons.search')}
        </Button>
      </div>

      {/* Error Message */}
      {(error || queryError) && (
        <Alert variant="error" className="mb-6" onClose={() => setError(null)}>
          {error || queryError?.message || t('list.loadError')}
        </Alert>
      )}

      {/* Loading State */}
      {isLoading ? (
        <Card className="p-12 text-center">
          <Spinner className="mx-auto h-8 w-8" />
          <p className="mt-4 text-steel-400">{t('list.loading')}</p>
        </Card>
      ) : (
        <>
          {/* Company Table (dumb component) */}
          <CompanyTable
            companies={companies}
            onRowClick={handleRowClick}
            renderActions={renderActions}
            emptyMessage={
              search
                ? t('list.emptySearch', { search })
                : roleFilter !== 'ALL'
                  ? t('list.emptyFiltered', { type: t(`roleType.${roleFilter}`) })
                  : t('list.empty')
            }
          />

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="mt-6">
              <Pagination
                currentPage={page}
                totalItems={pagination.totalElements}
                itemsPerPage={pagination.size}
                onPageChange={setPage}
                isFirst={pagination.first}
                isLast={pagination.last}
                itemLabel="companies"
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
