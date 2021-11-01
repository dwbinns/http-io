# Node.js HTTP request library

Throws errors for 4xx and 5xx responses, handles redirects, encodes and decodes JSON and binary data into buffers.

## Command line usage

```sh
npm install -g @dwbinns/http-io
http-io GET https://httpbin.org/get
```

## Make HTTP requests from JavaScript

```sh
npm install @dwbinns/http-io
```

Import the module. Require (commonjs) is not supported.

```js
import { request, pipe, string, buffer, json } from "@dwbinns/http-io";
```

Without supplying any result handler, the library will returned parsed JSON, a string or a buffer depending on the content-type header.

```js
console.log(await request("https://httpbin.org/get"));
```

Supplying a result handler to pipe the output to a writable stream, and supply a body

```js
await request("https://httpbin.org/post", {
  method: "POST",
  result: pipe(process.stdout),
  body: "Hello World!",
});
```

Apart from result and body, options are as specified by http.request in Node.js, see https://nodejs.org/dist/latest/docs/api/http.html#httprequestoptions-callback

Result and body handlers are available for JSON, strings and buffers:

```js
console.log(await request("https://httpbin.org/get"));

await request("https://httpbin.org/post", {
  method: "POST",
  result: pipe(process.stdout),
  body: "Hello World!",
});

console.log(
  await request("https://httpbin.org/post", {
    method: "POST",
    result: string(),
    body: string("Hello World!"),
  })
);

console.log(
  await request("https://httpbin.org/post", {
    method: "POST",
    result: buffer(),
    body: buffer(Buffer.from("hello!")),
  })
);

console.log(
  await request("https://httpbin.org/post", {
    method: "POST",
    result: json(),
    body: json({ message: "Hello World!" }),
  })
);
```
