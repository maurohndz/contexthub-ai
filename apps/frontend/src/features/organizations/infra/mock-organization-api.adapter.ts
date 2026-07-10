import { mockOrganizations } from '@/lib/mock-data/organizations.mock';
import type { Organization } from '../domain/organization';
import type { OrganizationApiPort } from '../ports/organization-api.port';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

class MockOrganizationApiAdapter implements OrganizationApiPort {
  async list(): Promise<Organization[]> {
    await delay(300);
    return [...mockOrganizations];
  }
}

export const mockOrganizationApiAdapter = new MockOrganizationApiAdapter();
