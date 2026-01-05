import { Role } from "./Role.js";
import { ToolCall } from "./Tool.js";
import { MessageContent } from "./Content.js";
import { Usage } from "../providers/Provider.js";

export interface Message {
  role: Role;
  content: MessageContent | null;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
  name?: string;
  usage?: Usage;
  reasoning?: string;
}
