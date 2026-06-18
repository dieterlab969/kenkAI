import { useGetReport, getGetReportQueryKey } from "@workspace/api-client-react";
import { useParams, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, FileText, CheckCircle2, ChevronRight } from "lucide-react";

export default function ReportDetail() {
  const { id } = useParams();
  const reportId = parseInt(id || "0", 10);
  
  const { data: report, isLoading } = useGetReport(reportId, { 
    query: { enabled: !!reportId, queryKey: getGetReportQueryKey(reportId) } 
  });

  if (isLoading || !report) return <div className="p-8 text-center text-muted-foreground animate-pulse">Đang tải báo cáo...</div>;

  return (
    <div className="space-y-8 pb-12 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/reports">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{report.title}</h1>
            <p className="text-muted-foreground text-sm">Tạo lúc: {new Date(report.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
        <Button variant="outline" className="border-border/50 bg-secondary/20">
          <Download className="w-4 h-4 mr-2" />
          Tải PDF
        </Button>
      </div>

      {report.status === 'generating' ? (
        <Card className="bg-card border-border/50 py-16 text-center">
          <div className="w-16 h-16 mx-auto border-4 border-primary border-t-transparent rounded-full animate-spin mb-6" />
          <h3 className="text-xl font-medium mb-2">KENKAI đang tổng hợp dữ liệu...</h3>
          <p className="text-muted-foreground max-w-sm mx-auto">
            Hệ thống đang phân tích các đánh giá và phiên tư vấn của bạn để xây dựng bản báo cáo này.
          </p>
        </Card>
      ) : (
        <>
          <Card className="bg-card border-primary/20 overflow-hidden relative">
            <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
            <CardHeader>
              <CardTitle className="text-xl text-primary">Tóm tắt Chiến lược</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground/90 leading-relaxed text-lg">
                {report.summary}
              </p>
            </CardContent>
          </Card>

          {report.keyInsights && report.keyInsights.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-primary" />
                Điểm cốt lõi
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {report.keyInsights.map((insight, i) => (
                  <div key={i} className="bg-secondary/30 border border-border/50 rounded-xl p-5 flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-primary text-xs font-bold">{i + 1}</span>
                    </div>
                    <p className="text-sm leading-relaxed">{insight}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {report.content && (
            <Card className="bg-card border-border/50">
              <CardHeader>
                <CardTitle>Chi tiết Báo cáo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-invert prose-blue max-w-none text-foreground/80 whitespace-pre-wrap">
                  {report.content}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
