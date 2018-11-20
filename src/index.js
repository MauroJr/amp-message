'use strict';

const fmt = require('util').format;
const amp = require('@bitbybit/amp');
const fastJson = require('fast-json-stringify');

module.exports = createMessage;

/**
 * Initialize an AMP message with the
 * given `args` or message buffer.
 *
 * @param {array | Buffer} payload or blob
 * @api public
 */
function createMessage(payload = []) {
  if (Buffer.isBuffer(payload)) {
    payload = decode(payload);
  }

  const message = {
    push,
    pop,
    shift,
    unshift,
    toBuffer,
    inspect
  };

  function push(...args) {
    payload.push(...args);
    return message;
  }

  function pop() {
    payload.pop();
    return message;
  }

  function shift() {
    payload.shift();
    return message;
  }

  function unshift() {
    payload.unshift();
    return message;
  }

  /**
   * Return an encoded AMP message.
   *
   * @return {Buffer}
   * @api public
   */
  function toBuffer() {
    return encode(payload);
  }

  /**
   * Inspect the message.
   *
   * @return {String}
   * @api public
   */
  function inspect() {
    return fmt('<Message args=%d size=%d>', payload.length, toBuffer().length);
  }
}

/**
 * Decode `msg` and unpack all args.
 *
 * @param {Buffer} msg
 * @return {Array}
 * @api private
 */
function decode(msg) {
  const args = amp.decode(msg);
  const argsLen = args.length;

  let index = 0;
  while (index < argsLen) {
    args[index] = unpack(args[index]);
    index += 1;
  }

  return args;
}

/**
 * Unpack `arg`.
 *
 * @param {string | Buffer} payload
 * @return {Mixed}
 * @api private
 */
function unpack(payload) {
  // json
  if (isJSON(payload)) return JSON.parse(payload.slice(2));

  // string
  if (isString(payload)) return payload.slice(2).toString();

  // blob
  return payload;
}

/**
 * Encode and pack all `args`.
 *
 * @param {Array} args
 * @return {Buffer}
 * @api private
 */
function encode(args = []) {
  const argsLen = args.length;
  const packed = new Array(argsLen);

  let index = 0;
  while (index < argsLen) {
    packed[index] = pack(args[index]);
    index += 1;
  }

  return amp.encode(packed);
}

/**
 * Pack `arg`.
 *
 * @param {Buffer | string | undefined} arg
 * @param {Object} [schema]
 * @return {Buffer}
 * @api private
 */
function pack(payload, schema) {
  // blob
  if (Buffer.isBuffer(payload)) return payload;

  // string
  if (typeof payload === 'string') return Buffer.from(`s:${payload}`);

  // undefined
  if (payload === undefined) payload = null;

  // json
  if (schema) {
    const stringify = fastJson(schema);
    return Buffer.from(`j:${stringify(payload)}`);
  }

  return Buffer.from(`j:${JSON.stringify(payload)}`);
}

/**
 * String argument.
 */
function isString(arg) {
  return arg[0] === 115 && arg[1] === 58;
}

/**
 * JSON argument.
 */
function isJSON(arg) {
  return arg[0] === 106 && arg[1] === 58;
}
