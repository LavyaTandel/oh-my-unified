import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Text } from 'ink';
const statusColor = {
    healthy: 'green',
    warning: 'yellow',
    critical: 'red',
};
export const HealthBar = ({ health }) => {
    const color = statusColor[health.status] ?? 'gray';
    return (_jsxs(Box, { flexDirection: "column", paddingX: 1, children: [_jsx(Text, { bold: true, color: "cyan", children: "System Health" }), _jsxs(Box, { children: [_jsxs(Text, { color: color, children: ["Status: ", health.status.toUpperCase()] }), _jsx(Text, { color: "gray", children: " | " }), _jsxs(Text, { children: ["Agents: ", health.agentCount] }), _jsx(Text, { color: "gray", children: " | " }), _jsxs(Text, { children: ["Tools: ", health.toolCount] }), _jsx(Text, { color: "gray", children: " | " }), _jsxs(Text, { children: ["MCPs: ", health.mcpCount] })] })] }));
};
//# sourceMappingURL=health-bar.js.map