import * as fs from "fs";
import * as crypto from "crypto";

export function getShopifyUpdateEvent(shopifyObject: Record<string, unknown>, proxy: string) {
    const event = JSON.parse(fs.readFileSync("./test/data/shopifyUpdateEvent.json").toString());

    event.body = JSON.stringify(shopifyObject);
    event.pathParameters.proxy = proxy;

    event.headers["X-Shopify-Hmac-Sha256"] = getHmac(event.body);

    console.log(JSON.stringify(event, null, 3))

    return event;
}

export function getHmac(body: string) {
    return crypto.createHmac('sha256', process.env.SHOPIFY_API_SECRET).update(body).digest('base64');
}

export type toAny<T> = {
[P in keyof T]: any;
}


