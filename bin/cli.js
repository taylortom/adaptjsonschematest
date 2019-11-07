#!/usr/bin/env node
const fs = require('fs');
const Module = require('module');
// const moduleAlias = require('module-alias');
const path = require('path');

const { input, command } = getInput();
const options = getOptions();
const env = process.env;

processEnv();
loadScript();
/**
* Sorts the input, extracts the command
*/
function getInput() {
  const input = process.argv.slice(2).sort((a,b) => {
    if(a[0] !== '-') return -1;
    if(b[0] !== '-') return 1;
  });
  return { input, command: input.shift() };
}
/*
* Store any valid params
* - Must be prefixed with --
* - Can also have a value (i.e. --test=true)
*/
function getOptions() {
  const o = {};
  input.forEach(i => {
    if(i.slice(0,2) !== '--') return; // we don't deal with unknown params
    const [option,value] = i.slice(2).split('=');
    o[option] = value || true;
  });
  return o;
}
/**
* Makes sure the NODE_ENV is set, and any options are stored in the process.env with an aat_ prefix
*/
function processEnv() {
  process.env.NODE_ENV = env.NODE_ENV || 'dev';
  console.log(`Running the application with '${env.NODE_ENV}' environment`);
  Object.entries(options).forEach(([key,val]) => process.env[`aat_${key}`] = val);
  modifyModulePaths();
}

function modifyModulePaths() {
  try {
    const localModsPath = require(path.resolve(process.cwd(), `conf`, `${env.NODE_ENV}.config.js`)).app.local_modules_path;
    const localMods = fs.readdirSync(localModsPath).filter(d => d[0] !== '.' && fs.statSync(path.join(localModsPath,d)).isDirectory());
    const nodeModsPath = path.join(process.cwd(), 'node_modules');

    const _resolve = Module._resolveFilename;

    Module._resolveFilename = function(file, m, ...args) {
      const nI = m.path.lastIndexOf('node_modules');
      if(nI === -1) {
        return _resolve.call(this, file, m, ...args);
      }
      const relativePath = m.path.slice(nI+12+path.sep.length);
      const modName = relativePath.split(path.sep)[0];

      if(!localMods.includes(modName)) {
        return _resolve.call(this, file, m, ...args);
      }
      const localPath = _resolve.call(this, file, m, ...args).replace(nodeModsPath, localModsPath);
      console.log(localPath);
      try {
        fs.accessSync(localPath);
        return localPath;
      } catch(e) {
        return _resolve.call(this, file, m, ...args);
      }
    };
    console.log(`Using Adapt modules in ${localModsPath}`);
  } catch(e) {} // no config, but no problem
}
/**
* Tries to load the relevant script
*/
function loadScript() {
  console.log();
  try {
    require(`./${command}`);
  } catch(e) {
    console.trace(e);
    console.log(`Unknown command '${command}', use the -h flag for help`);
  }
}
