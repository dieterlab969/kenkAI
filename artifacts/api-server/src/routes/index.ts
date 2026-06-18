import { Router, type IRouter } from "express";
import healthRouter from "./health";
import assessmentsRouter from "./assessments";
import sessionsRouter from "./sessions";
import reportsRouter from "./reports";
import dashboardRouter from "./dashboard";
import geminiRouter from "./gemini";

const router: IRouter = Router();

router.use(healthRouter);
router.use(assessmentsRouter);
router.use(sessionsRouter);
router.use(reportsRouter);
router.use(dashboardRouter);
router.use(geminiRouter);

export default router;
