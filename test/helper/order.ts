import * as fs from "fs";

export const shopifyOrder = JSON.parse(fs.readFileSync("./test/data/order-test/shopifyOrder.json").toString());
shopifyOrder.created_at = new Date().toISOString();
shopifyOrder.id = 12345678910;

export const orderKey = `shopify/orders/${shopifyOrder.created_at.substring(0, 4)}/${shopifyOrder.created_at.substring(5, 7)}/${shopifyOrder.created_at.substring(8, 10)}/${shopifyOrder.id}/${shopifyOrder.name}.json`
