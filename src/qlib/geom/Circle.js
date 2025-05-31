/*
* Circle
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
 * Represents a circle in a 2D coordinate system.
 * A circle is defined by its center point (c) and its radius (r).
 * This class provides methods for geometric transformations (translate, scale, rotate),
 * hit testing, cloning, drawing, and conversion to other geometric representations.
 *
 * @class Circle
 * @extends qlib.GeometricShape
 * @param {number|qlib.Vector2} arg1 - Either the x-coordinate of the center, or a `qlib.Vector2` instance representing the center.
 * @param {number} arg2 - Either the y-coordinate of the center (if arg1 is a number), or the radius (if arg1 is a `qlib.Vector2`).
 * @param {number} [arg3] - The radius of the circle (if arg1 and arg2 are coordinates).
 *
 * @property {qlib.Vector2} c - The center point of the circle.
 * @property {number} r - The radius of the circle.
 * @property {string} type - The type of this geometric shape, always "Circle".
 * @property {number} drawingSegments - Number of segments used when drawing an arc or converting to a path. Default is 6 for partial arcs.
 * @property {number} startAngle - Start angle in degrees for drawing partial arcs. Default is 0.
 * @property {number} endAngle - End angle in degrees for drawing partial arcs. Default is 0 (implies full circle if startAngle is also 0).
 */
	var Circle = function() {
	  this.initialize(arguments);
	}

	var p = Circle.prototype = new qlib.GeometricShape();
	
// public properties:
    /**
     * The type of this geometric shape.
     * @property {string} type
     * @default "Circle"
     */
    p.type = "Circle";
	
	// constructor:
	/** 
	 * Initializes the Circle instance.
	 * This method is called by the constructor and can take arguments in two forms:
	 * 1. `x` (number), `y` (number), `radius` (number)
	 * 2. `centerPoint` (qlib.Vector2), `radius` (number)
	 *
	 * @method initialize
	 * @protected
	 * @param {IArguments} args - The arguments passed to the constructor.
	 *   - If `args[0]` is a number: expects `(x: number, y: number, radius: number)`.
	 *   - If `args[0]` is a `qlib.Vector2`: expects `(center: qlib.Vector2, radius: number)`.
	 * @returns {void}
	*/
	p.initialize = function( args ) {
		/**
		 * Number of segments used when drawing an arc or converting the circle to a path.
		 * For full circles, `toMixedPath` might use a different default (e.g., 4 Bezier curves).
		 * For partial arcs drawn by `draw()`, this defines smoothness.
		 * @property {number} drawingSegments
		 * @default 6
		 */
		this.drawingSegments = 6;
		/**
		 * Start angle in degrees for drawing partial arcs.
		 * @property {number} startAngle
		 * @default 0
		 */
		this.startAngle = 0;
		/**
		 * End angle in degrees for drawing partial arcs.
		 * If `startAngle` and `endAngle` are the same, a full circle is implied by `draw()`.
		 * @property {number} endAngle
		 * @default 0
		 */
		this.endAngle = 0;
	
		if ( typeof args[0] == "number" )
		{		
			//arguments: center x, center y, r
			/**
			 * The center point of the circle.
			 * @property {qlib.Vector2} c
			 */
			this.c = new qlib.Vector2( args[0], args[1] );
			/**
			 * The radius of the circle.
			 * @property {number} r
			 */
			this.r 	 = (args[2] == null ? 0 : args[2]);
		} else {
			//arguments: center,r
			this.c = args[0];
			this.r = (args[1] == null ? 0 : args[1]);
		}
	}
	
// public methods:

	/**
	 * Translates (moves) the circle by a given vector.
	 * Modifies this circle in place.
	 *
	 * @method translate
	 * @param {qlib.Vector2} p - The vector to translate the circle by.
	 * @returns {qlib.Circle} This Circle instance, allowing for chaining.
	 */
	p.translate = function( p )
	{
		this.c.plus( p );
		return this;
	}
	
	/**
	 * Scales the circle by a given factor, optionally around a specified center point.
	 * If no center point is provided, scaling is relative to the circle's own center.
	 * Modifies this circle in place.
	 *
	 * @method scale
	 * @param {number} factor - The scaling factor.
	 * @param {qlib.Vector2} [center] - The point around which to scale. Defaults to the circle's center.
	 * @returns {qlib.Circle} This Circle instance, allowing for chaining.
	 */
	p.scale = function( factor, center )
	{
		if ( center == null ) center = this.c.clone(); // Use actual clone for safety if c is mutable like Vector2
		this.c.minus( center ).multiply( factor ).plus( center );
		this.r *= factor;
		return this;
	}
	
	/**
	 * Rotates the circle by a given angle around a specified center point.
	 * If no center point is provided, rotation is relative to the circle's own center (which effectively only changes `startAngle` and `endAngle` if they are used, the center `c` itself would not change).
	 * Modifies this circle in place.
	 *
	 * @method rotate
	 * @param {number} angle - The angle of rotation in radians.
	 * @param {qlib.Vector2} [center] - The point around which to rotate. Defaults to the circle's center.
	 * @returns {qlib.Circle} This Circle instance, allowing for chaining.
	 */
	p.rotate = function( angle, center )
	{
		if ( center == null ) center = this.c.clone(); // Use actual clone
		this.c.rotateAround( angle, center );
		// Note: Rotating a circle shape around its own center doesn't change its geometry unless it's an arc.
		// If startAngle/endAngle are used, they might need adjustment here if the expectation is that the arc itself rotates.
		// However, the current implementation only rotates the center point.
		return this;
	}
	
	/**
	 * Checks if this circle touches another circle (i.e., their boundaries meet at exactly one point).
	 * Uses an epsilon for floating-point comparison.
	 *
	 * @method touches
	 * @param {qlib.Circle} circle - The other circle to check against.
	 * @returns {boolean} True if the circles touch, false otherwise.
	 */
	p.touches = function( circle )
	{
		return Math.abs(this.c.distanceToVector(circle.c) - (this.r + circle.r)) < 0.0000001;
	}

	/**
	 * Creates and returns a clone of this Circle instance.
	 *
	 * @method clone
	 * @param {boolean} [deepClone=false] - If true, the center Vector2 `c` will be deeply cloned.
	 *                                      If false (default), the reference to `c` might be copied if `this.c` was set directly from an argument,
	 *                                      or it might create a new Vector2 if initialized with x,y,r.
	 *                                      The current implementation detail: `new Circle(this.x, this.y, this.r)` implies a new Vector for center if x,y are available directly on Circle,
	 *                                      `new Circle(this.c, this.r)` would copy the reference of `this.c` if `this.c` is a Vector2.
	 *                                      To ensure consistent behavior, a proper deep clone of `this.c` should be done when `deepClone` is true.
	 *                                      However, the original code `new Circle(this.x, this.y, this.r)` would fail as Circle does not have x,y properties directly.
	 *                                      It should be `new Circle(this.c.x, this.c.y, this.r)`.
	 * @return {qlib.Circle} A new Circle instance.
	 **/
	p.clone = function( deepClone ) {
		if ( deepClone === true ) { // Explicitly check for true
			return new qlib.Circle( this.c.x, this.c.y, this.r ); // Creates a new Vector2 for center implicitly
		} else {
			// Standard behavior: create a new circle. If this.c was from constructor (x,y,r), it's already a new Vector.
			// If this.c was passed as a Vector2, this will share the reference if not careful.
			// Safest shallow clone would be new Circle(this.c.clone(), this.r) if Vector2.clone() is shallow.
			// Given the constructor options, new Circle(this.c.x, this.c.y, this.r) is safer for a shallow clone too.
			return new qlib.Circle( this.c.x, this.c.y, this.r );
		}
	}
	
	/**
	 * Draws the circle or a circular arc on a 2D canvas rendering context.
	 * If `startAngle` and `endAngle` are the same, a full circle is drawn.
	 * Otherwise, a pie segment (arc closed to the center) is drawn using Bezier curves for approximation.
	 *
	 * @method draw
	 * @param {CanvasRenderingContext2D} canvas - The HTML5 Canvas 2D rendering context.
	 *                                          Assumes custom methods like `drawCircle` and `curveTo` might be present
	 *                                          if `qlib` extends the context, or relies on standard canvas API.
	 * @returns {void}
	 */
	p.draw = function( canvas )
	{
		if ( isNaN(this.r) || this.r < 0 ) return;
			
		var x1, y1, grad, segm;
		var s1 = this.startAngle;
		var s2 = this.endAngle;
		var sgm = this.drawingSegments;
		var rad =  Math.PI / 180;
		
		if (s1 == s2) 
		{
			canvas.moveTo( this.c.x + this.r, this.c.y);
			canvas.drawCircle( this.c.x, this.c.y, this.r );
			return;
		} else 
		{
			if (s1>s2) s1 -= 360;
			x1 = this.r * Math.cos(s1*rad)+this.c.x;
			y1 = this.r * Math.sin(s1*rad)+this.c.y;
			grad = s2-s1;
			segm = grad / sgm;
			canvas.moveTo(this.c.x, this.c.y);
			canvas.lineTo(x1, y1);
		}
		
		for (var s = segm+s1; s<grad+.1+s1; s += segm) 
		{
			var x2 = this.r*Math.cos((s-segm/2)*rad) + this.c.x;
			var y2 = this.r*Math.sin((s-segm/2)*rad) + this.c.y;
			var x3 = this.r*Math.cos(s*rad)+this.c.x;
			var y3 = this.r*Math.sin(s*rad)+this.c.y;
			// begin tnx 2 Robert Penner
			var cx = 2*x2-.5*(x1+x3);
			var cy = 2*y2-.5*(y1+y3);
			canvas.curveTo(cx, cy, x3, y3);
			// end tnx 2 Robert Penner :)
			x1 = x3;
			y1 = y3;
		}
		if (grad != 360) {
			canvas.lineTo(this.c.x, this.c.y);
		}
	}
	

		var x1, y1, grad, segm;
		var s1 = this.startAngle;
		var s2 = this.endAngle;
		var sgm = this.drawingSegments;
		var rad =  Math.PI / 180;

		// Assuming canvas context has qlib specific extensions or standard methods are used.
		// E.g., canvas.drawCircle might be a qlib extension. Standard is canvas.arc().
		if (s1 == s2)
		{
			canvas.moveTo( this.c.x + this.r, this.c.y); // Standard practice for arc
			if (typeof canvas.drawCircle === "function") { // QLib specific call
				canvas.drawCircle( this.c.x, this.c.y, this.r );
			} else { // Standard canvas API
				canvas.arc(this.c.x, this.c.y, this.r, 0, 2 * Math.PI);
			}
			return;
		} else
		{
			if (s1>s2) s1 -= 360; // Normalize angles
			x1 = this.r * Math.cos(s1*rad)+this.c.x;
			y1 = this.r * Math.sin(s1*rad)+this.c.y;
			grad = s2-s1;
			segm = grad / sgm;
			canvas.moveTo(this.c.x, this.c.y); // Start from center for pie segment
			canvas.lineTo(x1, y1); // Line to start of arc
		}

		for (var s = segm+s1; s<grad+.1+s1; s += segm)
		{
			var x2 = this.r*Math.cos((s-segm/2)*rad) + this.c.x;
			var y2 = this.r*Math.sin((s-segm/2)*rad) + this.c.y;
			var x3 = this.r*Math.cos(s*rad)+this.c.x;
			var y3 = this.r*Math.sin(s*rad)+this.c.y;

			var cx = 2*x2-.5*(x1+x3); // Control point for quadratic-like curve segment
			var cy = 2*y2-.5*(y1+y3);
			// Assuming canvas.curveTo is a qlib extension or a custom method.
			// Standard canvas uses quadraticCurveTo or bezierCurveTo. This seems custom.
			if (typeof canvas.curveTo === "function") {
				canvas.curveTo(cx, cy, x3, y3);
			} else {
				// Fallback or alternative, might need quadraticCurveTo if cx,cy is the control point
				// Or just lineTo for a polygonal approximation if curveTo is not available
				canvas.lineTo(x3, y3);
			}
			x1 = x3;
			y1 = y3;
		}
		if (grad != 360) { // Close the pie segment
			canvas.lineTo(this.c.x, this.c.y);
		}
	}

	/**
	 * Calculates and returns the bounding rectangle of this circle.
	 *
	 * @method getBoundingRect
	 * @returns {qlib.Rectangle} A new `qlib.Rectangle` instance representing the bounding box.
	 */
	p.getBoundingRect = function()
	{
		return new qlib.Rectangle( this.c.x - this.r, this.c.y - this.r,this.r*2,this.r*2);
	}

	/**
	 * Checks if a given point is inside this circle.
	 *
	 * @method isInside
	 * @param {qlib.Vector2} point - The point to check.
	 * @param {boolean} [includeVertices=true] - If true (default), points on the boundary are considered inside.
	 *                                           If false, points must be strictly inside.
	 * @returns {boolean} True if the point is inside (or on the boundary, if `includeVertices` is true), false otherwise.
	 */
	p.isInside = function( point, includeVertices )
	{
		includeVertices = ( includeVertices == null ? true : includeVertices);
		var distSq = point.squaredDistanceToVector(this.c);
		var rSq = this.r * this.r;
		return includeVertices ? distSq <= rSq : distSq < rSq;
	}
	
	/**
	 * Checks if this circle is entirely inside or intersects with another circle.
	 *
	 * @method circleIsInsideOrIntersects
	 * @param {qlib.Circle} circle - The other circle to check against.
	 * @returns {boolean} True if this circle is inside or intersects the other circle, false otherwise.
	 */
	p.circleIsInsideOrIntersects = function( circle )
	{
		// True if distance between centers is less than sum of radii
		return circle.c.squaredDistanceToVector(this.c) < (circle.r+this.r)*(circle.r+this.r);
	}
	

	/**
	 * Calculates the inversion of a point with respect to this circle, where the point is the orthogonal projection
	 * of this circle's center onto a given line (pole).
	 * See: http://mathworld.wolfram.com/Polar.html and http://mathworld.wolfram.com/InversionPole.html
	 * If the projected center is inside the circle, it returns the projected point itself (as its inversion is outside or at infinity).
	 *
	 * @method inversionPointFromPole
	 * @param {qlib.Vector2} p0 - First point defining the pole line.
	 * @param {qlib.Vector2} p1 - Second point defining the pole line.
	 * @returns {qlib.Vector2} The inversion point, or the projected point if it's inside the circle.
	 */
	p.inversionPointFromPole = function( p0, p1 )
	{
		
		var ip = this.c.getProject( p0, p1 ); // Orthogonal projection of circle center onto the line p0-p1
		if ( this.containsPoint( ip ) ) return ip; // If projection is inside, behavior might be context-dependent. Here, it returns the point itself.
		return this.inversionPoint( ip ); // Otherwise, invert the projected point.
	}
	

	/**
	 * Converts this circle into an approximation using a sequence of cubic Bezier curves,
	 * forming a `qlib.MixedPath`.
	 * Based on code by Paul Hertz: http://ignotus.com/factory/wp-content/uploads/2010/03/bezcircle_applet/index.html
	 * Uses a kappa value for 4-segment Bezier approximation of a circle. See: http://www.whizkidtech.redprince.net/bezier/circle/kappa/
	 *
	 * @method toMixedPath
	 * @param {number} [cubicBezierCount=4] - The number of cubic Bezier segments to use for approximating the circle.
	 *                                          Commonly 4 for a good approximation.
	 * @returns {qlib.MixedPath} A new `qlib.MixedPath` instance representing the circle.
	 */
	p.toMixedPath = function( cubicBezierCount )
	{
		 if ( cubicBezierCount == null ) cubicBezierCount = 4;
		var kappa = 0.5522847498; // Magic number for 4-segment Bezier circle approximation (for 90-degree arcs)

		// Adjust kappa for the number of segments. The formula k = 4/3 * tan(PI/(2*N)) * R is for control point distance.
		// The provided k seems to be a direct scaling factor.
		// The original code has: var k = 4 * kappa / cubicBezierCount; which is unusual.
		// A more standard approach for N segments, angle per segment alpha = 2*PI/N:
		// control_point_length = R * (4/3) * tan(alpha/4).
		// Let's assume the original k calculation is specific to its Bezier construction logic.
		var k_factor = (4/3) * Math.tan(Math.PI / (2 * cubicBezierCount)) / Math.sin(Math.PI / cubicBezierCount) * kappa / 0.5522847498;
		// The original code seems to use kappa directly and scales it by 4/cubicBezierCount, this is likely an empirical value for its specific segment generation.
		// Let's stick to the original formula for now:
		var k = 4 * kappa / cubicBezierCount;
		var d_offset = k * this.r; // This 'd' is the offset for control points along the tangent.

		var segmentAngle = Math.PI*2/cubicBezierCount;
		
		var path = new qlib.MixedPath();
		
		var currentPoint = new qlib.Vector2(0, this.r); // Start at (0, r) in local space
		currentPoint.rotateBy(this.startAngle * Math.PI/180); // Adjust if circle has a startAngle for path

		path.addPoint( currentPoint.getPlus(this.c) );

		for (var i = 0; i < cubicBezierCount; i++)
		{
			var angle1 = i * segmentAngle + (this.startAngle * Math.PI/180);
			var angle2 = (i + 1) * segmentAngle + (this.startAngle * Math.PI/180);

			var p1 = new qlib.Vector2(this.r * Math.cos(angle1), this.r * Math.sin(angle1));
			var p2 = new qlib.Vector2(this.r * Math.cos(angle2), this.r * Math.sin(angle2));

			// Tangents at p1 and p2
			var t1 = new qlib.Vector2(-this.r * Math.sin(angle1), this.r * Math.cos(angle1)).getNormalize().multiply(d_offset); // Simplified: should be related to segmentAngle
			var t2 = new qlib.Vector2(-this.r * Math.sin(angle2), this.r * Math.cos(angle2)).getNormalize().multiply(d_offset);

			// Using a more standard calculation for control points for a segment from angle p_angle1 to p_angle2
            // Control point length `l = r * (4/3) * tan(segmentAngle / 4)`
            var l = this.r * (4/3) * Math.tan(segmentAngle/4);
            var cp1 = new qlib.Vector2(p1.x - l * Math.sin(angle1), p1.y + l * Math.cos(angle1));
            var cp2 = new qlib.Vector2(p2.x + l * Math.sin(angle2), p2.y - l * Math.cos(angle2));


			path.addControlPoint( cp1.getPlus(this.c) );
			path.addControlPoint( cp2.getPlus(this.c) );
			path.addPoint( p2.getPlus(this.c) );

			currentPoint = p2;
		}
		// The original code had deletePointAt and closed=true.
		// If it's a full circle approximation, the last point should connect to the first.
		// The loop above generates cubicBezierCount segments, ending at the start point if angles are correct.
		path.closed = true;
		// If path.deletePointAt(path.pointCount-1) was there, it implies the last point added was a duplicate of the first.
		// Let's check if the last point added is the same as the first.
		if (path.points.length > 1 && path.points[path.points.length-1].equals(path.points[0])) {
			path.deletePointAt(path.points.length-1);
		}

		return path;
	}
	

	/**
	 * Calculates the inversion of a given point `p` with respect to this circle.
	 * The inversion of a point P with respect to a circle with center C and radius R
	 * is a point P' on the ray CP such that CP * CP' = R^2.
	 * See: http://mathworld.wolfram.com/Inversion.html
	 *
	 * @method inversionPoint
	 * @param {qlib.Vector2} p - The point to invert.
	 * @returns {qlib.Vector2} A new `qlib.Vector2` instance representing the inverted point.
	 *                         Returns a point at infinity conceptually if `p` is the center of the circle (division by zero in `s`).
	 *                         Current code will produce NaN/Infinity components if p equals this.c.
	 */
	p.inversionPoint = function( p )
	{
		var s = this.c.distanceToVector( p ); // Distance from center to point p
		if (s === 0) { // Point p is the center of the circle
			// Inversion of the center is undefined (or point at infinity).
			// Return a vector with NaN or Infinity, or handle as an error.
			return new qlib.Vector2(Infinity, Infinity);
		}
		var a = this.c.getAngleTo( p ); // Angle from center to point p
		var inverted_s = ( this.r * this.r ) / s; // Inverted distance from center
		
		return new qlib.Vector2( this.c.x + Math.cos( a ) * inverted_s,
								 this.c.y + Math.sin( a ) * inverted_s	);
	}
	
	/**
	 * Checks if a given point `p` is strictly inside this circle (not on the boundary).
	 *
	 * @method containsPoint
	 * @param {qlib.Vector2} p - The point to check.
	 * @returns {boolean} True if the point is strictly inside the circle, false otherwise.
	 */
	p.containsPoint = function( p )
	{
		// squaredDistanceToVector is (dx*dx + dy*dy)
		// r*r is radius squared
		return this.c.squaredDistanceToVector( p ) < this.r * this.r;
	}
		
	
	/**
	 * Returns a string representation of this Circle object.
	 * Format: "[Circle (c=[Vector2 (x=X y=Y)] r=R)]"
	 *
	 * @method toString
	 * @return {string} A string representation of the Circle instance.
	 **/
	p.toString = function() {
		return "[Circle (c="+this.c.toString()+" r="+this.r+")]";
	}
	
	qlib["Circle"] = Circle;
}());