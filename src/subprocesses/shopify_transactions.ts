import {ProcessCreator} from "@nbeyer/pms-process-creator";
import {FindMessage} from "@nbeyer/beyer-pms2-customerdb";
import {s3Projection} from "./shopify_orders";
import {S3QueueConfig} from "@nbeyer/pms-mixin-messagebus";
import {addFieldsValidateWebhook} from "../helper/transformations";
import {toAny} from "../../test/helper/helper";

export function shopify_transactions(pc: ProcessCreator) {

    // find order in db
    pc.connectInstance("pms2-shopify-audit", "pms2-customerdb", {
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
            }},
            {$project: {
                type: "FIND",
                collection: "orders",
                query: {
                    id: "$transaction.order_id",
                    pmsSourceName: "beyer-soehne.myshopify.com"
                },
                options: {
                    limit: {$literal: 1},
                    forward: {$literal: true}
                },
                transaction: "$transaction"
            } as toAny<FindMessage>}
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
    pc.connectInstance("pms2-customerdb", null, {
        type: "S3Queue",
        config: {
            Bucket: "beyer.prod.audit.vault",
            Path: "shopify/orders/",
            deleteAfterUse: false
        } as S3QueueConfig,
        transformation: [
            {$match: {
                type: "FOUND",
                transaction: {$ne: null},
                document: {$ne: null}
            }},
            {$addFields: {
                order: "$document"
            }},
            {$addFields: {
                Key: {
                    $concat: [
                        {$substr: ["$order.created_at", 0, 4]}, // year
                        "/",
                        {$substr: ["$order.created_at", 5, 2]}, // month
                        "/",
                        {$substr: ["$order.created_at", 8, 2]}, // day
                        "/",
                        "$order.name",
                        "/transactions/",
                        "$transaction.id",
                        ".json"
                    ]
                },
                Body: {$base64Encode: {$json: "$transaction"}},
                created_at: "$transaction.created_at",
                Metadata: {
                    transaction_id: {$toString: "$transaction.id"},
                }
            }},
            s3Projection
        ]
    });

}
