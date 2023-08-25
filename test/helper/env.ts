export const MONGO = process.env.MONGO_URL ? process.env.MONGO_URL + "/CustomerDbServiceTest" : "mongodb://127.0.0.1/pms2-process-audit-test";
process.env.mongodb = JSON.stringify({uri: MONGO});

process.env.AWS_DEFAULT_REGION = process.env.AWS_DEFAULT_REGION || "eu-west-1";
process.env.ServiceDbEndpoint = "https://api.beyer-soehne.de";

export default {
    MONGO
}