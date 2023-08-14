import * as traverse from "traverse";

export function datesToString(obj: Record<string, unknown>) {

    return traverse(obj).map(x => {
        if (x instanceof Date) {
            return x.toJSON()
        } else {
            return x;
        }
    })

}

