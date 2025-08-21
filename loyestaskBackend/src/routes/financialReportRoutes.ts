import { Router } from "express";
import { FinancialService } from "../services/FinancialService";
import { authenticate } from "../middleware/auth";
import { isAdmin } from "../middleware/role";
import type { Request, Response } from "express";

const router = Router();

router.use(authenticate);

// Dashboard financiero
router.get("/dashboard", async (req: Request, res: Response) => {
  try {
    const dashboard = await FinancialService.getFinancialDashboard();
    res.json(dashboard);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener dashboard financiero" });
  }
});

// Flujo de caja
router.get("/cash-flow", async (req: Request, res: Response) => {
  try {
    const { months = "12" } = req.query;
    const cashFlow = await FinancialService.getCashFlow(parseInt(months as string));
    res.json(cashFlow);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener flujo de caja" });
  }
});

// Cuentas por cobrar
router.get("/accounts-receivable", async (req: Request, res: Response) => {
  try {
    const accountsReceivable = await FinancialService.getAccountsReceivable();
    res.json(accountsReceivable);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener cuentas por cobrar" });
  }
});

// Rentabilidad por cliente
router.get("/client-profitability", async (req: Request, res: Response) => {
  try {
    const profitability = await FinancialService.getClientProfitability();
    res.json(profitability);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener rentabilidad por cliente" });
  }
});

// Proyección de ingresos
router.get("/income-projection", async (req: Request, res: Response) => {
  try {
    const { months = "6" } = req.query;
    const projection = await FinancialService.getIncomeProjection(parseInt(months as string));
    res.json(projection);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener proyección de ingresos" });
  }
});

// Análisis de gastos
router.get("/expense-analysis", async (req: Request, res: Response) => {
  try {
    const analysis = await FinancialService.getExpenseAnalysis();
    res.json(analysis);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener análisis de gastos" });
  }
});

export default router;
