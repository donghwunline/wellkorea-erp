package com.wellkorea.backend.project.api.dto.query;

/**
 * Key Performance Indicators (KPIs) for a project.
 * Used for the KPI strip display on the project hub page.
 *
 * @param progressPercent    Overall progress percentage (0-100), calculated from TaskFlow nodes
 * @param pendingApprovals   Count of PENDING approval requests for project's quotations
 * @param accountsReceivable Total outstanding balance (KRW) from unpaid invoices
 * @param invoicedAmount     Total amount (KRW) of all invoices issued for the project
 */
public record ProjectKPIView(
        int progressPercent,
        int pendingApprovals,
        long accountsReceivable,
        long invoicedAmount
) {
    /**
     * Create a KPI view with all values.
     *
     * @param progress   Progress percentage (0-100)
     * @param pending    Number of pending approvals
     * @param ar         Accounts receivable amount (KRW)
     * @param invoiced   Total invoiced amount (KRW)
     * @return New ProjectKPIView instance
     */
    public static ProjectKPIView of(int progress, int pending, long ar, long invoiced) {
        return new ProjectKPIView(progress, pending, ar, invoiced);
    }
}
