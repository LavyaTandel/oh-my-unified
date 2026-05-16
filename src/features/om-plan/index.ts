import type { PluginInput } from '@opencode-ai/plugin';
import type { PluginConfig } from '../../config';
import { log } from '../../utils/logger';
import type { TransparencyLog } from '../transparency-log';

export type PlanPhase = 'assess' | 'assemble' | 'act' | 'improvise';
export type PlanStatus = 'active' | 'completed' | 'cancelled';

export interface PlanState {
  id: string;
  sessionId: string;
  topic: string;
  phase: PlanPhase;
  status: PlanStatus;
  findings: Record<PlanPhase, string[]>;
  decisions: string[];
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
}

const PHASE_ORDER: PlanPhase[] = ['assess', 'assemble', 'act', 'improvise'];

const PHASE_PROMPTS: Record<PlanPhase, string> = {
  assess: `# Phase 1: Assess — Requirements & Gap Analysis

Analyze the user's request thoroughly:

1. **Requirements Extraction** — List all explicit and implicit requirements
2. **Constraint Identification** — Note technical, time, and resource constraints
3. **Gap Analysis** — What's missing from the request? What assumptions need validation?
4. **Risk Assessment** — What could go wrong? What are the failure modes?
5. **Success Criteria** — How will we know this is done correctly?

Output your findings as structured bullet points. Be thorough — missing requirements now cause rework later.`,

  assemble: `# Phase 2: Assemble — Research & Architecture

Research and structure the approach:

1. **Codebase Analysis** — Map existing structure, patterns, and dependencies
2. **Technology Research** — Find docs, examples, and best practices for key dependencies
3. **Architecture Design** — Propose system structure, module boundaries, and data flow
4. **Approach Comparison** — Evaluate 2-3 alternative approaches with trade-offs
5. **Resource Planning** — Identify what agents, tools, and MCPs are needed

Output a structured plan with clear phases, dependencies, and agent assignments.`,

  act: `# Phase 3: Act — Implementation

Execute the plan with precision:

1. **File-by-File Implementation** — Work through the plan systematically
2. **Test-Driven** — Write tests before or alongside implementation
3. **Incremental Verification** — Verify each step before moving to the next
4. **Error Handling** — Add robust error handling and edge case coverage
5. **Documentation** — Update README, comments, and any relevant docs

Output a summary of what was implemented, files changed, and verification results.`,

  improvise: `# Phase 4: Improvise — Review & Refine

Critically review and improve:

1. **Quality Review** — Is the code clean, consistent, and well-structured?
2. **Edge Case Testing** — Have all edge cases been considered and handled?
3. **Performance Check** — Are there any obvious performance bottlenecks?
4. **Security Review** — Any vulnerabilities, data exposure, or auth issues?
5. **User Experience** — Is the result intuitive and well-documented?

Output a final verdict: PASS (ready to ship) or FAIL (issues to address), with specific findings.`,
};

const MODEL_ROUTING: Record<PlanPhase, string> = {
  assess: 'opencode/nemotron-3-super-free',
  assemble: 'opencode/minimax-m2.5-free',
  act: 'opencode/deepseek-v4-flash-free',
  improvise: 'opencode/nemotron-3-super-free',
};

export class PlanOrchestrator {
  private plans = new Map<string, PlanState>();

  startPlan(sessionId: string, topic: string): PlanState {
    const id = `plan-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const now = Date.now();
    const state: PlanState = {
      id,
      sessionId,
      topic,
      phase: 'assess',
      status: 'active',
      findings: { assess: [], assemble: [], act: [], improvise: [] },
      decisions: [],
      createdAt: now,
      updatedAt: now,
    };
    this.plans.set(id, state);
    log('[om-plan] started', { id, sessionId, topic: topic.slice(0, 100) });
    return state;
  }

  advancePhase(planId: string): PlanState | null {
    const plan = this.plans.get(planId);
    if (!plan || plan.status !== 'active') return null;

    const currentIdx = PHASE_ORDER.indexOf(plan.phase);
    if (currentIdx >= PHASE_ORDER.length - 1) {
      plan.status = 'completed';
      plan.completedAt = Date.now();
      plan.updatedAt = Date.now();
      log('[om-plan] completed', { id: planId, phases: PHASE_ORDER.length });
      return plan;
    }

    plan.phase = PHASE_ORDER[currentIdx + 1];
    plan.updatedAt = Date.now();
    log('[om-plan] advanced', { id: planId, phase: plan.phase });
    return plan;
  }

  addFinding(planId: string, phase: PlanPhase, finding: string): void {
    const plan = this.plans.get(planId);
    if (!plan) return;
    plan.findings[phase].push(finding);
    plan.updatedAt = Date.now();
  }

  addDecision(planId: string, decision: string): void {
    const plan = this.plans.get(planId);
    if (!plan) return;
    plan.decisions.push(decision);
    plan.updatedAt = Date.now();
  }

  getPhasePrompt(phase: PlanPhase): string {
    return PHASE_PROMPTS[phase];
  }

  getModelForPhase(phase: PlanPhase): string {
    return MODEL_ROUTING[phase];
  }

  getPlan(planId: string): PlanState | undefined {
    return this.plans.get(planId);
  }

  getActivePlan(sessionId: string): PlanState | undefined {
    for (const plan of this.plans.values()) {
      if (plan.sessionId === sessionId && plan.status === 'active') return plan;
    }
    return undefined;
  }

  listPlans(): PlanState[] {
    return Array.from(this.plans.values()).sort((a, b) => b.createdAt - a.createdAt);
  }

  getStatusText(plan: PlanState): string {
    const phaseIdx = PHASE_ORDER.indexOf(plan.phase);
    const progress = plan.status === 'completed'
      ? 'Complete'
      : `Phase ${phaseIdx + 1}/4: ${plan.phase}`;

    const findingsCount = Object.values(plan.findings).reduce((sum, f) => sum + f.length, 0);

    return `**Plan**: ${plan.topic}\n**Status**: ${progress}\n**Findings**: ${findingsCount}\n**Decisions**: ${plan.decisions.length}`;
  }

  getReport(planId: string): string | null {
    const plan = this.plans.get(planId);
    if (!plan) return null;

    const lines = [
      `# Plan Report — ${plan.topic}`,
      ``,
      `**Status**: ${plan.status}`,
      `**Phase**: ${plan.phase}`,
      `**Created**: ${new Date(plan.createdAt).toISOString()}`,
      plan.completedAt ? `**Completed**: ${new Date(plan.completedAt).toISOString()}` : '',
      ``,
      `## Decisions`,
      plan.decisions.length > 0 ? plan.decisions.map(d => `- ${d}`).join('\n') : '- None',
      ``,
    ];

    for (const phase of PHASE_ORDER) {
      lines.push(`## Phase: ${phase.toUpperCase()}`);
      lines.push(plan.findings[phase].length > 0
        ? plan.findings[phase].map(f => `- ${f}`).join('\n')
        : '- No findings');
      lines.push('');
    }

    return lines.join('\n');
  }

  dispose(): void {
    this.plans.clear();
  }
}

export function createOmPlanHook(
  _ctx: PluginInput,
  _config: PluginConfig,
  opts?: { transparencyLog?: TransparencyLog },
) {
  const orchestrator = new PlanOrchestrator();
  const tlog = opts?.transparencyLog;

  return {
    orchestrator,

    handleCommandExecuteBefore: async (
      input: { command: string; sessionID: string; arguments: string },
      output: { parts: Array<{ type: string; text?: string }> },
    ): Promise<void> => {
      const arg = input.arguments.trim().toLowerCase();

      if (!arg || arg === 'status') {
        const activePlan = orchestrator.getActivePlan(input.sessionID);
        if (!activePlan) {
          output.parts.length = 0;
          output.parts.push({
            type: 'text',
            text: '**om-plan** — 4-Phase Structured Planning\n\n' +
              'Usage: `/om-plan <phase>`\n\n' +
              'Phases:\n' +
              '  1. **assess** — Analyze requirements and constraints\n' +
              '  2. **assemble** — Gather resources and structure approach\n' +
              '  3. **act** — Execute the plan\n' +
              '  4. **improvise** — Adapt and iterate\n\n' +
              'No active plan. Run `/om-plan assess <topic>` to start.',
          });
          return;
        }

        output.parts.length = 0;
        output.parts.push({
          type: 'text',
          text: orchestrator.getStatusText(activePlan),
        });
        return;
      }

      const phase = arg as PlanPhase;
      if (!PHASE_ORDER.includes(phase)) {
        output.parts.length = 0;
        output.parts.push({
          type: 'text',
          text: `Unknown phase: "${arg}". Available: ${PHASE_ORDER.join(', ')}`,
        });
        return;
      }

      let plan = orchestrator.getActivePlan(input.sessionID);
      if (!plan) {
        plan = orchestrator.startPlan(input.sessionID, arg);
      }

      if (plan.phase !== phase) {
        output.parts.length = 0;
        output.parts.push({
          type: 'text',
          text: `Current phase is **${plan.phase}**. Complete it first or advance with the next phase.`,
        });
        return;
      }

      const prompt = orchestrator.getPhasePrompt(phase);
      const model = orchestrator.getModelForPhase(phase);
      const confidence = phase === 'assess' ? 0.95 : phase === 'assemble' ? 0.85 : phase === 'act' ? 0.80 : 0.90;

      output.parts.length = 0;
      output.parts.push({
        type: 'text',
        text: `**Phase ${PHASE_ORDER.indexOf(phase) + 1}/4: ${phase.toUpperCase()}**\n\nModel: ${model}\nConfidence: ${(confidence * 100).toFixed(0)}%\n\n${prompt}`,
      });

      // Transparency: log plan phase
      if (tlog) {
        tlog.record({
          type: 'plan_phase',
          sessionId: input.sessionID,
          message: `Plan phase ${phase} activated with model ${model}`,
          details: { phase, model, confidence },
          confidence,
        });
      }
      log('[om-plan] phase injected', { sessionId: input.sessionID, phase, model, confidence });
    },
  };
}
