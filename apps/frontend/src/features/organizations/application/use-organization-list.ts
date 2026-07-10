import { useEffect } from 'react';
import { mockOrganizationApiAdapter } from '../infra/mock-organization-api.adapter';
import { useOrganizationStore } from './use-active-organization';

export function useOrganizationList() {
  const organizations = useOrganizationStore((state) => state.organizations);
  const isLoading = useOrganizationStore((state) => state.isLoading);
  const hasLoaded = useOrganizationStore((state) => state.hasLoaded);
  const setOrganizations = useOrganizationStore((state) => state.setOrganizations);
  const setLoading = useOrganizationStore((state) => state.setLoading);

  useEffect(() => {
    if (hasLoaded) return;

    let cancelled = false;
    setLoading(true);

    mockOrganizationApiAdapter.list().then((result) => {
      if (cancelled) return;
      setOrganizations(result);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [hasLoaded, setLoading, setOrganizations]);

  return { organizations, isLoading };
}
