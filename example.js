import { request, pipe, string, buffer, json } from "@dwbinns/http-io";

console.log(await request("https://httpbin.org/get"));

await request("https://httpbin.org/post", {
  method: "POST",
  result: pipe(process.stdout),
  body: "Hello World!",
});

console.log(await request("https://httpbin.org/post", {
  method: "POST",
  result: string(),
  body: string("Hello World!"),
}));

console.log(await request("https://httpbin.org/post", {
  method: "POST",
  result: buffer(),
  body: buffer(Buffer.from("hello!")),
}));

console.log(await request("https://httpbin.org/post", {
  method: "POST",
  result: json(),
  body: json({ message: "Hello World!" }),
}));

