/**
 * i18n Configuration for WellKorea ERP
 *
 * Initializes react-i18next with:
 * - Korean (ko) as default language
 * - English (en) as fallback
 * - Browser language detection
 * - Namespace-based translation file organization
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import Korean translation files
import koCommon from '@/locales/ko/common.json';
import koNavigation from '@/locales/ko/navigation.json';
import koAuth from '@/locales/ko/auth.json';
import koValidation from '@/locales/ko/validation.json';
import koErrors from '@/locales/ko/errors.json';
import koProjects from '@/locales/ko/projects.json';
import koQuotations from '@/locales/ko/quotations.json';
import koCompanies from '@/locales/ko/companies.json';
import koPurchasing from '@/locales/ko/purchasing.json';
import koDeliveries from '@/locales/ko/deliveries.json';
import koInvoices from '@/locales/ko/invoices.json';
import koItems from '@/locales/ko/items.json';
import koApproval from '@/locales/ko/approval.json';
import koAdmin from '@/locales/ko/admin.json';
import koReports from '@/locales/ko/reports.json';

// Import English translation files
import enCommon from '@/locales/en/common.json';
import enNavigation from '@/locales/en/navigation.json';
import enAuth from '@/locales/en/auth.json';
import enValidation from '@/locales/en/validation.json';
import enErrors from '@/locales/en/errors.json';
import enProjects from '@/locales/en/projects.json';
import enQuotations from '@/locales/en/quotations.json';
import enCompanies from '@/locales/en/companies.json';
import enPurchasing from '@/locales/en/purchasing.json';
import enDeliveries from '@/locales/en/deliveries.json';
import enInvoices from '@/locales/en/invoices.json';
import enItems from '@/locales/en/items.json';
import enApproval from '@/locales/en/approval.json';
import enAdmin from '@/locales/en/admin.json';
import enReports from '@/locales/en/reports.json';

/** Available namespaces for translation files */
export const namespaces = [
  'common',
  'navigation',
  'auth',
  'validation',
  'errors',
  'projects',
  'quotations',
  'companies',
  'purchasing',
  'deliveries',
  'invoices',
  'items',
  'approval',
  'admin',
  'reports',
] as const;

export type Namespace = (typeof namespaces)[number];

/** Supported languages */
export const supportedLanguages = ['ko', 'en'] as const;
export type Language = (typeof supportedLanguages)[number];

/** Default language */
export const defaultLanguage: Language = 'ko';

/** i18n resources configuration */
const resources = {
  ko: {
    common: koCommon,
    navigation: koNavigation,
    auth: koAuth,
    validation: koValidation,
    errors: koErrors,
    projects: koProjects,
    quotations: koQuotations,
    companies: koCompanies,
    purchasing: koPurchasing,
    deliveries: koDeliveries,
    invoices: koInvoices,
    items: koItems,
    approval: koApproval,
    admin: koAdmin,
    reports: koReports,
  },
  en: {
    common: enCommon,
    navigation: enNavigation,
    auth: enAuth,
    validation: enValidation,
    errors: enErrors,
    projects: enProjects,
    quotations: enQuotations,
    companies: enCompanies,
    purchasing: enPurchasing,
    deliveries: enDeliveries,
    invoices: enInvoices,
    items: enItems,
    approval: enApproval,
    admin: enAdmin,
    reports: enReports,
  },
};

// Initialize i18next
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    defaultNS: 'common',
    fallbackLng: 'ko', // Fallback to Korean
    lng: 'ko', // Default to Korean
    supportedLngs: [...supportedLanguages],

    interpolation: {
      escapeValue: false, // React already handles XSS
    },

    detection: {
      // Order of language detection
      order: ['localStorage', 'navigator'],
      // Cache user language choice
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },

    // Enable debug mode in development
    debug: import.meta.env.DEV,
  });

export default i18n;

/** Helper to change language */
export function changeLanguage(lang: Language): Promise<void> {
  return i18n.changeLanguage(lang).then(() => undefined);
}

/** Get current language */
export function getCurrentLanguage(): Language {
  return i18n.language as Language;
}
