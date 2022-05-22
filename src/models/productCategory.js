const Sequelize = require('sequelize');
const sequelize = require('../helpers/sequelize');

// const Product = require('./product');
const Category = require('./category');

const ProductCategory = sequelize.define('product_category', {
  id_product: {
    type: Sequelize.INTEGER,
    // references: {
    //   model: Product,
    //   key: 'id',
    // },
  },
  id_category: {
    type: Sequelize.INTEGER,
    references: {
      model: Category,
      key: 'id',
    },
  },
  is_deleted: {
    type: Sequelize.BOOLEAN,
    defaultValue: 0,
  },
});

module.exports = ProductCategory;
