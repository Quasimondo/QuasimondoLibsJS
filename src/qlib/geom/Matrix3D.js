/*
* Matrix3D
*
* Original BitmapData.js code by Peter Nitsch - https://github.com/pnitsch/BitmapData.js
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
this.qlib = this.qlib||{};

(function() {

	var Matrix3D = function(v)
	{
		if (v) 
		{
			this.rawData = Matrix3D.create(v);
		}
		else 
		{
			this.rawData = Matrix3D.create([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
		}
	};
	
	var p = Matrix3D.prototype; 
	
	p.rawData = null;
	
	
	// [read-only] A Number that determines whether a matrix is invertible.
	// return void
	p.determinant = function() 
	{
		return Matrix3D.determinant(this.rawData);
	};
	
	// Appends the matrix by multiplying another Matrix3D object by the current Matrix3D object.
	// return void
	p.append = function(m)
	{
		Matrix3D.multiply(this.rawData, m.rawData);
	};
	
	// Appends an incremental rotation to a Matrix3D object.
	// return void
	p.appendRotation = function(angle, axis, pivot)
	{
		// angle = angle/(3.14159*2);	
		angle = angle * Math.PI / 180;
		if (pivot)
		{
			var npivot = pivot.clone().negate();
			this.appendTranslation(npivot.x, npivot.y, npivot.z);
		}
		var naxis = axis.clone().negate();
		Matrix3D.rotate(this.rawData, angle, [ naxis.x, naxis.y, naxis.z ]);
		if (pivot)
		{
			this.appendTranslation(pivot.x, pivot.y, pivot.z);
		}
	};

	
	// Appends an incremental scale change along the x, y, and z axes to a Matrix3D object.
	// return void
	p.appendScale = function(x, y, z)
	{
		Matrix3D.scale(this.rawData, [ x, y, z ]);
	};	
	
	
	// Appends an incremental translation, a repositioning along the x, y, and z axes, to a Matrix3D object.
	// return void
	p.appendTranslation = function(x, y, z) 
	{
		this.append(Matrix3D.createTranslateMatrix(x, y, z));
	};
	

	// Returns a new Matrix3D object that is an exact copy of the current Matrix3D object.
	// return new Matrix3D
	p.clone = function()
	{
		return new Matrix3D(this.rawData);
	};

	// Converts the current matrix to an identity or unit matrix.
	// return void
	p.identity = function()
	{
		Matrix3D.identity(this.rawData);
	};	

	// [static] Simplifies the interpolation from one frame of reference to another by interpolating a display object a percent point closer to a target display object.
	// Matrix3D.interpolate = function() { };	
	
	// Interpolates the display object's matrix a percent closer to a target's matrix.
	// p.interpolateTo = function() { };	

	
	// Inverts the current matrix.
	// return Boolean true if the matrix was successfully inverted.
	p.invert = function()
	{
		Matrix3D.inverse(this.rawData);
	};


	// Rotates the display object so that it faces a specified position.
	// return void
	// p.pointAt = function(pos, at, up)	{ };

	
	// Prepends a matrix by multiplying the current Matrix3D object by another Matrix3D object.
	// return void
	p.prepend = function(m)
	{
		Matrix3D.multiply(m.rawData, this.rawData, this.rawData);
	};
	

	// Prepends an incremental scale change along the x, y, and z axes to a Matrix3D object.
	// return void
	p.prependScale = function(x, y, z)
	{
		this.prepend(Matrix3D.createScaleMatrix(x, y, z));
	};
	

	// Prepends an incremental translation, a repositioning along the x, y, and z axes, to a Matrix3D object.
	// return void
	p.prependTranslation = function(x, y, z)
	{
		this.prepend(Matrix3D.createTranslateMatrix(x, y, z));
	};
	
	
	// Uses the transformation matrix to transform a Vector3 object from one space coordinate to another.
	// return Vector3D with the transformed coordinates.
	p.transformVector = function(vector)
	{
		var vec = Matrix3D.multiplyVec3(Matrix3D.transpose(this.rawData, Matrix3D.create()), [ vector.x, vector.y, vector.z ]);
		return new qlib.Vector3(vec[0], vec[1], vec[2]);
	};

	
	// Converts the current Matrix3D object to a matrix where the rows and columns are swapped.
	p.transpose = function()
	{
		Matrix3D.transpose(this.rawData);
	};
	
	
	Matrix3D.createTranslateMatrix = function(x, y, z)
	{
		return new Matrix3D([ 
		         			1,0,0,x,
		        			0,1,0,y,
		         			0,0,1,z,
		         			0,0,0,1
		         			]);
	};

	
	Matrix3D.createScaleMatrix = function(x, y, z)
	{
		return new Matrix3D([
		         			x,0,0,0,
		         			0,y,0,0,
		         			0,0,z,0,
		         			0,0,0,1
		         			]);
	};	
	
	/*
	 * Matrix3D.create
	 * Creates a new instance of a Matrix3D using the default array type
	 * Any javascript array containing at least 16 numeric elements can serve as a Matrix3D
	 *
	 * Params:
	 * mat - Optional, Matrix3D containing values to initialize with
	 *
	 * Returns:
	 * New Matrix3D
	 */
	Matrix3D.create = function(mat) {
		var dest = [1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];
		
		if(mat) {
			dest[0] = mat[0];
			dest[1] = mat[1];
			dest[2] = mat[2];
			dest[3] = mat[3];
			dest[4] = mat[4];
			dest[5] = mat[5];
			dest[6] = mat[6];
			dest[7] = mat[7];
			dest[8] = mat[8];
			dest[9] = mat[9];
			dest[10] = mat[10];
			dest[11] = mat[11];
			dest[12] = mat[12];
			dest[13] = mat[13];
			dest[14] = mat[14];
			dest[15] = mat[15];
		}
		
		return dest;
	};
	
	/*
	 * Matrix3D.set
	 * Copies the values of one Matrix3D to another
	 *
	 * Params:
	 * mat - Matrix3D containing values to copy
	 * dest - Matrix3D receiving copied values
	 *
	 * Returns:
	 * dest
	 */
	Matrix3D.set = function(mat, dest) {
		dest[0] = mat[0];
		dest[1] = mat[1];
		dest[2] = mat[2];
		dest[3] = mat[3];
		dest[4] = mat[4];
		dest[5] = mat[5];
		dest[6] = mat[6];
		dest[7] = mat[7];
		dest[8] = mat[8];
		dest[9] = mat[9];
		dest[10] = mat[10];
		dest[11] = mat[11];
		dest[12] = mat[12];
		dest[13] = mat[13];
		dest[14] = mat[14];
		dest[15] = mat[15];
		return dest;
	};
	
	/*
	 * Matrix3D.identity
	 * Sets a Matrix3D to an identity matrix
	 *
	 * Params:
	 * dest - Matrix3D to set
	 *
	 * Returns:
	 * dest
	 */
	Matrix3D.identity = function(dest) {
		dest[0] = 1;
		dest[1] = 0;
		dest[2] = 0;
		dest[3] = 0;
		dest[4] = 0;
		dest[5] = 1;
		dest[6] = 0;
		dest[7] = 0;
		dest[8] = 0;
		dest[9] = 0;
		dest[10] = 1;
		dest[11] = 0;
		dest[12] = 0;
		dest[13] = 0;
		dest[14] = 0;
		dest[15] = 1;
		return dest;
	};
	
	/*
	 * Matrix3D.transpose
	 * Transposes a Matrix3D (flips the values over the diagonal)
	 *
	 * Params:
	 * mat - Matrix3D to transpose
	 * dest - Optional, Matrix3D receiving transposed values. If not specified result is written to mat
	 *
	 * Returns:
	 * dest is specified, mat otherwise
	 */
	Matrix3D.transpose = function(mat, dest) {
		// If we are transposing ourselves we can skip a few steps but have to cache some values
		if(!dest || mat == dest) { 
			var a01 = mat[1], a02 = mat[2], a03 = mat[3];
			var a12 = mat[6], a13 = mat[7];
			var a23 = mat[11];
			
			mat[1] = mat[4];
			mat[2] = mat[8];
			mat[3] = mat[12];
			mat[4] = a01;
			mat[6] = mat[9];
			mat[7] = mat[13];
			mat[8] = a02;
			mat[9] = a12;
			mat[11] = mat[14];
			mat[12] = a03;
			mat[13] = a13;
			mat[14] = a23;
			return mat;
		}
		
		dest[0] = mat[0];
		dest[1] = mat[4];
		dest[2] = mat[8];
		dest[3] = mat[12];
		dest[4] = mat[1];
		dest[5] = mat[5];
		dest[6] = mat[9];
		dest[7] = mat[13];
		dest[8] = mat[2];
		dest[9] = mat[6];
		dest[10] = mat[10];
		dest[11] = mat[14];
		dest[12] = mat[3];
		dest[13] = mat[7];
		dest[14] = mat[11];
		dest[15] = mat[15];
		return dest;
	};
	
	/*
	 * Matrix3D.determinant
	 * Calculates the determinant of a Matrix3D
	 *
	 * Params:
	 * mat - Matrix3D to calculate determinant of
	 *
	 * Returns:
	 * determinant of mat
	 */
	Matrix3D.determinant = function(mat) {
		// Cache the matrix values (makes for huge speed increases!)
		var a00 = mat[0], a01 = mat[1], a02 = mat[2], a03 = mat[3];
		var a10 = mat[4], a11 = mat[5], a12 = mat[6], a13 = mat[7];
		var a20 = mat[8], a21 = mat[9], a22 = mat[10], a23 = mat[11];
		var a30 = mat[12], a31 = mat[13], a32 = mat[14], a33 = mat[15];
	
		return	a30*a21*a12*a03 - a20*a31*a12*a03 - a30*a11*a22*a03 + a10*a31*a22*a03 +
				a20*a11*a32*a03 - a10*a21*a32*a03 - a30*a21*a02*a13 + a20*a31*a02*a13 +
				a30*a01*a22*a13 - a00*a31*a22*a13 - a20*a01*a32*a13 + a00*a21*a32*a13 +
				a30*a11*a02*a23 - a10*a31*a02*a23 - a30*a01*a12*a23 + a00*a31*a12*a23 +
				a10*a01*a32*a23 - a00*a11*a32*a23 - a20*a11*a02*a33 + a10*a21*a02*a33 +
				a20*a01*a12*a33 - a00*a21*a12*a33 - a10*a01*a22*a33 + a00*a11*a22*a33;
	};
	
	/*
	 * Matrix3D.inverse
	 * Calculates the inverse matrix of a Matrix3D
	 *
	 * Params:
	 * mat - Matrix3D to calculate inverse of
	 * dest - Optional, Matrix3D receiving inverse matrix. If not specified result is written to mat
	 *
	 * Returns:
	 * dest is specified, mat otherwise
	 */
	Matrix3D.inverse = function(mat, dest) {
		if(!dest) { dest = mat; }
		
		// Cache the matrix values (makes for huge speed increases!)
		var a00 = mat[0], a01 = mat[1], a02 = mat[2], a03 = mat[3];
		var a10 = mat[4], a11 = mat[5], a12 = mat[6], a13 = mat[7];
		var a20 = mat[8], a21 = mat[9], a22 = mat[10], a23 = mat[11];
		var a30 = mat[12], a31 = mat[13], a32 = mat[14], a33 = mat[15];
		
		var b00 = a00*a11 - a01*a10;
		var b01 = a00*a12 - a02*a10;
		var b02 = a00*a13 - a03*a10;
		var b03 = a01*a12 - a02*a11;
		var b04 = a01*a13 - a03*a11;
		var b05 = a02*a13 - a03*a12;
		var b06 = a20*a31 - a21*a30;
		var b07 = a20*a32 - a22*a30;
		var b08 = a20*a33 - a23*a30;
		var b09 = a21*a32 - a22*a31;
		var b10 = a21*a33 - a23*a31;
		var b11 = a22*a33 - a23*a32;
		
		// Calculate the determinant (inlined to avoid double-caching)
		var invDet = 1/(b00*b11 - b01*b10 + b02*b09 + b03*b08 - b04*b07 + b05*b06);
		
		dest[0] = (a11*b11 - a12*b10 + a13*b09)*invDet;
		dest[1] = (-a01*b11 + a02*b10 - a03*b09)*invDet;
		dest[2] = (a31*b05 - a32*b04 + a33*b03)*invDet;
		dest[3] = (-a21*b05 + a22*b04 - a23*b03)*invDet;
		dest[4] = (-a10*b11 + a12*b08 - a13*b07)*invDet;
		dest[5] = (a00*b11 - a02*b08 + a03*b07)*invDet;
		dest[6] = (-a30*b05 + a32*b02 - a33*b01)*invDet;
		dest[7] = (a20*b05 - a22*b02 + a23*b01)*invDet;
		dest[8] = (a10*b10 - a11*b08 + a13*b06)*invDet;
		dest[9] = (-a00*b10 + a01*b08 - a03*b06)*invDet;
		dest[10] = (a30*b04 - a31*b02 + a33*b00)*invDet;
		dest[11] = (-a20*b04 + a21*b02 - a23*b00)*invDet;
		dest[12] = (-a10*b09 + a11*b07 - a12*b06)*invDet;
		dest[13] = (a00*b09 - a01*b07 + a02*b06)*invDet;
		dest[14] = (-a30*b03 + a31*b01 - a32*b00)*invDet;
		dest[15] = (a20*b03 - a21*b01 + a22*b00)*invDet;
		
		return dest;
	};
	
	/*
	 * Matrix3D.toRotationMat
	 * Copies the upper 3x3 elements of a Matrix3D into another Matrix3D
	 *
	 * Params:
	 * mat - Matrix3D containing values to copy
	 * dest - Optional, Matrix3D receiving copied values
	 *
	 * Returns:
	 * dest is specified, a new Matrix3D otherwise
	 */
	Matrix3D.toRotationMat = function(mat, dest) {
		if(!dest) { dest = Matrix3D.create(); }
		
		dest[0] = mat[0];
		dest[1] = mat[1];
		dest[2] = mat[2];
		dest[3] = mat[3];
		dest[4] = mat[4];
		dest[5] = mat[5];
		dest[6] = mat[6];
		dest[7] = mat[7];
		dest[8] = mat[8];
		dest[9] = mat[9];
		dest[10] = mat[10];
		dest[11] = mat[11];
		dest[12] = 0;
		dest[13] = 0;
		dest[14] = 0;
		dest[15] = 1;
		
		return dest;
	};
	
	/*
	 * Matrix3D.toMat3
	 * Copies the upper 3x3 elements of a Matrix3D into a mat3
	 *
	 * Params:
	 * mat - Matrix3D containing values to copy
	 * dest - Optional, mat3 receiving copied values
	 *
	 * Returns:
	 * dest is specified, a new mat3 otherwise
	 */
	Matrix3D.toMat3 = function(mat, dest) {
		if(!dest) { dest = [1,0,0,0,1,0,0,0,1] }
		
		dest[0] = mat[0];
		dest[1] = mat[1];
		dest[2] = mat[2];
		dest[3] = mat[4];
		dest[4] = mat[5];
		dest[5] = mat[6];
		dest[6] = mat[8];
		dest[7] = mat[9];
		dest[8] = mat[10];
		
		return dest;
	};
	
	/*
	 * Matrix3D.toInverseMat3
	 * Calculates the inverse of the upper 3x3 elements of a Matrix3D and copies the result into a mat3
	 * The resulting matrix is useful for calculating transformed normals
	 *
	 * Params:
	 * mat - Matrix3D containing values to invert and copy
	 * dest - Optional, mat3 receiving values
	 *
	 * Returns:
	 * dest is specified, a new mat3 otherwise
	 */
	Matrix3D.toInverseMat3 = function(mat, dest) {
		// Cache the matrix values (makes for huge speed increases!)
		var a00 = mat[0], a01 = mat[1], a02 = mat[2];
		var a10 = mat[4], a11 = mat[5], a12 = mat[6];
		var a20 = mat[8], a21 = mat[9], a22 = mat[10];
		
		var b01 = a22*a11-a12*a21;
		var b11 = -a22*a10+a12*a20;
		var b21 = a21*a10-a11*a20;
			
		var d = a00*b01 + a01*b11 + a02*b21;
		if (!d) { return null; }
		var id = 1/d;
		
		if(!dest) { dest = mat3.create(); }
		
		dest[0] = b01*id;
		dest[1] = (-a22*a01 + a02*a21)*id;
		dest[2] = (a12*a01 - a02*a11)*id;
		dest[3] = b11*id;
		dest[4] = (a22*a00 - a02*a20)*id;
		dest[5] = (-a12*a00 + a02*a10)*id;
		dest[6] = b21*id;
		dest[7] = (-a21*a00 + a01*a20)*id;
		dest[8] = (a11*a00 - a01*a10)*id;
		
		return dest;
	};
	
	/*
	 * Matrix3D.multiply
	 * Performs a matrix multiplication
	 *
	 * Params:
	 * mat - Matrix3D, first operand
	 * mat2 - Matrix3D, second operand
	 * dest - Optional, Matrix3D receiving operation result. If not specified result is written to mat
	 *
	 * Returns:
	 * dest if specified, mat otherwise
	 */
	Matrix3D.multiply = function(mat, mat2, dest) {
		if(!dest) { dest = mat; }
		
		// Cache the matrix values (makes for huge speed increases!)
		var a00 = mat[0], a01 = mat[1], a02 = mat[2], a03 = mat[3];
		var a10 = mat[4], a11 = mat[5], a12 = mat[6], a13 = mat[7];
		var a20 = mat[8], a21 = mat[9], a22 = mat[10], a23 = mat[11];
		var a30 = mat[12], a31 = mat[13], a32 = mat[14], a33 = mat[15];
		
		var b00 = mat2[0], b01 = mat2[1], b02 = mat2[2], b03 = mat2[3];
		var b10 = mat2[4], b11 = mat2[5], b12 = mat2[6], b13 = mat2[7];
		var b20 = mat2[8], b21 = mat2[9], b22 = mat2[10], b23 = mat2[11];
		var b30 = mat2[12], b31 = mat2[13], b32 = mat2[14], b33 = mat2[15];
		
		dest[0] = b00*a00 + b01*a10 + b02*a20 + b03*a30;
		dest[1] = b00*a01 + b01*a11 + b02*a21 + b03*a31;
		dest[2] = b00*a02 + b01*a12 + b02*a22 + b03*a32;
		dest[3] = b00*a03 + b01*a13 + b02*a23 + b03*a33;
		dest[4] = b10*a00 + b11*a10 + b12*a20 + b13*a30;
		dest[5] = b10*a01 + b11*a11 + b12*a21 + b13*a31;
		dest[6] = b10*a02 + b11*a12 + b12*a22 + b13*a32;
		dest[7] = b10*a03 + b11*a13 + b12*a23 + b13*a33;
		dest[8] = b20*a00 + b21*a10 + b22*a20 + b23*a30;
		dest[9] = b20*a01 + b21*a11 + b22*a21 + b23*a31;
		dest[10] = b20*a02 + b21*a12 + b22*a22 + b23*a32;
		dest[11] = b20*a03 + b21*a13 + b22*a23 + b23*a33;
		dest[12] = b30*a00 + b31*a10 + b32*a20 + b33*a30;
		dest[13] = b30*a01 + b31*a11 + b32*a21 + b33*a31;
		dest[14] = b30*a02 + b31*a12 + b32*a22 + b33*a32;
		dest[15] = b30*a03 + b31*a13 + b32*a23 + b33*a33;
		
		return dest;
	};
	
	/*
	 * Matrix3D.multiplyVec3
	 * Transforms a vec3 with the given matrix
	 * 4th vector component is implicitly '1'
	 *
	 * Params:
	 * mat - Matrix3D to transform the vector with
	 * vec - vec3 to transform
	 * dest - Optional, vec3 receiving operation result. If not specified result is written to vec
	 *
	 * Returns:
	 * dest if specified, vec otherwise
	 */
	Matrix3D.multiplyVec3 = function(mat, vec, dest) {
		if(!dest) { dest = vec; }
		
		var x = vec[0], y = vec[1], z = vec[2];
		
		dest[0] = mat[0]*x + mat[4]*y + mat[8]*z + mat[12];
		dest[1] = mat[1]*x + mat[5]*y + mat[9]*z + mat[13];
		dest[2] = mat[2]*x + mat[6]*y + mat[10]*z + mat[14];
		
		return dest;
	};
	
	/*
	 * Matrix3D.multiplyVec4
	 * Transforms a vec4 with the given matrix
	 *
	 * Params:
	 * mat - Matrix3D to transform the vector with
	 * vec - vec4 to transform
	 * dest - Optional, vec4 receiving operation result. If not specified result is written to vec
	 *
	 * Returns:
	 * dest if specified, vec otherwise
	 */
	Matrix3D.multiplyVec4 = function(mat, vec, dest) {
		if(!dest) { dest = vec; }
		
		var x = vec[0], y = vec[1], z = vec[2], w = vec[3];
		
		dest[0] = mat[0]*x + mat[4]*y + mat[8]*z + mat[12]*w;
		dest[1] = mat[1]*x + mat[5]*y + mat[9]*z + mat[13]*w;
		dest[2] = mat[2]*x + mat[6]*y + mat[10]*z + mat[14]*w;
		dest[4] = mat[4]*x + mat[7]*y + mat[11]*z + mat[15]*w;
		
		return dest;
	};
	
	/*
	 * Matrix3D.translate
	 * Translates a matrix by the given vector
	 *
	 * Params:
	 * mat - Matrix3D to translate
	 * vec - vec3 specifying the translation
	 * dest - Optional, Matrix3D receiving operation result. If not specified result is written to mat
	 *
	 * Returns:
	 * dest if specified, mat otherwise
	 */
	Matrix3D.translate = function(mat, vec, dest) {
		var x = vec[0], y = vec[1], z = vec[2];
		
		if(!dest || mat == dest) {
			mat[12] = mat[0]*x + mat[4]*y + mat[8]*z + mat[12];
			mat[13] = mat[1]*x + mat[5]*y + mat[9]*z + mat[13];
			mat[14] = mat[2]*x + mat[6]*y + mat[10]*z + mat[14];
			mat[15] = mat[3]*x + mat[7]*y + mat[11]*z + mat[15];
			return mat;
		}
		
		var a00 = mat[0], a01 = mat[1], a02 = mat[2], a03 = mat[3];
		var a10 = mat[4], a11 = mat[5], a12 = mat[6], a13 = mat[7];
		var a20 = mat[8], a21 = mat[9], a22 = mat[10], a23 = mat[11];
		
		dest[0] = a00;
		dest[1] = a01;
		dest[2] = a02;
		dest[3] = a03;
		dest[4] = a10;
		dest[5] = a11;
		dest[6] = a12;
		dest[7] = a13;
		dest[8] = a20;
		dest[9] = a21;
		dest[10] = a22;
		dest[11] = a23;
		
		dest[12] = a00*x + a10*y + a20*z + mat[12];
		dest[13] = a01*x + a11*y + a21*z + mat[13];
		dest[14] = a02*x + a12*y + a22*z + mat[14];
		dest[15] = a03*x + a13*y + a23*z + mat[15];
		return dest;
	};
	
	/*
	 * Matrix3D.scale
	 * Scales a matrix by the given vector
	 *
	 * Params:
	 * mat - Matrix3D to scale
	 * vec - vec3 specifying the scale for each axis
	 * dest - Optional, Matrix3D receiving operation result. If not specified result is written to mat
	 *
	 * Returns:
	 * dest if specified, mat otherwise
	 */
	Matrix3D.scale = function(mat, vec, dest) {
		var x = vec[0], y = vec[1], z = vec[2];
		
		if(!dest || mat == dest) {
			mat[0] *= x;
			mat[1] *= x;
			mat[2] *= x;
			mat[3] *= x;
			mat[4] *= y;
			mat[5] *= y;
			mat[6] *= y;
			mat[7] *= y;
			mat[8] *= z;
			mat[9] *= z;
			mat[10] *= z;
			mat[11] *= z;
			return mat;
		}
		
		dest[0] = mat[0]*x;
		dest[1] = mat[1]*x;
		dest[2] = mat[2]*x;
		dest[3] = mat[3]*x;
		dest[4] = mat[4]*y;
		dest[5] = mat[5]*y;
		dest[6] = mat[6]*y;
		dest[7] = mat[7]*y;
		dest[8] = mat[8]*z;
		dest[9] = mat[9]*z;
		dest[10] = mat[10]*z;
		dest[11] = mat[11]*z;
		dest[12] = mat[12];
		dest[13] = mat[13];
		dest[14] = mat[14];
		dest[15] = mat[15];
		return dest;
	};
	
	/*
	 * Matrix3D.rotate
	 * Rotates a matrix by the given angle around the specified axis
	 * If rotating around a primary axis (X,Y,Z) one of the specialized rotation functions should be used instead for performance
	 *
	 * Params:
	 * mat - Matrix3D to rotate
	 * angle - angle (in radians) to rotate
	 * axis - vec3 representing the axis to rotate around 
	 * dest - Optional, Matrix3D receiving operation result. If not specified result is written to mat
	 *
	 * Returns:
	 * dest if specified, mat otherwise
	 */
	Matrix3D.rotate = function(mat, angle, axis, dest) {
		var x = axis[0], y = axis[1], z = axis[2];
		var len = Math.sqrt(x*x + y*y + z*z);
		if (!len) { return null; }
		if (len != 1) {
			len = 1 / len;
			x *= len; 
			y *= len; 
			z *= len;
		}
		
		var s = Math.sin(angle);
		var c = Math.cos(angle);
		var t = 1-c;
		
		// Cache the matrix values (makes for huge speed increases!)
		var a00 = mat[0], a01 = mat[1], a02 = mat[2], a03 = mat[3];
		var a10 = mat[4], a11 = mat[5], a12 = mat[6], a13 = mat[7];
		var a20 = mat[8], a21 = mat[9], a22 = mat[10], a23 = mat[11];
		
		// Construct the elements of the rotation matrix
		var b00 = x*x*t + c, b01 = y*x*t + z*s, b02 = z*x*t - y*s;
		var b10 = x*y*t - z*s, b11 = y*y*t + c, b12 = z*y*t + x*s;
		var b20 = x*z*t + y*s, b21 = y*z*t - x*s, b22 = z*z*t + c;
		
		if(!dest) { 
			dest = mat; 
		} else if(mat != dest) { // If the source and destination differ, copy the unchanged last row
			dest[12] = mat[12];
			dest[13] = mat[13];
			dest[14] = mat[14];
			dest[15] = mat[15];
		}
		
		// Perform rotation-specific matrix multiplication
		dest[0] = a00*b00 + a10*b01 + a20*b02;
		dest[1] = a01*b00 + a11*b01 + a21*b02;
		dest[2] = a02*b00 + a12*b01 + a22*b02;
		dest[3] = a03*b00 + a13*b01 + a23*b02;
		
		dest[4] = a00*b10 + a10*b11 + a20*b12;
		dest[5] = a01*b10 + a11*b11 + a21*b12;
		dest[6] = a02*b10 + a12*b11 + a22*b12;
		dest[7] = a03*b10 + a13*b11 + a23*b12;
		
		dest[8] = a00*b20 + a10*b21 + a20*b22;
		dest[9] = a01*b20 + a11*b21 + a21*b22;
		dest[10] = a02*b20 + a12*b21 + a22*b22;
		dest[11] = a03*b20 + a13*b21 + a23*b22;
		return dest;
	};
	
	/*
	 * Matrix3D.rotateX
	 * Rotates a matrix by the given angle around the X axis
	 *
	 * Params:
	 * mat - Matrix3D to rotate
	 * angle - angle (in radians) to rotate
	 * dest - Optional, Matrix3D receiving operation result. If not specified result is written to mat
	 *
	 * Returns:
	 * dest if specified, mat otherwise
	 */
	Matrix3D.rotateX = function(mat, angle, dest) {
		var s = Math.sin(angle);
		var c = Math.cos(angle);
		
		// Cache the matrix values (makes for huge speed increases!)
		var a10 = mat[4], a11 = mat[5], a12 = mat[6], a13 = mat[7];
		var a20 = mat[8], a21 = mat[9], a22 = mat[10], a23 = mat[11];
	
		if(!dest) { 
			dest = mat; 
		} else if(mat != dest) { // If the source and destination differ, copy the unchanged rows
			dest[0] = mat[0];
			dest[1] = mat[1];
			dest[2] = mat[2];
			dest[3] = mat[3];
			
			dest[12] = mat[12];
			dest[13] = mat[13];
			dest[14] = mat[14];
			dest[15] = mat[15];
		}
		
		// Perform axis-specific matrix multiplication
		dest[4] = a10*c + a20*s;
		dest[5] = a11*c + a21*s;
		dest[6] = a12*c + a22*s;
		dest[7] = a13*c + a23*s;
		
		dest[8] = a10*-s + a20*c;
		dest[9] = a11*-s + a21*c;
		dest[10] = a12*-s + a22*c;
		dest[11] = a13*-s + a23*c;
		return dest;
	};
	
	/*
	 * Matrix3D.rotateY
	 * Rotates a matrix by the given angle around the Y axis
	 *
	 * Params:
	 * mat - Matrix3D to rotate
	 * angle - angle (in radians) to rotate
	 * dest - Optional, Matrix3D receiving operation result. If not specified result is written to mat
	 *
	 * Returns:
	 * dest if specified, mat otherwise
	 */
	Matrix3D.rotateY = function(mat, angle, dest) {
		var s = Math.sin(angle);
		var c = Math.cos(angle);
		
		// Cache the matrix values (makes for huge speed increases!)
		var a00 = mat[0], a01 = mat[1], a02 = mat[2], a03 = mat[3];
		var a20 = mat[8], a21 = mat[9], a22 = mat[10], a23 = mat[11];
		
		if(!dest) { 
			dest = mat; 
		} else if(mat != dest) { // If the source and destination differ, copy the unchanged rows
			dest[4] = mat[4];
			dest[5] = mat[5];
			dest[6] = mat[6];
			dest[7] = mat[7];
			
			dest[12] = mat[12];
			dest[13] = mat[13];
			dest[14] = mat[14];
			dest[15] = mat[15];
		}
		
		// Perform axis-specific matrix multiplication
		dest[0] = a00*c + a20*-s;
		dest[1] = a01*c + a21*-s;
		dest[2] = a02*c + a22*-s;
		dest[3] = a03*c + a23*-s;
		
		dest[8] = a00*s + a20*c;
		dest[9] = a01*s + a21*c;
		dest[10] = a02*s + a22*c;
		dest[11] = a03*s + a23*c;
		return dest;
	};
	
	/*
	 * Matrix3D.rotateZ
	 * Rotates a matrix by the given angle around the Z axis
	 *
	 * Params:
	 * mat - Matrix3D to rotate
	 * angle - angle (in radians) to rotate
	 * dest - Optional, Matrix3D receiving operation result. If not specified result is written to mat
	 *
	 * Returns:
	 * dest if specified, mat otherwise
	 */
	Matrix3D.rotateZ = function(mat, angle, dest) {
		var s = Math.sin(angle);
		var c = Math.cos(angle);
		
		// Cache the matrix values (makes for huge speed increases!)
		var a00 = mat[0], a01 = mat[1], a02 = mat[2], a03 = mat[3];
		var a10 = mat[4], a11 = mat[5], a12 = mat[6], a13 = mat[7];
		
		if(!dest) { 
			dest = mat; 
		} else if(mat != dest) { // If the source and destination differ, copy the unchanged last row
			dest[8] = mat[8];
			dest[9] = mat[9];
			dest[10] = mat[10];
			dest[11] = mat[11];
			
			dest[12] = mat[12];
			dest[13] = mat[13];
			dest[14] = mat[14];
			dest[15] = mat[15];
		}
		
		// Perform axis-specific matrix multiplication
		dest[0] = a00*c + a10*s;
		dest[1] = a01*c + a11*s;
		dest[2] = a02*c + a12*s;
		dest[3] = a03*c + a13*s;
		
		dest[4] = a00*-s + a10*c;
		dest[5] = a01*-s + a11*c;
		dest[6] = a02*-s + a12*c;
		dest[7] = a03*-s + a13*c;
		
		return dest;
	};
	
	/*
	 * Matrix3D.frustum
	 * Generates a frustum matrix with the given bounds
	 *
	 * Params:
	 * left, right - scalar, left and right bounds of the frustum
	 * bottom, top - scalar, bottom and top bounds of the frustum
	 * near, far - scalar, near and far bounds of the frustum
	 * dest - Optional, Matrix3D frustum matrix will be written into
	 *
	 * Returns:
	 * dest if specified, a new Matrix3D otherwise
	 */
	Matrix3D.frustum = function(left, right, bottom, top, near, far, dest) {
		if(!dest) { dest = Matrix3D.create(); }
		var rl = (right - left);
		var tb = (top - bottom);
		var fn = (far - near);
		dest[0] = (near*2) / rl;
		dest[1] = 0;
		dest[2] = 0;
		dest[3] = 0;
		dest[4] = 0;
		dest[5] = (near*2) / tb;
		dest[6] = 0;
		dest[7] = 0;
		dest[8] = (right + left) / rl;
		dest[9] = (top + bottom) / tb;
		dest[10] = -(far + near) / fn;
		dest[11] = -1;
		dest[12] = 0;
		dest[13] = 0;
		dest[14] = -(far*near*2) / fn;
		dest[15] = 0;
		return dest;
	};
	
	/*
	 * Matrix3D.perspective
	 * Generates a perspective projection matrix with the given bounds
	 *
	 * Params:
	 * fovy - scalar, vertical field of view
	 * aspect - scalar, aspect ratio. typically viewport width/height
	 * near, far - scalar, near and far bounds of the frustum
	 * dest - Optional, Matrix3D frustum matrix will be written into
	 *
	 * Returns:
	 * dest if specified, a new Matrix3D otherwise
	 */
	Matrix3D.perspective = function(fovy, aspect, near, far, dest) {
		var top = near*Math.tan(fovy*Math.PI / 360.0);
		var right = top*aspect;
		return Matrix3D.frustum(-right, right, -top, top, near, far, dest);
	};
	
	/*
	 * Matrix3D.ortho
	 * Generates a orthogonal projection matrix with the given bounds
	 *
	 * Params:
	 * left, right - scalar, left and right bounds of the frustum
	 * bottom, top - scalar, bottom and top bounds of the frustum
	 * near, far - scalar, near and far bounds of the frustum
	 * dest - Optional, Matrix3D frustum matrix will be written into
	 *
	 * Returns:
	 * dest if specified, a new Matrix3D otherwise
	 */
	Matrix3D.ortho = function(left, right, bottom, top, near, far, dest) {
		if(!dest) { dest = Matrix3D.create(); }
		var rl = (right - left);
		var tb = (top - bottom);
		var fn = (far - near);
		dest[0] = 2 / rl;
		dest[1] = 0;
		dest[2] = 0;
		dest[3] = 0;
		dest[4] = 0;
		dest[5] = 2 / tb;
		dest[6] = 0;
		dest[7] = 0;
		dest[8] = 0;
		dest[9] = 0;
		dest[10] = -2 / fn;
		dest[11] = 0;
		dest[12] = -(left + right) / rl;
		dest[13] = -(top + bottom) / tb;
		dest[14] = -(far + near) / fn;
		dest[15] = 1;
		return dest;
	};
	
	/*
	 * Matrix3D.ortho
	 * Generates a look-at matrix with the given eye position, focal point, and up axis
	 *
	 * Params:
	 * eye - vec3, position of the viewer
	 * center - vec3, point the viewer is looking at
	 * up - vec3 pointing "up"
	 * dest - Optional, Matrix3D frustum matrix will be written into
	 *
	 * Returns:
	 * dest if specified, a new Matrix3D otherwise
	 */
	Matrix3D.lookAt = function(eye, center, up, dest) {
		if(!dest) { dest = Matrix3D.create(); }
		
		var eyex = eye[0],
			eyey = eye[1],
			eyez = eye[2],
			upx = up[0],
			upy = up[1],
			upz = up[2],
			centerx = center[0],
			centery = center[1],
			centerz = center[2];
	
		if (eyex == centerx && eyey == centery && eyez == centerz) {
			return Matrix3D.identity(dest);
		}
		
		var z0,z1,z2,x0,x1,x2,y0,y1,y2,len;
		
		//vec3.direction(eye, center, z);
		z0 = eyex - center[0];
		z1 = eyey - center[1];
		z2 = eyez - center[2];
		
		// normalize (no check needed for 0 because of early return)
		len = 1/Math.sqrt(z0*z0 + z1*z1 + z2*z2);
		z0 *= len;
		z1 *= len;
		z2 *= len;
		
		//vec3.normalize(vec3.cross(up, z, x));
		x0 = upy*z2 - upz*z1;
		x1 = upz*z0 - upx*z2;
		x2 = upx*z1 - upy*z0;
		len = Math.sqrt(x0*x0 + x1*x1 + x2*x2);
		if (!len) {
			x0 = 0;
			x1 = 0;
			x2 = 0;
		} else {
			len = 1/len;
			x0 *= len;
			x1 *= len;
			x2 *= len;
		};
		
		//vec3.normalize(vec3.cross(z, x, y));
		y0 = z1*x2 - z2*x1;
		y1 = z2*x0 - z0*x2;
		y2 = z0*x1 - z1*x0;
		
		len = Math.sqrt(y0*y0 + y1*y1 + y2*y2);
		if (!len) {
			y0 = 0;
			y1 = 0;
			y2 = 0;
		} else {
			len = 1/len;
			y0 *= len;
			y1 *= len;
			y2 *= len;
		}
		
		dest[0] = x0;
		dest[1] = y0;
		dest[2] = z0;
		dest[3] = 0;
		dest[4] = x1;
		dest[5] = y1;
		dest[6] = z1;
		dest[7] = 0;
		dest[8] = x2;
		dest[9] = y2;
		dest[10] = z2;
		dest[11] = 0;
		dest[12] = -(x0*eyex + x1*eyey + x2*eyez);
		dest[13] = -(y0*eyex + y1*eyey + y2*eyez);
		dest[14] = -(z0*eyex + z1*eyey + z2*eyez);
		dest[15] = 1;
		
		return dest;
	};
	
	Matrix3D.decompose = function(  matrix )
	{
		// Normalize the matrix.
		if (matrix[15] == 0) return false

		for (var i = 0; i < 16; i++) matrix[i] /= matrix[15];

		// perspectiveMatrix is used to solve for perspective, but it also provides
		// an easy way to test for singularity of the upper 3x3 component.
		var perspectiveMatrix = Matrix3D.create(matrix);

		for (i = 0; i < 3; i++)
			perspectiveMatrix[i*4+3] = 0;

		perspectiveMatrix[15] = 1;

		if (Matrix3D.determinant(perspectiveMatrix) == 0)
			return false;
		
		var rightHandSide = [];
		var perspective = [0,0,0,1];
		var translate =  new qlib.Vector3();
		var row = [ new qlib.Vector3(), new qlib.Vector3(), new qlib.Vector3()];
		var scale = new qlib.Vector3();
		var skew = new qlib.Vector3();
		// First, isolate perspective.
		if (matrix[3] != 0 || matrix[7] != 0 || matrix[11] != 0)
		{
			// rightHandSide is the right hand side of the equation.
			rightHandSide[0] = matrix[3]
			rightHandSide[1] = matrix[7]
			rightHandSide[2] = matrix[11]
			rightHandSide[3] = matrix[15]

			// Solve the equation by inverting perspectiveMatrix and multiplying
			// rightHandSide by the inverse.
			var inversePerspectiveMatrix = Matrix3D.inverse(perspectiveMatrix);
			var transposedInversePerspectiveMatrix = new qlib.Matrix3D();
			Matrix3D.transpose(inversePerspectiveMatrix, transposedInversePerspectiveMatrix);
			
			Matrix3D.multiplyVec4(transposedInversePerspectiveMatrix, rightHandSide, perspective)
		} 
		// Next take care of translation
		translate.x = matrix[12];
		translate.y = matrix[13];
		translate.z = matrix[14];
		

		// Now get scale and shear. 'row' is a 3 element array of 3 component vectors
		
		row[0].x   = matrix[0];
		row[0].y   = matrix[1];
		row[0].z   = matrix[2];
		
		row[1].x   = matrix[4];
		row[1].y   = matrix[5];
		row[1].z   = matrix[6];
		
		row[2].x   = matrix[8];
		row[2].y   = matrix[9];
		row[2].z   = matrix[10];

		// Compute X scale factor and normalize first row.
		scale.x = row[0].length();
		row[0].normalize();

		// Compute XY shear factor and make 2nd row orthogonal to 1st.
		skew.x= row[0].dot(row[1]);
		row[1] = combine(row[1], row[0], 1.0, -skew.x)

		// Now, compute Y scale and normalize 2nd row.
		scale.y = row[1].length()
		row[1].normalize()
		skew[0] /= scale[1];

		// Compute XZ and YZ shears, orthogonalize 3rd row
		skew.y = row[0].dot(row[2]);
		row[2] = combine(row[2], row[0], 1.0, -skew.y)
		skew.z = row[1].dot(row[2]);
		row[2] = combine(row[2], row[1], 1.0, -skew.z)

		// Next, get Z scale and normalize 3rd row.
		scale.z = row[2].length()
		row[2].normalize();
		skew.y /= scale.z;
		skew.z /= scale.z;

		// At this point, the matrix (in rows) is orthonormal.
		// Check for a coordinate system flip.  If the determinant
		// is -1, then negate the matrix and the scaling factors.
		var pdum3 = row[1].cross(row[2])
		if ( row[0].dot( pdum3) < 0)
		{
			for (i = 0; i < 3; i++)
			{
				scale[i] *= -1;
				row[i*4+0] *= -1
				row[i*4+1] *= -1
				row[i*4+2] *= -1
			}
		}
		// Now, get the rotations out
		quaternion[0] = 0.5 * Math.sqrt(max(1 + row[0][0] - row[1][1] - row[2][2], 0))
		quaternion[1] = 0.5 * Math.sqrt(max(1 - row[0][0] + row[1][1] - row[2][2], 0))
		quaternion[2] = 0.5 * Math.sqrt(max(1 - row[0][0] - row[1][1] + row[2][2], 0))
		quaternion[3] = 0.5 * Math.sqrt(max(1 + row[0][0] + row[1][1] + row[2][2], 0))

		if (row[2*4+1] > row[1][2])
			quaternion[0] = -quaternion[0]
		if (row[0*4+2] > row[2][0])
			quaternion[1] = -quaternion[1]
		if (row[1*4+0] > row[0][1])
			quaternion[2] = -quaternion[2]

		return true
	}
	
	  this.combine = function(aPoint, ascl, bscl) {
			return new Vector4( (ascl * this.x) + (bscl * aPoint.x), 
													(ascl * this.y) + (bscl * aPoint.y), 
													(ascl * this.z) + (bscl * aPoint.z) );
	}
	
	/*
	 * Matrix3D.str
	 * Returns a string representation of a Matrix3D
	 *
	 * Params:
	 * mat - Matrix3D to represent as a string
	 *
	 * Returns:
	 * string representation of mat
	 */
	Matrix3D.str = function(mat) {
		return '[' + mat[0] + ', ' + mat[1] + ', ' + mat[2] + ', ' + mat[3] + 
			', '+ mat[4] + ', ' + mat[5] + ', ' + mat[6] + ', ' + mat[7] + 
			', '+ mat[8] + ', ' + mat[9] + ', ' + mat[10] + ', ' + mat[11] + 
			', '+ mat[12] + ', ' + mat[13] + ', ' + mat[14] + ', ' + mat[15] + ']';
	};
	
	qlib.Matrix3D = Matrix3D;
	
})();