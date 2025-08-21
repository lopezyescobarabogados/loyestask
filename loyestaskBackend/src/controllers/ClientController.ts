import type { Request, Response } from "express";
import Client from "../models/Client";
import { body, validationResult } from "express-validator";

export class ClientController {
  
  // Obtener todos los clientes
  static getClients = async (req: Request, res: Response) => {
    try {
      const { status, type, search, page = 1, limit = 10 } = req.query;
      
      let filter: any = { createdBy: req.user!.id };
      
      if (status) {
        filter.status = status;
      }
      
      if (type) {
        filter.type = type;
      }
      
      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { taxId: { $regex: search, $options: 'i' } }
        ];
      }

      const pageNumber = parseInt(page as string, 10);
      const limitNumber = parseInt(limit as string, 10);
      const skip = (pageNumber - 1) * limitNumber;

      const [clients, total] = await Promise.all([
        Client.find(filter)
          .populate('createdBy', 'name email')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limitNumber),
        Client.countDocuments(filter)
      ]);

      const totalPages = Math.ceil(total / limitNumber);
      
      res.json({
        clients,
        totalPages,
        currentPage: pageNumber,
        total
      });
    } catch (error) {
      console.error('Error obteniendo clientes:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  };

  // Obtener un cliente por ID
  static getClientById = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      const client = await Client.findOne({
        _id: id,
        createdBy: req.user!.id
      }).populate('createdBy', 'name email');
      
      if (!client) {
        return res.status(404).json({ error: 'Cliente no encontrado' });
      }
      
      res.json(client);
    } catch (error) {
      console.error('Error obteniendo cliente:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  };

  // Crear nuevo cliente
  static createClient = async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0].msg });
      }

      const {
        name,
        type,
        email,
        phone,
        address,
        taxId,
        contactPerson,
        notes,
        creditLimit,
        paymentTerms
      } = req.body;

      // Verificar si ya existe un cliente con el mismo email o taxId
      if (email) {
        const existingClientByEmail = await Client.findOne({
          email,
          createdBy: req.user!.id
        });
        if (existingClientByEmail) {
          return res.status(400).json({ error: 'Ya existe un cliente con ese email' });
        }
      }

      if (taxId) {
        const existingClientByTaxId = await Client.findOne({
          taxId,
          createdBy: req.user!.id
        });
        if (existingClientByTaxId) {
          return res.status(400).json({ error: 'Ya existe un cliente con ese documento fiscal' });
        }
      }

      const client = new Client({
        name,
        type,
        email,
        phone,
        address,
        taxId,
        contactPerson,
        notes,
        creditLimit: creditLimit || 0,
        paymentTerms: paymentTerms || 30,
        createdBy: req.user!.id
      });

      await client.save();
      await client.populate('createdBy', 'name email');

      res.status(201).json(client);
    } catch (error) {
      console.error('Error creando cliente:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  };

  // Actualizar cliente
  static updateClient = async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0].msg });
      }

      const { id } = req.params;
      const {
        name,
        type,
        status,
        email,
        phone,
        address,
        taxId,
        contactPerson,
        notes,
        creditLimit,
        paymentTerms
      } = req.body;

      const client = await Client.findOne({
        _id: id,
        createdBy: req.user!.id
      });

      if (!client) {
        return res.status(404).json({ error: 'Cliente no encontrado' });
      }

      // Verificar duplicados solo si se cambia el email o taxId
      if (email && email !== client.email) {
        const existingClientByEmail = await Client.findOne({
          email,
          createdBy: req.user!.id,
          _id: { $ne: id }
        });
        if (existingClientByEmail) {
          return res.status(400).json({ error: 'Ya existe un cliente con ese email' });
        }
      }

      if (taxId && taxId !== client.taxId) {
        const existingClientByTaxId = await Client.findOne({
          taxId,
          createdBy: req.user!.id,
          _id: { $ne: id }
        });
        if (existingClientByTaxId) {
          return res.status(400).json({ error: 'Ya existe un cliente con ese documento fiscal' });
        }
      }

      // Actualizar campos
      client.name = name || client.name;
      client.type = type || client.type;
      client.status = status || client.status;
      client.email = email || client.email;
      client.phone = phone || client.phone;
      client.address = address || client.address;
      client.taxId = taxId || client.taxId;
      client.contactPerson = contactPerson || client.contactPerson;
      client.notes = notes || client.notes;
      client.creditLimit = creditLimit !== undefined ? creditLimit : client.creditLimit;
      client.paymentTerms = paymentTerms || client.paymentTerms;

      await client.save();
      await client.populate('createdBy', 'name email');

      res.json(client);
    } catch (error) {
      console.error('Error actualizando cliente:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  };

  // Eliminar cliente
  static deleteClient = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const client = await Client.findOne({
        _id: id,
        createdBy: req.user!.id
      });

      if (!client) {
        return res.status(404).json({ error: 'Cliente no encontrado' });
      }

      // Verificar si el cliente tiene deudas pendientes
      const Debt = require('../models/Debt').default;
      const pendingDebts = await Debt.countDocuments({
        client: id,
        status: { $in: ['pending', 'partial', 'overdue'] }
      });

      if (pendingDebts > 0) {
        return res.status(400).json({ 
          error: 'No se puede eliminar el cliente porque tiene deudas pendientes' 
        });
      }

      await client.deleteOne();

      res.json({ message: 'Cliente eliminado correctamente' });
    } catch (error) {
      console.error('Error eliminando cliente:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  };

  // Obtener resumen del cliente (deudas, pagos, etc.)
  static getClientSummary = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const client = await Client.findOne({
        _id: id,
        createdBy: req.user!.id
      });

      if (!client) {
        return res.status(404).json({ error: 'Cliente no encontrado' });
      }

      // Obtener deudas del cliente
      const Debt = require('../models/Debt').default;
      const DebtPayment = require('../models/DebtPayment').default;

      const debts = await Debt.find({ 
        client: id,
        createdBy: req.user!.id 
      }).sort({ createdAt: -1 });

      const payments = await DebtPayment.find({
        client: id,
        createdBy: req.user!.id
      }).populate('debt', 'debtNumber description')
        .sort({ createdAt: -1 })
        .limit(10);

      const summary = {
        client,
        debts: {
          total: debts.length,
          pending: debts.filter(d => d.status === 'pending').length,
          partial: debts.filter(d => d.status === 'partial').length,
          overdue: debts.filter(d => d.status === 'overdue').length,
          paid: debts.filter(d => d.status === 'paid').length,
          totalAmount: debts.reduce((sum, d) => sum + (d.totalAmount as number), 0),
          paidAmount: debts.reduce((sum, d) => sum + (d.paidAmount as number), 0),
          remainingAmount: debts.reduce((sum, d) => sum + (d.remainingAmount as number), 0),
        },
        recentPayments: payments,
        creditUtilization: client.creditLimit && client.creditLimit > 0 
          ? (client.totalDebt / client.creditLimit) * 100 
          : 0
      };

      res.json(summary);
    } catch (error) {
      console.error('Error obteniendo resumen del cliente:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  };

  // Obtener estadísticas generales de clientes
  static getClientsStats = async (req: Request, res: Response) => {
    try {
      const totalClients = await Client.countDocuments({ createdBy: req.user!.id });
      const activeClients = await Client.countDocuments({ 
        createdBy: req.user!.id, 
        status: 'active' 
      });
      const inactiveClients = await Client.countDocuments({ 
        createdBy: req.user!.id, 
        status: 'inactive' 
      });

      const totalDebtAmount = await Client.aggregate([
        { $match: { createdBy: req.user!.id } },
        { $group: { _id: null, total: { $sum: '$totalDebt' } } }
      ]);

      const totalPaidAmount = await Client.aggregate([
        { $match: { createdBy: req.user!.id } },
        { $group: { _id: null, total: { $sum: '$totalPaid' } } }
      ]);

      const stats = {
        totalClients,
        activeClients,
        inactiveClients,
        clientsByType: await Client.aggregate([
          { $match: { createdBy: req.user!.id } },
          { $group: { _id: '$type', count: { $sum: 1 } } }
        ]),
        totalDebt: totalDebtAmount[0]?.total || 0,
        totalPaid: totalPaidAmount[0]?.total || 0,
        averagePaymentTerms: await Client.aggregate([
          { $match: { createdBy: req.user!.id } },
          { $group: { _id: null, avg: { $avg: '$paymentTerms' } } }
        ]).then(result => Math.round(result[0]?.avg || 30))
      };

      res.json(stats);
    } catch (error) {
      console.error('Error obteniendo estadísticas de clientes:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  };

  // Buscar clientes
  static searchClients = async (req: Request, res: Response) => {
    try {
      const { q } = req.query;
      
      if (!q || typeof q !== 'string') {
        return res.json([]);
      }

      const clients = await Client.find({
        createdBy: req.user!.id,
        $or: [
          { name: { $regex: q, $options: 'i' } },
          { email: { $regex: q, $options: 'i' } },
          { taxId: { $regex: q, $options: 'i' } }
        ]
      })
      .select('_id name email type')
      .limit(10)
      .sort({ name: 1 });

      res.json(clients);
    } catch (error) {
      console.error('Error buscando clientes:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  };
}
