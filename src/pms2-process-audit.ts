import {ProcessCreator, ServiceInstance} from "@nbeyer/pms-process-creator";
import {Event} from "@nbeyer/pms-event";
import {Shopify} from "@nbeyer/pms2-shopify";
import {MessageBusInstanceConfiguration} from "@nbeyer/pms-mixin-messagebus";
import {shopify_orders} from "./subprocesses/shopify_orders";

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
        token: "ade58603bc1953b4e4a887f647848d68",
        api_secret: "687c555cbadf46d39c52b7079da5e53f",
        api_key: "93fd7e535faa71c788b33ab67ebbc397",
        scope: "write_orders,write_products,write_customers",
        version: "2023-04"
    }
}));

shopify_orders(pc);





