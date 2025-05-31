/*
* Quadratic Bezier Curve
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
	"use strict";

/**
 * Represents a quadratic Bezier curve in 2D space.
 * A quadratic Bezier curve is defined by a start point (p1), an end point (p2),
 * and a single control point (c).
 * This class provides methods for evaluating points on the curve, calculating its length,
 * cloning, and drawing the curve. It inherits from `qlib.GeometricShape`.
 *
 * @class Bezier2
 * @extends qlib.GeometricShape
 * @param {...(number|qlib.Vector2)} args - Flexible arguments to define the curve:
 *   - No arguments: Initializes p1, p2, c to (0,0).
 *   - `(p1x, p1y, cx, cy, p2x, p2y)`: All coordinates as numbers.
 *   - `(p1:qlib.Vector2, c:qlib.Vector2, p2:qlib.Vector2)`: Points as `qlib.Vector2` instances.
 *   - Mixed: e.g., `(p1:qlib.Vector2, cx, cy, p2:qlib.Vector2)`.
 */
	var Bezier2 = function() {
	  this.initialize( arguments );
	}

	var p = Bezier2.prototype = new qlib.GeometricShape();

	/**
	 * The number of evaluation points used for approximating the curve's length.
	 * Higher values increase precision but decrease performance. Must be an odd number.
	 * @static
	 * @property {number} CURVE_LENGTH_PRECISION
	 * @default 31
	 */
	Bezier2.CURVE_LENGTH_PRECISION = 31;
	/**
	 * Precision value, potentially for offset calculations or similar geometric operations.
	 * Its direct use is not evident in this specific file but may be intended for related utilities.
	 * @static
	 * @property {number} OFFSET_PRECISION
	 * @default 10
	 */
	Bezier2.OFFSET_PRECISION = 10;
		
	// public properties:
	/**
	 * The type of this geometric shape.
	 * @property {string} type
	 * @default "Bezier2"
	 */
	p.type = "Bezier2";
	
	/**
	 * The start point of the quadratic Bezier curve.
	 * @property {qlib.Vector2} p1
	 */
	p.p1 = null;
	/**
	 * The control point of the quadratic Bezier curve.
	 * @property {qlib.Vector2} c
	 */
	p.c = null;
	/**
	 * The end point of the quadratic Bezier curve.
	 * @property {qlib.Vector2} p2
	 */
	p.p2 = null;
	/**
	 * A flag indicating if cached properties (like length) are outdated and need recalculation.
	 * Set to true when control points change.
	 * @property {boolean} dirty
	 * @default true
	 * @protected
	 */
	p.dirty = true;
	/**
	 * Cached length of the curve. Use the `length` getter for public access.
	 * @property {number} __length
	 * @private
	 */
	p.__length = 0;

	
	// constructor:
	/** 
	 * Initializes the Bezier2 curve with given points and/or coordinates.
	 * The constructor can accept various argument formats:
	 * - No arguments: p1, c, p2 are initialized to (0,0).
	 * - 6 numbers: (p1x, p1y, cx, cy, p2x, p2y).
	 * - 3 `qlib.Vector2` instances: (p1, c, p2).
	 * - Mixed: e.g., (p1_vector, cx_number, cy_number, p2_vector).
	 *
	 * @method initialize
	 * @protected
	 * @param {IArguments} args - The arguments passed to the constructor.
	 * @returns {void}
	*/
	p.initialize = function( args ) {
		var i = 0;
		if ( args.length == 0 )
		{
			this.p1 = new qlib.Vector2();
			this.p2 = new qlib.Vector2();
			this.c = new qlib.Vector2();
		} else {
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
				this.c = new qlib.Vector2( args[i], args[i+1] );
				i += 2;
			} else {
				this.c = args[i];
				i++;
			}
			if ( typeof args[i] == "number" )
			{	
				this.p2 = new qlib.Vector2( args[i], args[i+1] );
			} else {
				this.p2 = args[i];
			}
		}
		this.dirty = true;
	}
	
// public methods:

	/**
	 * Calculates a point on the quadratic Bezier curve at a given parameter `t`.
	 * The formula is: B(t) = (1-t)^2 * p1 + 2 * (1-t) * t * c + t^2 * p2.
	 *
	 * @method getPoint
	 * @param {number} t - The parameter value, typically between 0 (start point) and 1 (end point).
	 * @returns {qlib.Vector2} A new `qlib.Vector2` instance representing the point on the curve.
	 */
	p.getPoint = function( t ) 
	{
		var ti = 1-t;
		return new qlib.Vector2( ti*ti*this.p1.x+2*t*ti*this.c.x+t*t*this.p2.x , ti*ti*this.p1.y+2*t*ti*this.c.y+t*t*this.p2.y);
	}
	
	/**
	 * [read-only] Calculates the approximate length of the Bezier curve.
	 * The calculation uses a numerical approximation method based on `Bezier2.CURVE_LENGTH_PRECISION`.
	 * The result is cached until the curve is modified (which sets the `dirty` flag).
	 *
	 * @property {number} length
	 */
	p.__defineGetter__("length", function(){
		if ( !this.dirty ) return this.__length;
		
		var min_t = 0;
		var max_t = 1;
		var	i;
		var	len = 0;
		var n_eval_pts = Bezier2.CURVE_LENGTH_PRECISION;
		if ( !( n_eval_pts & 1 ) ) n_eval_pts++; // Ensure it's odd
	
		var t_params = []; // Renamed 't' to 't_params' to avoid conflict if 't' is used as loop var
		var pt = [];
	
		for ( i = 0 ; i < n_eval_pts ; ++i )
		{
			t_params[i]  =  i / ( n_eval_pts - 1 );
			pt[i] = this.getPoint(t_params[i]);
		}
	
		for ( i = 0 ; i < n_eval_pts - 1 ; i += 2 )
		{
			len += this.getSectionLength (t_params[i] , t_params[i+1] , t_params[i+2] , pt[i] , pt[i+1] , pt[i+2]);
		}
		
		this.__length = len;
		this.dirty = false;
	
		return len;
	});
	
	/**
	 * Calculates the length of a small section of the Bezier curve, defined by three parametric points.
	 * This is a helper method for the `length` getter, likely using a variation of Simpson's rule or a similar
	 * numerical integration technique for arc length.
	 *
	 * @method getSectionLength
	 * @protected
	 * @param {number} t0 - Parametric value of the first point.
	 * @param {number} t1 - Parametric value of the middle point.
	 * @param {number} t2 - Parametric value of the third point.
	 * @param {qlib.Vector2} pt0 - The first point on the curve.
	 * @param {qlib.Vector2} pt1 - The middle point on the curve.
	 * @param {qlib.Vector2} pt2 - The third point on the curve.
	 * @returns {number} The approximate length of this curve section.
	 */
	p.getSectionLength = function (t0, t1, t2, pt0, pt1, pt2 )
	{
	
		var kEpsilon	= 1e-5; // Tolerance for considering distances zero or section too straight
		var kEpsilon2	= 1e-6;
		var kMaxArc	= 1.05;
		var kLenRatio	= 1.2;
	
		var d2,len_1,len_2;
	
		var d1 = pt0.getMinus( pt2 ).length;
		var da = pt0.getMinus( pt1 ).length;
		var db = pt1.getMinus( pt2 ).length;
	
		d2 = da + db;
	
		if ( d2 < kEpsilon || da==0 || db == 0){
			return ( d2 + ( d2 - d1 ) / 3 );
		} else if ( ( d1 < kEpsilon || d2/d1 > kMaxArc ) || ( da < kEpsilon2 || db/da > kLenRatio ) || ( db < kEpsilon2 || da/db > kLenRatio ) ) {
			var	mid_t = ( t0 + t1 ) / 2;
	
			var	pt_mid = this.getPoint ( mid_t );
	
			len_1 = this.getSectionLength( t0, mid_t, t1, pt0, pt_mid, pt1 );
	
			mid_t = ( t1 + t2 ) / 2;
			
			pt_mid = this.getPoint ( mid_t );
	
			len_2 = this.getSectionLength (t1, mid_t, t2, pt1, pt_mid, pt2 );
	
			return ( len_1 + len_2 );
	
		} else {
			return ( d2 + ( d2 - d1 ) / 3 );
		}
	
	}

	/**

	/**
	 * Creates and returns a clone of this Bezier2 instance.
	 *
	 * @method clone
	 * @param {boolean} [deepClone=false] - If true, the points `p1`, `c`, and `p2` will be deeply cloned
	 *                                      (i.e., new `qlib.Vector2` instances will be created).
	 *                                      If false (default), the references to these points are copied.
	 * @return {qlib.Bezier2} A new `qlib.Bezier2` instance.
	 **/
	p.clone = function( deepClone ) {
		if ( deepClone === true ) // Explicitly check for true
			return new qlib.Bezier2( this.p1.clone(), this.c.clone(), this.p2.clone());
		else 
			return new qlib.Bezier2( this.p1, this.c, this.p2 ); // Copies references if p1,c,p2 are objects
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
		g.moveTo( this.p1.x+ ( offset != null ? offset.x : 0 ), this.p1.y+ ( offset != null ? offset.y : 0 ) );
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
		g.moveTo( this.p2.x+ ( offset != null ? offset.x : 0 ), this.p2.y+ ( offset != null ? offset.y : 0 ) );
	}
	
	/**
	 * Draws the entire Bezier curve on the given canvas context.
	 * This method first moves to the start point `p1`, then draws the curve to `p2` using `c` as the control point.
	 *
	 * @method draw
	 * @param {CanvasRenderingContext2D} g - The canvas rendering context.
	 * @param {qlib.Vector2} [offset] - An optional offset to apply to all coordinates.
	 * @returns {void}
	 */
	p.draw = function(g, offset ) 
	{
		this.moveToStart( g, offset );
		this.drawTo( g, offset );
	}
	
	/**
	 * Draws the control polygon (lines from p1 to c, and from c to p2) and the control points themselves.
	 * Useful for visualizing the structure of the Bezier curve.
	 *
	 * @method drawExtras
	 * @param {CanvasRenderingContext2D} g - The canvas rendering context.
	 * @param {number} [factor=1] - A scaling factor, possibly for the size of drawn points (if `p1.draw` uses it).
	 * @param {qlib.Vector2} [offset] - An optional offset to apply to all coordinates.
	 * @returns {void}
	 */
	p.drawExtras = function(g, factor, offset ) 
	{
		factor = ( factor == null ? 1 : factor);
		this.moveToStart( g, offset ); // Assumes g has moveTo method
		if (typeof g.lineTo === 'function') { // Check if lineTo is available
			g.lineTo(this.c.x+ ( offset != null ? offset.x : 0 ), this.c.y+ ( offset != null ? offset.y : 0 ));
			g.lineTo(this.p2.x+ ( offset != null ? offset.x : 0 ), this.p2.y+ ( offset != null ? offset.y : 0 ));
		}
		
		// Assumes p1, p2, c are qlib.Vector2 instances with a draw method
		if (this.p1.draw) this.p1.draw(g,factor, offset);
		if (this.p2.draw) this.p2.draw(g,factor, offset);
		if (this.c.draw) this.c.draw(g,factor, offset);
	}
	
	/**
	 * Draws the quadratic Bezier curve to the canvas context `g`, using `c` as the control point
	 * and `p2` as the end point. It assumes the current drawing path is already at `p1`.
	 *
	 * @method drawTo
	 * @param {CanvasRenderingContext2D} g - The canvas rendering context.
	 * @param {qlib.Vector2} [offset] - An optional offset to apply to the control and end point coordinates.
	 * @returns {void}
	 */
	p.drawTo = function(g, offset) 
	{
		// Standard canvas quadraticCurveTo: context.quadraticCurveTo(cp1x, cp1y, x, y)
		if ( offset == null )
			g.quadraticCurveTo( this.c.x, this.c.y, this.p2.x,this.p2.y );
		else
			g.quadraticCurveTo( this.c.x + offset.x, this.c.y + offset.y, this.p2.x + offset.x,this.p2.y + offset.y );
	}
	
	/**
	 * Draws the quadratic Bezier curve in reverse to the canvas context `g`, using `c` as the control point
	 * and `p1` as the end point. It assumes the current drawing path is already at `p2`.
	 *
	 * @method drawToReverse
	 * @param {CanvasRenderingContext2D} g - The canvas rendering context.
	 * @param {qlib.Vector2} [offset] - An optional offset to apply to the control and end point coordinates.
	 * @returns {void}
	 */
	p.drawToReverse = function(g, offset) 
	{
		if ( offset == null )
			g.quadraticCurveTo( this.c.x,this.c.y,this.p1.x,this.p1.y );
		else
			g.quadraticCurveTo( this.c.x+ offset.x,this.c.y+ offset.y,this.p1.x+ offset.x,this.p1.y + offset.y);
	}

	/**
	 * Returns a string representation of this Bezier2 object.
	 *
	 * @method toString
	 * @return {string} A string representation of the instance, typically "Bezier2".
	 **/
	p.toString = function() {
		return "Bezier2";
	}
	
	qlib["Bezier2"] = Bezier2;
}());