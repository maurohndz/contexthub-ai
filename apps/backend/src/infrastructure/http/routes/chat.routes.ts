import { Router, type Request, type Response } from 'express';
import {
  AiProviderNotConfiguredError,
  ConversationNotFoundError,
  LlmRequestFailedError,
  NotOrganizationMemberError,
  SpaceNotFoundInOrganizationError,
  UnknownChatModelError,
  type Conversation,
} from '../../../contexts/ai/modules/chat/domain/chat';
import { container } from '../../container';
import { requireAuth } from '../require-auth';

const MAX_MESSAGE_LENGTH = 8000;

// mergeParams: montado en /api/organizations/:orgId/spaces/:spaceId/chat.
export const chatRouter: Router = Router({ mergeParams: true });

chatRouter.use(requireAuth);

// The user's conversations in the space (sidebar chat history).
chatRouter.get('/conversations', async (req: Request, res: Response) => {
  const { orgId, spaceId } = req.params as { orgId: string; spaceId: string };

  try {
    const conversations = await container.listConversations.execute(req.userId!, orgId, spaceId);
    return res.json({ conversations: conversations.map(toConversationDto) });
  } catch (error) {
    return handleChatError(error, res);
  }
});

// "Nuevo chat": starts an empty conversation.
chatRouter.post('/conversations', async (req: Request, res: Response) => {
  const { orgId, spaceId } = req.params as { orgId: string; spaceId: string };

  try {
    const conversation = await container.createConversation.execute(req.userId!, orgId, spaceId);
    return res.status(201).json({ conversation: toConversationDto(conversation) });
  } catch (error) {
    return handleChatError(error, res);
  }
});

chatRouter.get('/conversations/:conversationId/messages', async (req: Request, res: Response) => {
  const { orgId, spaceId, conversationId } = req.params as {
    orgId: string;
    spaceId: string;
    conversationId: string;
  };

  try {
    const messages = await container.getChatHistory.execute(
      req.userId!,
      orgId,
      spaceId,
      conversationId,
    );
    return res.json({ messages });
  } catch (error) {
    return handleChatError(error, res);
  }
});

chatRouter.post('/conversations/:conversationId/messages', async (req: Request, res: Response) => {
  const { orgId, spaceId, conversationId } = req.params as {
    orgId: string;
    spaceId: string;
    conversationId: string;
  };
  const { content, mode, model } = (req.body ?? {}) as Record<string, unknown>;

  if (typeof content !== 'string' || content.trim().length === 0) {
    return res.status(400).json({ error: 'El mensaje no puede estar vacío' });
  }
  if (content.length > MAX_MESSAGE_LENGTH) {
    return res
      .status(400)
      .json({ error: `El mensaje no puede superar ${MAX_MESSAGE_LENGTH} caracteres` });
  }

  try {
    const result = await container.sendChatMessage.execute({
      userId: req.userId!,
      organizationId: orgId,
      spaceId,
      conversationId,
      content: content.trim(),
      mode: typeof mode === 'string' ? mode : 'general',
      model: typeof model === 'string' && model.length > 0 ? model : null,
    });
    return res.json(result);
  } catch (error) {
    return handleChatError(error, res);
  }
});

function toConversationDto(conversation: Conversation) {
  return {
    id: conversation.id,
    spaceId: conversation.spaceId,
    title: conversation.title,
    createdAt: conversation.createdAt.toISOString(),
    updatedAt: conversation.updatedAt.toISOString(),
  };
}

function handleChatError(error: unknown, res: Response): Response {
  if (error instanceof NotOrganizationMemberError) {
    return res.status(403).json({ error: error.message });
  }
  if (error instanceof SpaceNotFoundInOrganizationError) {
    return res.status(404).json({ error: error.message });
  }
  if (error instanceof ConversationNotFoundError) {
    return res.status(404).json({ error: error.message });
  }
  if (error instanceof UnknownChatModelError) {
    return res.status(400).json({ error: error.message });
  }
  if (error instanceof AiProviderNotConfiguredError) {
    // 409: the request is valid but the org configuration is missing.
    return res.status(409).json({ error: error.message });
  }
  if (error instanceof LlmRequestFailedError) {
    return res.status(502).json({ error: error.message });
  }
  throw error;
}
