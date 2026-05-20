export interface OnboardingOption {
    number: number;
    icon: string;
    label: string;
    description: string;
    action: string;
}
export interface OnboardingContext {
    agentCount: number;
    mcpCount: number;
    userName?: string;
    isFirstRun?: boolean;
}
export declare class OnboardingGuide {
    private ctx;
    constructor(ctx: OnboardingContext);
    getOptions(): OnboardingOption[];
    getWelcomeMessage(): string;
    handleOption(optionNumber: number): string;
}
export declare function createOnboardingGuide(ctx: OnboardingContext): OnboardingGuide;
//# sourceMappingURL=index.d.ts.map