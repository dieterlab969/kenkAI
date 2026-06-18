import { useListReports, useGenerateReport, getListReportsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useLocation } from "wouter";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { FileText, Plus, Download, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const TYPE_LABELS = {
  personality: "Báo cáo Tính cách",
  leadership: "Kỹ năng Lãnh đạo",
  business_health: "Sức khỏe Doanh nghiệp",
  customer_persona: "Chân dung Khách hàng",
  strategic_recommendations: "Đề xuất Chiến lược",
  life_plan: "Kế hoạch Cuộc đời",
  career_roadmap: "Lộ trình Sự nghiệp",
  action_plan: "Kế hoạch Hành động"
};

export default function Reports() {
  const { data: reports, isLoading } = useListReports();
  const generateReport = useGenerateReport();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  
  const [open, setOpen] = useState(false);
  const [newType, setNewType] = useState<keyof typeof TYPE_LABELS>("career_roadmap");
  const [newTitle, setNewTitle] = useState("");

  const handleGenerate = () => {
    generateReport.mutate({
      data: { type: newType, title: newTitle }
    }, {
      onSuccess: (data) => {
        setOpen(false);
        queryClient.invalidateQueries({ queryKey: getListReportsQueryKey() });
        setLocation(`/reports/${data.id}`);
      }
    });
  };

  if (isLoading) return <div className="p-8 text-center text-muted-foreground animate-pulse">Đang tải báo cáo...</div>;

  return (
    <div className="space-y-8 pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Thư viện báo cáo</h1>
          <p className="text-muted-foreground">Các tài liệu chiến lược, kế hoạch và phân tích của bạn.</p>
        </div>
        
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground">
              <Plus className="w-4 h-4 mr-2" />
              Tạo báo cáo
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border/50">
            <DialogHeader>
              <DialogTitle>Tạo báo cáo mới</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Loại báo cáo</Label>
                <Select value={newType} onValueChange={(v: any) => setNewType(v)}>
                  <SelectTrigger className="bg-secondary/50 border-border/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TYPE_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tên báo cáo</Label>
                <Input 
                  placeholder="Vd: Lộ trình 2025..." 
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
                onClick={handleGenerate}
                disabled={!newTitle.trim() || generateReport.isPending}
              >
                {generateReport.isPending ? "Đang tạo..." : "Tạo báo cáo"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reports?.map(report => (
          <Card key={report.id} className="bg-card border-border/50 flex flex-col group">
            <CardHeader>
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 rounded-lg bg-secondary/50 flex items-center justify-center border border-border/50">
                  <FileText className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <Badge variant={report.status === 'ready' ? 'default' : 'secondary'} className="font-normal text-xs">
                  {report.status === 'ready' ? 'Hoàn thành' : 'Đang tạo...'}
                </Badge>
              </div>
              <CardTitle className="text-xl line-clamp-1">{report.title}</CardTitle>
              <CardDescription className="mt-2 text-primary/80">
                {TYPE_LABELS[report.type as keyof typeof TYPE_LABELS]}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <p className="text-sm text-muted-foreground line-clamp-3">
                {report.summary || "Báo cáo này chứa các đề xuất chiến lược dựa trên dữ liệu và phiên tư vấn của bạn."}
              </p>
            </CardContent>
            <CardFooter className="pt-4 border-t border-border/50 flex gap-2">
              <Link href={`/reports/${report.id}`} className="flex-1">
                <Button variant="secondary" className="w-full bg-secondary/50">
                  Xem chi tiết
                </Button>
              </Link>
            </CardFooter>
          </Card>
        ))}
        {(!reports || reports.length === 0) && (
          <div className="col-span-full text-center py-16 text-muted-foreground border border-dashed border-border/50 rounded-2xl bg-secondary/20">
            Chưa có báo cáo nào. Bắt đầu bằng cách hoàn thành đánh giá và phiên tư vấn.
          </div>
        )}
      </div>
    </div>
  );
}
