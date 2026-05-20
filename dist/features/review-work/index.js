import { log } from '../../utils/logger';
const REVIEW_AGENTS = [
    { name: 'Goal Verifier', focus: 'Did we build what was asked?', type: 'oracle' },
    { name: 'QA Executor', focus: 'Does it actually work?', type: 'executor' },
    { name: 'Code Reviewer', focus: 'Is the code well-written?', type: 'oracle' },
    { name: 'Security Auditor', focus: 'Is it secure?', type: 'oracle' },
    { name: 'Context Miner', focus: 'Did we miss any context?', type: 'executor' },
];
export class ReviewWorkManager {
    sessions = new Map();
    startReview(sessionId, goal, constraints, changedFiles) {
        const state = {
            sessionId,
            goal,
            constraints,
            changedFiles,
            agents: [],
            startedAt: Date.now(),
            completed: false,
        };
        this.sessions.set(sessionId, state);
        log('[review-work] started', { sessionId, goal: goal.slice(0, 100), agentCount: REVIEW_AGENTS.length });
        return state;
    }
    getReviewPrompt(agentIndex, state) {
        const agent = REVIEW_AGENTS[agentIndex];
        if (!agent)
            return '';
        const fileContext = state.changedFiles.map((f) => `## ${f}`).join('\n');
        const prompts = {
            0: `# Goal & Constraint Verification

<original_goal>${state.goal}</original_goal>
<constraints>${state.constraints.join('\n')}</constraints>
<changed_files>${state.changedFiles.join('\n')}</changed_files>
<file_contents>${fileContext}</file_contents>

Review whether this implementation correctly achieves the stated goal within constraints.

CHECKLIST:
1. Goal Completeness — mark ACHIEVED/MISSED/PARTIAL for each sub-requirement
2. Constraint Compliance — verify with code evidence
3. Requirement Gaps — implied but unstated needs
4. Over-Engineering — scope creep or unnecessary abstractions
5. Edge Cases — trace 5+ edge cases mentally
6. Behavioral Correctness — walk through 3+ scenarios

OUTPUT: <verdict>PASS|FAIL</verdict> <confidence>HIGH|MEDIUM|LOW</confidence> <summary>...</summary> <blocking_issues>...</blocking_issues>`,
            1: `# QA — Hands-On App Execution

<original_goal>${state.goal}</original_goal>
<changed_files>${state.changedFiles.join('\n')}</changed_files>

You are a QA engineer. Test behavior, not code.

PROCESS:
1. Scenario Brainstorm — 15-30 scenarios (happy paths, boundaries, errors, regressions, state transitions)
2. Scenario Augmentation — add 5+ from reflection
3. Create Task List — P0/P1/P2 priority
4. Execute Systematically — record PASS/FAIL with evidence
5. Compile Results

OUTPUT: <verdict>PASS|FAIL</verdict> <scenario_coverage>...</scenario_coverage> <blocking_issues>P0/P1 failures only</blocking_issues>`,
            2: `# Code Quality Review

<original_goal>${state.goal}</original_goal>
<changed_files>${state.changedFiles.join('\n')}</changed_files>
<file_contents>${fileContext}</file_contents>

Senior staff engineer review. Standard: "Would I approve this PR without comments?"

DIMENSIONS: Correctness, Pattern Consistency, Naming, Error Handling, Type Safety, Performance, Abstraction Level, Testing, API Design, Tech Debt.

OUTPUT: <verdict>PASS|FAIL</verdict> <confidence>HIGH|MEDIUM|LOW</confidence> <findings>...</findings> <blocking_issues>CRITICAL/MAJOR only</blocking_issues>`,
            3: `# Security Review (supplementary)

<original_goal>${state.goal}</original_goal>
<changed_files>${state.changedFiles.join('\n')}</changed_files>
<file_contents>${fileContext}</file_contents>

Security engineer review. Focus ONLY on vulnerabilities.

CHECKLIST: Input Validation, Auth & AuthZ, Secrets & Credentials, Data Exposure, Dependencies, Cryptography, File & Path, Network, Error Leakage, Supply Chain.

OUTPUT: <verdict>PASS|FAIL</verdict> <severity>CRITICAL|HIGH|MEDIUM|LOW|NONE</severity> <findings>...</findings> <blocking_issues>CRITICAL/HIGH only</blocking_issues>`,
            4: `# Context Mining — Missed Requirements

<original_goal>${state.goal}</original_goal>
<changed_files>${state.changedFiles.join('\n')}</changed_files>

Search every accessible source for context that should have informed this implementation.

SOURCES: Git history (log, blame), GitHub (issues, PRs), Communication channels, Codebase cross-references.

LOOK FOR: Requirements in issues/PRs, past decisions, related systems, warnings from previous developers, migration notes, design docs.

OUTPUT: <verdict>PASS|FAIL</verdict> <sources_searched>...</sources_searched> <discovered_context>...</discovered_context> <missed_requirements>...</missed_requirements> <blocking_issues>BLOCKING only</blocking_issues>`,
        };
        return prompts[agentIndex] ?? '';
    }
    submitResult(sessionId, result) {
        const state = this.sessions.get(sessionId);
        if (!state)
            return;
        state.agents.push(result);
        log('[review-work] agent result', {
            sessionId,
            agent: result.agentName,
            verdict: result.verdict,
            totalAgents: state.agents.length,
        });
        if (state.agents.length === REVIEW_AGENTS.length) {
            state.completed = true;
            const allPassed = state.agents.every((a) => a.verdict === 'PASS');
            log('[review-work] completed', { sessionId, allPassed });
        }
    }
    getReport(sessionId) {
        const state = this.sessions.get(sessionId);
        if (!state || !state.completed)
            return null;
        const allPassed = state.agents.every((a) => a.verdict === 'PASS');
        const rows = state.agents
            .map((a, i) => `| ${i + 1} | ${a.agentName} | ${a.focus} | ${a.verdict} | ${a.confidence} |`)
            .join('\n');
        const blocking = state.agents
            .flatMap((a) => a.blockingIssues.map((b) => `- **${a.agentName}**: ${b}`))
            .join('\n');
        return `# Review Work — Final Report

## Overall Verdict: ${allPassed ? 'PASSED' : 'FAILED'}

| # | Review Area | Focus | Verdict | Confidence |
|---|------------|-------|---------|------------|
${rows}

## Blocking Issues
${blocking || 'None'}

## Summary
${state.agents.map((a) => `- **${a.agentName}**: ${a.summary}`).join('\n')}`;
    }
    getState(sessionId) {
        return this.sessions.get(sessionId);
    }
    dispose() {
        this.sessions.clear();
    }
}
//# sourceMappingURL=index.js.map