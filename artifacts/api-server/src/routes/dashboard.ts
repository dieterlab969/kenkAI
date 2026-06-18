import { Router } from "express";
import { db, assessmentsTable, sessionsTable, reportsTable, actionPlansTable } from "@workspace/db";
import { eq, count } from "drizzle-orm";

const router = Router();

router.get("/dashboard/overview", async (req, res) => {
  const assessments = await db.select().from(assessmentsTable);
  const sessions = await db.select().from(sessionsTable);
  const reports = await db.select().from(reportsTable);

  const totalAssessments = assessments.length;
  const completedAssessments = assessments.filter((a) => a.status === "completed").length;
  const activeSessions = sessions.filter((s) => s.status === "active").length;
  const totalReports = reports.length;

  const clarityScore = Math.min(
    100,
    Math.round(
      (completedAssessments * 25 + totalReports * 15 + activeSessions * 10) / Math.max(1, totalAssessments) * 2
    )
  );

  res.json({
    totalAssessments,
    completedAssessments,
    activeSessions,
    totalReports,
    currentStreak: 3,
    clarityScore: Math.min(100, clarityScore + 20),
  });
});

router.get("/dashboard/activity", async (req, res) => {
  const assessments = await db
    .select()
    .from(assessmentsTable)
    .where(eq(assessmentsTable.status, "completed"));

  const sessions = await db.select().from(sessionsTable);
  const reports = await db.select().from(reportsTable);

  const activities: Array<{
    id: number;
    type: string;
    title: string;
    description: string;
    createdAt: string;
  }> = [];

  let idCounter = 1;

  for (const a of assessments) {
    activities.push({
      id: idCounter++,
      type: "assessment_completed",
      title: `Hoàn thành đánh giá: ${a.title}`,
      description: `Bạn đã hoàn thành đánh giá ${a.type === "personal" ? "cá nhân" : a.type === "career" ? "nghề nghiệp" : "kinh doanh"}.`,
      createdAt: a.completedAt ? a.completedAt.toISOString() : a.createdAt.toISOString(),
    });
  }

  for (const s of sessions) {
    activities.push({
      id: idCounter++,
      type: "session_started",
      title: `Phiên hội thoại: ${s.title}`,
      description: `Đã có ${s.messageCount} tin nhắn trong phiên ${s.category === "personal" ? "phát triển cá nhân" : s.category === "career" ? "nghề nghiệp" : "kinh doanh"}.`,
      createdAt: s.createdAt.toISOString(),
    });
  }

  for (const r of reports) {
    activities.push({
      id: idCounter++,
      type: "report_generated",
      title: `Báo cáo mới: ${r.title}`,
      description: `Báo cáo ${r.type.replace(/_/g, " ")} đã sẵn sàng.`,
      createdAt: r.createdAt.toISOString(),
    });
  }

  activities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json(activities.slice(0, 20));
});

router.get("/dashboard/action-plans", async (req, res) => {
  const rows = await db.select().from(actionPlansTable).orderBy(actionPlansTable.createdAt);
  res.json(
    rows.map((r) => ({
      id: r.id,
      title: r.title,
      timeframe: r.timeframe,
      tasks: r.tasks,
      completedTasks: r.completedTasks,
      status: r.status,
      reportId: r.reportId ?? null,
    }))
  );
});

export default router;
