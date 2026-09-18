import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import app from '../src/app';
import { User } from '../src/models/User';
import { Product } from '../src/models/Product';
import { Sale } from '../src/models/Sale';
import { StockMovement } from '../src/models/StockMovement';
import { SaleService } from '../src/services/SaleService';
import { StockService } from '../src/services/StockService';
import { AuthService } from '../src/services/AuthService';

let mongoServer: MongoMemoryServer;
let adminToken: string;
let cashierToken: string;
let cashierUser: any;
let adminUser: any;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  // Create users
  adminUser = await AuthService.createUser(
    {
      username: 'testadmin',
      password: 'password123',
      fullName: 'Test Admin',
      role: 'ADMIN',
    },
    null
  );

  cashierUser = await AuthService.createUser(
    {
      username: 'testcashier',
      password: 'password123',
      fullName: 'Test Cashier',
      role: 'CASHIER',
    },
    null
  );

  const adminLogin = await AuthService.login('testadmin', 'password123');
  adminToken = adminLogin.token;

  const cashierLogin = await AuthService.login('testcashier', 'password123');
  cashierToken = cashierLogin.token;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Supermarket POS & Inventory Logic Integration Tests', () => {
  let testProduct10Stock: any;
  let testProduct2Stock: any;

  beforeEach(async () => {
    await Product.deleteMany({});
    await StockMovement.deleteMany({});
    await Sale.deleteMany({});

    testProduct10Stock = await Product.create({
      name: 'Coca Cola Test 10 units',
      sku: 'TESTCOKE10',
      barcode: '111111111111',
      costPrice: 100,
      sellingPrice: 150,
      stockQuantity: 10,
      minimumStock: 3,
      unit: 'Bottle',
      status: 'Active',
    });

    testProduct2Stock = await Product.create({
      name: 'Rare Snack Test 2 units',
      sku: 'TESTRAR2',
      barcode: '222222222222',
      costPrice: 50,
      sellingPrice: 80,
      stockQuantity: 2,
      minimumStock: 1,
      unit: 'Pack',
      status: 'Active',
    });
  });

  // Test 1: Critical Test - Initial Stock = 10, POS Sale = 3 -> Expected Stock = 7
  test('CRITICAL TEST: Initial Stock = 10, Sale = 3, Expected Stock = 7 with StockMovement', async () => {
    const sale = await SaleService.checkout(
      {
        items: [
          {
            productId: testProduct10Stock._id.toString(),
            quantity: 3,
          },
        ],
        paymentMethod: 'CASH',
        paymentAmount: 500,
      },
      cashierUser
    );

    expect(sale).toBeDefined();
    expect(sale.total).toBe(450); // 3 * 150 = 450
    expect(sale.change).toBe(50); // 500 - 450 = 50
    expect(sale.status).toBe('COMPLETED');

    // Check product stock in database
    const updatedProduct = await Product.findById(testProduct10Stock._id);
    expect(updatedProduct?.stockQuantity).toBe(7);

    // Verify StockMovement record
    const movement = await StockMovement.findOne({
      productId: testProduct10Stock._id,
      referenceId: sale.invoiceNumber,
    });
    expect(movement).toBeDefined();
    expect(movement?.type).toBe('SALE');
    expect(movement?.quantity).toBe(-3);
    expect(movement?.previousStock).toBe(10);
    expect(movement?.newStock).toBe(7);
  });

  // Test 2: Critical Test - Initial Stock = 2, Sale Qty = 5 -> Rejected & Stock remains 2
  test('CRITICAL TEST: Initial Stock = 2, POS requests = 5 -> Sale rejected & Stock remains 2', async () => {
    await expect(
      SaleService.checkout(
        {
          items: [
            {
              productId: testProduct2Stock._id.toString(),
              quantity: 5,
            },
          ],
          paymentMethod: 'CASH',
          paymentAmount: 1000,
        },
        cashierUser
      )
    ).rejects.toThrow(/Insufficient Stock/);

    // Verify stock remains untouched at 2
    const unchangedProduct = await Product.findById(testProduct2Stock._id);
    expect(unchangedProduct?.stockQuantity).toBe(2);
  });

  // Test 3: Stock In Operation
  test('Stock In operation correctly increments stock and creates STOCK_IN movement', async () => {
    const result = await StockService.stockIn(
      {
        productId: testProduct10Stock._id.toString(),
        quantity: 15,
        referenceNumber: 'REF-STKIN-001',
        costPrice: 95,
      },
      adminUser
    );

    expect(result.product.stockQuantity).toBe(25); // 10 + 15 = 25

    const movement = await StockMovement.findOne({ referenceId: 'REF-STKIN-001' });
    expect(movement?.type).toBe('STOCK_IN');
    expect(movement?.quantity).toBe(15);
    expect(movement?.newStock).toBe(25);
  });

  // Test 4: Stock Out Operation
  test('Stock Out operation correctly decrements stock and creates STOCK_OUT movement', async () => {
    const result = await StockService.stockOut(
      {
        productId: testProduct10Stock._id.toString(),
        quantity: 4,
        reason: 'DAMAGED',
        notes: 'Broken glass during handling',
      },
      adminUser
    );

    expect(result.product.stockQuantity).toBe(6); // 10 - 4 = 6

    const movement = await StockMovement.findOne({
      productId: testProduct10Stock._id,
      type: 'STOCK_OUT',
    });
    expect(movement?.type).toBe('STOCK_OUT');
    expect(movement?.quantity).toBe(-4);
    expect(movement?.newStock).toBe(6);
  });

  // Test 5: Void Sale restores inventory
  test('Voiding a sale restores product stock and marks sale VOIDED', async () => {
    // Perform initial sale of 2 items
    const sale = await SaleService.checkout(
      {
        items: [{ productId: testProduct10Stock._id.toString(), quantity: 2 }],
        paymentMethod: 'CASH',
        paymentAmount: 300,
      },
      cashierUser
    );

    const postSaleProduct = await Product.findById(testProduct10Stock._id);
    expect(postSaleProduct?.stockQuantity).toBe(8);

    // Void the sale
    const voidResult = await StockService.voidSale(
      sale._id.toString(),
      'Customer returned items at counter',
      adminUser
    );

    expect(voidResult.sale.status).toBe('VOIDED');

    // Stock should be restored back to 10
    const restoredProduct = await Product.findById(testProduct10Stock._id);
    expect(restoredProduct?.stockQuantity).toBe(10);
  });

  // Test 6: RBAC Protection - Cashier cannot create products in Back Office
  test('RBAC: Cashier token receives 403 Forbidden on product creation', async () => {
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${cashierToken}`)
      .send({
        name: 'Unauthorized Product',
        sku: 'UNAUTH001',
        barcode: '999999999999',
        sellingPrice: 100,
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  // Test 7: RBAC - Admin CAN create products
  test('RBAC: Admin token successfully creates products', async () => {
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Authorized Admin Product',
        sku: 'AUTHADMIN01',
        barcode: '888888888888',
        costPrice: 50,
        sellingPrice: 100,
        stockQuantity: 20,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.product.sku).toBe('AUTHADMIN01');
  });
});
