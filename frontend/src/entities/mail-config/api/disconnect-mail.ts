/**
 * Disconnect mail OAuth2 command.
 */

import { httpClient, MAIL_OAUTH2_ENDPOINTS } from '@/shared/api';

/**
 * Disconnect mail OAuth2 configuration.
 */
export async function disconnectMail(): Promise<void> {
  await httpClient.delete(MAIL_OAUTH2_ENDPOINTS.DISCONNECT);
}
