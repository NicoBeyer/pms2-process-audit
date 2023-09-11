import {assert} from "chai";
import {pc} from "../../src/pms2-process-audit";
import {Event} from "@nbeyer/pms-event";
import {Noop} from "@nbeyer/pms-noop";
import * as _ from "lodash";
import * as fs from "fs";

describe("OrderEvent", async function () {

    it("test", async function () {
        this.timeout() && this.timeout(10000);
        await pc.startTest();
        pc.defaultContext.invokedFunctionArn = "arn:aws:lambda:eu-west-1:12345678910:function:";

        const orderUpdateEvent = JSON.parse(fs.readFileSync("./test/debug/data/20230911_orderEvent.json", "utf8").toString());

        const event = pc.getInstance<Event>("pms2-shopify-audit");
        const noop = pc.getInstance<Noop>("audit-noop-shopify");

        const validEvent = _.cloneDeep(orderUpdateEvent);

        await event.testRun(validEvent);

        const msgs = noop.getReceivedMessages();
        assert.lengthOf(noop.getReceivedMessages(), 1);

        await pc.endTest();
    });

    before(async function() {

    });

    after(async function () {

    });

    beforeEach(async function () {

    });

});