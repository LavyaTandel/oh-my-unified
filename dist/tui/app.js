import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Box, Text, useApp, useInput } from 'ink';
import { getTuiState, subscribe } from './state';
import { AgentList, MessageLog, HealthBar, StatusBar } from './components';
export const App = () => {
    const { exit } = useApp();
    const [state, setState] = useState(getTuiState());
    const [showHealth, setShowHealth] = useState(true);
    useEffect(() => {
        const unsub = subscribe((s) => setState(s));
        return unsub;
    }, []);
    useInput((input) => {
        switch (input) {
            case 'q':
                exit();
                break;
            case 'h':
                setShowHealth((v) => !v);
                break;
            case 's':
                break;
            default:
                break;
        }
    });
    const agents = Object.values(state.agents);
    return (_jsxs(Box, { flexDirection: "column", width: "100%", height: "100%", children: [_jsxs(Box, { paddingX: 1, children: [_jsx(Text, { bold: true, color: "cyan", children: "oh-my-unified" }), _jsx(Text, { color: "gray", children: " \u2014 Multi-Agent Orchestration" })] }), _jsxs(Box, { flexDirection: "row", flexGrow: 1, children: [_jsx(Box, { flexDirection: "column", width: "40%", children: _jsx(AgentList, { agents: agents, activeAgent: state.activeAgent }) }), _jsx(Box, { flexDirection: "column", flexGrow: 1, children: _jsx(MessageLog, { messages: state.messages }) })] }), showHealth && _jsx(HealthBar, { health: state.health }), _jsx(StatusBar, { activeAgent: state.activeAgent, sessionId: state.sessionId })] }));
};
//# sourceMappingURL=app.js.map