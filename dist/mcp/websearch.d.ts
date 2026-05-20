import type { McpConfig } from './types';
export interface WebsearchConfig {
    provider: 'exa' | 'tavily';
    apiKey?: string;
}
export declare function createWebsearchConfig(config?: WebsearchConfig): McpConfig;
export declare const websearch: McpConfig;
//# sourceMappingURL=websearch.d.ts.map