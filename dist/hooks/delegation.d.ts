import type { PluginInput, Hooks } from '@opencode-ai/plugin';
import type { PluginConfig } from '../config';
import { type SynthesizedHooksConfig } from './index';
import type { MetricsCollector } from '../features/metrics';
import type { LearningEngine } from '../features/learning-engine';
import type { ModelPredictor } from '../features/model-predictor';
import type { BenchmarkTracker } from '../features/benchmark-tracker';
import type { PluginRegistry } from '../features/plugin-registry';
import type { SkillCodifier } from '../features/skill-codifier';
import type { SessionRouter } from '../features/session-router';
import type { IntegrationHub } from '../features/integration-hub';
import type { TransparencyLog } from '../features/transparency-log';
import type { PersistentTaskEngine } from '../background/persistent-task-engine';
import type { AgentSelector } from '../features/agent-selector';
import type { SystemObserver } from '../features/system-observer';
import type { InterviewEngine } from '../interview/server';
import type { SkillMcpManager } from '../features/skill-mcp-manager';
import type { ModelRouter } from '../features/model-router/router';
export type { SynthesizedHooksConfig } from './synthesized-hooks';
export interface FeatureModules {
    agentSelector?: AgentSelector;
    systemObserver?: SystemObserver;
    taskEngine?: PersistentTaskEngine;
    interviewEngine?: InterviewEngine;
    skillMcpManager?: SkillMcpManager;
    modelRouter?: ModelRouter;
    metricsCollector?: MetricsCollector;
    learningEngine?: LearningEngine;
    modelPredictor?: ModelPredictor;
    benchmarkTracker?: BenchmarkTracker;
    pluginRegistry?: PluginRegistry;
    skillCodifier?: SkillCodifier;
    sessionRouter?: SessionRouter;
    integrationHub?: IntegrationHub;
    transparencyLog?: TransparencyLog;
}
/**
 * Delegation layer — maps standard OpenCode hook names to our internal sub-hooks.
 *
 * OpenCode's Hooks interface only recognizes standard names:
 *   event, tool.execute.before, tool.execute.after, chat.message, chat.params,
 *   chat.headers, permission.ask, command.execute.before, shell.env,
 *   tool.definition, experimental.*
 *
 * Without this layer, our hooks (which used oh-my-unified.* prefixed names)
 * were never registered with OpenCode. This mirrors openagent's architecture:
 * plugin-interface.ts + tool-execute-before.ts + tool-execute-after.ts + event.ts
 */
export declare function createUnifiedHooks(ctx: PluginInput, config: PluginConfig, hookConfig?: SynthesizedHooksConfig, runtimeChains?: Record<string, string[]>, features?: FeatureModules): Hooks;
//# sourceMappingURL=delegation.d.ts.map