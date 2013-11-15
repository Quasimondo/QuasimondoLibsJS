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
this.qlib = this.qlib||{};

(function() {

var Vector3D = function() {
  this.create(arguments);
}
var p = Vector3D.prototype;
	
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
	
	/** 
	 * W position. 
	 * @property w
	 * @type Number
	 **/
	p.w = 0;
	
	/*
	 * Vector3.create
	 * Creates a new instance of a Vector3 using the default array type
	 * Any javascript array containing at least 3 numeric elements can serve as a Vector3
	 *
	 * Params:
	 * vec - Optional
	 *
	 * Returns:
	 * New Vector3
	 */
	p.create = function(x,y,z,w) {
		this.x = x | 0;
		this.y = y | 0;
		this.z = z | 0;
		this.w = w | 0;
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
	p.set = function(vec) 
	{
		this.x = vec.x;
		this.y = vec.y;
		this.z = vec.z;
		this.w = vec.w;
		return this;
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
		p.add = function(vec) {
		this.x += vec.x;
		this.y += vec.y;
		this.z += vec.z;
		this.w += vec.w;
		return this;
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
	p.subtract = function(vec) {
		this.x -= vec.x;
		this.y -= vec.y;
		this.z -= vec.z;
		this.w -= vec.w;
		return this;
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
	p.negate = function() {
		this.x *= -1;
		this.y *= -1;
		this.z *= -1;
		this.w *= -1;
		return this;
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
	p.scale = function(val) {
		this.x *= val;
		this.y *= val;
		this.z *= val;
		this.w *= val;
		return this;
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
	p.normalize = function() 
	{
		
		var len = this.length;
		
		if (!len) {
			this.x = this.y = this.z = this.w = 0;
			return this;
		} else if (len == 1) {
			return this;
		}
		
		return this.scale( 1 / len );
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
	p.cross = function(vec){
		return new qlib.Vector3D(this.y*v.z - this.z*v.y, this.z*v.x - this.x*v.z, this.x*v.y - this.y*v.x);
      
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
	p.length = function(){
		return Math.sqrt(this.x*this.x + this.y*this.y + this.z*this.z );
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
	p.dot = function(vec){
		return this.x*v.x + this.y*v.y + this.z*v.z + this.w*v.w;
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
	p.direction = function(vec) {
		var x = this.x - vec.x;
		var y = this.y - vec.y;
		var z = this.z - vec.z;
		
		var len = Math.sqrt(x*x + y*y + z*z);
		if (!len) { 
			this.x = this.y = this.z = this.w = 0;
			return this; 
		}
		
		len = 1 / len;
		this.x = x * len; 
		this.y = y * len; 
		this.z = z * len;
		return this; 
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
	p.str = function(vec) {
		return '[' + this.x + ', ' + this.y + ', ' + this.z + ', ' + this.w+ ']'; 
	};
	
qlib.Vector3 = Vector3;
}());