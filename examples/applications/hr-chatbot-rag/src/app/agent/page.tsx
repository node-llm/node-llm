"use client";

import dynamic from "next/dynamic";

const AgentChatInterface = dynamic(
  () => import("@/components/chat/AgentChatInterface"),
  { ssr: false }
);

export default function AgentPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-[radial-gradient(circle_at_top_left,_#eef2ff,_transparent_25%),_radial-gradient(circle_at_bottom_right,_#eef2ff,_transparent_25%)] bg-white/40">
      <div className="w-full max-w-3xl mb-8 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-4">
          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
          <span className="text-[10px] font-black tracking-widest text-indigo-600 uppercase">Agent Pattern</span>
        </div>
        <h1 className="text-4xl font-black tracking-tight text-slate-900">HR Agent</h1>
        <p className="mt-2 text-slate-500">
          Uses <code className="text-indigo-600 bg-indigo-50 px-1 rounded text-sm">HRPolicyAgent</code> + <code className="text-indigo-600 bg-indigo-50 px-1 rounded text-sm">AgentSession</code>
        </p>
        <p className="mt-1 text-sm text-slate-400">
          Compare: <a href="/" className="text-green-600 underline">Chat Pattern →</a>
        </p>
      </div>
      <AgentChatInterface />
    </main>
  );
}
