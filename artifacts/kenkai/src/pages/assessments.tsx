import { useListAssessments, useCreateAssessment, getListAssessmentsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useLocation } from "wouter";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Activity, Compass, Zap, Plus, ArrowRight } from "lucide-react";

const TYPE_ICONS = {
  personal: Activity,
  career: Compass,
  business: Zap
};

const TYPE_COLORS = {
  personal: "text-primary bg-primary/10",
  career: "text-blue-500 bg-blue-500/10",
  business: "text-violet-500 bg-violet-500/10"
};

const STATUS_LABELS = {
  not_started: "Chưa bắt đầu",
  in_progress: "Đang thực hiện",
  completed: "Hoàn thành"
};

export default function Assessments() {
  const { data: assessments, isLoading } = useListAssessments();
  const createAssessment = useCreateAssessment();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  
  const [open, setOpen] = useState(false);
  const [newType, setNewType] = useState<"personal" | "career" | "business">("personal");
  const [newTitle, setNewTitle] = useState("");

  const handleCreate = () => {
    createAssessment.mutate({
      data: { type: newType, title: newTitle, description: "Bản đánh giá chi tiết." }
    }, {
      onSuccess: (data) => {
        setOpen(false);
        queryClient.invalidateQueries({ queryKey: getListAssessmentsQueryKey() });
        setLocation(`/assessments/${data.id}`);
      }
    });
  };

  if (isLoading) return <div className="p-8 text-center text-muted-foreground animate-pulse">Đang tải đánh giá...</div>;

  return (
    <div className="space-y-8 pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Đánh giá chiến lược</h1>
          <p className="text-muted-foreground">Xác định vị trí hiện tại của bạn để xây dựng chiến lược phù hợp.</p>
        </div>
        
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground">
              <Plus className="w-4 h-4 mr-2" />
              Tạo đánh giá mới
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border/50">
            <DialogHeader>
              <DialogTitle>Tạo đánh giá mới</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Lĩnh vực</Label>
                <Select value={newType} onValueChange={(v: any) => setNewType(v)}>
                  <SelectTrigger className="bg-secondary/50 border-border/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="personal">Phát triển cá nhân</SelectItem>
                    <SelectItem value="career">Sự nghiệp</SelectItem>
                    <SelectItem value="business">Kinh doanh & Khởi nghiệp</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tên đánh giá</Label>
                <Input 
                  placeholder="Vd: Đánh giá Kỹ năng Lãnh đạo Q3..." 
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
                disabled={!newTitle.trim() || createAssessment.isPending}
              >
                {createAssessment.isPending ? "Đang tạo..." : "Bắt đầu"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {assessments?.map(assessment => {
          const Icon = TYPE_ICONS[assessment.type];
          return (
            <Card key={assessment.id} className="bg-card border-border/50 flex flex-col hover:border-primary/30 transition-colors">
              <CardHeader>
                <div className="flex justify-between items-start mb-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${TYPE_COLORS[assessment.type]}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <Badge variant="outline" className="border-border/50 bg-secondary/50 text-xs font-normal">
                    {STATUS_LABELS[assessment.status]}
                  </Badge>
                </div>
                <CardTitle className="text-xl line-clamp-1">{assessment.title}</CardTitle>
                <CardDescription className="line-clamp-2 mt-2 h-10">
                  {assessment.description || "Không có mô tả."}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="space-y-2 mt-4">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Tiến độ</span>
                    <span>{assessment.progress || 0}%</span>
                  </div>
                  <Progress value={assessment.progress || 0} className="h-1.5" />
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                <Link href={`/assessments/${assessment.id}`} className="w-full">
                  <Button variant="secondary" className="w-full justify-between bg-secondary/50 hover:bg-secondary border border-transparent hover:border-border/50 transition-all">
                    {assessment.status === 'completed' ? 'Xem kết quả' : 'Tiếp tục'}
                    <ArrowRight className="w-4 h-4 ml-2 opacity-50" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          );
        })}
        {(!assessments || assessments.length === 0) && (
          <div className="col-span-full text-center py-16 text-muted-foreground border border-dashed border-border/50 rounded-2xl bg-secondary/20">
            Chưa có đánh giá nào. Bắt đầu bằng cách tạo một đánh giá mới.
          </div>
        )}
      </div>
    </div>
  );
}
