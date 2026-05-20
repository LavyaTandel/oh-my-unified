export interface RoleViolation {
    agentName: string;
    violation: string;
    blocked: boolean;
}
export declare class RoleEnforcer {
    checkPermission(agentName: string, action: 'delegate' | 'edit' | 'read' | 'research'): RoleViolation;
    canDelegate(fromAgent: string, toAgent: string): RoleViolation;
}
//# sourceMappingURL=index.d.ts.map