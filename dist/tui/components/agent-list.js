import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Text } from 'ink';
const statusColor = {
    ready: 'green',
    busy: 'yellow',
    error: 'red',
};
const statusDot = {
    ready: '●',
    busy: '●',
    error: '●',
};
export const AgentList = ({ agents, activeAgent, onSelect }) => {
    const agentEntries = Object.values(agents);
    if (agentEntries.length === 0) {
        return (_jsx(Box, { flexDirection: "column", padding: 1, children: _jsx(Text, { color: "gray", children: "No agents registered" }) }));
    }
    return (_jsxs(Box, { flexDirection: "column", paddingX: 1, children: [_jsx(Text, { bold: true, color: "cyan", children: "Agents" }), agentEntries.map((agent) => {
                const isActive = agent.name === activeAgent;
                const color = statusColor[agent.status] ?? 'gray';
                const prefix = isActive ? '▸ ' : '  ';
                return (_jsxs(Text, { children: [_jsxs(Text, { color: color, children: [prefix, statusDot[agent.status] ?? '●', " "] }), _jsx(Text, { bold: isActive, color: isActive ? 'cyan' : undefined, children: agent.displayName ?? `@${agent.name}` }), _jsxs(Text, { color: "gray", children: [" \u2014 ", agent.role ?? agent.model] })] }, agent.name));
            })] }));
};
//# sourceMappingURL=agent-list.js.map