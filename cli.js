#!/usr/bin/env node
import { request, json, pipe } from "./index.js";

const [method, url, expression] = process.argv.slice(2);

if (!url) {
    console.log("http-io <method> <url> [<JS expression>]");
    console.log("Will forward stdin to HTTP if not a terminal");
    console.log("If supplied, <expression> will be evaluated on the $ which is set to the parsed JSON response");
    process.exit(1);
}

const body = process.stdin.isTTY ? null : process.stdin;

if (expression) {
    const extract = new Function("$", `return ${expression}`);
    console.log(extract(await request(url, { method, body, result: json() })));
} else {
    await request(url, { method, body, result: pipe(process.stdout) });
}
