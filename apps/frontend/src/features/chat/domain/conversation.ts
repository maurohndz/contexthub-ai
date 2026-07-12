/**
 * A chat thread of the current user within a project. `title` is null
 * until the first message names it (shown as "Nuevo chat").
 */
export interface Conversation {
  id: string;
  projectId: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
}
