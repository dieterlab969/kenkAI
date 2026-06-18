import { Router } from "express";
import { db, conversations, geminiMessages } from "@workspace/db";
import { eq, asc } from "drizzle-orm";
import { ai } from "@workspace/integrations-gemini-ai";

const router = Router();

const KENKAI_SYSTEM_PROMPT = `Bạn là KENKAI — một đối tác tư duy chiến lược AI cao cấp. Bạn không chỉ trả lời câu hỏi mà còn hướng dẫn người dùng qua các cuộc hội thoại có cấu trúc để:

1. Đánh giá tình huống hiện tại của họ một cách toàn diện
2. Làm rõ mục tiêu và giá trị cốt lõi
3. Xác định điểm mù, thách thức và cơ hội
4. Xây dựng chiến lược và kế hoạch hành động cụ thể

Phong cách: Chu đáo. Phân tích. Chiến lược. Hướng đến con người. Hành động quyết đoán.

Quy tắc:
- Luôn trả lời bằng tiếng Việt
- Đặt câu hỏi chiến lược để hiểu sâu hơn thay vì chỉ đưa ra câu trả lời chung chung
- Sử dụng framework tư duy: First Principles, Second-order thinking, Inversion
- Khi phù hợp, đưa ra các khuôn khổ (frameworks) và công cụ phân tích cụ thể
- Luôn hướng người dùng đến hành động cụ thể có thể thực hiện ngay
- Không sử dụng emoji
- Viết súc tích, rõ ràng, có cấu trúc — dùng đầu dòng hoặc danh sách khi cần thiết`;

function formatConv(c: typeof conversations.$inferSelect) {
  return {
    id: c.id,
    title: c.title,
    createdAt: c.createdAt.toISOString(),
  };
}

function formatMsg(m: typeof geminiMessages.$inferSelect) {
  return {
    id: m.id,
    conversationId: m.conversationId,
    role: m.role,
    content: m.content,
    createdAt: m.createdAt.toISOString(),
  };
}

// List conversations
router.get("/gemini/conversations", async (req, res) => {
  const rows = await db.select().from(conversations).orderBy(conversations.createdAt);
  res.json(rows.map(formatConv));
});

// Create conversation
router.post("/gemini/conversations", async (req, res) => {
  const title = typeof req.body.title === "string" && req.body.title.trim() ? req.body.title.trim() : "Cuộc hội thoại mới";
  const [row] = await db.insert(conversations).values({ title }).returning();
  res.status(201).json(formatConv(row));
});

// Get conversation with messages
router.get("/gemini/conversations/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const [conv] = await db.select().from(conversations).where(eq(conversations.id, id));
  if (!conv) return res.status(404).json({ error: "Không tìm thấy cuộc hội thoại" });

  const msgs = await db
    .select()
    .from(geminiMessages)
    .where(eq(geminiMessages.conversationId, id))
    .orderBy(asc(geminiMessages.createdAt));

  res.json({ ...formatConv(conv), messages: msgs.map(formatMsg) });
});

// Delete conversation
router.delete("/gemini/conversations/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const [conv] = await db.select().from(conversations).where(eq(conversations.id, id));
  if (!conv) return res.status(404).json({ error: "Không tìm thấy cuộc hội thoại" });
  await db.delete(conversations).where(eq(conversations.id, id));
  res.status(204).end();
});

// List messages
router.get("/gemini/conversations/:id/messages", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const msgs = await db
    .select()
    .from(geminiMessages)
    .where(eq(geminiMessages.conversationId, id))
    .orderBy(asc(geminiMessages.createdAt));
  res.json(msgs.map(formatMsg));
});

// Send message — SSE streaming
router.post("/gemini/conversations/:id/messages", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const content = typeof req.body.content === "string" ? req.body.content.trim() : "";
  if (!content) return res.status(400).json({ error: "Nội dung tin nhắn không được để trống" });

  const [conv] = await db.select().from(conversations).where(eq(conversations.id, id));
  if (!conv) return res.status(404).json({ error: "Không tìm thấy cuộc hội thoại" });

  // Save user message
  await db.insert(geminiMessages).values({
    conversationId: id,
    role: "user",
    content,
  });

  // Load full history
  const history = await db
    .select()
    .from(geminiMessages)
    .where(eq(geminiMessages.conversationId, id))
    .orderBy(asc(geminiMessages.createdAt));

  // Set SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  let fullResponse = "";

  try {
    const stream = await ai.models.generateContentStream({
      model: "gemini-3-flash-preview",
      contents: history.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      })),
      config: {
        maxOutputTokens: 8192,
        systemInstruction: KENKAI_SYSTEM_PROMPT,
      },
    });

    for await (const chunk of stream) {
      const text = chunk.text;
      if (text) {
        fullResponse += text;
        res.write(`data: ${JSON.stringify({ content: text })}\n\n`);
      }
    }

    // Save assistant message to DB
    await db.insert(geminiMessages).values({
      conversationId: id,
      role: "assistant",
      content: fullResponse,
    });

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Lỗi không xác định";
    res.write(`data: ${JSON.stringify({ error: errorMsg })}\n\n`);
  }

  res.end();
});

export default router;
