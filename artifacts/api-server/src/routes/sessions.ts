import { Router } from "express";
import { db, sessionsTable, messagesTable } from "@workspace/db";
import { eq, asc } from "drizzle-orm";
import {
  ListSessionsResponse,
  CreateSessionBody,
  GetSessionParams,
  SendMessageParams,
  SendMessageBody,
} from "@workspace/api-zod";

const router = Router();

function formatSession(r: typeof sessionsTable.$inferSelect) {
  return {
    id: r.id,
    title: r.title,
    category: r.category,
    status: r.status,
    messageCount: r.messageCount,
    lastMessage: r.lastMessage ?? null,
    assessmentId: r.assessmentId ?? null,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

function formatMessage(m: typeof messagesTable.$inferSelect) {
  return {
    id: m.id,
    sessionId: m.sessionId,
    role: m.role,
    content: m.content,
    createdAt: m.createdAt.toISOString(),
  };
}

const AI_RESPONSES: Record<string, string[]> = {
  personal: [
    "Câu hỏi rất sâu sắc. Để hiểu rõ hơn về giá trị cốt lõi của bạn, hãy cho tôi biết: điều gì khiến bạn cảm thấy có ý nghĩa nhất trong cuộc sống hiện tại?",
    "Dựa trên những gì bạn chia sẻ, tôi thấy một số điểm mạnh nổi bật. Bạn có muốn chúng ta khám phá sâu hơn về tiềm năng chưa được phát huy không?",
    "Đây là một nhận thức quan trọng. Nhiều người thành công đã bắt đầu từ chính điểm này. Hãy cùng xây dựng lộ trình phát triển cá nhân cho bạn.",
  ],
  career: [
    "Để đánh giá khoảng cách kỹ năng của bạn, tôi cần hiểu rõ hơn: bạn đang ở đâu trong sự nghiệp và muốn đến đâu trong 3-5 năm tới?",
    "Phân tích của tôi cho thấy bạn có nền tảng vững chắc trong lĩnh vực này. Hãy cùng xác định những kỹ năng cần phát triển để đạt được mục tiêu nghề nghiệp.",
    "Lộ trình nghề nghiệp của bạn cần được cá nhân hóa theo điểm mạnh và cơ hội thị trường. Tôi sẽ giúp bạn xây dựng kế hoạch học tập và phát triển cụ thể.",
  ],
  business: [
    "Để đánh giá tiềm năng kinh doanh, hãy mô tả cho tôi nghe về giải pháp của bạn và vấn đề cụ thể mà nó giải quyết cho khách hàng.",
    "Dựa trên thông tin bạn cung cấp, tôi thấy một số cơ hội thị trường thú vị. Hãy cùng phân tích đối tượng khách hàng mục tiêu và chiến lược định vị.",
    "Chiến lược tăng trưởng của bạn cần được xây dựng trên nền tảng hiểu biết sâu sắc về thị trường. Tôi sẽ giúp bạn phát triển kế hoạch kinh doanh toàn diện.",
  ],
};

router.get("/sessions", async (req, res) => {
  const rows = await db.select().from(sessionsTable).orderBy(sessionsTable.updatedAt);
  ListSessionsResponse.parse(rows.map(formatSession));
  res.json(rows.map(formatSession));
});

router.post("/sessions", async (req, res) => {
  const body = CreateSessionBody.parse(req.body);
  const [row] = await db
    .insert(sessionsTable)
    .values({
      title: body.title,
      category: body.category,
      assessmentId: body.assessmentId ?? null,
    })
    .returning();

  // Insert welcome message from assistant
  const welcomeMessages: Record<string, string> = {
    personal: `Xin chào! Tôi là KENKAI, đối tác tư duy chiến lược AI của bạn. Tôi sẽ đồng hành cùng bạn trong hành trình phát triển cá nhân — giúp bạn hiểu rõ bản thân, xác định mục tiêu và xây dựng kế hoạch hành động.\n\nHãy bắt đầu bằng cách chia sẻ: Điều gì đang thôi thúc bạn tìm kiếm sự thay đổi hoặc phát triển trong cuộc sống hiện tại?`,
    career: `Xin chào! Tôi là KENKAI, sẵn sàng hỗ trợ bạn phát triển sự nghiệp. Chúng ta sẽ cùng phân tích năng lực, xác định cơ hội và xây dựng lộ trình nghề nghiệp phù hợp với tiềm năng của bạn.\n\nĐể bắt đầu, hãy cho tôi biết: Bạn đang ở giai đoạn nào trong sự nghiệp và mục tiêu lớn nhất của bạn trong 3 năm tới là gì?`,
    business: `Xin chào! Tôi là KENKAI, đối tác chiến lược kinh doanh của bạn. Tôi sẽ giúp bạn đánh giá ý tưởng, khám phá thị trường và xây dựng chiến lược tăng trưởng hiệu quả.\n\nHãy bắt đầu: Mô tả ngắn gọn về doanh nghiệp hoặc ý tưởng khởi nghiệp của bạn và thách thức lớn nhất bạn đang đối mặt?`,
  };

  await db.insert(messagesTable).values({
    sessionId: row.id,
    role: "assistant",
    content: welcomeMessages[body.category] ?? welcomeMessages.personal,
  });

  await db
    .update(sessionsTable)
    .set({ messageCount: 1, updatedAt: new Date() })
    .where(eq(sessionsTable.id, row.id));

  const [updated] = await db.select().from(sessionsTable).where(eq(sessionsTable.id, row.id));
  res.status(201).json(formatSession(updated));
});

router.get("/sessions/:id", async (req, res) => {
  const { id } = GetSessionParams.parse({ id: Number(req.params.id) });
  const [session] = await db.select().from(sessionsTable).where(eq(sessionsTable.id, id));
  if (!session) return res.status(404).json({ error: "Session not found" });

  const messages = await db
    .select()
    .from(messagesTable)
    .where(eq(messagesTable.sessionId, id))
    .orderBy(asc(messagesTable.createdAt));

  res.json({
    ...formatSession(session),
    messages: messages.map(formatMessage),
  });
});

router.post("/sessions/:id/messages", async (req, res) => {
  const { id } = SendMessageParams.parse({ id: Number(req.params.id) });
  const body = SendMessageBody.parse(req.body);

  const [session] = await db.select().from(sessionsTable).where(eq(sessionsTable.id, id));
  if (!session) return res.status(404).json({ error: "Session not found" });

  // Save user message
  await db.insert(messagesTable).values({ sessionId: id, role: "user", content: body.content });

  // Generate AI response
  const responses = AI_RESPONSES[session.category] ?? AI_RESPONSES.personal;
  const aiContent = responses[Math.floor(Math.random() * responses.length)];

  const [aiMessage] = await db
    .insert(messagesTable)
    .values({ sessionId: id, role: "assistant", content: aiContent })
    .returning();

  // Update session
  await db
    .update(sessionsTable)
    .set({
      messageCount: session.messageCount + 2,
      lastMessage: aiContent.substring(0, 100),
      updatedAt: new Date(),
    })
    .where(eq(sessionsTable.id, id));

  res.status(201).json(formatMessage(aiMessage));
});

export default router;
