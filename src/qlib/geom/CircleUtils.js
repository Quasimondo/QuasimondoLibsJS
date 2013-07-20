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
	
qlib.CircleUtils = CircleUtils;
}());