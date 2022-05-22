/* eslint-disable consistent-return */
/* eslint-disable array-callback-return */
const Sequelize = require('sequelize');

const { APP_URL } = process.env;
const Transaction = require('../models/transaction');
const responseHandler = require('../helpers/responseHandler');
const Product = require('../models/product');
const ProductImage = require('../models/productImage');
const TransactionStatus = require('../models/transactionStatus');

exports.getAllTransaction = async (req, res) => {
  try {
    let { limit, page } = req.body;
    limit = parseInt(limit, 10) || 12;
    page = parseInt(page, 10) || 1;
    const url = `${APP_URL}/transaction?`;
    const offset = (page - 1) * limit;
    const transaction = await Transaction.findAll({
      where: {
        is_deleted: 0,
      },
      limit,
      offset,
    });
    const count = await Transaction.count({
      where: {
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
    return responseHandler(res, 200, 'List of all transactions', transaction, pageInfo);
  } catch (e) {
    return responseHandler(res, 500, 'Error', e, null);
  }
};

exports.getTransactionByUser = async (req, res) => {
  try {
    let { limit, page } = req.body;
    limit = parseInt(limit, 10) || 12;
    page = parseInt(page, 10) || 1;
    const url = `${APP_URL}/transaction/user?`;
    const offset = (page - 1) * limit;
    const transaction = await Transaction.findAll({
      include: [
        {
          model: Product,
          include: [
            ProductImage,
          ],
        },
        {
          model: TransactionStatus,
        },
      ],
      where: {
        id_user: req.user.id,
        id_transaction_status: {
          [Sequelize.Op.gte]: 2,
        },
        is_deleted: 0,
      },
      limit,
      offset,
    });
    const count = await Transaction.count({
      where: {
        id_user: req.user.id,
        id_transaction_status: {
          [Sequelize.Op.gte]: 2,
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
    return responseHandler(res, 200, 'List of all transactions', transaction, pageInfo);
  } catch (e) {
    return responseHandler(res, 500, 'Error', e, null);
  }
};

exports.getUserCart = async (req, res) => {
  try {
    let { limit, page } = req.body;
    limit = parseInt(limit, 10) || 10;
    page = parseInt(page, 10) || 1;
    const url = `${APP_URL}/transaction/cart?`;
    const offset = (page - 1) * limit;
    const transaction = await Transaction.findAll({
      include: [
        {
          model: Product,
          include: [
            ProductImage,
          ],
        },
      ],
      where: {
        id_user: req.user.id,
        id_transaction_status: 1,
        is_deleted: 0,
      },
      limit,
      offset,
      order: [
        ['id', 'DESC'],
      ],
    });
    const count = await Transaction.count({
      where: {
        id_user: req.user.id,
        id_transaction_status: 1,
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
    if (transaction.length === 1) {
      return responseHandler(res, 200, 'List of all transaction', [transaction], pageInfo);
    }
    return responseHandler(res, 200, 'List of all transactions', transaction, pageInfo);
  } catch (e) {
    return responseHandler(res, 500, 'Error', e, null);
  }
};

exports.getTransactionForSeller = async (req, res) => {
  try {
    const sellerTransaction = [];
    const transaction = await Transaction.findAll({
      include: [
        {
          model: Product,
          where: { is_deleted: 0 },
          include: [
            ProductImage,
          ],
        },
        {
          model: TransactionStatus,
        },
      ],
      where: {
        id_transaction_status: {
          [Sequelize.Op.gte]: 2,
          [Sequelize.Op.lte]: 5,
        },
      },
      order: [
        ['id', 'DESC'],
      ],
    });
    if (!transaction) {
      return responseHandler(res, 200, 'You have no transaction');
    }
    sellerTransaction.reverse();
    return responseHandler(res, 200, 'Transaction list', transaction, null);
  } catch (e) {
    return responseHandler(res, 400, 'Error', e, null);
  }
};

exports.addTransaction = async (req, res) => {
  try {
    const product = await Product.findByPk(req.body.id_product);
    if (!product || product.length < 1) {
      return responseHandler(res, 404, 'Product not found');
    }
    if (req.body.id_transaction_status > 5) {
      return responseHandler(res, 400, 'You haven\'t made any transaction');
    }
    const data = {};
    Object.keys(req.body).forEach((x) => {
      data[x] = req.body[x];
    });
    if (data.qty < 1) {
      return responseHandler(res, 'Quantity should be greater than 0');
    }
    if (product.stock < data.qty) {
      return responseHandler(res, 400, 'Stock limited');
    }
    data.total_price = data.qty * product.price;
    data.id_user = req.user.id;
    const transaction = await Transaction.create(data);
    if (data.id_transaction_status > 1) {
      product.stock -= data.qty;
    }
    await product.save();
    return responseHandler(res, 200, 'Successfully add transaction', transaction, null);
  } catch (e) {
    return responseHandler(res, 400, 'Error', e, null);
  }
};

exports.updateTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const transaction = await Transaction.findByPk(id);
    if (transaction.dataValues.id_transaction_status === 6) {
      return responseHandler(res, 400, 'You have been cancelled this transaction');
    }
    const productId = req.body.id_product ? req.body.id_product : transaction.id_product;
    const product = await Product.findByPk(productId);
    if (!product || product.length < 1) {
      return responseHandler(res, 404, 'Product not found');
    }
    const status = transaction.dataValues.id_transaction_status;
    Object.keys(req.body).forEach((x) => {
      transaction[x] = req.body[x];
    });
    transaction.qty = transaction.dataValues.qty;
    transaction.total_price = transaction.qty * product.price;
    transaction.id_user = req.user.id;
    await transaction.save();
    if (status === 1 && transaction.id_transaction_status > 1) {
      product.stock -= transaction.qty;
      await product.save();
    }
    if (status > 1 && transaction.id_transaction_status > 5) {
      product.stock += transaction.qty;
      await product.save();
    }
    return responseHandler(res, 200, 'Transaction was updated', transaction, null);
  } catch (e) {
    return responseHandler(res, 400, 'Error', e, null);
  }
};

exports.deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const transaction = await Transaction.findByPk(id);
    if (req.user.id !== transaction.id_user) {
      return responseHandler(res, 401, 'You are unable to do this action');
    }
    if (!transaction || transaction.dataValues.is_deleted) {
      return responseHandler(res, 404, 'Data not found', null, null);
    }
    if (transaction.id_transaction_status < 5 && transaction.id_transaction_status > 1) {
      return responseHandler(res, 400, 'You haven\'t finish or cancel your transaction.');
    }
    transaction.is_deleted = 1;
    await transaction.save();
    return responseHandler(res, 200, 'Transaction was deleted', null, null);
  } catch (e) {
    return responseHandler(res, 400, 'Error', e, null);
  }
};
