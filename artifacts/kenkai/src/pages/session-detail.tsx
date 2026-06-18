import { useGetSession, useSendMessage, getGetSessionQueryKey } from "@workspace/api-client-react";
import { useParams, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Send, Sparkles, User } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function SessionDetail() {
  const { id } = useParams();
  const sessionId = parseInt(id || "0", 10);
  
  const { data: session, isLoading } = useGetSession(sessionId, { 
    query: { enabled: !!sessionId, queryKey: getGetSessionQueryKey(sessionId) } 
  });
  
  const sendMessage = useSendMessage();
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [session?.messages]);

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!content.trim() || sendMessage.isPending) return;

    sendMessage.mutate({
      id: sessionId,
      data: { content }
    }, {
      onSuccess: () => {
        setContent("");
        queryClient.invalidateQueries({ queryKey: getGetSessionQueryKey(sessionId) });
      }
    });
  };

  if (isLoading || !session) return <div className="p-8 text-center text-muted-foreground animate-pulse">Đang tải phiên...</div>;

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] max-w-4xl mx-auto border border-border/50 bg-card rounded-2xl overflow-hidden shadow-sm">
      <div className="flex items-center gap-4 p-4 border-b border-border/50 bg-background/50 backdrop-blur-sm z-10">
        <Link href="/sessions">
          <Button variant="ghost" size="icon" className="rounded-full hover:bg-secondary">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="font-semibold text-lg">{session.title}</h1>
          <p className="text-xs text-muted-foreground capitalize">Phiên tư vấn {session.category}</p>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-6 max-w-3xl mx-auto py-4">
          {(!session.messages || session.messages.length === 0) && (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-medium mb-2">KENKAI đã sẵn sàng</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Bắt đầu cuộc trò chuyện. Tôi ở đây để giúp bạn làm rõ mục tiêu và xây dựng chiến lược.
              </p>
            </div>
          )}
          
          {session.messages?.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div key={msg.id} className={`flex gap-4 ${isUser ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center ${isUser ? 'bg-secondary' : 'bg-primary'}`}>
                  {isUser ? <User className="w-4 h-4 text-secondary-foreground" /> : <Sparkles className="w-4 h-4 text-primary-foreground" />}
                </div>
                <div className={`max-w-[80%] rounded-2xl px-5 py-3.5 ${
                  isUser 
                    ? 'bg-secondary text-secondary-foreground rounded-tr-sm' 
                    : 'bg-primary/10 text-foreground rounded-tl-sm border border-primary/20'
                }`}>
                  <p className="whitespace-pre-wrap leading-relaxed text-sm">{msg.content}</p>
                </div>
              </div>
            );
          })}
          {sendMessage.isPending && (
            <div className="flex gap-4">
              <div className="w-8 h-8 shrink-0 rounded-full bg-primary flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-primary-foreground" />
              </div>
              <div className="bg-primary/10 rounded-2xl rounded-tl-sm px-5 py-4 border border-primary/20 flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-primary/50 animate-bounce" />
                <div className="w-1.5 h-1.5 rounded-full bg-primary/50 animate-bounce delay-100" />
                <div className="w-1.5 h-1.5 rounded-full bg-primary/50 animate-bounce delay-200" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-4 bg-background/50 border-t border-border/50 backdrop-blur-sm">
        <form onSubmit={handleSend} className="relative max-w-3xl mx-auto flex items-center">
          <Input 
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Nhập tin nhắn..." 
            className="pr-12 h-14 bg-secondary/50 border-border/50 rounded-xl"
            disabled={sendMessage.isPending}
          />
          <Button 
            type="submit" 
            size="icon" 
            className="absolute right-2 h-10 w-10 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
            disabled={!content.trim() || sendMessage.isPending}
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
