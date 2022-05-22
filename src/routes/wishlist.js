const wishlist = require('express').Router();
const { verifyUser } = require('../helpers/auth');
const wishlistController = require('../controllers/wishlist');

wishlist.get('/', wishlistController.getAllWishlists);
wishlist.get('/product/:idProduct', wishlistController.getWishlistsByProduct);
wishlist.get('/check/:idProduct', verifyUser, wishlistController.checkWishlist);
wishlist.get('/user', verifyUser, wishlistController.getWishlistsByUser);
wishlist.post('/', verifyUser, wishlistController.toggleWishlist);
wishlist.get('/:id', wishlistController.detailWishlist);

module.exports = wishlist;
