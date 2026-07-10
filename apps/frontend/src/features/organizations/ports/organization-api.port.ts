import type { Organization } from '../domain/organization';

export interface OrganizationApiPort {
  list(): Promise<Organization[]>;
}
