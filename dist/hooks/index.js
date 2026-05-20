export { createBackgroundNotificationHook } from './background-notification';
export { createModelFallbackHook } from './model-fallback';
export { createPhaseReminderHook } from './phase-reminder';
export { createJsonErrorRecoveryHook } from './json-error-recovery';
export { createEditErrorRecoveryHook } from './edit-error-recovery';
export { createCompactionContextInjectorHook } from './compaction-context-injector';
export { createAgentUsageReminderHook } from './agent-usage-reminder';
export { createDirectoryContextInjectorHook } from './directory-context-injector';
export { createAutoCommandDetectorHook } from './auto-command-detector';
export { createPostToolNudgeHook } from './post-tool-nudge';
export { createTodoContinuationHook } from './todo-continuation';
// Synthesized hooks — combine best patterns from openagent + slim
export { createSynthesizedHooks, createContextWindowMonitor, createFileWriteGuard, createOverwriteProtection, createTaskReminder, createModelSelectionHook, createErrorRecoveryHook, createWebFetchGuard, createDiffEnhancer, createEmptyResponseDetector, createCommentChecker, createFsyncWarning, } from './synthesized-hooks';
//# sourceMappingURL=index.js.map