import {assert} from "chai";
import {Event} from "@nbeyer/pms-event";
import * as fs from "fs";
import {pc} from "../src/pms2-process-audit";
import * as _ from "lodash";
import {Noop} from "@nbeyer/pms-noop";
import {getShopifyUpdateEvent} from "./helper/helper";
import {GetObjectCommand, S3Client} from "@aws-sdk/client-s3";
import * as ENV from "./helper/env";
import {DB} from "@nbeyer/beyer-pms2-customerdb";

process.env.TRACE = "";

describe("OrderTest", async function () {

    it("Validate Webhook (valid & invalid)", async function () {
        this.timeout() && this.timeout(10000);
        await pc.startTest();
        pc.defaultContext.invokedFunctionArn = "arn:aws:lambda:eu-west-1:12345678910:function:";

        const event = pc.getInstance<Event>("pms2-shopify-audit");
        const noop = pc.getInstance<Noop>("audit-noop-shopify");

        const validEvent = _.cloneDeep(orderUpdateEvent);
        const invalidEvent = _.cloneDeep(orderUpdateEvent);
        invalidEvent.headers["X-Shopify-Hmac-Sha256"] = "1WhXKgeffuF8Xozwm/804pVIyOQZnVnOs2aMkToEaM0=";

        await event.testRun(invalidEvent);

        assert.lengthOf(noop.getReceivedMessages(), 0);

        await event.testRun(validEvent);

        const msgs = noop.getReceivedMessages();
        assert.lengthOf(noop.getReceivedMessages(), 1);
    });

    it("Store order in S3", async function () {
        this.runnable().timeout() && this.timeout(10000);
        await pc.startTest();

        const event = pc.getInstance<Event>("pms2-shopify-audit");
        const noop = pc.getInstance<Noop>("audit-noop-shopify");

        const validEvent = _.cloneDeep(orderUpdateEvent);
        await event.testRun(validEvent);

        await noop.testRun();

        const order = JSON.parse(validEvent.body);

        const Key = orderKey;
        console.log(Key);
        const mockS3 = pc.pmsMock.AWS.S3;

        const s3 = new S3Client();

        const res = await s3.send(new GetObjectCommand({
            Bucket: "beyer.prod.audit.vault",
            Key
        }));

        const bodyStr = await res.Body.transformToString("utf-8");
        const body = JSON.parse(bodyStr);

        assert.deepEqual(res.Metadata, {
            "order_id": "3752251556017",
            "plannedRetentionDate": (new Date().getFullYear() + 11) + "-01-01"
        })

        assert.deepEqual(body, order);
    });


    beforeEach(async function () {
    });

    afterEach(async function () {
        await pc.endTest();
    });

    before(async function() {
        await DB.connect(ENV.MONGO);
        await DB.disconnect();
    });

});

export const shopifyOrder = JSON.parse(fs.readFileSync("./test/data/order-test/shopifyOrder.json").toString());
shopifyOrder.created_at = new Date().toISOString();
const orderUpdateEvent = getShopifyUpdateEvent(_.merge(_.cloneDeep(shopifyOrder), {
}), "order");
export const orderKey = `shopify/orders/${shopifyOrder.created_at.substring(0, 4)}/${shopifyOrder.created_at.substring(5, 7)}/${shopifyOrder.created_at.substring(8, 10)}/${shopifyOrder.name}/${shopifyOrder.name}.json`