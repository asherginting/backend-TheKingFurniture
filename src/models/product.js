const Sequelize = require('sequelize');
const sequelize = require('../helpers/sequelize');
const ProductCategory = require('./productCategory');
const ProductImage = require('./productImage');
const Transaction = require('./transaction');
const Review = require('./review');
const TransactionStatus = require('./transactionStatus');
const FavoriteProduct = require('./favoriteProduct');
const Category = require('./category');

const Product = sequelize.define('product', {
  name: {
    type: Sequelize.STRING,
    unique: {
      msg: 'Product exist',
    },
    allowNull: false,
    validate: {
      notNull: {
        msg: 'Please enter product name',
      },
      notEmpty: {
        msg: 'Name cannot be empty!',
      },
    },
  },
  description: {
    type: Sequelize.STRING,
    allowNull: false,
    validate: {
      notNull: {
        msg: 'Please enter description',
      },
      notEmpty: {
        msg: 'Description cannot be empty!',
      },
    },
  },
  stock: {
    type: Sequelize.INTEGER,
    allowNull: false,
    validate: {
      notNull: {
        msg: 'Please input the stock',
      },
      notEmpty: {
        msg: 'Stock cannot be empty',
      },
      isInt: true,
      isNumeric: {
        msg: 'Stock must be a number',
      },
      min: 0,
    },
  },
  price: {
    type: Sequelize.INTEGER,
    allowNull: false,
    validate: {
      notNull: {
        msg: 'Please input the price',
      },
      notEmpty: {
        msg: 'Price cannot be empty',
      },
    },
  },
  condition: {
    type: Sequelize.ENUM('New', 'Second'),
    allowNull: false,
    validate: {
      notNull: {
        msg: 'Please input the condition',
      },
      notEmpty: {
        msg: 'Condition cannot be empty',
      },
    },
  },
  seller_id: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  is_deleted: {
    type: Sequelize.BOOLEAN,
    defaultValue: 0,
  },
});

Product.hasMany(ProductImage, { foreignKey: 'id_product' });
Product.hasMany(Transaction, { foreignKey: 'id_product' });
Transaction.belongsTo(Product, { foreignKey: 'id_product' });
Transaction.belongsTo(TransactionStatus, { foreignKey: 'id_transaction_status' });
TransactionStatus.hasMany(Transaction, { foreignKey: 'id_transaction_status' });
Product.hasMany(FavoriteProduct, { foreignKey: 'id_product' });
FavoriteProduct.belongsTo(Product, { foreignKey: 'id_product' });
Product.hasMany(ProductCategory, { foreignKey: 'id_product' });
ProductCategory.belongsTo(Product, { foreignKey: 'id_product' });
// ProductCategory.belongsTo(Category, { foreignKey: 'id_category' });
// Category.hasMany(ProductCategory, { foreignKey: 'id_category' });
// Product.hasMany(ColorProduct, { foreignKey: 'id_product' });
Product.hasMany(Review, { foreignKey: 'id_product', as: 'ProductReviews' });

Review.belongsTo(Product, {
  foreignKey: 'id_product',
});

module.exports = Product;
