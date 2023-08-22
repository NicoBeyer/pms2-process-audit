

export function addFieldsValidateWebhook() {
    return {$addFields: {
            hmac: {$hmac: ["$body", process.env.SHOPIFY_API_SECRET, "sha256", "base64"]},
            _validWebhook: {
                $eq: [
                    {$hmac: ["$body", process.env.SHOPIFY_API_SECRET, "sha256", "base64"]},
                    "$headers.X-Shopify-Hmac-Sha256"
                ]
            },
            bodyStr: 0
        }};
}