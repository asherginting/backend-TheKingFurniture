const product = require('express').Router();

const productController = require('../controllers/product');
const { verifyUser } = require('../helpers/auth');
const uploadImage = require('../helpers/upload');

product.get('/', productController.getAllProduct);
product.get('/filtered', productController.getFilteredProduct);
product.post('/', verifyUser, uploadImage('image', 10), productController.createProduct);
product.patch('/:id', verifyUser, uploadImage('image', 10), productController.updateProduct);
product.get('/:id', productController.productDetail);
product.get('/seller/:seller_id', productController.getProductBySeller);
product.patch('/delete/:id', verifyUser, productController.deleteProduct);

module.exports = product;
