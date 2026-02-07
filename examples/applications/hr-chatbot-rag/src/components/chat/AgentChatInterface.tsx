"use client";

/**
 * AgentChatInterface - Uses the new Agent + AgentSession pattern
 * 
 * "Code Wins": Model, tools, instructions defined in HRPolicyAgent class
 */

import { useRef, useEffect } from "react";
import { Avatar, Typography, ConfigProvider } from "antd";
import { LoadingOutlined, RobotOutlined } from "@ant-design/icons";
import { AnimatePresence } from "framer-motion";
import { useAgentChat } from "@/hooks/use-agent-chat";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";

const { Text, Title } = Typography;

export default function AgentChatInterface() {
  const { messages, isLoading, appendStream, sessionId } = useAgentChat();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  return (
    <ConfigProvider
      theme={{
        token: { colorPrimary: "#6366f1", borderRadius: 12 },
      }}
    >
      <div className="flex flex-col h-[600px] w-full max-w-3xl border border-indigo-200/60 rounded-2xl bg-white shadow-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-3">
          <Avatar size={36} icon={<RobotOutlined />} style={{ backgroundColor: "#6366f1" }} />
          <div>
            <Title level={5} style={{ margin: 0, fontSize: 14 }}>HRPolicyAgent</Title>
            <Text type="secondary" className="text-xs">AgentSession • Code Wins</Text>
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-indigo-50/30">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <Avatar size={64} icon={<RobotOutlined />} style={{ background: '#eef2ff', color: '#a5b4fc' }} />
              <Title level={5} className="mt-4">Agent Mode</Title>
              <Text type="secondary">Tools defined in HRPolicyAgent class</Text>
            </div>
          )}
          
          <AnimatePresence initial={false}>
            {messages.map((m) => <ChatMessage key={m.id} message={m} />)}
          </AnimatePresence>
          
          {isLoading && (
            <Avatar size={36} icon={<LoadingOutlined />} style={{ backgroundColor: "#6366f110", color: "#6366f1" }} />
          )}
        </div>

        {sessionId && (
          <div className="px-4 py-1.5 bg-indigo-50 text-xs text-indigo-600 font-mono">
            Session: {sessionId.slice(0, 8)}...
          </div>
        )}

        <ChatInput onSend={appendStream} disabled={isLoading} />
      </div>
    </ConfigProvider>
  );
}
