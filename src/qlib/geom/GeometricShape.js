/*
* Circle
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
 * An abstract base class or interface for various geometric shapes within the qlib library.
 * It defines a common structure and placeholder methods that concrete shapes should implement.
 * Subclasses are expected to override methods like `draw`, `scale`, and `clone`,
 * and set their specific `type`.
 *
 * @class GeometricShape
 * @memberof qlib
 * @constructor
 */
var GeometricShape = function() {
  // Constructor is typically empty for abstract-like base classes in JS,
  // or initializes common properties.
}
var p = GeometricShape.prototype;
	
// public properties:

	/**
	 * A string identifier for the type of the geometric shape.
	 * Subclasses should override this property (e.g., "Circle", "Rectangle").
	 * @property {string} type
	 * @default "GeometricShape"
	 */
	p.type = "GeometricShape";
	
	/**
	 * Computes the intersection between this geometric shape and another.
	 * This method delegates the actual intersection calculation to `qlib.Intersection.intersect`.
	 *
	 * @method intersect
	 * @param {qlib.GeometricShape} s - The other geometric shape to intersect with this one.
	 * @returns {Array|Object|null} The result of the intersection, which can vary depending on the shapes involved
	 *                              (e.g., an array of intersection points, an object describing overlap, or null if no intersection).
	 *                              The specific return type is determined by `qlib.Intersection.intersect`.
	 */
	p.intersect = function( s ) {
		return qlib.Intersection.intersect( this, s );
	}

	/**
	 * Placeholder method for drawing the shape.
	 * Concrete subclasses must implement this method to provide their drawing logic.
	 *
	 * @method draw
	 * @param {CanvasRenderingContext2D|Object} graphics - The drawing context (e.g., a 2D canvas context)
	 *                                                   or a custom graphics object that supports drawing operations.
	 * @returns {void}
	 * @throws {Error} If not implemented by a subclass.
	 */
	p.draw = function( graphics )
	{
		throw("draw() not implented yet in "+this.type);
	}
	
	/**
	 * Placeholder method for scaling the shape.
	 * Concrete subclasses must implement this method.
	 *
	 * @method scale
	 * @param {number} factorX - The scaling factor along the x-axis.
	 * @param {number} factorY - The scaling factor along the y-axis.
	 * @param {qlib.Vector2} [center] - The optional center point for scaling. If not provided,
	 *                                  scaling might be relative to an origin or the shape's own center.
	 * @returns {this} The instance of the shape, allowing for chaining (if implemented by subclass).
	 * @throws {Error} If not implemented by a subclass.
	 */
	p.scale = function( factorX, factorY, center )
	{
		throw("scale() not implented yet in "+this.type);
	}
	
	/**
	 * Placeholder method for cloning the shape.
	 * Concrete subclasses must implement this method.
	 *
	 * @method clone
	 * @param {boolean} [deepClone=false] - If true, a deep clone of the shape's properties (like points)
	 *                                      should be performed. If false, a shallow clone might be acceptable.
	 * @returns {qlib.GeometricShape} A new instance of the shape, identical to this one.
	 * @throws {Error} If not implemented by a subclass.
	 */
	p.clone = function( deepClone )
	{
		throw("clone() not implented yet in "+this.type);
	}
	
	
	/**
	 * Returns a string representation of this object, which is its `type`.
	 *
	 * @method toString
	 * @return {string} The type of the geometric shape.
	 **/
	p.toString = function() {
		return this.type;
	}
	
	qlib["GeometricShape"] = GeometricShape;
}());