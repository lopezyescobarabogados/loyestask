require('dotenv').config();
const mongoose = require('mongoose');

// Connect to database
mongoose.connect(process.env.DATABASE_URL)
  .then(() => console.log('✅ Conectado a MongoDB'))
  .catch(err => {
    console.error('❌ Error de conexión:', err.message);
    process.exit(1);
  });

// Load models after connection
const Account = require('./loyestaskBackend/src/models/Account').default;
const Payment = require('./loyestaskBackend/src/models/Payment').default;

async function testPaymentCreation() {
  try {
    console.log('🔍 PROBANDO CREACIÓN DIRECTA DE PAYMENT');
    
    // Get an existing account
    const account = await Account.findOne({});
    if (!account) {
      console.error('❌ No se encontraron cuentas');
      process.exit(1);
    }
    
    console.log('✅ Cuenta encontrada:', account.name);
    
    // Test 1: String date (como lo envía el frontend)
    console.log('\n📅 Test 1: String date');
    const paymentData1 = {
      type: 'income',
      method: 'bank_transfer',
      amount: 100,
      description: 'Test payment with string date',
      account: account._id,
      paymentDate: '2024-01-15',
      createdBy: account.createdBy || new mongoose.Types.ObjectId()
    };
    
    console.log('Datos:', paymentData1);
    
    const payment1 = new Payment(paymentData1);
    await payment1.save();
    console.log('✅ Payment creado con string date:', payment1.paymentNumber);
    
    // Test 2: Date object
    console.log('\n📅 Test 2: Date object');
    const paymentData2 = {
      type: 'expense',
      method: 'cash',
      amount: 50,
      description: 'Test payment with Date object',
      account: account._id,
      paymentDate: new Date('2024-01-15'),
      createdBy: account.createdBy || new mongoose.Types.ObjectId()
    };
    
    console.log('Datos:', paymentData2);
    
    const payment2 = new Payment(paymentData2);
    await payment2.save();
    console.log('✅ Payment creado con Date object:', payment2.paymentNumber);
    
    // Test 3: ISO string
    console.log('\n📅 Test 3: ISO string');
    const paymentData3 = {
      type: 'income',
      method: 'debit_card',
      amount: 75,
      description: 'Test payment with ISO string',
      account: account._id,
      paymentDate: new Date('2024-01-15').toISOString(),
      createdBy: account.createdBy || new mongoose.Types.ObjectId()
    };
    
    console.log('Datos:', paymentData3);
    
    const payment3 = new Payment(paymentData3);
    await payment3.save();
    console.log('✅ Payment creado con ISO string:', payment3.paymentNumber);
    
    console.log('\n🎉 TODOS LOS TESTS EXITOSOS');
    
  } catch (error) {
    console.error('❌ ERROR EN TEST:', error);
    console.error('Stack:', error.stack);
  } finally {
    mongoose.connection.close();
  }
}

testPaymentCreation();
