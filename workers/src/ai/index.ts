interface LogAnalysis {
  rootCause: string;
  suggestedFix: string;
  confidenceScore: number;
}

interface BugAnalysis {
  summary: string;
  possibleCauses: string[];
  suggestedFix: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

interface TestGeneration {
  testCases: Array<{
    name: string;
    steps: string[];
    expectedResults: string[];
  }>;
}

export class AIService {
  async analyzeLog(logData: string, apiKey: string, apiUrl: string): Promise<LogAnalysis> {
    const prompt = `Analyze the following log data and provide:
1. Root cause of the issue
2. Suggested fix
3. Confidence score (0-1)

Log Data:
${logData}

Respond in JSON format with keys: rootCause, suggestedFix, confidenceScore`;

    const response = await this.callGLM(prompt, apiKey, apiUrl);
    return JSON.parse(response) as LogAnalysis;
  }

  async analyzeBug(
    bugData: { logs: string; traceback?: string; screenshot?: string },
    apiKey: string,
    apiUrl: string,
  ): Promise<BugAnalysis> {
    let prompt = `Analyze the following bug report and provide:
1. Summary of the issue
2. Possible causes (as an array)
3. Suggested fix
4. Priority (low/medium/high/critical)

Bug Logs:
${bugData.logs}`;

    if (bugData.traceback) {
      prompt += `\n\nTraceback:\n${bugData.traceback}`;
    }

    if (bugData.screenshot) {
      prompt += `\n\nA screenshot is available (described as: ${bugData.screenshot})`;
    }

    prompt += `\n\nRespond in JSON format with keys: summary, possibleCauses, suggestedFix, priority`;

    const response = await this.callGLM(prompt, apiKey, apiUrl);
    return JSON.parse(response) as BugAnalysis;
  }

  async generateTests(prompt: string, apiKey: string, apiUrl: string): Promise<TestGeneration> {
    const fullPrompt = `Generate Playwright test cases based on the following description. Include test names, steps, and expected results.

Description:
${prompt}

Respond in JSON format with keys: testCases (array of objects with keys: name, steps, expectedResults)`;

    const response = await this.callGLM(fullPrompt, apiKey, apiUrl);
    return JSON.parse(response) as TestGeneration;
  }

  async callGLM(prompt: string, apiKey: string, apiUrl: string): Promise<string> {
    const url = `${apiUrl.replace(/\/$/, '')}/chat/completions`;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'glm-4-flash',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 2048,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`GLM API error (${res.status}): ${errorText}`);
    }

    const data = (await res.json()) as {
      choices: Array<{ message: { content: string } }>;
    };

    return data.choices[0]?.message?.content ?? '';
  }
}
