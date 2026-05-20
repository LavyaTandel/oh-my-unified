const state = new Map();
export function createSubtaskState() {
    return { tasks: new Map(), currentTask: undefined };
}
export async function createSubtaskTool(_ctx, subtaskState, _depthTracker) {
    async function subtask(params) {
        const taskId = `task_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        subtaskState.tasks.set(taskId, { status: 'in_progress' });
        subtaskState.currentTask = taskId;
        return { taskId, status: 'started' };
    }
    return {
        name: 'subtask',
        definition: {
            name: 'subtask',
            description: 'Create and manage subtasks for complex multi-step operations',
            input: {
                type: 'object',
                properties: {
                    task: { type: 'string', description: 'Description of the subtask' },
                    context: { type: 'string', description: 'Additional context for the subtask' },
                },
                required: ['task'],
            },
            func: subtask,
        },
        func: subtask,
    };
}
export function createSubtaskCommandManager(_ctx, _state) {
    return {
        name: 'subtask_commands',
        commands: {
            'subtask.list': () => {
                const tasks = [];
                for (const [id, info] of _state.tasks) {
                    tasks.push({ id, status: info.status });
                }
                return tasks;
            },
            'subtask.clear': () => {
                _state.tasks.clear();
                _state.currentTask = undefined;
                return { cleared: true };
            },
        },
    };
}
export async function createReadSessionTool(_client, _subtaskState) {
    async function read_session() {
        const tasks = [];
        for (const [id, info] of _subtaskState.tasks) {
            tasks.push({ id, status: info.status });
        }
        return { tasks };
    }
    return {
        name: 'read_session',
        definition: {
            name: 'read_session',
            description: 'Read current session state including active subtasks',
            input: { type: 'object', properties: {} },
            func: read_session,
        },
        func: read_session,
    };
}
//# sourceMappingURL=subtask.js.map