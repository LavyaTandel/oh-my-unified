import { log } from '../../utils/logger';

export type MatchMode = 'includes' | 'exact' | 'regex' | 'fuzzy';

export interface TriggerRule {
  feature: string;
  keywords: string[];
  mode?: MatchMode;
  priority?: number;
  enabled?: boolean;
}

export interface TriggerMatch {
  feature: string;
  matchedKeyword: string;
  priority: number;
  mode: MatchMode;
}

export class TriggerDetector {
  private rules: TriggerRule[] = [];

  register(rule: TriggerRule): void {
    this.rules.push({
      mode: rule.mode ?? 'includes',
      priority: rule.priority ?? 0,
      enabled: rule.enabled ?? true,
      ...rule,
    });
  }

  registerMany(rules: TriggerRule[]): void {
    for (const rule of rules) {
      this.register(rule);
    }
  }

  detect(input: string): TriggerMatch | null {
    const lower = input.toLowerCase();
    const matches: TriggerMatch[] = [];

    for (const rule of this.rules) {
      if (!rule.enabled) continue;
      for (const keyword of rule.keywords) {
        if (this.matches(lower, keyword, rule.mode!)) {
          matches.push({
            feature: rule.feature,
            matchedKeyword: keyword,
            priority: rule.priority!,
            mode: rule.mode!,
          });
          break;
        }
      }
    }

    if (matches.length === 0) return null;
    matches.sort((a, b) => b.priority - a.priority);
    const winner = matches[0];

    log('[trigger-detector] matched', {
      feature: winner.feature,
      keyword: winner.matchedKeyword,
      priority: winner.priority,
      totalMatches: matches.length,
    });

    return winner;
  }

  detectAll(input: string): TriggerMatch[] {
    const lower = input.toLowerCase();
    const matches: TriggerMatch[] = [];

    for (const rule of this.rules) {
      if (!rule.enabled) continue;
      for (const keyword of rule.keywords) {
        if (this.matches(lower, keyword, rule.mode!)) {
          matches.push({
            feature: rule.feature,
            matchedKeyword: keyword,
            priority: rule.priority!,
            mode: rule.mode!,
          });
          break;
        }
      }
    }

    matches.sort((a, b) => b.priority - a.priority);
    return matches;
  }

  isEnabled(feature: string): boolean {
    return this.rules.some((r) => r.feature === feature && r.enabled);
  }

  setEnabled(feature: string, enabled: boolean): void {
    for (const rule of this.rules) {
      if (rule.feature === feature) {
        rule.enabled = enabled;
      }
    }
  }

  getRules(): TriggerRule[] {
    return [...this.rules];
  }

  clear(): void {
    this.rules = [];
  }

  private matches(input: string, keyword: string, mode: MatchMode): boolean {
    switch (mode) {
      case 'includes':
        return input.includes(keyword.toLowerCase());
      case 'exact':
        return input === keyword.toLowerCase();
      case 'regex': {
        try {
          const re = new RegExp(keyword, 'i');
          return re.test(input);
        } catch {
          return false;
        }
      }
      case 'fuzzy': {
        const kw = keyword.toLowerCase();
        if (input.includes(kw)) return true;
        let inputIdx = 0;
        let kwIdx = 0;
        while (inputIdx < input.length && kwIdx < kw.length) {
          if (input[inputIdx] === kw[kwIdx]) kwIdx++;
          inputIdx++;
        }
        return kwIdx === kw.length;
      }
      default:
        return false;
    }
  }
}

export function createDefaultTriggerDetector(): TriggerDetector {
  const detector = new TriggerDetector();

  detector.registerMany([
    {
      feature: 'security-research',
      keywords: [
        'security research', 'security audit', 'vulnerability scan',
        'threat model', 'pen test', 'pentest', 'security review',
        'OWASP', 'STRIDE', 'attack surface', 'security assessment',
      ],
      priority: 100,
    },
    {
      feature: 'review-work',
      keywords: [
        'review work', 'review my work', 'review changes',
        'qa my work', 'verify implementation', 'check my work',
        'validate changes', 'post-implementation review',
        'review this', 'code review', 'quality check',
      ],
      priority: 90,
    },
    {
      feature: 'hyperplan',
      keywords: [
        'hyperplan', 'adversarial plan', 'adversarial planning',
        'challenge this plan', 'stress test', 'red team',
      ],
      priority: 80,
    },
    {
      feature: 'ralph-loop',
      keywords: [
        'ralph loop', 'iterate on this', 'refine this',
        'improve this', 'verify this', 'loop on this',
      ],
      priority: 70,
    },
  ]);

  return detector;
}
