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

var Vector3 = function() {
  this.create(arguments);
}
var p = Vector3.prototype;
	
// public properties:

	/** 
	 * X position. 
	 * @property x
	 * @type Number
	 **/
	p.x = 0;
	
	/** 
	 * Y position. 
	 * @property y
	 * @type Number
	 **/
	p.y = 0;
	
	/** 
	 * Z position. 
	 * @property z
	 * @type Number
	 **/
	p.z = 0;
	

	/*
	 * Vector3.create
	 * Creates a new instance of a Vector3 using the default array type
	 * Any javascript array containing at least 3 numeric elements can serve as a Vector3
	 *
	 * Params:
	 * vec - Optional, Vector3 containing values to initialize with
	 *
	 * Returns:
	 * New Vector3
	 */
	Vector3.create = function(vec) {
		var dest = [0,0,0];
		
		if(vec) {
			dest[0] = vec[0];
			dest[1] = vec[1];
			dest[2] = vec[2];
		}
		
		return dest;
	};
	
	/*
	 * Vector3.set
	 * Copies the values of one Vector3 to another
	 *
	 * Params:
	 * vec - Vector3 containing values to copy
	 * dest - Vector3 receiving copied values
	 *
	 * Returns:
	 * dest
	 */
	Vector3.set = function(vec, dest) {
		dest[0] = vec[0];
		dest[1] = vec[1];
		dest[2] = vec[2];
		
		return dest;
	};
	
	/*
	 * Vector3.add
	 * Performs a vector addition
	 *
	 * Params:
	 * vec - Vector3, first operand
	 * vec2 - Vector3, second operand
	 * dest - Optional, Vector3 receiving operation result. If not specified result is written to vec
	 *
	 * Returns:
	 * dest if specified, vec otherwise
	 */
	Vector3.add = function(vec, vec2, dest) {
		if(!dest || vec == dest) {
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
	
	/*
	 * Vector3.subtract
	 * Performs a vector subtraction
	 *
	 * Params:
	 * vec - Vector3, first operand
	 * vec2 - Vector3, second operand
	 * dest - Optional, Vector3 receiving operation result. If not specified result is written to vec
	 *
	 * Returns:
	 * dest if specified, vec otherwise
	 */
	Vector3.subtract = function(vec, vec2, dest) {
		if(!dest || vec == dest) {
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
	
	/*
	 * Vector3.negate
	 * Negates the components of a Vector3
	 *
	 * Params:
	 * vec - Vector3 to negate
	 * dest - Optional, Vector3 receiving operation result. If not specified result is written to vec
	 *
	 * Returns:
	 * dest if specified, vec otherwise
	 */
	Vector3.negate = function(vec, dest) {
		if(!dest) { dest = vec; }
		
		dest[0] = -vec[0];
		dest[1] = -vec[1];
		dest[2] = -vec[2];
		return dest;
	};
	
	/*
	 * Vector3.scale
	 * Multiplies the components of a Vector3 by a scalar value
	 *
	 * Params:
	 * vec - Vector3 to scale
	 * val - Numeric value to scale by
	 * dest - Optional, Vector3 receiving operation result. If not specified result is written to vec
	 *
	 * Returns:
	 * dest if specified, vec otherwise
	 */
	Vector3.scale = function(vec, val, dest) {
		if(!dest || vec == dest) {
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
	
	/*
	 * Vector3.normalize
	 * Generates a unit vector of the same direction as the provided Vector3
	 * If vector length is 0, returns [0, 0, 0]
	 *
	 * Params:
	 * vec - Vector3 to normalize
	 * dest - Optional, Vector3 receiving operation result. If not specified result is written to vec
	 *
	 * Returns:
	 * dest if specified, vec otherwise
	 */
	Vector3.normalize = function(vec, dest) {
		if(!dest) { dest = vec; }
		
		var x = vec[0], y = vec[1], z = vec[2];
		var len = Math.sqrt(x*x + y*y + z*z);
		
		if (!len) {
			dest[0] = 0;
			dest[1] = 0;
			dest[2] = 0;
			return dest;
		} else if (len == 1) {
			dest[0] = x;
			dest[1] = y;
			dest[2] = z;
			return dest;
		}
		
		len = 1 / len;
		dest[0] = x*len;
		dest[1] = y*len;
		dest[2] = z*len;
		return dest;
	};
	
	/*
	 * Vector3.cross
	 * Generates the cross product of two Vector3s
	 *
	 * Params:
	 * vec - Vector3, first operand
	 * vec2 - Vector3, second operand
	 * dest - Optional, Vector3 receiving operation result. If not specified result is written to vec
	 *
	 * Returns:
	 * dest if specified, vec otherwise
	 */
	Vector3.cross = function(vec, vec2, dest){
		if(!dest) { dest = vec; }
		
		var x = vec[0], y = vec[1], z = vec[2];
		var x2 = vec2[0], y2 = vec2[1], z2 = vec2[2];
		
		dest[0] = y*z2 - z*y2;
		dest[1] = z*x2 - x*z2;
		dest[2] = x*y2 - y*x2;
		return dest;
	};
	
	/*
	 * Vector3.length
	 * Caclulates the length of a Vector3
	 *
	 * Params:
	 * vec - Vector3 to calculate length of
	 *
	 * Returns:
	 * Length of vec
	 */
	Vector3.length = function(vec){
		var x = vec[0], y = vec[1], z = vec[2];
		return Math.sqrt(x*x + y*y + z*z);
	};
	
	/*
	 * Vector3.dot
	 * Caclulates the dot product of two Vector3s
	 *
	 * Params:
	 * vec - Vector3, first operand
	 * vec2 - Vector3, second operand
	 *
	 * Returns:
	 * Dot product of vec and vec2
	 */
	Vector3.dot = function(vec, vec2){
		return vec[0]*vec2[0] + vec[1]*vec2[1] + vec[2]*vec2[2];
	};
	
	/*
	 * Vector3.direction
	 * Generates a unit vector pointing from one vector to another
	 *
	 * Params:
	 * vec - origin Vector3
	 * vec2 - Vector3 to point to
	 * dest - Optional, Vector3 receiving operation result. If not specified result is written to vec
	 *
	 * Returns:
	 * dest if specified, vec otherwise
	 */
	Vector3.direction = function(vec, vec2, dest) {
		if(!dest) { dest = vec; }
		
		var x = vec[0] - vec2[0];
		var y = vec[1] - vec2[1];
		var z = vec[2] - vec2[2];
		
		var len = Math.sqrt(x*x + y*y + z*z);
		if (!len) { 
			dest[0] = 0; 
			dest[1] = 0; 
			dest[2] = 0;
			return dest; 
		}
		
		len = 1 / len;
		dest[0] = x * len; 
		dest[1] = y * len; 
		dest[2] = z * len;
		return dest; 
	};
	
	/*
	 * Vector3.str
	 * Returns a string representation of a vector
	 *
	 * Params:
	 * vec - Vector3 to represent as a string
	 *
	 * Returns:
	 * string representation of vec
	 */
	Vector3.str = function(vec) {
		return '[' + vec[0] + ', ' + vec[1] + ', ' + vec[2] + ']'; 
	};
	
	qlib["Vector3"] = Vector3;
}());