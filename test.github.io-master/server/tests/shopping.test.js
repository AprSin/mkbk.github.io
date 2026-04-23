const request = require('supertest');
const { app } = require('../src/index');
const { sequelize } = require('../src/models');

describe('云上共富 - 购物系统 API 测试', () => {
  let merchantToken;
  let buyerToken;
  let merchantUserId;
  let buyerUserId;
  let productId;
  let orderId;

  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('认证模块测试', () => {
    test('POST /api/auth/register - 商户注册', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testmerchant',
          email: 'merchant@test.com',
          phone: '13912345678',
          password: 'Test@1234',
          accountType: 'merchant',
          name: '测试商户'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      merchantToken = res.body.data.token;
      merchantUserId = res.body.data.user.id;
    });

    test('POST /api/auth/register - 买家注册', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testbuyer',
          email: 'buyer@test.com',
          phone: '13912345679',
          password: 'Test@1234',
          accountType: 'buyer',
          name: '测试买家'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      buyerToken = res.body.data.token;
      buyerUserId = res.body.data.user.id;
    });

    test('POST /api/auth/login - 用户登录', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testmerchant',
          password: 'Test@1234',
          accountType: 'merchant'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
    });

    test('POST /api/auth/login - 错误密码登录', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testmerchant',
          password: 'WrongPassword',
          accountType: 'merchant'
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    test('GET /api/auth/me - 获取当前用户信息', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${merchantToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.username).toBe('testmerchant');
    });

    test('POST /api/auth/refresh-token - 刷新令牌', async () => {
      const res = await request(app)
        .post('/api/auth/refresh-token')
        .set('Authorization', `Bearer ${merchantToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
    });
  });

  describe('商品管理模块测试', () => {
    test('POST /api/products - 商户创建商品', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${merchantToken}`)
        .send({
          name: '新鲜有机蔬菜',
          description: '来自农村的有机蔬菜，新鲜健康',
          price: 29.99,
          stock: 100,
          origin: '山东寿光',
          category: '农产品'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.product.id).toBeDefined();
      productId = res.body.data.product.id;
    });

    test('GET /api/products - 获取商品列表', async () => {
      const res = await request(app)
        .get('/api/products')
        .query({ page: 1, limit: 10 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.products).toBeDefined();
      expect(res.body.data.pagination).toBeDefined();
    });

    test('GET /api/products/:id - 获取商品详情', async () => {
      const res = await request(app)
        .get(`/api/products/${productId}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.product.name).toBe('新鲜有机蔬菜');
    });

    test('PUT /api/products/:id - 更新商品', async () => {
      const res = await request(app)
        .put(`/api/products/${productId}`)
        .set('Authorization', `Bearer ${merchantToken}`)
        .send({
          name: '优质有机蔬菜',
          price: 39.99
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    test('GET /api/products/merchant/products - 商户获取自己的商品', async () => {
      const res = await request(app)
        .get('/api/products/merchant/products')
        .set('Authorization', `Bearer ${merchantToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('购物车模块测试', () => {
    test('POST /api/cart - 添加商品到购物车', async () => {
      const res = await request(app)
        .post('/api/cart')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          productId: productId,
          quantity: 2
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    test('GET /api/cart - 获取购物车内容', async () => {
      const res = await request(app)
        .get('/api/cart')
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.items).toBeDefined();
    });

    test('POST /api/cart/checkout - 结算购物车', async () => {
      const res = await request(app)
        .post('/api/cart/checkout')
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.orders).toBeDefined();
      orderId = res.body.data.orders[0].id;
    });
  });

  describe('订单模块测试', () => {
    test('GET /api/orders - 获取订单列表', async () => {
      const res = await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    test('GET /api/orders/:id - 获取订单详情', async () => {
      const res = await request(app)
        .get(`/api/orders/${orderId}`)
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    test('PUT /api/orders/:id/pay - 买家付款', async () => {
      const res = await request(app)
        .put(`/api/orders/${orderId}/pay`)
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.order.status).toBe('待发货');
    });

    test('PUT /api/orders/:id/ship - 商户发货', async () => {
      const res = await request(app)
        .put(`/api/orders/${orderId}/ship`)
        .set('Authorization', `Bearer ${merchantToken}`)
        .send({
          logisticsCompany: '顺丰速运',
          trackingNumber: 'SF1234567890'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.order.status).toBe('待收货');
    });

    test('PUT /api/orders/:id/confirm - 买家确认收货', async () => {
      const res = await request(app)
        .put(`/api/orders/${orderId}/confirm`)
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.order.status).toBe('已完成');
    });
  });

  describe('投资项目模块测试', () => {
    let projectId;

    test('POST /api/projects - 商户创建投资项目', async () => {
      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${merchantToken}`)
        .send({
          name: '农村宅基地项目',
          description: '优质宅基地，适合开发',
          price: 500000,
          location: '浙江安吉',
          area: '500平方',
          type: '宅基地',
          contactPerson: '张三',
          contactInfo: '13912345678'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      projectId = res.body.data.project.id;
    });

    test('GET /api/projects - 获取项目列表', async () => {
      const res = await request(app)
        .get('/api/projects');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    test('GET /api/projects/:id - 获取项目详情', async () => {
      const res = await request(app)
        .get(`/api/projects/${projectId}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('投标模块测试', () => {
    let bidId;

    test('POST /api/bids - 买家提交投标', async () => {
      const res = await request(app)
        .post('/api/bids')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          projectId: projectId,
          amount: 480000,
          contact: '李四',
          phone: '13912345679'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      bidId = res.body.data.bid.id;
    });

    test('GET /api/bids - 获取投标列表', async () => {
      const res = await request(app)
        .get('/api/bids')
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    test('PUT /api/bids/:id/accept - 商户接受投标', async () => {
      const res = await request(app)
        .put(`/api/bids/${bidId}/accept`)
        .set('Authorization', `Bearer ${merchantToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('用户管理模块测试', () => {
    test('PUT /api/users/profile - 更新个人信息', async () => {
      const res = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${merchantToken}`)
        .send({
          name: '更新后的商户名称',
          phone: '13900000000'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('错误处理测试', () => {
    test('GET /api/products/999 - 商品不存在', async () => {
      const res = await request(app)
        .get('/api/products/999');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    test('POST /api/cart - 不能购买自己的商品', async () => {
      const res = await request(app)
        .post('/api/cart')
        .set('Authorization', `Bearer ${merchantToken}`)
        .send({
          productId: productId,
          quantity: 1
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('CANNOT_BUY_OWN_PRODUCT');
    });

    test('未授权访问 - 缺少Token', async () => {
      const res = await request(app)
        .get('/api/auth/me');

      expect(res.status).toBe(401);
    });
  });
});