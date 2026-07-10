import type { Organization } from '@/features/organizations/domain/organization';

export const mockOrganizations: Organization[] = [
  { id: 'org-1', name: 'Acme Inc.', slug: 'acme', role: 'owner' },
  { id: 'org-2', name: 'Contexthub Labs', slug: 'contexthub-labs', role: 'member' },
];
