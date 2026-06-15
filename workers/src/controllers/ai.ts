import { Context } from 'hono';
import { AIService } from '../ai';
import { AITestRepository } from '../repositories/ai';
import { successResponse } from '../utils/helpers';
import type { Env } from '../types';

export async function analyzeLog(c: Context) {
  const env = c.env as Env;
  const { log: logData } = await c.req.json();
  const ai = new AIService();
  const result = await ai.analyzeLog(logData, env.GLM_API_KEY, env.GLM_API_URL);
  return c.json(successResponse(result));
}

export async function analyzeBug(c: Context) {
  const env = c.env as Env;
  const { logs, traceback, screenshot } = await c.req.json();
  const ai = new AIService();
  const result = await ai.analyzeBug({ logs, traceback, screenshot }, env.GLM_API_KEY, env.GLM_API_URL);
  return c.json(successResponse(result));
}

export async function generateTests(c: Context) {
  const env = c.env as Env;
  const { prompt } = await c.req.json();
  const ai = new AIService();
  const result = await ai.generateTests(prompt, env.GLM_API_KEY, env.GLM_API_URL);
  return c.json(successResponse(result));
}

export async function runTest(c: Context) {
  const env = c.env as Env;
  const userId = c.get('userId');
  const { projectId, prompt } = await c.req.json();

  const repo = new AITestRepository(env.DB);
  const run = await repo.create({ project_id: projectId, prompt, created_by: userId });

  try {
    const ai = new AIService();
    const result = await ai.generateTests(prompt, env.GLM_API_KEY, env.GLM_API_URL);
    await repo.update(run.id, { status: 'completed', results: JSON.stringify(result) });
    const updated = await repo.findById(run.id);
    return c.json(successResponse(updated, 'Test run completed'));
  } catch (err) {
    await repo.update(run.id, { status: 'failed', results: (err as Error).message });
    const updated = await repo.findById(run.id);
    return c.json(successResponse(updated, 'Test run failed'));
  }
}
