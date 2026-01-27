/**
 * Mail config getter functions.
 */

import { httpClient, MAIL_OAUTH2_ENDPOINTS } from '@/shared/api';
import type { MailConfigStatusResponse, AuthorizeUrlResponse } from './mail-config.mapper';

/**
 * Get mail OAuth2 connection status.
 */
export async function getMailConfigStatus(): Promise<MailConfigStatusResponse> {
  return httpClient.get<MailConfigStatusResponse>(MAIL_OAUTH2_ENDPOINTS.STATUS);
}

/**
 * Get Microsoft OAuth2 authorization URL.
 */
export async function getAuthorizationUrl(): Promise<AuthorizeUrlResponse> {
  return httpClient.get<AuthorizeUrlResponse>(MAIL_OAUTH2_ENDPOINTS.AUTHORIZE);
}
