const Sequelize = require('sequelize');
const responseHandler = require('../helpers/responseHandler');
const { inputValidator } = require('../helpers/validator');
const Product = require('../models/product');
const Wishlist = require('../models/wishlist');
const User = require('../models/user');
const ProductImage = require('../models/productImage');

exports.getAllWishlists = async (req, res) => {
  try {
    const results = await Wishlist.findAll({
      attributes: ['id', 'id_user', 'id_product'],
      include: [
        {
          model: User,
          attributes: ['name'],
        },
        {
          model: Product,
          attributes: ['name', 'stock', 'price'],
          include: [ProductImage],
        },
      ],
    });
    return responseHandler(res, 200, 'List all wishlists', results);
  } catch (e) {
    let error = e.message;
    if (Array.isArray(e.errors)) {
      error = e.errors.map((err) => ({ field: err.path, message: err.message }));
    }
    return responseHandler(res, 400, 'error', error);
  }
};

exports.detailWishlist = async (req, res) => {
  const { id } = req.params;
  const wishlist = await Wishlist.findByPk(id, {
    attributes: ['id', 'id_user', 'id_product'],
    include: [
      {
        model: User,
        attributes: ['name'],
      },
      {
        model: Product,
        attributes: ['name', 'stock', 'price'],
        include: [ProductImage],
      },
    ],
  });
  if (wishlist) {
    return responseHandler(res, 200, 'Wishlist detail', wishlist);
  }
  return responseHandler(res, 404, 'Wishlist not found');
};

exports.getWishlistsByProduct = async (req, res) => {
  try {
    const { idProduct } = req.params;
    const results = await Wishlist.findAll({
      where: {
        id_product: idProduct,
      },
      attributes: ['id', 'id_user', 'id_product'],
      include: [
        {
          model: User,
          attributes: ['name'],
        },
        {
          model: Product,
          attributes: ['name', 'stock', 'price'],
          include: [ProductImage],
        },
      ],
    });
    return responseHandler(res, 200, `List wishlists in product ${idProduct}`, results);
  } catch (e) {
    let error = e.message;
    if (Array.isArray(e.errors)) {
      error = e.errors.map((err) => ({ field: err.path, message: err.message }));
    }
    return responseHandler(res, 400, 'error', error);
  }
};

exports.getWishlistsByUser = async (req, res) => {
  try {
    const idUser = req.user.id;
    const results = await Wishlist.findAll({
      where: {
        id_user: idUser,
      },
      attributes: ['id', 'id_user', 'id_product'],
      include: [
        {
          model: User,
          attributes: ['name'],
        },
        {
          model: Product,
          attributes: ['name', 'stock', 'price'],
          include: [ProductImage],
        },
      ],
    });
    return responseHandler(res, 200, `List wishlists in User ${idUser}`, results);
  } catch (e) {
    let error = e.message;
    if (Array.isArray(e.errors)) {
      error = e.errors.map((err) => ({ field: err.path, message: err.message }));
    }
    return responseHandler(res, 400, 'error', error);
  }
};

exports.checkWishlist = async (req, res) => {
  try {
    const idUser = req.user.id;
    const { idProduct } = req.params;
    const results = await Wishlist.findAll({
      where: {
        id_user: idUser,
        id_product: idProduct,
      },
      attributes: ['id', 'id_user', 'id_product'],
      include: [
        {
          model: User,
          attributes: ['name'],
        },
        {
          model: Product,
          attributes: ['name', 'stock', 'price'],
          include: [ProductImage],
        },
      ],
    });
    if (results.length > 0) {
      return responseHandler(res, 200, `Wishlist with User ${idUser} and product ${idProduct} is found`, results);
    }
    return responseHandler(res, 200, `Wishlist with User ${idUser} and product ${idProduct} is not found`, results);
  } catch (e) {
    let error = e.message;
    if (Array.isArray(e.errors)) {
      error = e.errors.map((err) => ({ field: err.path, message: err.message }));
    }
    return responseHandler(res, 400, 'error', error);
  }
};

exports.toggleWishlist = async (req, res) => {
  try {
    const idUser = req.user.id;
    const fillable = [
      {
        field: 'id_product', required: true, type: 'integer',
      },
    ];
    const { error, data } = inputValidator(req, fillable);
    if (error.length > 0) {
      return responseHandler(res, 400, error);
    }

    data.id_user = idUser;
    const wishlist = await Wishlist.findOne({
      where: {
        id_user: data.id_user,
        id_product: data.id_product,
      },
    });

    if (wishlist) {
      await wishlist.destroy();
      return responseHandler(res, 201, 'Wishlist removed!');
    }

    await Wishlist.create(data);
    return responseHandler(res, 201, 'Wishlist added!');
  } catch (e) {
    let error = e.message;
    if (Array.isArray(e.errors)) {
      error = e.errors.map((err) => ({ field: err.path, message: err.message }));
    }
    return responseHandler(res, 400, 'error', error);
  }
};
