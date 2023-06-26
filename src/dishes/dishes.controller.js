const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

function list(req, res) {
  res.json({ data: dishes });
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
      if (field == "price") {
        if (
          !Number.isInteger(req.body.data[field]) ||
          req.body.data[field] < 0
        ) {
          next({
            status: 400,
            message: `Dish must have a ${field} that is an integer greater than 0`,
          });
        }
      }
      next();
    } else {
      next({ status: 400, message: `Dish must include a ${field}` });
    }
  };
}

function create(req, res, next) {
  let newDish = {
    id: nextId(),
    name: req.body.data.name,
    despriction: req.body.data.decription,
    price: req.body.data.price,
    image_url: req.body.data.image_url,
  };
  dishes.push(newDish);
  res.status(201).send({ data: newDish });
}

function validateDishExists(req, res, next) {
  const { dishId } = req.params;
  const index = dishes.findIndex((dish) => dish.id === dishId);
  if (index < 0) {
    next({ status: 404, message: `Dish does not exist ${dishId}` });
  } else {
    res.locals.index = index;
    res.locals.dish = dishes[index];
    next();
  }
}

function read(req, res, next) {
  res.send({ data: res.locals.dish });
}

function update(req, res, next) {
  const { dishId } = req.params;
  const { name, description, price, image_url } = req.body.data;
  const { dish, index } = res.locals;
  if (req.body.data.id && dishId !== req.body.data.id) {
    next({
      status: 400,
      message: `Dish id does not match route id. Dish: ${req.body.data.id}, Route: ${dishId}`,
    });
    return;
  }
  const updatedDish = { ...dish, name, description, price, image_url };
  dishes[index] = updatedDish;
  res.send({ data: updatedDish });
}

module.exports = {
  list,
  create: [
    validateDataExists,
    ...["name", "description", "price", "image_url"].map(validator),
    create,
  ],
  read: [validateDishExists, read],
  update: [
    validateDataExists,
    validateDishExists,
    ...["name", "description", "price", "image_url"].map(validator),
    update,
  ],
};

// TODO: Implement the /dishes handlers needed to make the tests pass
