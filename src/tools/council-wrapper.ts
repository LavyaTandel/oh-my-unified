import type { PluginContext } from '../plugin/types';
import { createCouncilTool as createCouncilToolFn } from './council';

export function createCouncilTool(
  ctx: PluginContext,
  config: Record<string, any>,
  depthTracker: any,
) {
  return createCouncilToolFn(ctx, config, depthTracker);
}