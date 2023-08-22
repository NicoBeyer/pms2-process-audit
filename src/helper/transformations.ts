

export function addFieldsValidateWebhook() {
    return {$addFields: {
            hmac: {$hmac: ["$body", "687c555cbadf46d39c52b7079da5e53f", "sha256", "base64"]},
            _validWebhook: {
                $eq: [
                    {$hmac: ["$body", "687c555cbadf46d39c52b7079da5e53f", "sha256", "base64"]},
                    "$headers.X-Shopify-Hmac-Sha256"
                ]
            },
            bodyStr: 0
        }};
}