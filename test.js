import assert from 'assert/strict';
import { readFile } from 'fs/promises';
import { createServer } from 'http';
import { Readable, Writable } from 'stream';
import { fileURLToPath } from 'url';
import { consume, request, json, buffer, pipe, get, string } from "@dwbinns/http-io";

const server = createServer(async (req, res) => {
    res.statusCode = Number(req.url.slice(1));
    if (req.headers["content-type"]) res.setHeader('Content-Type', req.headers["content-type"]);
    res.setHeader('Location', "/200");
    res.setHeader("X-URL", req.url);
    res.setHeader("X-Method", req.method);
    res.end(await consume(req));
});

const readable = () => new Readable({
    read() {
        this.push(hello);
        this.push(null);
    }
});
const writable = () => new Writable({
    construct(callback) {
        this.buffers = [];
        callback();
    },
    write(chunk, encoding, callback) {
        this.buffers.push(chunk);
        callback();
    }
})

server.listen(8983);

const hello = Buffer.from("hello");

console.log("Test file");
assert.deepEqual(await request(import.meta.url), await readFile(fileURLToPath(import.meta.url)));

console.log("Test GET");
assert.deepEqual(await get("http://localhost:8983/200"), Buffer.alloc(0));

console.log("Test POST json (auto)");
assert.deepEqual(await request("http://localhost:8983/200", { method: 'POST', body: { test: 1 } }), { test: 1 });

console.log("Test POST json (explicit)");
assert.deepEqual(await request("http://localhost:8983/200", { method: 'POST', body: json({ test: 1 }), result: json() }), { test: 1 });

console.log("Test POST string (auto)");
assert.deepEqual(await request("http://localhost:8983/200", { method: 'POST', body: "hi!" }), "hi!");

console.log("Test POST string (explicit)");
assert.deepEqual(await request("http://localhost:8983/200", { method: 'POST', body: string("hi!"), result: string() }), "hi!");

console.log("Test POST buffer (auto)");
assert.deepEqual(await request("http://localhost:8983/200", { method: 'POST', body: hello }), hello);

console.log("Test POST buffer (explicit)");
assert.deepEqual(await request("http://localhost:8983/200", { method: 'POST', body: buffer(hello), result: buffer() }), hello);

console.log("Test POST pipe (auto)");
let output1 = writable();
await request("http://localhost:8983/200", { method: 'POST', body: readable(), result: output1 });
assert.deepEqual(Buffer.concat(output1.buffers), hello);

console.log("Test POST pipe (explicity)");
let output2 = writable();
await request("http://localhost:8983/200", { method: 'POST', body: pipe(readable()), result: pipe(output2) });
assert.deepEqual(Buffer.concat(output2.buffers), hello);

console.log("Test 404");
await assert.rejects(request("http://localhost:8983/404"), { statusCode: 404 });

console.log("Test 307");
assert.deepEqual(await request("http://localhost:8983/307", { result: response => response.headers["x-url"] }), "/200");

console.log("Test 303");
assert.deepEqual(await request("http://localhost:8983/303", { method: "POST", result: response => response.headers["x-method"] }), "GET");

console.log("Test invalid body");
assert.rejects(request("http://localhost:8983/200", { body: 4 }));

server.close();