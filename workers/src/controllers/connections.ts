import type { Context } from 'hono';
import { ConnectionRepository } from '../repositories/connection';
import { successResponse } from '../utils/helpers';
import { ValidationError, NotFoundError } from '../utils/errors';
import type { Env } from '../types';

export async function sendRequest(c: Context<{ Bindings: Env }>) {
  const userId = c.get('userId') as string;
  const { receiverId } = await c.req.json<{ receiverId: string }>();

  if (!receiverId) throw new ValidationError('receiverId is required');
  if (receiverId === userId) throw new ValidationError('Cannot send connection request to yourself');

  const repo = new ConnectionRepository(c.env.DB);

  const existing = await repo.findByUsers(userId, receiverId);
  if (existing) throw new ValidationError('Connection already exists');

  const connection = await repo.create({ requester_id: userId, receiver_id: receiverId });
  return c.json(successResponse(connection, 'Connection request sent'), 201);
}

export async function acceptRequest(c: Context<{ Bindings: Env }>) {
  const userId = c.get('userId') as string;
  const { connectionId } = await c.req.json<{ connectionId: string }>();

  if (!connectionId) throw new ValidationError('connectionId is required');

  const repo = new ConnectionRepository(c.env.DB);
  const connection = await repo.findById(connectionId);

  if (!connection) throw new NotFoundError('Connection not found');
  if (connection.receiver_id !== userId) throw new ValidationError('Not authorized to accept this request');
  if (connection.status !== 'pending') throw new ValidationError('Connection is not pending');

  const updated = await repo.update(connectionId, { status: 'accepted' });
  return c.json(successResponse(updated, 'Connection accepted'));
}

export async function rejectRequest(c: Context<{ Bindings: Env }>) {
  const userId = c.get('userId') as string;
  const { connectionId } = await c.req.json<{ connectionId: string }>();

  if (!connectionId) throw new ValidationError('connectionId is required');

  const repo = new ConnectionRepository(c.env.DB);
  const connection = await repo.findById(connectionId);

  if (!connection) throw new NotFoundError('Connection not found');
  if (connection.receiver_id !== userId) throw new ValidationError('Not authorized to reject this request');
  if (connection.status !== 'pending') throw new ValidationError('Connection is not pending');

  const updated = await repo.update(connectionId, { status: 'rejected' });
  return c.json(successResponse(updated, 'Connection rejected'));
}

export async function removeConnection(c: Context<{ Bindings: Env }>) {
  const userId = c.get('userId') as string;
  const id = c.req.param('id')!;

  const repo = new ConnectionRepository(c.env.DB);
  const connection = await repo.findById(id);

  if (!connection) throw new NotFoundError('Connection not found');
  if (connection.requester_id !== userId && connection.receiver_id !== userId) {
    throw new ValidationError('Not authorized to remove this connection');
  }

  await repo.remove(id);
  return c.json(successResponse({ message: 'Connection removed' }));
}
