/**
 * useAgentChat - React hook for the Agent + AgentSession pattern
 * 
 * This is the new approach using HRPolicyAgent class.
 * Compare with use-chat.ts which uses the raw Chat API.
 */
import { useState } from "react";
import { sendMessageAgent, sendMessageAgentStream } from "@/app/agent-actions";

export type Message = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string | null;
  thinking?: string;
};

export function useAgentChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function append(content: string) {
    if (!content.trim() || isLoading) return;

    const userMessage: Message = {
      id: Math.random().toString(),
      role: "user",
      content,
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const result = await sendMessageAgent(sessionId, content);
      setSessionId(result.sessionId);
      
      const assistantMessage: Message = {
        id: result.message.id,
        role: "assistant",
        content: result.message.content ?? null,
        thinking: result.message.thinkingText ?? undefined
      };

      setMessages((prev: Message[]) => [...prev, assistantMessage]);
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setIsLoading(false);
    }
  }

  async function appendStream(content: string) {
    if (!content.trim() || isLoading) return;

    const userMessage: Message = {
      id: Math.random().toString(),
      role: "user",
      content,
    };

    setMessages((prev: Message[]) => [...prev, userMessage]);
    setIsLoading(true);

    // Create placeholder for assistant message
    const assistantId = Math.random().toString();
    const assistantMessage: Message = {
      id: assistantId,
      role: "assistant",
      content: "",
      thinking: "",
    };

    setMessages((prev: Message[]) => [...prev, assistantMessage]);

    try {
      const stream = await sendMessageAgentStream(sessionId, content);
      const reader = stream.getReader();
      const decoder = new TextDecoder();
      let firstTokenReceived = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunkText = decoder.decode(value, { stream: true });
        const lines = chunkText.split("\n").filter((line) => line.trim());

        for (const line of lines) {
          try {
            const data = JSON.parse(line);

            if (data.type === "sessionId") {
              setSessionId(data.sessionId);
            } else if (data.type === "chunk" || data.type === "token") {
              // Hide loader as soon as first token arrives
              if (!firstTokenReceived) {
                setIsLoading(false);
                firstTokenReceived = true;
              }
              
              const chunk = data.chunk || { content: data.content };
              
              setMessages((prev: Message[]) =>
                prev.map((msg: Message) =>
                  msg.id === assistantId
                    ? {
                        ...msg,
                        content: (msg.content || "") + (chunk.content || ""),
                        thinking: chunk.thinking 
                          ? (msg.thinking || "") + chunk.thinking 
                          : msg.thinking,
                      }
                    : msg
                )
              );
            } else if (data.type === "done") {
              // Stream complete - update with final data if provided
              if (data.messageId) {
                setMessages((prev: Message[]) =>
                  prev.map((msg: Message) =>
                    msg.id === assistantId
                      ? { ...msg, id: data.messageId }
                      : msg
                  )
                );
              }
            }
          } catch {
            // Ignore JSON parse errors from partial chunks
          }
        }
      }
    } catch (err) {
      console.error("Failed to stream message:", err);
      // Remove the placeholder on error
      setMessages((prev: Message[]) => prev.filter((m) => m.id !== assistantId));
    } finally {
      setIsLoading(false);
    }
  }

  function clear() {
    setMessages([]);
    setSessionId(null);
  }

  return {
    messages,
    isLoading,
    sessionId,
    append,
    appendStream,
    clear,
  };
}
