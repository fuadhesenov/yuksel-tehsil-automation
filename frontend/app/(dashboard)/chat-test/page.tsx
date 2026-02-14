"use client";

import DefaultCardComponent from "@/app/(dashboard)/components/default-card-component";
import DashboardBreadcrumb from "@/components/layout/dashboard-breadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { testPrompt } from "@/lib/api";
import { Send, Loader2, Bot, User, Trash2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import toast from "react-hot-toast";

interface Message {
  role: "user" | "ai";
  content: string;
  timestamp: Date;
}

export default function ChatTestPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setMessages((prev) => [
      ...prev,
      { role: "user", content: userMsg, timestamp: new Date() },
    ]);
    setInput("");
    setLoading(true);
    try {
      const res = await testPrompt(userMsg);
      setMessages((prev) => [
        ...prev,
        { role: "ai", content: res.reply || "Cavab yoxdur.", timestamp: new Date() },
      ]);
    } catch {
      toast.error("Backend-ə qoşulmaq mümkün olmadı.");
      setMessages((prev) => [
        ...prev,
        { role: "ai", content: "Xəta: Backend-ə qoşulmaq mümkün olmadı.", timestamp: new Date() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <DashboardBreadcrumb title="Chat Test" text="Chat Test" />

      <div className="grid grid-cols-12 gap-5">
        <div className="lg:col-span-8 col-span-12">
          <DefaultCardComponent
            title={
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <Bot className="w-5 h-5 text-primary" />
                  <span>Test Söhbəti</span>
                </div>
                {messages.length > 0 && (
                  <button
                    onClick={() => setMessages([])}
                    className="text-sm text-neutral-400 hover:text-red-500 flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Təmizlə
                  </button>
                )}
              </div>
            }
          >
            {/* Messages */}
            <div
              ref={scrollRef}
              className="h-[400px] overflow-y-auto rounded-lg bg-neutral-50 dark:bg-slate-800 p-4 space-y-3 mb-4"
            >
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center text-neutral-400">
                  <Bot className="w-12 h-12 mb-3 opacity-30" />
                  <p className="text-sm">Test mesajı göndərin...</p>
                  <p className="text-xs mt-1">Məs: &quot;YÖS kursu haqqında məlumat verin&quot;</p>
                </div>
              )}

              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex gap-2 max-w-[85%] ${m.role === "user" ? "ml-auto flex-row-reverse" : ""}`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      m.role === "user" ? "bg-primary/20" : "bg-green-500/20"
                    }`}
                  >
                    {m.role === "user" ? (
                      <User className="w-4 h-4 text-primary" />
                    ) : (
                      <Bot className="w-4 h-4 text-green-600" />
                    )}
                  </div>
                  <div
                    className={`rounded-xl px-3.5 py-2.5 text-sm ${
                      m.role === "user"
                        ? "bg-primary text-white"
                        : "bg-white dark:bg-slate-700 border border-neutral-200 dark:border-slate-600"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{m.content}</p>
                    <p
                      className={`text-[10px] mt-1 ${
                        m.role === "user" ? "text-white/60" : "text-neutral-400"
                      }`}
                    >
                      {m.timestamp.toLocaleTimeString("az-AZ", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex gap-2">
                  <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="bg-white dark:bg-slate-700 border border-neutral-200 dark:border-slate-600 rounded-xl px-3.5 py-2.5">
                    <div className="flex items-center gap-1.5 text-sm text-neutral-400">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      yazır...
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="flex gap-3">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Bir mesaj yazın..."
                className="border border-neutral-300 px-5 dark:border-slate-500 focus:border-primary dark:focus:border-primary focus-visible:border-primary h-12 rounded-lg !shadow-none !ring-0"
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                disabled={loading}
              />
              <Button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                variant="default"
                className="h-12 px-6"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </DefaultCardComponent>
        </div>

        {/* Quick prompts sidebar */}
        <div className="lg:col-span-4 col-span-12">
          <DefaultCardComponent title="Test Nümunələri">
            <div className="flex flex-col gap-2">
              {[
                "YÖS kursu haqqında məlumat verin",
                "Qiymətlər nə qədərdir?",
                "Türkiyədə hansı universitetlərə göndərirsiniz?",
                "IELTS hazırlığı varmı?",
                "Ünvanınız haradır?",
                "Pulsuz konsultasiya varmı?",
                "İş saatlarınız neçədir?",
                "Qeydiyyat necə olur?",
              ].map((q) => (
                <button
                  key={q}
                  onClick={() => setInput(q)}
                  className="text-left text-sm px-3 py-2.5 rounded-lg bg-neutral-50 dark:bg-slate-800 border border-neutral-200 dark:border-slate-600 text-neutral-600 dark:text-neutral-300 hover:border-primary/50 hover:text-primary transition-colors cursor-pointer"
                >
                  {q}
                </button>
              ))}
            </div>
          </DefaultCardComponent>
        </div>
      </div>
    </>
  );
}
