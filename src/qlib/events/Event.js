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
 * This is passed as the parameter to mousedown, mouseup, mousemove, stagemouseup, stagemousedown, mouseover, mouseout
 * and click events on {{#crossLink "DisplayObject"}}{{/crossLink}} instances.
 * @class Event
 * @uses EventDispatcher
 * @constructor
 * @param {String} type The event type.
 *
 **/
var Event = function(type, target) {
  this.initialize(type, target);
}
var p = Event.prototype;

// events:

	

	/**
	 * The type of mouse event. This will be the same as the handler it maps to (onPress,
	 * onMouseDown, onMouseUp, onMouseMove, or onClick).
	 * @property type
	 * @type String
	 **/
	p.type = null;

	
	/**
	 * The display object this event relates to.
	 * @property target
	 * @type DisplayObject
	 * @default null
	*/
	p.target = null;

	
	
// mix-ins:
	// EventDispatcher methods:
	p.addEventListener = null;
	p.removeEventListener = null;
	p.removeAllEventListeners = null;
	p.dispatchEvent = null;
	p.hasEventListener = null;
	p._listeners = null;
	qlib.EventDispatcher.initialize(p); // inject EventDispatcher methods.

// constructor:
	/**
	 * Initialization method.
	 * @method initialize
	 * @protected
	 **/
	p.initialize = function(type, target) {
		this.type = type;
		this.target = target;
		
	}

// public methods:
	/**
	 * Returns a clone of the Event instance.
	 * @method clone
	 * @return {Event} a clone of the Event instance.
	 **/
	p.clone = function() {
		return new Event(this.type, this.target);
	}

	/**
	 * Returns a string representation of this object.
	 * @method toString
	 * @return {String} a string representation of the instance.
	 **/
	p.toString = function() {
		return "[Event (type="+this.type+")]";
	}

	qlib["Event"] = Event;
}());