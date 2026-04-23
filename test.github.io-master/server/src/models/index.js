const { sequelize } = require('../config/database')
const { User } = require('./user')
const { Product } = require('./product')
const { Project } = require('./project')
const { Order } = require('./order')
const { Bid } = require('./bid')
const { DataLog } = require('./dataLog')
const { Message } = require('./message')
const { ProjectApplication } = require('./projectApplication')
const { UserUpdateRequest } = require('./userUpdateRequest')
const { ProductUpdateRequest } = require('./productUpdateRequest')
const { ProductPublishRequest } = require('./productPublishRequest')

User.hasMany(Product, { foreignKey: 'userId', as: 'products' })
Product.belongsTo(User, { foreignKey: 'userId', as: 'seller' })

User.hasMany(Project, { foreignKey: 'userId', as: 'projects' })
Project.belongsTo(User, { foreignKey: 'userId', as: 'owner' })

User.hasMany(Order, { foreignKey: 'buyerId', as: 'purchases' })
User.hasMany(Order, { foreignKey: 'merchantId', as: 'sales' })
Order.belongsTo(User, { foreignKey: 'buyerId', as: 'buyer' })
Order.belongsTo(User, { foreignKey: 'merchantId', as: 'merchant' })

Product.hasMany(Order, { foreignKey: 'productId', as: 'orders' })
Order.belongsTo(Product, { foreignKey: 'productId', as: 'product' })

Project.hasMany(Bid, { foreignKey: 'projectId', as: 'bids' })
Bid.belongsTo(Project, { foreignKey: 'projectId', as: 'project' })

User.hasMany(Bid, { foreignKey: 'buyerId', as: 'bids' })
Bid.belongsTo(User, { foreignKey: 'buyerId', as: 'bidder' })

User.hasMany(DataLog, { foreignKey: 'userId', as: 'dataLogs' })
DataLog.belongsTo(User, { foreignKey: 'userId', as: 'user' })

User.hasMany(Message, { foreignKey: 'receiverId', as: 'receivedMessages' })
User.hasMany(Message, { foreignKey: 'senderId', as: 'sentMessages' })
Message.belongsTo(User, { foreignKey: 'receiverId', as: 'receiver' })
Message.belongsTo(User, { foreignKey: 'senderId', as: 'sender' })

// 项目申请关联 - 不使用外键约束
User.hasMany(ProjectApplication, { foreignKey: 'applicantId', as: 'projectApplications', constraints: false })
ProjectApplication.belongsTo(User, { foreignKey: 'applicantId', as: 'applicant', constraints: false })
ProjectApplication.belongsTo(User, { foreignKey: 'reviewerId', as: 'reviewer', constraints: false })
ProjectApplication.belongsTo(Project, { foreignKey: 'projectId', as: 'project', constraints: false })

// 用户修改申请关联 - 不使用外键约束
User.hasMany(UserUpdateRequest, { foreignKey: 'userId', as: 'updateRequests', constraints: false })
UserUpdateRequest.belongsTo(User, { foreignKey: 'userId', as: 'user', constraints: false })
UserUpdateRequest.belongsTo(User, { foreignKey: 'reviewerId', as: 'reviewer', constraints: false })

// 农产品修改申请关联 - 不使用外键约束
User.hasMany(ProductUpdateRequest, { foreignKey: 'merchantId', as: 'productUpdateRequests', constraints: false })
ProductUpdateRequest.belongsTo(User, { foreignKey: 'merchantId', as: 'merchant', constraints: false })
ProductUpdateRequest.belongsTo(User, { foreignKey: 'reviewerId', as: 'reviewer', constraints: false })
ProductUpdateRequest.belongsTo(Product, { foreignKey: 'productId', as: 'product', constraints: false })

// 农产品发布申请关联 - 不使用外键约束
User.hasMany(ProductPublishRequest, { foreignKey: 'merchantId', as: 'productPublishRequests', constraints: false })
ProductPublishRequest.belongsTo(User, { foreignKey: 'merchantId', as: 'merchant', constraints: false })
ProductPublishRequest.belongsTo(User, { foreignKey: 'reviewerId', as: 'reviewer', constraints: false })

module.exports = {
  sequelize,
  User,
  Product,
  Project,
  Order,
  Bid,
  DataLog,
  Message,
  ProjectApplication,
  UserUpdateRequest,
  ProductUpdateRequest,
  ProductPublishRequest
}
