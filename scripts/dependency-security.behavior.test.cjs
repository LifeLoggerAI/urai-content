'use strict';

const assert = require('node:assert/strict');
const { createRequire } = require('node:module');
const { Readable, Writable } = require('node:stream');
const { pipeline } = require('node:stream/promises');
const { test } = require('node:test');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const rootRequire = createRequire(path.join(root, 'tests/rules-emulator/package.json'));
const cliRequire = createRequire(rootRequire.resolve('firebase-tools/package.json'));
const consumers = [
  ['Firebase CLI chokidar', createRequire(cliRequire.resolve('chokidar/package.json'))('braces')],
];

for (const [name, braces] of consumers) {
  test(`${name} retains ordinary glob behavior`, () => {
    assert.deepEqual(braces('src/**/*.{js,ts,tsx}'), ['src/**/*.(js|ts|tsx)']);
    assert.deepEqual(braces.expand('file-{1..3}.txt'), ['file-1.txt', 'file-2.txt', 'file-3.txt']);
    assert.deepEqual(braces.expand('{a,{b,c}}'), ['a', 'b', 'c']);
  });

  test(`${name} bounds string nesting and caller-supplied ASTs`, () => {
    for (const method of ['parse', 'compile', 'expand', 'stringify']) {
      assert.doesNotThrow(() => braces[method]('{'.repeat(128) + 'x' + '}'.repeat(128)));
      assert.throws(() => braces[method]('('.repeat(4000) + 'x' + ')'.repeat(4000)), { name: 'SyntaxError', message: /maximum depth/ });
    }
    for (const method of ['compile', 'expand', 'stringify']) {
      const ast = { type: 'root', nodes: [] };
      let node = ast;
      for (let depth = 0; depth < 4000; depth++) {
        const child = { type: 'paren', parent: node, nodes: [] };
        node.nodes.push(child);
        node = child;
      }
      node.nodes.push({ type: 'text', value: 'x' });
      assert.throws(() => braces[method](ast), { name: 'SyntaxError', message: /maximum depth/ });
    }
  });
}

const Parser = cliRequire('stream-json/Parser');
const Assembler = cliRequire('stream-json/Assembler');
const Verifier = cliRequire('stream-json/utils/Verifier');
const sink = () => new Writable({ objectMode: true, write(_chunk, _encoding, done) { done(); } });

async function assemble(json, options) {
  const assembler = new Assembler(options);
  await pipeline(Readable.from([json]), new Parser(), new Writable({
    objectMode: true,
    write(chunk, _encoding, done) {
      try { assembler.consume(chunk); done(); } catch (error) { done(error); }
    },
  }));
  return assembler.current;
}

for (const reviver of [undefined, (_key, value) => value]) {
  test(`Firebase CLI stream-json preserves dangerous keys as own data properties${reviver ? ' with reviver' : ''}`, async () => {
    const json = '{"__proto__":{"polluted":true},"constructor":{"safe":true},"nested":{"__proto__":{"injected":true}}}';
    const value = await assemble(json, reviver ? { reviver } : undefined);
    assert.deepEqual(value, JSON.parse(json));
    assert.equal(Object.getPrototypeOf(value), Object.prototype);
    assert.equal(Object.getPrototypeOf(value.nested), Object.prototype);
    assert.equal(Object.prototype.polluted, undefined);
    assert.equal(Object.hasOwn(value, '__proto__'), true);
    assert.equal(Object.hasOwn(value.nested, '__proto__'), true);
  });
}

test('Firebase CLI stream-json parser and verifier enforce the fixed depth boundary', async () => {
  const boundary = '['.repeat(128) + '0' + ']'.repeat(128);
  await pipeline(Readable.from([boundary]), new Parser(), sink());
  await pipeline(Readable.from([boundary]), new Verifier());
  const deep = '['.repeat(4000) + '0' + ']'.repeat(4000);
  await assert.rejects(pipeline(Readable.from([deep]), new Parser(), sink()), { name: 'SyntaxError', message: /maximum depth/ });
  await assert.rejects(pipeline(Readable.from([deep]), new Verifier()), { name: 'SyntaxError', message: /maximum depth/ });
});

for (const filterName of ['Pick', 'Ignore', 'Filter', 'Replace']) {
  test(`Firebase CLI stream-json ${filterName} bounds direct token input across pass and skip modes`, async () => {
    const Filter = cliRequire(`stream-json/filters/${filterName}`);
    const tokens = Array.from({ length: 4000 }, () => ({ name: 'startArray' }));
    for (const filter of [() => false, () => true, /never-matches/]) {
      await assert.rejects(pipeline(Readable.from(tokens), new Filter({ filter }), sink()), { name: 'SyntaxError', message: /maximum depth/ });
    }
  });
}

test('Firebase CLI stream-json excludes JSONC comment processing', async () => {
  const jsonc = '/*' + 'x'.repeat(10000) + '*/{}';
  await assert.rejects(pipeline(Readable.from(Array.from(jsonc)), new Parser(), sink()), /cannot parse input/);
  await assert.rejects(pipeline(Readable.from(Array.from(jsonc)), new Verifier()), /expected a value/);
});

test('Firebase CLI keeps compatible CommonJS CSV and patched transport APIs', () => {
  const { parse } = cliRequire('csv-parse/sync');
  assert.deepEqual(parse('name,value\na,1\n', { columns: true }), [{ name: 'a', value: '1' }]);
  const rows = parse('__proto__,value\nowned,1\n', { columns: true });
  assert.equal(Object.getPrototypeOf(rows[0]), Object.prototype);
  assert.equal(rows[0].value, '1');
  const getUriRequire = createRequire(cliRequire.resolve('get-uri/package.json'));
  const { Client } = getUriRequire('basic-ftp');
  const ftp = new Client();
  for (const method of ['access', 'lastMod', 'list', 'downloadTo', 'close']) assert.equal(typeof ftp[method], 'function');
  ftp.close();
});

test('Installed Content tooling binds the exact CLI and reviewed local mitigation identities', () => {
  assert.equal(rootRequire('firebase-tools/package.json').version, '15.24.0');
  assert.equal(cliRequire('braces/package.json').version, '3.0.3-urai.1');
  assert.equal(cliRequire('stream-json/package.json').version, '1.9.1-urai.1');
});
