import React from 'react';
import { Box, Text } from 'ink';
import type { TuiMessage } from '../state';

interface MessageLogProps {
  messages: TuiMessage[];
  maxLines?: number;
}

const roleColor: Record<string, string> = {
  user: 'cyan',
  assistant: 'white',
  system: 'gray',
  tool: 'yellow',
};

export const MessageLog: React.FC<MessageLogProps> = ({ messages, maxLines = 20 }) => {
  const recent = messages.slice(-maxLines);

  if (recent.length === 0) {
    return (
      <Box flexDirection="column" paddingX={1}>
        <Text bold color="cyan">Messages</Text>
        <Text color="gray">No messages yet</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" paddingX={1}>
      <Text bold color="cyan">Messages</Text>
      {recent.map((msg, i) => (
        <Text key={i} wrap="truncate-end">
          <Text color={roleColor[msg.role] ?? 'gray'}>[{msg.role}]</Text>
          {msg.agent ? <Text color="magenta"> @{msg.agent}</Text> : null}
          <Text> {msg.content.slice(0, 80)}{msg.content.length > 80 ? '…' : ''}</Text>
        </Text>
      ))}
    </Box>
  );
};
