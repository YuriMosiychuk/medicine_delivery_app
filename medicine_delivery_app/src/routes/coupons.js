const express = require("express");
const router = express.Router();
const dbPool = require("../config/db.service");
const bodyParser = require("body-parser");
router.use(bodyParser.urlencoded({ extended: true }));
router.use(express.json());

router.get("/header", (req, res) => {
  res.render("/header");
});

router.get("/coupons", async (req, res) => {
  let couponsArr = [];
  let poolClient = await dbPool.connect();

  try {
    const result = await poolClient.query(" select * from coupons");

    for (let index = 0; index < result.rows.length; index++) {
      const couponRecord = result.rows[index];
      couponsArr.push({
        title: couponRecord.title,
        imgUrl: couponRecord.img_url,
        couponCode:couponRecord.coupon_code,
      });
    }
  } catch (ex) {
    console.error(ex);
  } finally {
    poolClient.release();
  }

  res.render("coupons", {
    couponsArr: couponsArr,
  });
});

module.exports = router;
