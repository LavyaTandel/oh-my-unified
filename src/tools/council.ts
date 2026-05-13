import type { PluginContext } from '../plugin/types';

interface CouncilParams {
  prompt: string;
  preset?: string;
}

// Council session placeholder - actual implementation requires
// the @opencode-ai/sdk council infrastructure
export async function council_session(params: CouncilParams): Promise<{
  response: string;
  councillors: Array<{ name: string; response: string }>;
  summary: string;
}> {
  return {
    response: '',
    councillors: [],
    summary: '',
  };
}

export const council_tool = {
  name: 'council_session',
  description: 'Run a multi-LLM council session to get consensus from multiple models',
  input: {
    type: 'object',
    properties: {
      prompt: { type: 'string', description: 'The prompt to send to all councillors' },
      preset: { type: 'string', description: 'Council preset to use (default: "default")' },
    },
    required: ['prompt'],
  },
  func: council_session,
};

// Factory matching the slim fork's createCouncilTool signature
export function createCouncilTool(
  _ctx: PluginContext,
  _config: Record<string, any>,
  _depthTracker: any,
): Record<string, unknown> {
  return {
    council_session: council_tool,
  };
}