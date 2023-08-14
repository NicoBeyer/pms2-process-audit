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
    return crypto.createHmac('sha256', "256c77cef0c1227c721d8d7494b1ff4a").update(body).digest('base64');
}


