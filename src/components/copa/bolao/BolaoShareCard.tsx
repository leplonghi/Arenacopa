import React from "react";
import { Trophy, Users, Globe, ShieldCheck } from "lucide-react";
import { BolaoAvatar } from "@/components/BolaoAvatar";
import { cn } from "@/lib/utils";
import { tStatic } from "@/i18n/staticText";

interface BolaoShareCardProps {
  bolaoName: string;
  avatarUrl?: string | null;
  memberCount: number;
  inviteCode: string;
  description?: string | null;
  isPaid?: boolean;
}

export const BolaoShareCard = React.forwardRef<HTMLDivElement, BolaoShareCardProps>(
  ({ bolaoName, avatarUrl, memberCount, inviteCode, description, isPaid }, ref) => {
    return (
      <div
        ref={ref}
        className="relative w-[400px] h-[600px] bg-[#050505] overflow-hidden p-8 flex flex-col items-center justify-between font-sans text-white border-4 border-copa-gold/30 shadow-[0_0_100px_rgba(255,196,0,0.15)]"
        style={{
          backgroundImage: `
            radial-gradient(circle at 0% 0%, rgba(255,196,0,0.15) 0%, transparent 50%),
            radial-gradient(circle at 100% 100%, rgba(34,197,94,0.15) 0%, transparent 50%),
            url('https://www.transparenttextures.com/patterns/carbon-fibre.png')
          `,
        }}
      >
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-20 mix-blend-overlay pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />

        {/* Top Header */}
        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-copa-gold/20 shadow-[0_0_20px_rgba(255,196,0,0.3)]">
            <Trophy className="h-6 w-6 text-copa-gold" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-copa-gold mb-2">ArenaCopa VIP Pass</p>
          <div className="h-px w-24 bg-gradient-to-r from-transparent via-copa-gold/50 to-transparent" />
        </div>

        {/* Main Content */}
        <div className="relative z-10 flex flex-col items-center text-center w-full">
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-copa-gold/20 rounded-[40px] blur-2xl animate-pulse" />
            <BolaoAvatar
              avatarUrl={avatarUrl}
              alt={bolaoName}
              className="relative h-40 w-40 rounded-[40px] border-4 border-white/10 bg-white/5 p-4 shadow-2xl"
            />
          </div>

          <h1 className="text-4xl font-black tracking-tighter mb-4 bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-white/60">
            {bolaoName}
          </h1>

          {description && (
            <p className="text-sm text-zinc-400 font-medium line-clamp-2 max-w-[80%] mb-8 leading-relaxed">
              {description}
            </p>
          )}

          <div className="grid grid-cols-2 gap-4 w-full px-4">
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex flex-col items-center">
              <Users className="w-5 h-5 text-zinc-400 mb-1" />
              <span className="text-2xl font-black">{memberCount}</span>
              <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">{tStatic("Participantes")}</span>
            </div>
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex flex-col items-center">
              <ShieldCheck className="w-5 h-5 text-copa-gold mb-1" />
              <span className="text-2xl font-black">{isPaid ? "Pro" : "Livre"}</span>
              <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">{tStatic("Categoria")}</span>
            </div>
          </div>
        </div>

        {/* Bottom Section - Invite Code */}
        <div className="relative z-10 w-full flex flex-col items-center">
          <div className="bg-white/5 border border-white/10 rounded-2xl px-6 py-4 w-full flex flex-col items-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-copa-gold/0 via-copa-gold/5 to-copa-gold/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-2">{tStatic("Use o código para entrar")}</p>
            <div className="text-4xl font-black tracking-[0.3em] text-white">
              {inviteCode.toUpperCase()}
            </div>
          </div>

          <div className="mt-8 flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/10">
              <Globe className="w-4 h-4 text-zinc-500" />
            </div>
            <span className="text-xs font-bold text-zinc-500">arenacopa.app</span>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-copa-gold/30 rounded-tl-3xl m-4" />
        <div className="absolute top-0 right-0 w-16 h-16 border-t-2 border-r-2 border-copa-gold/30 rounded-tr-3xl m-4" />
        <div className="absolute bottom-0 left-0 w-16 h-16 border-b-2 border-l-2 border-copa-gold/30 rounded-bl-3xl m-4" />
        <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-copa-gold/30 rounded-br-3xl m-4" />
      </div>
    );
  }
);

BolaoShareCard.displayName = "BolaoShareCard";
