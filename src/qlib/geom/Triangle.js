/*
* Triangle
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
 * Represents a triangle defined by three vertices (points).
 * Provides methods for geometric calculations, transformations, and drawing.
 * Inherits from `qlib.GeometricShape`.
 *
 * @class Triangle
 * @extends qlib.GeometricShape
 * @memberof qlib
 * @constructor
 * @param {qlib.Vector2|number} [p1_or_x1] - The first vertex (Point object) or its x-coordinate.
 * @param {qlib.Vector2|number} [p2_or_y1_or_p2] - The second vertex (Point object), or the y-coordinate of the first point, or the second Point object if p1_or_x1 was a Point.
 * @param {qlib.Vector2|number} [p3_or_x2_or_p3] - The third vertex (Point object), or the x-coordinate of the second point, or the third Point object.
 * @param {number} [y2] - The y-coordinate of the second point (if p3_or_x2_or_p3 was x2).
 * @param {qlib.Vector2|number} [p3_or_x3] - The third vertex (Point object) or its x-coordinate.
 * @param {number} [y3] - The y-coordinate of the third point.
 *
 * Supports multiple constructor signatures:
 * - `Triangle()`: Creates a degenerate triangle with points at (0,0).
 * - `Triangle(p1:Vector2, p2:Vector2, p3:Vector2)`
 * - `Triangle(x1:number, y1:number, x2:number, y2:number, x3:number, y3:number)`
 * - Mixed variations are also parsed by `initialize`.
 */
	var Triangle = function() {
	  this.initialize( arguments );
	}

	/**
	 * Creates an equilateral triangle given two points `pa` and `pb` forming one side.
	 * @static
	 * @method getEquilateralTriangle
	 * @param {qlib.Vector2} pa - The first point of the base side.
	 * @param {qlib.Vector2} pb - The second point of the base side.
	 * @param {boolean} [clockwise=false] - If true, the third point is to the right of vector pa->pb.
	 *                                      If false (default), it's to the left (standard counter-clockwise orientation).
	 * @returns {qlib.Triangle} A new equilateral Triangle.
	 */
	Triangle.getEquilateralTriangle = function( pa, pb, clockwise )
	{
		var angleOffset = Math.PI / 3 * ( clockwise ? -1 : 1);
		var thirdPoint = pa.getAddCartesian(pa.getAngleTo(pb) + angleOffset, pa.distanceToVector( pb ));
		return new qlib.Triangle( pa, pb, thirdPoint );
	}
	
	/**
	 * Creates a triangle given its side lengths and a desired center and rotation.
	 * Note: Not all combinations of three side lengths can form a valid triangle.
	 * @static
	 * @method getCenteredTriangle
	 * @param {qlib.Vector2} center - The desired center point for the triangle (centroid).
	 * @param {number} leftLength - Length of the side that will be "left" after initial construction (e.g., side c or b).
	 * @param {number} rightLength - Length of the side that will be "right" (e.g., side a or c).
	 * @param {number} bottomLength - Length of the base side (e.g., side b or a).
	 * @param {number} [angle=0] - Desired rotation of the triangle in radians around its calculated centroid.
	 * @returns {qlib.Triangle|null} A new Triangle, or `null` if the side lengths cannot form a triangle (e.g., NaN alpha).
	 */
	Triangle.getCenteredTriangle = function( center, leftLength, rightLength, bottomLength, angle )
	{
		angle = angle || 0;
		// Using Law of Cosines to find an angle. Example: c^2 = a^2 + b^2 - 2ab*cos(Gamma)
		// Here, rightLength^2 = leftLength^2 + bottomLength^2 - 2*leftLength*bottomLength*cos(alpha_at_v1)
		// cos(alpha_at_v1) = (leftLength^2 + bottomLength^2 - rightLength^2) / (2*leftLength*bottomLength)
		var cosAlpha = ( leftLength * leftLength - rightLength * rightLength + bottomLength * bottomLength ) / ( 2 * leftLength * bottomLength);
		if (cosAlpha < -1 || cosAlpha > 1) return null; // Invalid triangle if cosine out of bounds
		var alpha = -Math.acos(cosAlpha); // Angle at first vertex (v1), typically negative for CCW placement of v3

		if ( isNaN( alpha )) return null;
		
		var v1 = new qlib.Vector2(0,0);
		var v2 = new qlib.Vector2(bottomLength,0 );
		var v3 = new qlib.Vector2( Math.cos( alpha ) * leftLength, Math.sin( alpha ) * leftLength );
		
		var triangle = new qlib.Triangle( v1, v2, v3 );
		var ctr = triangle.centerOfMass(); // Calculate centroid of this initial triangle
		triangle.translate( center.getMinus( ctr ) ); // Translate so its centroid is at the desired center
		if ( angle !== 0 ) triangle.rotate( angle, center ); // Rotate around the new center
		
		return triangle;
	}

	var p = Triangle.prototype = new qlib.GeometricShape();


// public properties:
	/**
	 * The type of this geometric shape.
	 * @property {string} type
	 * @default "Triangle"
	 */
	p.type = "Triangle";
	/**
	 * The first vertex of the triangle.
	 * @property {qlib.Vector2} p1
	 */
	p.p1 = null;
	/**
	 * The second vertex of the triangle.
	 * @property {qlib.Vector2} p2
	 */
	p.p2 = null;
	/**
	 * The third vertex of the triangle.
	 * @property {qlib.Vector2} p3
	 */
	p.p3 = null;
	
	
	// constructor:
	/** 
	 * Initialization method called by the constructor.
	 * Parses arguments to set the three vertices `p1`, `p2`, `p3`.
	 * Supports multiple signatures for points (individual coordinates or `qlib.Vector2` objects).
	 * @method initialize
	 * @protected
	 * @param {IArguments} args - Arguments passed to the constructor.
	 * @returns {void}
	*/
	p.initialize = function( args ) {
		var i = 0;
		if ( args.length === 0) {
			this.p1 = new qlib.Vector2();
			this.p2 = new qlib.Vector2();
			this.p3 = new qlib.Vector2();
			return;
		}

		if ( typeof args[0] == "number" )
		{	
			this.p1 = new qlib.Vector2( args[0], args[1] );
			i += 2;
		} else {
			this.p1 = args[0] || new qlib.Vector2();
			i++;
		}
		if ( typeof args[i] == "number" )
		{	
			this.p2 = new qlib.Vector2( args[i], args[i+1] );
			i += 2;
		} else {
			this.p2 = args[i] || new qlib.Vector2();
			i++;
		}
		if ( typeof args[i] == "number" )
		{	
			this.p3 = new qlib.Vector2( args[i], args[i+1] );
			// i += 2; // Not needed as it's the last one
		} else {
			this.p3 = args[i] || new qlib.Vector2();
			// i++;
		}
	}
	
// public methods:

	/**
	 * Translates the triangle by a given offset vector. Modifies vertices in place.
	 * @method translate
	 * @param {qlib.Vector2} offset - The translation vector.
	 * @returns {this} This Triangle instance for chaining.
	 */
	p.translate = function(offset)
	{
		this.p1.plus( offset );
		this.p2.plus( offset );
		this.p3.plus( offset );
		return this;
	}
	
	/**
	 * Scales the triangle by given factors relative to a center point. Modifies vertices in place.
	 * @method scale
	 * @param {number} factorX - Horizontal scaling factor.
	 * @param {number} factorY - Vertical scaling factor.
	 * @param {qlib.Vector2} [center] - Center of scaling. Defaults to the triangle's incircle center.
	 * @returns {this} This Triangle instance for chaining.
	 */
	p.scale= function( factorX, factorY, center )
	{
		if ( center == null ) center = this.incircleCenter();
		this.p1.minus( center ).multiplyXY( factorX, factorY ).plus( center );
		this.p2.minus( center ).multiplyXY( factorX, factorY ).plus( center );
		this.p3.minus( center ).multiplyXY( factorX, factorY ).plus( center );
		return this;
	}
	
	/**
	 * Calculates the center of the incircle (inscribed circle) of the triangle.
	 * The incenter is the intersection of the angle bisectors.
	 * @method incircleCenter
	 * @returns {qlib.Vector2} A new `qlib.Vector2` representing the incenter.
	 */
	p.incircleCenter = function()
	{
		var a = this.p2.distanceToVector( this.p3 ); // Length of side opposite p1
		var b = this.p1.distanceToVector( this.p3 ); // Length of side opposite p2
		var c = this.p1.distanceToVector( this.p2 ); // Length of side opposite p3
		var sum = a + b + c;
		if (sum === 0) return this.p1.clone(); // Degenerate triangle
		return new qlib.Vector2( ( a * this.p1.x + b * this.p2.x + c * this.p3.x ) / sum,
		                         ( a * this.p1.y + b * this.p2.y + c * this.p3.y ) / sum );
	}
		
	/**
	 * Calculates the center of mass (centroid) of the triangle.
	 * The centroid is the average of the coordinates of its vertices.
	 * @method centerOfMass
	 * @returns {qlib.Vector2} A new `qlib.Vector2` representing the centroid.
	 */
	p.centerOfMass = function()
	{
		return this.p1.getPlus( this.p2 ).plus( this.p3 ).divide( 3 );
	}
	
	/**
	 * Calculates three circles, each centered at a vertex of the triangle and tangent to the two sides
	 * that do not meet at that vertex (related to Malfatti circles or contact points of incircle/excircles).
	 * More precisely, these are circles whose radii are distances from vertex to tangent points of the incircle.
	 * (s-a, s-b, s-c where s is semi-perimeter, a,b,c are side lengths).
	 * @method getTouchingCornerCircles
	 * @returns {qlib.Circle[]} An array of three `qlib.Circle` instances.
	 */
	p.getTouchingCornerCircles = function()
	{
		var len_p2_p3 = this.p2.distanceToVector( this.p3 ); // side 'a' (opposite p1)
		var len_p1_p3 = this.p1.distanceToVector( this.p3 ); // side 'b' (opposite p2)
		var len_p1_p2 = this.p1.distanceToVector( this.p2 ); // side 'c' (opposite p3)
		
		// Using s-a, s-b, s-c for radii where s is semi-perimeter
		var s = (len_p2_p3 + len_p1_p3 + len_p1_p2) / 2;
		
		var result = [];
		result.push( new qlib.Circle( this.p1.clone(), s - len_p2_p3 ) ); // Radius at p1 is s-a
		result.push( new qlib.Circle( this.p2.clone(), s - len_p1_p3 ) ); // Radius at p2 is s-b
		result.push( new qlib.Circle( this.p3.clone(), s - len_p1_p2 ) ); // Radius at p3 is s-c
		return result;
	}
	
	/**
	 * Gets one of the three sides of the triangle as a `qlib.LineSegment`.
	 * Side 0: p1-p2
	 * Side 1: p1-p3 (Note: common convention might be p2-p3)
	 * Side 2: p2-p3 (Note: common convention might be p3-p1)
	 * Please verify indexing convention if it matters for external use.
	 * @method getSide
	 * @param {number} index - The index of the side (0, 1, or 2).
	 * @returns {qlib.LineSegment|null} The line segment, or `null` if index is out of bounds.
	 */
	p.getSide = function( index )
	{
		switch ( index )
		{
			case 0: return new qlib.LineSegment(this.p1, this.p2 );
			case 1: return new qlib.LineSegment(this.p1, this.p3 ); // Typically p2-p3 for side opposite p1
			case 2: return new qlib.LineSegment(this.p2, this.p3 ); // Typically p3-p1 for side opposite p2
		}
		return null;
	}
	
	/**
	 * Gets the length of one of the three sides of the triangle.
	 * Uses the same indexing convention as `getSide`.
	 * @method getSideLength
	 * @param {number} index - The index of the side (0, 1, or 2).
	 * @returns {number} The length of the specified side. Returns `NaN` if index is invalid.
	 */
	p.getSideLength = function( index )
	{
		switch ( index )
		{
			case 0: return this.p1.distanceToVector( this.p2 );
			case 1: return this.p1.distanceToVector( this.p3 );
			case 2: return this.p2.distanceToVector( this.p3 );
		}
		return NaN;
	}
	
	/**
	 * Calculates the circumcircle of the triangle (the circle passing through all three vertices).
	 * @method getBoundingCircle
	 * @returns {qlib.Circle|null} The circumcircle, or `null` if points are collinear.
	 */
	p.getBoundingCircle = function()
	{
		return qlib.CircleUtils.from3Points( this.p1, this.p2, this.p3);
	}
	
	/**
	 * Calculates a point inside the triangle using a weighted average of points on its sides.
	 * This is a form of trilinear coordinates or a specific type of weighted average.
	 * @method getInnerPoint
	 * @param {number} fa - Parameter (0-1) along side opposite p3 (p1-p2).
	 * @param {number} fb - Parameter (0-1) along side opposite p1 (p2-p3).
	 * @param {number} fc - Parameter (0-1) along side opposite p2 (p3-p1).
	 * @returns {qlib.Vector2} The calculated inner point.
	 */
	p.getInnerPoint = function( fa, fb, fc)
	{
		// P_ab = p1.lerp(p2, fa)
		// P_bc = p2.lerp(p3, fb)
		// P_ca = p3.lerp(p1, fc)
		// Result = (P_ab + P_bc + P_ca) / 3
		var p_ab = this.p1.getLerp(this.p2, fa);
		var p_bc = this.p2.getLerp(this.p3, fb);
		var p_ca = this.p3.getLerp(this.p1, fc);
		return p_ab.plus(p_bc).plus(p_ca).multiply(1/3);
	}
	
	/**
	 * Finds the side of the triangle closest to a given point.
	 * @method getClosestSide
	 * @param {qlib.Vector2} p_vec - The point to check.
	 * @returns {qlib.LineSegment|null} The closest side (as a new `qlib.LineSegment`), or `null` if triangle is degenerate.
	 */
	p.getClosestSide = function( p_vec ) // Renamed p to p_vec
	{
		if (!this.p1 || !this.p2 || !this.p3) return null;
		var s0 = this.getSide( 0 );
		var cp0 = s0.getClosestPoint( p_vec );
		var d0 = p_vec.squaredDistanceToVector(cp0);
		var closestSide = s0;
		var min_d = d0;

		var s1 =  this.getSide( 1 );
		var cp1 = s1.getClosestPoint( p_vec );
		var d1 = p_vec.squaredDistanceToVector(cp1);
		if ( d1 < min_d ) {
			min_d = d1;
			closestSide = s1;
		}

		var s2 =  this.getSide( 2 );
		var cp2 = s2.getClosestPoint( p_vec );
		var d2 = p_vec.squaredDistanceToVector(cp2);
		if ( d2 < min_d ) {
			closestSide = s2;
		}
		return closestSide;
	}
	
	/**
	 * Finds the point on the perimeter of the triangle closest to a given point `p_vec`.
	 * @method getClosestPoint
	 * @param {qlib.Vector2} p_vec - The point.
	 * @returns {qlib.Vector2|null} The closest point on the triangle's perimeter, or `null` if triangle is degenerate.
	 */
	p.getClosestPoint = function( p_vec ) // Renamed p to p_vec
	{
		if (!this.p1 || !this.p2 || !this.p3) return null;

		var s0 = this.getSide( 0 );
		var cp0 = s0.getClosestPoint( p_vec );
		var d_sq0 = p_vec.squaredDistanceToVector(cp0);
		var closestPt = cp0;
		var minDistSq = d_sq0;

		var s1 =  this.getSide( 1 );
		var cp1 = s1.getClosestPoint( p_vec );
		var d_sq1 = p_vec.squaredDistanceToVector(cp1);
		if ( d_sq1 < minDistSq ) {
			minDistSq = d_sq1;
			closestPt = cp1;
		}

		var s2 =  this.getSide( 2 );
		var cp2 = s2.getClosestPoint( p_vec );
		var d_sq2 = p_vec.squaredDistanceToVector(cp2);
		if ( d_sq2 < minDistSq ) {
			closestPt = cp2;
		}
		return closestPt;
	}
	
	/**
	 * Returns a clone of this Triangle instance.
	 * @method clone
	 * @param {boolean} [deepClone=true] - If true (default), the vertex `qlib.Vector2` objects are cloned.
	 *                                     If false, references to vertex objects are copied.
	 * @return {qlib.Triangle} A clone of this Triangle instance.
	 **/
	p.clone = function( deepClone ) {
		deepClone = (deepClone == null) ? true : deepClone; // Default deepClone to true
		if ( deepClone === true )
			return new qlib.Triangle( this.p1.clone(), this.p2.clone(), this.p3.clone()); // Corrected: p3.clone()
		else 
			return new qlib.Triangle( this.p1, this.p2, this.p3 );
	}
	
	/**
	 * Moves the drawing context to the first point (p1) of the triangle.
	 * @method moveToStart
	 * @param {CanvasRenderingContext2D} g - The canvas rendering context.
	 * @returns {void}
	 */
	p.moveToStart = function( g )
	{
		g.moveTo( this.p1.x, this.p1.y );
	}
	
	/**
	 * Draws the triangle on a given canvas graphics context.
	 * It moves to p1, then lines to p2, p3, and back to p1.
	 * @method draw
	 * @param {CanvasRenderingContext2D} g - The canvas rendering context.
	 * @returns {void}
	 */
	p.draw = function(g ) 
	{
		if (!this.p1 || !this.p2 || !this.p3) return;
		g.moveTo( this.p1.x, this.p1.y );
		g.lineTo( this.p2.x, this.p2.y );
		g.lineTo( this.p3.x, this.p3.y );
		g.lineTo( this.p1.x, this.p1.y ); // Close the path
	}
	
	/**
	 * Returns a string representation of this Triangle object.
	 * @method toString
	 * @return {string} A string representation of the instance (e.g., "Triangle").
	 **/
	p.toString = function() {
		return "Triangle"; // Could be made more descriptive, e.g., include point coordinates
	}
	
	qlib["Triangle"] = Triangle;
}());