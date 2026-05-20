import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Text } from 'ink';
export const StatusBar = ({ activeAgent, sessionId }) => {
    return (_jsxs(Box, { paddingX: 1, borderTop: true, borderColor: "gray", children: [_jsx(Text, { color: "gray", children: activeAgent ? `Agent: ${activeAgent}` : 'No agent' }), _jsx(Text, { color: "gray", children: " | " }), _jsx(Text, { color: "gray", children: sessionId ? `Session: ${sessionId.slice(0, 12)}` : 'No session' }), _jsx(Text, { color: "gray", children: " | " }), _jsx(Text, { color: "gray", children: "1-9: switch | h: health | s: status | q: quit" })] }));
};
//# sourceMappingURL=status-bar.js.map