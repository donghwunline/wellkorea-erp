/**
 * Project View Page (Hub Page)
 *
 * Unified project view with horizontal tabs for different sections.
 * Displays project details, KPI strip, and tabbed navigation.
 *
 * Route: /projects/:id
 *
 * 4-Tier State Separation:
 * - Tier 1 (Local UI State): Modal confirmations (handled by child components)
 * - Tier 2 (Page UI State): Tab state via URL hash
 * - Tier 3 (Server State): Delegated to feature components (KPI, tabs)
 * - Tier 4 (App Global State): Auth via useAuth for role-based tabs
 *
 * Layout:
 * ┌──────────────────────────────────────────────────┐
 * │ PageHeader (Project Name, JobCode, Back Button) │
 * ├──────────────────────────────────────────────────┤
 * │ ProjectDetailsCard (Collapsible project info)   │
 * ├──────────────────────────────────────────────────┤
 * │ KPI Strip (진행률, 결재대기, 문서누락, 미수금)    │
 * ├──────────────────────────────────────────────────┤
 * │ Tabs: [개요] [견적] [공정] [외주] [출고] [문서] [정산] │
 * ├──────────────────────────────────────────────────┤
 * │ Tab Content Area                                 │
 * └──────────────────────────────────────────────────┘
 */

import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { ProjectSection } from '@/entities/project';
import {
  ProjectDetailsCard,
  ProjectKPIStrip,
  ProjectKPIStripSkeleton,
  projectQueries,
} from '@/entities/project';
import { useAuth } from '@/entities/auth';
import type { RoleName } from '@/entities/user';
import { Alert, Card, Icon, PageHeader, Spinner, Tab, TabList, TabPanel, Tabs } from '@/shared/ui';
import {
  DeliveryPanel,
  DocumentPanel,
  InvoicePanel,
  OutsourcePanel,
  PurchasePanel,
  QuotationPanel,
  TaskFlowPanel,
} from '@/widgets';

// Tab ID includes 'overview' (landing tab) + all project sections
type TabId = 'overview' | ProjectSection;

// Tab configuration with role requirements
interface TabConfig {
  id: TabId;
  /** Translation key for tab label (under pages:projectView.tabs.*) */
  labelKey: string;
  /** Required roles (if undefined, visible to all) */
  requiredRoles?: RoleName[];
}

const ALL_TABS: readonly TabConfig[] = [
  // { id: 'overview', labelKey: 'overview' },
  { id: 'quotation', labelKey: 'quotation', requiredRoles: ['ROLE_ADMIN', 'ROLE_FINANCE', 'ROLE_SALES'] },
  { id: 'process', labelKey: 'process' },
  { id: 'purchase', labelKey: 'purchase' },
  { id: 'outsource', labelKey: 'outsource' },
  { id: 'documents', labelKey: 'documents' },
  { id: 'delivery', labelKey: 'delivery' },
  { id: 'finance', labelKey: 'finance', requiredRoles: ['ROLE_ADMIN', 'ROLE_FINANCE'] },
];

export function ProjectViewPage() {
  const { t } = useTranslation('pages');
  const { id } = useParams<{ id: string }>();
  const projectId = id ? Number.parseInt(id, 10) : 0;
  const navigate = useNavigate();
  const { hasAnyRole } = useAuth();

  // Fetch project using Query Factory
  const {
    data: project,
    isLoading: isProjectLoading,
    error: queryError,
  } = useQuery({
    ...projectQueries.detail(projectId),
    enabled: projectId > 0,
  });

  const projectError = queryError?.message ?? null;

  const queryClient = useQueryClient();

  // Get KPIs for the KPI strip
  const { data: kpis, isLoading: isKpisLoading } = useQuery({
    ...projectQueries.kpi(projectId),
    enabled: !!project,
  });

  // Get summary for badge counts
  const { data: summary } = useQuery({
    ...projectQueries.summary(projectId),
    enabled: !!project,
  });

  // Refresh KPIs when data changes (e.g., after creating quotation)
  const triggerKpiRefresh = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: projectQueries.kpis() });
  }, [queryClient]);

  // Filter tabs based on user roles
  const visibleTabs = useMemo(() => {
    return ALL_TABS.filter(tab => {
      if (!tab.requiredRoles) return true;
      return hasAnyRole(tab.requiredRoles);
    });
  }, [hasAnyRole]);

  // Get badge count for a tab
  const getBadgeCount = useCallback(
    (tabId: string) => {
      if (!summary) return undefined;
      const section = summary.sections.find(s => s.section === tabId);
      return section?.totalCount && section.totalCount > 0 ? section.totalCount : undefined;
    },
    [summary]
  );

  // Navigation handlers
  const handleBack = () => navigate('/projects');
  const handleEdit = () => navigate(`/projects/${id}/edit`);

  // Handle section card click (switch to that tab via URL hash)
  // const handleSectionClick = useCallback((section: ProjectSection) => {
  //   globalThis.location.hash = section;
  // }, []);

  // Loading state
  if (isProjectLoading) {
    return (
      <div className="min-h-screen bg-steel-950 p-8">
        <PageHeader>
          <PageHeader.Title title={t('projectView.loading')} />
        </PageHeader>
        <Card className="mx-auto max-w-6xl">
          <div className="flex items-center justify-center p-12">
            <Spinner size="lg" label={t('projectView.loadingProject')} />
            <span className="ml-3 text-steel-400">{t('projectView.loading')}</span>
          </div>
        </Card>
      </div>
    );
  }

  // Error state
  if (projectError) {
    return (
      <div className="min-h-screen bg-steel-950 p-8">
        <PageHeader>
          <PageHeader.Title title={t('projectView.error')} />
          <PageHeader.Actions>
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-steel-400 transition-colors hover:text-white"
            >
              <Icon name="arrow-left" className="h-5 w-5" />
              {t('projectView.backToProjects')}
            </button>
          </PageHeader.Actions>
        </PageHeader>
        <Alert variant="error" className="mx-auto max-w-6xl">
          {projectError}
        </Alert>
      </div>
    );
  }

  // Not found state
  if (!project) {
    return (
      <div className="min-h-screen bg-steel-950 p-8">
        <PageHeader>
          <PageHeader.Title title={t('projectView.notFound')} />
          <PageHeader.Actions>
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-steel-400 transition-colors hover:text-white"
            >
              <Icon name="arrow-left" className="h-5 w-5" />
              {t('projectView.backToProjects')}
            </button>
          </PageHeader.Actions>
        </PageHeader>
        <Alert variant="warning" className="mx-auto max-w-6xl">
          {t('projectView.notFoundMessage')}
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-steel-950 p-8">
      {/* Header */}
      <PageHeader>
        <PageHeader.Title
          title={project.projectName}
          description={`Job Code: ${project.jobCode}`}
        />
        <PageHeader.Actions>
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-steel-400 transition-colors hover:text-white"
          >
            <Icon name="arrow-left" className="h-5 w-5" />
            {t('projectView.backToProjects')}
          </button>
        </PageHeader.Actions>
      </PageHeader>

      {/* Main Content */}
      <div className="mx-auto max-w-6xl">
        {/* Project Details Card */}
        <ProjectDetailsCard
          project={project}
          customerName={project.customerName ?? undefined}
          internalOwnerName={project.internalOwnerName ?? undefined}
          createdByName={project.createdByName ?? undefined}
          onEdit={handleEdit}
        />

        {/* KPI Strip */}
        {isKpisLoading && <ProjectKPIStripSkeleton className="mt-6" />}
        {kpis && <ProjectKPIStrip kpis={kpis} className="mt-6" />}

        {/* Tabbed Navigation */}
        <Tabs defaultTab="quotation" hash={true}>
          <TabList className="mt-6">
            {visibleTabs.map(tab => (
              <Tab key={tab.id} id={tab.id} badge={getBadgeCount(tab.id)} badgeVariant="warning">
                {t(`projectView.tabs.${tab.labelKey}`)}
              </Tab>
            ))}
          </TabList>

          {/* Overview Tab */}
          {/*<TabPanel id="overview">*/}
          {/*  <ProjectRelatedNavigationGrid*/}
          {/*    projectId={project.id}*/}
          {/*    onSectionClick={handleSectionClick}*/}
          {/*  />*/}
          {/*</TabPanel>*/}

          {/* Quotation Tab */}
          <TabPanel id="quotation">
            <QuotationPanel projectId={project.id} onDataChange={triggerKpiRefresh} />
          </TabPanel>

          {/* Process Tab */}
          <TabPanel id="process">
            <TaskFlowPanel projectId={project.id} projectName={project.projectName} />
          </TabPanel>

          {/* Purchase Tab */}
          <TabPanel id="purchase">
            <PurchasePanel projectId={project.id} />
          </TabPanel>

          {/* Outsource Tab */}
          <TabPanel id="outsource">
            <OutsourcePanel projectId={project.id} />
          </TabPanel>

          {/* Delivery Tab */}
          <TabPanel id="delivery">
            <DeliveryPanel projectId={project.id} />
          </TabPanel>

          {/* Documents Tab */}
          <TabPanel id="documents">
            <DocumentPanel projectId={project.id} />
          </TabPanel>

          {/* Finance Tab */}
          <TabPanel id="finance">
            <InvoicePanel projectId={project.id} onDataChange={triggerKpiRefresh} />
          </TabPanel>
        </Tabs>
      </div>
    </div>
  );
}
