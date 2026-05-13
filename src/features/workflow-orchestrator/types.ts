export type WorkflowPhase = 'idle' | 'assess' | 'assemble' | 'improvise' | 'act' | 'complete'
export type ConfidenceLevel = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10

export interface KnowledgeArea {
  area: string          // e.g. "project-structure", "tech-stack", "auth-system"
  confidence: ConfidenceLevel
  sources: string[]     // what was used to learn this (mcp-name, agent-name, user-answer)
  questionsAsked: string[]
  answersReceived: string[]
}

export interface WorkflowState {
  phase: WorkflowPhase
  knowledgeMap: Map<string, KnowledgeArea>
  overallConfidence: ConfidenceLevel
  userSatisfied: boolean
  startedAt: number
  currentPhaseStartedAt: number
}
