const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

function list(req, res, next) {
  res.json({ data: orders });
}

function validateDataExists(req, res, next) {
  if (req.body.data) {
    next();
  } else {
    next({
      status: 400,
      message: "request body must contain a data object",
    });
  }
}

function validator(field) {
  return function (req, res, next) {
    if (req.body.data[field]) {
      next();
    } else {
      next({
        status: 400,
        message: `Order must include a ${field}`,
      });
    }
  };
}

function dishesValidator(req, res, next) {
  const { dishes } = req.body.data;
  if (!dishes) {
    next({ status: 400, message: "Order must include a dish" });
  } else if (!Array.isArray(dishes) || dishes.length <= 0) {
    next({ status: 400, message: "Order must include at least one dish" });
  } else {
    next();
  }
}

function dishesQuantityValidator(req, res, next) {
  const { dishes } = req.body.data;
  dishes.forEach((dish, index) => {
    if (!dish.quantity) {
      next({
        status: 400,
        message: `Dish ${index} must have a quantity that is an integer greater than 0`,
      });
    } else if (!Number.isInteger(dish.quantity) || dish.quantity <= 0) {
      next({
        status: 400,
        message: `Dish ${index} must have a quantity that is an integer greater than 0`,
      });
    }
  });
  next();
}

function create(req, res, next) {
  let newOrder = {
    id: nextId(),
    deliverTo: req.body.data.deliverTo,
    mobileNumber: req.body.data.mobileNumber,
    dishes: req.body.data.dishes,
  };
  orders.push(newOrder);
  res.status(201).send({ data: newOrder });
}

function validateOrderExists(req, res, next) {
  const { orderId } = req.params;
  const index = orders.findIndex((order) => order.id === orderId);
  if (index < 0) {
    next({ status: 404, message: `order ${orderId} not found` });
  } else {
    res.locals.index = index;
    res.locals.order = orders[index];
    next();
  }
}

function read(req, res) {
  res.send({ data: res.locals.order });
}

function update(req, res, next) {
  const { orderId } = req.params;
  const { deliverTo, mobileNumber, status, dishes } = req.body.data;
  const { order, index } = res.locals;
  if (req.body.data.id && orderId !== req.body.data.id) {
    next({
      status: 400,
      message: `Order id does not match route id. Order: ${req.body.data.id}, Route: ${orderId}`,
    });
    return;
  } else if (status === "delivered") {
    next({ status: 400, message: "A delivered order cannot be changed" });
  } else if (status === "invalid") {
    next({ status: 400, message: "status is invalid" });
  } else {
    const updatedOrder = { ...order, deliverTo, mobileNumber, status, dishes };
    orders[index] = updatedOrder;
    res.send({ data: updatedOrder });
  }
}

function destroy(req, res, next) {
  const { index, order } = res.locals;
  if (order.status !== "pending") {
    next({
      status: 400,
      message: "An order cannot be deleted unless it is pending",
    });
  } else {
    orders.splice(index, 1);
    res.status(204).send();
  }
}

module.exports = {
  list,
  read: [validateOrderExists, read],
  create: [
    validateDataExists,
    ...["deliverTo", "mobileNumber"].map(validator),
    dishesValidator,
    dishesQuantityValidator,
    create,
  ],
  update: [
    validateDataExists,
    validateOrderExists,
    ...["deliverTo", "mobileNumber", "status"].map(validator),
    dishesValidator,
    dishesQuantityValidator,
    update,
  ],
  destroy: [validateOrderExists, destroy],
};

// TODO: Implement the /orders handlers needed to make the tests pass
