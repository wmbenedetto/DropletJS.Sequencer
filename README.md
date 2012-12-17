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
```

As you can see, `doSecond` has a 2-second timeout in it. If you were to run those three functions without Sequencer, 
you'd end up with `doThird` executing before `doSecond` had finished its timeout callback.

By using Sequencer, the sequence doesn't move forward until `next()` is called. Therefore, execution is essentially paused until `doSecond` is finished what it needs to do.

Once `doSecond` is done its work (in this case, finished its timeout), it calls `next()`, and the sequence can now continue on to `doThird`.
