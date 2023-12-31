import {ProcessCreator, ServiceInstance} from "@nbeyer/pms-process-creator";
import {S3Message, S3QueueConfig} from "@nbeyer/pms-mixin-messagebus";
import {Noop} from "@nbeyer/pms-noop";
import {addFieldsValidateWebhook} from "../helper/transformations";

type ToAny<T> = {
    [K in keyof T]: any;
};

export function shopify_orders(pc: ProcessCreator) {
    pc.addInstance(new ServiceInstance<Noop>(Noop, {instanceName: "audit-noop-shopify"}))
    pc.connectInstance("pms2-shopify-audit", "audit-noop-shopify", {
        type: "SQSQueue",
        transformation: [
            {$match: {
                "pathParameters.proxy": "order",
                "httpMethod": "POST",
                "pathParameters.instance": "pms2-shopify-audit"
            }},
            addFieldsValidateWebhook(),
            {$match: {
                _validWebhook: true
            }},
            {$project: {
                order: {$json: "$body"}
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
    pc.connectInstance("audit-noop-shopify", null, {
        type: "S3Queue",
        config: {
            Bucket: "beyer.prod.audit.vault",
            Path: "shopify/orders/",
            deleteAfterUse: false
        } as S3QueueConfig,
        transformation: [
            {$match: {
                order: {$ne: null},
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
                        "$order.id",
                        "/",
                        "$order.name",
                        ".json"
                    ]
                },
                Body: {$base64Encode: {$json: "$order"}},
                created_at: "$order.created_at",

                Metadata: {
                    "order_id": {$toString: "$order.id"},
                    shopify_type: "order",
                }
            }},
            s3ProjectionPlannedRetentionDate
        ]
    }, "OrderUpdate Step 1: Validate Webhook and encrypt private data.");
}

export const s3ProjectionPlannedRetentionDate =
    {$project: {
        del: 1,
        Key: "$Key",
        Body: "$Body",
        ContentType: "application/json",
        Metadata: {$mergeObjects:["$Metadata", {
            "plannedRetentionDate": {$concat: [
                {$toString: {
                    $add: [11,
                        {$year: {$dateFromString: {
                            dateString: "$created_at"
                        }}}
                    ]}
                },
                "-01-01"
            ]}
        }]}
    } as ToAny<S3Message>};

