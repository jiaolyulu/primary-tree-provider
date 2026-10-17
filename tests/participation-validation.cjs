const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vm = require('node:vm');
const compiled = ts.transpileModule(fs.readFileSync('lib/participation-validation.ts', 'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
const sandbox = {exports:{}};
vm.runInNewContext(compiled, sandbox);
const parse = sandbox.exports.parseTreeSubmission;
const valid = {id:'12345678-1234-4234-8234-123456789abc',tree:' Ginkgo ',city:' Brooklyn ',place:'',story:'Bright yellow leaves every autumn.',name:'',consent:true};
assert.equal(parse(valid).tree, 'Ginkgo');
assert.equal(parse(valid).name, '');
for (const value of [null, [], {...valid,consent:false}, {...valid,consent:'true'}, {...valid,tree:' '}, {...valid,city:''}, {...valid,story:''}, {...valid,story:'a'.repeat(501)}, {...valid,id:'not-a-uuid'}, {...valid,name:42}]) assert.throws(() => parse(value));
assert.equal(parse({...valid,story:'<script>alert(1)</script>'}).story, '<script>alert(1)</script>'); // rendered as React text, not HTML
console.log('Participation validation: 12 checks passed');
