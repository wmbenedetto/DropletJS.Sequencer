/** @license DropletJS.Sequencer | MIT License | https://github.com/wmbenedetto/DropletJS.Sequencer#mit-license */
if (typeof MINIFIED === 'undefined'){
    MINIFIED = false;
}

/**
 *     ____                   __     __      _______
 *    / __ \_________  ____  / /__  / /_    / / ___/
 *   / / / / ___/ __ \/ __ \/ / _ \/ __/_  / /\__ \
 *  / /_/ / /  / /_/ / /_/ / /  __/ /_/ /_/ /___/ /
 * /_____/_/   \____/ .___/_/\___/\__/\____//____/
 *                 /_/
 *
 * DropletJS.Sequencer : JavaScript Function Sequencer
 *
 * Copyright (c) 2012 Warren Benedetto <warren@transfusionmedia.com>
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the Software
 * is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NON-INFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
(function(window,undefined){

    if (!MINIFIED){

        var logLevels = {
            OFF                             : 0,
            ERROR                           : 1,
            WARN                            : 2,
            INFO                            : 3,
            DEBUG                           : 4
        };

        var logLevel                        = 'OFF';
        var console                         = window.console || {};

        console.log                         = (typeof console.log   === 'function') ? console.log   : function() {};
        console.info                        = (typeof console.info  === 'function') ? console.info  : console.log;
        console.error                       = (typeof console.error === 'function') ? console.error : console.log;
        console.warn                        = (typeof console.warn  === 'function') ? console.warn  : console.log;

        /**
         * Default log() implementation
         *
         * This can be overridden by defining a log() function in the initObj
         * passed to the constructor
         *
         * @param funcName The name of the function generating the log message
         * @param message The message to log
         * @param payload Data object
         * @param level Log level (OFF, ERROR, WARN, INFO, DEBUG)
         */
        var log = function(funcName,message,payload,level) {

            payload                         = (!payload) ? '' : payload;
            level                           = (!level) ? 'INFO' : level.toUpperCase();
            message                         = '[' + funcName + '()] ' + message;

            if (isLoggable(level)) {

                if (level === 'ERROR') {
                    console.error(message,payload);
                } else if (level === 'WARN') {
                    console.warn(message,payload);
                } else if (level === 'INFO') {
                    console.info(message,payload);
                } else {
                    console.log(message,payload);
                }
            }
        };

        /**
         * Checks whether the given level is loggable based on the
         * current log level
         *
         * @param level The level to check
         * @return {Boolean}
         */
        var isLoggable = function(level){

            var currentLogLevel             = logLevels[logLevel];
            var thisLogLevel                = logLevels[level];

            return thisLogLevel <= currentLogLevel;
        };
    }

    /**
     * Add bind() to Function prototype for browsers that don't yet support ECMAScript 5.
     *
     * @see https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Function/bind
     */
    Function.prototype.bind = function(scope) {

        var self                            = this;

        return function() {
            return self.apply(scope,arguments);
        }
    };

    /**
     * Sequencer class constructor
     *
     * Valid options:
     *
     *  - name          : The plain-English name of the sequence, for logging purposes
     *  - logLevel      : The level of logging to output (OFF, ERROR, WARN, INFO, DEBUG)
     *  - steps         : Array of functions to execute in sequence
     *  - onComplete    : Function to call automatically once sequence is complete
     *
     * @constructor
     * @param steps Array of function references to call in sequence
     * @param options Object containing sequence options (name, logLevel, onComplete, onKilled)
     */
    var Sequencer = function Sequencer(steps,options){

        var validLogLevels                  = {OFF : 1,ERROR : 1,WARN: 1,INFO : 1,DEBUG : 1};

        options                             = options || {};
        logLevel                            = (typeof options.logLevel === 'string' && options.logLevel in validLogLevels) ? options.logLevel : logLevel;

        this.completed                      = 0;
        this.killed                         = false;
        this.lastResult                     = [];
        this.name                           = (typeof options.name === 'string') ? options.name : 'unnamed';
        this.onComplete                     = (typeof options.onComplete === 'function') ? options.onComplete : null;
        this.onKilled                       = (typeof options.onKilled === 'function') ? options.onKilled : null;
        this.steps                          = steps || [];
        this.total                          = 0;

        return this;
    };

    /**
     * Sequencer class prototype
     *
     * @type {Object}
     */
    Sequencer.prototype = {

        /**
         * Alias for global log(). Prepends sequence name to funcName.
         *
         * @param funcName The name of the function generating the log message
         * @param message The message to log
         * @param payload Data object
         * @param level Log level (ERROR, WARN, INFO, DEBUG)
         */
        log : function(funcName,message,payload,level){

            if (!MINIFIED){

                funcName                    = (this.name) ? this.name+': DropletJS.Sequencer.'+funcName : 'DropletJS.Sequencer.'+funcName;

                log(funcName,message,payload,level);
            }
        },

        /**
         * Runs sequence
         */
        run : function(){

            var args                        = Array.prototype.slice.call(arguments);

            this.killed                     = false;
            this.total                      = this.steps.length;
            this.completed                  = 0;

            if (this.total > 0){

                if (!MINIFIED){
                    this.log('run','Running '+this.name+' sequence');
                }

                this.next.apply(this,args);
            }
            /* If there are no steps in the sequence, but an onComplete function has been specified, execute it. */
            else if (typeof this.onComplete === 'function'){

                if (!MINIFIED){
                    this.log('run','No steps in '+this.name+' sequence, but onComplete() exists.');
                }

                this.onComplete.apply(this,args);
            }

            return this;
        },

        /**
         * Kills sequence
         */
        kill : function(){

            if (!MINIFIED){
                this.log('kill','Killing '+this.name+' sequence');
            }

            if (this.killed !== true && typeof this.onKilled === 'function'){

                var args                    = Array.prototype.slice.call(arguments);

                this.onKilled.apply(this,args);
            }

            this.killed                     = true;
        },

        /**
         * Executes next step in sequence
         */
        next : function(){

            if (this.killed){

                if (!MINIFIED){
                    this.log('next','The '+this.name+' sequence has been killed, so next step is aborted.');
                }

                return false;
            }

            var args                        = Array.prototype.slice.call(arguments);
            var twoStepsBack                = this.completed-2;

            /* We only want to store the result of the last step, so we can delete
             * the result of the step two steps back (if one was stored) */
            if (typeof this.lastResult[twoStepsBack] !== 'undefined'){

                try {
                    delete this.lastResult[twoStepsBack];
                } catch (e){
                    this.lastResult[twoStepsBack] = undefined;
                }
            }

            if (this.completed === this.total){

                if (!MINIFIED){
                    this.log('next','All steps of '+this.name+' sequence complete');
                }

                if (typeof this.onComplete == 'function'){

                    if (!MINIFIED){
                        this.log('next','Calling '+this.name+' sequence onComplete()');
                    }

                    /* Add this sequence as final argument to onComplete function */
                    args.push(this);

                    this.completed += 1;

                    this.onComplete.apply(this,args);
                }

            } else {

                var nextStep                = this.steps[this.completed];

                this.completed += 1;

                if (!MINIFIED){
                    this.log('next','Executing step ' + this.completed + ' of '+this.total+' of the '+this.name+' sequence', null, 'DEBUG');
                }

                /* If the next step is a Sequencer itself, run it */
                if (nextStep instanceof Sequencer){

                    this.runChildSequence(nextStep,args);
                }
                /* If next step is a function (it should be), execute it */
                else if (typeof nextStep == 'function') {

                    /* Add this sequence as final argument to next function to be called */
                    args.push(this);

                    nextStep.apply(this,args);
                }
                /* If next step isn't a function, output a warning and move on to the next step */
                else {

                    if (!MINIFIED){
                        this.log('next', this.name+' next step is not a function. Moving on ...', { nextStep : nextStep }, 'WARN');
                    }

                    this.next();
                }
            }

            return true;
        },

        /**
         * Runs sequence that has been added as a step in this sequence, redefining
         * its onComplete function so it executes the next step in this sequence once
         * it is complete.
         *
         * @param childSequence The Sequence to run
         * @param args The arguments to pass to the sequence.
         */
        runChildSequence : function(childSequence,args){

            if (!MINIFIED){
                this.log('runChildSequence','Running child sequence: '+childSequence.name);
            }

            var self                            = this;

            if (typeof childSequence.onComplete === 'function'){

                var childSequenceOnComplete     = childSequence.onComplete;

                /* Redefine child sequence's onComplete */
                childSequence.onComplete  = function(){

                    childSequenceOnComplete();  // Call child sequence's original onComplete function
                    self.next.apply(self,args); // Call parent's next() function
                };

            } else {

                childSequence.onComplete = function(){
                    self.next.apply(self,args); // Call parent's next() function
                };
            }

            childSequence.addResult(this.getLastResult());
            childSequence.run.apply(childSequence,args);
        },

        /**
         * Adds step to end of sequence
         *
         * @param step The step (function) to add
         */
        addStep : function(step){

            if (!MINIFIED){
                this.log('addStep','Adding step', { step : step },'DEBUG');
            }

            this.steps.push(step);

            this.total                          = this.steps.length;

            return this;
        },

        /**
         * Adds steps to end of sequence
         *
         * @param steps The steps (functions) to add
         */
        addSteps : function(steps){

            if (!MINIFIED){
                this.log('addSteps','Adding steps', { steps : steps },'DEBUG');
            }

            for (var i=0;i<steps.length;i++){
                this.addStep(steps[i]);
            }

            return this;
        },

        /**
         * Inserts step at current position in sequence
         *
         * @param step The step (function) to insert
         */
        insertStep : function(step){

            if (!MINIFIED){
                this.log('insertStep','Inserting step', { step : step },'DEBUG');
            }

            this.steps.splice(this.completed,0,step);

            this.total                          = this.steps.length;

            return this;
        },

        /**
         * Inserts steps at current position in sequence
         *
         * @param steps Array of steps (functions) to insert
         */
        insertSteps : function(steps){

            if (!MINIFIED){
                this.log('insertSteps','Inserting steps', { steps : steps },'DEBUG');
            }

            steps.reverse();

            for (var i=0;i<steps.length;i++){
                this.insertStep(steps[i]);
            }

            return this;
        },

        /**
         * Stores result of the current step's function. We store this in an array
         * indexed by the step number. This is done so that we can know exactly which
         * step this result belongs to. At the same time, we don't want the overhead
         * of storing the results for all steps, so the lastResult array is reset each
         * time this function is called.
         *
         * @param result The result of the current step's function
         */
        addResult : function(result){

            this.lastResult                     = [];
            this.lastResult[this.completed]     = result;

            return this;
        },

        /**
         * Gets the result of the last step. The result is stored in an array
         * indexed by step number, so we can truly get the result of the last
         * step, not just the last result that was stored.
         */
        getLastResult : function(){

            var lastStepNum                     = (this.completed > this.total) ? this.total : this.completed - 1;

            if (lastStepNum < 0 || typeof this.lastResult[lastStepNum] === 'undefined'){
                return null;
            }

            return this.lastResult[lastStepNum];
        }
    };

    /* If RequireJS define() is present, use it to export Sequencer */
    if (typeof define === "function") {

        define(function() {
            return Sequencer;
        });
    }
    /* Otherwise, add Sequencer to global namespace as DropletJS.Sequencer */
    else {

        window.DropletJS                        = (typeof window.DropletJS === 'object' && window.DropletJS !== 'null') ? window.DropletJS : {};
        window.DropletJS.Sequencer              = Sequencer;
    }

}(window));