import { ForbiddenError } from './errors';

// Authorization helpers — verify the caller actually belongs to the resource they
// are acting on. Used to close IDOR gaps on project-scoped and chat-scoped routes.

export async function isProjectMember(db: D1Database, projectId: string, userId: string): Promise<boolean> {
  const row = await db
    .prepare('SELECT 1 FROM project_members WHERE project_id = ? AND user_id = ? LIMIT 1')
    .bind(projectId, userId)
    .first();
  if (row) return true;
  // The project creator is always considered a member even if no membership row exists.
  const owner = await db
    .prepare('SELECT 1 FROM projects WHERE id = ? AND created_by = ? LIMIT 1')
    .bind(projectId, userId)
    .first();
  return !!owner;
}

export async function assertProjectMember(db: D1Database, projectId: string, userId: string): Promise<void> {
  if (!(await isProjectMember(db, projectId, userId))) {
    throw new ForbiddenError('You do not have access to this project');
  }
}

export async function isChatMember(db: D1Database, chatId: string, userId: string): Promise<boolean> {
  const row = await db
    .prepare('SELECT 1 FROM chat_members WHERE chat_id = ? AND user_id = ? LIMIT 1')
    .bind(chatId, userId)
    .first();
  return !!row;
}

export async function assertChatMember(db: D1Database, chatId: string, userId: string): Promise<void> {
  if (!(await isChatMember(db, chatId, userId))) {
    throw new ForbiddenError('You do not have access to this chat');
  }
}
