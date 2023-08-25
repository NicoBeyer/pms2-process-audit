import {assert} from "chai";
import {Event} from "@nbeyer/pms-event";
import * as fs from "fs";
import {pc} from "../src/pms2-process-audit";
import * as _ from "lodash";
import {getShopifyUpdateEvent} from "./helper/helper";
import {GetObjectCommand, S3Client} from "@aws-sdk/client-s3";
import {CustomerDb, DB} from "@nbeyer/beyer-pms2-customerdb";
import * as ENV from "./helper/env";
import {orderKey, shopifyOrder} from "./OrderTest";
import {ServiceInstance} from "@nbeyer/pms-process-creator";
import {Noop} from "@nbeyer/pms-noop";

process.env.TRACE = "true";

describe("TransactionTest", async function () {

    it("Store order in S3", async function () {
        this.runnable().timeout() && this.timeout(10000);
        await pc.startTest();
        await addOrder();

        const event = pc.getInstance<Event>("pms2-shopify-audit");
        const customerdb = pc.getInstance<CustomerDb>("pms2-customerdb");
        const noopDebug = pc.getInstance<Noop>("noop-unittest-transactions");

        const validEvent = _.cloneDeep(transactionCreateEvent);
        await event.testRun(validEvent);

        let msgs = customerdb.getReceivedMessages();
        console.log(msgs);
        assert.deepEqual(msgs[0], {
            type: 'FIND',
            collection: 'orders',
            query: { id: 3752251556017, pmsSourceName: 'beyer-soehne.myshopify.com' },
            transaction,
            options: {
                limit: 1,
                forward: true
            },
            _pmsProcessNamespace: 'pms2-process-audit'
        });

        await customerdb.testRun();

        msgs = noopDebug.getReceivedMessages();
        console.log(msgs);

        const Key = orderKey.replace(/\d+.json/g, "transactions/" + transaction.id + ".json");

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
            "transaction_id": transaction.id + "",
            "plannedRetentionDate": (new Date().getFullYear() + 11) + "-01-01"
        })

        assert.deepEqual(body, transaction);
    });


    beforeEach(async function () {
    });

    afterEach(async function () {
        await pc.endTest();
    });

    before(async function() {
        pc.addInstance(new ServiceInstance<Noop>(Noop, {
            instanceName: "noop-unittest-transactions"
        }))
        .connectInstance("pms2-customerdb", "noop-unittest-transactions", {
            type: "SQSQueue"
        })
    });

});


const transaction = _.merge(JSON.parse(fs.readFileSync("./test/data/transaction-test/transaction.json").toString()),
    {
        created_at: new Date().toISOString(),
        order_id: shopifyOrder.id
    });
const transactionCreateEvent = getShopifyUpdateEvent(_.cloneDeep(transaction), "transaction");

async function addOrder() {
    await DB.connect(ENV.MONGO);

    const coll = await DB.collection("orders");

    await coll.insertOne(shopifyOrder);

    await DB.disconnect();
}
