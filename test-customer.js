// test-customer.js

import { GoogleAdsApi } from "google-ads-api";
import dotenv from "dotenv";

dotenv.config();

const client = new GoogleAdsApi({
    client_id: process.env.GOOGLE_ADS_CLIENT_ID,
    client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET,
    developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN
});

const customer = client.Customer({
    customer_id: process.env.GOOGLE_ADS_CUSTOMER_ID,
    refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN
});

try {

    const result = await customer.query(`
      SELECT
      customer.id,
      customer.descriptive_name
      FROM customer
      LIMIT 1
  `);

    console.log(result);

} catch (e) {

    console.log("ERREUR:");
    console.dir(e, { depth: null });

}