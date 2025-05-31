/*
* Event
* Visit http://createjs.com/ for documentation, updates and examples.
*
* Copyright (c) 2010 gskinner.com, inc.
* 
* Permission is hereby granted, free of charge, to any person
* obtaining a copy of this software and associated documentation
* files (the "Software"), to deal in the Software without
* restriction, including without limitation the rights to use,
* copy, modify, merge, publish, distribute, sublicense, and/or sell
* copies of the Software, and to permit persons to whom the
* Software is furnished to do so, subject to the following
* conditions:
* 
* The above copyright notice and this permission notice shall be
* included in all copies or substantial portions of the Software.
* 
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
* EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
* OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
* NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
* HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
* WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
* FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
* OTHER DEALINGS IN THE SOFTWARE.
*/

// namespace:
window["qlib"] = window.qlib || {};

(function() {

/**
 * Represents a basic event dispatched by an object.
 * Event instances are passed as parameters to event listeners when an event occurs.
 * This class is a fundamental part of the event handling mechanism in qlib,
 * often used in conjunction with `qlib.EventDispatcher`.
 *
 * For example, `qlib.DisplayObject` instances might dispatch `Event` objects (or subclasses of `Event`)
 * for interactions like clicks or mouse movements.
 *
 * While this base `Event` class includes `EventDispatcher` methods through a mixin,
 * `Event` instances themselves are typically not used to dispatch further events.
 * Rather, they are data objects that carry information about an occurrence.
 *
 * @class Event
 * @constructor
 * @param {string} type - The type of the event (e.g., "click", "complete"). This string is used to identify the event.
 * @param {Object} target - The object that dispatched the event. This is often the `this` reference from the dispatcher.
 * @see qlib.EventDispatcher
 * @see qlib.DisplayObject
 */
var Event = function(type, target) {
  this.initialize(type, target);
}
var p = Event.prototype;

// properties:

	/**
	 * The type of the event (e.g., "click", "complete").
	 * This string is used to identify the specific event that occurred.
	 * @property {string} type
	 **/
	p.type = null;

	
	/**
	 * The object that dispatched the event.
	 * This is the source of the event, often an instance of a class that uses `qlib.EventDispatcher`.
	 * For example, if a `DisplayObject` dispatches an event, `target` would be that `DisplayObject`.
	 * @property {Object} target
	 * @default null
	*/
	p.target = null;

	
	
// mix-ins:
	// EventDispatcher methods are mixed in, but typically not used on Event instances themselves.
	// These are more relevant for classes that *dispatch* events.
	p.addEventListener = null;
	p.removeEventListener = null;
	p.removeAllEventListeners = null;
	p.dispatchEvent = null;
	p.hasEventListener = null;
	p._listeners = null;
	qlib.EventDispatcher.initialize(p); // inject EventDispatcher methods.

// constructor:
	/**
	 * Initializes the Event instance with the specified type and target.
	 * This method is called by the constructor.
	 * @method initialize
	 * @protected
	 * @param {string} type - The type of the event.
	 * @param {Object} target - The object that dispatched the event.
	 * @returns {void}
	 **/
	p.initialize = function(type, target) {
		this.type = type;
		this.target = target;
		
	}

// public methods:
	/**
	 * Creates and returns a new Event instance that is a shallow copy of this event object.
	 * The `target` property is a direct reference copy, not a deep clone.
	 *
	 * @method clone
	 * @return {qlib.Event} A new Event instance with the same `type` and `target` as this one.
	 **/
	p.clone = function() {
		return new qlib.Event(this.type, this.target);
	}

	/**
	 * Returns a string representation of this Event object.
	 * Format: "[Event (type=EVENT_TYPE)]"
	 *
	 * @method toString
	 * @return {string} A string representation of the Event instance.
	 **/
	p.toString = function() {
		return "[Event (type="+this.type+")]";
	}

	qlib["Event"] = Event;
}());