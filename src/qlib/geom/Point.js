/**
* The Point object represents a location in a two-dimensional coordinate system, where x represents the horizontal axis and y represents the vertical axis.
* @constructor
* @author Leandro Ferreira
* taken from BitmapData.js code by Peter Nitsch - https://github.com/pnitsch/BitmapData.js
* HTML5 Canvas API implementation of the AS3 BitmapData class. 
*
* adapted and augmented by Mario Klingemann for qlib
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

	var Point = function( x, y ) {
		this.initialize( x, y );
	}
	
	var p = Point.prototype; 

	p.initialize = function (x, y) {
		this.x = x || 0;
		this.y = y || 0;
		
		this.__defineGetter__("length", function(){return Math.sqrt(this.x * this.x + this.y * this.y);});
	}
	
	/**
	* Adds the coordinates of another point to the coordinates of this point to create a new point.
	* @param {Point} v The point to be added.
	* @returns {Point} The new Point.
	*/
	p.add = function(v) {
		return new qlib.Point(this.x + v.x, this.y + v.y);
	}
	
	/**
	* Creates a copy of this Point object.
	* @returns {Point} The new Point.
	*/
	p.clone = function() {
		return new qlib.Point(this.x, this.y);
	}
	
	
	/**
	* Determines whether two points are equal.
	* @param {Point} toCompare The point to be compared.
	* @returns {Boolean} True if the object is equal to this Point object; false if it is not equal.
	*/
	p.equals = function(toCompare) {
		return this.x == toCompare.x && this.y == toCompare.y;
	}
	
	
	/**
	* Scales the line segment between (0,0) and the current point to a set length.
	* @param {Number} thickness The scaling value. For example, if the current point is (0,5), and you normalize it to 1, the point returned is at (0,1).
	*/
	p.normalize = function(thickness) {
		var ratio = thickness / this.length;
		this.x *= ratio;
		this.y *= ratio;
	}
	
	/**
	* Offsets the Point object by the specified amount.
	* @param {Number} dx The amount by which to offset the horizontal coordinate, x.
	* @param {Number} dy The amount by which to offset the vertical coordinate, y.
	*/
	p.offset = function(dx, dy) {
		this.x += dx;
		this.y += dy;
	}
	
	
	/**
	* Subtracts the coordinates of another point from the coordinates of this point to create a new point.
	* @param {Point} v The point to be subtracted.
	* @returns {Point} The new point.
	*/
	p.subtract = function(v) {
		return new qlib.Point( this.x - v.x, this.y = v.y );
	}
	
	/**
	 * Returns a string representation of this object.
	 * @method toString
	 * @return {String} a string representation of the instance.
	 **/
	p.toString = function() {
		return "qlib.Point("+this.x+","+this.y+")";
	}
	
	/**
	* [static] Returns the distance between pt1 and pt2.
	* @param {Point} pt1 The first point.
	* @param {Point} pt2 The second point.
	* @returns {Number} The distance between the first and second points.
	*/
	Point.distance = function(pt1, pt2) {
		var dx = p2.x - p1.x;
		var dy = p2.y - p1.y;
		return Math.sqrt(dx * dx + dy * dy);
	}

	/**
	* [static] Determines a point between two specified points.
	* @param {Point} pt1 The first point.
	* @param {Point} pt2 The second point.
	* @param {Number} f The level of interpolation between the two points. Indicates where the new point will be, along the line between pt1 and pt2. If f=1, pt1 is returned; if f=0, pt2 is returned.
	* @returns {Point} The new, interpolated point.
	*/

	Point.interpolate = function(pt1, pt2, f) {
		var pt = new qlib.Point();
		pt.x = p1.x + f * (p2.x - p1.x);
		pt.y = p1.y + f * (p2.y - p1.y);
		return pt;
	}
	/**
	* [static] Converts a pair of polar coordinates to a Cartesian point coordinate.
	* @param {Number} len The length coordinate of the polar pair.
	* @param {Number} angle The angle, in radians, of the polar pair.
	* @returns {Point} The Cartesian point.
	*/
	Point.polar = function(len, angle) {
		return new qlib.Point(len * Math.cos(angle), len * Math.sin(angle));
	}
	
	qlib["Point"] = Point;

}());

