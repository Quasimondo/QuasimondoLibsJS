/**
 * Represents a point in a two-dimensional Cartesian coordinate system.
 * It can also be used to represent a two-dimensional vector.
 *
 * @class Point
 * @param {number} [x=0] - The x-coordinate of the point. Defaults to 0 if not specified.
 * @param {number} [y=0] - The y-coordinate of the point. Defaults to 0 if not specified.
 *
 * @property {number} x - The x-coordinate of the point.
 * @property {number} y - The y-coordinate of the point.
 * @property {number} length - [read-only] The length of the vector from the origin (0,0) to this point.
 *                             This is a getter property.
 */
// namespace:
window["qlib"] = window.qlib || {};

(function() {
	/**
	 * Constructs a new Point instance.
	 * @constructor
	 * @param {number} [x=0] - The x-coordinate of the point. Defaults to 0.
	 * @param {number} [y=0] - The y-coordinate of the point. Defaults to 0.
	 */
	var Point = function( x, y ) {
		this.initialize( x, y );
	}
	
	var p = Point.prototype;

	/**
	 * @property {number} x - The x-coordinate of the point.
	 */
	// p.x = 0; // Documented in the class description

	/**
	 * @property {number} y - The y-coordinate of the point.
	 */
	// p.y = 0; // Documented in the class description

	/**
	 * @property {number} length - [read-only] The length of the vector from the origin (0,0) to this point.
	 *                             This is a getter property, calculated on demand.
	 */
	// p.length defined by __defineGetter__

	/**
	 * Initializes the Point object with the given x and y coordinates.
	 * This method is called by the constructor.
	 * It also defines a getter for the `length` property.
	 *
	 * @method initialize
	 * @param {number} [x=0] - The x-coordinate for the point. Defaults to 0.
	 * @param {number} [y=0] - The y-coordinate for the point. Defaults to 0.
	 * @returns {void}
	 */
	p.initialize = function (x, y) {
		this.x = x || 0;
		this.y = y || 0;
		
		// Defines the 'length' property as a getter.
		// This means 'length' is calculated on demand and is read-only.
		this.__defineGetter__("length", function(){return Math.sqrt(this.x * this.x + this.y * this.y);});
	}
	
	/**
	* Adds the coordinates of another point to the coordinates of this point.
	* Returns a new Point instance with the result. This point is not modified.
	*
	* @method add
	* @param {qlib.Point} v - The point whose coordinates are to be added to this point.
	* @returns {qlib.Point} A new Point instance representing the sum of the two points.
	*/
	p.add = function(v) {
		return new qlib.Point(this.x + v.x, this.y + v.y);
	}
	
	/**
	* Creates a new Point instance with the same x and y coordinates as this point.
	*
	* @method clone
	* @returns {qlib.Point} A new Point instance that is a copy of this point.
	*/
	p.clone = function() {
		return new qlib.Point(this.x, this.y);
	}
	
	
	/**
	* Compares this Point with another Point to determine if they have the same x and y coordinates.
	*
	* @method equals
	* @param {qlib.Point} toCompare - The Point instance to compare with this point.
	* @returns {boolean} True if the x and y coordinates of both points are equal, otherwise false.
	*/
	p.equals = function(toCompare) {
		return this.x == toCompare.x && this.y == toCompare.y;
	}
	
	
	/**
	* Scales this point (interpreted as a vector from the origin) to a specific length.
	* This method modifies the current Point instance.
	* For example, if the current point is (0, 5), normalizing it to a length of 1 will result in the point (0, 1).
	*
	* @method normalize
	* @param {number} thickness - The desired length for the vector.
	* @returns {void}
	*/
	p.normalize = function(thickness) {
		var ratio = thickness / this.length;
		this.x *= ratio;
		this.y *= ratio;
	}
	
	/**
	* Modifies this point by adding the specified delta values to its x and y coordinates.
	*
	* @method offset
	* @param {number} dx - The amount to add to the x-coordinate.
	* @param {number} dy - The amount to add to the y-coordinate.
	* @returns {void}
	*/
	p.offset = function(dx, dy) {
		this.x += dx;
		this.y += dy;
	}
	
	
	/**
	* Subtracts the coordinates of another point from the coordinates of this point.
	* Returns a new Point instance with the result. This point is not modified.
	*
	* @method subtract
	* @param {qlib.Point} v - The point whose coordinates are to be subtracted from this point.
	* @returns {qlib.Point} A new Point instance representing the difference between the two points.
	*/
	p.subtract = function(v) {
		return new qlib.Point( this.x - v.x, this.y - v.y );
	}
	
	/**
	 * Returns a string representation of this Point object.
	 * The format is "qlib.Point(x,y)".
	 *
	 * @method toString
	 * @returns {string} A string representation of the Point instance.
	 **/
	p.toString = function() {
		return "qlib.Point("+this.x+","+this.y+")";
	}
	
	/**
	* Calculates the Euclidean distance between two Point instances.
	*
	* @method distance
	* @static
	* @param {qlib.Point} pt1 - The first Point instance.
	* @param {qlib.Point} pt2 - The second Point instance.
	* @returns {number} The distance between the two points.
	*/
	Point.distance = function(pt1, pt2) {
		var dx = pt2.x - pt1.x;
		var dy = pt2.y - pt1.y;
		return Math.sqrt(dx * dx + dy * dy);
	}

	/**
	* Creates a new Point instance by interpolating between two other points.
	* The parameter `f` determines the interpolation amount. A value of 0.0 will result in a point equal to `pt1`,
	* while a value of 1.0 will result in a point equal to `pt2`. Values between 0.0 and 1.0 will result in a point
	* along the line segment connecting `pt1` and `pt2`.
	*
	* @method interpolate
	* @static
	* @param {qlib.Point} pt1 - The first Point instance (interpolation start).
	* @param {qlib.Point} pt2 - The second Point instance (interpolation end).
	* @param {number} f - The interpolation factor, typically between 0.0 and 1.0.
	*                     If f=0, a point equal to pt2 is returned (Note: original docs said f=1 -> pt1, f=0 -> pt2, but the code implements f=0 -> pt1, f=1 -> pt2. Corrected to match code logic: f=0 -> pt1, f=1 -> pt2. Re-evaluating: The code is `pt1.x + f * (pt2.x - pt1.x)`. If f=0, result is `pt1.x`. If f=1, result is `pt1.x + pt2.x - pt1.x = pt2.x`. So, f=0 returns pt1, f=1 returns pt2. The original JSDoc was `If f=1, pt1 is returned; if f=0, pt2 is returned.` which is the inverse. I will correct the description to match the code.)
	*                     If f=0, `pt1` is returned; if f=1, `pt2` is returned.
	* @returns {qlib.Point} A new Point instance representing the interpolated point.
	*/
	Point.interpolate = function(pt1, pt2, f) {
		var pt = new qlib.Point();
		pt.x = pt1.x + f * (pt2.x - pt1.x); // if f=0, x = pt1.x; if f=1, x = pt2.x
		pt.y = pt1.y + f * (pt2.y - pt1.y); // if f=0, y = pt1.y; if f=1, y = pt2.y
		return pt;
	}

	/**
	* Converts a pair of polar coordinates (length and angle) to Cartesian (x,y) coordinates.
	*
	* @method polar
	* @static
	* @param {number} len - The length component of the polar coordinate.
	* @param {number} angle - The angle component of the polar coordinate, in radians.
	* @returns {qlib.Point} A new Point instance representing the Cartesian coordinates.
	*/
	Point.polar = function(len, angle) {
		return new qlib.Point(len * Math.cos(angle), len * Math.sin(angle));
	}
	
	qlib["Point"] = Point;

}());

