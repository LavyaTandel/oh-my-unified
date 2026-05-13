import type { WorkflowPhase, WorkflowState, ConfidenceLevel } from './types'

// After recalculateOverall — check if we can auto-transition
// This creates the SEAMLESS FLOW: /assess → auto → /assemble when ready
export function getNextPhase(current: WorkflowPhase, confidence: number): WorkflowPhase | null {
  if (current === 'assess' && confidence >= 6) return 'assemble'
  if (current === 'assemble' && confidence >= 8) return 'improvise'
  if (current === 'improvise' && confidence >= 9) return 'act'
  return null
}

export class WorkflowEngine {
  private state: WorkflowState = {
    phase: 'idle',
    knowledgeMap: new Map(),
    overallConfidence: 0,
    userSatisfied: false,
    startedAt: Date.now(),
    currentPhaseStartedAt: Date.now(),
  }

  getPhase(): WorkflowPhase { return this.state.phase }
  getConfidence(): number { return this.state.overallConfidence }

  // Transition to next phase — only if confidence threshold is met
  transitionTo(phase: WorkflowPhase): { allowed: boolean; reason: string } {
    const threshold = this.getThresholdFor(phase)

    if (this.state.overallConfidence < threshold && phase !== 'assess') {
      return { allowed: false, reason: `Confidence ${this.state.overallConfidence} < required ${threshold}. Need more information gathering.` }
    }

    this.state.phase = phase
    this.state.currentPhaseStartedAt = Date.now()
    return { allowed: true, reason: `Transitioned to ${phase}` }
  }

  // Update confidence based on new knowledge
  updateConfidence(area: string, level: ConfidenceLevel): void {
    const existing = this.state.knowledgeMap.get(area)
    const areaInfo = existing ?? {
      area,
      confidence: 0 as ConfidenceLevel,
      sources: [],
      questionsAsked: [],
      answersReceived: [],
    }
    areaInfo.confidence = Math.max(areaInfo.confidence, level) as ConfidenceLevel
    this.state.knowledgeMap.set(area, areaInfo)
    this.recalculateOverall()
  }

  getThresholdFor(phase: WorkflowPhase): number {
    switch (phase) {
      case 'assess': return 0
      case 'assemble': return 6
      case 'improvise': return 8
      case 'act': return 9
      default: return 0
    }
  }

  private recalculateOverall(): void {
    const areas = Array.from(this.state.knowledgeMap.values())
    if (areas.length === 0) {
      this.state.overallConfidence = 0
      return
    }
    this.state.overallConfidence = Math.round(
      areas.reduce((sum, a) => sum + a.confidence, 0) / areas.length
    ) as ConfidenceLevel
  }
}
