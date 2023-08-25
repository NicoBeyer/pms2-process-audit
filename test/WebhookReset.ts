import {pc} from "../src/pms2-process-audit";
import {assert} from "chai";
import _ = require("lodash");
import {InputDelayMessage} from "@nbeyer/pms2-delay/lib/src/model/messages/Input/InputDelayMessage";
import {fakeClock} from "./helper/FakeClock";
import {ServiceInstance} from "@nbeyer/pms-process-creator";
import {Noop} from "@nbeyer/pms-noop";
import {DB} from "@nbeyer/beyer-pms2-customerdb";
import * as ENV from "./helper/env";

process.env.AWS_DEFAULT_REGION = process.env.AWS_DEFAULT_REGION || "eu-west-1";
process.env.TRACE = "";
describe("WebhookReset", async function () {

    it("getWebhooks", async function () {

        const shopify = pc.getInstance("pms2-shopify");
        const noop = pc.getInstance("noop-unittest");

        shopify.sendMessage({
            "webhook-reset-step": "webhook-check",
            type: "ApiCall",
            method: "get",
            path: "webhooks.json",
        });

        await shopify.testRun();

        const msgs = noop.getReceivedMessages();

        for (const msg of msgs as any[]) {
            assert.isTrue(_.isArray(msg.result.webhook) || _.isArray(msg.result.webhooks));
        }

    });

    it("triggers Webhook Check every 3 hours", async function () {

        const delay = pc.getInstance("delay-webhook-check");
        const noop = pc.getInstance("audit-webhook-reset-noop");

        delay.sendMessage({
            message: {
                "webhook-reset-step": "webhook-check"
            },
            filter: {
                "webhook-reset-step": "webhook-check"
            },
            delay: 60 * 60 * 3
        } as InputDelayMessage);

        /**
         * 0 Hours
         */
        fakeClock.set(new Date());

        await delay.testRun();

        let msgs = noop.getReceivedMessages();
        assert.isEmpty(msgs);

        let checks = 0;
        let hour = 0;
        for (let i = 1; i < 10; i++) {
            fakeClock.advance(60 * 60 + 1);
            hour += 1;

            await delay.testRun();

            if (i % 3 === 0) {
                msgs = noop.getReceivedMessages();
                assert.lengthOf(msgs, 1);
                assert.deepEqual(msgs[0], {
                    'webhook-reset-step': 'webhook-check',
                    _pmsProcessNamespace: 'pms2-process-audit'
                });

                await delay.testRun();
                await noop.testRun()
                checks++;
            } else {
                msgs = noop.getReceivedMessages();
                assert.isEmpty(msgs);
            }
        }

        assert.equal(checks, 3);

    });

    before(async function () {
        pc.addInstance(new ServiceInstance<Noop>(Noop, {
            instanceName: "noop-unittest"
        }))
        .connectInstance("pms2-shopify", "noop-unittest", {
            type: "SQSQueue"
        })

        await DB.connect(ENV.MONGO);
        await DB.disconnect();
    });

    afterEach(async function () {
        pc.pmsMock.AWS.resetAll();
        pc.endTest();
    });

    beforeEach(async function () {
        await pc.startTest();
    });

});