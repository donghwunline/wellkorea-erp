/**
 * Mail config mapper - Response types and DTO mapping.
 */

import type { MailConfigStatus } from '../model/mail-config';

/**
 * Mail config status response from API.
 */
export interface MailConfigStatusResponse {
  connected: boolean;
  senderEmail: string | null;
  connectedAt: string | null;
  connectedById: number | null;
  microsoftConfigured: boolean;
}

/**
 * Authorization URL response from API.
 */
export interface AuthorizeUrlResponse {
  authorizationUrl: string;
}

/**
 * Maps API response to domain model.
 */
export const mailConfigMapper = {
  toDomain(response: MailConfigStatusResponse): MailConfigStatus {
    return {
      connected: response.connected,
      senderEmail: response.senderEmail,
      connectedAt: response.connectedAt,
      connectedById: response.connectedById,
      microsoftConfigured: response.microsoftConfigured,
    };
  },
};
