import type { McpName, McpConfig } from './types';
import type { McpServerConfig } from '../mcp-bus/types';
export declare function createBuiltinMcps(disabledMcps?: readonly McpName[], websearchConfig?: {
    provider: 'exa' | 'tavily';
    apiKey?: string;
}, mergedMcpServers?: McpServerConfig[]): Record<string, McpConfig>;
//# sourceMappingURL=index.d.ts.map