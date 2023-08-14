import {ProcessCreator} from "@nbeyer/pms-process-creator";

export function processOrders(pc: ProcessCreator) {
    pc.connectInstance("pms2-shopify-webhook", "pms2-crypto", {
        type: "SQSQueue",
        transformation: [],
        resultTransformation: {$project: {
            statusCode: {$literal: 200},
            headers: {
                "Content-Type": "application/json"
            },
            body: '{"status": "success"}'
        }}
    }, "OrderUpdate Step 1: Validate Webhook and encrypt private data.");
}
