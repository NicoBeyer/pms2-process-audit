import * as traverse from "traverse";

export function updateKeys(mapping: Record<string, unknown>, key: string) {
    let properKey = key.charAt(key.length - 1) === "." ? key : key + ".";
    return traverse(mapping).map(function(v) {
        if (this.isLeaf && typeof v === "string" && !v.startsWith("$$")) {
            return v.replace("$", ("$" + properKey)).replace(/\.+$/g, "");
        } else {
            return v;
        }
    });
}

export function toDate(key: string) {
    return {$cond: [{$ne: [key,null]},{$dateFromString: {dateString: key}}, null]};
}
