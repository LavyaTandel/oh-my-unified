// Council session placeholder - actual implementation requires
// the @opencode-ai/sdk council infrastructure
export async function council_session(params) {
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
export function createCouncilTool(_ctx, _config, _depthTracker) {
    return {
        council_session: council_tool,
    };
}
//# sourceMappingURL=council.js.map