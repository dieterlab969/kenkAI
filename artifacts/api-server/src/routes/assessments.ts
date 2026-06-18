import { Router } from "express";
import { db, assessmentsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  ListAssessmentsResponse,
  CreateAssessmentBody,
  GetAssessmentParams,
  UpdateAssessmentParams,
  UpdateAssessmentBody,
} from "@workspace/api-zod";

const router = Router();

router.get("/assessments", async (req, res) => {
  const rows = await db.select().from(assessmentsTable).orderBy(assessmentsTable.createdAt);
  const assessments = rows.map((r) => ({
    id: r.id,
    type: r.type,
    title: r.title,
    description: r.description ?? null,
    status: r.status,
    progress: r.progress,
    completedAt: r.completedAt ? r.completedAt.toISOString() : null,
    createdAt: r.createdAt.toISOString(),
  }));
  ListAssessmentsResponse.parse(assessments);
  res.json(assessments);
});

router.post("/assessments", async (req, res) => {
  const body = CreateAssessmentBody.parse(req.body);
  const [row] = await db
    .insert(assessmentsTable)
    .values({ type: body.type, title: body.title, description: body.description })
    .returning();
  res.status(201).json({
    id: row.id,
    type: row.type,
    title: row.title,
    description: row.description ?? null,
    status: row.status,
    progress: row.progress,
    completedAt: row.completedAt ? row.completedAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
  });
});

router.get("/assessments/:id", async (req, res) => {
  const { id } = GetAssessmentParams.parse({ id: Number(req.params.id) });
  const [row] = await db.select().from(assessmentsTable).where(eq(assessmentsTable.id, id));
  if (!row) return res.status(404).json({ error: "Assessment not found" });
  res.json({
    id: row.id,
    type: row.type,
    title: row.title,
    description: row.description ?? null,
    status: row.status,
    progress: row.progress,
    completedAt: row.completedAt ? row.completedAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
  });
});

router.patch("/assessments/:id", async (req, res) => {
  const { id } = UpdateAssessmentParams.parse({ id: Number(req.params.id) });
  const body = UpdateAssessmentBody.parse(req.body);
  const updates: Partial<typeof assessmentsTable.$inferInsert> = {};
  if (body.status !== undefined) updates.status = body.status;
  if (body.progress !== undefined) updates.progress = body.progress;
  if (body.status === "completed") updates.completedAt = new Date();

  const [row] = await db
    .update(assessmentsTable)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(assessmentsTable.id, id))
    .returning();
  if (!row) return res.status(404).json({ error: "Assessment not found" });
  res.json({
    id: row.id,
    type: row.type,
    title: row.title,
    description: row.description ?? null,
    status: row.status,
    progress: row.progress,
    completedAt: row.completedAt ? row.completedAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
  });
});

export default router;
