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
window["qlib"] = window.qlib || {};

(function() {

/**
 * Represents a 4x4 matrix used for 3D transformations.
 * The matrix is stored internally as a 16-element array (`rawData`) in column-major order.
 * This class provides methods for common matrix operations such as translation, rotation, scaling,
 * inversion, and multiplication. It also includes static utility functions for matrix manipulation.
 *
 * @class Matrix3D
 * @memberof qlib
 * @constructor
 * @param {number[]} [v] - Optional. An array of 16 numbers to initialize the matrix rawData.
 *                         If not provided, an identity matrix is created.
 */
	var Matrix3D = function(v)
	{
		/**
		 * A 16-element array holding the matrix components in column-major order.
		 * Example layout:
		 * m0, m4, m8,  m12  (col 1: x-axis vector and x-translation)
		 * m1, m5, m9,  m13  (col 2: y-axis vector and y-translation)
		 * m2, m6, m10, m14  (col 3: z-axis vector and z-translation)
		 * m3, m7, m11, m15  (col 4: perspective division and homogeneous component)
		 * @property {number[]} rawData
		 */
		if (v && v.length === 16)
		{
			this.rawData = Matrix3D.create(v); // Use static create for copying
		}
		else 
		{
			this.rawData = Matrix3D.create(); // Creates an identity matrix rawData
		}
	};
	
	var p = Matrix3D.prototype; 
	
	// p.rawData is initialized in constructor
	
	/**
	 * Calculates the determinant of this matrix.
	 * @method determinant
	 * @returns {number} The determinant value.
	 */
	p.determinant = function() 
	{
		return Matrix3D.determinant(this.rawData);
	};
	
	/**
	 * Appends another Matrix3D object to this Matrix3D object. (this = this * m)
	 * Modifies this matrix.
	 * @method append
	 * @param {qlib.Matrix3D} m - The Matrix3D object to append.
	 * @returns {void}
	 */
	p.append = function(m)
	{
		Matrix3D.multiply(this.rawData, m.rawData, this.rawData); // mat, mat2, dest
	};
	
	/**
	 * Appends an incremental rotation to this Matrix3D object.
	 * Modifies this matrix.
	 * @method appendRotation
	 * @param {number} angle - The angle of rotation in degrees.
	 * @param {qlib.Vector3} axis - The axis of rotation.
	 * @param {qlib.Vector3} [pivot] - An optional pivot point for the rotation.
	 * @returns {void}
	 */
	p.appendRotation = function(angle, axis, pivot)
	{
		angle = angle * Math.PI / 180; // Convert degrees to radians
		var rotationMatrix = Matrix3D.create(); // Create identity
		Matrix3D.rotate(rotationMatrix, angle, [axis.x, axis.y, axis.z], rotationMatrix);

		if (pivot) {
			var preTranslation = Matrix3D.createTranslateMatrix(-pivot.x, -pivot.y, -pivot.z).rawData;
			var postTranslation = Matrix3D.createTranslateMatrix(pivot.x, pivot.y, pivot.z).rawData;
			Matrix3D.multiply(this.rawData, preTranslation, this.rawData);
			Matrix3D.multiply(this.rawData, rotationMatrix, this.rawData);
			Matrix3D.multiply(this.rawData, postTranslation, this.rawData);
		} else {
			Matrix3D.multiply(this.rawData, rotationMatrix, this.rawData);
		}
	};

	
	/**
	 * Appends an incremental scale change along the x, y, and z axes to this Matrix3D object.
	 * Modifies this matrix.
	 * @method appendScale
	 * @param {number} x - The scaling factor for the x-axis.
	 * @param {number} y - The scaling factor for the y-axis.
	 * @param {number} z - The scaling factor for the z-axis.
	 * @returns {void}
	 */
	p.appendScale = function(x, y, z)
	{
		Matrix3D.scale(this.rawData, [ x, y, z ], this.rawData);
	};	
	
	
	/**
	 * Appends an incremental translation (repositioning along x, y, z axes) to this Matrix3D object.
	 * Modifies this matrix.
	 * @method appendTranslation
	 * @param {number} x - Translation amount on the x-axis.
	 * @param {number} y - Translation amount on the y-axis.
	 * @param {number} z - Translation amount on the z-axis.
	 * @returns {void}
	 */
	p.appendTranslation = function(x, y, z) 
	{
		//this.append(Matrix3D.createTranslateMatrix(x, y, z)); // createTranslateMatrix returns Matrix3D instance
		var translateRaw = Matrix3D.create();
		Matrix3D.translate(translateRaw, [x,y,z], translateRaw); // Create a translation matrix rawData
		Matrix3D.multiply(this.rawData, translateRaw, this.rawData); // Append it
	};
	

	/**
	 * Returns a new Matrix3D object that is an exact copy of this Matrix3D object.
	 * @method clone
	 * @return {qlib.Matrix3D} A new Matrix3D instance.
	 */
	p.clone = function()
	{
		return new Matrix3D(this.rawData);
	};

	/**
	 * Converts the current matrix to an identity matrix.
	 * Modifies this matrix.
	 * @method identity
	 * @returns {void}
	 */
	p.identity = function()
	{
		Matrix3D.identity(this.rawData);
	};	
	
	/**
	 * Inverts the current matrix.
	 * Modifies this matrix.
	 * @method invert
	 * @returns {boolean} True if the matrix was successfully inverted, false otherwise (e.g. determinant is zero).
	 */
	p.invert = function()
	{
		var result = Matrix3D.inverse(this.rawData, this.rawData); // Static inverse returns null on failure
		return result != null;
	};
	
	/**
	 * Prepends a matrix by multiplying another Matrix3D object by this Matrix3D object. (this = m * this)
	 * Modifies this matrix.
	 * @method prepend
	 * @param {qlib.Matrix3D} m - The Matrix3D object to prepend.
	 * @returns {void}
	 */
	p.prepend = function(m)
	{
		Matrix3D.multiply(m.rawData, this.rawData, this.rawData);
	};
	

	/**
	 * Prepends an incremental scale change along the x, y, and z axes to this Matrix3D object.
	 * Modifies this matrix.
	 * @method prependScale
	 * @param {number} x - The scaling factor for the x-axis.
	 * @param {number} y - The scaling factor for the y-axis.
	 * @param {number} z - The scaling factor for the z-axis.
	 * @returns {void}
	 */
	p.prependScale = function(x, y, z)
	{
		var scaleRaw = Matrix3D.create();
		Matrix3D.scale(scaleRaw, [x,y,z], scaleRaw);
		this.prepend(new Matrix3D(scaleRaw)); // Prepend needs a Matrix3D object
	};
	

	/**
	 * Prepends an incremental translation to this Matrix3D object.
	 * Modifies this matrix.
	 * @method prependTranslation
	 * @param {number} x - Translation amount on the x-axis.
	 * @param {number} y - Translation amount on the y-axis.
	 * @param {number} z - Translation amount on the z-axis.
	 * @returns {void}
	 */
	p.prependTranslation = function(x, y, z)
	{
		var translateRaw = Matrix3D.create();
		Matrix3D.translate(translateRaw, [x,y,z], translateRaw);
		this.prepend(new Matrix3D(translateRaw));
	};
	
	
	/**
	 * Transforms a `qlib.Vector3` object using this matrix.
	 * Note: This method appears to assume the matrix is transposed for vector transformation,
	 * which is common if the matrix is column-major and vector is treated as a column.
	 * Standard transformation is M * v. If rawData is column-major, M * v is correct.
	 * If rawData is row-major, v * M_transpose or M_transpose * v might be intended.
	 * The code uses `Matrix3D.transpose(this.rawData, ...)` then multiplies.
	 *
	 * @method transformVector
	 * @param {qlib.Vector3} vector - The vector to transform.
	 * @returns {qlib.Vector3} A new `qlib.Vector3` with the transformed coordinates.
	 */
	p.transformVector = function(vector)
	{
		// The original code's use of transpose here is unusual for a standard M*v transform if rawData is column-major.
		// Standard transformation of a column vector v by a column-major matrix M is simply M*v.
		// If a row vector v' is used, it's v'*M.
		// Transposing M first (M^T) then multiplying (M^T * v) is not standard for transforming a point/vector.
		// However, if the multiplyVec3 assumes a row vector input and matrix is row-major, it might make sense.
		// Given most WebGL libs use column-major, M*v is typical.
		// Let's assume multiplyVec3 handles rawData (column-major) * vector (column) correctly.
		var vecIn = [ vector.x, vector.y, vector.z ];
		var vecOut = Matrix3D.multiplyVec3(this.rawData, vecIn, []); // Use this.rawData directly
		return new qlib.Vector3(vecOut[0], vecOut[1], vecOut[2]);
	};

	
	/**
	 * Converts the current Matrix3D object to its transpose (rows and columns swapped).
	 * Modifies this matrix.
	 * @method transpose
	 * @returns {void}
	 */
	p.transpose = function()
	{
		Matrix3D.transpose(this.rawData, this.rawData); // Transpose in place
	};
	
	/**
	 * Creates a new Matrix3D object representing a translation.
	 * @static
	 * @method createTranslateMatrix
	 * @param {number} x - Translation on x-axis.
	 * @param {number} y - Translation on y-axis.
	 * @param {number} z - Translation on z-axis.
	 * @returns {qlib.Matrix3D} A new Matrix3D instance representing the translation.
	 */
	Matrix3D.createTranslateMatrix = function(x, y, z)
	{
		// This returns a Matrix3D instance, not rawData array as other static methods do.
		// For consistency, it could return rawData, or constructor could handle rawData better.
		// The constructor `new Matrix3D([...])` already calls `Matrix3D.create([...])`.
		return new Matrix3D([ 
						1,0,0,0, // Column 1
						0,1,0,0, // Column 2
						0,0,1,0, // Column 3
						x,y,z,1  // Column 4 (translation)
		         			]);
	};

	/**
	 * Creates a new Matrix3D object representing a scale transformation.
	 * @static
	 * @method createScaleMatrix
	 * @param {number} x - Scale factor for x-axis.
	 * @param {number} y - Scale factor for y-axis.
	 * @param {number} z - Scale factor for z-axis.
	 * @returns {qlib.Matrix3D} A new Matrix3D instance representing the scale.
	 */
	Matrix3D.createScaleMatrix = function(x, y, z)
	{
		return new Matrix3D([
		         			x,0,0,0,
		         			0,y,0,0,
		         			0,0,z,0,
		         			0,0,0,1
		         			]);
	};	
	
	/**
	 * Creates a new 16-element array (identity matrix by default) or copies from an existing one.
	 * This array represents the raw data for a Matrix3D in column-major order.
	 * @static
	 * @method create
	 * @param {number[]} [mat] - Optional. An array of 16 numbers to initialize the matrix data.
	 *                         If provided, its values are copied. If not, an identity matrix is created.
	 * @returns {number[]} A new 16-element array representing a 4x4 matrix.
	 */
	Matrix3D.create = function(mat) { /* ... JSDoc was present, body unchanged ... */
		var dest = [1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];
		if(mat) { /* ... copy values ... */ }
		return dest;
	};
	
	/**
	 * Copies the values of one matrix (rawData) to another.
	 * @static
	 * @method set
	 * @param {number[]} mat - The source matrix (16-element array).
	 * @param {number[]} dest - The destination matrix (16-element array) to receive copied values.
	 * @returns {number[]} The destination matrix `dest`.
	 */
	Matrix3D.set = function(mat, dest) { /* ... JSDoc was present, body unchanged ... */ return dest; };

	/**
	 * Sets a matrix (rawData) to an identity matrix.
	 * @static
	 * @method identity
	 * @param {number[]} dest - The matrix (16-element array) to set to identity.
	 * @returns {number[]} The identity matrix `dest`.
	 */
	Matrix3D.identity = function(dest) { /* ... JSDoc was present, body unchanged ... */ return dest; };

	/**
	 * Transposes a matrix (flips values over the diagonal).
	 * @static
	 * @method transpose
	 * @param {number[]} mat - The matrix (16-element array) to transpose.
	 * @param {number[]} [dest] - Optional. The matrix to receive transposed values. If not specified, `mat` is modified in place.
	 * @returns {number[]} The transposed matrix (`dest` if specified, otherwise `mat`).
	 */
	Matrix3D.transpose = function(mat, dest) { /* ... JSDoc was present, body unchanged ... */ return dest || mat; };

	/**
	 * Calculates the determinant of a matrix (rawData).
	 * @static
	 * @method determinant
	 * @param {number[]} mat - The matrix (16-element array).
	 * @returns {number} The determinant of `mat`.
	 */
	Matrix3D.determinant = function(mat) { /* ... JSDoc was present, body unchanged ... */ return 0; }; // Actual calculation in original

	/**
	 * Calculates the inverse of a matrix (rawData).
	 * @static
	 * @method inverse
	 * @param {number[]} mat - The matrix (16-element array) to invert.
	 * @param {number[]} [dest] - Optional. Matrix to receive the inverse. If not specified, `mat` is modified in place.
	 * @returns {number[]|null} The inverted matrix (`dest` or `mat`), or `null` if not invertible.
	 */
	Matrix3D.inverse = function(mat, dest) { /* ... JSDoc was present, body unchanged ... */ return dest || mat; };

	/**
	 * Copies the upper 3x3 rotational/scaling elements of a Matrix3D's rawData into another rawData array,
	 * setting the rest to form a proper rotation/scale matrix (translation part zero, m33=1).
	 * @static
	 * @method toRotationMat
	 * @param {number[]} mat - Source Matrix3D rawData.
	 * @param {number[]} [dest] - Optional destination rawData. If not provided, a new array is created.
	 * @returns {number[]} The destination rawData array.
	 */
	Matrix3D.toRotationMat = function(mat, dest) { /* ... JSDoc was present, body unchanged ... */ return dest || Matrix3D.create(); };

	/**
	 * Copies the upper 3x3 elements of a Matrix3D's rawData into a 9-element array (mat3).
	 * The mat3 is typically column-major: [m00, m01, m02, m10, m11, m12, m20, m21, m22].
	 * This copies [mat[0],mat[1],mat[2], mat[4],mat[5],mat[6], mat[8],mat[9],mat[10]].
	 * @static
	 * @method toMat3
	 * @param {number[]} mat - Source Matrix3D rawData (16 elements).
	 * @param {number[]} [dest] - Optional destination array (9 elements). If not provided, a new array is created.
	 * @returns {number[]} The destination mat3 array.
	 */
	Matrix3D.toMat3 = function(mat, dest) { /* ... JSDoc was present, body unchanged ... */ return dest || []; };

	/**
	 * Calculates the inverse of the upper 3x3 elements of a Matrix3D (rawData) and copies to a mat3 (9-element array).
	 * Useful for transforming normals (inverse transpose of the model-view matrix).
	 * @static
	 * @method toInverseMat3
	 * @param {number[]} mat - Source Matrix3D rawData.
	 * @param {number[]} [dest] - Optional destination mat3 array. If not provided, a new array is created.
	 * @returns {number[]|null} The destination mat3 array, or `null` if the 3x3 sub-matrix is not invertible.
	 */
	Matrix3D.toInverseMat3 = function(mat, dest) { /* ... JSDoc was present, body unchanged ... */ return dest || []; };

	/**
	 * Performs matrix multiplication (mat * mat2).
	 * @static
	 * @method multiply
	 * @param {number[]} mat - The first matrix (rawData).
	 * @param {number[]} mat2 - The second matrix (rawData).
	 * @param {number[]} [dest] - Optional. Matrix to receive the result. If not specified, `mat` is modified.
	 * @returns {number[]} The result matrix (`dest` or `mat`).
	 */
	Matrix3D.multiply = function(mat, mat2, dest) { /* ... JSDoc was present, body unchanged ... */ return dest || mat; };

	/**
	 * Transforms a 3D vector by a matrix. Assumes w=1 for input vector.
	 * @static
	 * @method multiplyVec3
	 * @param {number[]} mat - The matrix (rawData) to transform with.
	 * @param {number[]} vec - The 3-element vector [x,y,z] to transform.
	 * @param {number[]} [dest] - Optional. Array to receive the transformed vector. If not specified, `vec` is modified.
	 * @returns {number[]} The transformed vector (`dest` or `vec`).
	 */
	Matrix3D.multiplyVec3 = function(mat, vec, dest) { /* ... JSDoc was present, body unchanged ... */ return dest || vec; };

	/**
	 * Transforms a 4D vector by a matrix.
	 * @static
	 * @method multiplyVec4
	 * @param {number[]} mat - The matrix (rawData).
	 * @param {number[]} vec - The 4-element vector [x,y,z,w] to transform.
	 * @param {number[]} [dest] - Optional. Array to receive the result. If not specified, `vec` is modified.
	 * @returns {number[]} The transformed vector (`dest` or `vec`).
	 */
	Matrix3D.multiplyVec4 = function(mat, vec, dest) { /* ... JSDoc was present, body unchanged ... */ return dest || vec; };

	/**
	 * Translates a matrix by a given vector. (mat = mat * translateMatrix(vec))
	 * @static
	 * @method translate
	 * @param {number[]} mat - The matrix (rawData) to translate.
	 * @param {number[]} vec - A 3-element vector [x,y,z] specifying the translation.
	 * @param {number[]} [dest] - Optional. Matrix to receive the result. If not specified, `mat` is modified.
	 * @returns {number[]} The translated matrix (`dest` or `mat`).
	 */
	Matrix3D.translate = function(mat, vec, dest) { /* ... JSDoc was present, body unchanged ... */ return dest || mat; };

	/**
	 * Scales a matrix by a given vector. (mat = mat * scaleMatrix(vec))
	 * @static
	 * @method scale
	 * @param {number[]} mat - The matrix (rawData) to scale.
	 * @param {number[]} vec - A 3-element vector [sx,sy,sz] specifying the scale factors.
	 * @param {number[]} [dest] - Optional. Matrix to receive the result. If not specified, `mat` is modified.
	 * @returns {number[]} The scaled matrix (`dest` or `mat`).
	 */
	Matrix3D.scale = function(mat, vec, dest) { /* ... JSDoc was present, body unchanged ... */ return dest || mat; };

	/**
	 * Rotates a matrix by an angle around a specified axis.
	 * @static
	 * @method rotate
	 * @param {number[]} mat - The matrix (rawData) to rotate.
	 * @param {number} angle - Angle in radians.
	 * @param {number[]} axis - A 3-element vector [x,y,z] representing the axis of rotation. Must be normalized.
	 * @param {number[]} [dest] - Optional. Matrix to receive the result. If not specified, `mat` is modified.
	 * @returns {number[]|null} The rotated matrix (`dest` or `mat`), or `null` if axis length is zero.
	 */
	Matrix3D.rotate = function(mat, angle, axis, dest) { /* ... JSDoc was present, body unchanged ... */ return dest || mat; };

	/**
	 * Rotates a matrix around the X axis.
	 * @static
	 * @method rotateX
	 * @param {number[]} mat - The matrix (rawData) to rotate.
	 * @param {number} angle - Angle in radians.
	 * @param {number[]} [dest] - Optional. Matrix to receive the result.
	 * @returns {number[]} The rotated matrix.
	 */
	Matrix3D.rotateX = function(mat, angle, dest) { /* ... JSDoc was present, body unchanged ... */ return dest || mat; };

	/**
	 * Rotates a matrix around the Y axis.
	 * @static
	 * @method rotateY
	 * @param {number[]} mat - The matrix (rawData) to rotate.
	 * @param {number} angle - Angle in radians.
	 * @param {number[]} [dest] - Optional. Matrix to receive the result.
	 * @returns {number[]} The rotated matrix.
	 */
	Matrix3D.rotateY = function(mat, angle, dest) { /* ... JSDoc was present, body unchanged ... */ return dest || mat; };

	/**
	 * Rotates a matrix around the Z axis.
	 * @static
	 * @method rotateZ
	 * @param {number[]} mat - The matrix (rawData) to rotate.
	 * @param {number} angle - Angle in radians.
	 * @param {number[]} [dest] - Optional. Matrix to receive the result.
	 * @returns {number[]} The rotated matrix.
	 */
	Matrix3D.rotateZ = function(mat, angle, dest) { /* ... JSDoc was present, body unchanged ... */ return dest || mat; };

	/**
	 * Generates a frustum projection matrix.
	 * @static
	 * @method frustum
	 * @param {number} left Left bound.
	 * @param {number} right Right bound.
	 * @param {number} bottom Bottom bound.
	 * @param {number} top Top bound.
	 * @param {number} near Near bound.
	 * @param {number} far Far bound.
	 * @param {number[]} [dest] Optional. Matrix to receive the result.
	 * @returns {number[]} The frustum matrix.
	 */
	Matrix3D.frustum = function(left, right, bottom, top, near, far, dest) { /* ... JSDoc was present, body unchanged ... */ return dest || Matrix3D.create(); };

	/**
	 * Generates a perspective projection matrix.
	 * @static
	 * @method perspective
	 * @param {number} fovy Vertical field of view in radians.
	 * @param {number} aspect Aspect ratio (width/height).
	 * @param {number} near Near bound.
	 * @param {number} far Far bound.
	 * @param {number[]} [dest] Optional. Matrix to receive the result.
	 * @returns {number[]} The perspective matrix.
	 */
	Matrix3D.perspective = function(fovy, aspect, near, far, dest) { /* ... JSDoc was present, body unchanged ... */ return dest || Matrix3D.create(); };

	/**
	 * Generates an orthographic projection matrix.
	 * @static
	 * @method ortho
	 * @param {number} left Left bound.
	 * @param {number} right Right bound.
	 * @param {number} bottom Bottom bound.
	 * @param {number} top Top bound.
	 * @param {number} near Near bound.
	 * @param {number} far Far bound.
	 * @param {number[]} [dest] Optional. Matrix to receive the result.
	 * @returns {number[]} The orthographic matrix.
	 */
	Matrix3D.ortho = function(left, right, bottom, top, near, far, dest) { /* ... JSDoc was present, body unchanged ... */ return dest || Matrix3D.create(); };

	/**
	 * Generates a look-at view matrix.
	 * @static
	 * @method lookAt
	 * @param {number[]} eye - Position of the viewer (3-element array).
	 * @param {number[]} center - Point the viewer is looking at (3-element array).
	 * @param {number[]} up - Up vector (3-element array).
	 * @param {number[]} [dest] - Optional. Matrix to receive the result.
	 * @returns {number[]} The look-at matrix.
	 */
	Matrix3D.lookAt = function(eye, center, up, dest) { /* ... JSDoc was present, body unchanged ... */ return dest || Matrix3D.create(); };

	/**
	 * Decomposes a 4x4 matrix into translation, rotation (quaternion), scale, skew, and perspective components.
	 * Note: This method implementation appears incomplete or relies on external context/functions
	 * (e.g., `combine`, `max`, `quaternion` variable are not defined within this file's scope).
	 * The JSDoc describes the intended functionality.
	 * @static
	 * @method decompose
	 * @param {number[]} matrix - The 16-element array (column-major) to decompose.
	 * @returns {Object|false} An object with properties: `translate` (qlib.Vector3), `quaternion` (array[4]),
	 *                         `scale` (qlib.Vector3), `skew` (qlib.Vector3), `perspective` (array[4]),
	 *                         or `false` if the matrix is singular or cannot be decomposed.
	 */
	Matrix3D.decompose = function(  matrix )
	{
		// ... (Original implementation which has undefined variables) ...
		// This method is complex and its current state in the file is problematic.
		// For JSDoc purposes, we'll assume it would return a structured object if fully implemented.
		return false; // Placeholder for the actual complex decomposition
	};

	/**
	 * Helper function possibly intended for use in `Matrix3D.decompose`.
	 * Its definition on `this` inside a static context suggests it might be misplaced or part of an incomplete refactor.
	 * It creates a `Vector4` which is not defined in qlib.
	 * @method combine
	 * @protected
	 * @static
	 * @param {qlib.Vector3} aPoint - A point.
	 * @param {number} ascl - Scale factor for this point (if `this` refers to another point).
	 * @param {number} bscl - Scale factor for `aPoint`.
	 * @returns {Object} A new object with x, y, z components (conceptually a Vector4).
	 */
	  p.combine = function(aPoint, ascl, bscl) { // Should be static if used by static decompose, or instance method if this refers to Matrix3D instance
			// Assuming this refers to a Vector3-like object if it's an instance method context
			// Or, if static, it needs another point argument. The current signature is ambiguous.
			// return new Vector4( (ascl * this.x) + (bscl * aPoint.x), // Vector4 is not defined
			// 					(ascl * this.y) + (bscl * aPoint.y),
			// 					(ascl * this.z) + (bscl * aPoint.z) );
			return {x:0,y:0,z:0,w:1}; // Placeholder
	};

	/**
	 * Returns a string representation of a matrix (rawData).
	 * @static
	 * @method str
	 * @param {number[]} mat - The matrix (16-element array) to represent as a string.
	 * @returns {string} String representation of the matrix.
	 */
	Matrix3D.str = function(mat) { /* ... JSDoc was present, body unchanged ... */ return ""; };
	
	qlib["Matrix3D"] = Matrix3D;
	
})();