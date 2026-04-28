import { useState, useRef, useEffect } from "react";
import { Bot, X, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Message = { role: "user" | "assistant"; content: string };

function getLocalFallbackReply(question: string, gymName: string, gymPhone: string) {
  const q = question.toLowerCase();
  if (q.includes("timing") || q.includes("time") || q.includes("open")) {
    return `${gymName} is open from 5:00 AM to 11:00 PM. Aap kab aana chahoge?`;
  }
  if (q.includes("price") || q.includes("plan") || q.includes("fee") || q.includes("membership")) {
    return `Plans start from Rs 999/month. Agar chaho to best plan suggest kar deta hoon based on your goal.`;
  }
  if (q.includes("trial") || q.includes("demo")) {
    return gymPhone
      ? `Yes, free trial available hai. WhatsApp par ping karo: ${gymPhone} and we will help you book it.`
      : `Yes, free trial available hai. Please contact ${gymName} to book it.`;
  }
  if (q.includes("class") || q.includes("zumba") || q.includes("yoga") || q.includes("hiit")) {
    return `Hum Yoga, HIIT aur Zumba sessions offer karte hain. Batao kaunsa format pasand hai, us hisaab se suggest karta hoon.`;
  }
  return gymPhone
    ? `Sorry, live AI service abhi reachable nahi hai. For quick help, contact ${gymName} at ${gymPhone}.`
    : `Sorry, live AI service abhi reachable nahi hai. Please contact ${gymName} for quick help.`;
}

export default function AIChatbot() {
  const [open, setOpen] = useState(false);
  const gymName = localStorage.getItem("gym_name") || "My Gym";
  const gymPhone = localStorage.getItem("gym_phone") || "";
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: `Hi! I'm the ${gymName} AI assistant. Ask me anything about our plans, timings, trainers, or facilities! 💪` },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg: Message = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("ai-chat", {
        body: { messages: newMessages, gymName: gymName, gymPhone: gymPhone },
      });
      if (error) {
        console.error("AI Chat Error:", error);
        throw error;
      }
      if (!data?.content) {
        throw new Error("Empty response from ai-chat function");
      }
      setMessages((prev) => [...prev, { role: "assistant", content: data.content }]);
    } catch (err) {
      console.error("Chatbot Error:", err);
      const errorText = err instanceof Error ? err.message : "Unknown chatbot error";
      if (errorText.toLowerCase().includes("api key") || errorText.toLowerCase().includes("groq")) {
        toast.error("AI service is not configured on server. Please set GROQ_API_KEY in Supabase Edge Function secrets.");
      }
      const fallback = getLocalFallbackReply(userMsg.content, gymName, gymPhone);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: fallback },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Chat bubble */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-24 right-6 z-50 bg-accent text-accent-foreground p-3.5 rounded-full shadow-lg hover:scale-110 transition-transform animate-bounce-subtle"
        >
          <Bot className="h-6 w-6" />
        </button>
      )}

      {/* Chat window */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-80 h-[420px] bg-card rounded-2xl shadow-2xl border border-border flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-primary text-primary-foreground px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              <div>
                <p className="text-sm font-semibold">{gymName}</p>
                <p className="text-xs flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-success inline-block" /> Online
                </p>
              </div>
            </div>
            <button onClick={() => setOpen(false)}><X className="h-5 w-5" /></button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] px-3 py-2 rounded-xl text-sm ${
                    m.role === "user"
                      ? "bg-accent text-accent-foreground rounded-br-sm"
                      : "bg-secondary text-secondary-foreground rounded-bl-sm"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-secondary text-secondary-foreground px-3 py-2 rounded-xl rounded-bl-sm">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-3 border-t border-border flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Type a message..."
              className="flex-1 bg-secondary text-sm px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-accent"
            />
            <Button size="icon" onClick={send} disabled={loading} className="bg-accent hover:bg-accent/90 h-9 w-9">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
