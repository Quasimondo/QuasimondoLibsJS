/*
* IntersectionUtils
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
 * A utility class providing static methods for various geometric intersection calculations.
 * This class is not intended to be instantiated.
 * @class IntersectionUtils
 * @memberof qlib
 */
	var IntersectionUtils = function() {
		// This class is not meant to be instantiated.
		throw new Error("IntersectionUtils cannot be instantiated.");
	}
	
	/**
	 * Calculates the intersection points of two circles.
	 * Based on the method described at http://mathworld.wolfram.com/Circle-CircleIntersection.html
	 *
	 * @static
	 * @method circlesIntersection
	 * @param {qlib.Circle} circle0 - The first circle.
	 * @param {qlib.Circle} circle1 - The second circle.
	 * @returns {qlib.Vector2[]|null} An array containing two `qlib.Vector2` intersection points.
	 *                                Returns `null` if circles do not intersect, are tangent at a single point (this method expects two distinct points),
	 *                                or if they are coincident or one contains the other without touching.
	 *                                Returns an array with a single point if they are tangent and calculation results in one point.
	 */
	IntersectionUtils.circlesIntersection = function( circle0, circle1 )
	{
		var R = circle0.r;
		var r = circle1.r;
		var d = circle0.c.distanceToVector( circle1.c );
		var halfPi = Math.PI / 2; // Define halfPi

		// Check for cases where intersection is not two distinct points or no intersection
		if (d > (R + r) + 1e-9 || d < Math.abs(R - r) - 1e-9 || d === 0 && Math.abs(R-r) > 1e-9 ) { // Added tolerance and check for containment without touch
			return null;
		}
		if (d === 0 && Math.abs(R-r) < 1e-9) return null; // Coincident circles

		// Distance from center of circle0 to the midpoint of the chord connecting intersection points
		var baseRadius = ( ( d * d ) - ( r * r ) + ( R * R ) ) / ( 2 * d );
		
		// Half-length of the chord
		var h_sq = R*R - baseRadius*baseRadius;
		if (h_sq < -1e-9) return null; // No real intersection (should be caught by earlier checks but good for robustness)
		var radius = (h_sq > 0) ? Math.sqrt( h_sq ) : 0; // half-length of the common chord
		
		var angle = circle0.c.getAngleTo( circle1.c ); // Angle of the line connecting centers
		
		var p_mid_x = circle0.c.x + Math.cos( angle ) * baseRadius;
		var p_mid_y = circle0.c.y + Math.sin( angle ) * baseRadius;

		var p1 = new qlib.Vector2( p_mid_x + Math.cos( angle + halfPi ) * radius,
								   p_mid_y + Math.sin( angle + halfPi ) * radius	);
		
		if (radius < 1e-9) return [p1]; // Tangent case, one point

		var p2 = new qlib.Vector2( p_mid_x + Math.cos( angle - halfPi ) * radius,
								   p_mid_y + Math.sin( angle - halfPi ) * radius	);
		return [ p1, p2 ];
	}
		
		
	/**
	 * Calculates the intersection points of an infinite line (defined by two points) and a circle.
	 * Based on the method described at http://mathworld.wolfram.com/Circle-LineIntersection.html
	 *
	 * @static
	 * @method lineCircleIntersection
	 * @param {qlib.Vector2} startPoint - The first point defining the line.
	 * @param {qlib.Vector2} endPoint - The second point defining the line.
	 * @param {qlib.Circle} circle - The circle.
	 * @returns {qlib.Vector2[]|null} An array of `qlib.Vector2` intersection points (0, 1, or 2 points).
	 *                                Returns `null` if the line does not intersect the circle.
	 */
	IntersectionUtils.lineCircleIntersection = function( startPoint, endPoint, circle )
	{
		// Translate system so circle is at origin
		var p0 = new qlib.Vector2( startPoint.x - circle.c.x, startPoint.y - circle.c.y );
		var p1 = new qlib.Vector2( endPoint.x - circle.c.x, endPoint.y - circle.c.y );
		
		var r = circle.r;
		var dx = p1.x - p0.x;
		var dy = p1.y - p0.y;
		
		var dr2 = dx * dx + dy * dy; // Squared length of segment p0p1
		var D_val = p0.x * p1.y - p1.x * p0.y; // Determinant related to distance from origin to line
		var discriminant = ( r * r ) * dr2 - ( D_val * D_val );
		
		if ( discriminant < -1e-9 ) return null; // No intersection (with tolerance)
		
		var sqrtDiscriminant = (discriminant > 0) ? Math.sqrt( discriminant ) : 0;
		var sgn_dy = ( dy < 0 ) ? -1 : 1; // Sign of dy, or 1 if dy is 0

		var x1 = (  D_val * dy + sgn_dy * dx * sqrtDiscriminant ) / dr2;
		var y1 = ( -D_val * dx + Math.abs(dy) * sqrtDiscriminant ) / dr2; // abs(dy) as per MathWorld
		
		var ips = [ new qlib.Vector2( x1 + circle.c.x, y1 + circle.c.y ) ];
		
		if (Math.abs(discriminant) < 1e-9) return ips; // Tangent, one point (already added)
		
		// discriminant > 0, two points
		var x2 = (  D_val * dy - sgn_dy * dx * sqrtDiscriminant ) / dr2;
		var y2 = ( -D_val * dx - Math.abs(dy) * sqrtDiscriminant ) / dr2;
		ips.push( new qlib.Vector2( x2 + circle.c.x, y2 + circle.c.y ) );
		
		return ips;
	}
		
		
	/**
	 * Calculates the intersection points of a line segment and a circle.
	 * Based on algorithm from http://www.experts-exchange.com/Programming/Game/AI_Physics/Q_24977935.html
	 *
	 * @static
	 * @method segmentCircleIntersection
	 * @param {qlib.Vector2} startPoint - The start point of the segment.
	 * @param {qlib.Vector2} endPoint - The end point of the segment.
	 * @param {qlib.Circle} circle - The circle.
	 * @returns {qlib.Vector2[]|null} An array of `qlib.Vector2` intersection points (0, 1, or 2 points).
	 *                                Returns `null` if no intersection.
	 */
	IntersectionUtils.segmentCircleIntersection = function( startPoint, endPoint, circle )
	{
		var ips = [];
		var a, b, c_poly, bb4ac; // c_poly to avoid conflict with circle.c
		
		var dp = new qlib.Vector2( endPoint.x - startPoint.x, endPoint.y - startPoint.y );
		
		a = dp.x * dp.x + dp.y * dp.y; // Squared length of segment
		b = 2 * (dp.x * (startPoint.x - circle.c.x) + dp.y * (startPoint.y - circle.c.y));
		c_poly = circle.c.x * circle.c.x + circle.c.y * circle.c.y;
		c_poly += startPoint.x * startPoint.x + startPoint.y * startPoint.y;
		c_poly -= 2 * (circle.c.x * startPoint.x + circle.c.y * startPoint.y);
		c_poly -= circle.r * circle.r;
		
		bb4ac = b * b - 4 * a * c_poly; // Discriminant
		
		// Using a small epsilon for floating point comparisons instead of Number.MIN_VALUE
		var epsilon = 1e-9;
		if ( Math.abs(a) < epsilon || bb4ac < -epsilon ) return null; // Line is a point or no real solutions
		
		var mu1, mu2;
		if (Math.abs(bb4ac) < epsilon) { // Tangent or very close
			mu1 = -b / (2 * a);
			mu2 = mu1; // Treat as one point for tangency
		} else {
			mu1 = (-b + Math.sqrt(bb4ac)) / (2 * a);
			mu2 = (-b - Math.sqrt(bb4ac)) / (2 * a);
		}

		var p1_intersect = null, p2_intersect = null;

		if (mu1 >= -epsilon && mu1 <= 1.0 + epsilon) {
			p1_intersect = new qlib.Vector2( startPoint.x + dp.x * mu1, startPoint.y + dp.y * mu1 );
			ips.push(p1_intersect);
		}

		if (Math.abs(bb4ac) > epsilon) { // If two distinct roots for mu
			if (mu2 >= -epsilon && mu2 <= 1.0 + epsilon) {
				p2_intersect = new qlib.Vector2( startPoint.x + dp.x * mu2, startPoint.y + dp.y * mu2 );
				// Avoid adding duplicate point if mu1 and mu2 are extremely close and both valid
				var unique = true;
				if (p1_intersect && p1_intersect.squaredDistanceToVector(p2_intersect) < Intersection.SQUARED_SNAP_DISTANCE) {
					unique = false;
				}
				if (unique) ips.push(p2_intersect);
			}
		}
		
		return ips.length > 0 ? ips : null;
	}
	
	/**
	 * Calculates the intersection point of two lines (optionally treated as segments).
	 * Based on algorithm from http://keith-hair.net/blog/
	 *
	 * @static
	 * @method lineIntersectLine
	 * @param {qlib.Vector2} A - Start point of the first line/segment.
	 * @param {qlib.Vector2} B - End point of the first line/segment.
	 * @param {qlib.Vector2} E - Start point of the second line/segment.
	 * @param {qlib.Vector2} F - End point of the second line/segment.
	 * @param {boolean} [ABasSeg=true] - If true, treat line AB as a segment. Otherwise, as an infinite line.
	 * @param {boolean} [EFasSeg=true] - If true, treat line EF as a segment. Otherwise, as an infinite line.
	 * @returns {qlib.Vector2|null} The intersection point (`qlib.Vector2`), or `null` if no intersection or lines are parallel/coincident.
	 */
	IntersectionUtils.lineIntersectLine = function( A, B, E, F, ABasSeg, EFasSeg )
	{
		ABasSeg = ( ABasSeg == null ? true : ABasSeg );
		EFasSeg = ( EFasSeg == null ? true : EFasSeg );
		
		var a1 = B.y-A.y; var b1_coeff = A.x-B.x; // Renamed b1 to b1_coeff to avoid conflict
		var a2 = F.y-E.y; var b2_coeff = E.x-F.x; // Renamed b2 to b2_coeff
		
		var denom = a1*b2_coeff - a2*b1_coeff;
		if (Math.abs(denom) < 1e-9) return null; // Lines are parallel or coincident
		
		var c1 = B.x*A.y - A.x*B.y;
		var c2 = F.x*E.y - E.x*F.y;
		
		var ip = new qlib.Vector2();
		ip.x = (b1_coeff*c2 - b2_coeff*c1)/denom;
		ip.y = (a2*c1 - a1*c2)/denom;

		// Snap to original coordinates if lines are axis-aligned, helps with precision
		if (Math.abs(A.x - B.x) < 1e-9) ip.x = A.x;
		else if (Math.abs(E.x - F.x) < 1e-9) ip.x = E.x;
		if (Math.abs(A.y - B.y) < 1e-9) ip.y = A.y;
		else if (Math.abs(E.y - F.y) < 1e-9) ip.y = E.y;

		// Check segment bounds if requested
		var epsilon = 1e-9; // Tolerance for boundary checks
		if ( ABasSeg ) {
			if ( (ip.x < Math.min(A.x, B.x) - epsilon) || (ip.x > Math.max(A.x, B.x) + epsilon) ||
				 (ip.y < Math.min(A.y, B.y) - epsilon) || (ip.y > Math.max(A.y, B.y) + epsilon) )
				return null;
		}
		if ( EFasSeg ) {
			if ( (ip.x < Math.min(E.x, F.x) - epsilon) || (ip.x > Math.max(E.x, F.x) + epsilon) ||
				 (ip.y < Math.min(E.y, F.y) - epsilon) || (ip.y > Math.max(E.y, F.y) + epsilon) )
				return null;
		}
		return ip;
	}
	
	qlib["IntersectionUtils"] = IntersectionUtils;
}());
}());