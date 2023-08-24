import {ProcessCreator, ServiceInstance} from "@nbeyer/pms-process-creator";
import {Event} from "@nbeyer/pms-event";
import {Shopify} from "@nbeyer/pms2-shopify";
import {MessageBusInstanceConfiguration} from "@nbeyer/pms-mixin-messagebus";
import {shopify_orders} from "./subprocesses/shopify_orders";
import {webhook_reset} from "./subprocesses/webhook_reset";

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
        process: "pms2-process-shopify"
    }
}));

shopify_orders(pc);
webhook_reset(pc);





