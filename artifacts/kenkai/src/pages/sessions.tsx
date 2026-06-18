import { useListSessions, useCreateSession, getListSessionsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useLocation } from "wouter";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { MessageSquare, Plus, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Sessions() {
  const { data: sessions, isLoading } = useListSessions();
  const createSession = useCreateSession();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  
  const [open, setOpen] = useState(false);
  const [newCategory, setNewCategory] = useState<"personal" | "career" | "business">("personal");
  const [newTitle, setNewTitle] = useState("");

  const handleCreate = () => {
    createSession.mutate({
      data: { category: newCategory, title: newTitle }
    }, {
      onSuccess: (data) => {
        setOpen(false);
        queryClient.invalidateQueries({ queryKey: getListSessionsQueryKey() });
        setLocation(`/sessions/${data.id}`);
      }
    });
  };

  if (isLoading) return <div className="p-8 text-center text-muted-foreground animate-pulse">Đang tải phiên...</div>;

  return (
    <div className="space-y-8 pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Phiên tư vấn</h1>
          <p className="text-muted-foreground">Trò chuyện với KENKAI để giải quyết các vấn đề chiến lược.</p>
        </div>
        
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground">
              <Plus className="w-4 h-4 mr-2" />
              Phiên mới
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border/50">
            <DialogHeader>
              <DialogTitle>Tạo phiên tư vấn mới</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Lĩnh vực tư vấn</Label>
                <Select value={newCategory} onValueChange={(v: any) => setNewCategory(v)}>
                  <SelectTrigger className="bg-secondary/50 border-border/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="personal">Cá nhân</SelectItem>
                    <SelectItem value="career">Sự nghiệp</SelectItem>
                    <SelectItem value="business">Kinh doanh</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Chủ đề thảo luận</Label>
                <Input 
                  placeholder="Vd: Chuẩn bị phỏng vấn, Định hướng 5 năm..." 
                  value={newTitle} 
                  onChange={e => setNewTitle(e.target.value)}
                  className="bg-secondary/50 border-border/50"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Hủy</Button>
              <Button 
                className="bg-primary text-primary-foreground" 
                onClick={handleCreate}
                disabled={!newTitle.trim() || createSession.isPending}
              >
                {createSession.isPending ? "Đang tạo..." : "Bắt đầu"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sessions?.map(session => (
          <Link key={session.id} href={`/sessions/${session.id}`}>
            <Card className="bg-card border-border/50 hover:border-primary/30 transition-colors cursor-pointer group h-full">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start mb-2">
                  <Badge variant="outline" className="border-border/50 bg-secondary/50 text-xs capitalize">
                    {session.category}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{new Date(session.createdAt).toLocaleDateString()}</span>
                </div>
                <CardTitle className="text-lg group-hover:text-primary transition-colors">{session.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground line-clamp-2">
                  {session.lastMessage ? `"...${session.lastMessage}"` : "Chưa có tin nhắn nào. Bắt đầu ngay."}
                </div>
                <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground">
                  <MessageSquare className="w-3 h-3" />
                  <span>{session.messageCount} tin nhắn</span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
        {(!sessions || sessions.length === 0) && (
          <div className="col-span-full text-center py-16 text-muted-foreground border border-dashed border-border/50 rounded-2xl bg-secondary/20">
            Chưa có phiên tư vấn nào. Tạo phiên mới để bắt đầu trò chuyện.
          </div>
        )}
      </div>
    </div>
  );
}
