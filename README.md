DropletJS.Sequencer
==================

DropletJS.Sequencer executes JavaScript functions in a specified order, waiting for one to finish before executing the next.

## Introduction

One of the great things about JavaScript is its asynchronous nature. Except when you actually *want* things to be synchronous.

Why would you want that?

Say you need to fetch content from a web service via AJAX. You need to wait for the service to return the content before you render it with your client-side templating engine. And you need the template engine to finish rendering before you add content to the DOM. And you need content added to the DOM before you can attach handlers to elements in the page. And you need handlers attached to the page elements before you display it to the user.

Or maybe you have a complex series of animations, each of which needs to finish before the next one begins. Fade this out, then slide this up, then expand that, then fade those other things in.

Can you do all that without Sequencer? Sure, if you like tightly coupled code that's isn't modular or reusable. You can just load up your code with callbacks, conditionals, and nested functions until it's a tangled, unmaintainable mess.

But you shouldn't.

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
```

Notice that each function in the sequence is passed a `seq` argument, which is an instance of the sequence. Inside each function, we call `seq.next()`. That's what tells Sequencer that the function's work is done, and the next function should be executed.

The `seq` argument is always passed as the last argument. So, if you have functions that already have other arguments coming in, `seq` will come after those. For example:

```javascript

var doFirst = function(arg1, arg2, seq){
    
    // do stuff with arg1 and arg2 ...
    
    seq.next();
}
```
