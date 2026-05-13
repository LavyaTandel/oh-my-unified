import type { PluginContext } from '../plugin/types';

/**
 * Preset Manager - allows switching between agent presets at runtime.
 */
export function createPresetManager(_ctx: PluginContext, _config: Record<string, any>) {
  return {
    name: 'preset-manager',
    definition: {
      name: 'preset-manager',
      description: 'Manage and switch between agent configuration presets',
      input: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            enum: ['list', 'switch', 'current'],
            description: 'Action to perform',
          },
          preset: {
            type: 'string',
            description: 'Preset name to switch to (required for switch action)',
          },
        },
        required: ['action'],
      },
      func: async (params: { action: string; preset?: string }) => {
        switch (params.action) {
          case 'list':
            return { presets: Object.keys(_config?.presets ?? {}) };
          case 'current':
            return { current: _config?.preset || 'default' };
          case 'switch':
            if (!params.preset) throw new Error('Preset name required');
            // Runtime preset switching would be handled by the config hook
            return { switched: params.preset, status: 'pending' };
          default:
            throw new Error(`Unknown action: ${params.action}`);
        }
      },
    },
  };
}