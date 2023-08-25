import {ProcessCreator, ServiceInstance} from "@nbeyer/pms-process-creator";
import {Delay, DelayInstanceConfiguraiton} from "@nbeyer/pms2-delay";
import {Noop} from "@nbeyer/pms-noop";
import {ApiCallMessage} from "@nbeyer/pms2-shopify/lib/src/model/messages/input/ApiCall";
import {InputDelayMessage} from "@nbeyer/pms2-delay/lib/src/model/messages/Input/InputDelayMessage";
import {toAny} from "../../test/helper/helper";

export function webhook_reset(pc: ProcessCreator) {

    /**
     * Delay Loop to trigger a check every 3 hours
     */
    pc.addInstance(new ServiceInstance<Delay>(Delay, {
        instanceName: "delay-webhook-check",
        mixins: {
            mongodb: {
                uri: process.env.MONGO_DELAY_URI
            }
        }
    } as Omit<DelayInstanceConfiguraiton, "ServiceName">))
    .connectInstance("delay-webhook-check", "delay-webhook-check", {
        type: "SQSQueue",
        transformation: [
            {$match: {
                "webhook-reset-step": "webhook-check"
            }},
            {$project: {
                message: {
                    "webhook-reset-step": "webhook-check"
                },
                filter: {
                    "webhook-reset-step": "webhook-check"
                },
                delay: {$literal: 60 * 60 * 3}
            } as toAny<InputDelayMessage>}
        ]
    })
    .addInstance(new ServiceInstance<Noop>(Noop, {
        instanceName: "audit-webhook-reset-noop",
    }))
    .connectInstance("delay-webhook-check", "audit-webhook-reset-noop", {
        type: "SQSQueue",
        transformation: [
            {$match: {
                "webhook-reset-step": "webhook-check"
            }}
        ]
    })
    /**
     * Check webhooks and reset
     */
    .connectInstance("audit-webhook-reset-noop", "pms2-shopify", {
        type: "SQSQueue",
        transformation: [
            {$match: {
                "webhook-reset-step": "webhook-check"
            }},
            {$project: {
                "webhook-reset-step": "webhook-check",
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
                "webhook-reset-step": "webhook-check",
                "result.webhooks": {$ne: null}
            }},
            {$addFields: {
                hasWebhook: {$reduce: {
                    input: "$result.webhooks",
                    initialValue: false,
                    in: {
                        $or: ["$$value", {
                            $and: [
                                {$eq: ["$$this.address", "https://api.beyer-soehne.de/pms2-events/pms2-shopify-audit/order"]},
                                {$eq: ["$$this.topic", "orders/updated"]},
                            ]
                        }]
                    }
                }}
            }},
            {$match: {
                hasWebhook: false
            }},
            {$project: {
                "webhook-reset-step": "webhook-create",
                type: "ApiCall",
                method: "post",
                path: "webhooks.json",
                body: {
                    webhook: {
                        topic: "orders/updated",
                        address: "https://api.beyer-soehne.de/pms2-events/pms2-shopify-audit/order",
                        format: "json"
                    }
                }
            } as Partial<ApiCallMessage>}
        ]
    })
    .connectInstance("pms2-shopify", "pms2-shopify", {
        type: "SQSQueue",
        transformation: [
            {$match: {
                    "webhook-reset-step": "webhook-check",
                    "result.webhooks": {$ne: null}
                }},
            {$addFields: {
                    hasWebhook: {$reduce: {
                            input: "$result.webhooks",
                            initialValue: false,
                            in: {
                                $or: ["$$value", {
                                    $and: [
                                        {$eq: ["$$this.address", "https://api.beyer-soehne.de/pms2-events/pms2-shopify-audit/transaction"]},
                                        {$eq: ["$$this.topic", "order_transactions/create"]},
                                    ]
                                }]
                            }
                        }}
                }},
            {$match: {
                hasWebhook: false
            }},
            {$project: {
                    "webhook-reset-step": "webhook-create",
                    type: "ApiCall",
                    method: "post",
                    path: "webhooks.json",
                    body: {
                        webhook: {
                            topic: "order_transactions/create",
                            address: "https://api.beyer-soehne.de/pms2-events/pms2-shopify-audit/transaction",
                            format: "json"
                        }
                    }
                } as Partial<ApiCallMessage>}
        ]
    });

}
