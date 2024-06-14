const express = require("express");
const router = express.Router();
const dbPool = require("../config/db.service");
const cartService = require("../services/cart-products-service");
const bodyParser = require("body-parser");
router.use(bodyParser.urlencoded({ extended: true }));

router.use(express.json());

router.get("/", (req, res) => {
  res.redirect("/shops");
});

router.get("/header", (req, res) => {
  res.render("/header");
});

router.get("/shops/:id?", async (req, res) => {
  let shopsArr = [];
  let poolClient = await dbPool.connect();

  try {
    const result = await poolClient.query("select * from shops");

    for (let index = 0; index < result.rows.length; index++) {
      const shopRecord = result.rows[index];
      shopsArr.push({
        id: shopRecord.id,
        shopName: shopRecord.name,
      });
    }
  } catch (ex) {
    console.error(ex);
  } finally {
    poolClient.release();
  }

  let requestId = req.params.id;
  let productsArr = [];

  if (!requestId) {
    requestId = shopsArr[0].id;
  }

  poolClient = await dbPool.connect();

  try {
    const result = await poolClient.query(
      "select * from products where shop_id = $1",
      [requestId]
    );

    for (let index = 0; index < result.rows.length; index++) {
      const productRecord = result.rows[index];
      productsArr.push(mapDbRecordToProduct(productRecord));
    }
  } catch (ex) {
    console.error(ex);
  } finally {
    poolClient.release();
  }

  res.render("shops", {
    shopsArr: shopsArr,
    productsArr: productsArr.filter((x) => x.shopId == requestId),
    currentShopId: requestId,
  });
});

router.get("/cart", async (req, res) => {
  let totalPrice = 0;
  let shops = [];
  let shopIds = [];

  for (let i = 0; i < cartService.products.length; i++) {
    totalPrice += cartService.products[i].price * cartService.products[i].quantity;
    shopIds.push(cartService.products[i].shopId);
  }

  if(shopIds.length) {
    let poolClient = await dbPool.connect();
    shopIds = shopIds.filter((value, index, array) => array.indexOf(value) === index);

    try {
      let parametersString = [];
      
      for (let index = 1; index <= shopIds.length; index++) {
        parametersString.push('$' + index);
      }

      const result = await poolClient.query(
        `select * from shops where id in (${parametersString.join(', ')})`,
        shopIds
      );
  
      for (let index = 0; index < result.rows.length; index++) {
        const shopRecord = result.rows[index];
        shops.push(mapDbShopToShop(shopRecord));
      }
    } catch (ex) {
      console.error(ex);
    } finally {
      poolClient.release();
    }
  }

  console.log(shops);

  res.render("shopping-cart", {
    cartProducts: cartService.products,
    totalPrice: totalPrice,
    shops: shops
  });
});

router.get("/add-to-cart/:id", async (req, res) => {
  let responseMessage;

  if (!cartService.products.some((x) => x.id == req.params.id)) {
    let poolClient = await dbPool.connect();

    try {
      const result = await poolClient.query( "SELECT * FROM products  where id = $1", [req.params.id]);

      if (result.rows.length) {
        const productRecord = result.rows[0];
        const product = mapDbRecordToProduct(productRecord);
        product.quantity = 1;
        cartService.products.push(product);

        responseMessage = `Product with id ${req.params.id} was successfully added to cart`;
      } else {
        responseMessage = `Product with such id = ${req.params.id} does not exist in database`;
      }
    } catch (ex) {
      responseMessage = `Error occured when getting product from db`;
    } finally {
      poolClient.release();
    }
  } else {
    responseMessage = `Product with id ${req.params.id} already exist in cart`;
  }

  res.json({ message: responseMessage });
});

function mapDbRecordToProduct(dbRecord) {
  return {
    id: dbRecord.id,
    shopId: dbRecord.shop_id,
    title: dbRecord.title,
    description: dbRecord.description,
    imgUrl: dbRecord.img_url,
    price: dbRecord.price
  };
}

function mapDbShopToShop(shopRecord) {
  return {
    id: shopRecord.id,
    name: shopRecord.name,
    latitude: shopRecord.latitude,
    longitude: shopRecord.longitude
  }
}

router.delete("/remove-from-cart/:id", (req, res) => {
  let responseMessage;
  let removedObjectId;

  if (cartService.products.some((x) => x.id == req.params.id)) {
    cartService.products = cartService.products.filter(
      (x) => x.id != req.params.id
    );
    removedObjectId = req.params.id;
    responseMessage = `Product with id ${req.params.id} was successfully removed from cart`;
  } else {
    responseMessage = `Product with id ${req.params.id} does not exist in cart`;
  }

  res.json({ message: responseMessage, id: removedObjectId });
});

module.exports = router;
