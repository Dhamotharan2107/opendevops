import { Hono } from 'hono';
import { authenticate } from '../middleware/auth';
import { createChat, listChats, getChat, getChatMessages, sendMessage, chatWebSocket } from '../controllers/chat';

export const chatRouter = new Hono();

chatRouter.post('/', authenticate, createChat);
chatRouter.get('/', authenticate, listChats);
chatRouter.get('/:id', authenticate, getChat);
chatRouter.get('/:id/messages', authenticate, getChatMessages);
chatRouter.post('/:id/messages', authenticate, sendMessage);
chatRouter.get('/:id/ws', authenticate, chatWebSocket);
