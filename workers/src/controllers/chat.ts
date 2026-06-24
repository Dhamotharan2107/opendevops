import type { Context } from 'hono';
import { ChatRepository } from '../repositories/chat';
import { success, fail } from '../utils/helpers';
import { NotFoundError, ValidationError } from '../utils/errors';
import { assertChatMember } from '../utils/access';
import type { Env } from '../types';

const MAX_CHAT_MEMBERS = 200;

export async function createChat(c: Context<{ Bindings: Env }>) {
  try {
    const userId = c.get('userId') as string;
    const body = await c.req.json<{
      type: 'private' | 'group' | 'project';
      name?: string;
      project_id?: string;
      member_ids?: string[];
    }>();

    if (!body.type) throw new ValidationError('Chat type is required');
    if (body.member_ids && body.member_ids.length > MAX_CHAT_MEMBERS) {
      throw new ValidationError(`A chat cannot have more than ${MAX_CHAT_MEMBERS} members`);
    }

    const repo = new ChatRepository(c.env.DB);

    if (body.type === 'private' && body.member_ids?.length === 1) {
      const existing = await repo.findPrivateChat(userId, body.member_ids[0]);
      if (existing) {
        return success(c, existing);
      }
    }

    const chat = await repo.create({
      type: body.type,
      name: body.name,
      project_id: body.project_id,
      created_by: userId,
    });

    // Creator + invited members inserted in ONE batched round trip (was N sequential INSERTs).
    await repo.addMembers(chat.id, [userId, ...(body.member_ids ?? [])]);

    return success(c, chat, 201);
  } catch (e) {
    return fail(c, e);
  }
}

export async function listChats(c: Context<{ Bindings: Env }>) {
  try {
    const userId = c.get('userId') as string;
    const repo = new ChatRepository(c.env.DB);
    const page = parseInt(c.req.query('page') ?? '1', 10);
    const limit = parseInt(c.req.query('limit') ?? '20', 10);
    const result = await repo.findByUser(userId, page, limit);
    return success(c, result);
  } catch (e) {
    return fail(c, e);
  }
}

export async function getChat(c: Context<{ Bindings: Env }>) {
  try {
    const userId = c.get('userId') as string;
    const id = c.req.param('id')!;
    const repo = new ChatRepository(c.env.DB);
    const chat = await repo.findById(id);
    if (!chat) throw new NotFoundError('Chat');
    await assertChatMember(c.env.DB, id, userId);
    const members = await repo.getMembers(id);
    return success(c, { chat, members });
  } catch (e) {
    return fail(c, e);
  }
}

export async function getChatMessages(c: Context<{ Bindings: Env }>) {
  try {
    const userId = c.get('userId') as string;
    const id = c.req.param('id')!;
    const repo = new ChatRepository(c.env.DB);
    const chat = await repo.findById(id);
    if (!chat) throw new NotFoundError('Chat');
    await assertChatMember(c.env.DB, id, userId);
    const page = parseInt(c.req.query('page') ?? '1', 10);
    const limit = parseInt(c.req.query('limit') ?? '50', 10);
    const result = await repo.getMessages(id, page, limit);
    return success(c, result);
  } catch (e) {
    return fail(c, e);
  }
}

export async function sendMessage(c: Context<{ Bindings: Env }>) {
  try {
    const userId = c.get('userId') as string;
    const chatId = c.req.param('id')!;
    const body = await c.req.json<{
      text: string;
      file_url?: string;
      file_type?: string;
      file_name?: string;
    }>();

    if (!body.text?.trim()) throw new ValidationError('Message text is required');

    const repo = new ChatRepository(c.env.DB);
    const chat = await repo.findById(chatId);
    if (!chat) throw new NotFoundError('Chat');
    await assertChatMember(c.env.DB, chatId, userId);

    const message = await repo.saveMessage({
      chat_id: chatId,
      sender_id: userId,
      text: body.text.trim(),
      file_url: body.file_url,
      file_type: body.file_type,
      file_name: body.file_name,
    });

    const doId = c.env.CHAT_DO.idFromName(chatId);
    const stub = c.env.CHAT_DO.get(doId);
    try {
      await stub.fetch('http://do/message', {
        method: 'POST',
        body: JSON.stringify({
          sender_id: userId,
          text: body.text.trim(),
          file_url: body.file_url,
          file_type: body.file_type,
          file_name: body.file_name,
        }),
      });
    } catch {
      // DO broadcast is best-effort
    }

    return success(c, message, 201);
  } catch (e) {
    return fail(c, e);
  }
}

export async function chatWebSocket(c: Context<{ Bindings: Env }>) {
  try {
    const userId = c.get('userId') as string;
    const chatId = c.req.param('id')!;
    // IDOR guard: only members may open the chat socket.
    await assertChatMember(c.env.DB, chatId, userId);
    const doId = c.env.CHAT_DO.idFromName(chatId);
    const stub = c.env.CHAT_DO.get(doId);
    const url = new URL(c.req.url);
    url.pathname = '/ws';
    const resp = await stub.fetch(url.toString());
    return new Response(resp.body, {
      status: resp.status,
      statusText: resp.statusText,
      headers: resp.headers,
    });
  } catch (e) {
    return fail(c, e);
  }
}
