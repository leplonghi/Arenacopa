import { useState, useEffect, useRef } from "react";
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, limit } from "firebase/firestore";
import { db } from "@/integrations/firebase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrentProfile } from "@/hooks/useCurrentProfile";
import { Send, MessageCircle, Loader2 } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { formatRelative } from "date-fns";
import { ptBR } from "date-fns/locale";
import { tStatic } from "@/i18n/staticText";

interface Message {
  id: string;
  text: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  createdAt: Date | null;
}

export function CommunityFeed({ groupId }: { groupId: string }) {
  const { user } = useAuth();
  const { data: profile } = useCurrentProfile();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!groupId) return;

    const q = query(
      collection(db, "grupo_messages"),
      orderBy("createdAt", "asc"),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs
        .map((doc) => {
          const data = doc.data();
          // Only show messages for this group
          if (data.groupId !== groupId) return null;
          return {
            id: doc.id,
            text: data.text,
            userId: data.userId,
            userName: data.userName,
            userAvatar: data.userAvatar,
            createdAt: data.createdAt?.toDate() || null,
          } as Message;
        })
        .filter(Boolean) as Message[];

      setMessages(msgs);
      setLoading(false);
      setTimeout(() => scrollToBottom(), 100);
    });

    return () => unsubscribe();
  }, [groupId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !profile || !groupId) return;

    setSending(true);
    try {
      await addDoc(collection(db, "grupo_messages"), {
        text: newMessage.trim(),
        userId: user.id,
        userName: profile.name || profile.nickname || "Jogador",
        userAvatar: profile.avatar_url || null,
        groupId,
        createdAt: serverTimestamp(),
      });
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-[600px] flex-col rounded-[32px] border border-white/10 bg-white/5 overflow-hidden">
      <div className="flex items-center gap-3 border-b border-white/10 bg-white/5 px-6 py-4">
        <MessageCircle className="h-6 w-6 text-primary" />
        <div>
          <h3 className="font-display text-lg font-semibold text-white">{tStatic("Resenha da Comunidade")}</h3>
          <p className="text-xs text-zinc-400">{tStatic("Converse com os membros e mande seus palpites")}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <MessageCircle className="mb-4 h-12 w-12 text-zinc-500" />
            <p className="text-sm font-bold text-zinc-300">{tStatic("Nenhuma mensagem ainda")}</p>
            <p className="mt-1 text-xs text-zinc-500">{tStatic("Mande a primeira mensagem na resenha!")}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {messages.map((msg) => {
              const isMine = msg.userId === user?.id;
              return (
                <div key={msg.id} className={`flex w-full ${isMine ? "justify-end" : "justify-start"}`}>
                  <div className={`flex max-w-[85%] gap-3 ${isMine ? "flex-row-reverse" : "flex-row"}`}>
                    {!isMine && (
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarImage src={msg.userAvatar} />
                        <AvatarFallback>{msg.userName.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                    )}
                    <div className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}>
                      {!isMine && <span className="mb-1 text-[10px] font-bold text-zinc-400">{msg.userName}</span>}
                      <div
                        className={`rounded-2xl px-4 py-2.5 text-sm ${
                          isMine
                            ? "bg-primary text-black rounded-tr-sm"
                            : "bg-white/10 text-white rounded-tl-sm"
                        }`}
                      >
                        {msg.text}
                      </div>
                      <span className="mt-1 text-[9px] text-zinc-500">
                        {msg.createdAt ? formatRelative(msg.createdAt, new Date(), { locale: ptBR }) : "Agora"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <form onSubmit={handleSend} className="border-t border-white/10 bg-white/5 p-4">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Digite sua mensagem..."
            className="flex-1 rounded-full border border-white/10 bg-black/50 px-5 py-3 text-sm text-white placeholder-zinc-500 outline-none focus:border-primary/50 transition-colors"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-black disabled:opacity-50 transition-transform active:scale-95"
          >
            {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          </button>
        </div>
      </form>
    </div>
  );
}
