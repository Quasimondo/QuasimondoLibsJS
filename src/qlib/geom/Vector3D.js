/*
* Vector3D
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
 * Represents a 4-component vector, often used in 3D graphics for homogeneous coordinates (x, y, z, w)
 * or as a general 4D vector. Provides methods for standard vector operations.
 *
 * @class Vector3D
 * @memberof qlib
 * @constructor
 * @param {number} [x=0] - The x-component.
 * @param {number} [y=0] - The y-component.
 * @param {number} [z=0] - The z-component.
 * @param {number} [w=0] - The w-component.
 */
var Vector3D = function(x,y,z,w) { // Changed constructor signature
  this.initialize(x,y,z,w); // Changed to call initialize directly
}
var p = Vector3D.prototype;
	
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
	 * The w-component of the vector. Often used for homogeneous coordinates (usually 1 for points, 0 for vectors) or perspective division.
	 * @property {number} w
	 * @default 0
	 **/
	p.w = 0;
	
	/**
	 * Initializes the Vector3D instance. Called by the constructor.
	 * The bitwise OR `| 0` will convert `undefined` or other non-numeric inputs to 0,
	 * and will truncate any fractional part of numbers (e.g., 3.14 becomes 3).
	 * This might be intentional for specific use cases or could be `|| 0` for a more typical default.
	 *
	 * @method initialize
	 * @protected
	 * @param {number} [x=0] - The initial x-component.
	 * @param {number} [y=0] - The initial y-component.
	 * @param {number} [z=0] - The initial z-component.
	 * @param {number} [w=0] - The initial w-component.
	 * @returns {void}
	 */
	p.initialize = function(x,y,z,w) { // Renamed from 'create' to 'initialize'
		this.x = x || 0; // Using || 0 for default, assuming float values are desired.
		this.y = y || 0;
		this.z = z || 0;
		this.w = w || 0;
	};
	
	/**
	 * Copies the components of another Vector3D to this vector.
	 *
	 * @method set
	 * @param {qlib.Vector3D} vec - The Vector3D to copy components from.
	 * @returns {this} This Vector3D instance for chaining.
	 */
	p.set = function(vec) 
	{
		this.x = vec.x;
		this.y = vec.y;
		this.z = vec.z;
		this.w = vec.w;
		return this;
	};
	
	/**
	 * Adds the components of another Vector3D to this vector. Modifies this vector.
	 * (this = this + vec)
	 * @method add
	 * @param {qlib.Vector3D} vec - The Vector3D to add.
	 * @returns {this} This Vector3D instance for chaining.
	 */
	p.add = function(vec) {
		this.x += vec.x;
		this.y += vec.y;
		this.z += vec.z;
		this.w += vec.w;
		return this;
	};
	
	/**
	 * Subtracts the components of another Vector3D from this vector. Modifies this vector.
	 * (this = this - vec)
	 * @method subtract
	 * @param {qlib.Vector3D} vec - The Vector3D to subtract.
	 * @returns {this} This Vector3D instance for chaining.
	 */
	p.subtract = function(vec) {
		this.x -= vec.x;
		this.y -= vec.y;
		this.z -= vec.z;
		this.w -= vec.w;
		return this;
	};
	
	/**
	 * Negates all components of this vector. Modifies this vector.
	 * (this = -this)
	 * @method negate
	 * @returns {this} This Vector3D instance for chaining.
	 */
	p.negate = function() {
		this.x *= -1;
		this.y *= -1;
		this.z *= -1;
		this.w *= -1;
		return this;
	};
	
	/**
	 * Scales all components of this vector by a scalar value. Modifies this vector.
	 * (this = this * val)
	 * @method scale
	 * @param {number} val - The scalar value to multiply by.
	 * @returns {this} This Vector3D instance for chaining.
	 */
	p.scale = function(val) {
		this.x *= val;
		this.y *= val;
		this.z *= val;
		this.w *= val;
		return this;
	};
	
	/**
	 * Normalizes this vector to unit length based on its x, y, and z components.
	 * The w component is also scaled by the same factor.
	 * If the 3D length (x,y,z) is 0, all components (x,y,z,w) are set to 0.
	 * Modifies this vector.
	 * @method normalize
	 * @returns {this} This Vector3D instance for chaining.
	 */
	p.normalize = function() 
	{
		var currentLength = this.length(); // Uses the 3D length (x,y,z)
		
		if (currentLength === 0) {
			this.x = this.y = this.z = this.w = 0; // Or handle w differently if it represents perspective
		} else {
			var invLength = 1 / currentLength;
			this.x *= invLength;
			this.y *= invLength;
			this.z *= invLength;
			this.w *= invLength; // W is also scaled
		}
		return this;
	};
	
	/**
	 * Calculates the cross product of this vector's (x,y,z) components with another Vector3D's (x,y,z) components.
	 * The w component of the resulting vector is set to 0 (or the default for a new Vector3D).
	 * This method returns a new Vector3D instance and does not modify this vector.
	 * @method cross
	 * @param {qlib.Vector3D} vec - The other Vector3D.
	 * @returns {qlib.Vector3D} A new Vector3D instance representing the cross product.
	 */
	p.cross = function(vec){ // Renamed v to vec for clarity
		return new qlib.Vector3D(this.y*vec.z - this.z*vec.y,
		                         this.z*vec.x - this.x*vec.z,
		                         this.x*vec.y - this.y*vec.x,
		                         0); // W component of cross product is typically 0 or not well-defined in this context
	};
	
	/**
	 * Calculates the 3D length (magnitude) of this vector using its x, y, and z components.
	 * The w component is ignored in this calculation.
	 * @method length
	 * @returns {number} The 3D length of the vector.
	 */
	p.length = function(){
		return Math.sqrt(this.x*this.x + this.y*this.y + this.z*this.z );
	};
	
	/**
	 * Calculates the 4D dot product of this vector and another Vector3D.
	 * All four components (x, y, z, w) are used.
	 * @method dot
	 * @param {qlib.Vector3D} vec - The other Vector3D.
	 * @returns {number} The 4D dot product.
	 */
	p.dot = function(vec){ // Renamed v to vec
		return this.x*vec.x + this.y*vec.y + this.z*vec.z + this.w*vec.w;
	};
	
	/**
	 * Modifies this vector to be the normalized direction vector from this point towards another point `vec`.
	 * Uses only x, y, z components for direction calculation. The w component of this vector is set to 0 after normalization.
	 * @method direction
	 * @param {qlib.Vector3D} vec - The target Vector3D to point towards.
	 * @returns {this} This Vector3D instance, modified to be the direction vector.
	 */
	p.direction = function(vec) {
		var dx = vec.x - this.x; // Corrected: target - origin for direction vector
		var dy = vec.y - this.y;
		var dz = vec.z - this.z;
		
		var len = Math.sqrt(dx*dx + dy*dy + dz*dz);
		if (!len) { 
			this.x = this.y = this.z = this.w = 0; // Or specific handling for w
		} else {
			len = 1 / len;
			this.x = dx * len;
			this.y = dy * len;
			this.z = dz * len;
			this.w = 0; // Typically, direction vectors have w=0 in homogeneous coordinates
		}
		return this; 
	};
	
	/**
	 * Returns a string representation of this Vector3D.
	 * Format: "[x, y, z, w]"
	 * @method toString
	 * @return {string} A string representation of the instance.
	 **/
	p.toString = function() { // Renamed from str and removed vec parameter
		return '[' + this.x + ', ' + this.y + ', ' + this.z + ', ' + this.w + ']';
	};
	
	qlib["Vector3D"] = Vector3D;
}());