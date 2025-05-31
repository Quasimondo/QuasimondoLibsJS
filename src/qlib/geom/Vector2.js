/*
* Vector2
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
 * Represents a 2D vector with x and y components.
 * This class provides a comprehensive set of methods for vector manipulation,
 * including arithmetic operations, normalization, rotation, and geometric calculations.
 *
 * @class Vector2
 * @param {number|qlib.Point|Array<qlib.Point>} [arg1] - Defines how the vector is initialized:
 *   - If no arguments are provided, initializes a zero vector (x=0, y=0).
 *   - If `arg1` is a number, it's treated as the x-coordinate. `arg2` is then treated as the y-coordinate.
 *   - If `arg1` is a `qlib.Point` instance, initializes the vector with the point's x and y coordinates.
 *   - If `arg1` is an Array of two `qlib.Point` instances, e.g., `[p0, p1]`, initializes the vector as the difference `p1 - p0`.
 * @param {number} [arg2] - The y-coordinate, used if `arg1` is a number.
 *
 * @property {number} x - The x-component of the vector.
 * @property {number} y - The y-component of the vector.
 * @property {number} length - [read-only] The length (magnitude) of the vector. This is a getter property.
 */
var Vector2 = function() {
  this.initialize(arguments);
}
var p = Vector2.prototype;
	
// public properties:

	/** 
	 * The x-component of the vector.
	 * @property {number} x
	 */
	p.x = 0;
	
	/** 
	 * The y-component of the vector.
	 * @property {number} y
	 */
	p.y = 0;

	/**
	 * [read-only] The length (magnitude) of the vector, calculated as `sqrt(x*x + y*y)`.
	 * This is a getter property.
	 * @property {number} length
	 */
	// Defined later using __defineGetter__
	
// constructor:
	/** 
	 * Initializes the Vector2 instance based on the provided arguments.
	 * This method is called by the constructor.
	 *
	 * @method initialize
	 * @protected
	 * @param {IArguments} args - The arguments passed to the constructor. Supports multiple signatures:
	 *   - No arguments: x and y are set to 0.
	 *   - `(x: number, y: number)`: Initializes with specified x and y values.
	 *   - `(point: qlib.Point)`: Initializes from the x and y of the given `qlib.Point`.
	 *   - `(points: [qlib.Point, qlib.Point])`: Initializes as the vector from `points[0]` to `points[1]`.
	 * @returns {void}
	*/
	p.initialize = function(args) 
	{
		if (args.length == 0)
		{ 
			this.x = this.y = 0;
		} else if ( typeof args[0] == "number" )
		{	
			this.x = ( args[0] == null ? 0 : args[0]);
			this.y = ( args[1] == null ? 0 : args[1]);
		} else if ( args.length == 2 && args[0].x != null && args[0].y != null && args[1].x != null && args[1].y != null)
		{
			this.x = args[1].x - args[0].x;
			this.y = args[1].y - args[0].y;
		} else if (args.length == 1 && args[0].x != null && args[0].y != null ) {
			this.x = args[0].x;
			this.y = args[0].y;
		}
	}
	
// public methods:
	/**
	 * Sets the x and y components of this vector.
	 * Overloaded behavior:
	 * - No arguments: sets x and y to 0.
	 * - Two numbers: sets x and y to the given values.
	 * - A `qlib.Point`: sets x and y from the Point's coordinates.
	 *
	 * @method setValue
	 * @param {number|qlib.Point} [arg1] - If a number, the new x-coordinate. If a `qlib.Point`, its coordinates will be used.
	 * @param {number} [arg2] - If `arg1` is a number, this is the new y-coordinate.
	 * @returns {qlib.Vector2} This Vector2 instance, allowing for chaining.
	 */
	p.setValue = function()
	{
		if (arguments.length == 0)
		{ 
			this.x = this.y = 0;
		} else if ( typeof arguments[0] == "number" )
		{	
			this.x = ( arguments[0] == null ? 0 : arguments[0]);
			this.y = ( arguments[1] == null ? 0 : arguments[1]);
		} else {
			this.x = arguments[0].x;
			this.y = arguments[0].y;
		}
		return this;
	}

	/**
	 * Calculates the squared Euclidean distance to another vector.
	 * This is often preferred over `distanceToVector` for comparisons as it avoids a square root operation.
	 *
	 * @method squaredDistanceToVector
	 * @param {qlib.Vector2} v - The other vector.
	 * @returns {number} The squared distance between this vector and vector `v`.
	 * @throws {Error} If `v` is null.
	 */
	p.squaredDistanceToVector = function( v )
	{
		if (  v == null )
		{
			throw("Vector2.squaredDistanceToVector: null passed in");
		}
		var dx = this.x - v.x;
		var dy = this.y - v.y;
		return dx * dx + dy * dy;
	}
	
	/**
	 * Calculates the Euclidean distance to another vector.
	 * If you only need to compare distances, consider `squaredDistanceToVector` for performance.
	 *
	 * @method distanceToVector
	 * @param {qlib.Vector2} v - The other vector.
	 * @returns {number} The distance between this vector and vector `v`.
	 */
	p.distanceToVector = function( v )
	{
		return Math.sqrt( this.squaredDistanceToVector(v) );
	}
	
	/**
	 * Creates a new Vector2 instance by linearly interpolating between this vector and another vector `v`.
	 * The interpolation factor `l` is clamped between 0.0 and 1.0.
	 * - If `l`=0, a vector equal to this vector is returned.
	 * - If `l`=1, a vector equal to `v` is returned.
	 *
	 * @method getLerp
	 * @param {qlib.Vector2} v - The target vector for interpolation.
	 * @param {number} l - The interpolation factor, typically between 0.0 (this vector) and 1.0 (vector `v`).
	 * @returns {qlib.Vector2} A new Vector2 instance representing the interpolated vector.
	 */
	p.getLerp = function( v, l )
	{
		return new qlib.Vector2( this.x + (v.x - this.x) * l, this.y + (v.y - this.y) * l );
	}
		
	/**
	 * Performs a linear interpolation between this vector and another vector `v`, modifying this vector in place.
	 * The interpolation factor `l` is clamped between 0.0 and 1.0.
	 * - If `l`=0, this vector remains unchanged.
	 * - If `l`=1, this vector becomes equal to `v`.
	 *
	 * @method lerp
	 * @param {qlib.Vector2} v - The target vector for interpolation.
	 * @param {number} l - The interpolation factor, typically between 0.0 and 1.0.
	 * @returns {qlib.Vector2} This Vector2 instance, after interpolation, allowing for chaining.
	 */
	p.lerp = function( v, l )
	{
		this.x += (v.x - this.x) * l
		this.y += (v.y - this.y) * l;
		return this;
	}

	/**
	 * Checks if this vector is "close enough" to another vector `v`, within a specified squared distance.
	 * Useful for floating-point comparisons.
	 *
	 * @method snaps
	 * @param {qlib.Vector2} v - The other vector to compare against.
	 * @param {number} [squaredSnapDistance=0.00000001] - The maximum squared distance to consider "snapped". Defaults to a very small epsilon.
	 * @returns {boolean} True if the squared distance between the vectors is less than `squaredSnapDistance`, false otherwise.
	 */
	p.snaps = function( v, squaredSnapDistance ) 
	{
		return this.squaredDistanceToVector( v ) < ( squaredSnapDistance == null ? 0.00000001 : squaredSnapDistance);
	};
	
	/**
	 * Checks if this vector's x and y components are exactly equal to another vector's components.
	 * For floating-point comparisons with a tolerance, use `snaps`.
	 *
	 * @method equals
	 * @param {qlib.Vector2} v - The other vector to compare with.
	 * @returns {boolean} True if both x and y components are equal, false otherwise.
	 */
	p.equals = function ( v ) 
	{
		return (this.x == v.x && this.y == v.y);
	};
	
	/**
	 * [read-only] The length (magnitude) of the vector.
	 * This is a getter property, equivalent to calling `getLength()`.
	 * @name length
	 * @type {number}
	 * @memberof qlib.Vector2.prototype
	 */
	p.__defineGetter__("length", function(){ return this.getLength();});
	
	/**
	 * Calculates the length (magnitude) of this vector.
	 * `sqrt(x*x + y*y)`.
	 *
	 * @method getLength
	 * @returns {number} The length of the vector.
	 */
	p.getLength = function()
	{
		return Math.sqrt( this.x * this.x + this.y * this.y );
	}
		
	/**
	 * Calculates the squared length (magnitude) of this vector.
	 * `x*x + y*y`. This is computationally cheaper than `getLength` if only comparing magnitudes.
	 *
	 * @method getSquaredLength
	 * @returns {number} The squared length of the vector.
	 */
	p.getSquaredLength = function()
	{
		return this.x * this.x + this.y * this.y;
	}
		
	/**
	 * Calculates the angle of this vector in radians, relative to the positive x-axis.
	 * The angle is in the range (-PI, PI].
	 *
	 * @method getAngle
	 * @returns {number} The angle of the vector in radians.
	 */
	p.getAngle = function( )
	{
		return Math.atan2( this.y , this.x );
	}
	
	/**
	 * Calculates the angle in radians from this vector (point) to another vector (point) `v`.
	 * This is the angle of the vector formed by `v - this`.
	 *
	 * @method getAngleTo
	 * @param {qlib.Vector2} v - The target vector (point).
	 * @returns {number} The angle in radians to vector `v`.
	 */
	p.getAngleTo = function( v )
	{
		return Math.atan2( v.y - this.y, v.x - this.x );
	};
	
	/**
	 * Sets the length (magnitude) of this vector, preserving its direction.
	 * If the original length is zero, the vector remains (0,0).
	 *
	 * @method newLength
	 * @param {number} len - The new desired length for the vector.
	 * @returns {qlib.Vector2} This Vector2 instance, after modification, allowing for chaining.
	 */
	p.newLength = function( len )
	{
		var l = this.getLength();
		if ( l == 0 ) return this; // Avoid division by zero; vector remains (0,0)
		this.x *= len / l;
		this.y *= len / l;
		
		return this;
	}
	
	/**
	 * Creates a new Vector2 instance with the same direction as this vector but with a specified length.
	 * If this vector's length is zero, a zero vector is returned.
	 *
	 * @method getNewLength
	 * @param {number} len - The desired length for the new vector.
	 * @returns {qlib.Vector2} A new Vector2 instance with the specified length.
	 */
	p.getNewLength = function( len )
	{
		var l = this.getLength();
		if ( l === 0 ) return new qlib.Vector2(); // Avoid division by zero
		return new qlib.Vector2( this.x / l * len, this.y / l * len );
	}
	
	/**
	 * Adds the components of another vector `v` to this vector, modifying this vector in place.
	 * (this.x += v.x, this.y += v.y).
	 *
	 * @method plus
	 * @param {qlib.Vector2} v - The vector to add to this one.
	 * @returns {qlib.Vector2} This Vector2 instance, after addition, allowing for chaining.
	 */
	p.plus = function( v )
	{
		this.x += v.x;
		this.y += v.y;
		return this;
	}
	
	/**
	 * Creates a new Vector2 instance by adding the components of another vector `v` to this vector.
	 * Does not modify this vector.
	 *
	 * @method getPlus
	 * @param {qlib.Vector2} v - The vector to add.
	 * @returns {qlib.Vector2} A new Vector2 instance representing the sum.
	 */
	p.getPlus = function( v )
	{
		return new qlib.Vector2( this.x + v.x, this.y + v.y );
	}
	
	/**
	 * Adds specified x and y values to this vector's components, modifying this vector in place.
	 * (this.x += tx, this.y += ty).
	 *
	 * @method plusXY
	 * @param {number} tx - The value to add to the x-component.
	 * @param {number} ty - The value to add to the y-component.
	 * @returns {qlib.Vector2} This Vector2 instance, after addition, allowing for chaining.
	 */
	p.plusXY = function( tx, ty )
	{
		this.x += tx;
		this.y += ty;
		return this;
	}
	
	/**
	 * Creates a new Vector2 instance by adding specified x and y values to this vector's components.
	 * Does not modify this vector.
	 *
	 * @method getPlusXY
	 * @param {number} tx - The value to add to the x-component.
	 * @param {number} ty - The value to add to the y-component.
	 * @returns {qlib.Vector2} A new Vector2 instance representing the sum.
	 */
	p.getPlusXY = function( tx, ty )
	{
		return new qlib.Vector2( this.x + tx, this.y + ty );
	}
	
	/**
	 * Subtracts the components of another vector `v` from this vector, modifying this vector in place.
	 * (this.x -= v.x, this.y -= v.y).
	 *
	 * @method minus
	 * @param {qlib.Vector2} v - The vector to subtract from this one.
	 * @returns {qlib.Vector2} This Vector2 instance, after subtraction, allowing for chaining.
	 */
	p.minus = function( v )
	{
		this.x -= v.x;
		this.y -= v.y;
		return this;
	}
	
	/**
	 * Creates a new Vector2 instance by subtracting the components of another vector `v` from this vector.
	 * Does not modify this vector.
	 *
	 * @method getMinus
	 * @param {qlib.Vector2} v - The vector to subtract.
	 * @returns {qlib.Vector2} A new Vector2 instance representing the difference.
	 */
	p.getMinus = function( v )
	{
		return new qlib.Vector2( this.x - v.x, this.y - v.y );
	}
	
	/**
	 * Multiplies both components of this vector by a scalar value `f`, modifying this vector in place.
	 * (this.x *= f, this.y *= f).
	 *
	 * @method multiply
	 * @param {number} f - The scalar value to multiply by.
	 * @returns {qlib.Vector2} This Vector2 instance, after multiplication, allowing for chaining.
	 */
	p.multiply = function( f )
	{
		this.x *= f;
		this.y *= f;
		return this;
	}
	
	/**
	 * Creates a new Vector2 instance by multiplying both components of this vector by a scalar value `f`.
	 * Does not modify this vector.
	 *
	 * @method getMultiply
	 * @param {number} f - The scalar value to multiply by.
	 * @returns {qlib.Vector2} A new Vector2 instance representing the scaled vector.
	 */
	p.getMultiply = function( f )
	{
		return new qlib.Vector2( this.x * f, this.y * f );
	}
	
	/**
	 * Multiplies the x-component of this vector by `fx` and the y-component by `fy`, modifying this vector in place.
	 * (this.x *= fx, this.y *= fy).
	 *
	 * @method multiplyXY
	 * @param {number} fx - The scalar value to multiply the x-component by.
	 * @param {number} fy - The scalar value to multiply the y-component by.
	 * @returns {qlib.Vector2} This Vector2 instance, after component-wise multiplication, allowing for chaining.
	 */
	p.multiplyXY = function( fx, fy )
	{
		this.x *= fx;
		this.y *= fy;
		return this;
	}
	
	/**
	 * Creates a new Vector2 instance by multiplying the x-component of this vector by `fx` and the y-component by `fy`.
	 * Does not modify this vector.
	 *
	 * @method getMultiplyXY
	 * @param {number} fx - The scalar value to multiply the x-component by.
	 * @param {number} fy - The scalar value to multiply the y-component by.
	 * @returns {qlib.Vector2} A new Vector2 instance representing the scaled vector.
	 */
	p.getMultiplyXY = function( fx, fy )
	{
		return new qlib.Vector2( this.x * fx, this.y * fy );
	}
	
	/**
	 * Divides both components of this vector by a scalar value `d`, modifying this vector in place.
	 * (this.x /= d, this.y /= d).
	 *
	 * @method divide
	 * @param {number} d - The scalar value to divide by. Avoid division by zero.
	 * @returns {qlib.Vector2} This Vector2 instance, after division, allowing for chaining.
	 */
	p.divide = function( d )
	{
		this.x /= d;
		this.y /= d;
		return this;
	}
	
	/**
	 * Creates a new Vector2 instance by dividing both components of this vector by a scalar value `d`.
	 * Does not modify this vector.
	 *
	 * @method getDivide
	 * @param {number} d - The scalar value to divide by. Avoid division by zero.
	 * @returns {qlib.Vector2} A new Vector2 instance representing the scaled vector.
	 */
	p.getDivide = function( d )
	{
		return new qlib.Vector2( this.x / d, this.y / d );
	}
	
	/**
	 * Creates a new Vector2 instance by adding a vector defined by polar coordinates (angle and length) to this vector.
	 * Does not modify this vector.
	 *
	 * @method getAddCartesian
	 * @param {number} angle - The angle of the polar vector in radians.
	 * @param {number} length - The length (magnitude) of the polar vector.
	 * @returns {qlib.Vector2} A new Vector2 instance representing the sum.
	 */
	p.getAddCartesian = function( angle, length )
	{
		return new qlib.Vector2 (this.x + Math.cos ( angle ) * length, this.y + Math.sin ( angle ) * length );
	}
	
	/**
	 * Adds a vector defined by polar coordinates (angle and length) to this vector, modifying this vector in place.
	 *
	 * @method addCartesian
	 * @param {number} angle - The angle of the polar vector in radians.
	 * @param {number} length - The length (magnitude) of the polar vector.
	 * @returns {qlib.Vector2} This Vector2 instance, after addition, allowing for chaining.
	 */
	p.addCartesian = function( angle, length )
	{
		this.x += Math.cos ( angle ) * length;
		this.y += Math.sin ( angle ) * length;
		return this;
	}
	
	/**
	 * Calculates the dot product of this vector and another vector `v`.
	 * The dot product is `this.x * v.x + this.y * v.y`.
	 *
	 * @method dot
	 * @param {qlib.Vector2} v - The other vector.
	 * @returns {number} The dot product of the two vectors.
	 */
	p.dot = function( v )
	{
		return this.x * v.x + this.y * v.y;
	}
	
	/**
	 * Calculates the 2D cross product (scalar) of this vector and another vector `v`.
	 * The 2D cross product is `this.x * v.y - this.y * v.x`.
	 * It represents the signed area of the parallelogram formed by the two vectors.
	 *
	 * @method cross
	 * @param {qlib.Vector2} v - The other vector.
	 * @returns {number} The scalar 2D cross product.
	 */
	p.cross = function( v )
	{
		return this.x * v.y - this.y * v.x;
	}
		
	/**
	 * Calculates the angle in radians between this vector and another vector `v`.
	 * The result is always positive, in the range [0, PI].
	 *
	 * @method angleBetween
	 * @param {qlib.Vector2} v - The other vector.
	 * @returns {number} The angle in radians between the two vectors. Returns NaN if either vector has zero length.
	 */
	p.angleBetween = function( v )
	{
		return Math.acos ( this.dot( v ) / ( this.getLength() * v.getLength() ) );
	}
	
	/**
	 * Calculates the angle in radians of the corner formed by `v1 - this` and `v2 - this`.
	 * This vector is treated as the vertex of the angle.
	 *
	 * @method cornerAngle
	 * @param {qlib.Vector2} v1 - The first vector defining one side of the corner.
	 * @param {qlib.Vector2} v2 - The second vector defining the other side of the corner.
	 * @returns {number} The angle in radians.
	 * @throws {Error} If `v1` or `v2` is null.
	 */
	p.cornerAngle = function( v1, v2 )
	{
		if ( v1 == null || v2 == null )
		{
			throw("Vector2.cornerAngle needs two vectors");
		}
		return v1.getMinus(this).angleBetween( v2.getMinus(this) );
	}
	
	/**
	 * Determines the winding direction of the triangle formed by this point (P) and two other points (p0, p1).
	 * The points are considered in the order P, p0, p1.
	 *
	 * @method windingDirection
	 * @param {qlib.Vector2} p0 - The second point of the triangle (after this point).
	 * @param {qlib.Vector2} p1 - The third point of the triangle (after p0).
	 * @returns {number}
	 *   - `-1` if the points P, p0, p1 are in clockwise order.
	 *   - `1` if the points P, p0, p1 are in counter-clockwise order.
	 *   - `0` if the points are collinear.
	 */
	p.windingDirection = function( p0, p1 )
	{
		var result = (p0.x - p1.x) * (p1.y - this.y) - (p0.y - p1.y) * (p1.x - this.x);
		if (result < 0) return -1;	
		if (result > 0) return  1;	
		return 0;
		
	}
	
	/**
	 * Resets this vector's components to x=0 and y=0, modifying it in place.
	 *
	 * @method reset
	 * @returns {qlib.Vector2} This Vector2 instance, after resetting, allowing for chaining.
	 */
	p.reset = function( )
	{
		this.x = this.y = 0;
		return this;
	}
	
	/**
	 * Reflects this vector across a given normal vector, modifying this vector in place.
	 * The normal vector should ideally be a unit vector.
	 *
	 * @method reflect
	 * @param {qlib.Vector2} normal - The normal vector defining the line of reflection.
	 * @returns {qlib.Vector2} This Vector2 instance, after reflection, allowing for chaining.
	 */
	p.reflect = function( normal )
	{
		var dp = 2 * this.dot( normal );
		
		this.x -= normal.x * dp;
		this.y -= normal.y * dp;
		
		return this;
	}
	
	/**
	 * Creates a new Vector2 instance by reflecting this vector across a given normal vector.
	 * Does not modify this vector. The normal vector should ideally be a unit vector.
	 *
	 * @method getReflect
	 * @param {qlib.Vector2} normal - The normal vector defining the line of reflection.
	 * @returns {qlib.Vector2} A new Vector2 instance representing the reflected vector.
	 */
	p.getReflect = function( normal )
	{
		var dp = 2 * this.dot( normal );
		
		return new qlib.Vector2( this.x - normal.x * dp, this.y - normal.y * dp );
	}
	
	/**
	 * Mirrors this vector across another vector (interpreted as a point), modifying this vector in place.
	 * This results in a point reflection.
	 *
	 * @method mirror
	 * @param {qlib.Vector2} vector - The vector (point) to mirror across.
	 * @returns {qlib.Vector2} This Vector2 instance, after mirroring, allowing for chaining.
	 */
	p.mirror = function( vector )
	{
		
		this.x = 2 * vector.x - this.x;
		this.y = 2 * vector.y - this.y;
		
		return this;
	}
	
	/**
	 * Creates a new Vector2 instance by mirroring this vector across another vector (interpreted as a point).
	 * Does not modify this vector. This results in a point reflection.
	 *
	 * @method getMirror
	 * @param {qlib.Vector2} vector - The vector (point) to mirror across.
	 * @returns {qlib.Vector2} A new Vector2 instance representing the mirrored vector.
	 */
	p.getMirror = function( vector )
	{
		
		return new qlib.Vector2( 2 * vector.x - this.x, 2 * vector.y - this.y );
	}
	
	/**
	 * Creates a new Vector2 instance representing the projection of this vector (point P)
	 * onto the infinite line defined by points `a` and `b`.
	 * Does not modify this vector.
	 *
	 * @method getProject
	 * @param {qlib.Vector2} a - The first point defining the line.
	 * @param {qlib.Vector2} b - The second point defining the line.
	 * @returns {qlib.Vector2} A new Vector2 instance representing the projected point on the line.
	 */
	p.getProject = function( a, b )
	{
		
		// upgraded version by Fabien  Bizot 
		// http://www.lafabrick.com/blog
		var lenSq = a.squaredDistanceToVector( b ); // Use squared distance to avoid sqrt if possible
		if (lenSq === 0) return a.clone(); // a and b are the same point
		var r = (((this.x - a.x) * (b.x - a.x)) + ((this.y - a.y) * (b.y - a.y))) / lenSq;
		
		var px = a.x + r * (b.x - a.x);
		var py = a.y + r * (b.y - a.y);
		
		return new qlib.Vector2(px, py);
	}
	
	/**
	 * Projects this vector (point P) onto the infinite line defined by points `a` and `b`,
	 * modifying this vector in place to become the projected point.
	 *
	 * @method project
	 * @param {qlib.Vector2} a - The first point defining the line.
	 * @param {qlib.Vector2} b - The second point defining the line.
	 * @returns {qlib.Vector2} This Vector2 instance, after projection, allowing for chaining.
	 */
	p.project = function( a, b )
	{
		
		// upgraded version by Fabien  Bizot 
		// http://www.lafabrick.com/blog
		var lenSq = a.squaredDistanceToVector( b ); // Use squared distance to avoid sqrt if possible
		if (lenSq === 0) { // a and b are the same point
			this.x = a.x;
			this.y = a.y;
			return this;
		}
		var r = (((this.x - a.x) * (b.x - a.x)) + ((this.y - a.y) * (b.y - a.y))) / lenSq;
		
		this.x = a.x + r * (b.x - a.x);
		this.y = a.y + r * (b.y - a.y);
		
		return this;
	}
	
	/**
	 * Negates this vector by flipping the sign of its x and y components, modifying it in place.
	 * (this.x = -this.x, this.y = -this.y).
	 *
	 * @method negate
	 * @returns {qlib.Vector2} This Vector2 instance, after negation, allowing for chaining.
	 */
	p.negate = function( )
	{
		this.x *= -1;
		this.y *= -1;
		return this;
	}
		
	/**
	 * Creates a new Vector2 instance by negating this vector (flipping the sign of its x and y components).
	 * Does not modify this vector.
	 *
	 * @method getNegate
	 * @returns {qlib.Vector2} A new Vector2 instance representing the negated vector.
	 */
	p.getNegate = function()
	{
		return new qlib.Vector2( -this.x , -this.y );
	}
		
	/**
	 * Makes this vector orthogonal (perpendicular) to its current direction by rotating it 90 degrees counter-clockwise.
	 * (new_x = -old_y, new_y = old_x). Modifies this vector in place.
	 *
	 * @method orth
	 * @returns {qlib.Vector2} This Vector2 instance, after orthogonalization, allowing for chaining.
	 */
	p.orth = function()
	{
		var tx = -this.y;
		this.y = this.x;
		this.x = tx;
		return this;
	}
		
	/**
	 * Creates a new Vector2 instance that is orthogonal (perpendicular) to this vector,
	 * by rotating it 90 degrees counter-clockwise. (new_x = -old_y, new_y = old_x).
	 * Does not modify this vector.
	 *
	 * @method getOrth
	 * @returns {qlib.Vector2} A new Vector2 instance representing the orthogonal vector.
	 */
	p.getOrth = function()
	{
		return new qlib.Vector2( -this.y, this.x );
	}
		
	/**
	 * Normalizes this vector, scaling it to a unit length (length of 1), modifying it in place.
	 * If the vector's length is zero, it remains (0,0).
	 *
	 * @method normalize
	 * @returns {qlib.Vector2} This Vector2 instance, after normalization, allowing for chaining.
	 */
	p.normalize = function()
	{
		var l = this.getLength();
		if ( l != 0 )
		{
			this.x /= l;
			this.y /= l;
		} else {
			this.x = this.y = 0; // Or handle as an error, or leave as is. Current behavior sets to 0,0.
		}
		return this;
	}
		
	/**
	 * Creates a new Vector2 instance that is a normalized version of this vector (scaled to unit length).
	 * Does not modify this vector. If this vector's length is zero, a new zero vector (0,0) is returned.
	 *
	 * @method getNormalize
	 * @returns {qlib.Vector2} A new Vector2 instance representing the normalized vector.
	 */
	p.getNormalize = function()
	{
		var l = this.getLength();
		if ( l != 0 )
		{
			return new qlib.Vector2( this.x / l, this.y / l );
		} else {
			return new qlib.Vector2(); // Return a zero vector if original length is zero
		}
	}
		
	/**
	 * Converts this vector into its normal vector: a vector that is perpendicular (rotated 90 degrees counter-clockwise)
	 * and has a unit length (length of 1). Modifies this vector in place.
	 * If the original vector's length is zero, it becomes (0,0).
	 *
	 * @method normal
	 * @returns {qlib.Vector2} This Vector2 instance, as a normal vector, allowing for chaining.
	 */
	p.normal = function()
	{
		var l = this.getLength();
		if ( l != 0 )
		{
			var tx = -this.y / l; // Store in temp var as this.y is used next
			this.y = this.x / l;
			this.x = tx;
		} else {
			this.x = this.y = 0; // Or handle as an error. Current behavior sets to 0,0.
		}
		return this;
	}
		
	/**
	 * Creates a new normal vector from this vector. A normal vector is perpendicular
	 * (rotated 90 degrees counter-clockwise) and has a unit length (length of 1).
	 * Does not modify this vector. If this vector's length is zero, a new zero vector (0,0) is returned.
	 *
	 * @method getNormal
	 * @returns {qlib.Vector2} A new Vector2 instance representing the normal vector.
	 */
	p.getNormal = function()
	{
		var l = this.getLength();
		if ( l != 0 )
			return new qlib.Vector2 ( -this.y / l, this.x / l );
		else
			return new qlib.Vector2(); // Return a zero vector if original length is zero
	}
	
	/**
	 * Rotates this vector around a specified `rotationPoint` by a given `angle` in radians.
	 * Modifies this vector in place.
	 *
	 * @method rotateAround
	 * @param {number} angle - The angle of rotation in radians.
	 * @param {qlib.Vector2} rotationPoint - The point (Vector2) around which to rotate.
	 * @returns {qlib.Vector2} This Vector2 instance, after rotation, allowing for chaining.
	 */
	p.rotateAround = function( angle, rotationPoint )
	{
		this.minus(rotationPoint);
		this.rotateBy( angle );
		this.plus(rotationPoint);
		return this;
	 }
	
	/**
	 * Creates a new Vector2 instance by rotating this vector around a specified `rotationPoint` by a given `angle` in radians.
	 * Does not modify this vector.
	 *
	 * @method getRotateAround
	 * @param {number} angle - The angle of rotation in radians.
	 * @param {qlib.Vector2} rotationPoint - The point (Vector2) around which to rotate.
	 * @returns {qlib.Vector2} A new Vector2 instance representing the rotated vector.
	 */
	p.getRotateAround = function( angle, rotationPoint )
	{
		var p = this.getMinus(rotationPoint); // Create new vector relative to rotation point
		p.rotateBy( angle ); // Rotate it
		p.plus(rotationPoint); // Translate back
		return p;
	}
	
	/**
	 * Rotates this vector by a specified `angle` in radians around the origin (0,0).
	 * Modifies this vector in place.
	 *
	 * @method rotateBy
	 * @param {number} angle - The angle of rotation in radians.
	 * @returns {qlib.Vector2} This Vector2 instance, after rotation, allowing for chaining.
	 */
	p.rotateBy = function( angle )
	{
		var ca = Math.cos ( angle );
		var sa = Math.sin ( angle );
		var rx = this.x * ca - this.y * sa;
		this.y = this.x * sa + this.y * ca; // Use original this.x for y calculation
		this.x = rx;
		return this;
	}
	
	/**
	 * Rotates this vector around the origin (0,0) using pre-calculated cosine (`ca`) and sine (`sa`) of the angle.
	 * This can be more efficient if rotating multiple vectors by the same angle. Modifies this vector in place.
	 *
	 * @method rotateByCosSin
	 * @param {number} ca - The cosine of the angle of rotation.
	 * @param {number} sa - The sine of the angle of rotation.
	 * @returns {qlib.Vector2} This Vector2 instance, after rotation, allowing for chaining.
	 */
	p.rotateByCosSin = function( ca, sa )
	{
		var rx = this.x * ca - this.y * sa;
		this.y = this.x * sa + this.y * ca; // Use original this.x for y calculation
		this.x = rx;
		return this;
	}
	
	/**
	 * Creates a new Vector2 instance by rotating this vector by a specified `angle` in radians around the origin (0,0).
	 * Does not modify this vector.
	 *
	 * @method getRotateBy
	 * @param {number} angle - The angle of rotation in radians.
	 * @returns {qlib.Vector2} A new Vector2 instance representing the rotated vector.
	 */
	p.getRotateBy = function( angle )
	{
		var ca = Math.cos ( angle );
		var sa = Math.sin ( angle );
		var rx = this.x * ca - this.y * sa;
		// y component uses original this.x and this.y
		return new qlib.Vector2( rx, this.x * sa + this.y * ca );
	}
	
	/**
	 * Checks if both components of this vector are strictly less than the corresponding components of another vector `v`.
	 * (this.x < v.x AND this.y < v.y).
	 *
	 * @method isLower
	 * @param {qlib.Vector2} v - The vector to compare against.
	 * @returns {boolean} True if this vector is component-wise strictly lower than `v`, false otherwise.
	 */
	p.isLower = function(v) 
	{
		return (this.x<v.x && this.y<v.y);
	};
	
	/**
	 * Checks if both components of this vector are less than or equal to the corresponding components of another vector `v`.
	 * (this.x <= v.x AND this.y <= v.y).
	 *
	 * @method isLowerOrEqual
	 * @param {qlib.Vector2} v - The vector to compare against.
	 * @returns {boolean} True if this vector is component-wise lower than or equal to `v`, false otherwise.
	 */
	p.isLowerOrEqual = function(v) 
	{
		return (this.x<=v.x && this.y<=v.y);
	};
	
	/**
	 * Checks if both components of this vector are strictly greater than the corresponding components of another vector `v`.
	 * (this.x > v.x AND this.y > v.y).
	 *
	 * @method isGreater
	 * @param {qlib.Vector2} v - The vector to compare against.
	 * @returns {boolean} True if this vector is component-wise strictly greater than `v`, false otherwise.
	 */
	p.isGreater = function(v) 
	{
		return (this.x>v.x && this.y>v.y);
	};
	
	/**
	 * Checks if both components of this vector are greater than or equal to the corresponding components of another vector `v`.
	 * (this.x >= v.x AND this.y >= v.y).
	 *
	 * @method isGreaterOrEqual
	 * @param {qlib.Vector2} v - The vector to compare against.
	 * @returns {boolean} True if this vector is component-wise greater than or equal to `v`, false otherwise.
	 */
	p.isGreaterOrEqual = function(v)
	{
		return (this.x>=v.x && this.y>=v.y);
	};
	
	/**
	 * Checks if both components of this vector are less than or equal to the corresponding components of another vector `v`.
	 * (This method is identical to `isLowerOrEqual`.)
	 *
	 * @method isLessOrEqual
	 * @param {qlib.Vector2} v - The vector to compare against.
	 * @returns {boolean} True if this vector is component-wise less than or equal to `v`, false otherwise.
	 */
	p.isLessOrEqual = function(v)
	{
		return (this.x<=v.x && this.y<=v.y);
	};
	
	/**
	 * Determines if this point (vector) lies to the left of, to the right of, or on the directed line segment from `p0` to `p1`.
	 * The result is determined by the sign of the z-component of the cross product of `(p1 - p0)` and `(this - p0)`.
	 *
	 * @method isLeft
	 * @param {qlib.Vector2} p0 - The starting point of the line segment.
	 * @param {qlib.Vector2} p1 - The ending point of the line segment.
	 * @returns {number}
	 *  - A positive value if this point is to the left of the line segment (p0, p1).
	 *  - A negative value if this point is to the right.
	 *  - Zero if this point is collinear with p0 and p1.
	 */
	p.isLeft = function( p0,p1)
	{
		return (p1.x-p0.x)*(this.y-p0.y)-(this.x-p0.x)*(p1.y-p0.y);
	}
	
	
	/**
	 * Sets this vector's components to the component-wise minimum of this vector and another vector `v`.
	 * (this.x = min(this.x, v.x), this.y = min(this.y, v.y)). Modifies this vector in place.
	 *
	 * @method min
	 * @param {qlib.Vector2} v - The vector to compare with.
	 * @returns {qlib.Vector2} This Vector2 instance, after component-wise min operation, allowing for chaining.
	 */
	p.min = function( v ) 
	{
		this.x = Math.min( this.x, v.x);
		this.y = Math.min( this.y, v.y);
		return this;
	};
		
	/**
	 * Sets this vector's components to the component-wise minimum of its current values and the given `px`, `py` values.
	 * (this.x = min(this.x, px), this.y = min(this.y, py)). Modifies this vector in place.
	 *
	 * @method minXY
	 * @param {number} px - The x-value to compare with this vector's x-component.
	 * @param {number} py - The y-value to compare with this vector's y-component.
	 * @returns {qlib.Vector2} This Vector2 instance, after component-wise min operation, allowing for chaining.
	 */
	p.minXY  = function( px, py ) 
	{
		this.x = Math.min( this.x, px);
		this.y = Math.min( this.y, py);
		return this;
	};
		
	/**
	 * Creates a new Vector2 instance whose components are the component-wise minimum of this vector and another vector `v`.
	 * Does not modify this vector.
	 *
	 * @method getMin
	 * @param {qlib.Vector2} v - The vector to compare with.
	 * @returns {qlib.Vector2} A new Vector2 instance representing the component-wise minimum.
	 */
	p.getMin = function( v ) 
	{
		return new qlib.Vector2(Math.min( this.x, v.x), Math.min(this.y, v.y));
	};
		
	/**
	 * Sets this vector's components to the component-wise maximum of this vector and another vector `v`.
	 * (this.x = max(this.x, v.x), this.y = max(this.y, v.y)). Modifies this vector in place.
	 *
	 * @method max
	 * @param {qlib.Vector2} v - The vector to compare with.
	 * @returns {qlib.Vector2} This Vector2 instance, after component-wise max operation, allowing for chaining.
	 */
	p.max = function( v ) 
	{
		this.x = Math.max( this.x, v.x);
		this.y = Math.max( this.y, v.y);
		return this;
	};
		
	/**
	 * Sets this vector's components to the component-wise maximum of its current values and the given `px`, `py` values.
	 * (this.x = max(this.x, px), this.y = max(this.y, py)). Modifies this vector in place.
	 *
	 * @method maxXY
	 * @param {number} px - The x-value to compare with this vector's x-component.
	 * @param {number} py - The y-value to compare with this vector's y-component.
	 * @returns {qlib.Vector2} This Vector2 instance, after component-wise max operation, allowing for chaining.
	 */
	p.maxXY = function( px, py ) 
	{
		this.x = Math.max( this.x, px);
		this.y = Math.max( this.y, py);
		return this;
	};
		
	/**
	 * Creates a new Vector2 instance whose components are the component-wise maximum of this vector and another vector `v`.
	 * Does not modify this vector.
	 *
	 * @method getMax
	 * @param {qlib.Vector2} v - The vector to compare with.
	 * @returns {qlib.Vector2} A new Vector2 instance representing the component-wise maximum.
	 */
	p.getMax = function( v )
	{
		return new qlib.Vector2(Math.max( this.x, v.x), Math.max(this.y, v.y));
	};
	
	
	/**
	 * Creates and returns a new Vector2 instance that is a copy of this vector.
	 *
	 * @method clone
	 * @returns {qlib.Vector2} A new Vector2 instance with the same x and y components as this vector.
	 **/
	p.clone = function() {
		return new qlib.Vector2(this); // Assumes constructor can take a Vector2-like object
	}

	/**
	 * Draws a cross shape (plus sign) representing this vector's position on a 2D canvas rendering context.
	 *
	 * @method draw
	 * @param {CanvasRenderingContext2D} g - The HTML5 Canvas 2D rendering context.
	 * @param {number} [radius=2] - The half-length of the lines forming the cross.
	 * @param {qlib.Vector2} [offset] - An optional Vector2 to offset the drawing position.
	 * @returns {void}
	 */
	p.draw = function( g, radius, offset )
	{
		radius = ( radius == null ? 2 : radius );
		var drawX = this.x;
		var drawY = this.y;
		if (offset) {
			drawX += offset.x;
			drawY += offset.y;
		}
		g.moveTo(drawX - radius, drawY);
		g.lineTo(drawX + radius, drawY);
		g.moveTo(drawX, drawY - radius);
		g.lineTo(drawX, drawY + radius);
	}
		
	/**
	 * Draws a circle representing this vector's position on a 2D canvas rendering context.
	 * Also draws a single pixel at the center of the circle.
	 *
	 * @method drawCircle
	 * @param {CanvasRenderingContext2D} g - The HTML5 Canvas 2D rendering context.
	 *                                     Assumes `g` has `drawRect` and `drawCircle` methods (non-standard Canvas API).
	 * @param {number} [radius=2] - The radius of the circle.
	 * @param {qlib.Vector2} [offset] - An optional Vector2 to offset the drawing position.
	 * @returns {void}
	 */
	p.drawCircle = function( g, radius, offset )
	{
		radius = ( radius == null ? 2 : radius );
		var drawX = this.x;
		var drawY = this.y;
		if (offset) {
			drawX += offset.x;
			drawY += offset.y;
		}
		// Assuming g.drawRect and g.drawCircle are custom methods on the context
		if (typeof g.drawRect === 'function') {
			g.drawRect(drawX - 0.5, drawY - 0.5, 1, 1); // Draws a pixel at the center
		}
		g.moveTo(drawX + radius, drawY); // Needed to start the circle path for standard arc()
		if (typeof g.drawCircle === 'function') {
			g.drawCircle(drawX, drawY, radius);
		} else { // Fallback to standard arc
			g.beginPath();
			g.arc(drawX, drawY, radius, 0, Math.PI*2);
			// g.stroke(); // or g.fill(); depending on desired drawing style
		}
	}
		
	/**
	 * Draws a square centered at this vector's position on a 2D canvas rendering context.
	 *
	 * @method drawRect
	 * @param {CanvasRenderingContext2D} g - The HTML5 Canvas 2D rendering context.
	 *                                     Assumes `g` has a `drawRect` method (non-standard Canvas API, likely `fillRect` or `strokeRect`).
	 * @param {number} [radius=2] - Half the side length of the square (so the square is `2*radius` by `2*radius`).
	 * @param {qlib.Vector2} [offset] - An optional Vector2 to offset the drawing position.
	 * @returns {void}
	 */
	p.drawRect = function( g, radius, offset )
	{
		radius = ( radius == null ? 2 : radius );
		var drawX = this.x;
		var drawY = this.y;
		if (offset) {
			drawX += offset.x;
			drawY += offset.y;
		}
		// Assuming g.drawRect is a custom method like g.fillRect or g.strokeRect
		if (typeof g.drawRect === 'function') {
			g.drawRect(drawX - radius, drawY - radius, radius * 2, radius * 2);
		} else { // Fallback to standard rect
			// g.beginPath(); // if not part of an existing path
			g.rect(drawX - radius, drawY - radius, radius * 2, radius * 2);
			// g.stroke(); // or g.fill();
		}
	}
	
	
	/**
	 * Returns a string representation of this Vector2 instance.
	 * Format: "[Vector2 (x=X y=Y)]"
	 *
	 * @method toString
	 * @returns {string} A string representation of the vector.
	 **/
	p.toString = function() {
		return "[Vector2 (x="+this.x+" y="+this.y+")]";
	}
	
	qlib["Vector2"] = Vector2;
}());