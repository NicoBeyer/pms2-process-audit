import {ProcessCreator, ServiceInstance} from "@nbeyer/pms-process-creator";
import {Delay} from "@nbeyer/pms2-delay";
import {Noop} from "@nbeyer/pms-noop";
import {ApiCallMessage} from "@nbeyer/pms2-shopify/lib/src/model/messages/input/ApiCall";

export function webhook_reset(pc: ProcessCreator) {

    pc.addInstance(new ServiceInstance<Delay>(Delay, {
        instanceName: "audit-webhook-reset",
    }))
    .addInstance(new ServiceInstance<Noop>(Noop, {
        instanceName: "audit-webhook-reset-noop",
    }))
    .connectInstance("audit-webhook-reset", "audit-webhook-reset-noop", {
        type: "SQSQueue",
        transformation: [
            {$match: {
                "type": "webhook-check"
            }},
            {$project: {
                "type": ""
            }}
        ]
    })
    .connectInstance("audit-webhook-reset-noop", "pms2-shopify", {
        type: "SQSQueue",
        transformation: [
            {$match: {
                "type": "webhook-check"
            }},
            {$project: {
                type: "ApiCall",
                method: "get",
                path: "webhooks.json",
            } as Partial<ApiCallMessage>}
        ]
    })
    .connectInstance("pms2-shopify", "pms2-shopify", {
        type: "SQSQueue",
        transformation: [
            {$match: {
                webhooks: {$ne: null}
            }},
            {$addFields: {
                hasWebhook: {$reduce: {
                    input: "$webhooks",
                    initialValue: false,
                    in: {
                        $or: ["$$value", {
                            $and: [
                                {$eq: ["$$this.address", "https://api.beyer-soehne.de/pms2-events/pms2-shopify-audit/order"]},
                                {$eq: ["$$this.topic", "orders/update"]},
                            ]
                        }]
                    }
                }}
            }},
            {$match: {
                hasWebhook: false
            }},
            {$project: {
                type: "ApiCall",
                method: "post",
                path: "webhooks.json",
                body: {
                    webhook: {
                        topic: "orders/update",
                        address: "https://api.beyer-soehne.de/pms2-events/pms2-shopify-audit/order",
                        format: "json"
                    }
                }
            } as Partial<ApiCallMessage>}
        ]
    })

}
