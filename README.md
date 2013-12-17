DropletJS.Sequencer
==================

DropletJS.Sequencer executes JavaScript functions in a specified order, waiting for one to finish before executing the next.

## Introduction

One of the great things about JavaScript is its asynchronous nature. Except when you actually *want* things to be synchronous.

Why would you want that?

Say you need to fetch content from a web service via AJAX. You need to wait for the service to return the content before you render it with your client-side templating engine. And you need the template engine to finish rendering before you add content to the DOM. And you need content added to the DOM before you can attach handlers to elements in the page. And you need handlers attached to the page elements before you display it to the user.

Or maybe you have a complex series of animations, each of which needs to finish before the next one begins. Fade this out, then slide this up, then expand that, then fade those other things in.

Can you do all that without Sequencer? Sure, if you like tightly coupled code that isn't modular or reusable. You can just load up your code with callbacks, conditionals, and nested functions until it's a tangled, unmaintainable mess.

But you shouldn't.

## Quick install

DropletJS.Sequencer is available via a number of popular package managers:

###NPM

```
npm install dropletjs.sequencer
```

###JamJS
```
jam install DropletJS.Sequencer
```

###Bower
```
bower install DropletJS.Sequencer
```

Or you can download the latest tag from https://github.com/wmbenedetto/DropletJS.Sequencer/tags

## Examples

If you really want to see Sequencer in action, visit http://demos.wmbenedetto.com/DropletJS.Sequencer/examples/

Or you can download the latest tag (or clone this repo) and open examples/index.html in a browser (preferably Chrome or Firefox with Firebug installed). 

Either way, you'll find a ton of explanations with live code samples that you can run. The docs below explain a lot, but they're not as good as seeing it actually working.

## The basics

The easiest way to use Sequencer is to pass an array of functions to the constructor, then call `run()`.

```javascript
var doFirst = function(seq){
    console.log('First');
    seq.next();
};

var doSecond = function(seq){
    console.log('Second');
    seq.next();
};

var doThird = function(seq){
    console.log('Third');
    seq.next();
};

var sequence = new DropletJS.Sequencer([doFirst,doSecond,doThird]).run();

// RESULT:
// First
// Second
// Third
```

Notice that each function in the sequence is passed a `seq` argument, which is an instance of the sequence. Inside each function, we call `seq.next()`. That's what tells Sequencer that the function's work is done, and the next function should be executed.

The `seq` argument is always passed as the last argument. So, if you have functions that already have other arguments coming in, `seq` will come after those. For example:

```javascript

var doFirst = function(arg1, arg2, seq){
    
    // do stuff with arg1 and arg2 ...
    
    seq.next();
}
```
---
### Waiting for an asynchronous function

In the example above, there's really nothing special about Sequencer. You could just call those three functions without Sequencer, and they would work exactly the same.

Where Sequencer becomes important is when one or more of the functions in the sequence have an asynchronous element.

For example, look at `doSecond` in the example below:

```javascript
var doFirst = function(seq){
    console.log('First');
    seq.next();
};

var doSecond = function(seq){
    console.log('Waiting 2 seconds ...');
    
    setTimeout(function(){
        console.log('Second');
        seq.next();
    }.bind(this), 2000);
};

var doThird = function(seq){
    console.log('Third');
    seq.next();
};

var sequence = new DropletJS.Sequencer([doFirst,doSecond,doThird]).run();

// RESULT:
// First
// Waiting 2 seconds ...
// Second
// Third
```

As you can see, `doSecond` has a 2-second timeout in it. If you were to run those three functions without Sequencer, 
you'd end up with `doThird` executing before `doSecond` had finished its timeout callback.

By using Sequencer, the sequence doesn't move forward until `next()` is called. Therefore, execution is essentially paused until `doSecond` is finished what it needs to do.

Once `doSecond` is done its work (in this case, finished its timeout), it calls `next()`, and the sequence can now continue on to `doThird`.

---
### An important note about scope

All the examples in this README use global functions, so passing function references to Sequencer is simple: they are just passed by name: 

```javascript
var sequence = new DropletJS.Sequencer([doFirst,doSecond,doThird]).run();
```
However, if your functions aren't global -- like if they are properties of an object -- then you'll need to use `bind()` to preserve their scope.

```javascript
var functions = {
    doFirst : function(seq){
        console.log('First');
        seq.next();
    },

    doSecond : function(seq){
        console.log('Second');
        seq.next();
    },

    doThird : function(seq){
        console.log('Third');
        seq.next();
    }
};

var steps = [
    functions.doFirst.bind(functions),
    functions.doSecond.bind(functions),
    functions.doThird.bind(functions)
];

var sequence = new DropletJS.Sequencer(steps).run();

// RESULT:
// First
// Second
// Third
```

## Advanced usage

### Debugging and logging

If you want to see exactly what Sequencer is doing under the hood, you can turn on console logging and set log levels by passing an options hash to the constructor as a second argument. 

**Logging is only available in the non-minified version of Sequencer. (It is stripped out of the minified version to reduce file size.)**

Setting the `name` option will prepend the name of the sequence to any log messages, which is useful if you're debugging multiple sequences in a page.

Setting the `logLevel` option will control how many and what type of log messages are output. Valid values are:
* `OFF` Turn off all debug logging
* `ERROR` Only output errors
* `WARN` Output errors and warnings
* `INFO` Output errors, warnings, and informational messages.
* `DEBUG` Output all possible log messages

```javascript
var options = {
    name        : 'Example',
    logLevel    : 'DEBUG'
};

var seq = new DropletJS.Sequencer([doFirst, doSecond, doThird],options).run();
```
---
### Executing a function once the sequence is complete

If you want to execute a function once all steps of your sequence are complete, you can pass an `onComplete` function as part of the options hash.

```javascript
var options = {
    onComplete : function(){
        console.log('DONE!');
    }
};

var seq = new DropletJS.Sequencer([doFirst, doSecond, doThird],options).run();

// RESULT:
// First
// Waiting 2 seconds ...
// Second
// Third
// DONE!
```
---
### Killing a sequence before it is complete

Sometimes while a sequence is running, something happens that makes you want to stop the sequence before it completes. For example, an AJAX request for a resource fails, and the rest of the sequence cannot run without that resource.

To kill a sequence, simply call the `kill()` method on the sequence instance.

To execute a function when a sequence is killed, you can pass an `onKilled` function as part of the options hash.

In the example below, a timeout is set to kill the sequence after 1 second. Since `doSecond()` has a two-second timeout, the sequence will be killed before that timeout fires.

```javascript
var options = {
    onKilled : function(){
        console.log('KILLED!!');
    }
};

var seq = new DropletJS.Sequencer([doFirst, doSecond, doThird],options).run();

var killTimeout = setTimeout(function(){
    seq.kill();
},1000);

// RESULT:
// First
// Waiting 2 seconds ...
// KILLED!
// Second
```
---
### Adding functions one at a time instead of all at once

There may be cases where you want to build up a sequence one step at a time instead of passing an array of functions to the constructor. You can do this by passing a function to the `addStep()` function, or an array of functions to the `addSteps()` function.

Functions added using `addStep()` or `addSteps()` are added to the end of the sequence.

```javascript
var seq = new DropletJS.Sequencer();

seq.addStep(doFirst);

// Do some stuff ...

seq.addSteps([doSecond, doThird]);

// Do some more stuff ...

seq.run();

// RESULT:
// First
// Waiting 2 seconds ...
// Second
// Third
```
---
### Passing values between functions in a sequence

Sometimes you need to pass a value between functions in a sequence.

To pass a value to the first function in the sequence, you can pass it as an argument (or arguments) to the `run()` function.

You can continue passing values along the sequence by passing them as arguments to the `next()` function.

Arguments passed to `next()` in the last function of the sequence will be passed to the `onComplete()` function (if defined).

Of course, in all cases, the functions need to be prepared to accept and use those arguments.

**PROTIP:** To avoid tightly coupling functions together, write your functions to accept a single data object as the lone argument.

In the example below, a data object has a `counter` property. The data object is passed to `run()`. Each function then increments the counter and passes the data object to `next()`. At the end, the data object ends up in `onComplete`.

```javascript
var doFirst = function(data,seq){
    data.counter++;
    console.log('First:',data.counter);
    seq.next(data);
};

var doSecond = function(data,seq){
    data.counter++;
    console.log('Second',data.counter);
    seq.next(data);
};

var doThird = function(data,seq){
    data.counter++;
    console.log('Third',data.counter);
    seq.next(data);
};

var options = {
    onComplete : function(data){
        data.counter++;
        console.log('onComplete:',data.counter);
    }
};

var data = {
    counter : 0
};

var sequence = new DropletJS.Sequencer([doFirst,doSecond,doThird],options).run(data);

// RESULT:
// First: 1
// Second: 2
// Third: 3
// onComplete: 4
```
---
### Retrieving results from the previous function in the sequence

Because at least some of the functions in a sequence are likely asynchronous, we can't rely on the function `return` to pass results from one function to another.

We also may be using functions with arguments that we don't want to (or can't) modify due to some other external dependency, so we may not be able to pass data between functions like in the previous example.

In this case, we can use the `addResult()` function to add the results of a function to the sequence, and `getLastResult()` to retrieve the results of the previous function in the sequence.

```javascript
var doFirst = function(seq){
    console.log('First.');
    seq.addResult('foo');
    seq.next();
};

var doSecond = function(seq){
    console.log('Second. The result of the first function was: '+seq.getLastResult());
    seq.addResult('bar');
    seq.next();
};

var doThird = function(seq){
    console.log('Third. The result of the second function was: '+seq.getLastResult());
    seq.addResult('baz');
    seq.next();
};

var options = {
    onComplete : function(seq){
        console.log('onComplete. The result of the third function was: '+seq.getLastResult());
    }
};

var sequence = new DropletJS.Sequencer([doFirst,doSecond,doThird],options).run();

// RESULT:
// First.
// Second. The result of the first function was: foo 
// Third. The result of the second function was: bar 
// onComplete. The result of the third function was: baz 
```
---
### Nesting sequences

In addition to functions, steps in a sequence can also be other sequences. In other words, you can have a sequence of sequences.

```javascript
var doFirst = function(seq){
    console.log('First');
    seq.next();
};

var doSecond = function(seq){
    console.log('Second');
    seq.next();
};

var doThird = function(seq){
    console.log('Third');
    seq.next();
};

var sequence1 = new DropletJS.Sequencer([doFirst,doSecond,doThird]);
var sequence2 = new DropletJS.Sequencer([doThird,doSecond,doFirst]);
var nestedSeq = new DropletJS.Sequencer([sequence1,sequence2]).run();

// RESULT:
// First
// Second
// Third
// Third
// Second
// First
```
---
### Modifying a sequence on-the-fly

Sometimes, you may need to modify a sequence while it is running. For example, you may want to add additional steps based on the results of some function in the sequence. There are two ways to do this:

To add a function to the end of the sequence, you can add pass it to `addStep()`.

To add multiple functions to the end of a sequence, you can pass them in an array to `addSteps()`.

```javascript
var doFirst = function(seq){
    console.log('First');
    seq.addStep(doFirstAdded);
    seq.next();
};

var doSecond = function(seq){
    console.log('Second');
    seq.addSteps([doSecondAdded,doThirdAdded]);
    seq.next();
};

var doThird = function(seq){
    console.log('Third');
    seq.next();
};

var doFirstAdded = function(seq){
    console.log('Added #1');
    seq.next();
};

var doSecondAdded = function(seq){
    console.log('Added #2');
    seq.next();
};

var doThirdAdded = function(seq){
    console.log('Added #3');
    seq.next();
};

var sequence = new DropletJS.Sequencer([doFirst,doSecond,doThird]).run();

// RESULT:
// First
// Second
// Third
// Added #1
// Added #2
// Added #3
```

You can also insert a single function into the sequence passing it to `insertStep()`, or multiple functions by passing them in an array to `insertSteps()`. 

This will insert the function(s) as the next in the sequence, with the rest of the sequence continuing in order after the inserted step(s).

```javascript
var doFirst = function(seq){
    console.log('First');
    seq.insertStep(doFirstInserted);
    seq.next();
};

var doSecond = function(seq){
    console.log('Second');
    seq.insertSteps([doSecondInserted,doThirdInserted]);
    seq.next();
};

var doThird = function(seq){
    console.log('Third');
    seq.next();
};

var doFirstInserted = function(seq){
    console.log('Inserted #1');
    seq.next();
};

var doSecondInserted = function(seq){
    console.log('Inserted #2');
    seq.next();
};

var doThirdInserted = function(seq){
    console.log('Inserted #3');
    seq.next();
};

var sequence = new DropletJS.Sequencer([doFirst,doSecond,doThird]).run();

// RESULT:
// First
// Inserted #1
// Second
// Inserted #2
// Inserted #3
// Third
```

## FAQ

#### My sequence stalled. What happened?

Make sure all of the functions are receiving `seq` as an argument, and are calling `seq.next()` when they are done.

---

#### Why are my functions executing before I even call `run()`?

Make sure you are only passing function references to Sequencer, and not actually calling the functions. 

In other words, you should only be using function names, without parentheses after them.

```javascript
// Right. Just function names, no parentheses.
var sequence = new DropletJS.Sequencer([doFirst,doSecond,doThird]).run();

// Wrong. Notice the parentheses after each function.
var sequence = new DropletJS.Sequencer([doFirst(),doSecond(),doThird()]).run();
```

---
#### For some reason, `this` in my functions now refers to the Sequence instance. Why?

You probably need to use `bind()` when creating your sequence. See [An important note about scope] (https://github.com/wmbenedetto/DropletJS.Sequencer#an-important-note-about-scope).

---
#### Why didn't `kill()` kill my function when I called it?

`kill` will kill the sequence, but it can't kill a function that is already running. 

So if you have, for example, a `setTimeout` inside your function, and you call `kill()` after that that `setTimeout` has already been called, the `setTimeout` callback will fire no matter what. 

However, *the next function in your sequence* will not run once `kill()` has been called.

## Questions? Bugs? Suggestions?

Please submit all bugs, questions, and suggestions via the [Issues](https://github.com/wmbenedetto/DropletJS.Sequencer/issues) section so everyone can benefit from the answer.

If you need to contact me directly, email warren@transfusionmedia.com.

## MIT License

Copyright (c) 2012 Warren Benedetto <warren@transfusionmedia.com>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
