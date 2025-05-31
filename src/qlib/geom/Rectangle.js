/*
* Rectangle
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
 * Represents a rectangle defined by its top-left corner coordinates (x, y) and its width and height.
 * Provides methods for geometric operations like scaling, union, intersection, and point queries.
 * Inherits from `qlib.GeometricShape`.
 *
 * @class Rectangle
 * @extends qlib.GeometricShape
 * @memberof qlib
 * @constructor
 * @param {number} [x=0] - The x-coordinate of the top-left corner.
 * @param {number} [y=0] - The y-coordinate of the top-left corner.
 * @param {number} [width=0] - The width of the rectangle.
 * @param {number} [height=0] - The height of the rectangle.
 */
var Rectangle = function( x, y, width, height ) {
  this.initialize( x, y, width, height );
}

var p = Rectangle.prototype = new qlib.GeometricShape();

// public properties:
	/**
	 * The type of this geometric shape.
	 * @property {string} type
	 * @default "Rectangle"
	 */
	p.type = "Rectangle";
	
	/**
	 * The x-coordinate of the top-left corner of the rectangle.
	 * @property {number} x
	 * @default 0
	 */
	p.x = 0;
	/**
	 * The y-coordinate of the top-left corner of the rectangle.
	 * @property {number} y
	 * @default 0
	 */
	p.y = 0;
	/**
	 * The width of the rectangle. After `fixValues()`, this will be non-negative.
	 * @property {number} width
	 * @default 0
	 */
	p.width = 0;
	/**
	 * The height of the rectangle. After `fixValues()`, this will be non-negative.
	 * @property {number} height
	 * @default 0
	 */
	p.height = 0;

	
	// constructor:
	/** 
	 * Initialization method called by the constructor.
	 * Sets the x, y, width, and height of the rectangle.
	 * Calls `fixValues()` to ensure width and height are non-negative.
	 * @method initialize
	 * @protected
	 * @param {number} [x=0] - The x-coordinate of the top-left corner.
	 * @param {number} [y=0] - The y-coordinate of the top-left corner.
	 * @param {number} [width=0] - The width of the rectangle.
	 * @param {number} [height=0] - The height of the rectangle.
	 * @returns {void}
	*/
	p.initialize = function( x, y, width, height ) {
		this.x = (x == null ? 0 : x);
		this.y = (y == null ? 0 : y);
		this.width = (width == null ? 0 : width);
		this.height = (height == null ? 0 : height);
		this.fixValues();
	}
	
	/**
	 * Ensures that the width and height of the rectangle are non-negative.
	 * If width or height is negative, it adjusts `x` or `y` accordingly to maintain the
	 * same geometric area while making width/height positive.
	 * @method fixValues
	 * @protected
	 * @returns {void}
	 */
	p.fixValues = function () 
	{
		if ( this.width < 0 )
		{
			this.x += this.width; // e.g. x=10, width=-5 => new x=5
			this.width *= -1;     // new width=5
		}
		if ( this.height < 0 )
		{
			this.y += this.height;
			this.height *= -1;
		}
	}
	
	/**
	 * Scales the rectangle by the given factors.
	 * If a `center` point is provided, scaling is performed relative to that point.
	 * Otherwise, scaling is relative to the rectangle's current center.
	 * Modifies this rectangle in place.
	 * @method scale
	 * @param {number} factorX - The scaling factor for the x-axis.
	 * @param {number} factorY - The scaling factor for the y-axis.
	 * @param {qlib.Vector2} [center] - Optional center point for scaling. Defaults to the rectangle's center.
	 * @returns {this} This Rectangle instance for chaining.
	 */
	p.scale = function( factorX, factorY, center )
	{
		if ( center == null ) center = new qlib.Vector2( this.x + this.width * 0.5, this.y + this.height * 0.5);
		var newXY = new qlib.Vector2( this.x, this.y).minus( center ).multiplyXY( factorX, factorY ).plus( center );
		this.x = newXY.x;
		this.y = newXY.y;
		this.width *= factorX;
		this.height *= factorY;
		this.fixValues(); // Ensure width/height remain positive if factors were negative
		return this;
	}
	
	/**
	 * Computes the union of this rectangle and another rectangle.
	 * The union is the smallest rectangle that contains both input rectangles.
	 * @method union
	 * @param {qlib.Rectangle} rect - The other rectangle to form a union with.
	 * @returns {qlib.Rectangle} A new `qlib.Rectangle` instance representing the union.
	 *                            Returns a clone of the non-empty rectangle if one of them is empty.
	 */
	p.union = function( rect )
	{
		if ( this.width == 0 || this.height == 0 )
		{
			return rect.clone();
		}
		if ( rect.width == 0 || rect.height == 0 )
		{
			return this.clone();
		}
		// Ensure both rectangles have positive width/height for correct min/max calculation
		// Although fixValues should handle this on initialization/scale.
		var thisRight = this.x + this.width;
		var thisBottom = this.y + this.height;
		var rectRight = rect.x + rect.width;
		var rectBottom = rect.y + rect.height;

		var minx = Math.min( this.x, rect.x );
		var miny = Math.min( this.y, rect.y );
		var maxx = Math.max( thisRight, rectRight);
		var maxy = Math.max( thisBottom, rectBottom);
		return new qlib.Rectangle( minx, miny, maxx - minx, maxy - miny );
	}
	
	/**
	 * Computes the intersection of this rectangle and another rectangle.
	 * The intersection is the largest rectangle contained within both input rectangles.
	 * @method intersection
	 * @param {qlib.Rectangle} rect - The other rectangle to intersect with.
	 * @returns {qlib.Rectangle} A new `qlib.Rectangle` instance representing the intersection.
	 *                            Returns an empty rectangle (width/height=0) if they do not intersect.
	 *                            Returns a clone of the other rectangle if this one is empty, and vice-versa.
	 */
	p.intersection = function( rect )
	{
		// fixValues is called on initialization, so not strictly needed here again unless properties were manually changed to negative.
		// this.fixValues();
		// rect.fixValues(); // Should not modify the input rect. Clone if modification is needed.

		var r1x = this.x, r1y = this.y, r1w = this.width, r1h = this.height;
		var r2x = rect.x, r2y = rect.y, r2w = rect.width, r2h = rect.height;

		if ( r1w == 0 || r1h == 0 ) return rect.clone(); // Or new qlib.Rectangle()
		if ( r2w == 0 || r2h == 0 ) return this.clone(); // Or new qlib.Rectangle()

		var inter_x = Math.max( r1x, r2x );
		var inter_y = Math.max( r1y, r2y );
		var inter_right = Math.min( r1x + r1w, r2x + r2w );
		var inter_bottom = Math.min( r1y + r1h, r2y + r2h );

		if ( inter_x >= inter_right || inter_y >= inter_bottom ) {
			return new qlib.Rectangle(0,0,0,0); // No overlap
		}
		return new qlib.Rectangle( inter_x, inter_y, inter_right - inter_x, inter_bottom - inter_y );
	}
	
	/**
	 * Calculates and returns the center point of the rectangle.
	 * @method getCenter
	 * @returns {qlib.Vector2} A new `qlib.Vector2` instance representing the center.
	 */
	p.getCenter = function()
	{
		return new qlib.Vector2( this.x + this.width*0.5, this.y + this.height*0.5);
	}
	
	/**
	 * [read-only] A `qlib.Point` representing the top-left corner (x,y) of the rectangle.
	 * @property {qlib.Point} topLeft
	 */
	p.__defineGetter__("topLeft", function(){return new qlib.Point(this.x,this.y);}); // qlib.Point might be intended here
	
// public methods:
	/**
	 * Returns a new `qlib.Rectangle` instance that is an exact copy of this one.
	 * The `deepClone` parameter is effectively ignored as properties are primitive numbers.
	 * @method clone
	 * @param {boolean} [deepClone] - This parameter is ignored as properties are primitive.
	 * @return {qlib.Rectangle} A clone of the Rectangle instance.
	 **/
	p.clone = function( deepClone ) { // deepClone is not used for primitive properties
		return new qlib.Rectangle( this.x, this.y, this.width, this.height );
	}
	
	/**
	 * Draws the rectangle on a given canvas graphics context.
	 * Assumes the context has a `drawRect` method compatible with `context.rect()` or `context.fillRect()`.
	 * @method draw
	 * @param {CanvasRenderingContext2D} graphics - The canvas rendering context.
	 * @returns {void}
	 */
	p.draw = function( graphics )
	{
		// Standard canvas uses rect(), fillRect(), or strokeRect().
		// Assuming graphics.drawRect is a qlib wrapper or similar to context.rect().
		if (typeof graphics.rect === 'function') {
			graphics.beginPath(); // Often needed before rect() if it's part of a new path
			graphics.rect(this.x, this.y, this.width, this.height );
			// graphics.stroke(); or graphics.fill(); would typically follow.
		} else if (typeof graphics.drawRect === 'function') { // qlib specific?
			graphics.drawRect(this.x, this.y, this.width, this.height );
		}
	}

	/**
	 * Returns a string representation of this Rectangle object.
	 * @method toString
	 * @return {string} A string representation of the instance (e.g., "qlib.Rectangle(x,y,width,height)").
	 **/
	p.toString = function() {
		return "qlib.Rectangle("+this.x+","+this.y+","+this.width+","+this.height+")";
	}
	
	qlib["Rectangle"] = Rectangle;
}());