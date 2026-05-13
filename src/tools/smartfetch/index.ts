import type { PluginContext } from '../../plugin/types';

export interface SmartfetchOptions {
  maxLength?: number;
  startLength?: number;
  showLink?: boolean;
}

export function createSmartfetchTool(ctx: PluginContext) {
  return {
    name: 'smartfetch',
    description: 'Fetch web content with smart summarization',
    func: async (params: { url: string; maxLength?: number }) => {
      const { webfetch } = await import('./tool');
      return webfetch(params.url);
    },
  };
}