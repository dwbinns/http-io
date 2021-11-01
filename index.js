import http from "http";
import https from "https";
import { once } from "events";
import { readFile } from "fs/promises";
import { pipeline } from "stream/promises";

export const consume = async stream => {
    let blocks = [];
    for await (let block of stream) blocks.push(block);
    return Buffer.concat(blocks);
}

const withContentType = (request, contentType) => {
    if (!request.getHeader('Content-Type')) {
        request.setHeader('Content-Type', contentType);
    }
    return request;
}

export const buffer = content =>
    async (message, isRequest) =>
        isRequest
            ? withContentType(message, "application/octet-stream").end(content)
            : await consume(message);

export const string = content =>
    async (message, isRequest) =>
        isRequest
            ? withContentType(message, "text/plain").end(content)
            : (await consume(message)).toString("utf8");

export const pipe = (stream, { end } = {}) =>
    async (message, isRequest) =>
        isRequest
            ? await pipeline(stream, withContentType(message, "application/octet-stream"))
            : await once(message.pipe(stream, { end }), 'unpipe')

export const json = content =>
    async (message, isRequest) =>
        isRequest
            ? withContentType(message, "application/json").end(JSON.stringify(content))
            : JSON.parse(await consume(message));

export const auto = content =>
    async (message, isRequest) => {
        if (isRequest) {
            let requestHandler = null;
            if (!content) requestHandler = () => message.end();
            else if (typeof content == "function") requestHandler = content;
            else if (typeof content.pipe == "function") requestHandler = pipe(content);
            else if (Buffer.isBuffer(content)) requestHandler = buffer(content);
            else if (typeof content == "string") requestHandler = string(content);
            else if (typeof content == "object") requestHandler = json(content);

            if (requestHandler) requestHandler(message, true);
            else throw new Error("Not sure what to with request body");
        } else {
            let responseHandler = {
                "application/json": json(),
                "text/plain": string(),
            }[message.headers["content-type"]] || buffer();
            return await responseHandler(message, false);
        }
    };



export const request = async (url, { body, result = auto(), ...options } = {}) => {
    let parsedUrl = new URL(url);
    let protocolName = parsedUrl.protocol.slice(0, -1);
    if (protocolName == "file") {
        return await readFile(parsedUrl);
    }
    let httpRequest = { http, https }[protocolName].request(parsedUrl, options);
    let [[httpResponse]] = await Promise.all([
        once(httpRequest, "response"),
        auto(body)(httpRequest, true)
    ]);
    if (httpResponse.statusCode >= 400) {
        let error = new Error(`HTTP status: ${httpResponse.statusCode}`);
        error.statusCode = httpResponse.statusCode;
        error.body = (await consume(httpResponse)).toString();
        throw error;
    }
    if (httpResponse.statusCode >= 300) {
        let method = httpResponse.statusCode == 303 ? "GET" : options.method;
        return await request(new URL(httpResponse.headers["location"], url), { ...options, body, result, method });
    }
    if (typeof result == "function") {
        return await result(httpResponse, false);
    }
    if (typeof result.pipe == "function") {
        return await pipeline(httpResponse, result);
    }
};

export const get = (url, options) =>
    request(url, { method: "GET", ...options });
