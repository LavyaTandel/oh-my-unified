import React from 'react';
import { Box, Text } from 'ink';
import type { TuiAgent } from '../state';

interface AgentListProps {
  agents: TuiAgent[];
  activeAgent?: string;
  onSelect?: (name: string) => void;
}

const statusColor: Record<string, string> = {
  ready: 'green',
  busy: 'yellow',
  error: 'red',
};

const statusDot: Record<string, string> = {
  ready: '●',
  busy: '●',
  error: '●',
};

export const AgentList: React.FC<AgentListProps> = ({ agents, activeAgent, onSelect }) => {
  const agentEntries = Object.values(agents);

  if (agentEntries.length === 0) {
    return (
      <Box flexDirection="column" padding={1}>
        <Text color="gray">No agents registered</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" paddingX={1}>
      <Text bold color="cyan">Agents</Text>
      {agentEntries.map((agent) => {
        const isActive = agent.name === activeAgent;
        const color = statusColor[agent.status] ?? 'gray';
        const prefix = isActive ? '▸ ' : '  ';

        return (
          <Text key={agent.name}>
            <Text color={color}>{prefix}{statusDot[agent.status] ?? '●'} </Text>
            <Text bold={isActive} color={isActive ? 'cyan' : undefined}>
              {agent.displayName ?? `@${agent.name}`}
            </Text>
            <Text color="gray"> — {agent.role ?? agent.model}</Text>
          </Text>
        );
      })}
    </Box>
  );
};
