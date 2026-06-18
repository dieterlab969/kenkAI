import {
  useListSessions,
  useCreateSession,
  useGetSession,
  useSendMessage,
  useDeleteSession,
  getListSessionsQueryKey,
  getGetSessionQueryKey,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useState, useRef, useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Plus, Search, Trash2, Sparkles, User, Send,
  MessageSquare, BriefcaseBusiness, GraduationCap, Heart, X,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Category = "personal" | "career" | "business";
type FilterTab = "all" | Category;

const CATEGORY_LABELS: Record<Category, string> = {
  personal: "Cá nhân",
  career: "Sự nghiệp",
  business: "Kinh doanh",
};

const CATEGORY_ICONS: Record<Category, React.ElementType> = {
  personal: Heart,
  career: GraduationCap,
  business: BriefcaseBusiness,
};

const CATEGORY_COLORS: Record<Category, string> = {
  personal: "text-pink-400",
  career: "text-amber-400",
  business: "text-blue-400",
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "vừa xong";
  if (mins < 60) return `${mins} phút trước`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} giờ trước`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days} ngày trước`;
  return new Date(iso).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
}

export default function Sessions() {
  const { data: sessions = [], isLoading } = useListSessions();
  const createSession = useCreateSession();
  const deleteSession = useDeleteSession();
  const queryClient = useQueryClient();

  const [activeId, setActiveId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterTab>("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState<Category>("personal");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Sort: most recent first
  const sorted = [...sessions].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  const filtered = sorted.filter((s) => {
    const matchFilter = filter === "all" || s.category === filter;
    const matchSearch = s.title.toLowerCase().includes(search.toLowerCase()) ||
      (s.lastMessage ?? "").toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const handleCreate = () => {
    if (!newTitle.trim()) return;
    createSession.mutate(
      { data: { category: newCategory, title: newTitle.trim() } },
      {
        onSuccess: (data) => {
          setCreateOpen(false);
          setNewTitle("");
          queryClient.invalidateQueries({ queryKey: getListSessionsQueryKey() });
          setActiveId(data.id);
        },
      }
    );
  };

  const handleDelete = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingId(id);
    deleteSession.mutate(
      { id },
      {
        onSuccess: () => {
          if (activeId === id) setActiveId(null);
          queryClient.invalidateQueries({ queryKey: getListSessionsQueryKey() });
          setDeletingId(null);
        },
        onError: () => setDeletingId(null),
      }
    );
  };

  return (
    <div
      className="flex overflow-hidden rounded-2xl border border-white/6 bg-[#0C0C14]"
      style={{ height: "calc(100vh - 2rem)" }}
    >
      {/* ── LEFT SIDEBAR ── */}
      <div className="w-72 shrink-0 flex flex-col border-r border-white/6 bg-[#08080F]">
        {/* Header */}
        <div className="p-4 space-y-3 border-b border-white/6">
          <div className="flex items-center justify-between">
            <h1 className="text-sm font-semibold text-white/80 tracking-wide">Phiên tư vấn</h1>
            <span className="text-xs text-white/30">{sessions.length} phiên</span>
          </div>

          {/* New session button */}
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button
                className="w-full h-9 bg-blue-600 hover:bg-blue-500 text-white text-sm gap-2 rounded-xl"
                data-testid="button-new-session"
              >
                <Plus className="w-4 h-4" />
                Phiên mới
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#111118] border-white/10">
              <DialogHeader>
                <DialogTitle className="text-white/90">Tạo phiên tư vấn mới</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label className="text-white/60 text-xs">Lĩnh vực</Label>
                  <Select value={newCategory} onValueChange={(v) => setNewCategory(v as Category)}>
                    <SelectTrigger className="bg-white/4 border-white/10 text-white/80">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#111118] border-white/10">
                      <SelectItem value="personal">Cá nhân</SelectItem>
                      <SelectItem value="career">Sự nghiệp</SelectItem>
                      <SelectItem value="business">Kinh doanh</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-white/60 text-xs">Chủ đề</Label>
                  <Input
                    placeholder="Vd: Định hướng nghề nghiệp 5 năm tới..."
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                    className="bg-white/4 border-white/10 text-white/90 placeholder:text-white/25"
                    data-testid="input-session-title"
                    autoFocus
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setCreateOpen(false)} className="text-white/50">
                  Hủy
                </Button>
                <Button
                  onClick={handleCreate}
                  disabled={!newTitle.trim() || createSession.isPending}
                  className="bg-blue-600 hover:bg-blue-500 text-white"
                  data-testid="button-create-session"
                >
                  {createSession.isPending ? "Đang tạo..." : "Bắt đầu"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/25" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm..."
              className="pl-9 h-8 bg-white/4 border-white/8 text-white/80 placeholder:text-white/25 text-sm rounded-lg focus-visible:ring-0 focus-visible:border-white/20"
              data-testid="input-search-sessions"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 px-3 py-2 border-b border-white/6">
          {(["all", "personal", "career", "business"] as FilterTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={cn(
                "flex-1 text-[10px] font-medium py-1 rounded-md transition-colors",
                filter === tab
                  ? "bg-white/10 text-white/90"
                  : "text-white/30 hover:text-white/60"
              )}
              data-testid={`filter-tab-${tab}`}
            >
              {tab === "all" ? "Tất cả" : CATEGORY_LABELS[tab]}
            </button>
          ))}
        </div>

        {/* Session list */}
        <div className="flex-1 overflow-y-auto py-1">
          {isLoading && (
            <div className="space-y-1 p-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-14 rounded-xl bg-white/3 animate-pulse" />
              ))}
            </div>
          )}

          {!isLoading && filtered.length === 0 && (
            <div className="text-center py-12 px-4">
              <MessageSquare className="w-8 h-8 text-white/15 mx-auto mb-3" />
              <p className="text-white/30 text-xs leading-relaxed">
                {search ? `Không tìm thấy phiên nào cho "${search}"` : "Chưa có phiên tư vấn nào"}
              </p>
            </div>
          )}

          {filtered.map((session) => {
            const isActive = session.id === activeId;
            const Cat = CATEGORY_ICONS[session.category as Category] ?? MessageSquare;
            const catColor = CATEGORY_COLORS[session.category as Category] ?? "text-white/40";

            return (
              <div
                key={session.id}
                onClick={() => setActiveId(session.id)}
                className={cn(
                  "group mx-2 my-0.5 px-3 py-2.5 rounded-xl cursor-pointer transition-colors relative",
                  isActive
                    ? "bg-blue-600/15 border border-blue-500/20"
                    : "hover:bg-white/4"
                )}
                data-testid={`session-item-${session.id}`}
              >
                <div className="flex items-start gap-2.5 pr-6">
                  <Cat className={cn("w-3.5 h-3.5 shrink-0 mt-0.5", isActive ? "text-blue-400" : catColor)} />
                  <div className="min-w-0 flex-1">
                    <p className={cn(
                      "text-sm font-medium truncate leading-tight",
                      isActive ? "text-white/95" : "text-white/65"
                    )}>
                      {session.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-white/25">{timeAgo(session.updatedAt)}</span>
                      {session.messageCount > 0 && (
                        <>
                          <span className="text-white/15">·</span>
                          <span className="text-[10px] text-white/25">{session.messageCount} tin</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Delete button */}
                <button
                  onClick={(e) => handleDelete(session.id, e)}
                  disabled={deletingId === session.id}
                  className={cn(
                    "absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-lg transition-all",
                    "opacity-0 group-hover:opacity-100",
                    "hover:bg-red-500/15 text-white/30 hover:text-red-400",
                    deletingId === session.id && "opacity-100 animate-pulse"
                  )}
                  data-testid={`button-delete-session-${session.id}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer stats */}
        <div className="px-4 py-3 border-t border-white/6">
          <p className="text-[10px] text-white/20">
            {filtered.length} / {sessions.length} phiên
          </p>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {activeId ? (
          <ActiveSessionPanel
            sessionId={activeId}
            onClose={() => setActiveId(null)}
          />
        ) : (
          <EmptyState onNew={() => setCreateOpen(true)} />
        )}
      </div>
    </div>
  );
}

/* ── Empty state ── */
function EmptyState({ onNew }: { onNew: () => void }) {
  const suggestions = [
    { icon: GraduationCap, color: "text-amber-400", text: "Lộ trình phát triển kỹ năng lãnh đạo" },
    { icon: BriefcaseBusiness, color: "text-blue-400", text: "Chiến lược go-to-market cho sản phẩm mới" },
    { icon: Heart, color: "text-pink-400", text: "Cân bằng công việc và cuộc sống cá nhân" },
    { icon: GraduationCap, color: "text-amber-400", text: "Chuẩn bị cho buổi phỏng vấn quan trọng" },
  ];

  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
      <div className="w-14 h-14 rounded-2xl bg-blue-600/15 border border-blue-500/20 flex items-center justify-center mb-5">
        <Sparkles className="w-6 h-6 text-blue-400" />
      </div>
      <h2 className="text-xl font-semibold text-white/90 mb-2">Chọn phiên để tiếp tục</h2>
      <p className="text-sm text-white/35 max-w-xs mb-8 leading-relaxed">
        Chọn một phiên tư vấn từ danh sách bên trái, hoặc bắt đầu cuộc trò chuyện mới.
      </p>

      <Button
        onClick={onNew}
        className="bg-blue-600 hover:bg-blue-500 text-white gap-2 rounded-xl mb-10"
        data-testid="button-empty-new-session"
      >
        <Plus className="w-4 h-4" />
        Phiên tư vấn mới
      </Button>

      <div className="grid grid-cols-2 gap-2 w-full max-w-lg">
        {suggestions.map(({ icon: Icon, color, text }) => (
          <div
            key={text}
            className="text-left px-4 py-3 rounded-xl bg-white/3 border border-white/6 hover:bg-white/5 transition-colors cursor-default"
          >
            <Icon className={cn("w-4 h-4 mb-2", color)} />
            <p className="text-xs text-white/50 leading-relaxed">{text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Active session panel ── */
function ActiveSessionPanel({
  sessionId,
  onClose,
}: {
  sessionId: number;
  onClose: () => void;
}) {
  const { data: session, isLoading } = useGetSession(sessionId, {
    query: { enabled: !!sessionId, queryKey: getGetSessionQueryKey(sessionId) },
  });
  const sendMessage = useSendMessage();
  const queryClient = useQueryClient();

  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    setInput("");
    scrollToBottom();
  }, [sessionId, scrollToBottom]);

  useEffect(() => {
    scrollToBottom();
  }, [session?.messages, scrollToBottom]);

  const handleSend = () => {
    if (!input.trim() || sendMessage.isPending) return;
    const msg = input.trim();
    setInput("");
    sendMessage.mutate(
      { id: sessionId, data: { content: msg } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetSessionQueryKey(sessionId) });
        },
      }
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-white/30 text-sm animate-pulse">Đang tải...</div>
      </div>
    );
  }

  if (!session) return null;

  const Cat = CATEGORY_ICONS[session.category as Category] ?? MessageSquare;
  const catColor = CATEGORY_COLORS[session.category as Category] ?? "text-white/40";
  const catLabel = CATEGORY_LABELS[session.category as Category] ?? session.category;

  return (
    <>
      {/* Session header */}
      <div className="flex items-center gap-3 px-5 py-3.5 border-b border-white/6 shrink-0">
        <div className={cn("shrink-0", catColor)}>
          <Cat className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-semibold text-white/90 truncate">{session.title}</h2>
          <p className="text-xs text-white/35">{catLabel} · {session.messageCount} tin nhắn</p>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-white/6 text-white/30 hover:text-white/60 transition-colors"
          data-testid="button-close-session"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        <div className="max-w-3xl mx-auto space-y-5">
          {(!session.messages || session.messages.length === 0) && (
            <div className="text-center py-14">
              <div className="w-12 h-12 rounded-2xl bg-blue-600/15 border border-blue-500/20 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-5 h-5 text-blue-400" />
              </div>
              <h3 className="text-base font-medium text-white/70 mb-1">KENKAI đã sẵn sàng</h3>
              <p className="text-sm text-white/30 max-w-sm mx-auto">
                Bắt đầu trò chuyện để nhận hướng dẫn chiến lược được cá nhân hóa.
              </p>
            </div>
          )}

          {session.messages?.map((msg) => {
            const isUser = msg.role === "user";
            return (
              <div
                key={msg.id}
                className={cn("flex gap-3", isUser && "flex-row-reverse")}
                data-testid={`message-bubble-${msg.id}`}
              >
                <div className={cn(
                  "w-7 h-7 shrink-0 rounded-full flex items-center justify-center mt-0.5",
                  isUser ? "bg-white/8" : "bg-blue-600"
                )}>
                  {isUser
                    ? <User className="w-3.5 h-3.5 text-white/60" />
                    : <Sparkles className="w-3.5 h-3.5 text-white" />}
                </div>
                <div className={cn(
                  "max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap",
                  isUser
                    ? "bg-white/7 text-white/85 rounded-tr-sm"
                    : "bg-blue-600/12 text-white/90 rounded-tl-sm border border-blue-500/15"
                )}>
                  {msg.content}
                </div>
              </div>
            );
          })}

          {sendMessage.isPending && (
            <div className="flex gap-3">
              <div className="w-7 h-7 shrink-0 rounded-full bg-blue-600 flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="bg-blue-600/12 rounded-2xl rounded-tl-sm px-4 py-3 border border-blue-500/15 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="px-6 pb-5 pt-3 border-t border-white/6 shrink-0">
        <div className="max-w-3xl mx-auto relative">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Nhập tin nhắn... (Enter gửi, Shift+Enter xuống dòng)"
            disabled={sendMessage.isPending}
            rows={1}
            className="resize-none pr-12 min-h-[50px] max-h-32 bg-white/4 border-white/10 rounded-xl text-sm text-white/90 placeholder:text-white/20 focus:border-blue-500/40 focus-visible:ring-0"
            data-testid="input-session-message"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || sendMessage.isPending}
            size="icon"
            className="absolute right-2 bottom-2 h-8 w-8 rounded-lg bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-25"
            data-testid="button-send-session-message"
          >
            <Send className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </>
  );
}
