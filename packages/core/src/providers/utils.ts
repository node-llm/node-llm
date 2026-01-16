import { Message } from "../chat/Message.js";

/**
 * Maps system and developer roles based on provider capabilities.
 * If supportsDeveloperRole is true, both "system" and "developer" messages are mapped to "developer".
 * If supportsDeveloperRole is false, both "system" and "developer" messages are mapped to "system".
 */
export function mapSystemMessages(messages: Message[], supportsDeveloperRole: boolean): Message[] {
  return messages.map((msg) => {
    if (msg.role === "system" || (msg.role as string) === "developer") {
      return {
        ...msg,
        role: supportsDeveloperRole ? "developer" : "system"
      } as Message;
    }
    return msg;
  });
}
