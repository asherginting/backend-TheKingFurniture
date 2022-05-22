/* eslint-disable consistent-return */
/* eslint-disable max-len */
const Sequelize = require('sequelize');
const { cloudPathToFileName } = require('../helpers/converter');
const { deleteImages } = require('../helpers/deleteArrayImages');
const { deleteFile } = require('../helpers/fileHandler');
const responseHandler = require('../helpers/responseHandler');
const Category = require('../models/category');
const Product = require('../models/product');
const ProductCategory = require('../models/productCategory');
const ProductImage = require('../models/productImage');
const Review = require('../models/review');
const User = require('../models/user');

const { APP_URL } = process.env;

exports.getAllProduct = async (req, res) => {
  const { search = '', orderBy = 1 } = req.query;
  let {
    minPrice, maxPrice, limit, page,
  } = req.query;
  const listOrder = ['id DESC', 'id ASC', 'price DESC', 'price ASC'];
  if (orderBy > listOrder.length) {
    return responseHandler(res, 400, 'Wrong order');
  }
  const setOrder = listOrder[orderBy - 1].split(' ');
  minPrice = parseInt(minPrice, 10) || 0;
  maxPrice = parseInt(maxPrice, 10) || 100000000;
  limit = parseInt(limit, 10) || 16;
  page = parseInt(page, 10) || 1;
  const dataName = ['search', 'minPrice', 'maxPrice'];
  const data = { search, minPrice, maxPrice };
  let url = `${APP_URL}/product?`;
  dataName.forEach((x) => {
    if (req.query[x]) {
      data[x] = req.query[x];
      url = `${url}${x}=${data[x]}&`;
    }
  });
  const offset = (page - 1) * limit;
  const results = await Product.findAll({
    include: [
      {
        model: ProductCategory,
        attributes: ['id_category'],
      },
      {
        model: ProductImage,
        attributes: ['image'],
      },
    ],
    where: {
      name: {
        [Sequelize.Op.like]: `%${search}%`,
      },
      price: {
        [Sequelize.Op.gte]: minPrice,
        [Sequelize.Op.lte]: maxPrice,
      },
      stock: {
        [Sequelize.Op.gte]: 1,
      },
      is_deleted: 0,
    },
    order: [
      [setOrder[0], setOrder[1]],
    ],
    limit,
    offset,
  });
  const count = await Product.count({
    where: {
      name: {
        [Sequelize.Op.like]: `%${search}%`,
      },
      price: {
        [Sequelize.Op.gte]: minPrice,
        [Sequelize.Op.lte]: maxPrice,
      },
      stock: {
        [Sequelize.Op.gte]: 1,
      },
      is_deleted: 0,
    },
  });
  const last = Math.ceil(count / limit);
  const pageInfo = {
    prev: page > 1 ? `${url}page=${page - 1}&limit=${limit}` : null,
    next: page < last ? `${url}page=${page + 1}&limit=${limit}` : null,
    totalData: count,
    currentPage: page,
    lastPage: last,
  };
  return responseHandler(res, 200, 'List of products', results, pageInfo);
};

exports.getFilteredProduct = async (req, res) => {
  const { category, search = '', orderBy = 1 } = req.query;
  let {
    minPrice, maxPrice, limit, page,
  } = req.query;
  const listOrder = ['id DESC', 'id ASC', 'price DESC', 'price ASC'];
  if (orderBy > listOrder.length) {
    return responseHandler(res, 400, 'Wrong order');
  }
  let categoryList = [];
  if (category.length > 0) {
    categoryList = category.split(',');
    categoryList = categoryList.map((obj) => parseInt(obj, 10));
  }
  let checkCategoriesError = false;
  categoryList.forEach((obj) => {
    if (Number.isNaN(obj)) {
      checkCategoriesError = true;
    }
  });
  if (checkCategoriesError) {
    return responseHandler(res, 400, 'Wrong categories');
  }
  const setOrder = listOrder[orderBy - 1].split(' ');
  minPrice = parseInt(minPrice, 10) || 0;
  maxPrice = parseInt(maxPrice, 10) || 100000000;
  limit = parseInt(limit, 10) || 12;
  page = parseInt(page, 10) || 1;
  const dataName = ['search', 'minPrice', 'maxPrice', 'category'];
  const data = {
    search, minPrice, maxPrice, category,
  };
  let url = `${APP_URL}/product?`;
  dataName.forEach((x) => {
    if (req.query[x]) {
      data[x] = req.query[x];
      url = `${url}${x}=${data[x]}&`;
    }
  });
  const offset = (page - 1) * limit;
  const results = await Product.findAll({
    include: [
      {
        model: ProductCategory,
        attributes: ['id_category'],
        where: {
          id_category: {
            [Sequelize.Op.in]: categoryList,
          },
        },
      },
      {
        model: ProductImage,
        attributes: ['image'],
      },
    ],
    where: {
      name: {
        [Sequelize.Op.like]: `%${search}%`,
      },
      price: {
        [Sequelize.Op.gte]: minPrice,
        [Sequelize.Op.lte]: maxPrice,
      },
      stock: {
        [Sequelize.Op.gte]: 1,
      },
      is_deleted: 0,
    },
    order: [
      [setOrder[0], setOrder[1]],
    ],
    limit,
    offset,
  });
  const count = await Product.count({
    where: {
      name: {
        [Sequelize.Op.like]: `%${search}%`,
      },
      price: {
        [Sequelize.Op.gte]: minPrice,
        [Sequelize.Op.lte]: maxPrice,
      },
      is_deleted: 0,
    },
    include: [
      {
        model: ProductCategory,
        where: {
          id_category: {
            [Sequelize.Op.in]: categoryList,
          },
        },
      },
    ],
  });
  const last = Math.ceil(count / limit);
  const pageInfo = {
    prev: page > 1 ? `${url}page=${page - 1}&limit=${limit}` : null,
    next: page < last ? `${url}page=${page + 1}&limit=${limit}` : null,
    totalData: count,
    currentPage: page,
    lastPage: last,
  };
  return responseHandler(res, 200, 'List of products', results, pageInfo);
};

exports.getProductBySeller = async (req, res) => {
  try {
    const id = req.params.seller_id;
    const { orderBy = 1 } = req.query;
    const listOrder = ['id DESC', 'id ASC', 'price DESC', 'price ASC'];
    if (orderBy > listOrder.length) {
      return responseHandler(res, 400, 'Wrong order');
    }
    const setOrder = listOrder[orderBy - 1].split(' ');
    const seller = await User.findAll({
      where: {
        id,
        id_role: 2,
      },
    });
    if (!seller || seller.length < 1) {
      return responseHandler(res, 404, 'Seller not found');
    }
    const { search = '' } = req.query;
    let {
      minPrice, maxPrice, limit, page,
    } = req.query;
    minPrice = parseInt(minPrice, 10) || 0;
    maxPrice = parseInt(maxPrice, 10) || 100000000;
    limit = parseInt(limit, 10) || 10;
    page = parseInt(page, 10) || 1;
    const dataName = ['search', 'minPrice', 'maxPrice'];
    const data = { search, minPrice, maxPrice };
    let url = `${APP_URL}/product/seller/${id}?`;
    dataName.forEach((x) => {
      if (req.query[x]) {
        data[x] = req.query[x];
        url = `${url}${x}=${data[x]}&`;
      }
    });
    const offset = (page - 1) * limit;
    const product = await Product.findAll({
      include: [
        {
          model: ProductCategory,
          attributes: ['id_category'],
        },
        {
          model: ProductImage,
          attributes: ['image'],
        },
      ],
      where: {
        name: {
          [Sequelize.Op.like]: `%${search}%`,
        },
        price: {
          [Sequelize.Op.gte]: minPrice,
          [Sequelize.Op.lte]: maxPrice,
        },
        seller_id: id,
        is_deleted: 0,
      },
      order: [
        [setOrder[0], setOrder[1]],
      ],
      limit,
      offset,
    });
    const count = await Product.count({
      where: {
        name: {
          [Sequelize.Op.like]: `%${search}%`,
        },
        price: {
          [Sequelize.Op.gte]: minPrice,
          [Sequelize.Op.lte]: maxPrice,
        },
        seller_id: id,
        is_deleted: 0,
      },
    });
    const last = Math.ceil(count / limit);
    const pageInfo = {
      prev: page > 1 ? `${url}page=${page - 1}&limit=${limit}` : null,
      next: page < last ? `${url}page=${page + 1}&limit=${limit}` : null,
      totalData: count,
      currentPage: page,
      lastPage: last,
    };
    if (product.length > 0) {
      return responseHandler(res, 200, 'Product list', product, pageInfo);
    }
    return responseHandler(res, 200, 'Seller has no product yet', null, null);
  } catch {
    return responseHandler(res, 500, 'Unexpected error');
  }
};

exports.createProduct = async (req, res) => {
  try {
    if (req.user.role !== 2) {
      if (req.files) {
        deleteImages(req.files);
      }
      return responseHandler(res, 401, 'You are not able to do this action');
    }
    if (!req.body.id_category) {
      return responseHandler(res, 400, 'Please enter at least 1 category', null, null);
    }
    const listIdCategory = req.body.id_category.split(',');
    if (listIdCategory.length < 1) {
      return responseHandler(res, 400, 'Please enter at least 1 category', null, null);
    }
    const dataProduct = {};
    Object.keys(req.body).forEach((x) => {
      dataProduct[x] = req.body[x];
    });
    dataProduct.seller_id = req.user.id;
    const product = await Product.create(dataProduct);
    const data = { id_product: product.dataValues.id };
    if (req.files) {
      req.files.forEach(async (pic) => {
        data.image = pic.path;
        const productImage = await ProductImage.create(data);
        if (!productImage) {
          deleteImages(req.files);
          // return responseHandler(res, 400, 'Cant upload image', null, null);
        }
      });
    }
    listIdCategory.forEach(async (x) => {
      const getCategory = await Category.findByPk(x);
      if (!getCategory) {
        return responseHandler(res, 404, 'Category not found');
      }
      data.id_category = x;
      // eslint-disable-next-line no-unused-vars
      const productCategory = await ProductCategory.create(data);
    });
    const getProduct = await Product.findAll({
      include: [
        { model: ProductImage },
      ],
      where: {
        id: product.dataValues.id,
      },
    });
    return responseHandler(res, 200, 'Product created', getProduct);
  } catch (e) {
    // const errMessage = e.errors.map((err) => ({ field: err.path, message: err.message }));
    if (req.files) {
      deleteImages(req.files);
    }
    return responseHandler(res, 400, 'Can\'t create product', e, null);
  }
};

exports.productDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findByPk(id, {
      attributes: [
        'id',
        'name',
        'description',
        'stock',
        'price',
        'condition',
        'seller_id',
        [
          Sequelize.fn('AVG', Sequelize.col('ProductReviews.rating')), 'avgRating',
        ],
      ],

      include: [
        {
          model: ProductCategory,
          attributes: ['id_category'],
        },
        {
          model: ProductImage,
          attributes: ['image'],
        },
        {
          model: Review,
          attributes: [],
          as: 'ProductReviews',
        },
      ],
      where: {
        is_deleted: 0,
      },
      group: ['id'],
    });
    if (product) {
      return responseHandler(res, 200, 'Product detail', product, null);
    }
    return responseHandler(res, 404, 'Product not found', null, null);
  } catch (e) {
    return responseHandler(res, 500, 'Unexpected error');
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findByPk(id);
    if (!product || product.dataValues.is_deleted) {
      if (req.files) {
        deleteImages(req.files);
      }
      return responseHandler(res, 404, 'Product not found', null, null);
    }
    if (req.user.role !== 2 && req.user.id !== product.dataValues.seller_id) {
      if (req.files) {
        deleteImages(req.files);
      }
      return responseHandler(res, 401, 'You are not able to do this action');
    }
    Object.keys(req.body).forEach((data) => {
      product[data] = req.body[data];
    });
    product.seller_id = req.user.id;
    await product.save();
    const productImage = await ProductImage.findAll({
      where: {
        id_product: product.dataValues.id,
      },
    });
    if (productImage.length + req.files.length > 10) {
      return responseHandler(res, 400, 'Maximum image for each product is 10 images. Please delete some images first to continue');
    }
    const data = { id_product: id };
    if (req.files) {
      req.files.forEach(async (pic) => {
        data.image = pic.path;
        const productImages = await ProductImage.create(data);
        if (!productImages) {
          deleteImages(req.files);
          return responseHandler(res, 400, 'Cant upload image', null, null);
        }
      });
    }
    return responseHandler(res, 200, 'Product updated', product, null);
  } catch (e) {
    if (req.files) {
      deleteImages(req.files);
    }
    return responseHandler(res, 400, 'Can\'t update product', e, null);
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findByPk(id);
    if (req.user.id !== product.dataValues.seller_id) {
      return responseHandler(res, 401, 'You are not able to do this action');
    }
    if (product && product.dataValues.is_deleted === false) {
      product.is_deleted = 1;
      await product.save();
      const productImage = await ProductImage.findAll({
        where: {
          id_product: id,
        },
      });
      if (productImage) {
        productImage.map(async (data) => {
          await data.destroy();
          deleteFile(cloudPathToFileName(data.image));
        });
      }
      return responseHandler(res, 200, 'Product was deleted', null, null);
    }
    return responseHandler(res, 404, 'Product not found', null, null);
  } catch (e) {
    if (req.files) {
      deleteImages(req.files);
    }
    return responseHandler(res, 400, 'Can\'t delete', e, null);
  }
};
