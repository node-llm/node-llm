"use client";

import dynamic from "next/dynamic";

const ChatInterface = dynamic(
  () => import("@/components/chat/ChatInterface"),
  { ssr: false }
);

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-[radial-gradient(circle_at_top_left,_var(--color-brand-primary-light),_transparent_25%),_radial-gradient(circle_at_bottom_right,_var(--color-brand-primary-light),_transparent_25%)] bg-[length:100%_100%] bg-white/40">
      <div className="w-full max-w-3xl mb-12 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-primary/10 border border-brand-primary/20 mb-6">
          <span className="w-2 h-2 rounded-full bg-brand-primary animate-pulse" />
          <span className="text-[10px] font-black tracking-widest text-brand-primary uppercase">v1.1 Internal Release</span>
        </div>
        <h1 className="text-5xl font-black tracking-tight text-slate-900 leading-[1.1]">
          Internal HR Assistant
        </h1>
        <p className="mt-4 text-lg text-slate-500 font-medium max-w-lg mx-auto leading-relaxed">
          Secure, policy-aware intelligence. Always here to help with your workplace queries.
        </p>
      </div>

      <ChatInterface />

      <footer className="mt-12 flex items-center gap-8 opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
        <div className="flex flex-col items-center gap-1">
           <span className="text-[9px] font-black tracking-widest uppercase text-slate-500">Security</span>
           <span className="text-xs font-bold text-slate-900 leading-none">END-TO-END</span>
        </div>
        <div className="w-px h-6 bg-slate-300" />
        <div className="flex flex-col items-center gap-1">
           <span className="text-[9px] font-black tracking-widest uppercase text-slate-500">Availability</span>
           <span className="text-xs font-bold text-slate-900 leading-none">24/7 SUPPORT</span>
        </div>
        <div className="w-px h-6 bg-slate-300" />
        <div className="flex flex-col items-center gap-1">
           <span className="text-[9px] font-black tracking-widest uppercase text-slate-500">Compliance</span>
           <span className="text-xs font-bold text-slate-900 leading-none">INTERNAL ONLY</span>
        </div>
        <div className="w-px h-6 bg-slate-300" />
        <a href="/api/monitor" target="_blank" className="flex flex-col items-center gap-1 hover:opacity-100">
           <span className="text-[9px] font-black tracking-widest uppercase text-slate-500">Observability</span>
           <span className="text-xs font-bold text-brand-primary leading-none">MONITOR →</span>
        </a>
      </footer>
    </main>
  );
}
