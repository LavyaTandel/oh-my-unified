export interface LoadableComponent {
    id: string;
    type: 'agent' | 'mcp' | 'skill';
    name: string;
    description: string;
    loaded: boolean;
    disabled: boolean;
}
export declare class LazyLoader {
    private registry;
    private disabledList;
    register(id: string, type: LoadableComponent['type'], name: string, desc: string): void;
    load(id: string): LoadableComponent | null;
    listAvailable(): LoadableComponent[];
    disable(id: string): void;
    enable(id: string): void;
    loadAgentsForTask(taskType: string): string[];
}
export declare const lazyLoader: LazyLoader;
//# sourceMappingURL=index.d.ts.map