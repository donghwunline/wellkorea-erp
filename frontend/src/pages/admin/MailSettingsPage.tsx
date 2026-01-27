/**
 * Mail Settings Page - Admin Only
 *
 * Allows admins to connect/disconnect Microsoft Graph OAuth2 for mail sending.
 */

import { useCallback, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Button,
  Card,
  Icon,
  PageHeader,
  Spinner,
} from '@/shared/ui';
import { mailConfigQueries } from '@/entities/mail-config';
import { useConnectMail } from '@/features/mail/connect';
import { useDisconnectMail } from '@/features/mail/disconnect';

/**
 * Hook to handle OAuth callback result from URL params.
 * Extracts success/error from URL and clears the params.
 * Error codes are translated to user-friendly messages via i18n.
 */
function useOAuthCallbackResult() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();

  // Extract callback result from URL params once
  const [callbackResult] = useState<{ type: 'success' | 'error'; text: string } | null>(() => {
    const success = searchParams.get('success') === 'true';
    const errorCode = searchParams.get('error');

    if (success) {
      return { type: 'success', text: 'Microsoft account connected successfully!' };
    }
    if (errorCode) {
      // Translate error code to user-friendly message
      const translationKey = `errors:codes.${errorCode}`;
      const translatedMessage = t(translationKey);
      // If translation exists, use it; otherwise use a generic message
      const message = translatedMessage !== translationKey
        ? translatedMessage
        : t('errors:generic.unknown');
      return { type: 'error', text: message };
    }
    return null;
  });

  // Clear URL params if there was a callback result
  const clearParams = useCallback(() => {
    if (searchParams.has('success') || searchParams.has('error')) {
      setSearchParams({});
      queryClient.invalidateQueries({ queryKey: mailConfigQueries.all() });
    }
  }, [searchParams, setSearchParams, queryClient]);

  return { callbackResult, clearParams };
}

/**
 * Mail settings page for OAuth2 configuration.
 */
export function MailSettingsPage() {
  const { t } = useTranslation('admin');

  // Handle OAuth callback result from URL
  const { callbackResult, clearParams } = useOAuthCallbackResult();

  // Clear params on first render with callback result
  const [paramsCleared, setParamsCleared] = useState(false);
  if (callbackResult && !paramsCleared) {
    clearParams();
    setParamsCleared(true);
  }

  // Message state (initialized from callback result)
  const [message, setMessage] = useState(callbackResult);

  // Query mail config status
  const { data: status, isLoading, error: queryError } = useQuery(mailConfigQueries.status());

  // Connect hook
  const { connect, isPending: isConnecting } = useConnectMail({
    onError: (error) => setMessage({ type: 'error', text: error.message }),
  });

  // Disconnect hook
  const { disconnect, isPending: isDisconnecting } = useDisconnectMail({
    onSuccess: () => setMessage({ type: 'success', text: 'Mail disconnected successfully' }),
    onError: (error) => setMessage({ type: 'error', text: error.message }),
  });

  const handleConnect = () => {
    setMessage(null);
    connect();
  };

  const handleDisconnect = () => {
    setMessage(null);
    disconnect();
  };

  return (
    <div className="space-y-6">
      <PageHeader>
        <PageHeader.Title
          title={t('mailSettings.title', 'Mail Settings')}
          description={t('mailSettings.description', 'Configure Microsoft Graph OAuth2 for sending emails')}
        />
      </PageHeader>

      {/* Status messages */}
      {message && (
        <Alert variant={message.type === 'success' ? 'success' : 'error'}>
          {message.text}
        </Alert>
      )}

      {queryError && (
        <Alert variant="error">
          Failed to load mail configuration status
        </Alert>
      )}

      {/* Loading state */}
      {isLoading && (
        <Card className="p-6">
          <div className="flex items-center justify-center">
            <Spinner className="h-6 w-6" />
            <span className="ml-2">Loading configuration...</span>
          </div>
        </Card>
      )}

      {/* Main content */}
      {status && (
        <Card className="p-6">
          <h3 className="text-lg font-medium mb-4">Microsoft Graph Connection</h3>

          {!status.microsoftConfigured ? (
            // Microsoft Graph not configured in environment
            <div className="space-y-4">
              <Alert variant="warning">
                <span className="flex items-center">
                  <Icon name="warning" className="h-4 w-4 mr-2" />
                  Microsoft Graph is not configured. Set MICROSOFT_GRAPH_CLIENT_ID and
                  MICROSOFT_GRAPH_CLIENT_SECRET environment variables.
                </span>
              </Alert>
              <p className="text-sm text-steel-400">
                Contact your administrator to configure Microsoft Graph API credentials.
              </p>
            </div>
          ) : status.connected ? (
            // Connected state
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-green-600">
                <Icon name="check-circle" className="h-5 w-5" />
                <span className="font-medium">Connected</span>
              </div>

              <div className="grid gap-2 text-sm">
                {status.senderEmail && (
                  <div>
                    <span className="text-steel-400">Sender Email:</span>{' '}
                    <span className="font-medium">{status.senderEmail}</span>
                  </div>
                )}
                {status.connectedAt && (
                  <div>
                    <span className="text-steel-400">Connected At:</span>{' '}
                    <span className="font-medium">
                      {new Date(status.connectedAt).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>

              <Button
                variant="secondary"
                onClick={handleDisconnect}
                disabled={isDisconnecting}
                className="mt-4"
              >
                {isDisconnecting ? (
                  <>
                    <Spinner className="h-4 w-4 mr-2" />
                    Disconnecting...
                  </>
                ) : (
                  <>
                    <Icon name="logout" className="h-4 w-4 mr-2" />
                    Disconnect
                  </>
                )}
              </Button>
            </div>
          ) : (
            // Not connected state
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-yellow-600">
                <Icon name="information-circle" className="h-5 w-5" />
                <span className="font-medium">Not Connected</span>
              </div>

              <p className="text-sm text-steel-400">
                Connect your Microsoft account to enable email sending via Microsoft Graph API.
                You will be redirected to Microsoft to authorize the application.
              </p>

              <Button onClick={handleConnect} disabled={isConnecting}>
                {isConnecting ? (
                  <>
                    <Spinner className="h-4 w-4 mr-2" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Icon name="envelope" className="h-4 w-4 mr-2" />
                    Connect Microsoft Account
                  </>
                )}
              </Button>
            </div>
          )}
        </Card>
      )}

      {/* Info section */}
      <Card className="p-6">
        <h3 className="text-lg font-medium mb-4">About Mail Configuration</h3>
        <div className="space-y-2 text-sm text-steel-400">
          <p>
            This application uses Microsoft Graph API to send emails on behalf of your Microsoft account.
          </p>
          <p>
            When you click &quot;Connect&quot;, you will be redirected to Microsoft to authorize this application
            to send emails. The authorization is stored securely and persists across application restarts.
          </p>
          <p>
            You can disconnect at any time to revoke access.
          </p>
        </div>
      </Card>
    </div>
  );
}
