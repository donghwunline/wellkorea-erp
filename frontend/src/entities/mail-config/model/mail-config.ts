/**
 * Mail OAuth2 configuration domain model.
 */

/**
 * Mail OAuth2 connection status.
 */
export interface MailConfigStatus {
  readonly connected: boolean;
  readonly senderEmail: string | null;
  readonly connectedAt: string | null;
  readonly connectedById: number | null;
  readonly microsoftConfigured: boolean;
}
