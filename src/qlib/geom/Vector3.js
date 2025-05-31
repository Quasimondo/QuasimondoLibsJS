/*
* Vector3
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
 * Represents a 3D vector with x, y, and z components.
 * This class provides instance properties for x, y, and z coordinates.
 * It also serves as a namespace for static utility functions that operate on
 * 3-element arrays representing vectors (e.g., `[x, y, z]`).
 *
 * Note: The constructor's initialization logic `this.create(arguments)` seems to refer to a non-existent
 * prototype method. Instances will have x, y, z properties initialized to 0 by default,
 * and should be set directly or via a custom initialization if constructor arguments are intended.
 * The static methods are the primary way to perform vector operations using this class.
 *
 * @class Vector3
 * @memberof qlib
 * @constructor
 * @param {number|number[]|qlib.Vector3} [x_or_array_or_vec] - Optional. If a number, the x-coordinate.
 *        If an array, it should contain [x,y,z]. If a Vector3, its components are copied.
 * @param {number} [y] - The y-coordinate, if x_or_array_or_vec is the x-coordinate.
 * @param {number} [z] - The z-coordinate, if x_or_array_or_vec is the x-coordinate.
 */
var Vector3 = function() {
  // this.create(arguments); // This line is problematic as p.create is not defined.
  // Initialize x, y, z based on arguments or to defaults.
  var args = arguments;
  if (args.length === 3) {
    this.x = args[0] || 0;
    this.y = args[1] || 0;
    this.z = args[2] || 0;
  } else if (args.length === 1 && (Array.isArray(args[0]) || args[0] instanceof qlib.Vector3) ) {
    this.x = args[0][0] || args[0].x || 0;
    this.y = args[0][1] || args[0].y || 0;
    this.z = args[0][2] || args[0].z || 0;
  } else {
    this.x = 0;
    this.y = 0;
    this.z = 0;
  }
}
var p = Vector3.prototype;
	
// public properties:

	/** 
	 * The x-component of the vector.
	 * @property {number} x
	 * @default 0
	 **/
	p.x = 0;
	
	/** 
	 * The y-component of the vector.
	 * @property {number} y
	 * @default 0
	 **/
	p.y = 0;
	
	/** 
	 * The z-component of the vector.
	 * @property {number} z
	 * @default 0
	 **/
	p.z = 0;
	

	/**
	 * Creates a new 3-element array representing a Vector3, initialized to (0,0,0) or from existing values.
	 * @static
	 * @method create
	 * @param {number[]|qlib.Vector3} [vec] - Optional. A 3-element array or `qlib.Vector3` instance containing values to initialize with.
	 * @returns {number[]} A new 3-element array `[x, y, z]`.
	 */
	Vector3.create = function(vec) {
		var dest = [0,0,0];
		if(vec) {
			dest[0] = vec[0] || vec.x || 0; // Handle both array and object-like
			dest[1] = vec[1] || vec.y || 0;
			dest[2] = vec[2] || vec.z || 0;
		}
		return dest;
	};
	
	/**
	 * Copies the values of one 3-element vector representation to another.
	 * @static
	 * @method set
	 * @param {number[]|qlib.Vector3} vec - Source vector (3-element array or object with x,y,z).
	 * @param {number[]} dest - Destination vector (3-element array) to receive copied values.
	 * @returns {number[]} The destination vector `dest`.
	 */
	Vector3.set = function(vec, dest) {
		dest[0] = vec[0] || vec.x || 0;
		dest[1] = vec[1] || vec.y || 0;
		dest[2] = vec[2] || vec.z || 0;
		return dest;
	};
	
	/**
	 * Performs a vector addition: `dest = vec + vec2`.
	 * @static
	 * @method add
	 * @param {number[]} vec - The first operand (3-element array).
	 * @param {number[]} vec2 - The second operand (3-element array).
	 * @param {number[]} [dest] - Optional. Array to store the result. If not specified, `vec` is modified.
	 * @returns {number[]} The result vector (`dest` if specified, otherwise `vec`).
	 */
	Vector3.add = function(vec, vec2, dest) {
		if(!dest || vec === dest) {
			vec[0] += vec2[0];
			vec[1] += vec2[1];
			vec[2] += vec2[2];
			return vec;
		}
		dest[0] = vec[0] + vec2[0];
		dest[1] = vec[1] + vec2[1];
		dest[2] = vec[2] + vec2[2];
		return dest;
	};
	
	/**
	 * Performs a vector subtraction: `dest = vec - vec2`.
	 * @static
	 * @method subtract
	 * @param {number[]} vec - The first operand (minuend, 3-element array).
	 * @param {number[]} vec2 - The second operand (subtrahend, 3-element array).
	 * @param {number[]} [dest] - Optional. Array to store the result. If not specified, `vec` is modified.
	 * @returns {number[]} The result vector (`dest` if specified, otherwise `vec`).
	 */
	Vector3.subtract = function(vec, vec2, dest) {
		if(!dest || vec === dest) {
			vec[0] -= vec2[0];
			vec[1] -= vec2[1];
			vec[2] -= vec2[2];
			return vec;
		}
		dest[0] = vec[0] - vec2[0];
		dest[1] = vec[1] - vec2[1];
		dest[2] = vec[2] - vec2[2];
		return dest;
	};
	
	/**
	 * Negates the components of a vector: `dest = -vec`.
	 * @static
	 * @method negate
	 * @param {number[]} vec - The vector to negate (3-element array).
	 * @param {number[]} [dest] - Optional. Array to store the result. If not specified, `vec` is modified.
	 * @returns {number[]} The negated vector (`dest` if specified, otherwise `vec`).
	 */
	Vector3.negate = function(vec, dest) {
		if(!dest) { dest = vec; }
		dest[0] = -vec[0];
		dest[1] = -vec[1];
		dest[2] = -vec[2];
		return dest;
	};
	
	/**
	 * Multiplies the components of a vector by a scalar value: `dest = vec * val`.
	 * @static
	 * @method scale
	 * @param {number[]} vec - The vector to scale (3-element array).
	 * @param {number} val - The scalar value to scale by.
	 * @param {number[]} [dest] - Optional. Array to store the result. If not specified, `vec` is modified.
	 * @returns {number[]} The scaled vector (`dest` if specified, otherwise `vec`).
	 */
	Vector3.scale = function(vec, val, dest) {
		if(!dest || vec === dest) {
			vec[0] *= val;
			vec[1] *= val;
			vec[2] *= val;
			return vec;
		}
		dest[0] = vec[0]*val;
		dest[1] = vec[1]*val;
		dest[2] = vec[2]*val;
		return dest;
	};
	
	/**
	 * Normalizes a vector (scales it to unit length).
	 * If the vector length is 0, it returns `[0, 0, 0]`.
	 * @static
	 * @method normalize
	 * @param {number[]} vec - The vector to normalize (3-element array).
	 * @param {number[]} [dest] - Optional. Array to store the result. If not specified, `vec` is modified.
	 * @returns {number[]} The normalized vector (`dest` if specified, otherwise `vec`).
	 */
	Vector3.normalize = function(vec, dest) {
		if(!dest) { dest = vec; }
		var x = vec[0], y = vec[1], z = vec[2];
		var len = Math.sqrt(x*x + y*y + z*z);
		if (!len) {
			dest[0] = 0; dest[1] = 0; dest[2] = 0;
		} else if (len === 1) {
			dest[0] = x; dest[1] = y; dest[2] = z;
		} else {
			len = 1 / len;
			dest[0] = x*len; dest[1] = y*len; dest[2] = z*len;
		}
		return dest;
	};
	
	/**
	 * Calculates the cross product of two vectors: `dest = vec X vec2`.
	 * @static
	 * @method cross
	 * @param {number[]} vec - The first operand (3-element array).
	 * @param {number[]} vec2 - The second operand (3-element array).
	 * @param {number[]} [dest] - Optional. Array to store the result. If not specified, `vec` is modified (which is incorrect for cross product, should always use dest or return new).
	 *                          Correct behavior: if dest is not provided, a new array is created. If dest is provided, it's used.
	 * @returns {number[]} The cross product vector.
	 */
	Vector3.cross = function(vec, vec2, dest){
		if(!dest) { dest = Vector3.create(); } // Create new array if no dest, to avoid overwriting vec1
		
		var x = vec[0], y = vec[1], z = vec[2];
		var x2 = vec2[0], y2 = vec2[1], z2 = vec2[2];
		
		dest[0] = y*z2 - z*y2;
		dest[1] = z*x2 - x*z2;
		dest[2] = x*y2 - y*x2;
		return dest;
	};
	
	/**
	 * Calculates the length (magnitude) of a vector.
	 * @static
	 * @method length
	 * @param {number[]|qlib.Vector3} vec - The vector (3-element array or object with x,y,z).
	 * @returns {number} The length of the vector.
	 */
	Vector3.length = function(vec){
		var x = vec[0] || vec.x || 0;
		var y = vec[1] || vec.y || 0;
		var z = vec[2] || vec.z || 0;
		return Math.sqrt(x*x + y*y + z*z);
	};
	
	/**
	 * Calculates the dot product of two vectors.
	 * @static
	 * @method dot
	 * @param {number[]|qlib.Vector3} vec - The first operand.
	 * @param {number[]|qlib.Vector3} vec2 - The second operand.
	 * @returns {number} The dot product of `vec` and `vec2`.
	 */
	Vector3.dot = function(vec, vec2){
		var x1 = vec[0] || vec.x || 0;
		var y1 = vec[1] || vec.y || 0;
		var z1 = vec[2] || vec.z || 0;
		var x2 = vec2[0] || vec2.x || 0;
		var y2 = vec2[1] || vec2.y || 0;
		var z2 = vec2[2] || vec2.z || 0;
		return x1*x2 + y1*y2 + z1*z2;
	};
	
	/**
	 * Generates a unit vector pointing from one vector (`vec`) to another (`vec2`).
	 * `dest = normalize(vec2 - vec)`.
	 * @static
	 * @method direction
	 * @param {number[]} vec - The origin vector (3-element array).
	 * @param {number[]} vec2 - The target vector (3-element array) to point to.
	 * @param {number[]} [dest] - Optional. Array to store the result. If not specified, `vec` is modified.
	 * @returns {number[]} The direction vector (`dest` if specified, otherwise `vec`).
	 */
	Vector3.direction = function(vec, vec2, dest) {
		if(!dest) { dest = vec; }
		
		var x = vec2[0] - vec[0]; // Corrected: target - origin
		var y = vec2[1] - vec[1];
		var z = vec2[2] - vec[2];
		
		var len = Math.sqrt(x*x + y*y + z*z);
		if (!len) { 
			dest[0] = 0; dest[1] = 0; dest[2] = 0;
		} else {
			len = 1 / len;
			dest[0] = x * len; dest[1] = y * len; dest[2] = z * len;
		}
		return dest; 
	};
	
	/**
	 * Returns a string representation of a vector.
	 * @static
	 * @method str
	 * @param {number[]|qlib.Vector3} vec - The vector to represent as a string.
	 * @returns {string} String representation of `vec` (e.g., "[x, y, z]").
	 */
	Vector3.str = function(vec) {
		var x = vec[0] || vec.x || 0;
		var y = vec[1] || vec.y || 0;
		var z = vec[2] || vec.z || 0;
		return '[' + x + ', ' + y + ', ' + z + ']';
	};
	
	qlib["Vector3"] = Vector3;
}());