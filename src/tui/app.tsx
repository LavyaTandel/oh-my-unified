import React, { useState, useEffect } from 'react';
import { Box, Text, useApp, useInput } from 'ink';
import { getTuiState, subscribe, type TuiState as AppState } from './state';
import { AgentList, MessageLog, HealthBar, StatusBar } from './components';

export const App: React.FC = () => {
  const { exit } = useApp();
  const [state, setState] = useState<AppState>(getTuiState());
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

  return (
    <Box flexDirection="column" width="100%" height="100%">
      <Box paddingX={1}>
        <Text bold color="cyan">oh-my-unified</Text>
        <Text color="gray"> — Multi-Agent Orchestration</Text>
      </Box>

      <Box flexDirection="row" flexGrow={1}>
        <Box flexDirection="column" width="40%">
          <AgentList agents={agents} activeAgent={state.activeAgent} />
        </Box>
        <Box flexDirection="column" flexGrow={1}>
          <MessageLog messages={state.messages} />
        </Box>
      </Box>

      {showHealth && <HealthBar health={state.health} />}
      <StatusBar activeAgent={state.activeAgent} sessionId={state.sessionId} />
    </Box>
  );
};
