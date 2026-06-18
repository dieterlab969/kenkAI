import { Router } from "express";
import { db, reportsTable, actionPlansTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  ListReportsResponse,
  GetReportParams,
  GenerateReportBody,
} from "@workspace/api-zod";

const router = Router();

function formatReport(r: typeof reportsTable.$inferSelect) {
  let keyInsights: string[] = [];
  try {
    keyInsights = r.keyInsights ? JSON.parse(r.keyInsights) : [];
  } catch {
    keyInsights = [];
  }
  return {
    id: r.id,
    type: r.type,
    title: r.title,
    summary: r.summary,
    content: r.content ?? null,
    keyInsights,
    status: r.status,
    assessmentId: r.assessmentId ?? null,
    sessionId: r.sessionId ?? null,
    createdAt: r.createdAt.toISOString(),
  };
}

const REPORT_TEMPLATES: Record<string, { summary: string; keyInsights: string[]; content: string }> = {
  personality: {
    summary: "Phân tích tính cách toàn diện dựa trên các đánh giá tâm lý và hành vi của bạn.",
    keyInsights: [
      "Bạn có xu hướng tư duy phân tích và hướng đến kết quả cụ thể",
      "Điểm mạnh nổi bật: khả năng giải quyết vấn đề và tư duy chiến lược",
      "Cơ hội phát triển: tăng cường kỹ năng giao tiếp cảm xúc",
      "Phong cách lãnh đạo: dẫn dắt bằng tầm nhìn và dữ liệu",
    ],
    content: "Báo cáo tính cách của bạn cho thấy một hồ sơ độc đáo với nhiều điểm mạnh đáng chú ý...",
  },
  career_roadmap: {
    summary: "Lộ trình nghề nghiệp 3 năm được cá nhân hóa dựa trên kỹ năng, mục tiêu và xu hướng thị trường.",
    keyInsights: [
      "Kỹ năng cốt lõi cần phát triển trong 6 tháng tới",
      "3 cơ hội nghề nghiệp phù hợp nhất với profile của bạn",
      "Khoảng cách kỹ năng cần lấp đầy để đạt mục tiêu",
      "Mạng lưới chuyên nghiệp cần xây dựng",
    ],
    content: "Dựa trên đánh giá toàn diện về năng lực và định hướng nghề nghiệp của bạn...",
  },
  business_health: {
    summary: "Đánh giá sức khỏe toàn diện của doanh nghiệp theo 6 trụ cột: chiến lược, tài chính, vận hành, nhân sự, marketing và công nghệ.",
    keyInsights: [
      "Điểm mạnh cạnh tranh: sản phẩm/dịch vụ độc đáo",
      "Rủi ro cần quản lý: phụ thuộc vào một kênh khách hàng",
      "Cơ hội tăng trưởng: mở rộng sang phân khúc thị trường mới",
      "Ưu tiên ngay: tối ưu hóa quy trình vận hành",
    ],
    content: "Phân tích sức khỏe doanh nghiệp của bạn cho thấy nền tảng vững chắc với một số lĩnh vực cần cải thiện...",
  },
  action_plan: {
    summary: "Kế hoạch hành động 90 ngày chi tiết với các bước cụ thể để đạt được mục tiêu đã xác định.",
    keyInsights: [
      "30 ngày đầu: Xây dựng nền tảng và thói quen cốt lõi",
      "30 ngày tiếp: Thực thi và đo lường kết quả",
      "30 ngày cuối: Tối ưu hóa và mở rộng",
      "Chỉ số theo dõi tiến độ hàng tuần",
    ],
    content: "Kế hoạch hành động này được thiết kế dựa trên nguyên tắc thực thi từng bước, đo lường liên tục...",
  },
  strategic_recommendations: {
    summary: "Các khuyến nghị chiến lược được cá nhân hóa dựa trên phân tích sâu về tình huống và mục tiêu của bạn.",
    keyInsights: [
      "Ưu tiên chiến lược số 1: Tập trung vào thế mạnh cốt lõi",
      "Chiến lược tăng trưởng: Phát triển theo chiều sâu trước chiều rộng",
      "Quản lý rủi ro: Đa dạng hóa nguồn lực",
      "Chỉ số thành công: KPIs cụ thể cho từng mục tiêu",
    ],
    content: "Dựa trên phân tích toàn diện, đây là các khuyến nghị chiến lược ưu tiên cao nhất cho bạn...",
  },
  life_plan: {
    summary: "Kế hoạch cuộc sống tổng thể cân bằng giữa sự nghiệp, gia đình, sức khỏe và phát triển cá nhân.",
    keyInsights: [
      "Tầm nhìn 5 năm rõ ràng theo 4 lĩnh vực cuộc sống",
      "Hệ thống giá trị cá nhân làm la bàn ra quyết định",
      "Thói quen hàng ngày hỗ trợ mục tiêu dài hạn",
      "Chiến lược cân bằng công việc và cuộc sống",
    ],
    content: "Kế hoạch cuộc sống của bạn được xây dựng trên nền tảng giá trị cốt lõi và tầm nhìn dài hạn...",
  },
  leadership: {
    summary: "Đánh giá năng lực lãnh đạo toàn diện với các khuyến nghị phát triển cụ thể.",
    keyInsights: [
      "Phong cách lãnh đạo nổi trội: Dẫn dắt bằng tầm nhìn",
      "Năng lực cần phát triển: Quản lý xung đột và xây dựng đội nhóm",
      "Điểm mù lãnh đạo cần nhận thức",
      "Lộ trình phát triển lãnh đạo 12 tháng",
    ],
    content: "Đánh giá lãnh đạo của bạn cho thấy nhiều phẩm chất lãnh đạo mạnh mẽ...",
  },
  customer_persona: {
    summary: "Hồ sơ chân dung khách hàng chi tiết giúp tối ưu hóa sản phẩm, marketing và trải nghiệm khách hàng.",
    keyInsights: [
      "3 phân khúc khách hàng mục tiêu ưu tiên",
      "Pain points cốt lõi và động lực mua hàng",
      "Kênh tiếp cận hiệu quả nhất cho từng nhóm",
      "Thông điệp marketing phù hợp với từng persona",
    ],
    content: "Phân tích chân dung khách hàng của bạn cho thấy 3 nhóm khách hàng chính với nhu cầu và hành vi khác nhau...",
  },
};

router.get("/reports", async (req, res) => {
  const rows = await db.select().from(reportsTable).orderBy(reportsTable.createdAt);
  ListReportsResponse.parse(rows.map(formatReport));
  res.json(rows.map(formatReport));
});

router.get("/reports/:id", async (req, res) => {
  const { id } = GetReportParams.parse({ id: Number(req.params.id) });
  const [row] = await db.select().from(reportsTable).where(eq(reportsTable.id, id));
  if (!row) return res.status(404).json({ error: "Report not found" });
  res.json(formatReport(row));
});

router.post("/reports/generate", async (req, res) => {
  const body = GenerateReportBody.parse(req.body);
  const template = REPORT_TEMPLATES[body.type] ?? REPORT_TEMPLATES.strategic_recommendations;

  const [row] = await db
    .insert(reportsTable)
    .values({
      type: body.type,
      title: body.title,
      summary: template.summary,
      content: template.content,
      keyInsights: JSON.stringify(template.keyInsights),
      status: "ready",
      assessmentId: body.assessmentId ?? null,
      sessionId: body.sessionId ?? null,
    })
    .returning();

  res.status(201).json(formatReport(row));
});

export default router;
