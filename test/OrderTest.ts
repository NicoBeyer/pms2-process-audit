import {assert} from "chai";
import {Event} from "@nbeyer/pms-event";
import * as fs from "fs";
import {pc} from "../src/pms2-process-audit";
import * as _ from "lodash";
import {Noop} from "@nbeyer/pms-noop";
import {getShopifyUpdateEvent} from "./helper/helper";
import {S3Client, GetObjectCommand} from "@aws-sdk/client-s3";

process.env.TRACE = "";
process.env.AWS_DEFAULT_REGION = process.env.AWS_DEFAULT_REGION || "eu-west-1";

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
        const Key = `shopify/orders/${order.created_at.substring(0, 4)}/${order.created_at.substring(5, 7)}/${order.name}/${order.name}.json`

        const mockS3 = pc.pmsMock.AWS.S3;

        const s3 = new S3Client();

        const res = await s3.send(new GetObjectCommand({
            Bucket: "beyer.prod.audit.vault",
            Key
        }));

        const bodyStr = await res.Body.transformToString("utf-8");
        const body = JSON.parse(bodyStr);

        assert.deepEqual(body, order);
    });


    beforeEach(async function () {
    });

    afterEach(async function () {
        await pc.endTest();
    });

    before(async function() {

    });

    const shopifyOrder = JSON.parse(fs.readFileSync("./test/data/order-test/shopifyOrder.json").toString());
    const orderUpdateEvent = getShopifyUpdateEvent(_.merge(_.cloneDeep(shopifyOrder), {
        created_at: new Date().toISOString()
    }), "order");

});