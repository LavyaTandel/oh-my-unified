import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Text } from 'ink';
const roleColor = {
    user: 'cyan',
    assistant: 'white',
    system: 'gray',
    tool: 'yellow',
};
export const MessageLog = ({ messages, maxLines = 20 }) => {
    const recent = messages.slice(-maxLines);
    if (recent.length === 0) {
        return (_jsxs(Box, { flexDirection: "column", paddingX: 1, children: [_jsx(Text, { bold: true, color: "cyan", children: "Messages" }), _jsx(Text, { color: "gray", children: "No messages yet" })] }));
    }
    return (_jsxs(Box, { flexDirection: "column", paddingX: 1, children: [_jsx(Text, { bold: true, color: "cyan", children: "Messages" }), recent.map((msg, i) => (_jsxs(Text, { wrap: "truncate-end", children: [_jsxs(Text, { color: roleColor[msg.role] ?? 'gray', children: ["[", msg.role, "]"] }), msg.agent ? _jsxs(Text, { color: "magenta", children: [" @", msg.agent] }) : null, _jsxs(Text, { children: [" ", msg.content.slice(0, 80), msg.content.length > 80 ? '…' : ''] })] }, i)))] }));
};
//# sourceMappingURL=message-log.js.map