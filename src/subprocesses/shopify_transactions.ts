import {ProcessCreator, ServiceInstance} from "@nbeyer/pms-process-creator";
import {s3ProjectionPlannedRetentionDate} from "./shopify_orders";
import {S3QueueConfig} from "@nbeyer/pms-mixin-messagebus";
import {addFieldsValidateWebhook} from "../helper/transformations";
import {Delay, DelayInstanceConfiguraiton} from "@nbeyer/pms2-delay";

export function shopify_transactions(pc: ProcessCreator) {

    pc.addInstance(new ServiceInstance<Delay>(Delay, {
        instanceName: "delay-transactions-customerdb",
        mixins: {
            mongodb: {
                uri: process.env.MONGO_DELAY_URI
            }
        }
    } as Omit<DelayInstanceConfiguraiton, "ServiceName">))

    // find order in db
    pc.connectInstance("pms2-shopify-audit", "audit-noop-shopify", {
        type: "SQSQueue",
        transformation: [
            {$match: {
                "pathParameters.proxy": "transaction",
                "httpMethod": "POST",
                "pathParameters.instance": "pms2-shopify-audit"
            }},
            addFieldsValidateWebhook(),
            {$match: {
                _validWebhook: true
            }},
            {$project: {
                transaction: {$json: "$body"}
            }}
        ],
        resultTransformation: {$project: {
            statusCode: {$literal: 200},
            headers: {
                "Content-Type": "application/json"
            },
            body: '{"status": "success"}'
        }}
    })

    // create order path and store to s3
    pc.connectInstance("audit-noop-shopify", null, {
        type: "S3Queue",
        config: {
            Bucket: "beyer.prod.audit.vault",
            Path: "shopify/orders/",
            deleteAfterUse: false
        } as S3QueueConfig,
        transformation: [
            {$match: {
                transaction: {$ne: null}
            }},
            {$addFields: {
                Key: {
                    $concat: [
                        {$substr: ["$transaction.created_at", 0, 4]}, // year
                        "/",
                        {$substr: ["$transaction.created_at", 5, 2]}, // month
                        "/",
                        {$substr: ["$transaction.created_at", 8, 2]}, // day
                        "/",
                        "$transaction.order_id",
                        "/transactions/",
                        "$transaction.id",
                        ".json"
                    ]
                },
                Body: {$base64Encode: {$json: "$transaction"}},
                created_at: "$transaction.created_at",
                Metadata: {
                    transaction_id: {$toString: "$transaction.id"},
                    "order_id": {$toString: "$transaction.order_id"},
                    "shopify_type": "transaction",
                }
            }},
            s3ProjectionPlannedRetentionDate
        ]
    });
}
