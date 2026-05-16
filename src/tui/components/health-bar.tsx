import React from 'react';
import { Box, Text } from 'ink';
import type { TuiState } from '../state';

interface HealthBarProps {
  health: TuiState['health'];
}

const statusColor: Record<string, string> = {
  healthy: 'green',
  warning: 'yellow',
  critical: 'red',
};

export const HealthBar: React.FC<HealthBarProps> = ({ health }) => {
  const color = statusColor[health.status] ?? 'gray';

  return (
    <Box flexDirection="column" paddingX={1}>
      <Text bold color="cyan">System Health</Text>
      <Box>
        <Text color={color}>
          Status: {health.status.toUpperCase()}
        </Text>
        <Text color="gray"> | </Text>
        <Text>Agents: {health.agentCount}</Text>
        <Text color="gray"> | </Text>
        <Text>Tools: {health.toolCount}</Text>
        <Text color="gray"> | </Text>
        <Text>MCPs: {health.mcpCount}</Text>
      </Box>
    </Box>
  );
};
