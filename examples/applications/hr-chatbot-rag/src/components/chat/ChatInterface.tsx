"use client";

import { useRef, useEffect } from "react";
import { 
  Avatar, 
  Typography, 
  ConfigProvider, 
  Spin 
} from "antd";
import { 
  LoadingOutlined, 
  ThunderboltOutlined 
} from "@ant-design/icons";
import { AnimatePresence } from "framer-motion";
import { useChat } from "@/hooks/use-chat"; // OLD: Chat API pattern
import { ChatHeader } from "./ChatHeader";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";

const { Text, Title } = Typography;

export default function ChatInterface() {
  const { messages, isLoading, appendStream } = useChat(); // OLD: Chat API pattern
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#339933",
          borderRadius: 12,
          fontFamily: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`,
        },
        components: {
          Button: {
            controlHeight: 40,
            paddingContentHorizontal: 20,
          },
          Input: {
            controlHeight: 48,
          }
        }
      }}
    >
      <div className="flex flex-col h-[700px] w-full max-w-3xl border border-slate-200/60 rounded-[32px] bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden ring-1 ring-slate-900/5">
        <ChatHeader />

        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-8 space-y-8 bg-slate-50/20"
        >
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-6 max-w-xs mx-auto">
              <Avatar size={80} icon={<ThunderboltOutlined />} style={{ background: '#f8fafc', color: '#cbd5e1' }} />
              <div>
                <Title level={5}>Start a conversation</Title>
                <Text type="secondary">Ask about leave policies, payroll, or company guidelines.</Text>
              </div>
            </div>
          )}
          
          <AnimatePresence initial={false}>
            {messages.map((m) => (
              <ChatMessage key={m.id} message={m} />
            ))}
          </AnimatePresence>
          
          {isLoading && (
            <div className="flex gap-4">
               <Avatar size={36} icon={<LoadingOutlined />} style={{ backgroundColor: "#33993310", color: "#339933" }} />
            </div>
          )}
        </div>

        <ChatInput onSend={appendStream} disabled={isLoading} />
      </div>
    </ConfigProvider>
  );
}
