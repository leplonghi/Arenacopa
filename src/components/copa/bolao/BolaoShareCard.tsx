import React from "react";
import { Trophy, Users, ShieldCheck, Sparkles as SparklesIcon, Ticket } from "lucide-react";
import { BolaoAvatar } from "@/components/BolaoAvatar";
import { tStatic } from "@/i18n/staticText";
import { BRAND_MARK_SRC } from "@/lib/brand-assets";

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
        className="relative w-[400px] h-[600px] bg-[#010604] overflow-hidden flex flex-col items-center font-sans text-white border-[1px] border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.8)]"
        style={{
          backgroundImage: `
            radial-gradient(ellipse at 50% 0%, rgba(126,255,72,0.15) 0%, transparent 70%),
            radial-gradient(ellipse at 50% 100%, rgba(255,194,18,0.1) 0%, transparent 70%),
            linear-gradient(180deg, rgba(7,33,24,0.96) 0%, rgba(1,8,7,1) 100%),
            url('https://www.transparenttextures.com/patterns/carbon-fibre.png')
          `,
        }}
      >
        {/* Stadium Lights / Stars Effect */}
        <div className="absolute inset-0 opacity-40 pointer-events-none">
          <div className="absolute top-[15%] left-[10%] w-1 h-1 bg-white rounded-full blur-[1px] animate-pulse" />
          <div className="absolute top-[25%] right-[15%] w-1 h-1 bg-white rounded-full blur-[1px] animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-[40%] left-[20%] w-[1.5px] h-[1.5px] bg-copa-gold rounded-full blur-[1px] animate-pulse" style={{ animationDelay: '2s' }} />
          <div className="absolute top-[60%] right-[25%] w-1 h-1 bg-white rounded-full blur-[1px] animate-pulse" style={{ animationDelay: '1.5s' }} />
          <div className="absolute top-[80%] left-[15%] w-1 h-1 bg-copa-green rounded-full blur-[1px] animate-pulse" style={{ animationDelay: '0.5s' }} />
        </div>

        {/* Holographic / Shimmer Overlay */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20 mix-blend-overlay">
          <div 
            className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent -translate-x-full animate-shimmer" 
            style={{ animationDuration: '6s', transform: 'skewX(-25deg)' }} 
          />
        </div>

        {/* Top Header Section */}
        <div className="relative z-10 w-full pt-10 px-8 flex flex-col items-center">
          {/* Logo Badge */}
          <div className="relative mb-6">
            <div className="absolute -inset-4 bg-copa-gold/20 blur-2xl rounded-full opacity-60 animate-pulse" />
            <div className="relative h-24 w-24 p-0.5 rounded-full bg-gradient-to-br from-copa-gold via-copa-gold/20 to-copa-gold shadow-[0_0_40px_rgba(255,194,18,0.3)]">
              <div className="h-full w-full rounded-full bg-[#010604] flex items-center justify-center overflow-hidden border border-white/10">
                <div className="absolute inset-0 bg-gradient-to-tr from-copa-gold/10 to-transparent opacity-40" />
                <img src={BRAND_MARK_SRC} alt="Logo" className="w-14 h-14 object-contain relative z-10 drop-shadow-[0_0_15px_rgba(255,194,18,0.5)]" />
              </div>
            </div>
            {/* VIP Tag */}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-gradient-to-r from-copa-gold to-[#fff070] text-black px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg border border-black/10">
              VIP
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-copa-gold/40" />
            <p className="font-display text-[11px] font-bold uppercase tracking-[0.4em] text-copa-gold">ArenaCopa Exclusive</p>
            <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-copa-gold/40" />
          </div>
        </div>

        {/* Main Content Card */}
        <div className="relative z-10 w-full flex-1 flex flex-col items-center justify-center px-8 text-center mt-[-20px]">
          <div className="relative mb-8 group">
            <div className="absolute -inset-10 bg-gradient-to-br from-copa-gold/20 via-copa-green/10 to-copa-orange/20 rounded-full blur-[80px] opacity-50" />
            <div className="relative">
              <BolaoAvatar
                avatarUrl={avatarUrl}
                alt={bolaoName}
                className="h-44 w-44 rounded-[50px] border-[1px] border-white/30 bg-black/40 p-4 shadow-[0_40px_80px_-15px_rgba(0,0,0,0.9)] transform-3d group-hover:scale-105 transition-transform duration-700"
              />
              {isPaid && (
                <div className="absolute -bottom-2 -right-2 bg-gradient-to-br from-copa-gold to-copa-orange p-2.5 rounded-2xl border-[4px] border-[#010604] shadow-[0_10px_20px_rgba(0,0,0,0.4)]">
                  <Trophy className="w-5 h-5 text-black" strokeWidth={3} />
                </div>
              )}
            </div>
          </div>

          <h1 className="font-display text-5xl font-black tracking-tight mb-4 leading-[0.9] px-2">
            <span className="bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-white/60 drop-shadow-sm">
              {bolaoName.toUpperCase()}
            </span>
          </h1>

          {description && (
            <p className="text-[13px] text-zinc-400 font-medium line-clamp-2 max-w-[90%] mb-10 leading-relaxed tracking-wide">
              {description}
            </p>
          )}

          {/* Stats Glass Section */}
          <div className="grid grid-cols-2 gap-4 w-full">
            <div className="relative overflow-hidden bg-white/[0.03] backdrop-blur-3xl rounded-3xl p-5 border border-white/10 flex flex-col items-center group shadow-inner">
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <Users className="w-5 h-5 text-zinc-500 mb-2 opacity-60" />
              <span className="font-display text-3xl font-black tracking-tight leading-none mb-1.5">{memberCount}</span>
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500">{tStatic("Membros")}</span>
            </div>
            <div className="relative overflow-hidden bg-white/[0.03] backdrop-blur-3xl rounded-3xl p-5 border border-copa-gold/20 flex flex-col items-center group shadow-inner">
              <div className="absolute inset-0 bg-gradient-to-br from-copa-gold/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <ShieldCheck className="w-5 h-5 text-copa-gold mb-2" />
              <span className={cn(
                "font-display text-3xl font-black tracking-tight leading-none mb-1.5",
                isPaid ? "text-copa-gold" : "text-white"
              )}>
                {isPaid ? "PRO" : "FREE"}
              </span>
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500">{tStatic("Categoria")}</span>
            </div>
          </div>
        </div>

        {/* Bottom Section - Invite Entry */}
        <div className="relative z-10 w-full p-8 pt-0 flex flex-col items-center">
          <div className="w-full relative px-6 py-8 rounded-[32px] bg-gradient-to-b from-white/[0.08] to-transparent border border-white/10 overflow-hidden shadow-2xl">
            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03]" />
            <div className="relative z-10">
              <div className="flex items-center justify-center gap-2 mb-5 opacity-40">
                <Ticket className="w-3 h-3 text-copa-gold" />
                <p className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-400">{tStatic("CÓDIGO DE ACESSO")}</p>
                <Ticket className="w-3 h-3 text-copa-gold" />
              </div>
              <div className="font-display text-6xl font-black tracking-[0.15em] text-center text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.15)] leading-none mb-1">
                {inviteCode.toUpperCase()}
              </div>
              <div className="h-[2px] w-16 bg-copa-gold/30 mx-auto mt-4 rounded-full" />
            </div>
          </div>

          <div className="mt-8 flex items-center gap-3 px-6 py-2.5 rounded-full bg-black/40 border border-white/5 backdrop-blur-xl shadow-xl">
            <div className="w-2 h-2 rounded-full bg-copa-green shadow-[0_0_10px_rgba(126,255,72,0.5)] animate-pulse" />
            <span className="font-display text-[11px] font-bold tracking-[0.3em] text-zinc-500 uppercase">arenacopa.app</span>
          </div>
        </div>

        {/* Decorative elements */}
        {/* Frame lines with more style */}
        <div className="absolute top-4 left-4 right-4 bottom-4 border border-white/[0.07] pointer-events-none rounded-[36px]" />
        <div className="absolute top-6 left-6 right-6 bottom-6 border border-white/[0.03] pointer-events-none rounded-[30px]" />
        
        {/* Corner Brackets */}
        <div className="absolute top-10 left-10 w-6 h-6 border-t-2 border-l-2 border-copa-gold/30 rounded-tl-lg opacity-40" />
        <div className="absolute top-10 right-10 w-6 h-6 border-t-2 border-r-2 border-copa-gold/30 rounded-tr-lg opacity-40" />
        <div className="absolute bottom-10 left-10 w-6 h-6 border-b-2 border-l-2 border-copa-gold/30 rounded-bl-lg opacity-40" />
        <div className="absolute bottom-10 right-10 w-6 h-6 border-b-2 border-r-2 border-copa-gold/30 rounded-br-lg opacity-40" />
      </div>
    );
  }
);

BolaoShareCard.displayName = "BolaoShareCard";

