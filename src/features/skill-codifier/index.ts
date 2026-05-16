import { log } from '../../utils/logger';

export interface PatternOccurrence {
  pattern: string;
  category: string;
  sessionId: string;
  timestamp: number;
  success: boolean;
  modelUsed?: string;
  tokensUsed?: number;
}

export interface SkillTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  triggerPatterns: string[];
  template: string;
  confidence: number;
  occurrenceCount: number;
  lastUsedAt: number;
  createdAt: number;
}

export interface SkillGenerationResult {
  generated: boolean;
  skill?: SkillTemplate;
  reason: string;
}

export class SkillCodifier {
  private occurrences: Map<string, PatternOccurrence[]> = new Map();
  private generatedSkills: Map<string, SkillTemplate> = new Map();
  private threshold: number;

  constructor(options?: { threshold?: number }) {
    this.threshold = options?.threshold ?? 5; // Default: generate skill after 5 occurrences
  }

  recordOccurrence(occurrence: PatternOccurrence): void {
    const key = `${occurrence.category}:${occurrence.pattern}`;
    const list = this.occurrences.get(key) ?? [];
    list.push(occurrence);
    this.occurrences.set(key, list);

    log('[skill-codifier] occurrence recorded', {
      pattern: occurrence.pattern,
      category: occurrence.category,
      count: list.length,
    });
  }

  shouldGenerateSkill(category: string, pattern: string): SkillGenerationResult {
    const key = `${category}:${pattern}`;
    const occurrences = this.occurrences.get(key) ?? [];

    if (occurrences.length < this.threshold) {
      return {
        generated: false,
        reason: `Only ${occurrences.length}/${this.threshold} occurrences recorded`,
      };
    }

    // Check if already generated
    if (this.generatedSkills.has(key)) {
      return {
        generated: false,
        reason: 'Skill already generated for this pattern',
      };
    }

    // Calculate success rate
    const successCount = occurrences.filter(o => o.success).length;
    const successRate = successCount / occurrences.length;

    if (successRate < 0.6) {
      return {
        generated: false,
        reason: `Success rate too low (${(successRate * 100).toFixed(0)}%)`,
      };
    }

    // Generate skill template
    const skill = this.generateSkillTemplate(category, pattern, occurrences, successRate);
    this.generatedSkills.set(key, skill);

    return {
      generated: true,
      skill,
      reason: `Pattern occurred ${occurrences.length} times with ${(successRate * 100).toFixed(0)}% success rate`,
    };
  }

  private generateSkillTemplate(
    category: string,
    pattern: string,
    occurrences: PatternOccurrence[],
    successRate: number,
  ): SkillTemplate {
    const id = `skill-${category}-${pattern.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}`;
    const name = `${category} ${pattern.slice(0, 30)}`;
    const description = `Auto-generated skill for ${category}: ${pattern}`;

    // Extract common trigger patterns
    const triggerPatterns = occurrences
      .map(o => o.pattern)
      .filter((v, i, a) => a.indexOf(v) === i)
      .slice(0, 5);

    // Generate template from successful occurrences
    const successfulOccurrences = occurrences.filter(o => o.success);
    const template = this.buildTemplateFromOccurrences(successfulOccurrences, category);

    return {
      id,
      name,
      description,
      category,
      triggerPatterns,
      template,
      confidence: successRate,
      occurrenceCount: occurrences.length,
      lastUsedAt: occurrences[occurrences.length - 1].timestamp,
      createdAt: Date.now(),
    };
  }

  private buildTemplateFromOccurrences(occurrences: PatternOccurrence[], category: string): string {
    const lines: string[] = [];
    lines.push(`# Auto-Generated Skill: ${category}`);
    lines.push('');
    lines.push('## Description');
    lines.push(`This skill was automatically generated from ${occurrences.length} successful occurrences.`);
    lines.push('');
    lines.push('## When to Use');
    lines.push('- When the user request matches the trigger patterns');
    lines.push('- When similar tasks have been completed successfully before');
    lines.push('');
    lines.push('## Steps');
    lines.push('1. Identify the user intent');
    lines.push('2. Apply the learned pattern');
    lines.push('3. Verify the result');
    lines.push('');
    lines.push('## Notes');
    lines.push('- This is an auto-generated skill. Review and refine as needed.');
    lines.push('- Confidence: ' + (occurrences.length / (occurrences.length + 1) * 100).toFixed(0) + '%');

    return lines.join('\n');
  }

  getGeneratedSkills(): SkillTemplate[] {
    return Array.from(this.generatedSkills.values());
  }

  getSkill(id: string): SkillTemplate | undefined {
    return this.generatedSkills.get(id);
  }

  getStats(): {
    totalOccurrences: number;
    uniquePatterns: number;
    generatedSkills: number;
    avgOccurrencesPerPattern: number;
  } {
    let totalOccurrences = 0;
    for (const list of this.occurrences.values()) {
      totalOccurrences += list.length;
    }

    return {
      totalOccurrences,
      uniquePatterns: this.occurrences.size,
      generatedSkills: this.generatedSkills.size,
      avgOccurrencesPerPattern: this.occurrences.size > 0
        ? totalOccurrences / this.occurrences.size
        : 0,
    };
  }

  clear(): void {
    this.occurrences.clear();
    this.generatedSkills.clear();
  }
}

export function createSkillCodifier(options?: { threshold?: number }): SkillCodifier {
  return new SkillCodifier(options);
}
