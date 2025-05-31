/*
* LineSegment
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
 * Represents a cubic Bezier curve in 2D space.
 * A cubic Bezier curve is defined by a start point (p1), an end point (p2),
 * and two control points (c1 and c2).
 * This class provides methods for evaluating points on the curve, calculating its length,
 * finding intersections, getting the closest point on the curve to an external point,
 * splitting the curve, cloning, and drawing. It inherits from `qlib.GeometricShape`.
 *
 * The methods for finding the closest point (`getClosestPoint`, `getClosestT`) and related
 * helpers (`convertToBezierForm`, `findRoots`, `crossingCount`, `computeXIntercept`,
 * `controlPolygonFlatEnough`) are based on the Graphics Gems algorithm.
 *
 * @class Bezier3
 * @extends qlib.GeometricShape
 * @param {...(number|qlib.Vector2)} args - Flexible arguments to define the curve:
 *   - No arguments: Initializes p1, c1, c2, p2 to (0,0).
 *   - 8 numbers: (p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y).
 *   - 4 `qlib.Vector2` instances: (p1, c1, c2, p2).
 *   - Mixed combinations of numbers and `qlib.Vector2` objects.
 */
	var Bezier3 = function() {
	  this.initialize( arguments );
	}

	/**
	 * The number of evaluation points used for approximating the curve's length.
	 * Higher values increase precision but decrease performance. Must be an odd number.
	 * @static
	 * @property {number} CURVE_LENGTH_PRECISION
	 * @default 31
	 */
	Bezier3.CURVE_LENGTH_PRECISION = 31;
	/**
	 * Precision value, potentially for offset calculations or similar geometric operations.
	 * Its direct use is not evident in this specific file.
	 * @static
	 * @property {number} OFFSET_PRECISION
	 * @default 10
	 */
	Bezier3.OFFSET_PRECISION = 10;
	/**
	 * Maximum recursion depth for root-finding algorithms (e.g., in `findRoots`).
	 * @static
	 * @property {number} MAXDEPTH
	 * @default 64
	 */
	Bezier3.MAXDEPTH = 64;
	/**
	 * Flatness control value used in subdivision algorithms (e.g., `controlPolygonFlatEnough`).
	 * Derived from `MAXDEPTH`.
	 * @static
	 * @property {number} EPSILON
	 */
	Bezier3.EPSILON = Math.pow(2, -Bezier3.MAXDEPTH-1);
		
	/**
	 * Precomputed "z" values used in `convertToBezierForm` for transforming the closest point problem
	 * into a 5th-degree Bezier form. These are constants for cubic Bezier curves.
	 * @static
	 * @property {number[][]} cubicZ
	 * @protected
	 */
	Bezier3.cubicZ = [  
		[1.0, 0.6, 0.3, 0.1],
		[0.4, 0.6, 0.6, 0.4],
		[0.1, 0.3, 0.6, 1.0]
	];

	var p = Bezier3.prototype = new qlib.GeometricShape();

	// public properties:
	/**
	 * The type of this geometric shape.
	 * @property {string} type
	 * @default "Bezier3"
	 */
	p.type = "Bezier3";
	
	/**
	 * The start point of the cubic Bezier curve.
	 * @property {qlib.Vector2} p1
	 */
	p.p1 = null;
	/**
	 * The first control point of the cubic Bezier curve.
	 * @property {qlib.Vector2} c1
	 */
	p.c1 = null;
	/**
	 * The second control point of the cubic Bezier curve.
	 * @property {qlib.Vector2} c2
	 */
	p.c2 = null;
	/**
	 * The end point of the cubic Bezier curve.
	 * @property {qlib.Vector2} p2
	 */
	p.p2 = null;

	/**
	 * Coefficient 'a' for the x-component of the parametric equation: ax*t^3 + bx*t^2 + gx*t + p1x.
	 * @property {number} ax
	 * @protected
	 */
	p.ax = 0;
	/**
	 * Coefficient 'b' for the x-component of the parametric equation.
	 * @property {number} bx
	 * @protected
	 */
	p.bx = 0;
	/**
	 * Coefficient 'g' (often 'c' in standard form, but 'g' here) for the x-component.
	 * @property {number} gx
	 * @protected
	 */
	p.gx = 0;
	/** Coefficient 'a' for the y-component. @property {number} ay @protected */
	p.ay = 0;
	/** Coefficient 'b' for the y-component. @property {number} by @protected */
	p.by = 0;
	/** Coefficient 'g' for the y-component. @property {number} gy @protected */
	p.gy = 0;

	/**
	 * Cache for points calculated by `getPoint(t)`. Keys are `t` values.
	 * @property {Object<number, qlib.Vector2>} pre_pt
	 * @protected
	 */
	p.pre_pt = null;
	/**
	 * Cache for segment lengths calculated by `getSectionLength`. Keys are string hashes of t values.
	 * @property {Object<string, number>} pre_seg
	 * @protected
	 */
	p.pre_seg = null;

	/**
	 * Flag indicating if general curve properties (like polynomial factors) need an update.
	 * Currently set to false in `updateFactors` and not used elsewhere.
	 * @property {boolean} dirty
	 * @default false
	 * @protected
	 */
	p.dirty = false;
	/**
	 * Flag indicating if the cached length (`__length`) is outdated.
	 * @property {boolean} lengthDirty
	 * @default true
	 * @protected
	 */
	p.lengthDirty = true;
	/**
	 * Cached length of the curve. Use the `length` getter for public access.
	 * @property {number} __length
	 * @private
	 */
	p.__length = 0;

	
	// constructor:
	/** 
	 * Initializes the Bezier3 curve. Called by the constructor.
	 * Arguments can be numbers (x,y coordinates for p1, c1, c2, p2 in order)
	 * or `qlib.Vector2` instances for each point, or a mix.
	 *
	 * @method initialize
	 * @protected
	 * @param {IArguments} args - Arguments to define the curve points.
	 * @returns {void}
	*/
	p.initialize = function( args ) {
		var i = 0;
		if ( args.length == 0 )
		{
			this.p1 = new qlib.Vector2();
			this.p2 = new qlib.Vector2();
			this.c1 = new qlib.Vector2();
			this.c2 = new qlib.Vector2();
		} else {
			// Argument parsing allows for mixed numbers and Vector2 instances
			if ( typeof args[0] == "number" )
			{	
				this.p1 = new qlib.Vector2( args[0], args[1] );
				i += 2;
			} else {
				this.p1 = args[0];
				i++;
			}
			if ( typeof args[i] == "number" )
			{	
				this.c1 = new qlib.Vector2( args[i], args[i+1] );
				i += 2;
			} else {
				this.c1 = args[i];
				i++;
			}
			if ( typeof args[i] == "number" )
			{	
				this.c2 = new qlib.Vector2( args[i], args[i+1] );
				i += 2;
			} else {
				this.c2 = args[i];
				i++;
			}
			if ( typeof args[i] == "number" )
			{	
				this.p2 = new qlib.Vector2( args[i], args[i+1] );
			} else {
				this.p2 = args[i];
			}
		}
		this.updateFactors();
	}
	
	/**
	 * Updates the internal polynomial coefficients (ax, bx, gx, ay, by, gy) based on the
	 * current control points (p1, c1, c2, p2). Also resets caches.
	 * Called on initialization and when points change (implicitly, should be called by setters if they existed).
	 *
	 * @method updateFactors
	 * @protected
	 * @returns {void}
	 */
	p.updateFactors = function()
	{
		this.gx = 3 * (this.c1.x - this.p1.x);
		this.bx = 3 * (this.c2.x - this.c1.x) - this.gx;
		this.ax = this.p2.x - this.p1.x - this.bx - this.gx;
		
		this.gy = 3 * (this.c1.y - this.p1.y);
		this.by = 3 * (this.c2.y - this.c1.y) - this.gy;
		this.ay = this.p2.y - this.p1.y - this.by - this.gy;
		
		this.pre_pt = {}; // Reset point cache
		this.pre_seg = {}; // Reset segment length cache
		
		this.dirty = false; // Mark as clean regarding factors
		this.lengthDirty = true; // Length needs recalculation
	}
	
	/**
	 * Computes intersections between this cubic Bezier curve and another geometric shape.
	 * This method relies on `qlib.Intersection.intersect`.
	 *
	 * @method intersect
	 * @param {qlib.GeometricShape} s - The geometric shape to intersect with.
	 * @returns {Array} An array of intersection points or relevant intersection data,
	 *                  as returned by `qlib.Intersection.intersect`.
	 */
	p.intersect = function( s ) {
		// Factors should be up-to-date if points changed, but calling it defensively.
		// If p1,c1,c2,p2 can be changed externally without calling updateFactors, this is needed.
		// this.updateFactors(); // Consider if this is always needed or if dirty flag should be checked.
		return qlib.Intersection.intersect( this, s );
	}
	
// public methods:
	
	/**
	 * Calculates a point on the cubic Bezier curve at a given parameter `t`.
	 * The formula used is the parametric form: P(t) = a*t^3 + b*t^2 + g*t + p1.
	 * Results are cached in `this.pre_pt`.
	 *
	 * @method getPoint
	 * @param {number} t - The parameter value, typically between 0 (start point p1) and 1 (end point p2).
	 * @returns {qlib.Vector2} A `qlib.Vector2` instance representing the point on the curve.
	 *                         This may be a cached instance if called with the same `t` previously.
	 */
	p.getPoint = function( t ) 
	{
		if ( this.pre_pt[t] == null ) 
		{
			var ts = t*t;
			this.pre_pt[t] = new qlib.Vector2 (  this.ax*ts*t +  this.bx*ts +  this.gx*t +  this.p1.x,  this.ay*ts*t +  this.by*ts +  this.gy*t +  this.p1.y );
		}
		return this.pre_pt[t];
	}
	
	/**
	 * [read-only] Calculates the approximate length of the cubic Bezier curve.
	 * Uses a numerical approximation method based on `Bezier3.CURVE_LENGTH_PRECISION`.
	 * The result is cached; further calls return the cached value until `lengthDirty` is true.
	 * Calls `updateFactors()` if `lengthDirty` is true.
	 *
	 * @property {number} length
	 */
	p.__defineGetter__("length", function(){
		if ( !this.lengthDirty ) return this.__length;
		
		this.updateFactors(); // Ensure polynomial factors are current
		var min_t = 0;
		var max_t = 1;
		var	i;
		var	len = 0;
		var n_eval_pts = Bezier3.CURVE_LENGTH_PRECISION;
		if ( !( n_eval_pts & 1 ) ) n_eval_pts++; // Ensure odd number of points
	
		var t_params = []; // Renamed to avoid conflict
		var pt = [];
	
		for ( i = 0 ; i < n_eval_pts ; ++i ){
			t_params[i]  =  i / ( n_eval_pts - 1 );
			pt[i] = this.getPoint(t_params[i]);
		}
	
		for ( i = 0 ; i < n_eval_pts - 1 ; i += 2 ){ // Summing pairs of segments
			len += this.getSectionLength (t_params[i] , t_params[i+1] , t_params[i+2] , pt[i] , pt[i+1] , pt[i+2]);
		}
		
		this.__length = len;
		this.lengthDirty = false;
	
		return len;
	});
	
	/**
	 * Computes the length of a small section of a parametric curve from `t0` to `t2`,
	 * recursing if necessary. `t1` is the mid-point.
	 * The 3 points at these parametric values are precomputed.
	 * This is a helper for the `length` getter. Results are cached in `this.pre_seg`.
	 *
	 * @method getSectionLength
	 * @protected
	 * @param {number} t0 - Parametric value of the first point.
	 * @param {number} t1 - Parametric value of the middle point.
	 * @param {number} t2 - Parametric value of the third point.
	 * @param {qlib.Vector2} pt0 - The first point on the curve section.
	 * @param {qlib.Vector2} pt1 - The middle point on the curve section.
	 * @param {qlib.Vector2} pt2 - The third point on the curve section.
	 * @returns {number} The approximate length of this curve section.
	 */
	p.getSectionLength = function (t0, t1, t2, pt0, pt1, pt2 )
	{
	
		var hash = t0+"|"+t1+"|"+t2; // Cache key
		if ( this.pre_seg[hash] == null )
		{
			
			var kEpsilon	= 1e-5; // Tolerance for straightness
			var kEpsilon2	= 1e-6; // Tolerance for sub-segment length
			var kMaxArc	= 1.05; // Max ratio of chord to arc for subdivision
			var kLenRatio	= 1.2;  // Max ratio of sub-segment lengths for subdivision
		
			var d1,d2,len_1,len_2,da,db;
		
			d1 = pt0.getMinus( pt2 ).length; // Chord length pt0-pt2
			da = pt0.getMinus( pt1 ).length; // Chord length pt0-pt1
			db = pt1.getMinus( pt2 ).length; // Chord length pt1-pt2
			d2 = da + db; // Sum of sub-chords
		
			// If the segment is very short or very straight, approximate its length.
			// Otherwise, subdivide and sum lengths of sub-segments.
			if ( d2 < kEpsilon )
			{
				this.pre_seg[hash] = ( d2 + ( d2 - d1 ) / 3 ); // Approximation for nearly straight segment
			} else if ( ( d1 < kEpsilon || d2/d1 > kMaxArc ) || ( da < kEpsilon2 || db/da > kLenRatio ) || ( db < kEpsilon2 || da/db > kLenRatio ) ) {
				var	mid_t_A = ( t0 + t1 ) / 2; // Midpoint parameter for first half
				var	pt_mid_A = this.getPoint ( mid_t_A );
				len_1 = this.getSectionLength( t0, mid_t_A, t1, pt0, pt_mid_A, pt1 ); // Recurse on first half
		
				var	mid_t_B = ( t1 + t2 ) / 2; // Midpoint parameter for second half
				var pt_mid_B = this.getPoint ( mid_t_B );
				len_2 = this.getSectionLength (t1, mid_t_B, t2, pt1, pt_mid_B, pt2 ); // Recurse on second half
		
				this.pre_seg[hash] = ( len_1 + len_2 );
		
			} else { // Segment is straight enough
				this.pre_seg[hash] = ( d2 + ( d2 - d1 ) / 3 ); // Legendre-Gauss quadrature approximation
			}
		} 
		return this.pre_seg[hash];
	}
	
	/**
	 * Creates and returns a clone of this Bezier3 instance.
	 *
	 * @method clone
	 * @param {boolean} [deepClone=false] - If true, the points `p1`, `c1`, `c2`, and `p2` will be deeply cloned
	 *                                      (new `qlib.Vector2` instances). If false (default), references are copied.
	 * @return {qlib.Bezier3} A new `qlib.Bezier3` instance.
	 **/
	p.clone = function( deepClone ) {
		if ( deepClone === true )
			return new qlib.Bezier3( this.p1.clone(), this.c1.clone(), this.c2.clone(), this.p2.clone());
		else 
			return new qlib.Bezier3( this.p1, this.c1, this.c2, this.p2 );
	}
	
	/**
	 * Moves the drawing context `g` to the start point (p1) of the Bezier curve.
	 * Optionally applies an offset.
	 *
	 * @method moveToStart
	 * @param {CanvasRenderingContext2D} g - The canvas rendering context.
	 * @param {qlib.Vector2} [offset] - An optional offset to apply to the coordinates.
	 * @returns {void}
	 */
	p.moveToStart = function( g, offset )
	{
		g.moveTo( this.p1.x+ ( offset != null ? offset.x : 0 ), this.p1.y + ( offset != null ? offset.y : 0 ));
	}
	
	/**
	 * Moves the drawing context `g` to the end point (p2) of the Bezier curve.
	 * Optionally applies an offset.
	 *
	 * @method moveToEnd
	 * @param {CanvasRenderingContext2D} g - The canvas rendering context.
	 * @param {qlib.Vector2} [offset] - An optional offset to apply to the coordinates.
	 * @returns {void}
	 */
	p.moveToEnd = function( g, offset )
	{
		g.moveTo( this.p2.x+ ( offset != null ? offset.x : 0 ), this.p2.y + ( offset != null ? offset.y : 0 ));
	}
	
	/**
	 * Draws the entire cubic Bezier curve on the given canvas context.
	 * This method first moves to `p1`, then draws the curve to `p2` using `c1` and `c2` as control points.
	 *
	 * @method draw
	 * @param {CanvasRenderingContext2D} g - The canvas rendering context.
	 * @param {qlib.Vector2} [offset] - An optional offset to apply to all coordinates.
	 * @returns {void}
	 */
	p.draw = function( g, offset ) 
	{
		this.moveToStart( g,offset );
		this.drawTo( g,offset );
	}
	
	/**
	 * Draws the cubic Bezier curve as a series of line segments for a smoother appearance,
	 * especially when `segmentLength` is small.
	 *
	 * @method drawNicely
	 * @param {CanvasRenderingContext2D} g - The canvas rendering context.
	 * @param {number} [segmentLength=4] - The desired length of each small line segment used to approximate the curve.
	 * @param {qlib.Vector2} [offset] - An optional offset to apply to all coordinates.
	 * @returns {void}
	 */
	p.drawNicely = function(g, segmentLength, offset ) 
	{
		this.moveToStart( g, offset );
		this.drawToNicely( g, segmentLength, offset );
	}
	
	/**
	 * Draws the cubic Bezier curve as a series of line segments from the current context point.
	 * Assumes the context is already at `p1` (or the desired start of this "to" segment).
	 *
	 * @method drawToNicely
	 * @param {CanvasRenderingContext2D} g - The canvas rendering context.
	 * @param {number} [segmentLength=4] - The desired length of each small line segment.
	 * @param {qlib.Vector2} [offset] - An optional offset to apply to coordinates.
	 * @returns {void}
	 */
	p.drawToNicely = function(g, segmentLength, offset)
	{
		segmentLength = ( segmentLength == null ? 4 : segmentLength);
		var currentLength = this.length; // Use getter to ensure it's calculated
		if (currentLength === 0) { // Avoid division by zero if length is zero
			g.lineTo(this.p2.x + (offset ? offset.x : 0), this.p2.y + (offset ? offset.y : 0));
			return;
		}
		var t_step = segmentLength / currentLength;
		var offX = offset ? offset.x : 0;
		var offY = offset ? offset.y : 0;

		for ( var t = t_step; t < 1.0; t+=t_step )
		{
			var pt = this.getPoint(t); // Corrected variable name from p to pt
			g.lineTo(pt.x + offX, pt.y + offY);
		}
		g.lineTo(this.p2.x + offX, this.p2.y + offY);
	}
	
	/**
	 * Draws the control polygon (lines p1-c1, c1-c2, c2-p2) and the control points themselves.
	 * Useful for visualizing the structure of the Bezier curve.
	 *
	 * @method drawExtras
	 * @param {CanvasRenderingContext2D} g - The canvas rendering context.
	 * @param {number} [factor=1] - A scaling factor for drawing points (if their `draw` method uses it).
	 * @param {qlib.Vector2} [offset] - An optional offset to apply to all coordinates.
	 * @returns {void}
	 */
	p.drawExtras = function(g, factor, offset ) 
	{
		factor = ( factor == null ? 1 : factor);
		var offX = offset ? offset.x : 0;
		var offY = offset ? offset.y : 0;

		this.moveToStart( g, offset );
		g.lineTo(this.c1.x + offX, this.c1.y + offY);
		// For a continuous control polygon line, use lineTo instead of moveTo for c2
		// g.moveTo(this.c2.x + offX, this.c2.y + offY);
		g.lineTo(this.c2.x + offX, this.c2.y + offY);
		g.lineTo(this.p2.x + offX, this.p2.y + offY);

		if (this.p1.draw) this.p1.draw(g,factor,offset);
		if (this.p2.draw) this.p2.draw(g,factor,offset);
		if (this.c1.draw) this.c1.draw(g,factor,offset);
		if (this.c2.draw) this.c2.draw(g,factor,offset);
	}
	
	/**
	 * Draws the cubic Bezier curve to the canvas context `g`, using `c1`, `c2` as control points
	 * and `p2` as the end point. Assumes the current drawing path is already at `p1`.
	 *
	 * @method drawTo
	 * @param {CanvasRenderingContext2D} g - The canvas rendering context.
	 * @param {qlib.Vector2} [offset] - An optional offset for coordinates.
	 * @returns {void}
	 */
	p.drawTo = function(g, offset) 
	{
		var offX = offset ? offset.x : 0;
		var offY = offset ? offset.y : 0;
		g.bezierCurveTo( this.c1.x + offX, this.c1.y + offY, this.c2.x + offX, this.c2.y + offY, this.p2.x + offX, this.p2.y + offY );
	}
	
	/**
	 * Draws the cubic Bezier curve in reverse to the canvas context `g`, using `c2`, `c1` as control points
	 * and `p1` as the end point. Assumes the current drawing path is already at `p2`.
	 *
	 * @method drawToReverse
	 * @param {CanvasRenderingContext2D} g - The canvas rendering context.
	 * @param {qlib.Vector2} [offset] - An optional offset for coordinates.
	 * @returns {void}
	 */
	p.drawToReverse = function(g, offset) 
	{
		var offX = offset ? offset.x : 0;
		var offY = offset ? offset.y : 0;
		g.bezierCurveTo( this.c2.x + offX, this.c2.y + offY, this.c1.x + offX, this.c1.y + offY, this.p1.x + offX, this.p1.y + offY );
	}

	/**
	 * Calculates the axis-aligned bounding rectangle of the cubic Bezier curve.
	 * Note: This method considers only the start, end, and control points. For a more accurate
	 * bounding box of the curve itself (which can extend beyond its control points),
	 * the extrema of the curve would need to be found and included.
	 *
	 * @method getBoundingRect
	 * @returns {qlib.Rectangle} A `qlib.Rectangle` instance representing the bounding box
	 *                            of the four defining points (p1, c1, c2, p2).
	 */
	p.getBoundingRect = function()
	{
		var minP = this.p1.getMin( this.p2 ).min( this.c1 ).min( this.c2 );
		var size = this.p1.getMax( this.p2 ).max( this.c1 ).max( this.c2 ).minus( minP );
		return new qlib.Rectangle( minP.x, minP.y , size.x, size.y  );
	}
	
	/**
	 * Subdivides this cubic Bezier curve at a given parameter `t` using de Casteljau's algorithm.
	 * Returns two new `qlib.Bezier3` instances representing the two sub-curves.
	 * Based on work by Adrian Colomitchi (http://www.caffeineowl.com/graphics/2d/vectorial/index.html).
	 *
	 * @method getSplitAtT
	 * @param {number} t - The parameter value (between 0 and 1) at which to split the curve.
	 * @param {boolean} [clonePoints=true] - If true, the new Bezier curves will use cloned points.
	 *                                       If false, they may share point instances where appropriate (e.g., original p1, p2, and the split point).
	 * @returns {qlib.Bezier3[]} An array containing two `qlib.Bezier3` instances. If t=0 or t=1,
	 *                           returns an array with a single Bezier curve (a clone of this one or this one itself).
	 *                           Returns an empty array if t < 0 or t > 1 (unless t=0 or t=1).
	 */
	p.getSplitAtT = function( t, clonePoints )
	{
		if ( clonePoints == null ) clonePoints = true;
		var result = [];
		// Handle edge cases: if t is 0 or 1, return the original curve (or its clone)
		if ( t === 0 || t === 1 )
		{
			result.push( clonePoints ? this.clone(true) : this ); // Ensure deep clone if requested for consistency
			return result; // Return immediately
		}
		// For t outside [0,1] not being 0 or 1, return empty (or could extrapolate if desired)
		if ( t < 0 || t > 1) return result;
		
		// De Casteljau algorithm
		var p0x = this.p1.x + ( t * (this.c1.x - this.p1.x ));
		var p0y = this.p1.y + ( t * (this.c1.y - this.p1.y ));
		var p1x = this.c1.x + ( t * (this.c2.x - this.c1.x ));
		var p1y = this.c1.y + ( t * (this.c2.y - this.c1.y ));
		var p2x = this.c2.x + ( t * (this.p2.x - this.c2.x ));
		var p2y = this.c2.y + ( t * (this.p2.y - this.c2.y ));
		
		var p01x = p0x + ( t * (p1x-p0x));
		var p01y = p0y + ( t * (p1y-p0y));
		var p12x = p1x + ( t * (p2x-p1x));
		var p12y = p1y + ( t * (p2y-p1y));
		
		var dpx = p01x+(t*(p12x-p01x));
		var dpy = p01y+(t*(p12y-p01y));
		var t_p = new qlib.Vector2( dpx, dpy ); // This is the point on the curve at parameter t

		// First sub-curve: (p1, new_c1, new_c2_for_first_curve, t_p)
		var b1_p1 = clonePoints ? this.p1.clone() : this.p1;
		var b1_c1 = new qlib.Vector2( p0x, p0y );
		var b1_c2 = new qlib.Vector2( p01x, p01y );
		var b1_p2 = clonePoints ? t_p.clone() : t_p; // t_p is always new, so clone for consistency if requested
		result.push( new qlib.Bezier3( b1_p1, b1_c1, b1_c2, b1_p2 ));

		// Second sub-curve: (t_p, new_c1_for_second_curve, new_c2, p2)
		var b2_p1 = clonePoints ? t_p.clone() : t_p;
		var b2_c1 = new qlib.Vector2( p12x, p12y );
		var b2_c2 = new qlib.Vector2( p2x, p2y );
		var b2_p2 = clonePoints ? this.p2.clone() : this.p2;
		result.push( new qlib.Bezier3( b2_p1, b2_c1, b2_c2, b2_p2 ));
		
		return result;
	}
	
	/**
	 * Finds the point on this cubic Bezier curve that is nearest to a given point `pa`.
	 * This implementation uses an algorithm that converts the problem into finding roots
	 * of a 5th-degree polynomial.
	 *
	 * @method getClosestPoint
	 * @param {qlib.Vector2} pa - The point to find the closest point on the curve to.
	 * @returns {qlib.Vector2} The point on the curve that is closest to `pa`.
	 */    
	p.getClosestPoint = function( pa ) 
	{
									
		var tCandidate = [];     // Possible roots (parameter t values)
	   
		// Convert the closest point problem to finding roots of a 5th-degree Bezier-form polynomial
		var w = this.convertToBezierForm( pa );

		// Find all real roots of this 5th-degree polynomial in the interval [0, 1]
		var nSolutions = this.findRoots( w, tCandidate, 0);

		var minDistanceSq = pa.squaredDistanceToVector( this.p1 ); // Start with distance to p1 (t=0)
		var p;
		var bestP = this.p1; // Closest point found so far
		
		// Check candidate t values from the roots
		var distanceSq;
		for (var i = 0; i < nSolutions; i++) 
		{
			p = this.getPoint(tCandidate[i]);
			distanceSq = pa.squaredDistanceToVector( p );
			if (distanceSq < minDistanceSq)
			{
				minDistanceSq = distanceSq;
				bestP = p;
			}
		}

		// Finally, check the end point p2 (t=1)
		distanceSq =  pa.squaredDistanceToVector( this.p2 );
		if (distanceSq < minDistanceSq) {
			// minDistanceSq = distanceSq; // Not needed as we only return bestP
			bestP = this.p2;
		}

		return bestP;
	}
	
	/**
	 * Finds the parameter `t` (between 0 and 1) of the point on this cubic Bezier curve
	 * that is nearest to a given point `pa`.
	 * Similar to `getClosestPoint`, but returns the `t` value instead of the point itself.
	 *
	 * @method getClosestT
	 * @param {qlib.Vector2} pa - The point to find the closest t value on the curve to.
	 * @returns {number} The parameter `t` (0 to 1) corresponding to the closest point on the curve.
	 */    
	p.getClosestT = function( pa ) 
	{
		
		var tCandidate =[];     // Possible roots
		
		var w = this.convertToBezierForm( pa );
		var nSolutions = this.findRoots( w, tCandidate, 0);
		
		var minDistanceSq = pa.squaredDistanceToVector( this.p1 );
		var p;
		var bestT = 0; // t=0 corresponds to p1
		
		var distanceSq;
		for (var i = 0; i < nSolutions; i++) 
		{
			p = this.getPoint(tCandidate[i]);
			distanceSq = pa.squaredDistanceToVector( p );
			if (distanceSq < minDistanceSq)
			{
				minDistanceSq = distanceSq;
				bestT = tCandidate[i];
			}
		}
		
		distanceSq =  pa.squaredDistanceToVector( this.p2 );
		if (distanceSq < minDistanceSq) {
			// minDistanceSq = distanceSq;
			bestT = 1; // t=1 corresponds to p2
		}
		
		return bestT;
	}
	
	
	 /**
	 * Converts the problem of finding the closest point on a cubic Bezier curve to a point `pa`
	 * into finding the roots of a 5th-degree polynomial in Bezier form.
	 * This is a helper method for `getClosestPoint` and `getClosestT`.
	 * The resulting array `w` contains control points for this 5th-degree Bezier curve,
	 * where `w[i].x` is `i/5` and `w[i].y` is the value of the polynomial component.
	 *
	 * @method convertToBezierForm
	 * @protected
	 * @param {qlib.Vector2} pa - The point to which the distance is minimized.
	 * @returns {qlib.Vector2[]} An array of 6 `qlib.Vector2` points representing the control points
	 *                           of the 5th-degree Bezier equation. `w[i].x` is the parameter, `w[i].y` is the value.
	 */
	p.convertToBezierForm = function( pa )
	{
		var i, j, k;
		// var v; // v seems unused in original
		var c_vectors = [];   // Control points of (B(t) - pa)
		var d_vectors = [];   // Control points of B'(t) (derivative of Bezier curve)
		var cdTable = [[],[],[]];  // Table of dot products: d_vectors[j].dot(c_vectors[i])
		var w_ctl_pts =[]; // Control points of the 5th-degree resultant Bezier polynomial (whose roots are needed)

		// c_vectors[i] = ControlPoint_i_Of_Curve - pa
		c_vectors.push( this.p1.getMinus( pa ) );
		c_vectors.push( this.c1.getMinus( pa ) );
		c_vectors.push( this.c2.getMinus( pa ) );
		c_vectors.push( this.p2.getMinus( pa ) );

		// d_vectors[i] = Derivative_ControlPoint_i * N (where N=3 for cubic)
		// B'(t) = 3 * ( (P1-P0)(1-t)^2 + (P2-P1)2(1-t)t + (P3-P2)t^2 )
		// Control points for B'(t) are 3(P1-P0), 3(P2-P1), 3(P3-P2)
		var N = 3; // Degree of the cubic Bezier
		d_vectors.push( this.c1.getMinus( this.p1 ).multiply( N ) );
		d_vectors.push( this.c2.getMinus( this.c1 ).multiply( N ) );
		d_vectors.push( this.p2.getMinus( this.c2 ).multiply( N ) );

		// Fill cdTable: cdTable[j][i] = d_vectors[j].dot(c_vectors[i])
		for (var row = 0; row <= 2; row++) { // Index for d_vectors (degree of derivative is 2)
			cdTable[row] = []; // Initialize inner array
			for (var column = 0; column <= 3; column++) { // Index for c_vectors (original curve has 4 control points)
				cdTable[row][column] = d_vectors[row].dot(c_vectors[column]);
			}
		}

		// Initialize w_ctl_pts: 6 control points for a 5th degree Bezier.
		// w_ctl_pts[i].x is the parameter t_i = i/5.
		// w_ctl_pts[i].y is the polynomial value, initially 0.
		for ( i = 0; i <= 5; i++) {
			w_ctl_pts[i] = new qlib.Vector2( i / 5.0, 0 );
		}
		
		var n_degree = 3; // Degree of original Bezier curve
		var m_degree = 2; // Degree of the derivative Bezier curve
		// Calculate y-values (polynomial coefficients) for w_ctl_pts
		// This involves a formula using Bezier3.cubicZ (precomputed constants) and cdTable.
		for ( k = 0; k <= n_degree + m_degree; k++) { // k ranges from 0 to 5
			var lb = Math.max(0, k - m_degree);
			var ub = Math.min(k, n_degree);
			for ( i = lb; i <= ub; i++) {
				j = k - i;
				// The Bezier3.cubicZ seems to be specific to the original algorithm's formulation.
				// It's a 3x4 matrix, indices j and i are used here.
				// j is index for d_vectors (0 to 2), i is index for c_vectors (0 to 3)
				if (Bezier3.cubicZ[j] && Bezier3.cubicZ[j][i] !== undefined) {
					w_ctl_pts[i+j].y += cdTable[j][i] * Bezier3.cubicZ[j][i];
				}
			}
		}
		return w_ctl_pts;
	}
	
	 /**
	 * Finds all real roots of a polynomial given in Bernstein-Bezier form (control points `w`)
	 * within the interval [0, 1]. This is a recursive subdivision method.
	 *
	 * @method findRoots
	 * @protected
	 * @param {qlib.Vector2[]} w - Control points of the Bezier curve (polynomial).
	 *                             `w[i].x` is the parameter, `w[i].y` is the value.
	 *                             Expected to be 6 points for a 5th-degree polynomial.
	 * @param {number[]} t - An output array where found roots (t values) will be stored.
	 * @param {number} depth - The current recursion depth.
	 * @returns {number} The number of roots found and added to the `t` array.
	 */
	p.findRoots = function( w, t, depth )
	{  
		var degree = w.length - 1; // Degree of the polynomial represented by w

		switch ( this.crossingCount(w, degree))
		{
			case 0 : { // No solutions here
				return 0;   
			}
			case 1 : { // Unique solution likely
				// Stop recursion when the tree is deep enough or polygon is flat
				if (depth >= Bezier3.MAXDEPTH) 
				{
					t[0] = ( w[0].x + w[degree].x) / 2.0; // Midpoint approximation
					return 1;
				}
				if (this.controlPolygonFlatEnough(w, degree))
				{
					t[0] = this.computeXIntercept(w, degree); // Linear interpolation
					return 1;
				}
				break; // Needs further subdivision
			}
		}

		// Otherwise, solve recursively after subdividing control polygon using de Casteljau
		var leftPolyCtlPts = [];    // New left and right
		var rightPolyCtlPts = [];   // control polygons
		var leftT_roots = [];       // Solutions from children
		var rightT_roots = [];

		// De Casteljau subdivision:
		// p_sub represents the intermediate points in de Casteljau algorithm
		var p_sub = []; // Array of arrays of Vector2
		for(var i = 0; i <= degree; i++) p_sub[i] = []; // Initialize inner arrays
																	
		for (var j=0; j <= degree; j++) {
			p_sub[0][j] = new qlib.Vector2( w[j] ); // First row is original control points
		}
	   
		for (var i = 1; i <= degree; i++) {
			for (var j = 0 ; j <= degree - i; j++) {
				p_sub[i][j] = new qlib.Vector2(
					0.5 * p_sub[i-1][j].x + 0.5 * p_sub[i-1][j+1].x,
					0.5 * p_sub[i-1][j].y + 0.5 * p_sub[i-1][j+1].y
				);
			}
		}
	
		// Left sub-polygon's control points
		for (var j = 0; j <= degree; j++) {
			leftPolyCtlPts[j]  = p_sub[j][0];
		}
		// Right sub-polygon's control points
		for (var j = 0; j <= degree; j++) {
			rightPolyCtlPts[j] = p_sub[degree-j][j];
		}
	
		var leftCount  = this.findRoots(leftPolyCtlPts,  leftT_roots, depth+1);
		var rightCount = this.findRoots(rightPolyCtlPts, rightT_roots, depth+1);
	
		// Gather solutions, scaling parameters from sub-intervals [0,0.5] and [0.5,1] back to [0,1]
		for (var i = 0; i < leftCount; i++) {
			t[i] = leftT_roots[i] * 0.5; // Scale from [0,1] of left sub-curve to [0,0.5] of original
		}
		for (var i = 0; i < rightCount; i++) {
			t[i+leftCount] = rightT_roots[i] * 0.5 + 0.5; // Scale and shift from [0,1] of right to [0.5,1] of original
		}
	
		return leftCount+rightCount;
	}
	
	/**
	 * Counts the number of times a Bezier control polygon (defined by y-coordinates of points `v`)
	 * crosses the x-axis (y=0). This count is an upper bound on the number of real roots.
	 *
	 * @method crossingCount
	 * @protected
	 * @param {qlib.Vector2[]} v - Array of control points. `v[i].y` is used.
	 * @param {number} degree - The degree of the Bezier curve (number of points - 1).
	 * @returns {number} The number of sign changes (potential crossings).
	 */
	 p.crossingCount = function( v, degree ) 
	 {
		var nCrossings = 0;
		var sign = v[0].y < 0 ? -1 : 1;
		var oldSign = sign;
		for (var i = 1; i <= degree; i++) 
		{
			sign = v[i].y < 0 ? -1 : 1;
			if (sign != oldSign) nCrossings++;
			oldSign = sign;
		}
		return nCrossings;
	}
	
	 /**
	 * Computes the x-intercept of the line segment connecting the first and last control points (`v[0]` and `v[degree]`)
	 * of a Bezier curve's control polygon. This is used as an approximation of a root when the polygon is flat enough.
	 * Assumes `v[i].x` represents the parameter and `v[i].y` the value.
	 *
	 * @method computeXIntercept
	 * @protected
	 * @param {qlib.Vector2[]} v - Array of control points.
	 * @param {number} degree - The degree of the Bezier curve.
	 * @returns {number} The x-intercept (parameter t) where the chord crosses the y=0 axis.
	 */
	p.computeXIntercept = function( v, degree )
	{
		// Line is (v[0].x, v[0].y) to (v[degree].x, v[degree].y)
		// We want t such that Y(t) = v[0].y + (t - v[0].x) * (v[degree].y - v[0].y) / (v[degree].x - v[0].x) = 0
		// This is for a line in (x,y) plane. Here v[i].x is parameter, v[i].y is value.
		// We are finding where the segment ( (v[0].x, v[0].y) , (v[degree].x, v[degree].y) ) crosses y=0.
		// The parameter is the x-value of this intersection.
		var XNM = v[degree].x - v[0].x; // dx
		var YNM = v[degree].y - v[0].y; // dy
		var XMK = v[0].x; // x0
		var YMK = v[0].y; // y0

		if (Math.abs(YNM) < 1e-9) return (XMK + v[degree].x) / 2; // Horizontal line, no unique intercept unless YMK is 0. Return midpoint.

		// t = x0 - y0 * (dx / dy)
		var t = XMK - YMK * (XNM / YNM);
		return t;
	}
	
	 /**
	 * Checks if the control polygon of a Bezier curve is "flat enough" for recursive subdivision
	 * to terminate. Flatness is determined by comparing the maximum perpendicular distance of
	 * interior control points to the line segment connecting the first and last control points
	 * against `Bezier3.EPSILON`.
	 *
	 * @method controlPolygonFlatEnough
	 * @protected
	 * @param {qlib.Vector2[]} v - Array of control points.
	 * @param {number} degree - The degree of the Bezier curve.
	 * @returns {boolean} True if the control polygon is considered flat enough, false otherwise.
	 */
	 p.controlPolygonFlatEnough = function( v, degree )
	 {
		// Derive the implicit equation for line connecting first (v[0]) and last (v[degree]) control points: Ax + By + C = 0
		// Here, "x" corresponds to v[i].x (parameter) and "y" to v[i].y (value).
		var a_coeff = v[0].y - v[degree].y; // A = y0 - yn
		var b_coeff = v[degree].x - v[0].x; // B = xn - x0
		var c_coeff = v[0].x * v[degree].y - v[degree].x * v[0].y; // C = x0*yn - xn*y0

		var maxDistanceAbove = 0.0;
		var maxDistanceBelow = 0.0;
		var InvDenom = 1.0 / (a_coeff * a_coeff + b_coeff * b_coeff); // For squared distance, not needed for error metric here.
		// The original Graphics Gems code computes an error metric based on distances of control points to the baseline.
		
		for (var i = 1; i < degree; i++) // Iterate through interior control points
		{
			// Distance from point (vx, vy) to line Ax + By + C = 0 is |A*vx + B*vy + C| / sqrt(A^2+B^2)
			// However, the Graphics Gems code uses a slightly different error metric.
			// It computes a value related to how far the y-coordinate of v[i] deviates, scaled by 'a_coeff'.
			// This seems to be checking the max deviation from the line in terms of the output 'y' value of the Bezier polynomial.
			var value = a_coeff * v[i].x + b_coeff * v[i].y + c_coeff; // This is (y0-yn)x_i + (xn-x0)y_i + (x0yn - xny0)
			
			if (value > maxDistanceAbove) {
				maxDistanceAbove = value;
			} else if (value < maxDistanceBelow) {
				maxDistanceBelow = value;
			}
		}
		
		// The error metric used in Graphics Gems is related to the separation of the polygon from the baseline.
		// It does not directly compute perpendicular geometric distance.
		// If a_coeff (y0-yn) is zero, the baseline is horizontal. maxDistance / b_coeff would be error in x.
		// If b_coeff (xn-x0) is zero, the baseline is vertical. maxDistance / a_coeff would be error in y.
		
		// Original code's error calculation:
		// var intercept1 = (c_coeff + maxDistanceAbove) * (-1.0/a_coeff) ; // if a_coeff !=0
		// var intercept2 = (c_coeff + maxDistanceBelow) * (-1.0/a_coeff) ;
		// var error = 0.5 * Math.abs(intercept1 - intercept2); -> 0.5 * Math.abs( (maxDistanceAbove - maxDistanceBelow) / a_coeff )
		// This simplifies to checking max_dist_from_chord / |y_end - y_start|.
		// A more robust check is max_dist_from_chord / chord_length.

		// Using a simpler check: if the maximum deviation (maxDistanceAbove or -maxDistanceBelow) is small.
		// This needs to be scaled by sqrt(a^2+b^2) for true geometric distance.
		// The Graphics Gems code uses a specific flatness criterion that might not be straight geometric distance.
		// Let's assume the error is related to the y-deviation of the control points from the line connecting endpoints' y-values.
		// The error calculation from the source:
		var error;
		if (Math.abs(a_coeff) > 1e-9) { // If not a horizontal line (in the parameter-value plot)
			error = 0.5 * Math.abs( (maxDistanceAbove - maxDistanceBelow) / a_coeff );
		} else { // If line is horizontal, check total y-range of control points
			var minY = v[0].y, maxY = v[0].y;
			for(var i=1; i<=degree; ++i) {
				if(v[i].y < minY) minY = v[i].y;
				if(v[i].y > maxY) maxY = v[i].y;
			}
			error = maxY - minY; // Total y-span of the control polygon
		}
		
		return error < Bezier3.EPSILON;
	}
	
	/**
	 * Returns a string representation of this Bezier3 object.
	 *
	 * @method toString
	 * @return {string} A string representation of the instance, typically "Bezier3".
	 **/
	p.toString = function() {
		return "Bezier3";
	}
	
	qlib["Bezier3"] = Bezier3;
}());