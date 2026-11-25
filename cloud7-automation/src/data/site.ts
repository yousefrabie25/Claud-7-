/** Site map of cloud7.io as found during exploratory testing (Nov 2026). */

export const TOP_MENU = [
  { name: 'Features', path: '/features/' },
  { name: 'Pricing', path: '/pricing/' },
  { name: 'Support', path: '/support/' },
  { name: 'About Us', path: '/about-us/' },
  { name: 'Contact', path: '/contact-us/' },
  { name: 'Demo', path: '/demo/' },
  { name: 'Blog', path: '/blog/' },
] as const;

export const PROVIDERS = [
  { name: 'OpenStack', path: '/openstack-billing/' },
  { name: 'VMware', path: '/vmware-platform/' },
  { name: 'Huawei Cloud Stack', path: '/huawei-cloud/' },
] as const;

export const FEATURE_TABS = [
  'Identity Management',
  'Service Catalogue',
  'Metering & Reporting',
  'Unified Billing',
  'Self-Service Portal',
  'Cloud Management',
] as const;

export const PLATFORM_TABS = ['OpenStack', 'VMware', 'Kubernetes', 'AWS', 'Huawei'] as const;

export const STATIC_PAGES = ['/about-us/', '/partners/', '/support/'] as const;

/** Old feature URLs that redirect. */
export const LEGACY_FEATURE_URLS = [
  '/identity-and-access-management',
  '/subscription-contract-management',
  '/metering-reporting/',
  '/self-service-portal',
  '/unified-billing/',
  '/cloud-management-services/',
] as const;

/** Pages checked for SEO meta tags. */
export const KEY_PAGES = [
  '/',
  '/features/',
  '/pricing/',
  '/demo/',
  '/contact-us/',
  '/about-us/',
  '/openstack-billing/',
  '/vmware-platform/',
  '/huawei-cloud/',
] as const;

export const CONTACT = {
  email: 'info@cloud7.io',
  phone: '+16696293533',
} as const;

export const NOT_FOUND_PATH = '/qa-nonexistent-page-automation/';
