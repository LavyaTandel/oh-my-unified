import type { PluginContext } from '../plugin/types';
/**
 * Preset Manager - allows switching between agent presets at runtime.
 */
export declare function createPresetManager(_ctx: PluginContext, _config: Record<string, any>): {
    name: string;
    definition: {
        name: string;
        description: string;
        input: {
            type: string;
            properties: {
                action: {
                    type: string;
                    enum: string[];
                    description: string;
                };
                preset: {
                    type: string;
                    description: string;
                };
            };
            required: string[];
        };
        func: (params: {
            action: string;
            preset?: string;
        }) => Promise<{
            presets: string[];
            current?: undefined;
            switched?: undefined;
            status?: undefined;
        } | {
            current: any;
            presets?: undefined;
            switched?: undefined;
            status?: undefined;
        } | {
            switched: string;
            status: string;
            presets?: undefined;
            current?: undefined;
        }>;
    };
};
//# sourceMappingURL=preset-manager.d.ts.map