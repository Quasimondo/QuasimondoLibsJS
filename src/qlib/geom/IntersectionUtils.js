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

	var IntersectionUtils = function() {}
	
	//http://mathworld.wolfram.com/Circle-CircleIntersection.html
	/**
	 * return the chord of the circle-circle intersection between circle0 and circle1
	 * @param	circle0
	 * @param	circle1
	 * @return
	 */
	IntersectionUtils.circlesIntersection = function( circle0, circle1 )
	{
		
		var R = circle0.r;
		var r = circle1.r;
		var d = circle0.c.distanceToVector( circle1.c );
		
		if ( d > ( R + r ) ) return null;
		
		var baseRadius = ( ( d * d ) - ( r * r ) + ( R * R ) ) / ( 2 * d );
		
		var radius = 1 / d * Math.sqrt( ( -d + r - R ) * ( -d - r + R ) * ( -d + r + R ) * ( d + r + R ) ) * .5;
		
		if ( radius <= 0 ) return null;
		
		var angle = circle0.c.getAngleTo( circle1.c );
		
		return [ 	new qlib.Vector2( 	circle0.c.x + Math.cos( angle ) * baseRadius + Math.cos( angle + halfPi ) * radius, 
			circle0.c.y + Math.sin( angle ) * baseRadius + Math.sin( angle + halfPi ) * radius	),
			
			new qlib.Vector2( 	circle0.c.x + Math.cos( angle ) * baseRadius + Math.cos( angle - halfPi ) * radius, 
				circle0.c.y + Math.sin( angle ) * baseRadius + Math.sin( angle - halfPi ) * radius	) ] ;
	}
		
		
	//http://mathworld.wolfram.com/Circle-LineIntersection.html
	/**
	 * returns 0, 1 or 2 points of intersection between the line defined by startPoint/endPoint and the circle
	 * @param	startPoint
	 * @param	endPoint
	 * @param	circle
	 * @return
	 */
	IntersectionUtils.lineCircleIntersection = function( startPoint, endPoint, circle )
	{
		
		var p0 = new qlib.Vector2( startPoint.x - circle.c.x, startPoint.y - circle.c.y );
		var p1 = new qlib.Vector2( endPoint.x - circle.c.x, endPoint.y - circle.c.y );
		
		var r = circle.r;
		var dx = p1.x - p0.x;
		var dy = p1.y - p0.y;
		
		var dr = Math.sqrt( dx * dx + dy * dy );
		var dr2 = dr * dr;
		var D = ( p0.x * p1.y ) - ( p1.x * p0.y );
		var discriminant = ( r * r ) * dr2 - ( D * D );
		
		if ( discriminant < 0 ) return null;
		
		var sqrtDiscriminant = Math.sqrt( discriminant );
		
		var x = (  D * dy + ( ( dy < 0 ) ? -1 : 1 ) * dx * sqrtDiscriminant ) / dr2;
		var y = ( -D * dx + ( ( dy < 0 ) ? -dy : dy ) * sqrtDiscriminant ) / dr2;
		
		var ips = [ new qlib.Vector2( x + circle.c.x, y + circle.c.y ) ];
		
		if ( discriminant == 0 ) return ips;
		
		if ( discriminant > 0 )
		{
			x = (  D * dy - ( ( dy < 0 ) ? -1 : 1 ) * dx * sqrtDiscriminant ) / dr2;
			y = ( -D * dx - ( ( dy < 0 ) ? -dy : dy ) * sqrtDiscriminant ) / dr2;
			ips.push( new qlib.Vector2( x + circle.c.x, y + circle.c.y ) );
		}
		
		return ips;
	}
		
		
	//http://www.experts-exchange.com/Programming/Game/AI_Physics/Q_24977935.html
	/**
	 * returns 0, 1 or 2 points of intersection between the segment defined by startPoint/endPoint and the circle
	 * @param	startPoint
	 * @param	endPoint
	 * @param	circle
	 * @return
	 */
	IntersectionUtils.segmentCircleIntersection = function( startPoint, endPoint, circle )
	{
		
		var ips = [];
		var a, b, c, bb4ac;
		
		var dp = new qlib.Vector2( endPoint.x - startPoint.x, endPoint.y - startPoint.y );
		
		a = dp.x * dp.x + dp.y * dp.y;
		b = 2 * (dp.x * (startPoint.x - circle.c.x) + dp.y * (startPoint.y - circle.c.y));
		c = circle.c.x * circle.c.x + circle.c.y * circle.c.y;
		c += startPoint.x * startPoint.x + startPoint.y * startPoint.y;
		c -= 2 * (circle.c.x * startPoint.x + circle.c.y * startPoint.y);
		c -= circle.r * circle.r;
		
		bb4ac = b * b - 4 * a * c;
		
		if ( ( ( a < 0 ) ? -a : a ) < Number.MIN_VALUE || bb4ac < 0 ) return null;
		
		var mu1, mu2;
		mu1 = (-b + Math.sqrt(bb4ac)) / (2 * a);
		mu2 = (-b - Math.sqrt(bb4ac)) / (2 * a);
		
		if ((mu1 < 0 || mu1 > 1) && (mu2 < 0 || mu2 > 1)) return null;
		
		var p1 = new qlib.Vector2( startPoint.x + ((endPoint.x - startPoint.x ) * mu1), startPoint.y + ((endPoint.y - startPoint.y) * mu1) );
		var p2 = new qlib.Vector2( startPoint.x + ((endPoint.x - startPoint.x ) * mu2), startPoint.y + ((endPoint.y - startPoint.y) * mu2) );
		
		if (mu1 > 0 && mu1 < 1 && (mu2 < 0 || mu2 > 1)) 
		{
			ips.push( p1 );
			return ips;
		}
		if (mu2 > 0 && mu2 < 1 && (mu1 < 0 || mu1 > 1)) 
		{
			ips.push( p2 );
			return ips;
		}
		if (mu1 > 0 && mu1 < 1 && mu2 > 0 && mu2 < 1)
		{
			if (mu1 == mu2)
			{
				ips.push( p1 );
			}
			else
			{
				ips.push(  p1, p2 );
			}
			return ips;
		}
		
		return null;
	}
	
	/*
	---------------------------------------------------------------
	http://keith-hair.net/blog/
	
	Checks for intersection of Segment if as_seg is true.
	Checks for intersection of Line if as_seg is false.
	Return intersection of Segment AB and Segment EF as a Point
	Return null if there is no intersection
	
	---------------------------------------------------------------
	*/
	IntersectionUtils.lineIntersectLine = function( A, B, E, F, ABasSeg, EFasSeg )
	{
		
		ABasSeg = ( ABasSeg == null ? true : ABasSeg );
		EFasSeg = ( EFasSeg == null ? true : EFasSeg );
		var a1, a2, b1, b2, c1, c2;
		
		a1= B.y-A.y;
		b1= A.x-B.x;
		a2= F.y-E.y;
		b2= E.x-F.x;
		
		var denom=a1*b2 - a2*b1;
		if (denom == 0)
		{
			return null;
		}
		
		c1= B.x*A.y - A.x*B.y;
		c2 = F.x * E.y - E.x * F.y;
		
		var ip = new qlib.Vector2();
		ip.x=(b1*c2 - b2*c1)/denom;
		ip.y=(a2*c1 - a1*c2)/denom;
		
		if ( A.x == B.x )
			ip.x = A.x;
		else if ( E.x == F.x )
			ip.x = E.x;
		if ( A.y == B.y )
			ip.y = A.y;
		else if ( E.y == F.y )
			ip.y = E.y;
		
		if ( ABasSeg )
		{
			if ( ( A.x < B.x ) ? ip.x < A.x || ip.x > B.x : ip.x > A.x || ip.x < B.x )
				return null;
			if ( ( A.y < B.y ) ? ip.y < A.y || ip.y > B.y : ip.y > A.y || ip.y < B.y )
				return null;
		}
		if ( EFasSeg )
		{
			if ( ( E.x < F.x ) ? ip.x < E.x || ip.x > F.x : ip.x > E.x || ip.x < F.x )
				return null;
			if ( ( E.y < F.y ) ? ip.y < E.y || ip.y > F.y : ip.y > E.y || ip.y < F.y )
				return null;
		}
		return ip;
	}
	
	qlib["IntersectionUtils"] = IntersectionUtils;
}());