/*
* Function Patch
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
 * Represents a Coons-like patch where the surface (or set of values) is defined by four boundary functions.
 * Each function takes a parameter `t` (from 0 to 1) and returns either a single number
 * or an array of numbers. If arrays are returned, all functions must return arrays of the same length.
 * The patch interpolates these boundary values to generate a grid of values or vectors.
 *
 * Boundary function parameterization:
 * - `function_top(u)`: `u` from 0 (left) to 1 (right).
 * - `function_bottom(u)`: `u` from 0 (left) to 1 (right).
 * - `function_left(v)`: `v` from 0 (bottom) to 1 (top).
 * - `function_right(v)`: `v` from 0 (bottom) to 1 (top).
 *
 * @class FunctionPatch
 * @memberof qlib
 * @param {function(number): (number|number[])} function_top - Function defining the top boundary.
 * @param {function(number): (number|number[])} function_right - Function defining the right boundary.
 * @param {function(number): (number|number[])} function_bottom - Function defining the bottom boundary.
 * @param {function(number): (number|number[])} function_left - Function defining the left boundary.
 * @throws {Error} If boundary functions return arrays of different lengths.
 */
	var FunctionPatch = function( function_top,function_right,function_bottom,function_left ) {
	  this.initialize( function_top,function_right,function_bottom,function_left );
	}

	var p = FunctionPatch.prototype;


	// public properties:
	/**
	 * The type of this geometric shape.
	 * @property {string} type
	 * @default "FunctionPatch"
	 */
	p.type = "FunctionPatch";

	/**
	 * Function defining the top boundary. Takes `u` [0,1] (left to right), returns number or number array.
	 * @property {function(number): (number|number[])} function_top
	 */
	p.function_top = null;
	/**
	 * Function defining the right boundary. Takes `v` [0,1] (bottom to top), returns number or number array.
	 * @property {function(number): (number|number[])} function_right
	 */
	p.function_right = null;
	/**
	 * Function defining the bottom boundary. Takes `u` [0,1] (left to right), returns number or number array.
	 * @property {function(number): (number|number[])} function_bottom
	 */
	p.function_bottom = null;
	/**
	 * Function defining the left boundary. Takes `v` [0,1] (bottom to top), returns number or number array.
	 * @property {function(number): (number|number[])} function_left
	 */
	p.function_left = null;
		
	/**
	 * Initializes the FunctionPatch with its four boundary functions.
	 * It checks if the functions return arrays and if their lengths are consistent.
	 * If they return arrays, `this.getMesh` is dynamically reassigned to `this._getMeshAsArray`.
	 *
	 * @method initialize
	 * @protected
	 * @param {function(number): (number|number[])} function_top
	 * @param {function(number): (number|number[])} function_right
	 * @param {function(number): (number|number[])} function_bottom
	 * @param {function(number): (number|number[])} function_left
	 * @returns {void}
	 * @throws {Error} If boundary functions return arrays of different lengths.
	 */
	p.initialize = function(function_top,function_right,function_bottom,function_left)
	{
		this.function_top = function_top;
		this.function_right = function_right;
		this.function_bottom = function_bottom;
		this.function_left = function_left;

		var testVal = this.function_top(0); // Call one function to check its return type
		if ( testVal instanceof Array )
		{
			var len = testVal.length;
			// Verify all other functions also return arrays of the same length
			if ( !(this.function_right(0) instanceof Array && this.function_right(0).length === len &&
			       this.function_bottom(0) instanceof Array && this.function_bottom(0).length === len &&
			       this.function_left(0) instanceof Array && this.function_left(0).length === len) )
			{
				throw("FunctionPatch: provided boundary functions return arrays of different length or mixed types!");
			}
			this.getMesh = this._getMeshAsArray; // Switch to array-based mesh generation
		}
		// If not arrays, this.getMesh remains the default scalar version.
	}
	
	/**
	 * Generates a grid of interpolated scalar values from the patch.
	 * This version is used when boundary functions return single numbers.
	 * The interpolation formula is a Coons patch variant:
	 * P(u,v) = (1-v)Fb(u) + v*Ft(u) + (1-u)Fl(v) + u*Fr(v) - [(1-u)(1-v)P00 + u(1-v)P10 + (1-u)vP01 + uvP11]
	 * where P00 etc., are corner values derived from averages of function values at corners.
	 * Note: The implementation uses `v` for bottom and `(1-v)` for top terms.
	 *
	 * @method getMesh
	 * @param {number} cols - Number of columns in the grid (steps for u). Must be >= 2.
	 * @param {number} rows - Number of rows in the grid (steps for v). Must be >= 2.
	 * @returns {{cols: number, rows: number, values: number[]}} An object containing grid dimensions
	 *                                                            and a flat array of interpolated scalar values, row by row.
	 */
	p.getMesh = function( cols, rows )
	{
		if (cols < 2 || rows < 2) throw new Error("FunctionPatch.getMesh: cols and rows must be 2 or greater.");
		var baseStep_x = 1 / (cols-1);
		var baseStep_y = 1 / (rows-1);
		var values = [];
		
		// Corner values - these are specific to this implementation's Coons formula.
		// Standard Coons uses f(0,0), f(1,0), f(0,1), f(1,1) directly if available,
		// or derives them from boundary curve endpoints. Here, averages are used.
		var p00 = (this.function_bottom(0) + this.function_left(0)) * 0.5; // Avg of Fb(0) and Fl(0)
		var p10 = (this.function_bottom(1) + this.function_right(0)) * 0.5; // Avg of Fb(1) and Fr(0)
		var p01 = (this.function_top(0) + this.function_left(1)) * 0.5;    // Avg of Ft(0) and Fl(1)
		var p11 = (this.function_top(1) + this.function_right(1)) * 0.5;   // Avg of Ft(1) and Fr(1)
		
		var u_param, iu, iv, val_bottom_u, val_top_u, val_left_v, val_right_v;
		var v_param = 0;
		
		for ( var y_idx = 0; y_idx < rows; y_idx++ )
		{
			iv = 1 - v_param; // (1-v)
			val_left_v = this.function_left(v_param);   // Fl(v)
			val_right_v = this.function_right(v_param); // Fr(v)

			u_param = 0;
			for ( var x_idx = 0; x_idx < cols; x_idx++ )
			{
				iu = 1 - u_param; // (1-u)
				// The original code for scalar getMesh had pu0=top, pu1=bottom.
				// For consistency with Coons formula (1-v)Bottom + vTop, let's use:
				val_bottom_u = this.function_bottom(u_param); // Fb(u)
				val_top_u = this.function_top(u_param);       // Ft(u)
			
				// Formula: (1-v)Fb(u) + vFt(u) + (1-u)Fl(v) + uFr(v) - bilinear_terms
				values.push( iv * val_bottom_u + v_param * val_top_u + iu * val_left_v + u_param * val_right_v
							 - (iu * iv * p00 + u_param * iv * p10 + iu * v_param * p01 + u_param * v_param * p11) );
			
				u_param += baseStep_x;
			}
			v_param += baseStep_y;
		}
		return { cols:cols, rows:rows, values:values};
	}
	
	/**
	 * Generates a grid of interpolated arrays of values from the patch.
	 * This version is used when boundary functions return arrays of numbers.
	 * The interpolation is applied element-wise to the arrays.
	 * The Coons formula structure is similar to the scalar `getMesh`.
	 *
	 * @method _getMeshAsArray
	 * @protected
	 * @param {number} cols - Number of columns in the grid. Must be >= 2.
	 * @param {number} rows - Number of rows in the grid. Must be >= 2.
	 * @returns {{cols: number, rows: number, values: Array<number[]>}} An object containing grid dimensions
	 *                                                                 and an array of interpolated number arrays.
	 */
	p._getMeshAsArray = function( cols, rows )
	{
		if (cols < 2 || rows < 2) throw new Error("FunctionPatch._getMeshAsArray: cols and rows must be 2 or greater.");
		var baseStep_x = 1 / (cols-1);
		var baseStep_y = 1 / (rows-1);
		var result_values = [];
		var ft = this.function_top;
		var fb = this.function_bottom;
		var fl = this.function_left;
		var fr = this.function_right;
		
		// Evaluate functions at corners
		var ft0 = ft(0); var ft1 = ft(1);
		var fl0 = fl(0); var fl1 = fl(1); // fl(0) is bottom-left end of left curve, fl(1) is top-left end
		var fb0 = fb(0); var fb1 = fb(1);
		var fr0 = fr(0); var fr1 = fr(1); // fr(0) is bottom-right end of right curve, fr(1) is top-right end
		var arr_len = ft0.length;

		// Calculate averaged corner values for each element of the arrays
		var p00 = [], p10 = [], p01 = [], p11 = [];
		for (var i = 0; i < arr_len; i++) {
			p00[i] = (fb0[i] + fl0[i]) * 0.5; // Avg of Bottom(0) and Left(0)
			p10[i] = (fb1[i] + fr0[i]) * 0.5; // Avg of Bottom(1) and Right(0)
			p01[i] = (ft0[i] + fl1[i]) * 0.5; // Avg of Top(0) and Left(1)
			p11[i] = (ft1[i] + fr1[i]) * 0.5; // Avg of Top(1) and Right(1)
		}
		
		var u_param, iu, iv, arr_bottom_u, arr_top_u, arr_left_v, arr_right_v;
		var v_param = 0;
		
		for ( var y_idx = 0; y_idx < rows; y_idx++ )
		{
			iv = 1 - v_param; // (1-v)
			arr_left_v = fl(v_param);   // Fl(v)
			arr_right_v = fr(v_param);  // Fr(v)

			u_param = 0;
			for ( var x_idx = 0; x_idx < cols; x_idx++ )
			{
				iu = 1 - u_param; // (1-u)
				arr_bottom_u = fb(u_param); // Fb(u)
				arr_top_u = ft(u_param);    // Ft(u)

				var current_p_array = [];
				for ( i = 0; i < arr_len; i++ ) // Element-wise Coons interpolation
				{
					current_p_array[i] = iv * arr_bottom_u[i] + v_param * arr_top_u[i] +
					                     iu * arr_left_v[i] + u_param * arr_right_v[i] -
					                     (iu * iv * p00[i] + u_param * iv * p10[i] + iu * v_param * p01[i] + u_param * v_param * p11[i]);
				}
				result_values.push(current_p_array);
				u_param += baseStep_x;
			}
			v_param += baseStep_y;
		}
		return { cols:cols, rows:rows, values:result_values};
	}
	
	/**
	 * Calculates an interpolated scalar value on the patch at parameters `u` and `v`.
	 * This method is intended for use when the boundary functions return single numbers.
	 * If boundary functions return arrays, this will likely cause an error or unexpected behavior
	 * as it performs arithmetic operations directly on function return values.
	 *
	 * @method getPoint
	 * @param {number} u - Parameter for the bottom/top dimension (0 to 1, left to right).
	 * @param {number} v - Parameter for the left/right dimension (0 to 1, bottom to top).
	 * @returns {number} The interpolated scalar value at (u,v).
	 */
	p.getPoint = function( u, v )
	{
		var iu = 1 - u;
		var iv = 1 - v;
		
		// Averaged corner values - assumes functions return numbers
		var p00 = (this.function_bottom(0) + this.function_left(0)) * 0.5;
		var p10 = (this.function_bottom(1) + this.function_right(0)) * 0.5;
		var p01 = (this.function_top(0) + this.function_left(1)) * 0.5;
		var p11 = (this.function_top(1) + this.function_right(1)) * 0.5;
		
		var val_bottom_u = this.function_bottom(u); // Fb(u)
		var val_top_u = this.function_top(u);       // Ft(u)
		var val_left_v = this.function_left(v);     // Fl(v)
		var val_right_v = this.function_right(v);   // Fr(v)
		
		// Coons patch formula variant: (1-v)Fb(u) + vFt(u) + (1-u)Fl(v) + uFr(v) - bilinear_terms
		return  iv * val_bottom_u + v_param * val_top_u + iu * val_left_v + u_param * val_right_v
		        - (iu * iv * p00 + u_param * iv * p10 + iu * v_param * p01 + u_param * v_param * p11);
	}
	
	
	/**
	 * Returns a string representation of this FunctionPatch object.
	 * @method toString
	 * @return {string} A string representation of the instance (e.g., "FunctionPatch").
	 */
	p.toString = function()
	{
		return "FunctionPatch";
	}
	
	
	
	qlib["FunctionPatch"] = FunctionPatch;
}());