const express = require("express");
const router = express.Router();
const dbPool = require("../config/db.service");
const bodyParser = require("body-parser");
router.use(bodyParser.urlencoded({ extended: true }));

router.use(express.json());

router.get("/header", (req, res) => {
    res.render("/header");
  });

  router.get("/history", async (req, res) => {
    res.render("history");
  });
 
  


  router.post("/history-search", async (req, res) => {
    if (req.body.email && req.body.phone) {
      let poolClient = await dbPool.connect();
  
      try {
        const result = await poolClient.query(
          `       SELECT 
          o.id, 
          o."name", 
          o.address, 
          count(op.order_id) AS products_count, 
          sum(op.quantity) AS total_products_count, 
          sum(p.price * op.quantity) AS total_price,
          (sum(p.price * op.quantity) - (sum(p.price * op.quantity) * (1 - c.discount / 100))) AS discounted_price,
          (sum(p.price * op.quantity) - (sum(p.price * op.quantity) - (sum(p.price * op.quantity) * (1 - c.discount / 100)))) AS final_price
      FROM 
          orders o 
      INNER JOIN 
          order_products op ON op.order_id = o.id 
      INNER JOIN 
          products p ON op.product_id = p.id
      LEFT JOIN 
          coupons c ON o.coupon_id = c.id
      WHERE 
          o.phone =  $1 AND o.email = $2
      GROUP BY 
          o.id, o."name", o.phone, o.email, o.address, c.discount  
        `,
          [req.body.phone, req.body.email]
        );
  
        let orderItems = [];
  
        for (let index = 0; index < result.rows.length; index++) {
          const orderedItem = result.rows[index];
  
          orderItems.push({
            orderId: orderedItem.id,
            userName: orderedItem.name,
            userAddress: orderedItem.address,
            uniqueProductsCount: orderedItem.products_count,
            totalProductsCount: orderedItem.total_products_count,
            totalPrice: orderedItem.total_price,
            discountedPrice:orderedItem.discounted_price,
            finalPrice:orderedItem.final_price,
          });
        }
  
        console.warn(orderItems.length);

        res.render("history-table", {
          orderItems: orderItems,
        });
      } catch (ex) {
        console.error(ex);
      }
      finally {
        poolClient.release();
      }
    }
  });

  router.get("/api/v1/history-data", async (req, res) => {

    let poolClient = await dbPool.connect();
  
    try {
      const result = await poolClient.query(`select count(*) from order_products`);
      const count = result.rows[0];

      res.json({countValue: count});
    } catch (ex) {
      console.error(ex);
    }
    finally {
      poolClient.release();
    }
  });

  
module.exports = router;