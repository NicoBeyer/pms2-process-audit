import {assert} from "chai";
import {Event} from "@nbeyer/pms-event";
import * as fs from "fs";
import {pc} from "../src/pms2-process-audit";
import * as _ from "lodash";
import {getShopifyUpdateEvent} from "./helper/helper";
import {GetObjectCommand, S3Client} from "@aws-sdk/client-s3";
import {Noop} from "@nbeyer/pms-noop";
import {shopifyOrder} from "./helper/order";

process.env.TRACE = "true";

describe("TransactionTest", async function () {

    it("Store order in S3", async function () {
        this.runnable().timeout() && this.timeout(10000);
        await pc.startTest();

        const event = pc.getInstance<Event>("pms2-shopify-audit");
        const noop = pc.getInstance<Noop>("audit-noop-shopify");

        const validEvent = _.cloneDeep(transactionCreateEvent);
        await event.testRun(validEvent);

        let msgs = noop.getReceivedMessages();
        console.log(msgs);
        assert.deepEqual(msgs[0], {
            transaction,
            _pmsProcessNamespace: 'pms2-process-audit'
        });

        assert.lengthOf(msgs, 1);

        await noop.testRun();

        const Key = `shopify/transactions/${transaction.created_at.substring(0, 4)}/${transaction.created_at.substring(5, 7)}/${transaction.created_at.substring(8, 10)}/${transaction.order_id}/${transaction.id}.json`

        const mockS3 = pc.pmsMock.AWS.S3;

        const s3 = new S3Client();

        const res = await s3.send(new GetObjectCommand({
            Bucket: "beyer.prod.audit.vault",
            Key
        }));

        const bodyStr = await res.Body.transformToString("utf-8");
        const body = JSON.parse(bodyStr);

        assert.deepEqual(res.Metadata, {
            "order_id": "12345678910",
            "transaction_id": transaction.id + "",
            "plannedRetentionDate": (new Date().getFullYear() + 11) + "-01-01",
            "shopify_type": "transaction"
        });

        assert.deepEqual(body, transaction);
    });


    beforeEach(async function () {
    });

    afterEach(async function () {
        await pc.endTest();
    });

    before(async function() {
    });

});


const transaction = _.merge(JSON.parse(fs.readFileSync("./test/data/transaction-test/transaction.json").toString()),
    {
        created_at: new Date().toISOString(),
        order_id: shopifyOrder.id
    });
const transactionCreateEvent = getShopifyUpdateEvent(_.cloneDeep(transaction), "transaction");
