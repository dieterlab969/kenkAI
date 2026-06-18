import { useGetAssessment, useUpdateAssessment, getGetAssessmentQueryKey } from "@workspace/api-client-react";
import { useParams, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Save, CheckCircle2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function AssessmentDetail() {
  const { id } = useParams();
  const assessmentId = parseInt(id || "0", 10);
  
  const { data: assessment, isLoading } = useGetAssessment(assessmentId, { 
    query: { enabled: !!assessmentId, queryKey: getGetAssessmentQueryKey(assessmentId) } 
  });
  
  const updateAssessment = useUpdateAssessment();
  const queryClient = useQueryClient();
  
  const [notes, setNotes] = useState("");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (assessment) {
      setProgress(assessment.progress || 0);
    }
  }, [assessment]);

  const handleUpdate = () => {
    updateAssessment.mutate({
      id: assessmentId,
      data: {
        progress,
        status: progress === 100 ? "completed" : "in_progress"
      }
    }, {
      onSuccess: () => {
        toast.success("Đã cập nhật đánh giá");
        queryClient.invalidateQueries({ queryKey: getGetAssessmentQueryKey(assessmentId) });
      }
    });
  };

  if (isLoading || !assessment) return <div className="p-8 text-center text-muted-foreground animate-pulse">Đang tải chi tiết...</div>;

  return (
    <div className="space-y-8 pb-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/assessments">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{assessment.title}</h1>
          <p className="text-muted-foreground capitalize">Lĩnh vực: {assessment.type}</p>
        </div>
      </div>

      <Card className="bg-card border-border/50">
        <CardHeader>
          <CardTitle>Tiến độ thực hiện</CardTitle>
          <CardDescription>Cập nhật quá trình hoàn thành bảng đánh giá của bạn.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm font-medium">
              <span>{progress}% Hoàn thành</span>
              <span>{progress === 100 ? 'Đã xong' : 'Đang tiến hành'}</span>
            </div>
            <Progress value={progress} className="h-2" />
            
            <div className="flex gap-2 pt-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setProgress(Math.max(0, progress - 10))}
                className="border-border/50"
              >-10%</Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setProgress(Math.min(100, progress + 10))}
                className="border-border/50"
              >+10%</Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setProgress(100)}
                className="border-border/50 ml-auto"
              >Đánh dấu hoàn thành</Button>
            </div>
          </div>
          
          <div className="space-y-2 pt-4 border-t border-border/50">
            <Label>Ghi chú & Suy ngẫm</Label>
            <Textarea 
              className="min-h-[150px] bg-secondary/30 border-border/50 resize-none"
              placeholder="Ghi lại những suy nghĩ của bạn trong quá trình thực hiện..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          
          <div className="flex justify-end pt-4">
            <Button 
              className="bg-primary text-primary-foreground"
              onClick={handleUpdate}
              disabled={updateAssessment.isPending}
            >
              {updateAssessment.isPending ? "Đang lưu..." : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Lưu cập nhật
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {assessment.status === 'completed' && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="flex items-center justify-between py-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Đánh giá đã hoàn thành</h3>
                <p className="text-muted-foreground text-sm">KENKAI có thể phân tích dữ liệu này để đưa ra chiến lược.</p>
              </div>
            </div>
            <Link href="/reports">
              <Button className="bg-primary text-primary-foreground">Tạo báo cáo chiến lược</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
