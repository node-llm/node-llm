import { Role } from "./Role.js";
import { ToolCall } from "./Tool.js";

export interface Message {
  role: Role;
  content: string | null;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
  name?: string;
}
