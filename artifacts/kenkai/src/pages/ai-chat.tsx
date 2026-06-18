import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Send, Sparkles, User, Plus, Trash2, MessageSquare } from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface Conversation {
  id: number;
  title: string;
  createdAt: string;
}

interface Message {
  id: number;
  conversationId: number;
  role: string;
  content: string;
  createdAt: string;
}

interface ConversationWithMessages extends Conversation {
  messages: Message[];
}

async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function apiDelete(path: string): Promise<void> {
  await fetch(`${BASE}${path}`, { method: "DELETE" });
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function MessageBubble({ msg, streaming }: { msg: Message; streaming?: boolean }) {
  const isUser = msg.role === "user";
  return (
    <div className={cn("flex gap-3 group", isUser && "flex-row-reverse")} data-testid={`message-${msg.id}`}>
      <div className={cn(
        "w-8 h-8 shrink-0 rounded-full flex items-center justify-center mt-1",
        isUser ? "bg-white/10" : "bg-blue-600"
      )}>
        {isUser
          ? <User className="w-4 h-4 text-white/70" />
          : <Sparkles className="w-4 h-4 text-white" />}
      </div>
      <div className={cn(
        "max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap",
        isUser
          ? "bg-white/8 text-white/90 rounded-tr-sm"
          : "bg-blue-600/15 text-white/95 rounded-tl-sm border border-blue-500/20"
      )}>
        {msg.content}
        {streaming && (
          <span className="inline-flex gap-0.5 ml-1 align-middle">
            <span className="w-1 h-1 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: "0ms" }} />
            <span className="w-1 h-1 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: "150ms" }} />
            <span className="w-1 h-1 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: "300ms" }} />
          </span>
        )}
      </div>
    </div>
  );
}

export default function AiChat() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<ConversationWithMessages | null>(null);
  const [streamingContent, setStreamingContent] = useState<string>("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [input, setInput] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [activeConv?.messages, streamingContent, scrollToBottom]);

  useEffect(() => {
    apiGet<Conversation[]>("/api/gemini/conversations")
      .then(setConversations)
      .catch(() => {});
  }, []);

  const loadConversation = useCallback(async (id: number) => {
    const conv = await apiGet<ConversationWithMessages>(`/api/gemini/conversations/${id}`);
    setActiveConv(conv);
    setStreamingContent("");
  }, []);

  const newConversation = useCallback(async () => {
    const titles = [
      "Phiên tư vấn mới",
      "Khám phá chiến lược",
      "Phân tích mục tiêu",
      "Tư duy rõ ràng",
    ];
    const title = titles[Math.floor(Math.random() * titles.length)];
    const conv = await apiPost<Conversation>("/api/gemini/conversations", { title });
    setConversations(prev => [conv, ...prev]);
    setActiveConv({ ...conv, messages: [] });
    setStreamingContent("");
  }, []);

  const deleteConversation = useCallback(async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    await apiDelete(`/api/gemini/conversations/${id}`);
    setConversations(prev => prev.filter(c => c.id !== id));
    if (activeConv?.id === id) {
      setActiveConv(null);
      setStreamingContent("");
    }
  }, [activeConv?.id]);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || isStreaming || !activeConv) return;

    const content = input.trim();
    setInput("");

    const userMsg: Message = {
      id: Date.now(),
      conversationId: activeConv.id,
      role: "user",
      content,
      createdAt: new Date().toISOString(),
    };

    setActiveConv(prev => prev ? { ...prev, messages: [...prev.messages, userMsg] } : null);
    setIsStreaming(true);
    setStreamingContent("");

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch(`${BASE}/api/gemini/conversations/${activeConv.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
        signal: controller.signal,
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.content) {
              accumulated += data.content;
              setStreamingContent(accumulated);
            }
            if (data.done) {
              const assistantMsg: Message = {
                id: Date.now() + 1,
                conversationId: activeConv.id,
                role: "assistant",
                content: accumulated,
                createdAt: new Date().toISOString(),
              };
              setActiveConv(prev => prev ? {
                ...prev,
                messages: [...prev.messages, assistantMsg],
              } : null);
              setStreamingContent("");
            }
          } catch {}
        }
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        const errMsg: Message = {
          id: Date.now() + 1,
          conversationId: activeConv.id,
          role: "assistant",
          content: "Đã xảy ra lỗi khi kết nối với AI. Vui lòng thử lại.",
          createdAt: new Date().toISOString(),
        };
        setActiveConv(prev => prev ? { ...prev, messages: [...prev.messages, errMsg] } : null);
        setStreamingContent("");
      }
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  }, [input, isStreaming, activeConv]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const allMessages = activeConv?.messages ?? [];
  const showStreaming = isStreaming && streamingContent;

  return (
    <div className="flex h-[calc(100vh-2rem)] overflow-hidden rounded-2xl border border-white/6 bg-[#0C0C14]">
      {/* Sidebar */}
      <div className={cn(
        "flex flex-col border-r border-white/6 bg-[#08080F] transition-all duration-300",
        sidebarOpen ? "w-72 shrink-0" : "w-0 overflow-hidden"
      )}>
        <div className="p-4 border-b border-white/6">
          <div className="flex items-center justify-between mb-3">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="text-white/50 hover:text-white/90 gap-2 -ml-2">
                <ArrowLeft className="w-4 h-4" />
                <span className="text-xs">Dashboard</span>
              </Button>
            </Link>
          </div>
          <Button
            onClick={newConversation}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white gap-2 rounded-xl h-9 text-sm"
            data-testid="button-new-conversation"
          >
            <Plus className="w-4 h-4" />
            Cuộc hội thoại mới
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {conversations.length === 0 && (
            <p className="text-white/30 text-xs text-center py-8">Chưa có cuộc hội thoại nào</p>
          )}
          {conversations.map(conv => (
            <button
              key={conv.id}
              onClick={() => loadConversation(conv.id)}
              data-testid={`conversation-item-${conv.id}`}
              className={cn(
                "w-full text-left px-3 py-2.5 rounded-xl group flex items-start gap-2.5 transition-colors",
                activeConv?.id === conv.id
                  ? "bg-blue-600/15 border border-blue-500/20"
                  : "hover:bg-white/4"
              )}
            >
              <MessageSquare className={cn("w-4 h-4 shrink-0 mt-0.5", activeConv?.id === conv.id ? "text-blue-400" : "text-white/30")} />
              <div className="flex-1 min-w-0">
                <p className={cn("text-sm font-medium truncate", activeConv?.id === conv.id ? "text-white/95" : "text-white/60")}>
                  {conv.title}
                </p>
                <p className="text-xs text-white/30 mt-0.5">{formatDate(conv.createdAt)}</p>
              </div>
              <button
                onClick={(e) => deleteConversation(conv.id, e)}
                className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-red-500/20 transition-all"
                data-testid={`button-delete-conversation-${conv.id}`}
              >
                <Trash2 className="w-3.5 h-3.5 text-red-400" />
              </button>
            </button>
          ))}
        </div>

        <div className="p-4 border-t border-white/6">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            <span className="text-xs text-white/40">Gemini 3 Flash Preview</span>
          </div>
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-white/6">
          <button
            onClick={() => setSidebarOpen(v => !v)}
            className="p-1.5 rounded-lg hover:bg-white/6 transition-colors"
            data-testid="button-toggle-sidebar"
          >
            <MessageSquare className="w-4 h-4 text-white/50" />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-white/90">KENKAI AI</h1>
              <p className="text-xs text-white/40">Đối tác tư duy chiến lược</p>
            </div>
          </div>
          {activeConv && (
            <span className="ml-auto text-xs text-white/30 truncate max-w-48">{activeConv.title}</span>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {!activeConv ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-blue-600/15 border border-blue-500/20 flex items-center justify-center mb-5">
                <Sparkles className="w-8 h-8 text-blue-400" />
              </div>
              <h2 className="text-xl font-semibold text-white/90 mb-2">Chào mừng đến với KENKAI AI</h2>
              <p className="text-sm text-white/40 max-w-sm mb-6 leading-relaxed">
                Tôi là đối tác tư duy chiến lược của bạn — giúp bạn đạt sự rõ ràng, đưa ra quyết định tốt hơn và xây dựng kế hoạch hành động.
              </p>
              <Button
                onClick={newConversation}
                className="bg-blue-600 hover:bg-blue-500 text-white gap-2 rounded-xl"
                data-testid="button-start-conversation"
              >
                <Plus className="w-4 h-4" />
                Bắt đầu cuộc hội thoại
              </Button>
              <div className="mt-10 grid grid-cols-1 gap-2 w-full max-w-md">
                {[
                  "Giúp tôi xác định mục tiêu sự nghiệp trong 3 năm tới",
                  "Phân tích điểm mạnh và điểm yếu của ý tưởng kinh doanh của tôi",
                  "Tôi cần lộ trình phát triển kỹ năng lãnh đạo",
                ].map((prompt) => (
                  <button
                    key={prompt}
                    onClick={async () => {
                      const conv = await apiPost<Conversation>("/api/gemini/conversations", { title: prompt.slice(0, 40) });
                      setConversations(prev => [conv, ...prev]);
                      setActiveConv({ ...conv, messages: [] });
                      setTimeout(() => setInput(prompt), 100);
                    }}
                    className="text-left px-4 py-3 rounded-xl bg-white/4 hover:bg-white/7 border border-white/6 text-sm text-white/60 hover:text-white/80 transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-5">
              {allMessages.length === 0 && !isStreaming && (
                <div className="text-center py-12">
                  <p className="text-white/30 text-sm">Bắt đầu cuộc hội thoại bằng cách gõ tin nhắn bên dưới.</p>
                </div>
              )}
              {allMessages.map((msg) => (
                <MessageBubble key={msg.id} msg={msg} />
              ))}
              {showStreaming && (
                <MessageBubble
                  msg={{
                    id: -1,
                    conversationId: activeConv.id,
                    role: "assistant",
                    content: streamingContent,
                    createdAt: new Date().toISOString(),
                  }}
                  streaming
                />
              )}
              {isStreaming && !streamingContent && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 shrink-0 rounded-full bg-blue-600 flex items-center justify-center mt-1">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-blue-600/15 rounded-2xl rounded-tl-sm px-4 py-3 border border-blue-500/20 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input */}
        {activeConv && (
          <div className="px-6 pb-5 pt-3 border-t border-white/6">
            <div className="max-w-3xl mx-auto relative">
              <Textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Nhập tin nhắn... (Enter để gửi, Shift+Enter để xuống dòng)"
                className="resize-none pr-12 min-h-[52px] max-h-36 bg-white/4 border-white/10 rounded-xl text-sm text-white/90 placeholder:text-white/25 focus:border-blue-500/50 focus:ring-0 focus:ring-offset-0"
                rows={1}
                disabled={isStreaming}
                data-testid="input-message"
              />
              <Button
                onClick={sendMessage}
                disabled={!input.trim() || isStreaming}
                size="icon"
                className="absolute right-2 bottom-2 h-8 w-8 rounded-lg bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-30 disabled:cursor-not-allowed"
                data-testid="button-send-message"
              >
                <Send className="w-3.5 h-3.5" />
              </Button>
            </div>
            <p className="text-center text-xs text-white/20 mt-2">
              Powered by Google Gemini — KENKAI có thể mắc lỗi, hãy kiểm chứng thông tin quan trọng
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
