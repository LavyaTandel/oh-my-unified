import { log } from '../utils/logger';
import { createModelFallbackHook, createPhaseReminderHook, createJsonErrorRecoveryHook, createEditErrorRecoveryHook, createCompactionContextInjectorHook, createAgentUsageReminderHook, createDirectoryContextInjectorHook, createAutoCommandDetectorHook, createPostToolNudgeHook, createTodoContinuationHook, createBackgroundNotificationHook, createSynthesizedHooks, } from './index';
import { createProactiveFallbackHook } from './proactive-fallback';
import { createDefaultTriggerDetector } from '../features/trigger-detector';
import { createRalphLoopHook } from '../features/ralph-loop';
import { createReviewWorkHook } from '../features/review-work/hook';
import { createHyperplanHook } from '../features/hyperplan/hook';
import { createSecurityResearchHook } from '../features/security-research/hook';
import { createHyperplanBridge } from '../features/hyperplan/bridge';
import { createSecurityAutoTrigger } from '../features/security-research/auto-trigger';
import { SecurityResearchStore } from '../features/security-research/persistence';
import { createMetricsCollector } from '../features/metrics';
import { createCircuitBreakerRegistry } from '../features/circuit-breaker';
import { createLearningEngine } from '../features/learning-engine';
import { createModelPredictor } from '../features/model-predictor';
import { createBenchmarkTracker } from '../features/benchmark-tracker';
import { createPluginRegistry } from '../features/plugin-registry';
import { createSkillCodifier } from '../features/skill-codifier';
import { createSessionRouter } from '../features/session-router';
import { createIntegrationHub } from '../features/integration-hub';
import { createTransparencyLog } from '../features/transparency-log';
import { ConcurrencyManager } from '../background/concurrency-manager';
import { ModelCapabilitiesCache } from '../features/model-capabilities/cache';
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
export function createUnifiedHooks(ctx, config, hookConfig, runtimeChains, features) {
    // ── Instantiate sub-hooks ────────────────────────────────────────────────
    const modelFallback = createModelFallbackHook(ctx, config, {
        enabled: config.fallback?.enabled !== false,
        chains: runtimeChains ?? {},
        maxAttempts: 3,
    });
    const phaseReminder = createPhaseReminderHook(ctx, config);
    const jsonErrorRecovery = createJsonErrorRecoveryHook(ctx, config);
    const editErrorRecovery = createEditErrorRecoveryHook(ctx, config);
    const compactionContext = createCompactionContextInjectorHook(ctx, config);
    const agentUsageReminder = createAgentUsageReminderHook(ctx, config);
    const directoryContext = createDirectoryContextInjectorHook(ctx, config);
    const autoCommandDetector = createAutoCommandDetectorHook(ctx, config);
    const postToolNudge = createPostToolNudgeHook(ctx, config);
    const todoContinuation = createTodoContinuationHook(ctx, config);
    const backgroundNotification = createBackgroundNotificationHook(ctx, config, {
        taskEngine: features?.taskEngine,
    });
    const synthesized = createSynthesizedHooks(ctx, config, hookConfig);
    const integrationHub = createIntegrationHub();
    const transparencyLog = createTransparencyLog();
    const circuitBreakers = createCircuitBreakerRegistry();
    const triggerDetector = createDefaultTriggerDetector();
    // Create circuit breakers for each feature module
    const reviewWorkBreaker = circuitBreakers.create('review-work', { failureThreshold: 3, recoveryTimeoutMs: 30000 });
    const hyperplanBreaker = circuitBreakers.create('hyperplan', { failureThreshold: 3, recoveryTimeoutMs: 30000 });
    const securityResearchBreaker = circuitBreakers.create('security-research', { failureThreshold: 3, recoveryTimeoutMs: 30000 });
    const modelFallbackBreaker = circuitBreakers.create('model-fallback', { failureThreshold: 5, recoveryTimeoutMs: 60000 });
    const proactiveFallbackBreaker = circuitBreakers.create('proactive-fallback', { failureThreshold: 5, recoveryTimeoutMs: 60000 });
    // ── Create feature hooks (after transparencyLog) ─────────────────────────
    const concurrencyManager = new ConcurrencyManager();
    const modelCapabilities = new ModelCapabilitiesCache();
    const proactiveFallback = createProactiveFallbackHook(ctx, config, {
        enabled: config.fallback?.enabled !== false,
        chains: runtimeChains ?? {},
    });
    const ralphLoop = createRalphLoopHook(ctx);
    const reviewWork = createReviewWorkHook(ctx, config, undefined, { transparencyLog });
    const hyperplan = createHyperplanHook(ctx, config);
    const securityResearch = createSecurityResearchHook(ctx, config);
    const hyperplanBridge = createHyperplanBridge();
    const securityAutoTrigger = createSecurityAutoTrigger();
    const securityStore = new SecurityResearchStore(':memory:');
    const metricsCollector = createMetricsCollector(':memory:', { dailyBudget: 10.0 });
    const learningEngine = createLearningEngine(':memory:');
    const modelPredictor = createModelPredictor();
    const benchmarkTracker = createBenchmarkTracker(':memory:');
    const pluginRegistry = createPluginRegistry();
    const skillCodifier = createSkillCodifier({ threshold: 5 });
    const sessionRouter = createSessionRouter();
    // ── Helpers ──────────────────────────────────────────────────────────────
    async function safeCallWithBreaker(breaker, hook, ...args) {
        if (!hook)
            return;
        try {
            await breaker.execute(async () => hook(...args));
        }
        catch (err) {
            const name = hook.name || 'anonymous';
            log(`[unified-hooks] error in ${name}:`, { error: String(err) });
            // Metrics: track feature errors
            metricsCollector.record({
                type: 'feature_error',
                sessionId: 'unknown',
                feature: breaker.name,
                metadata: JSON.stringify({ error: String(err) }),
            });
        }
    }
    async function safeCall(hook, ...args) {
        if (!hook)
            return;
        try {
            await hook(...args);
        }
        catch (err) {
            const name = hook.name || 'anonymous';
            log(`[unified-hooks] error in ${name}:`, { error: String(err) });
        }
    }
    return {
        // ── event ──────────────────────────────────────────────────────────────
        event: async (input) => {
            // Runtime model fallback (reactive mid-conversation switching)
            await safeCall(() => modelFallback.handleEvent(input.event));
            // Synthesized hooks event handlers
            await safeCall(synthesized['event'], input);
            // Background notification — map OpenCode events to internal handlers
            const bgMap = {
                'session.idle': 'oh-my-unified.session.idle',
                'message.updated': 'oh-my-unified.message.updated',
                'todo.updated': 'oh-my-unified.todo.updated',
                'session.error': 'oh-my-unified.session.error',
                'oh-my-unified.session.idle': 'oh-my-unified.session.idle',
                'oh-my-unified.message.updated': 'oh-my-unified.message.updated',
                'oh-my-unified.todo.updated': 'oh-my-unified.todo.updated',
                'oh-my-unified.session.error': 'oh-my-unified.session.error',
            };
            const bgKey = bgMap[input.event.type];
            if (bgKey) {
                await safeCall(backgroundNotification[bgKey], input, {});
            }
            // Todo continuation — map OpenCode events to internal handlers
            const todoMap = {
                'session.start': 'session.start',
                'session.end': 'session.end',
                'todo.updated': 'todo.updated',
            };
            const todoKey = todoMap[input.event.type];
            if (todoKey) {
                await safeCall(todoContinuation[todoKey], input, {});
            }
            // Proactive fallback — record errors/successes from session events
            if (input.event.type === 'session.error') {
                const props = input.event.properties;
                const model = props?.model ?? props?.modelId;
                if (model)
                    proactiveFallback.recordError(model);
                if (features?.agentSelector && typeof props?.agent === 'string') {
                    features.agentSelector.recordError(props.agent);
                }
                if (features?.systemObserver) {
                    features.systemObserver.recordTaskLaunch();
                }
                // Metrics: track model errors
                if (model) {
                    metricsCollector.record({
                        type: 'feature_error',
                        sessionId: 'unknown',
                        model,
                        feature: 'model-fallback',
                    });
                }
                // Transparency: log model error
                if (features?.transparencyLog) {
                    features.transparencyLog.record({
                        type: 'error',
                        sessionId: 'unknown',
                        message: `Model ${model} encountered an error`,
                        details: { model, event: 'session.error' },
                    });
                }
            }
            else if (input.event.type === 'message.completed') {
                const props = input.event.properties;
                const model = props?.model ?? props?.modelId;
                if (model)
                    proactiveFallback.recordSuccess(model);
                if (features?.systemObserver) {
                    features.systemObserver.recordTaskCompletion(typeof props?.agent === 'string' ? props.agent : undefined);
                }
                // Metrics: track model success
                if (model) {
                    metricsCollector.record({
                        type: 'feature_success',
                        sessionId: 'unknown',
                        model,
                        feature: 'model-fallback',
                    });
                }
                // Tier 2: Record model outcome for prediction
                if (model && features?.modelPredictor) {
                    features.modelPredictor.recordOutcome(model, 'general', true);
                }
                // Transparency: log model success
                if (features?.transparencyLog) {
                    features.transparencyLog.record({
                        type: 'model_routing',
                        sessionId: 'unknown',
                        message: `Model ${model} completed successfully`,
                        details: { model, event: 'message.completed' },
                        confidence: 0.9,
                    });
                }
                // Tier 2: Record benchmark for performance tracking
                if (model && features?.benchmarkTracker) {
                    const props = input.event.properties;
                    const latency = props?.latencyMs ?? 0;
                    const inputTokens = props?.inputTokens ?? 0;
                    const outputTokens = props?.outputTokens ?? 0;
                    const cost = props?.cost ?? 0;
                    const quality = props?.qualityScore ?? 7.0;
                    features.benchmarkTracker.record({
                        model,
                        taskCategory: 'general',
                        sessionId: 'unknown',
                        latencyMs: latency,
                        inputTokens,
                        outputTokens,
                        cost,
                        qualityScore: quality,
                        timestamp: Date.now(),
                    });
                    // Transparency: log benchmark record
                    if (features?.transparencyLog) {
                        features.transparencyLog.record({
                            type: 'benchmark_recorded',
                            sessionId: 'unknown',
                            message: `Benchmark recorded for ${model}: ${latency}ms, cost ${cost}`,
                            details: { model, latencyMs: latency, cost, qualityScore: quality },
                        });
                    }
                }
            }
            // Ralph Loop — session cleanup
            await safeCall(ralphLoop['event'], input);
            // Concurrency manager — track session lifecycle
            if (input.event.type === 'session.end') {
                const props = input.event.properties;
                const model = props?.model ?? props?.modelId;
                if (model)
                    concurrencyManager.release(model);
            }
        },
        // ── tool.execute.before ────────────────────────────────────────────────
        'tool.execute.before': async (input, output) => {
            await safeCall(synthesized['tool.execute.before'], input, output);
            await safeCall(autoCommandDetector['message.before'], input, output);
            await safeCall(directoryContext['message.before'], input, output);
            await safeCall(phaseReminder['message.before'], input, output);
        },
        // ── tool.execute.after ─────────────────────────────────────────────────
        'tool.execute.after': async (input, output) => {
            await safeCall(synthesized['tool.execute.after'], input, output);
            await safeCall(editErrorRecovery['tool.after'], input, output);
            await safeCall(jsonErrorRecovery['tool.after'], input, output);
            await safeCall(agentUsageReminder['tool.after'], input, output);
            await safeCall(postToolNudge['tool.after'], input, output);
            // Ralph Loop — detect completion signals
            await safeCall(ralphLoop['tool.execute.after'], input, output);
            // Hyperplan Bridge — auto-trigger review-work on FAIL verdicts
            if (hyperplan.manager) {
                const state = hyperplan.manager.getState(input.sessionID);
                if (state && hyperplanBridge.shouldAutoTrigger(state)) {
                    const reviewContext = hyperplanBridge.toReviewWorkState(state);
                    log('[hyperplan-bridge] auto-triggering review-work', {
                        sessionId: input.sessionID,
                        goal: reviewContext.goal,
                    });
                    await safeCall(() => reviewWork.activate({ sessionID: input.sessionID, agent: input.tool }, { message: {}, parts: [{ type: 'system', text: `Auto-triggered review-work: ${reviewContext.goal}` }] }));
                }
            }
            // Security Auto-Trigger — detect sensitive file writes and queue research
            const filePath = input.args?.path;
            const fileContent = output.output ?? '';
            if (filePath && securityAutoTrigger.shouldTrigger(filePath, fileContent)) {
                const result = securityAutoTrigger.detectSensitiveWrite(filePath, fileContent);
                if (result) {
                    securityAutoTrigger.queueResearch(input.sessionID, result.reason);
                    log('[security-auto-trigger] triggered', { filePath, reason: result.reason, severity: result.severity });
                }
            }
        },
        // ── chat.message ───────────────────────────────────────────────────────
        'chat.message': async (input, output) => {
            await safeCall(synthesized['chat.message'], input, output);
            if (features?.agentSelector) {
                const parts = output.parts;
                if (parts) {
                    const userText = parts
                        .filter((p) => p.type === 'text')
                        .map((p) => p.text ?? '')
                        .join(' ')
                        .trim();
                    // Handle /agents command — show agent list
                    if (userText === '/agents' || userText === '/') {
                        const agentList = features.agentSelector.getSlashCommandOutput();
                        // Replace user text part with agent list
                        const textIdx = parts.findIndex((p) => p.type === 'text');
                        if (textIdx >= 0) {
                            parts[textIdx] = { type: 'text', text: agentList };
                        }
                        else {
                            output.parts.push({ type: 'text', text: agentList });
                        }
                        return;
                    }
                    // Agent selected via @mention — inject metadata
                    if (input.agent) {
                        const agent = features.agentSelector.getAgentByMention(input.agent);
                        if (agent) {
                            features.agentSelector.recordSuccess(agent.name);
                            const meta = [
                                `**${agent.displayName}** — ${agent.role}`,
                                `Model: ${agent.currentModel}`,
                                `Health: ${agent.healthStatus}`,
                                agent.assignedMCPs.length > 0 ? `MCPs: ${agent.assignedMCPs.join(', ')}` : '',
                            ].filter(Boolean).join('\n');
                            output.parts.push({
                                type: 'system',
                                text: meta,
                            });
                        }
                    }
                    // Context-based agent suggestions (throttled to prevent per-message spam)
                    if (userText.length > 0 && !input.agent) {
                        const suggestions = features.agentSelector.getSuggestions(userText, input.sessionID);
                        if (suggestions.length > 0) {
                            const suggestionText = suggestions
                                .map((s) => `Consider **${s.agent.displayName}** — ${s.reason} (${s.agent.currentModel})`)
                                .join('\n');
                            output.parts.push({
                                type: 'system',
                                text: suggestionText,
                            });
                        }
                    }
                }
            }
            // Unified trigger detection — single detector routes to correct feature
            const parts = output.parts;
            if (parts) {
                const userText = parts
                    .filter((p) => p.type === 'text')
                    .map((p) => p.text ?? '')
                    .join(' ');
                const match = triggerDetector.detect(userText);
                if (match) {
                    // Transparency: log feature trigger
                    if (features?.transparencyLog) {
                        features.transparencyLog.record({
                            type: 'feature_trigger',
                            sessionId: input.sessionID ?? 'unknown',
                            message: `Triggered ${match.feature} via "${userText.slice(0, 50)}..."`,
                            details: { feature: match.feature, keyword: match.matchedKeyword },
                        });
                    }
                    switch (match.feature) {
                        case 'review-work':
                            await safeCallWithBreaker(reviewWorkBreaker, () => reviewWork.activate(input, output));
                            break;
                        case 'hyperplan':
                            await safeCallWithBreaker(hyperplanBreaker, () => hyperplan.activate(input, output));
                            break;
                        case 'security-research':
                            await safeCallWithBreaker(securityResearchBreaker, () => securityResearch.activate(input, output));
                            break;
                    }
                }
            }
            // Record agent activity in SystemObserver
            if (features?.systemObserver && input.agent) {
                features.systemObserver.recordAgentActivity(input.agent);
            }
            // Tier 2: Inject relevant lessons from cross-session learning
            if (features?.learningEngine && parts) {
                const userText = parts
                    .filter((p) => p.type === 'text')
                    .map((p) => p.text ?? '')
                    .join(' ');
                if (userText.length > 10) {
                    const lessons = features.learningEngine.findRelevantLessons('planning', userText);
                    if (lessons.length > 0) {
                        const lessonText = lessons
                            .slice(0, 3)
                            .map((l) => `Learned: ${l.lesson.description} (${(l.similarity * 100).toFixed(0)}% match)`)
                            .join('\n');
                        output.parts.push({
                            type: 'system',
                            text: lessonText,
                        });
                        // Transparency: log learning applied
                        if (features.transparencyLog) {
                            features.transparencyLog.record({
                                type: 'learning_applied',
                                sessionId: input.sessionID ?? 'unknown',
                                message: `Applied ${lessons.length} relevant lessons`,
                                details: { lessonCount: lessons.length, topMatch: (lessons[0].similarity * 100).toFixed(0) + '%' },
                                confidence: lessons[0]?.similarity ?? 0,
                            });
                        }
                    }
                }
            }
            // Tier 3: Execute plugin hooks
            if (features?.pluginRegistry) {
                await features.pluginRegistry.executeHooks('chat.message', input, output);
            }
        },
        // ── chat.params ────────────────────────────────────────────────────────
        'chat.params': async (input, output) => {
            // Proactive model fallback — intercept chat.params to override model
            // when error rates exceed threshold
            await safeCall(proactiveFallback['chat.params'], input, output);
            // Model Router — intelligent model selection based on agent requirements
            if (features?.modelRouter) {
                const route = features.modelRouter.routeForAgent(input.agent);
                // Tier 2: Use model predictor for better routing
                let selectedModel = route.assignedModel;
                if (features?.modelPredictor && input.agent) {
                    const prediction = features.modelPredictor.predictBestModel('general', [selectedModel]);
                    if (prediction.confidence > 0.7) {
                        selectedModel = prediction.recommendedModel;
                        log('[model-predictor] override', {
                            agent: input.agent,
                            model: selectedModel,
                            confidence: prediction.confidence,
                        });
                        // Transparency: log prediction
                        if (features?.transparencyLog) {
                            features.transparencyLog.record({
                                type: 'prediction_made',
                                sessionId: input.sessionID ?? 'unknown',
                                message: `Model predictor recommended ${selectedModel} over ${route.assignedModel}`,
                                details: { agent: input.agent, predicted: selectedModel, base: route.assignedModel },
                                confidence: prediction.confidence,
                            });
                        }
                    }
                }
                if (selectedModel !== 'default' && selectedModel !== 'none') {
                    log('[model-router] routed', { agent: input.agent, model: selectedModel, reason: route.reason });
                    // Metrics: track model routing decisions
                    metricsCollector.record({
                        type: 'model_routing',
                        sessionId: input.sessionID ?? 'unknown',
                        agent: input.agent,
                        model: selectedModel,
                        feature: 'model-router',
                        metadata: JSON.stringify({ reason: route.reason }),
                    });
                }
            }
        },
        // ── command.execute.before ─────────────────────────────────────────────
        'command.execute.before': async (input, output) => {
            // om-plan and om-audit hooks are wired directly in index.ts
        },
    };
}
//# sourceMappingURL=delegation.js.map