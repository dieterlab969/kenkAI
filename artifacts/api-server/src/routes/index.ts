import { Router, type IRouter } from "express";
import healthRouter from "./health";
import assessmentsRouter from "./assessments";
import sessionsRouter from "./sessions";
import reportsRouter from "./reports";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(assessmentsRouter);
router.use(sessionsRouter);
router.use(reportsRouter);
router.use(dashboardRouter);

export default router;
