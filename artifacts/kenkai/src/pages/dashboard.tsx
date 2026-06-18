import { useGetDashboardOverview, useGetRecentActivity, useListActionPlans } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Activity, BookOpen, MessageSquare, Target, Flame, BrainCircuit, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const { data: overview, isLoading: loadingOverview } = useGetDashboardOverview();
  const { data: activity, isLoading: loadingActivity } = useGetRecentActivity();
  const { data: actionPlans, isLoading: loadingPlans } = useListActionPlans();

  if (loadingOverview || loadingActivity || loadingPlans) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-card rounded w-48 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-card rounded-xl border border-border/50" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 bg-card rounded-xl border border-border/50" />
          <div className="h-96 bg-card rounded-xl border border-border/50" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Tổng quan</h1>
        <p className="text-muted-foreground">Theo dõi hành trình phát triển và chiến lược của bạn.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Điểm rõ ràng</CardTitle>
            <BrainCircuit className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground mb-2">{overview?.clarityScore ?? 0}</div>
            <Progress value={overview?.clarityScore ?? 0} className="h-1.5" />
          </CardContent>
        </Card>
        
        <Card className="bg-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Chuỗi hoạt động</CardTitle>
            <Flame className="w-4 h-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{overview?.currentStreak ?? 0} ngày</div>
          </CardContent>
        </Card>
        
        <Card className="bg-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Đánh giá hoàn thành</CardTitle>
            <BookOpen className="w-4 h-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{overview?.completedAssessments ?? 0}/{overview?.totalAssessments ?? 0}</div>
          </CardContent>
        </Card>
        
        <Card className="bg-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Phiên đang mở</CardTitle>
            <MessageSquare className="w-4 h-4 text-violet-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{overview?.activeSessions ?? 0}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-card border-border/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Kế hoạch hành động</CardTitle>
                <CardDescription>Các bước chiến lược hiện tại của bạn</CardDescription>
              </div>
              <Link href="/reports">
                <Button variant="ghost" size="sm" className="text-primary">
                  Xem tất cả
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-4">
              {actionPlans?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Chưa có kế hoạch hành động nào. Hãy hoàn thành đánh giá để tạo kế hoạch.
                </div>
              ) : (
                actionPlans?.map(plan => (
                  <div key={plan.id} className="p-4 rounded-lg bg-secondary/50 border border-border/50 flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-foreground">{plan.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">Thời hạn: {plan.timeframe}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="text-sm font-medium">{plan.completedTasks}/{plan.tasks} bước</span>
                        <Progress value={(plan.completedTasks / plan.tasks) * 100} className="w-24 h-1.5 mt-1" />
                      </div>
                      <Link href={`/reports/${plan.reportId}`}>
                        <Button size="icon" variant="ghost">
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="bg-card border-border/50 h-full">
            <CardHeader>
              <CardTitle>Hoạt động gần đây</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {activity?.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Chưa có hoạt động nào.
                  </div>
                ) : (
                  activity?.map((item, i) => (
                    <div key={item.id} className="relative pl-6 pb-6 last:pb-0">
                      {i !== activity.length - 1 && (
                        <div className="absolute left-[11px] top-6 bottom-0 w-px bg-border/50" />
                      )}
                      <div className="absolute left-0 top-1.5 w-[22px] h-[22px] rounded-full bg-secondary border-2 border-background flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm text-foreground">{item.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                        <span className="text-[10px] text-muted-foreground/70 mt-1 block">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
