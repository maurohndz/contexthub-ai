import { useEffect } from 'react';
import { useActiveOrganizationId } from '@/features/organizations/application/use-active-organization';
import { subscribeRealtime, subscribeRealtimeReconnect } from '@/lib/realtime';
import { projectApiAdapter } from '../infra/http-project-api.adapter';
import { useProjectStore } from './use-active-project';

/**
 * Loads the active organization's spaces and reloads when it changes.
 * The list also refreshes in the background when a document.updated SSE
 * event arrives, so per-space document counts stay live without polling.
 */
export function useProjectList() {
  const activeOrganizationId = useActiveOrganizationId();
  const projects = useProjectStore((state) => state.projects);
  const isLoading = useProjectStore((state) => state.isLoading);
  const loadedOrganizationId = useProjectStore((state) => state.loadedOrganizationId);
  const setProjects = useProjectStore((state) => state.setProjects);
  const clearProjects = useProjectStore((state) => state.clearProjects);
  const setLoading = useProjectStore((state) => state.setLoading);
  const refreshProjects = useProjectStore((state) => state.refreshProjects);

  useEffect(() => {
    if (!activeOrganizationId) {
      clearProjects();
      return;
    }
    if (loadedOrganizationId === activeOrganizationId) return;

    let cancelled = false;
    setLoading(true);

    // setProjects turns isLoading off atomically (see store): .finally is
    // not used because the loadedOrganizationId change re-fires this
    // effect and cancels the closure before it runs.
    projectApiAdapter
      .list(activeOrganizationId)
      .then((result) => {
        if (cancelled) return;
        setProjects(result, activeOrganizationId);
      })
      .catch(() => {
        if (cancelled) return;
        setProjects([], activeOrganizationId);
      });

    return () => {
      cancelled = true;
    };
  }, [activeOrganizationId, loadedOrganizationId, clearProjects, setLoading, setProjects]);

  useEffect(() => {
    if (!activeOrganizationId) return;

    const refresh = () => {
      projectApiAdapter
        .list(activeOrganizationId)
        .then((result) => refreshProjects(result, activeOrganizationId))
        .catch(() => {
          // Background refresh: on failure the current list stays as is.
        });
    };

    const unsubscribeEvents = subscribeRealtime((event) => {
      if (event.type === 'document.updated' && event.organizationId === activeOrganizationId) {
        refresh();
      }
    });
    // After a channel reconnection an event may have been missed.
    const unsubscribeReconnect = subscribeRealtimeReconnect(refresh);

    return () => {
      unsubscribeEvents();
      unsubscribeReconnect();
    };
  }, [activeOrganizationId, refreshProjects]);

  return { projects, isLoading };
}
