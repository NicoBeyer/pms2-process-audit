import {ProcessCreator, ServiceInstance} from "@nbeyer/pms-process-creator";
import {Event} from "@nbeyer/pms-event";
import {Shopify} from "@nbeyer/pms2-shopify";
import {MessageBusInstanceConfiguration} from "@nbeyer/pms-mixin-messagebus";
import {shopify_orders} from "./subprocesses/shopify_orders";
import {webhook_reset} from "./subprocesses/webhook_reset";
import {CustomerDb} from "@nbeyer/beyer-pms2-customerdb";
import {shopify_transactions} from "./subprocesses/shopify_transactions";

export const pc = new ProcessCreator({name: "pms2-process-audit"});
pc.setErrorQueue()
.addInstance(new ServiceInstance<Event>(Event, {
    executedByPms: true,
    instanceName: "pms2-shopify-audit"
} as MessageBusInstanceConfiguration))
.addInstance(new ServiceInstance<Shopify>(Shopify, {
    instanceName: "pms2-shopify",
    shopifyConfig: {
        shop_name: "beyer-soehne",
        token: process.env.SHOPIFY_TOKEN,
        api_secret: process.env.SHOPIFY_API_SECRET,
        api_key: process.env.SHOPIFY_API_KEY,
        scope: "write_orders,write_products,write_customers",
        version: "2023-07"
    },
    owner: {
        processName: "pms2-process-shopify",
    }
}))
.addInstance(new ServiceInstance<CustomerDb>(CustomerDb, {
    instanceName: "pms2-customerdb",
    mixins: {
        messagebus: {
            in: {
                "type" : "SQSQueue",
                "name" : "pms2-process-shopify_pms2-customerdb",
                "config" : {
                    "QueueUrl" : "pms2-process-shopify_pms2-customerdb"
                }
            },
            stopConsumeOnError: true,
            concurrentNumber: 20
        }
    },
    owner: {
        processName: "pms2-process-shopify",
    }
}));

shopify_orders(pc);
shopify_transactions(pc);
webhook_reset(pc);





