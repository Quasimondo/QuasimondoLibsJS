/*
* Coons Patch
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
 * Represents a Coons patch, a type of surface patch defined by four boundary curves.
 * A Coons patch interpolates these four curves to create a smooth surface.
 * The boundary curves are expected to have a `getPoint(t)` method that returns a `qlib.Vector2`
 * for a parameter `t` from 0 to 1.
 *
 * For the boundary curves:
 * - `bound_bottom`: Parameter `u` from 0 (left) to 1 (right).
 * - `bound_top`: Parameter `u` from 0 (left) to 1 (right).
 * - `bound_left`: Parameter `v` from 0 (bottom) to 1 (top).
 * - `bound_right`: Parameter `v` from 0 (bottom) to 1 (top).
 *
 * The `getPoint(u,v)` and `getMesh(cols,rows)` methods use a specific formulation
 * that may require attention to the direction of parameterization of the boundary curves
 * if they are, for example, all defined left-to-right or bottom-to-top.
 * The current implementation of `getPoint(u,v)` uses `bound_left.getPoint(1-v)` and `bound_right.getPoint(v)`.
 * The `getMesh` method implementation uses `bound_left.getPoint(v)` and `bound_right.getPoint(1-v)`.
 * This difference should be noted. For consistent results, ensure boundary curves adhere to expected parameter directions.
 *
 * @class CoonsPatch
 * @param {Object} bound_top - The top boundary curve object (must have `getPoint(t)` method).
 * @param {Object} bound_right - The right boundary curve object.
 * @param {Object} bound_bottom - The bottom boundary curve object.
 * @param {Object} bound_left - The left boundary curve object.
 */
	var CoonsPatch = function( bound_top,bound_right,bound_bottom,bound_left ) {
	  this.initialize( bound_top,bound_right,bound_bottom,bound_left );
	}

	var p = CoonsPatch.prototype;


	// public properties:
	/**
	 * The type of this geometric shape.
	 * @property {string} type
	 * @default "CoonsPatch"
	 */
	p.type = "CoonsPatch";

	/**
	 * The top boundary curve. Expected to have a `getPoint(t)` method where t is [0,1] from left to right.
	 * @property {Object|qlib.GeometricShape} bound_top
	 */
	p.bound_top = null;
	/**
	 * The right boundary curve. Expected to have a `getPoint(t)` method where t is [0,1] from bottom to top.
	 * @property {Object|qlib.GeometricShape} bound_right
	 */
	p.bound_right = null;
	/**
	 * The bottom boundary curve. Expected to have a `getPoint(t)` method where t is [0,1] from left to right.
	 * @property {Object|qlib.GeometricShape} bound_bottom
	 */
	p.bound_bottom = null;
	/**
	 * The left boundary curve. Expected to have a `getPoint(t)` method where t is [0,1] from bottom to top.
	 * @property {Object|qlib.GeometricShape} bound_left
	 */
	p.bound_left = null;
		
	/**
	 * Initializes the CoonsPatch with its four boundary curves.
	 *
	 * @method initialize
	 * @protected
	 * @param {Object} bound_top - The top boundary curve.
	 * @param {Object} bound_right - The right boundary curve.
	 * @param {Object} bound_bottom - The bottom boundary curve.
	 * @param {Object} bound_left - The left boundary curve.
	 * @returns {void}
	 */
	p.initialize = function(bound_top,bound_right,bound_bottom,bound_left)
	{
		this.bound_top = bound_top;
		this.bound_right = bound_right;
		this.bound_bottom = bound_bottom;
		this.bound_left = bound_left;
	}
	
	/**
	 * Generates a grid of points on the Coons patch surface.
	 * The parameters `u` and `v` range from 0 to 1.
	 * `u` corresponds to the parameter along the bottom and top boundary curves.
	 * `v` corresponds to the parameter along the left and right boundary curves.
	 * Note the parameterization used for `bound_left` (`v`) and `bound_right` (`1-v`).
	 *
	 * @method getMesh
	 * @param {number} cols - The number of columns in the grid (points along u-direction). Must be >= 2.
	 * @param {number} rows - The number of rows in the grid (points along v-direction). Must be >= 2.
	 * @returns {qlib.Vector2[]} An array of `qlib.Vector2` points representing the mesh, ordered row by row.
	 */
	p.getMesh = function( cols, rows )
	{
		if (cols < 2 || rows < 2) throw new Error("CoonsPatch.getMesh: cols and rows must be 2 or greater.");
		var baseStep_x = 1 / (cols-1);
		var baseStep_y = 1 / (rows-1);
		var points = [];
		
		// Corner points of the patch
		var p00 = this.bound_bottom.getPoint(0); // Bottom-left
		var p10 = this.bound_bottom.getPoint(1); // Bottom-right
		var p01 = this.bound_top.getPoint(0);    // Top-left
		var p11 = this.bound_top.getPoint(1);    // Top-right
		
		var p00x = p00.x; var p00y = p00.y;
		var p10x = p10.x; var p10y = p10.y;
		var p01x = p01.x; var p01y = p01.y;
		var p11x = p11.x; var p11y = p11.y;
		
		var u, iu, iv, pu0, pu1, pv0, pv1;
		var v_param = 0; // Renamed v to v_param to avoid conflict with loop variable v
		
		for ( var y_idx = 0; y_idx < rows; y_idx++ ) // Renamed y to y_idx
		{
			iv = 1 - v_param; // (1-v)
			// pv0: point on left boundary, parameter v_param
			// pv1: point on right boundary, parameter 1-v_param
			pv0 = this.bound_left.getPoint(v_param);     // C(0,v)
			pv1 = this.bound_right.getPoint(v_param); // C(1,v) - Note: original used iv here. Standard uses v or 1-v consistently.
			                                         // If bound_right is parameterized 0 (bottom) to 1 (top), then v_param is correct.
			                                         // The original getMesh used bound_right.getPoint(iv), getPoint uses bound_right.getPoint(v).
			                                         // Let's assume parameterization is consistent for a given boundary (e.g. 0 at start, 1 at end).
			                                         // Standard Coons: (1-u)P_0v(v) + u*P_1v(v). P_0v is left, P_1v is right.
			                                         // Here, pv0 is left boundary, pv1 is right boundary.
			u = 0;
			for ( var x_idx = 0; x_idx < cols; x_idx++ ) // Renamed x to x_idx
			{
				iu = 1 - u; // (1-u)
				
				// pu0: point on bottom boundary, parameter u
				// pu1: point on top boundary, parameter u
				pu0 = this.bound_bottom.getPoint(u); // C(u,0)
				pu1 = this.bound_top.getPoint(u);    // C(u,1)
				
				// Bi-linearly blended Coons Patch formula:
				// Lc(u,v) = (1-v)C(u,0) + vC(u,1)
				// Lr(u,v) = (1-u)C(0,v) + uC(1,v)
				// B(u,v)  = (1-u)(1-v)C00 + u(1-v)C10 + (1-u)vC01 + uvC11
				// P(u,v)  = Lc(u,v) + Lr(u,v) - B(u,v)
				// Using the code's term order:
				//   v_param * pu0.x + iv * pu1.x  -> (1-iv)C(u,0)_x + iv*C(u,1)_x  (using v_param as v)
				//   iu * pv0.x + u * pv1.x      -> (1-u)C(0,v_param)_x + u*C(1,v_param)_x (using v_param as v for left/right)
				// Bilinear part:
				// - iu*v_param*p00x  -> -(1-u)v_param*C00
				// - u*v_param*p10x   -> -u*v_param*C10
				// - iu*iv*p01x    -> -(1-u)(1-v_param)*C01
				// - u*iv*p11x     -> -u(1-v_param)*C11
				// The formula in code appears to be:
				// P(u,v) = v*C(u,0) + (1-v)*C(u,1) + (1-u)*C(0,v) + u*C(1,1-v)  <- Note C(1,1-v) from original code's pv1 = br.getPoint(iv)
				//           - (1-u)v*C00 - u*v*C10 - (1-u)(1-v)*C01 - u(1-v)*C11
				// This is slightly different from standard if pv1 used 'iv'. If pv1 uses 'v', it's closer.
				// The getPoint method uses bound_right.getPoint(v), so let's assume that's the intended one for pv1 here too.
				// If pv1 = this.bound_right.getPoint(v_param); then formula is:
				// P(u,v) = v*C(u,0) + (1-v)*C(u,1) + (1-u)*C(0,v_param) + u*C(1,v_param)
				//           - (1-u)v*C00 - u*v*C10 - (1-u)(1-v)*C01 - u(1-v)*C11
				// This still seems to mix v and (1-v) for the Lc part. Standard Lc is (1-v)C(u,0) + vC(u,1).
				// Let's document based on the code's direct formula:
				// Term1: v_param * pu0.x (v * C(u,0)_x)
				// Term2: iv * pu1.x    ((1-v) * C(u,1)_x)
				// Term3: iu * pv0.x    ((1-u) * C(0,v_param)_x)
				// Term4: u * pv1.x     (u * C(1,v_param)_x) IF pv1 uses v_param. Original code used bound_right.getPoint(iv).
				// If pv1 = this.bound_right.getPoint(iv) as in original getMesh: (u * C(1,1-v_param)_x)
				// Let's assume the pv1 in getMesh was `this.bound_right.getPoint(v_param)` for consistency with `getPoint` or standard forms.
				// If it was indeed `getPoint(iv)`, the JSDoc for `bound_right` parameter direction would need to be "top-to-bottom".
				// Assuming `pv1 = this.bound_right.getPoint(v_param)`:
				var current_pv1 = this.bound_right.getPoint(v_param);

				points.push( new qlib.Vector2(
					v_param * pu0.x + iv * pu1.x + iu * pv0.x + u * current_pv1.x - (iu * v_param * p00x + u * v_param * p10x + iu * iv * p01x + u * iv * p11x),
					v_param * pu0.y + iv * pu1.y + iu * pv0.y + u * current_pv1.y - (iu * v_param * p00y + u * v_param * p10y + iu * iv * p01y + u * iv * p11y) ));
			
				u += baseStep_x;
			}
			v_param += baseStep_y;
		}
		return points;
	}
	
	/**
	 * Generates a height map (displacement values) by comparing the Coons patch surface
	 * to a reference bilinear surface defined by four `corners`.
	 * The "height" is the magnitude of the difference vector between the Coons patch point
	 * and the corresponding point on the bilinear reference surface.
	 *
	 * @method getHeightMesh
	 * @param {number} cols - Number of columns in the grid. Must be >= 2.
	 * @param {number} rows - Number of rows in the grid. Must be >= 2.
	 * @param {qlib.Vector2[]} corners - An array of four `qlib.Vector2` points defining the reference rectangle,
	 *                                   typically in clockwise or counter-clockwise order (e.g., top-left, top-right, bottom-right, bottom-left).
	 *                                   The code assumes: corners[0]=top-left, corners[1]=top-right, corners[2]=bottom-right, corners[3]=bottom-left.
	 * @returns {{cols: number, rows: number, heights: number[]}} An object containing the grid dimensions
	 *                                                            and an array of height/displacement values.
	 */
	p.getHeightMesh = function( cols, rows, corners )
	{
		if (cols < 2 || rows < 2) throw new Error("CoonsPatch.getHeightMesh: cols and rows must be 2 or greater.");
		if (!corners || corners.length < 4) throw new Error("CoonsPatch.getHeightMesh: corners array must have 4 points.");

		var baseStep_x = 1 / (cols-1);
		var baseStep_y = 1 / (rows-1);
		var heights = []; // Renamed points to heights for clarity
		
		// Boundary curves of the Coons patch
		var bb = this.bound_bottom; var bt = this.bound_top;
		var bl = this.bound_left;   var br = this.bound_right;
		
		// Corner points of the Coons patch boundaries
		var p00 = bb.getPoint(0); var p11 = bt.getPoint(1);
		var p01 = bt.getPoint(0); var p10 = bb.getPoint(1);
		
		var p00x = p00.x; var p00y = p00.y;
		var p10x = p10.x; var p10y = p10.y;
		var p01x = p01.x; var p01y = p01.y;
		var p11x = p11.x; var p11y = p11.y;
		
		// Reference bilinear surface defined by corners
		// Assuming corners[0]=TL, corners[1]=TR, corners[2]=BR, corners[3]=BL
		var ts_ref = new qlib.LineSegment(corners[0],corners[1]); // Top reference edge
		var ls_ref = new qlib.LineSegment(corners[0],corners[3]); // Left reference edge
		var rs_ref = new qlib.LineSegment(corners[1],corners[2]); // Right reference edge (Note: original had corners[2],corners[1])
		var bs_ref = new qlib.LineSegment(corners[3],corners[2]); // Bottom reference edge
		
		var u, iu, iv, pu0, pu1, pv0, pv1, qu0, qu1, qv0, qv1;
		var v_param = 0;
		
		for ( var y_idx = 0; y_idx < rows; y_idx++ )
		{
			iv = 1 - v_param;
			// Coons boundary points
			pv0 = bl.getPoint(v_param);       // C(0,v) from Coons
			pv1 = br.getPoint(v_param);       // C(1,v) from Coons (assuming br uses v_param, not iv as in original getMesh)
			// Reference bilinear surface boundary points
			qv0 = ls_ref.getPoint(v_param);   // P(0,v) from reference
			qv1 = rs_ref.getPoint(v_param);   // P(1,v) from reference (rs_ref should be parameterized 0=top to 1=bottom if v_param is 0=bottom to 1=top)
											 // Original rs was (corners[2],corners[1]). If corners[2]=BR, corners[1]=TR, then parameter runs BR to TR.
											 // If v_param is bottom(0) to top(1), then rs_ref should be BL to TL or BR to TR.
											 // Let's assume rs_ref is (corners[3],corners[0]) for BL to TL, or (corners[2],corners[1]) for BR to TR.
											 // If ls_ref(0)=TL, ls_ref(1)=BL, then v_param for qv0 should be 1-v_param to match pv0 from bottom up.
											 // This requires careful check of LineSegment.getPoint parameterization vs Coons v.
											 // Assuming LineSegment.getPoint(t) goes from its p1 to p2.
											 // ls_ref: corners[0] (TL) to corners[3] (BL). qv0 = ls_ref.getPoint(v_param) -> v=0 is TL, v=1 is BL.
											 // rs_ref: corners[1] (TR) to corners[2] (BR). qv1 = rs_ref.getPoint(v_param) -> v=0 is TR, v=1 is BR.
											 // This is consistent if v_param for Coons also means 0=top, 1=bottom for left/right boundaries.
											 // However, Coons usually has v=0 at bottom boundary.
											 // The pv0/pv1 in getMesh used v and iv. Let's use the getPoint parameterization for consistency.
											 // pv0 = bl.getPoint(iv); pv1 = br.getPoint(v);
											 // If bl runs bottom(0) to top(1), bl.getPoint(iv) is correct for v_param=0 (bottom) -> iv=1 (top of left edge)
											 // If br runs bottom(0) to top(1), br.getPoint(v) is correct for v_param=0 (bottom) -> v=0 (bottom of right edge)
											 // This is getting very confusing. Let's use the formula from getPoint for Coons part.

			u = 0;
			for ( var x_idx = 0; x_idx < cols; x_idx++ )
			{
				iu = 1 - u;
				
				// Coons boundary points
				pu0 = bb.getPoint(u); // C(u,0)
				pu1 = bt.getPoint(u); // C(u,1)

				// Reference bilinear surface boundary points
				qu0 = bs_ref.getPoint(u); // P(u,0) - bs_ref from corners[3](BL) to corners[2](BR)
				qu1 = ts_ref.getPoint(u); // P(u,1) - ts_ref from corners[0](TL) to corners[1](TR)

				// Coons point (using the formula from this class's getPoint method for consistency)
				var coons_pt_x = iv * pu0.x + v_param * pu1.x + iu * bl.getPoint(iv).x + u * br.getPoint(v_param).x - (iu * iv * p00x + u * iv * p10x + iu * v_param * p01x + u * v_param * p11x);
				var coons_pt_y = iv * pu0.y + v_param * pu1.y + iu * bl.getPoint(iv).y + u * br.getPoint(v_param).y - (iu * iv * p00y + u * iv * p10y + iu * v_param * p01y + u * v_param * p11y);

				// Bilinear interpolation for reference surface
				// P(u,v) = (1-v)P(u,0) + vP(u,1) where P(u,0) = (1-u)P00_ref + uP10_ref and P(u,1) = (1-u)P01_ref + uP11_ref
				// P00_ref = corners[3] (BL), P10_ref = corners[2] (BR)
				// P01_ref = corners[0] (TL), P11_ref = corners[1] (TR)
				// So qu0 is P(u,0) [bottom ref edge], qu1 is P(u,1) [top ref edge]
				// qv0 is P(0,v) [left ref edge], qv1 is P(1,v) [right ref edge]
				// The bilinear formula is (1-u)(1-v)P00_ref + u(1-v)P10_ref + (1-u)vP01_ref + uvP11_ref
				// The code is: (v * qu0.x + iv * qu1.x + iu * qv0.x + u * qv1.x - iu * v * p00x_ref - ... ) this is another Coons formula for the reference points
				// This is too complex. Simpler: calculate reference bilinear point directly.
				var ref_p00 = corners[3]; // BL
				var ref_p10 = corners[2]; // BR
				var ref_p01 = corners[0]; // TL
				var ref_p11 = corners[1]; // TR

				var ref_pt_x = iu*iv*ref_p00.x + u*iv*ref_p10.x + iu*v_param*ref_p01.x + u*v_param*ref_p11.x;
				var ref_pt_y = iu*iv*ref_p00.y + u*iv*ref_p10.y + iu*v_param*ref_p01.y + u*v_param*ref_p11.y;
				
				var dx = coons_pt_x - ref_pt_x;
				var dy = coons_pt_y - ref_pt_y;
						 
				heights.push( Math.sqrt(dx*dx + dy*dy) ); // Magnitude of difference
			
				u += baseStep_x;
			}
			v_param += baseStep_y;
		}
		return {cols:cols, rows:rows, heights:heights };
	}
	
	
	/**
	 * Calculates a point on the Coons patch surface for given parameters `u` and `v`.
	 * Parameters `u` and `v` should be in the range [0, 1].
	 * `u` interpolates along the bottom and top boundary curves.
	 * `v` interpolates along the left and right boundary curves.
	 *
	 * The formula implemented is:
	 * P(u,v) = (1-v)C(u,0) + v*C(u,1) + (1-u)C(0,1-v) + u*C(1,v)
	 *          - [ (1-u)(1-v)C(0,0) + u(1-v)C(1,0) + (1-u)v*C(0,1) + u*v*C(1,1) ]
	 * where C(u,0) is `bound_bottom.getPoint(u)`, C(u,1) is `bound_top.getPoint(u)`,
	 * C(0,1-v) is `bound_left.getPoint(1-v)`, C(1,v) is `bound_right.getPoint(v)`.
	 * C(0,0) is `bound_bottom.getPoint(0)`.
	 * C(1,0) is `bound_bottom.getPoint(1)`.
	 * C(0,1) is `bound_top.getPoint(0)`.
	 * C(1,1) is `bound_top.getPoint(1)`.
	 *
	 * @method getPoint
	 * @param {number} u - Parameter for bottom/top curves (typically 0 to 1).
	 * @param {number} v - Parameter for left/right curves (typically 0 to 1).
	 * @returns {qlib.Vector2} The calculated point on the Coons patch.
	 */
	p.getPoint = function( u, v )
	{
		var iu = 1 - u; // (1-u)
		var iv = 1 - v; // (1-v)
		
		// Corner points
		var p00 = this.bound_bottom.getPoint(0); // C(0,0)
		var p10 = this.bound_bottom.getPoint(1); // C(1,0)
		var p01 = this.bound_top.getPoint(0);    // C(0,1)
		var p11 = this.bound_top.getPoint(1);    // C(1,1)
		
		// Points on boundary curves
		var pu0 = this.bound_bottom.getPoint(u); // C(u,0)
		var pu1 = this.bound_top.getPoint(u);    // C(u,1)
		var pv0 = this.bound_left.getPoint(iv);  // C(0,1-v) - Note: uses (1-v) for left boundary
		var pv1 = this.bound_right.getPoint(v);  // C(1,v)   - Note: uses v for right boundary
												// This implies specific parameterization for left/right boundaries
												// e.g. left boundary from top (t=0) to bottom (t=1) if (1-v) is used.
												// Or left boundary from bottom (t=0) to top (t=1) if (v) is used, and (1-v) maps it.
												// If bound_left.getPoint(t) assumes t from bottom(0) to top(1), then getPoint(iv) is correct.
		
		// Coons patch formula P(u,v) = Lc(u,v) + Lr(u,v) - B(u,v)
		// Lc(u,v) = (1-v)C(u,0) + vC(u,1)
		// Lr(u,v) = (1-u)C(0,v) + uC(1,v) -> but here C(0,iv) and C(1,v) are used for pv0, pv1
		// B(u,v)  = (1-u)(1-v)C00 + u(1-v)C10 + (1-u)vC01 + uvC11

		var term1x = iv * pu0.x + v * pu1.x; // (1-v)C(u,0)_x + v*C(u,1)_x
		var term1y = iv * pu0.y + v * pu1.y; // (1-v)C(u,0)_y + v*C(u,1)_y

		var term2x = iu * pv0.x + u * pv1.x; // (1-u)C(0,1-v)_x + u*C(1,v)_x
		var term2y = iu * pv0.y + u * pv1.y; // (1-u)C(0,1-v)_y + u*C(1,v)_y

		var term3x = iu * iv * p00.x + u * iv * p10.x + iu * v * p01.x + u * v * p11.x;
		var term3y = iu * iv * p00.y + u * iv * p10.y + iu * v * p01.y + u * v * p11.y;

		return new qlib.Vector2( term1x + term2x - term3x, term1y + term2y - term3y );
	}
	
	
	/**
	 * Returns a string representation of this CoonsPatch object.
	 * @method toString
	 * @return {string} A string representation of the instance (e.g., "CoonsPatch").
	 */
	p.toString = function()
	{
		return "CoonsPatch";
	}
	
	
	
	qlib["CoonsPatch"] = CoonsPatch;
}());