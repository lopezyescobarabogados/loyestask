import type { Request, Response } from "express";
import Invoice from "../models/Invoice";
import Account from "../models/Account";
import FinancialPeriod from "../models/FinancialPeriod";

export class InvoiceController {
  // Crear nueva factura
  static createInvoice = async (req: Request, res: Response) => {
    try {
      const invoice = new Invoice({
        ...req.body,
        createdBy: req.user.id,
      });

      await invoice.save();
      
      res.status(201).json({
        msg: "Factura creada correctamente",
        invoice
      });
    } catch (error) {
      res.status(500).json({ error: "Error al crear la factura" });
    }
  };

  // Obtener todas las facturas
  static getInvoices = async (req: Request, res: Response) => {
    try {
      const { page = 1, limit = 10, status, type, client, provider } = req.query;
      
      // Construir filtros
      const filter: any = {};
      if (status) filter.status = status;
      if (type) filter.type = type;
      if (client) filter.client = { $regex: client, $options: 'i' };
      if (provider) filter.provider = { $regex: provider, $options: 'i' };

      const invoices = await Invoice.find(filter)
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 })
        .limit(Number(limit) * 1)
        .skip((Number(page) - 1) * Number(limit));

      const total = await Invoice.countDocuments(filter);

      res.json({
        invoices,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error) {
      res.status(500).json({ error: "Error al obtener las facturas" });
    }
  };

  // Obtener factura por ID
  static getInvoiceById = async (req: Request, res: Response) => {
    try {
      const { invoiceId } = req.params;
      
      const invoice = await Invoice.findById(invoiceId)
        .populate('createdBy', 'name email');

      if (!invoice) {
        return res.status(404).json({ error: "Factura no encontrada" });
      }

      res.json(invoice);
    } catch (error) {
      res.status(500).json({ error: "Error al obtener la factura" });
    }
  };

  // Actualizar factura
  static updateInvoice = async (req: Request, res: Response) => {
    try {
      const { invoiceId } = req.params;
      
      const invoice = await Invoice.findById(invoiceId);
      
      if (!invoice) {
        return res.status(404).json({ error: "Factura no encontrada" });
      }

      // Verificar si el período está cerrado
      if (invoice.isLocked) {
        return res.status(403).json({ 
          error: "No se puede modificar una factura de un período cerrado" 
        });
      }

      // Actualizar factura
      Object.assign(invoice, req.body);
      await invoice.save();

      res.json({
        msg: "Factura actualizada correctamente",
        invoice
      });
    } catch (error) {
      res.status(500).json({ error: "Error al actualizar la factura" });
    }
  };

  // Cambiar estado de factura
  static updateInvoiceStatus = async (req: Request, res: Response) => {
    try {
      const { invoiceId } = req.params;
      const { status } = req.body;
      
      const invoice = await Invoice.findById(invoiceId);
      
      if (!invoice) {
        return res.status(404).json({ error: "Factura no encontrada" });
      }

      if (invoice.isLocked) {
        return res.status(403).json({ 
          error: "No se puede modificar el estado de una factura de un período cerrado" 
        });
      }

      invoice.status = status;
      await invoice.save();

      res.json({
        msg: "Estado de factura actualizado correctamente",
        invoice
      });
    } catch (error) {
      res.status(500).json({ error: "Error al actualizar el estado" });
    }
  };

  // Eliminar factura
  static deleteInvoice = async (req: Request, res: Response) => {
    try {
      const { invoiceId } = req.params;
      
      const invoice = await Invoice.findById(invoiceId);
      
      if (!invoice) {
        return res.status(404).json({ error: "Factura no encontrada" });
      }

      if (invoice.isLocked) {
        return res.status(403).json({ 
          error: "No se puede eliminar una factura de un período cerrado" 
        });
      }

      await Invoice.findByIdAndDelete(invoiceId);

      res.json({ msg: "Factura eliminada correctamente" });
    } catch (error) {
      res.status(500).json({ error: "Error al eliminar la factura" });
    }
  };

  // Obtener facturas vencidas
  static getOverdueInvoices = async (req: Request, res: Response) => {
    try {
      const overdueInvoices = await Invoice.find({
        status: { $in: ['sent', 'overdue'] }
      })
      .populate('createdBy', 'name email')
      .sort({ dueDate: 1 });

      // Filtrar solo las que están realmente vencidas
      const now = new Date();
      const filtered = overdueInvoices.filter(invoice => 
        invoice.dueDate && invoice.dueDate < now
      );

      res.json(filtered);
    } catch (error) {
      res.status(500).json({ error: "Error al obtener facturas vencidas" });
    }
  };

  // Obtener resumen de facturas
  static getInvoicesSummary = async (req: Request, res: Response) => {
    try {
      const summary = await Invoice.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            total: { $sum: '$total' }
          }
        }
      ]);

      const totalInvoices = await Invoice.countDocuments();
      const totalAmount = await Invoice.aggregate([
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]);

      res.json({
        summary,
        totalInvoices,
        totalAmount: totalAmount[0]?.total || 0
      });
    } catch (error) {
      res.status(500).json({ error: "Error al obtener resumen de facturas" });
    }
  };
}
