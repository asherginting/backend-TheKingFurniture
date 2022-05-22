const Sequelize = require('sequelize');
const sequelize = require('../helpers/sequelize');
const Product = require('./product');
const ProductCategory = require('./productCategory');

const Category = sequelize.define('category', {
  name: {
    type: Sequelize.STRING,
    unique: {
      msg: 'Category already exist',
    },
    allowNull: false,
    validate: {
      notNull: {
        msg: 'Name cannot be null!',
      },
      notEmpty: {
        msg: 'Name cannot be empty!',
      },
    },
  },
});

// Product.hasMany(ProductCategory, { foreignKey: 'id_product' });
// ProductCategory.belongsTo(Product, { foreignKey: 'id_product' });
// Category.hasMany(ProductCategory, { foreignkey: { name: 'id_category' } });
// ProductCategory.belongsTo(Category, { foreignKey: { name: 'id_category' } });
module.exports = Category;
