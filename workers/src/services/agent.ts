import { AgentRepository } from '../repositories/agent';
import type { Env } from '../types';

export class AgentService {
  constructor(private env: Env) {}

  async getOrCreateSession(projectId: string) {
    const repo = new AgentRepository(this.env.DB);
    let session = await repo.findByProject(projectId);

    if (!session) {
      session = await repo.create({
        id: crypto.randomUUID(),
        project_id: projectId,
        status: 'disconnected',
      });
    }

    return session;
  }

  async sendCommand(projectId: string, command: string): Promise<{ command_id: string; queued?: boolean }> {
    const doId = this.env.AGENT_DO.idFromName(projectId);
    const stub = this.env.AGENT_DO.get(doId);

    const response = await stub.fetch('http://do/command', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command }),
    });

    return response.json<{ success: boolean; data: { command_id: string; queued?: boolean } }>()
      .then((r) => r.data);
  }

  async getStatus(projectId: string) {
    const doId = this.env.AGENT_DO.idFromName(projectId);
    const stub = this.env.AGENT_DO.get(doId);
    const response = await stub.fetch('http://do/status');
    return response.json<{ success: boolean; data: unknown }>().then((r) => r.data);
  }
}
