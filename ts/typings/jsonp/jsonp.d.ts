
declare module _JSONP {
    export function jsonp(
        url: string,
        opts: {
            param?: string;
            timeout?: number;
            prefix?: string;
            name?: string;
        },
        fn: (err: Error, data: any) => void
    ): void;
}

declare module "jsonp" {
    export = _JSONP.jsonp;
}
