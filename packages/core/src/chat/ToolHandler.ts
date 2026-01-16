import { ToolExecutionMode } from "../constants.js";
import { ToolError } from "../errors/index.js";
import { ToolCall, ToolDefinition } from "./Tool.js";

export class ToolHandler {
  static shouldExecuteTools(toolCalls: ToolCall[] | undefined, mode?: ToolExecutionMode): boolean {
    if (!toolCalls || toolCalls.length === 0) return false;
    if (mode === ToolExecutionMode.DRY_RUN) return false;
    return true;
  }

  static async requestToolConfirmation(
    toolCall: ToolCall,
    onConfirm?: (call: ToolCall) => Promise<boolean> | boolean
  ): Promise<boolean> {
    if (!onConfirm) return true;
    const confirmed = await onConfirm(toolCall);
    return confirmed !== false;
  }

  static async execute(
    toolCall: ToolCall,
    tools: ToolDefinition[] | undefined,
    onStart?: (call: ToolCall) => void,
    onEnd?: (call: ToolCall, result: unknown) => void
  ): Promise<{ role: "tool"; tool_call_id: string; content: string }> {
    if (onStart) onStart(toolCall);

    const tool = tools?.find((t) => t.function.name === toolCall.function.name);

    if (tool?.handler) {
      const args = JSON.parse(toolCall.function.arguments);
      const result = await tool.handler(args);
      const safeResult = typeof result === "string" ? result : JSON.stringify(result);

      if (onEnd) onEnd(toolCall, result);

      return {
        role: "tool",
        tool_call_id: toolCall.id,
        content: safeResult
      };
    } else {
      throw new ToolError(
        "Tool not found or no handler provided",
        toolCall.function?.name ?? "unknown"
      );
    }
  }
}
