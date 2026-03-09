import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy, Map, Users, Star, HelpCircle, ChevronDown, ChevronRight,
  Flag as FlagIcon, Calendar, Target, Globe, Shield, Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NewsFeed } from "@/components/NewsFeed";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useRef } from "react";

// ---- Accordion Item ----
function AccordionItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <button
      onClick={() => setOpen(!open)}
      className="w-full text-left"
    >
      <div className="flex items-center justify-between py-3.5 border-b border-border/30">
        <span className="text-sm font-bold pr-3">{question}</span>
        <ChevronDown
          className={cn("w-4 h-4 text-muted-foreground shrink-0 transition-transform", open && "rotate-180")}
        />
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="text-sm text-muted-foreground leading-relaxed py-3 pr-4">{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
}

// ---- Section Header ----
function SectionHeader({ icon: Icon, title, accent }: { icon: React.ElementType; title: string; accent?: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="w-8 h-8 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-copa-green-light" />
      </div>
      <div>
        <h2 className="text-base font-black leading-none">
          {title} {accent && <span className="text-primary">{accent}</span>}
        </h2>
      </div>
    </div>
  );
}

const sectionVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.07, duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  }),
};

const Guia = () => {
  const { user } = useAuth();
  const [favoriteTeam, setFavoriteTeam] = useState<string | undefined>(undefined);
  const [newsEnabled, setNewsEnabled] = useState(false);
  const didLoad = useRef(false);

  useEffect(() => {
    if (!user || didLoad.current) return;
    didLoad.current = true;
    supabase
      .from("profiles")
      .select("favorite_team, notifications")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          if (data.favorite_team) setFavoriteTeam(data.favorite_team as string);
          const notifs = data.notifications as Record<string, boolean> | null;
          if (notifs?.news) setNewsEnabled(true);
        }
      });
  }, [user]);

  return (
    <div className="px-4 py-4 space-y-8 pb-6">
      {/* Hero */}
      <motion.div
        variants={sectionVariants} initial="hidden" animate="visible" custom={0}
        className="rounded-2xl overflow-hidden relative bg-gradient-to-br from-copa-green/25 via-secondary to-background border border-copa-green/20 p-6"
      >
        <div className="absolute top-0 right-0 text-8xl opacity-10 leading-none -mt-2 -mr-2 select-none">⚽</div>
        <span className="text-[10px] font-black uppercase tracking-widest text-copa-green-light block mb-1">
          Guia Oficial
        </span>
        <h1 className="text-2xl font-black leading-tight mb-2">
          Copa do Mundo<br />
          <span className="text-primary">2026</span>
        </h1>
        <p className="text-xs text-muted-foreground leading-relaxed max-w-xs">
          Tudo o que você precisa saber sobre a maior Copa da história — 48 seleções, 3 países e 104 jogos.
        </p>
        <div className="flex items-center gap-3 mt-4">
          {[
            { label: "Seleções", value: "48" },
            { label: "Jogos", value: "104" },
            { label: "Países sede", value: "3" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <span className="text-xl font-black text-primary block">{s.value}</span>
              <span className="text-[9px] text-muted-foreground uppercase tracking-wider">{s.label}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Datas */}
      <motion.section variants={sectionVariants} initial="hidden" animate="visible" custom={1}>
        <SectionHeader icon={Calendar} title="Calendário" accent="Resumido" />
        <div className="glass-card divide-y divide-border/30">
          {[
            { fase: "Abertura", data: "11 Jun 2026", emoji: "🎉", desc: "MEX × RSA — Azteca, Cidade do México" },
            { fase: "Fase de Grupos", data: "11 – 27 Jun", emoji: "📋", desc: "72 jogos em 12 grupos de 4 times" },
            { fase: "Round of 32", data: "29 Jun – 5 Jul", emoji: "🏟️", desc: "24 primeiros + 8 melhores 3ºs" },
            { fase: "Oitavas de Final", data: "6 – 10 Jul", emoji: "⚔️", desc: "16 times restantes" },
            { fase: "Quartas de Final", data: "11 – 14 Jul", emoji: "🔥", desc: "8 times lutam por vaga na semi" },
            { fase: "Semifinais", data: "15 – 16 Jul", emoji: "🌟", desc: "As 4 melhores seleções do mundo" },
            { fase: "3º Lugar", data: "18 Jul 2026", emoji: "🥉", desc: "Los Angeles — SoFi Stadium" },
            { fase: "Final", data: "19 Jul 2026", emoji: "🏆", desc: "MetLife Stadium, Nova York/NJ" },
          ].map((item) => (
            <div key={item.fase} className="flex items-center gap-3 px-4 py-3">
              <span className="text-lg w-6 text-center shrink-0">{item.emoji}</span>
              <div className="flex-1">
                <span className="text-sm font-bold block">{item.fase}</span>
                <span className="text-[10px] text-muted-foreground">{item.desc}</span>
              </div>
              <span className="text-[10px] font-bold text-primary shrink-0 text-right">{item.data}</span>
            </div>
          ))}
        </div>
      </motion.section>

      {/* Formato */}
      <motion.section variants={sectionVariants} initial="hidden" animate="visible" custom={2}>
        <SectionHeader icon={Trophy} title="Formato do" accent="Torneio" />
        <div className="space-y-3">
          {/* Fase de Grupos */}
          <div className="glass-card p-4 border-l-4 border-primary">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-base">📋</span>
              <h3 className="text-sm font-black">Fase de Grupos</h3>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              48 seleções divididas em <strong className="text-foreground">12 grupos de 4 times</strong>. Cada time joga 3 partidas. Os 2 primeiros de cada grupo + os 8 melhores 3ºs colocados (24+8=<strong className="text-foreground">32 times</strong>) avançam ao Round of 32.
            </p>
            <div className="flex gap-4 mt-3">
              <div className="text-center">
                <span className="text-lg font-black text-primary">12</span>
                <span className="text-[9px] text-muted-foreground block">Grupos</span>
              </div>
              <div className="text-center">
                <span className="text-lg font-black text-primary">72</span>
                <span className="text-[9px] text-muted-foreground block">Jogos</span>
              </div>
              <div className="text-center">
                <span className="text-lg font-black text-primary">32</span>
                <span className="text-[9px] text-muted-foreground block">Classificados</span>
              </div>
            </div>
          </div>

          {/* Mata-Mata */}
          <div className="glass-card p-4 border-l-4 border-copa-gold">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-base">⚔️</span>
              <h3 className="text-sm font-black">Mata-Mata (Fase Final)</h3>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed mb-3">
              Eliminação direta. Empate no tempo normal leva a prorrogação (2×15min) e, se necessário, pênaltis.
            </p>
            <div className="space-y-1.5">
              {[
                { fase: "Round of 32", times: 32, jogos: 16 },
                { fase: "Round of 16 (Oitavas)", times: 16, jogos: 8 },
                { fase: "Quartas de Final", times: 8, jogos: 4 },
                { fase: "Semifinais", times: 4, jogos: 2 },
                { fase: "3º Lugar + Final", times: 4, jogos: 2 },
              ].map((r) => (
                <div key={r.fase} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-copa-gold shrink-0" />
                  <span className="text-xs flex-1">{r.fase}</span>
                  <span className="text-[10px] text-muted-foreground">{r.times} times</span>
                  <span className="text-[10px] font-bold text-copa-gold">{r.jogos} jogos</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.section>

      {/* Países Sede */}
      <motion.section variants={sectionVariants} initial="hidden" animate="visible" custom={3}>
        <SectionHeader icon={Map} title="Países" accent="Sede" />
        <div className="grid grid-cols-3 gap-3">
          {[
            { flag: "🇺🇸", country: "EUA", stadiums: "11 estádios", highlight: "MetLife, AT&T, SoFi, Rose Bowl" },
            { flag: "🇨🇦", country: "Canadá", stadiums: "2 estádios", highlight: "BC Place, BMO Field" },
            { flag: "🇲🇽", country: "México", stadiums: "3 estádios", highlight: "Azteca, Akron, BBVABancomer" },
          ].map((p) => (
            <div key={p.country} className="glass-card p-3 text-center">
              <span className="text-3xl block mb-1">{p.flag}</span>
              <span className="text-xs font-black block">{p.country}</span>
              <span className="text-[9px] text-primary font-bold block mt-0.5">{p.stadiums}</span>
              <span className="text-[8px] text-muted-foreground leading-tight mt-1 block line-clamp-2">{p.highlight}</span>
            </div>
          ))}
        </div>
      </motion.section>

      {/* Como Funciona o Bolão */}
      <motion.section variants={sectionVariants} initial="hidden" animate="visible" custom={4}>
        <SectionHeader icon={Target} title="Como Funciona o" accent="Bolão" />
        <div className="glass-card p-4 space-y-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            No ArenaCopa você cria ou entra em um bolão com amigos, faz seus palpites e acumula pontos a cada jogo.
          </p>

          {/* Pontuação */}
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-primary block mb-2">Pontuação por Jogo</span>
            <div className="space-y-2">
              {[
                { pts: 5, label: "Placar Exato", desc: "Acertou o placar certinho: 2×1, 0×0, etc.", color: "bg-green-500" },
                { pts: 3, label: "Vencedor Correto", desc: "Acertou quem ganha, mas não o placar exato.", color: "bg-blue-500" },
                { pts: 2, label: "Empate Correto", desc: "Apostou em empate e o jogo terminou empatado.", color: "bg-yellow-500" },
                { pts: 0, label: "Erro", desc: "Resultado diferente do seu palpite.", color: "bg-secondary" },
              ].map((r) => (
                <div key={r.label} className="flex items-start gap-3">
                  <span className={cn("text-xs font-black w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-white", r.color)}>
                    {r.pts}
                  </span>
                  <div>
                    <span className="text-xs font-bold">{r.label}</span>
                    <span className="text-[10px] text-muted-foreground block">{r.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Campeão */}
          <div className="rounded-xl bg-gradient-to-r from-copa-gold/20 to-copa-gold/5 border border-copa-gold/30 p-3">
            <div className="flex items-center gap-2 mb-1">
              <Trophy className="w-4 h-4 text-copa-gold" />
              <span className="text-xs font-black">Palpite de Campeão</span>
              <span className="ml-auto text-sm font-black text-copa-gold">20 pts</span>
            </div>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              Acertar o campeão do torneio vale 20 pontos — o maior bônus disponível. Informe sua escolha antes da estreia da Copa!
            </p>
          </div>
        </div>
      </motion.section>

      {/* Favoritas */}
      <motion.section variants={sectionVariants} initial="hidden" animate="visible" custom={5}>
        <SectionHeader icon={Star} title="Favoritas ao" accent="Título" />
        <div className="glass-card p-4">
          <div className="space-y-3">
            {[
              { flag: "🇦🇷", team: "Argentina", odds: "Atual Campeã", bar: 95, color: "bg-blue-500" },
              { flag: "🇫🇷", team: "França", odds: "Vice-campeã 2022", bar: 90, color: "bg-blue-700" },
              { flag: "🇧🇷", team: "Brasil", odds: "6× Campeã", bar: 88, color: "bg-copa-green" },
              { flag: "🇩🇪", team: "Alemanha", odds: "4× Campeã", bar: 82, color: "bg-yellow-500" },
              { flag: "🇪🇸", team: "Espanha", odds: "Campeã Euro 2024", bar: 82, color: "bg-red-500" },
              { flag: "🇵🇹", team: "Portugal", odds: "Haaland & Cristiano", bar: 75, color: "bg-red-700" },
              { flag: "🇳🇴", team: "Noruega", odds: "Erling Haaland", bar: 72, color: "bg-orange-500" },
              { flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", team: "Inglaterra", odds: "Em ascensão", bar: 68, color: "bg-red-400" },
            ].map((t) => (
              <div key={t.team} className="flex items-center gap-3">
                <span className="text-xl w-7 shrink-0 text-center">{t.flag}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs font-bold">{t.team}</span>
                    <span className="text-[10px] text-muted-foreground">{t.odds}</span>
                  </div>
                  <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div
                      className={cn("h-full rounded-full", t.color)}
                      style={{ width: `${t.bar}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p className="text-[9px] text-muted-foreground text-center mt-3">* Estimativa de favoritismo baseada em ranking FIFA e desempenho recente</p>
        </div>
      </motion.section>

      {/* Dicas de Palpiteiro */}
      <motion.section variants={sectionVariants} initial="hidden" animate="visible" custom={6}>
        <SectionHeader icon={Zap} title="Dicas de" accent="Palpiteiro" />
        <div className="glass-card p-4 space-y-3">
          {[
            { emoji: "📊", tip: "Analise o histórico recente", desc: "Times com sequência positiva nos últimos 5 jogos tendem a manter desempenho nas fases iniciais." },
            { emoji: "🌡️", tip: "Atenção ao clima e altitude", desc: "Jogos no México (Guadalajara, altitude 1.560m) favorecem times sul-americanos acostumados a jogar em altitude." },
            { emoji: "🔄", tip: "Faça palpites de empate nas fases de grupos", desc: "Grupos equilibrados costumam terminar com 2 empates. Acertar um vale 2 pontos garantidos." },
            { emoji: "🏆", tip: "Arrisque no campeão", desc: "20 pontos podem virar o ranking. Aposte em uma seleção menos óbvia — se ela ganhar, você salta posições." },
            { emoji: "📱", tip: "Palpite antes do apito", desc: "Palpites só são aceitos até o início de cada partida. Fique atento às datas e horários no calendário." },
            { emoji: "👥", tip: "Conheça os rivais do bolão", desc: "Se souber que um adversário aposta sempre no Brasil, diversifique suas escolhas para diferenciá-las." },
          ].map((d) => (
            <div key={d.tip} className="flex items-start gap-3">
              <span className="text-xl shrink-0">{d.emoji}</span>
              <div>
                <span className="text-xs font-black block">{d.tip}</span>
                <span className="text-[10px] text-muted-foreground leading-relaxed">{d.desc}</span>
              </div>
            </div>
          ))}
        </div>
      </motion.section>

      {/* Notícias */}
      <motion.section variants={sectionVariants} initial="hidden" animate="visible" custom={7}>
        <div className="flex items-center justify-between mb-4">
          <SectionHeader icon={Globe} title="Últimas" accent="Notícias" />
          <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">via NewsAPI</span>
        </div>
        <NewsFeed teamCode={favoriteTeam} compact={false} limit={5} />
      </motion.section>

      {/* FAQ */}
      <motion.section variants={sectionVariants} initial="hidden" animate="visible" custom={8}>
        <SectionHeader icon={HelpCircle} title="Perguntas" accent="Frequentes" />
        <div className="glass-card px-4">
          {[
            {
              question: "A Copa 2026 terá 48 ou 32 seleções?",
              answer: "48 seleções — pela primeira vez na história. O torneio expandiu o formato em 2026, com 12 grupos de 4 e um Round of 32 inédito.",
            },
            {
              question: "Qual é a diferença entre o Round of 32 e as Oitavas de Final?",
              answer: "Na Copa 2026 o mata-mata começa no Round of 32 (32 times → 16). Depois vêm as Oitavas (16→8), Quartas (8→4), Semis (4→2) e Final.",
            },
            {
              question: "O Brasil está no Grupo C — quem são os adversários?",
              answer: "Marrocos, Haiti e Escócia. O Brasil estreia no dia 13/06/2026 no MetLife Stadium, em Nova York/NJ.",
            },
            {
              question: "Posso fazer palpites depois que o jogo começa?",
              answer: "Não! Os palpites trancam exatamente no momento do apito inicial. Planeje com antecedência consultando o calendário.",
            },
            {
              question: "Como funciona o desempate no bolão?",
              answer: "Em caso de empate de pontos, desempate é feito por: (1) palpites exatos, (2) palpites de vencedor/empate corretos, (3) ordem de cadastro no bolão.",
            },
            {
              question: "O ArenaCopa lida com apostas em dinheiro?",
              answer: "Não. O app é exclusivo para bolões de pontuação. Acordos financeiros entre participantes são responsabilidade dos próprios jogadores, fora do app.",
            },
            {
              question: "Quando o ArenaCopa será atualizado com resultados em tempo real?",
              answer: "A atualização de resultados ao vivo com API oficial está prevista para antes de 11/06/2026. Acompanhe as novidades no app.",
            },
          ].map((faq) => (
            <AccordionItem key={faq.question} question={faq.question} answer={faq.answer} />
          ))}
        </div>
      </motion.section>

      {/* Footer */}
      <div className="text-center pb-4">
        <p className="text-[9px] text-muted-foreground">
          Informações baseadas no sorteio oficial FIFA de dezembro de 2024.<br />
          Dados sujeitos a alteração pela FIFA.
        </p>
      </div>
    </div>
  );
};

export default Guia;
