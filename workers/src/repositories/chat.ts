import type { Chat, ChatMember, Message } from '../types';
import { generateId, now } from '../utils/helpers';

export class ChatRepository {
  constructor(private db: D1Database) {}

  async findById(id: string): Promise<Chat | null> {
    const result = await this.db.prepare('SELECT * FROM chats WHERE id = ?').bind(id).first<Chat>();
    return result ?? null;
  }

  async findPrivateChat(user1Id: string, user2Id: string): Promise<Chat | null> {
    const result = await this.db.prepare(
      `SELECT c.* FROM chats c
       WHERE c.type = 'private'
       AND EXISTS (SELECT 1 FROM chat_members WHERE chat_id = c.id AND user_id = ?)
       AND EXISTS (SELECT 1 FROM chat_members WHERE chat_id = c.id AND user_id = ?)`
    ).bind(user1Id, user2Id).first<Chat>();
    return result ?? null;
  }

  async findByUser(userId: string, page = 1, limit = 20): Promise<{ chats: Chat[]; total: number }> {
    const offset = (page - 1) * limit;
    const chats = await this.db.prepare(
      `SELECT c.* FROM chats c
       INNER JOIN chat_members cm ON cm.chat_id = c.id AND cm.user_id = ?
       ORDER BY c.created_at DESC
       LIMIT ? OFFSET ?`
    ).bind(userId, limit, offset).all<Chat>();
    const totalResult = await this.db.prepare(
      'SELECT COUNT(*) as count FROM chat_members WHERE user_id = ?'
    ).bind(userId).first<{ count: number }>();
    return { chats: chats.results, total: totalResult?.count ?? 0 };
  }

  async findByProject(projectId: string): Promise<Chat | null> {
    const result = await this.db.prepare(
      "SELECT * FROM chats WHERE project_id = ? AND type = 'project' LIMIT 1"
    ).bind(projectId).first<Chat>();
    return result ?? null;
  }

  async create(data: { type: 'private' | 'group' | 'project'; name?: string; project_id?: string; created_by: string }): Promise<Chat> {
    const chat: Chat = {
      id: generateId(),
      type: data.type,
      name: data.name ?? undefined,
      project_id: data.project_id ?? undefined,
      created_by: data.created_by,
      created_at: now(),
    };
    await this.db.prepare(
      'INSERT INTO chats (id, type, name, project_id, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(chat.id, chat.type, chat.name, chat.project_id, chat.created_by, chat.created_at).run();
    return chat;
  }

  async addMember(chatId: string, userId: string): Promise<ChatMember> {
    const member: ChatMember = {
      chat_id: chatId,
      user_id: userId,
      joined_at: now(),
    };
    await this.db.prepare(
      'INSERT INTO chat_members (chat_id, user_id, joined_at) VALUES (?, ?, ?)'
    ).bind(member.chat_id, member.user_id, member.joined_at).run();
    return member;
  }

  async getMembers(chatId: string): Promise<ChatMember[]> {
    const result = await this.db.prepare(
      'SELECT * FROM chat_members WHERE chat_id = ?'
    ).bind(chatId).all<ChatMember>();
    return result.results;
  }

  async getMessages(chatId: string, page = 1, limit = 50): Promise<{ messages: Message[]; total: number }> {
    const offset = (page - 1) * limit;
    const messages = await this.db.prepare(
      'SELECT * FROM messages WHERE chat_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?'
    ).bind(chatId, limit, offset).all<Message>();
    const totalResult = await this.db.prepare(
      'SELECT COUNT(*) as count FROM messages WHERE chat_id = ?'
    ).bind(chatId).first<{ count: number }>();
    return { messages: messages.results.reverse(), total: totalResult?.count ?? 0 };
  }

  async saveMessage(data: { chat_id: string; sender_id: string; text: string; file_url?: string; file_type?: string; file_name?: string }): Promise<Message> {
    const message: Message = {
      id: generateId(),
      chat_id: data.chat_id,
      sender_id: data.sender_id,
      text: data.text,
      file_url: data.file_url ?? undefined,
      file_type: data.file_type ?? undefined,
      file_name: data.file_name ?? undefined,
      created_at: now(),
    };
    await this.db.prepare(
      'INSERT INTO messages (id, chat_id, sender_id, text, file_url, file_type, file_name, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(message.id, message.chat_id, message.sender_id, message.text, message.file_url, message.file_type, message.file_name, message.created_at).run();
    return message;
  }
}
