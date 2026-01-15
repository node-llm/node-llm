import { ToolExecutionMode } from "../constants.js";
import { ToolError } from "../errors/index.js";

export class ToolHandler {
  static shouldExecuteTools(toolCalls: any[] | undefined, mode?: ToolExecutionMode): boolean {
    if (!toolCalls || toolCalls.length === 0) return false;
    if (mode === ToolExecutionMode.DRY_RUN) return false;
    return true;
  }

  static async requestToolConfirmation(
    toolCall: any,
    onConfirm?: (call: any) => Promise<boolean> | boolean
  ): Promise<boolean> {
    if (!onConfirm) return true;
    const confirmed = await onConfirm(toolCall);
    return confirmed !== false;
  }

  static async execute(
    toolCall: any,
    tools: any[] | undefined,
    onStart?: (call: any) => void,
    onEnd?: (call: any, result: any) => void
  ): Promise<{ role: "tool"; tool_call_id: string; content: string }> {
    if (onStart) onStart(toolCall);

    const tool = tools?.find((t) => t.function.name === toolCall.function.name);

    if (tool?.handler) {
      try {
        const args = JSON.parse(toolCall.function.arguments);
        const result = await tool.handler(args);
        const safeResult = typeof result === 'string' ? result : JSON.stringify(result);
        
        if (onEnd) onEnd(toolCall, result);

        return {
          role: "tool",
          tool_call_id: toolCall.id,
          content: safeResult,
        };
      } catch (error: any) {
        throw error;
      }
    } else {
      throw new ToolError("Tool not found or no handler provided", toolCall.function?.name ?? "unknown");
    }
  }
}
