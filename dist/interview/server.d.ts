export interface InterviewQuestion {
    id: string;
    question: string;
    category: string;
    context?: string;
    expectedAnswerType: 'text' | 'choice' | 'multi-choice';
    options?: string[];
}
export interface InterviewSession {
    id: string;
    title: string;
    startedAt: number;
    completedAt?: number;
    questions: InterviewQuestion[];
    answers: Record<string, string>;
    completed: boolean;
    sessionId: string;
}
export declare class InterviewEngine {
    private sessions;
    private server;
    private port;
    private clients;
    constructor(port?: number);
    createSession(sessionId: string, title: string, questions: InterviewQuestion[]): InterviewSession;
    getSession(id: string): InterviewSession | undefined;
    getActiveSessions(): InterviewSession[];
    submitAnswer(sessionId: string, questionId: string, answer: string): boolean;
    deleteSession(id: string): boolean;
    getStats(): {
        total: number;
        active: number;
        completed: number;
        totalAnswers: number;
    };
    private broadcastUpdate;
    private getSummary;
    start(): void;
    stop(): void;
    dispose(): void;
    private getDashboardHTML;
}
//# sourceMappingURL=server.d.ts.map