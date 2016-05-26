Node.js Imports and Exports
---

## Overview

In this lesson, we're going to talk about how Node.js importing and exporting works. Just like Ruby, Node.js gives you a `require` function, and Node.js's `require` has a few tricks up its sleeve.

To understand how `require` works, you'll also need to understand how exports work in Node.js. By the end of this lesson, you'll be able to

1. Import modules from the Node.js standard library
2. Write your own modules
3. Import your modules for use in an application

This lesson is a code-along — by the end, you'll have a working command-line application that colorizes its output. If you need to check something, a complete solution is in the `learn-lib` directory.

## `util.inspect` the unexpected

In `lib/index.js`, enter the following:

```javascript
const util = require('util');

console.log(util);
```

BOOM! You just `require`d your first module! Now if you enter `node lib`, you should see a list of the `util` module's top-level properties. Let's talk about that call to `require`.

NOTE: You can also enter `node lib/index.js`, but Node.js knows to look for an `index.js` file and execute that if you pass it a directory name.

Before we dive into what `require` is doing in the above, let's create another file by entering `touch lib/interface.js`. Add the following few lines to `lib/interface.js`:

```javascript
function getUserArguments() {
    return process.argv.slice(2);
}

console.log(getUserArguments());
```

Head on back to your command line and enter something like

```bash
node lib/interface.js the quick brown fox
```

You should see `['the', 'quick', 'brown', 'fox']` in your terminal if you entered the above. How does that work? `process.argv` is an array of arguments passed to the `node` process. `process.argv[0]` is the absolute path to the `node` executable, `process.argv[1]` is the absolute path to the current module (!), and any subsequent indices in `process.argv` point to arguments that the user has passed in (where each argument is delimited by a space).

Let's change the contents of `lib/interface.js` so that we can use that function elsewhere.

``` javascript
module.exports = function getUserArguments() {
    return process.argv.slice(2);
};
```

Whoa whoa whoa, where is this `module` coming from and what is it `exports`ing? `module` comes from [here](https://github.com/nodejs/node-v0.x-archive/blob/master/lib/module.js). Don't sweat it if that code seems a little incomprehensible. The important thing to know is that in Node.js, all files are modules (but not all modules are files, as we'll soon see).

Now fire up your REPL (just enter `node` in your terminal), and enter the following:

``` javascript
const interface = require('./lib/interface');
```

Notice any differences between the call to `require` here and the call to `require` above? For one, we're passing a relative path this time; above, we just passed the name of the module. What's going on?

## The Room of `require`ment

Node.js's `require` has a few tricks up its sleeve for finding modules. When it's called, it first checks whether its argument is a relative path or not. If it's _not_ a relative path — as in `require('util')` above — then Node.js looks for a `node_modules` folder, starting in the current directory and working through parent directories in order. If it find such a folder (we'll talk more about this folder in the next lesson), and if that folder contains a module by the given name, then we're done and we get that module.

If Node.js strikes out on this hunt (it will look all the way up the chain to globally installed modules), then it searches its standard library. In the case of `'util'`, it find the module that we're looking for there.

If the argument to `require` _is_ a relative path (as is the case with `./lib/interface`), then Node.js will only check that location. If it finds a module there, great! It evaluates the module's code and returns its exports; if not, it throws an error.

## `module.exports`

So what are these `exports`, anyway? Every file in Node.js, when it's evaluated, has at its disposal the `module` global and the `exports` global (among others). To start, `module.exports` and `exports` both refer to the same empty object. When the module is imported, it makes these `exports` available to the module that `require`d it (or to the REPL). So you can overwrite `module.exports` in its entirety (like we do above) or you can assign properties to the `exports` object (more on that later).

So when you `const interface = require('./lib/interface');` in the REPL, you're assigning the `exports` of the `./lib/interface` module to the variable `interface`. If you enter `interface` in the REPL, you'll see:

``` javascript
[Function: getUserArguments]
```

So now we have the `getUserArguments()` function from `./lib/interface` available as `interface` in our REPL! Try calling it; you should see `[]`.

## Inspector gadget

One of the handy utilities that `util` provides is inspection through [`util.inspect()`](https://nodejs.org/api/util.html#util_util_inspect_object_options). Let's use our `./lib/interface` module and `util.inspect()` to build a simple command-line utility that lets us look up a module's properties on the fly. We'll have to change `./lib/index.js`:

``` javascript
const interface = require('./interface');
const util = require('util');

const userArgs = interface();
const moduleName = userArgs[0];

if (userArgs.length > 1) {
  console.warn('Warning: you provided more than one argument.');
}

try {
  const moduleToInspect = require(moduleName);

  console.log(util.inspect(moduleToInspect, { colors: true }));
} catch (error) {
  console.error(`Unable to inspect module ${moduleName}.`);
  console.error(`Reason: ${error.message});
  exit(1);
}
```

Just like above, we `require` `./lib/interface` using a relative path — we use `./interface` because relative requires are _relative to the file doing the require_. In other words, since `index.js` and `interface.js` are in the same directory, we just say, "Look in this directory `./` for this file `interface.js`."

Next, we call `interface` and take the first item out of the array that it returns. If the user has passed more than one argument, we issue a warning. (This process is a good candidate for refactoring!) Then, we `try` to `require` a module of the name that they've passed in. If we succeed, we print the module's `exports` to console (and we colorize it!); if we fail, we tell the user what went wrong and exit with an error. Try it!

(Confused by that stuff in backticks? These are called "[template literals](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals)." They work essentially like string interpolation in Ruby (`"See? It's #{interpolated}"`), just with a slightly different syntax. They're a new feature in [ECMAScript 6](https://en.wikipedia.org/wiki/ECMAScript#6th_Edition) that Node.js just made available by default. No more `"concatenating " + variables + " into strings!"`)


``` bash
# print the `fs` module's properties!
node lib fs

# fail!
node lib poop

# Note: If, for some reason, you have installed the node module
# `poop` (https://www.npmjs.com/package/poop) globally, this will
# not fail. You'll have to try something else.

# !!!
node lib ./interface.js
```

We did it! We can call this on pretty much any module to print its properties to stdout.

## Refactor

There's a bit of ugliness in our code. Currently, we're discarding all but the first user argument in the main file of our little library; but we should really be doing that where we're handling _all_ of the user arguments, in `interface.js`. Let's get to work.

``` javascript
// lib/interface.js

module.exports = function getUserArgument() {
  const userArgs = process.argv.slice(2);

  if (userArgs.length > 1) {
    console.warn(`Warning: you provided more than one argument.`);
  }

  return userArgs[0];
};
```

We've just moved our warning to `interface.js` and made sure that `getUserArguments()` only returns a string. Since it just returns one thing, let's go ahead and rename it to `getUserArgument()`.

Now for `index.js`:

``` javascript
const interface = require('./interface');
const util = require('util');

const moduleName = interface();

try {
  const moduleToInspect = require(moduleName);

  console.log(util.inspect(moduleToInspect, { colors: true }));
} catch (error) {
  console.error(`Unable to inspect module ${moduleName}.`);
  console.error(`Reason: ${error.message}`);
}
```

We don't have to do any argument trimming here, and even though we renamed the function in `interface.js`, we don't have to rename anything here since the function is the `exports` object of the `interfaces.js` module. Code separation FTW!

## Review

Whew. We covered quite a bit in this lesson, but you've now built a nice little inspector and learned a lot about modules and `require` in Node.js.

Check out the resources below for further reading.

## Resources

- Node.js modules: https://nodejs.org/api/modules.html
- The `util` module: https://nodejs.org/api/util.html
- Template literals: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals
