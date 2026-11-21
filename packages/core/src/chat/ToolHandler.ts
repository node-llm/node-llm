import { checkArguments } from "../schema/check-arguments.js";
import { ToolExecutionMode, ToolExecutionModeInput } from "../constants.js";
import { ToolError } from "../errors/index.js";
import { CHECKS_OWN_ARGUMENTS, ToolCall, ToolDefinition, ToolHalt } from "./Tool.js";

/**
 * Result of a tool execution, including halt status
 */
export interface ToolExecutionResult {
  role: "tool";
  tool_call_id: string;
  content: string;
  halted: boolean;
}

export class ToolHandler {
  static shouldExecuteTools(
    toolCalls: ToolCall[] | undefined,
    mode?: ToolExecutionModeInput
  ): boolean {
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
  ): Promise<ToolExecutionResult> {
    if (onStart) onStart(toolCall);

    const tool = tools?.find((t) => t.function.name === toolCall.function.name);

    if (tool?.handler) {
      let args: unknown;
      try {
        args = JSON.parse(toolCall.function.arguments);
      } catch {
        // The model produced malformed JSON for the tool arguments. Return a
        // recoverable error the model can correct on the next turn instead of
        // throwing and aborting the whole agentic loop.
        return {
          role: "tool",
          tool_call_id: toolCall.id,
          content: `Error: arguments for tool '${toolCall.function.name}' were not valid JSON. Please call the tool again with a valid JSON arguments object.`,
          halted: false
        };
      }
      // Arguments the tool's own JSON Schema rules out never reach a handler that doesn't check
      // them itself; the model is told what to fix instead.
      if (!(tool as { [CHECKS_OWN_ARGUMENTS]?: boolean })[CHECKS_OWN_ARGUMENTS]) {
        const problems = checkArguments(tool.function.parameters, args);
        if (problems.length > 0) {
          return {
            role: "tool",
            tool_call_id: toolCall.id,
            content: `Invalid tool arguments: ${problems.slice(0, 10).join("; ")}`,
            halted: false
          };
        }
      }
      const result = await tool.handler(args);

      // Check if this is a halt signal
      const isHalt = typeof result === "object" && result !== null && result instanceof ToolHalt;
      const content = isHalt
        ? (result as ToolHalt).content
        : typeof result === "string"
          ? result
          : JSON.stringify(result);

      if (onEnd) onEnd(toolCall, result);

      return {
        role: "tool",
        tool_call_id: toolCall.id,
        content,
        halted: isHalt
      };
    } else {
      // Model tried to call a tool that isn't available
      // Only tools the model can already see: deferred ones stay hidden until it searches.
      const availableTools = tools?.filter((t) => !t.defer).map((t) => t.function.name) || [];
      const errorMsg = `Model tried to call unavailable tool '${toolCall.function.name}'. Available tools: [${availableTools.join(", ")}].`;

      return {
        role: "tool",
        tool_call_id: toolCall.id,
        content: errorMsg,
        halted: false
      };
    }
  }
}
