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
this.qlib = this.qlib||{};

(function() {

	var CircleUtils = function() {}
	
	// static methods:
	CircleUtils.getTangentCircle = function( c1, c2, r, left )
	{
		left = (left == null ? true : left);
		var ct1 = new qlib.Circle( c1.c, c1.r + r );
		var ct2 = new qlib.Circle( c2.c, c2.r + r );
		var inters = ct1.intersect( ct2 );
		if ( inters.status == qlib.Intersection.INTERSECTION ) 
		{
			return new qlib.Circle( inters.points[left ? 0 : 1], r );
		}
		return null;
	}
	
	CircleUtils.getTangentCircles = function( c1, c2, r )
	{
		var ct1 = new qlib.Circle( c1.c, c1.r + r );
		var ct2 = new qlib.Circle( c2.c, c2.r + r );
		var inters = ct1.intersect( ct2 );
		if ( inters.status == qlib.Intersection.INTERSECTION ) 
		{
			return [new qlib.Circle( inters.points[0], r ), new qlib.Circle( inters.points[1], r )];
		}
		return null;
	}
	
	CircleUtils.getSoddyCircles = function( c1, c2, c3 )
	{
		var ra = c1.r;
		var rb = c2.r;
		var rc = c3.r;
		
		var innerRadius =  (ra*rb*rc) / ( ra*rb+ra*rc+rb*rc + 2 * Math.sqrt(ra*rb*rc*(ra+rb+rc)));
		var ct1 = new qlib.Circle( c1.c, c1.r + innerRadius );
		var ct2 = new qlib.Circle( c2.c, c2.r + innerRadius );
		var inters = ct1.intersect( ct2 );
		if ( inters.status == qlib.Intersection.INTERSECTION ) 
		{
			var innerSoddyCenter = inters.points[ c3.c.squaredDistanceToVector(inters.points[0]) < c3.c.squaredDistanceToVector(inters.points[1]) ? 0 : 1 ];
		} else {
			return null;
		}
		var innerSoddy = new qlib.Circle(innerSoddyCenter, innerRadius);
		
		
		var A = c1;
		var B = c2;
		var C = c3;
		
		var BC = new qlib.LineSegment( B.c, C.c);
		var U1 = BC.getClosestPointOnLine(A.c);
		var AU1 = new qlib.LineSegment(A.c,U1);
		AU1.p2_end = false;
		var US = AU1.intersect(A).points[0];
		var E = BC.intersect( B ).points[0];
		var EUS = new qlib.LineSegment(E,US);
		EUS.p2_end = false;
		
		var eui = EUS.intersect(A);
		var U = eui.points[ US.snaps( eui.points[0] ) ? 1 : 0 ];
		
		var AC = new qlib.LineSegment( A.c,C.c);
		var V1 = AC.getClosestPointOnLine(B.c);
		var BV1 = new qlib.LineSegment(B.c,V1);
		BV1.p2_end = false;
		
		var VS = BV1.intersect(B).points[0];
		var F = AC.intersect( A ).points[0];
		var FVS = new qlib.LineSegment(F,VS);
		FVS.p2_end = false;
		var fvi = FVS.intersect(B);
		var V = fvi.points[ VS.snaps( fvi.points[0] ) ? 1 : 0 ];
		
		
		var AB = new qlib.LineSegment( A.c,B.c);
		var W1 = AB.getClosestPointOnLine(C.c);
		var CW1 = new qlib.LineSegment(C.c,W1);
		CW1.p2_end = false;
		var WS = CW1.intersect(C).points[0];
		var G = AB.intersect( A ).points[0];
		var GWS = new qlib.LineSegment(G,WS);
		GWS.p2_end = false
		var gwi = GWS.intersect(C);
		var W = gwi.points[ WS.snaps( gwi.points[0] ) ? 1 : 0 ];
		
		return [ innerSoddy, CircleUtils.from3Points(U,V,W) ];	
	}
	
	
	CircleUtils.from3Points = function( p0, p1, p2 )
	{
		var m = [];
			
		m[0] = 1;
		m[1] = -2 * p0.x;
		m[2] = -2 * p0.y;
		m[3] = - p0.x * p0.x - p0.y * p0.y;
		
		m[4] = 1;
		m[5] = -2 * p1.x;
		m[6] = -2 * p1.y;
		m[7] = - p1.x * p1.x - p1.y * p1.y;
		
		m[8] = 1;
		m[9] = -2 * p2.x;
		m[10] = -2 * p2.y;
		m[11] = - p2.x * p2.x - p2.y * p2.y;
		
		qlib.MathUtils.GLSL( m );
		
		return new qlib.Circle(m[7],m[ 11 ],  Math.sqrt( m[7] * m[7] + m[11] * m[11] - m[3]) );
	}
	
	CircleUtils.getRingByCount = function( c, count, angleOffset, outerRing  )
	{
		if ( count < 2 ) count = 2;
		angleOffset = ( angleOffset == null ? 0 : angleOffset );
		outerRing = ( outerRing == null ? true : outerRing);
		if ( outerRing && count < 3 ) count = 3;
		
		var result = [];
		var f = ( outerRing ? 1: -1);
		var u = (2 * Math.PI * c.r) / ( 1 - Math.PI * f / count ); 
		
		var angle = Math.PI * 2 / (count * 2);
		var sa = Math.sin(angle);
		if ( sa != 1 )
		{
			var radius = ( c.r * sa ) / ( 1 - sa * f );
			var aStep = Math.PI * 2 / count;
			for ( var i = 0 ; i < count; i++ )
			{
				result.push( new qlib.Circle( c.c.getAddCartesian(angleOffset+i*aStep, c.r + radius * f),radius));
			}
		}
		return result;
	}
	
	
	CircleUtils.areKissingCircles = function( c1, c2, c3 )
	{
		return (c1.touches(c2) && c1.touches(c3) && c2.touches(c3));
	}
	
	/**
	 * @author Nicolas Barradeau
	 * http://en.nicoptere.net
	 *
	 * http://en.wikipedia.org/wiki/Problem_of_Apollonius
	 * http://mathworld.wolfram.com/ApolloniusProblem.html
	 * code adapted for quasimondolibs 
	 */
	//
	//
	CircleUtils.apolloniusCircles = function( c0, c1, c2 )
	{
		
		var v;
		var hc = [];
		
		v = this.homotheticCenters( c0, c1 );
		if ( v != null ) hc.push( v[0], v[1] );
		
		v = this.homotheticCenters( c1, c2 );
		if ( v != null ) hc.push( v[0], v[1] );
		
		v = this.homotheticCenters( c2, c0 );
		if ( v != null ) hc.push( v[0], v[1] );
		
		if ( hc.length != 6 ) return null;//erf... 2 tangents are coincident
		
		var p;
		var t0, t1;
		var angle, dist0, dist1 = 0, i, c;
		var radicalCenter = this.radicalCenter( c0, c1, c2 );
		var innerTangents = [];
		var outerTangents = [];
		var ac =[];
		
		var lines =  [	hc[ 1 ], hc[ 2 ],
			hc[ 2 ], hc[ 5 ],
			hc[ 3 ], hc[ 4 ],
			hc[ 1 ], hc[ 3 ]];
		
		for ( i = 0; i < lines.length; i+=2 )
		{
			p = c0.inversionPointFromPole( lines[ i ], lines[ i + 1 ] );
			
			
			v = qlib.IntersectionUtils.lineCircleIntersection( p, radicalCenter, c0 );
			if ( v != null )
			{
				if ( v.length == 1 )
				{
					innerTangents.push( v[ 0 ] );
					outerTangents.push( v[ 0 ] );
				}
				else
				{
					dist0 = radicalCenter.distanceToVector( v[ 0 ] );
					dist1 = radicalCenter.distanceToVector( v[ 1 ] );
					innerTangents.push( ( dist0 < dist1 ) ? v[ 0 ] : v[ 1 ] );
					outerTangents.push( ( dist0 >= dist1 ) ? v[ 0 ] : v[ 1 ] );
				}
			}
			
			p = c1.inversionPointFromPole( lines[ i ], lines[ i + 1 ] );
			v = qlib.IntersectionUtils.lineCircleIntersection( p, radicalCenter, c1 );
			if ( v != null )
			{
				if ( v.length == 1 )
				{
					innerTangents.push( v[ 0 ] );
					outerTangents.push( v[ 0 ] );
				}
				else
				{
					dist0 = radicalCenter.distanceToVector( v[ 0 ] );
					dist1 = radicalCenter.distanceToVector( v[ 1 ] );
					innerTangents.push( ( dist0 < dist1 ) ? v[ 0 ] : v[ 1 ] );
					outerTangents.push( ( dist0 >= dist1 ) ? v[ 0 ] : v[ 1 ] );
				}
			}
			
			p = c2.inversionPointFromPole( lines[ i ], lines[ i + 1 ] );
			v = qlib.IntersectionUtils.lineCircleIntersection( p, radicalCenter, c2 );
			if ( v != null )
			{
				if ( v.length == 1 )
				{
					innerTangents.push( v[ 0 ] );
					outerTangents.push( v[ 0 ] );
				}
				else
				{
					dist0 = radicalCenter.distanceToVector( v[ 0 ] );
					dist1 = radicalCenter.distanceToVector( v[ 1 ] );
					innerTangents.push( ( dist0 < dist1 ) ? v[ 0 ] : v[ 1 ] );
					outerTangents.push( ( dist0 >= dist1 ) ? v[ 0 ] : v[ 1 ] );
				}
			}				
		}
		
		for ( i = 0; i < innerTangents.length; i += 3 )
		{
			switch( ( i/3 ) | 0 )
			{
				case 0:
					t0 = new qlib.Triangle( innerTangents[i], innerTangents[i+1], outerTangents[i+2] );
					t1 = new qlib.Triangle( outerTangents[i], outerTangents[i + 1], innerTangents[i + 2] );
					break;
				
				case 1:
					t0 = new qlib.Triangle( innerTangents[ i ], outerTangents[ i + 1 ], innerTangents[ i + 2 ] );
					t1 = new qlib.Triangle( outerTangents[ i ], innerTangents[ i + 1 ], outerTangents[ i + 2 ] );
					break;
				
				case 2:
					t0 = new qlib.Triangle( innerTangents[ i ], outerTangents[ i + 1 ], outerTangents[ i + 2 ] );
					t1 = new qlib.Triangle( outerTangents[ i ], innerTangents[ i + 1 ], innerTangents[ i + 2 ] );
					break;
				
				case 3:
					t0 = new qlib.Triangle( innerTangents[ i ], innerTangents[ i + 1 ], innerTangents[ i + 2 ] );
					t1 = new qlib.Triangle( outerTangents[ i ], outerTangents[ i + 1 ], outerTangents[ i + 2 ] );
					break;
				
			}
			
			c = t0.getBoundingCircle();
			if ( c != null ) ac.push( c );
			
			c = t1.getBoundingCircle();
			if( c != null ) ac.push( c );
			
		}
		return ac;
	}
	
	//http://mathworld.wolfram.com/HomotheticCenter.html
	/**
	 * return the homothetic centers of 2 circles
	 * @param	circle0
	 * @param	circle1
	 * @return
	 */
	CircleUtils.homotheticCenters = function( circle0, circle1 )
	{
		var a = circle0.c.getAngleTo( circle1.c ) + Math.PI * 0.5;
		var p0 = circle0.c.getAddCartesian(a,circle0.r);
		var p1 = circle1.c.getAddCartesian(a,circle1.r);
		
		var externalCenter = qlib.IntersectionUtils.lineIntersectLine( circle0.c, circle1.c, p0, p1, false, false );
		p0 = circle0.c.getAddCartesian(a,-circle0.r);
		var internalCenter = qlib.IntersectionUtils.lineIntersectLine( circle0.c, circle1.c, p0, p1, false, false );
		
		if ( internalCenter == null || externalCenter == null ) return null;
		return[ internalCenter, externalCenter ];
		
	}
	
	
	//http://mathworld.wolfram.com/RadicalLine.html
	/**
	 * computes the radical line of 2 circles, length is for decoration purpose
	 * @param	circle0
	 * @param	circle1
	 * @param	length
	 * @return
	 */
	CircleUtils.radicalLine = function( circle0, circle1, length )
	{
		length = ( length == null ? -1 : length );
		var r0 = circle0.r;
		var r1 = circle1.r;
		var d = circle0.c.distanceToVector( circle1.c );
		var angle = circle0.c.getAngleTo( circle1.c );
		
		var d0 = ( ( d * d ) + ( r0 * r0 ) - ( r1 * r1 ) ) / ( d * 2 );
		
		if ( length < 0 ) length = d0;
		
		var p =	new qlib.Vector2(  circle0.c.x + Math.cos( angle ) * d0, 
			circle0.c.y + Math.sin( angle ) * d0 );
		return  [
			new qlib.Vector2(  p.x + Math.cos( angle + Math.PI /2 ) * length, 
				p.y + Math.sin( angle + Math.PI /2 ) * length ),
			new qlib.Vector2(  p.x + Math.cos( angle - Math.PI /2 ) * length, 
				p.y + Math.sin( angle - Math.PI /2 ) * length )
		];
	}
	
	//http://mathworld.wolfram.com/RadicalCenter.html
	/**
	 * returns the radical center ; the intersection Vector2 of 2 of the radical lines
	 * @param	circle0
	 * @param	circle1
	 * @param	circle2
	 * @return
	 */
	CircleUtils.radicalCenter = function( circle0, circle1, circle2 )
	{
		
		var rl0 = this.radicalLine( circle0, circle1 );
		var rl1 = this.radicalLine( circle0, circle2 );
		return qlib.IntersectionUtils.lineIntersectLine( rl0[0], rl0[1], rl1[0], rl1[1], false, false );
	}
		
		
	
qlib.CircleUtils = CircleUtils;
}());