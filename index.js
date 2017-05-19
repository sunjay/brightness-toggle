#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path')

const promiseify = require('just-promiseify');
const brightness = require('brightness');

const readFile = promiseify(fs.readFile)
const writeFile = promiseify(fs.writeFile)

const prevLevelFile = path.join(__dirname, '.brightness-level');

// Under this level, the brightness may as well be off
const OFF_THRESHOLD = 0.05;

brightness.get().then((currentLevel) => {
  return readFile(prevLevelFile).then((data) => {
    return parseFloat(data);
  }).catch(() => {
    // if no brightness is stored, just try to make an educated guess
    return 0;
  }).then((nextLevel) => {
    // Want the command to always toggle, never loop from on to on or off to off
    if (currentLevel <= OFF_THRESHOLD && nextLevel <= OFF_THRESHOLD) {
      // Turn the display on
      nextLevel = 0.7;
    }
    else if (currentLevel > OFF_THRESHOLD && nextLevel > OFF_THRESHOLD || nextLevel <= OFF_THRESHOLD) {
      // Turn the display off
      nextLevel = 0.0;
    }
    return brightness.set(nextLevel).then(() => {
      return writeFile(prevLevelFile, `${currentLevel}\n`);
    }).catch((err) => {
      console.error(`Failed to set brightness: ${err}`);
      process.exit(1);
    });
  });
}).catch((err) => {
  throw err;
});
