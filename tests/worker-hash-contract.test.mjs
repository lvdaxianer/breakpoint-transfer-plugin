import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";

const workerFilePath = path.resolve(
  "/Users/lvdaxianer/workspace/my/project/breakpoint-transfer-plugin/doc/calculateNameWorker.js",
);

const workerSource = await readFile(workerFilePath, "utf8");

let messageHandler = null;
let postedMessage = null;

const context = {
  crypto: globalThis.crypto,
  Uint8Array,
  Array,
  Math,
  Date,
  self: {
    addEventListener(type, handler) {
      if (type === "message") {
        messageHandler = handler;
      }
    },
    postMessage(message) {
      postedMessage = message;
    },
  },
};

vm.runInNewContext(workerSource, context, { filename: workerFilePath });

assert.ok(messageHandler, "worker message handler should be registered");

const buffers = [
  new Uint8Array([1, 2, 3]).buffer,
  new Uint8Array([4, 5, 6]).buffer,
  new Uint8Array([7, 8, 9]).buffer,
];

const fakeFile = {
  name: "demo.bin",
  size: 192 * 1024 * 1024 * 3,
  slice(start) {
    const chunkIndex = Math.floor(start / (192 * 1024 * 1024));
    return {
      async arrayBuffer() {
        return buffers[chunkIndex];
      },
    };
  },
};

await messageHandler({
  data: {
    file: fakeFile,
    flag: "file",
  },
});

const expectedHashBuffer = await crypto.subtle.digest(
  "SHA-256",
  new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9]),
);
const expectedHash = Array.from(new Uint8Array(expectedHashBuffer))
  .map((byte) => byte.toString(16).padStart(2, "0"))
  .join("");

assert.equal(
  postedMessage,
  `${expectedHash}.bin`,
  "worker should hash all chunk buffers in order",
);
