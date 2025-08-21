const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();

// Configuración CORS
app.use(cors({
  origin: ['http://localhost:5175', 'http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));

app.use(express.json());

// Mock user para desarrollo
const mockAdminUser = {
  _id: 'mock_admin_id',
  name: 'Administrador',
  email: 'admin@loyestask.com',
  role: 'admin',
  confirmed: true
};

// JWT Secret
const JWT_SECRET = 'e13e5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5a3b7';

// Middleware de autenticación mock
const mockAuth = (req, res, next) => {
  const bearer = req.headers.authorization;
  
  if (!bearer) {
    return res.status(401).json({ error: 'No Autorizado' });
  }

  const token = bearer.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No Autorizado' });
  }

  try {
    jwt.verify(token, JWT_SECRET);
    req.user = mockAdminUser;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token No Válido' });
  }
};

// Login endpoint
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  if (email === 'admin@loyestask.com' && password === 'admin123') {
    const token = jwt.sign(
      { id: mockAdminUser._id },
      JWT_SECRET,
      { expiresIn: '30d' }
    );
    
    res.json({
      msg: 'Login exitoso (modo desarrollo)',
      token,
      user: mockAdminUser
    });
  } else {
    res.status(401).json({ error: 'Credenciales inválidas' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', mode: 'development-mock' });
});

// Función para generar datos mock
const generateMockReports = (year) => {
  const reports = [];
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  
  const targetYear = year || currentYear;
  const maxMonth = targetYear === currentYear ? currentMonth - 1 : 12;

  for (let month = 1; month <= maxMonth; month++) {
    const totalIncome = Math.floor(Math.random() * 100000) + 50000;
    const totalExpenses = Math.floor(Math.random() * 50000) + 20000;
    const netIncome = totalIncome - totalExpenses;
    
    reports.push({
      year: targetYear,
      month,
      monthName: [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
      ][month - 1],
      totalIncome,
      totalExpenses,
      netIncome,
      invoiceCount: Math.floor(Math.random() * 10) + 5,
      paymentCount: Math.floor(Math.random() * 8) + 3,
      status: netIncome > 0 ? 'profitable' : 'loss',
      generatedAt: new Date().toISOString()
    });
  }

  return reports;
};

const generateMockMonthlyReport = (year, month) => {
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const totalIncome = Math.floor(Math.random() * 100000) + 50000;
  const totalExpenses = Math.floor(Math.random() * 50000) + 20000;
  const netIncome = totalIncome - totalExpenses;

  const mockInvoices = Array.from({ length: Math.floor(Math.random() * 10) + 5 }, (_, i) => ({
    _id: `invoice_${year}_${month}_${i + 1}`,
    invoiceNumber: `INV-${year}-${month.toString().padStart(2, '0')}-${(i + 1).toString().padStart(3, '0')}`,
    client: `Cliente ${i + 1}`,
    amount: Math.floor(Math.random() * 15000) + 5000,
    issueDate: new Date(year, month - 1, Math.floor(Math.random() * 28) + 1),
    dueDate: new Date(year, month - 1, Math.floor(Math.random() * 28) + 1),
    status: ['draft', 'sent', 'paid', 'overdue'][Math.floor(Math.random() * 4)],
    description: `Servicios profesionales - ${monthNames[month - 1]} ${year}`,
    createdBy: {
      name: 'Admin Sistema',
      email: 'admin@loyestask.com'
    }
  }));

  const mockPayments = Array.from({ length: Math.floor(Math.random() * 8) + 3 }, (_, i) => ({
    _id: `payment_${year}_${month}_${i + 1}`,
    paymentNumber: `PAY-${year}-${month.toString().padStart(2, '0')}-${(i + 1).toString().padStart(3, '0')}`,
    amount: Math.floor(Math.random() * 12000) + 3000,
    paymentDate: new Date(year, month - 1, Math.floor(Math.random() * 28) + 1),
    method: ['transfer', 'cash', 'check', 'credit_card'][Math.floor(Math.random() * 4)],
    description: `Pago recibido - ${monthNames[month - 1]} ${year}`,
    account: {
      name: 'Cuenta Principal',
      type: 'checking'
    },
    invoice: {
      invoiceNumber: mockInvoices[i % mockInvoices.length]?.invoiceNumber || 'N/A',
      client: mockInvoices[i % mockInvoices.length]?.client || 'Cliente General'
    },
    createdBy: {
      name: 'Admin Sistema',
      email: 'admin@loyestask.com'
    }
  }));

  return {
    year,
    month,
    period: {
      totalIncome,
      totalExpenses,
      netIncome,
      status: netIncome > 0 ? 'profitable' : 'loss'
    },
    summary: {
      totalInvoices: mockInvoices.length,
      paidInvoices: mockInvoices.filter(inv => inv.status === 'paid').length,
      pendingInvoices: mockInvoices.filter(inv => inv.status === 'sent').length,
      overdueInvoices: mockInvoices.filter(inv => inv.status === 'overdue').length,
      totalAccounts: 3,
      totalBalance: Math.floor(Math.random() * 200000) + 100000
    },
    invoices: mockInvoices,
    payments: mockPayments,
    accounts: [
      {
        _id: 'account_1',
        name: 'Cuenta Corriente Principal',
        type: 'checking',
        balance: Math.floor(Math.random() * 200000) + 100000,
        status: 'active'
      }
    ],
    cashFlow: []
  };
};

// Rutas financieras mock
app.get('/api/financial-exports/available', mockAuth, (req, res) => {
  try {
    const { year } = req.query;
    const targetYear = year ? parseInt(year) : new Date().getFullYear();
    const reports = generateMockReports(targetYear);
    
    res.json({
      msg: "Reportes disponibles obtenidos correctamente",
      reports
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/financial-exports/monthly/:year/:month/data', mockAuth, (req, res) => {
  try {
    const { year, month } = req.params;
    const yearNum = parseInt(year);
    const monthNum = parseInt(month);
    
    if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      return res.status(400).json({ 
        error: "Año y mes válidos son requeridos (mes: 1-12)" 
      });
    }
    
    const reportData = generateMockMonthlyReport(yearNum, monthNum);
    
    res.json({
      msg: "Datos del reporte obtenidos correctamente",
      data: reportData
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint no encontrado',
    path: req.originalUrl,
    method: req.method,
    note: 'Servidor en modo desarrollo simplificado'
  });
});

const port = 4001;

app.listen(port, () => {
  console.log(`🚀 Servidor DEV ejecutándose en puerto ${port}`);
  console.log(`🌍 LoyesTask DEV está listo para usar`);
  console.log(`📝 Modo: Desarrollo Simplificado (sin BD)`);
  console.log(`🔑 Credenciales: admin@loyestask.com / admin123`);
});
