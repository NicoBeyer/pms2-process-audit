import {pc} from "./pms2-process-audit";

process.env.ServiceDbEndpoint = process.env.ServiceDbEndpoint || "https://mvj08xzxrd.execute-api.eu-west-1.amazonaws.com:8244/prod";

pc.commit().then(proc => {
    console.log("Commit: Success");
    console.log(JSON.stringify(proc, null, 3));
}).catch(err => {
    setTimeout(function() { throw err; });
});
