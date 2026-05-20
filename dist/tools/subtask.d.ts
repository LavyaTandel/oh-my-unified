interface SubtaskState {
    tasks: Map<string, {
        status: 'pending' | 'in_progress' | 'done';
        result?: any;
    }>;
    currentTask?: string;
}
export declare function createSubtaskState(): SubtaskState;
export declare function createSubtaskTool(_ctx: any, subtaskState: SubtaskState, _depthTracker: any): Promise<{
    name: string;
    definition: unknown;
    func: Function;
}>;
export declare function createSubtaskCommandManager(_ctx: any, _state: SubtaskState): {
    name: string;
    commands: {
        'subtask.list': () => {
            id: string;
            status: string;
        }[];
        'subtask.clear': () => {
            cleared: boolean;
        };
    };
};
export declare function createReadSessionTool(_client: any, _subtaskState: SubtaskState): Promise<{
    name: string;
    definition: unknown;
    func: Function;
}>;
export {};
//# sourceMappingURL=subtask.d.ts.map