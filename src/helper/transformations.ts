

export function addFieldsValidateWebhook() {
    return {$addFields: {
            hmac: {$hmac: ["$body", "256c77cef0c1227c721d8d7494b1ff4a", "sha256", "base64"]},
            _validWebhook: {
                $eq: [
                    {$hmac: ["$body", "256c77cef0c1227c721d8d7494b1ff4a", "sha256", "base64"]},
                    "$headers.X-Shopify-Hmac-Sha256"
                ]
            },
            bodyStr: 0
        }};
}