/**
 * Preset Manager - allows switching between agent presets at runtime.
 */
export function createPresetManager(_ctx, _config) {
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
            func: async (params) => {
                switch (params.action) {
                    case 'list':
                        return { presets: Object.keys(_config?.presets ?? {}) };
                    case 'current':
                        return { current: _config?.preset || 'default' };
                    case 'switch':
                        if (!params.preset)
                            throw new Error('Preset name required');
                        // Runtime preset switching would be handled by the config hook
                        return { switched: params.preset, status: 'pending' };
                    default:
                        throw new Error(`Unknown action: ${params.action}`);
                }
            },
        },
    };
}
//# sourceMappingURL=preset-manager.js.map