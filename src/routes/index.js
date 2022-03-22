const routes = require('express').Router();
const responseHandler = require('../helpers/responseHandler');

routes.use('/category', require('./category'));
routes.use('/role', require('./role'));

routes.get('/', (req, res) => responseHandler(res, 200, 'Backend is running well!'));

module.exports = routes;
