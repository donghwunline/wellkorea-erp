/**
 * Mail Config Query Factory.
 *
 * TanStack Query v5 query factory for mail OAuth2 configuration.
 */

import { queryOptions } from '@tanstack/react-query';
import type { MailConfigStatus } from '../model/mail-config';
import { mailConfigMapper } from './mail-config.mapper';
import { getMailConfigStatus } from './get-mail-config';

/**
 * Mail config query factory.
 */
export const mailConfigQueries = {
  /**
   * Base key for all mail config queries.
   */
  all: () => ['mail-config'] as const,

  /**
   * Mail OAuth2 status query.
   *
   * @example
   * const { data } = useQuery(mailConfigQueries.status());
   */
  status: () =>
    queryOptions({
      queryKey: [...mailConfigQueries.all(), 'status'] as const,
      queryFn: async (): Promise<MailConfigStatus> => {
        const response = await getMailConfigStatus();
        return mailConfigMapper.toDomain(response);
      },
      staleTime: 1000 * 60 * 5, // 5 minutes
    }),
};
