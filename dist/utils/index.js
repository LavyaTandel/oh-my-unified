export * from './display-name';
export * from './logger';
export * from './persist';
export * from './session';
export * from './system-collapse';
export function resolveRuntimeAgentName(name) {
    return AGENT_ALIASES[name] || name;
}
import { AGENT_ALIASES } from '../config/constants';
//# sourceMappingURL=index.js.map