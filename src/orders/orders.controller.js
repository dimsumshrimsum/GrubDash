const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

function validateOrderExists(req, res, next) {
  const { orderId } = req.params;
  const index = orders.findIndex((order) => order.id === orderId);
  if (index < 0) {
    next({ status: 404, message: "order not found" });
  } else {
    res.locals.index = index;
    res.locals.order = orders[index];
    next();
  }
}

function read(req, res) {
  res.send({ data: res.locals.order });
}

module.exports = { read: [validateOrderExists, read] };

// TODO: Implement the /orders handlers needed to make the tests pass
