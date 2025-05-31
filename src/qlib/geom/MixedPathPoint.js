/**
* MixedPath Point
*
* Copyright (c) 2013 Mario Klingemann
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
 * Represents a point within a `qlib.MixedPath`.
 * It extends `qlib.Vector2` and adds a flag to distinguish between
 * anchor points (vertices of the path) and control points (used for Bezier curves).
 *
 * @class MixedPathPoint
 * @extends qlib.Vector2
 * @memberof qlib
 * @constructor
 * @param {qlib.Vector2} point - The `qlib.Vector2` instance whose coordinates will be used for this point.
 *                               The x and y values are copied.
 * @param {boolean} [isControlPoint=false] - True if this point is a control point, false if it's an anchor point.
 */
var MixedPathPoint = function( point, isControlPoint ) {
  this.initialize( point, isControlPoint );
}

var p = MixedPathPoint.prototype = new qlib.Vector2();

// public properties:
	/**
	 * The type of this object.
	 * @property {string} type
	 * @default "MixedPathPoint"
	 */
	p.type = "MixedPathPoint";
	
	/**
	 * Flag indicating whether this point is a control point (true) or an anchor point (false).
	 * Anchor points define the main vertices of the path segments, while control points
	 * influence the curvature of Bezier segments.
	 * @property {boolean} isControlPoint
	 * @default false
	 */
	p.isControlPoint = false;

	
	// constructor:
	/** 
	 * Initialization method called by the constructor.
	 * Sets the x and y coordinates from the provided `point` object and the `isControlPoint` flag.
	 * Calls the superclass (`qlib.Vector2`) initialize method.
	 * @method initialize
	 * @protected
	 * @param {qlib.Vector2} point - The `qlib.Vector2` to copy coordinates from.
	 * @param {boolean} [isControlPoint=false] - Whether this point is a control point.
	 * @returns {void}
	*/
	p.initialize = function( point, isControlPoint )
	{
		// Call superclass initialize. Vector2's initialize can take a Vector2 as its first arg in an array.
		qlib.Vector2.prototype.initialize.call(this, [point]);
		this.isControlPoint = isControlPoint || false;
	}
	
	/**
	 * Returns a string representation of this MixedPathPoint.
	 * Format: "x|y" for anchor points, "x|y|c" for control points.
	 * @method toString
	 * @return {string} A string representation of the instance.
	 **/
	p.toString = function() {
		return this.x + "|" + this.y + ( this.isControlPoint ? "|c":"" );
	}
	
	qlib["MixedPathPoint"] = MixedPathPoint;
}());