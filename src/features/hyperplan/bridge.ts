import { log } from '../../utils/logger';
import type { HyperplanState } from '../hyperplan';
import type { ReviewWorkState } from '../review-work';

export interface HyperplanReviewContext {
  topic: string;
  constraints: string[];
  changedFiles: string[];
  criticalFindings: string[];
  alternatives: string[];
  memberConsensus: string;
}

export class HyperplanToReviewBridge {
  convertFindings(state: HyperplanState): HyperplanReviewContext {
    const allFindings = state.members.flatMap((m) => m.findings ?? []);
    const critical = allFindings.filter((f) => f.toUpperCase().includes('CRITICAL'));
    const alternatives = state.members
      .filter((m) => m.name === 'Creative')
      .flatMap((m) => m.findings ?? []);

    const passed = state.members.filter((m) => m.verdict === 'PASS').length;
    const failed = state.members.filter((m) => m.verdict === 'FAIL').length;

    return {
      topic: state.topic,
      constraints: [],
      changedFiles: [],
      criticalFindings: critical,
      alternatives,
      memberConsensus: `${passed} passed, ${failed} failed`,
    };
  }

  shouldAutoTrigger(state: HyperplanState): boolean {
    return state.members.some((m) => m.verdict === 'FAIL');
  }

  buildReviewContext(state: HyperplanState): { goal: string; constraints: string[]; changedFiles: string[] } {
    const context = this.convertFindings(state);

    const goal = `Review implementation of: ${state.topic}. Hyperplan found ${context.criticalFindings.length} critical issues.`;

    const constraints = [
      ...context.criticalFindings.map((f) => `Must address: ${f}`),
      ...context.alternatives.slice(0, 3).map((a) => `Consider alternative: ${a}`),
      `Member consensus: ${context.memberConsensus}`,
    ];

    return { goal, constraints, changedFiles: context.changedFiles };
  }

  toReviewWorkState(state: HyperplanState): Partial<ReviewWorkState> {
    const context = this.buildReviewContext(state);
    return {
      sessionId: state.sessionId,
      goal: context.goal,
      constraints: context.constraints,
      changedFiles: context.changedFiles,
    };
  }
}

export function createHyperplanBridge(): HyperplanToReviewBridge {
  return new HyperplanToReviewBridge();
}
