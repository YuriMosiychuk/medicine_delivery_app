const express = require("express");
const router = express.Router();
const dbPool = require("../config/db.service");
const cartService = require("../services/cart-products-service");
const bodyParser = require("body-parser");
router.use(bodyParser.urlencoded({ extended: true }));

router.use(express.json());

router.get("/header", (req, res) => {
  res.render("/header");
});


router.post("/buy", async (req, res) => {
  let responseMessage;
  let isSuccess = false;
   
  if (req.body) {
    let validationResult = isFormDataVaid(req.body);

    if(!validationResult.isSuccess) {
      res.render("shopping-cart-result", validationResult);

      return;
    }

    let poolClient = await dbPool.connect();
  
    try {
      let totalOrderPrice = await calculateTotalPrice(poolClient, req.body.products, req.body.couponId);

      console.log('total price ' + totalOrderPrice);

      // Вставка даних про замовлення
      const orderQueryParams = [
          req.body.name,
          req.body.phone,
          req.body.email,
          req.body.address,
          totalOrderPrice,
          req.body.couponId || null
      ];
    
      const result = await poolClient.query(
          "INSERT INTO orders (name, phone, email, address, price, coupon_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id;",
          orderQueryParams
      );

      const orderId = result.rows[0].id;

      // Обчислення вартості та оновлення цін товарів у замовленні
      for (let index = 0; index < req.body.products.length; index++) {
          const orderedProduct = req.body.products[index];
 
          const productQueryParams = [
              orderId,
              parseInt(orderedProduct.id),
              parseInt(orderedProduct.quantity),
              orderedProduct.price
          ];

          console.log(productQueryParams);

          await poolClient.query(
              "INSERT INTO order_products (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4);",
              productQueryParams
          );
      }

      responseMessage = "Order was successfully created";
      cartService.products = [];
      isSuccess = true;
    } catch (ex) {
        responseMessage = `Error occurred: ${ex.message}`;
        console.error(ex);
    } finally {
        poolClient.release();
    }
  } else {
      responseMessage = "Error. Impossible to achieve request body (form-data)";
  }

  // Відображення результату
  res.render("shopping-cart-result", {
      message: responseMessage,
      isSuccess: isSuccess,
  });
});

router.post('/coupons/validate', async (req, res) => {
  let responseObj = {
    isValid: false
  }  
  
  if(req.body.code) {
    let poolClient = await dbPool.connect();

    try{
      const result = await poolClient.query(`select id, title, discount from coupons where coupon_code = $1`, [req.body.code]);

      if(result.rows.length) {
        responseObj.id = result.rows[0].id;
        responseObj.coupnonTitle = result.rows[0].title;
        responseObj.couponDiscount = result.rows[0].discount;
        responseObj.isValid = true;
      }
    }
    catch(ex) {
      console.error(ex);
    }
    finally {
      poolClient.release();
    }
  }

  console.warn(responseObj);

  res.json(responseObj);
});

async function calculateTotalPrice(postgresConnection, products, couponId) {
  let discount = 0;
  let total = 0;

  if(couponId && couponId > 0) {
    const result = await postgresConnection.query("select discount from coupons where id = $1", [couponId]);

    if(result.rows.length === 0) {
      throw new Error("Coupon not found");
    }

    discount = result.rows[0].discount;
  }

  for (let index = 0; index < products.length; index++) {
      // Отримання ціни товару з бази даних
    const productPriceResult = await postgresConnection.query("SELECT price FROM products WHERE id = $1;", [products[index].id]);

    // Перевірка наявності результату запиту
    if (productPriceResult.rows.length === 0) {
        throw new Error("Product not found");
    }

    products[index].price = productPriceResult.rows[0].price;
    const orderProductPrice = products[index].price * products[index].quantity;
    total += orderProductPrice;
  }

  if(discount) {
    total = total - (total * (discount / 100));
  }

  return Math.floor(total);
}

function isFormDataVaid(formData) {
  let validationObj = {
    message: ''
  };

  if (!formData.name || !formData.name.length) {
    validationObj.message = "Invalid name";
  }

  if (!formData.email || !formData.email.length) {
    validationObj.message = "Invalid email";
  }

  if (!formData.phone || !formData.phone.length) {
    validationObj.message = "Invalid phone";
  }

  if (!formData.address || !formData.address.length) {
    validationObj.message = "Invalid address";
  }

  if (!formData.products || !formData.products.length) {
    validationObj.message = "No any produts in shopping card";
  }

  validationObj.isSuccess = validationObj.message == '';
 
  return validationObj;
}

module.exports = router;