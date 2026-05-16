import React from 'react';
import { Box, Text } from 'ink';

interface StatusBarProps {
  activeAgent?: string;
  sessionId?: string;
}

export const StatusBar: React.FC<StatusBarProps> = ({ activeAgent, sessionId }) => {
  return (
    <Box paddingX={1} borderTop={true} borderColor="gray">
      <Text color="gray">
        {activeAgent ? `Agent: ${activeAgent}` : 'No agent'}
      </Text>
      <Text color="gray"> | </Text>
      <Text color="gray">
        {sessionId ? `Session: ${sessionId.slice(0, 12)}` : 'No session'}
      </Text>
      <Text color="gray"> | </Text>
      <Text color="gray">1-9: switch | h: health | s: status | q: quit</Text>
    </Box>
  );
};
