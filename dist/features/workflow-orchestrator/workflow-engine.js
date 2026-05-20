// After recalculateOverall — check if we can auto-transition
// This creates the SEAMLESS FLOW: /assess → auto → /assemble when ready
export function getNextPhase(current, confidence) {
    if (current === 'assess' && confidence >= 6)
        return 'assemble';
    if (current === 'assemble' && confidence >= 8)
        return 'improvise';
    if (current === 'improvise' && confidence >= 9)
        return 'act';
    return null;
}
export class WorkflowEngine {
    state = {
        phase: 'idle',
        knowledgeMap: new Map(),
        overallConfidence: 0,
        userSatisfied: false,
        startedAt: Date.now(),
        currentPhaseStartedAt: Date.now(),
    };
    getPhase() { return this.state.phase; }
    getConfidence() { return this.state.overallConfidence; }
    // Transition to next phase — only if confidence threshold is met
    transitionTo(phase) {
        const threshold = this.getThresholdFor(phase);
        if (this.state.overallConfidence < threshold && phase !== 'assess') {
            return { allowed: false, reason: `Confidence ${this.state.overallConfidence} < required ${threshold}. Need more information gathering.` };
        }
        this.state.phase = phase;
        this.state.currentPhaseStartedAt = Date.now();
        return { allowed: true, reason: `Transitioned to ${phase}` };
    }
    // Update confidence based on new knowledge
    updateConfidence(area, level) {
        const existing = this.state.knowledgeMap.get(area);
        const areaInfo = existing ?? {
            area,
            confidence: 0,
            sources: [],
            questionsAsked: [],
            answersReceived: [],
        };
        areaInfo.confidence = Math.max(areaInfo.confidence, level);
        this.state.knowledgeMap.set(area, areaInfo);
        this.recalculateOverall();
    }
    getThresholdFor(phase) {
        switch (phase) {
            case 'assess': return 0;
            case 'assemble': return 6;
            case 'improvise': return 8;
            case 'act': return 9;
            default: return 0;
        }
    }
    recalculateOverall() {
        const areas = Array.from(this.state.knowledgeMap.values());
        if (areas.length === 0) {
            this.state.overallConfidence = 0;
            return;
        }
        this.state.overallConfidence = Math.round(areas.reduce((sum, a) => sum + a.confidence, 0) / areas.length);
    }
}
//# sourceMappingURL=workflow-engine.js.map