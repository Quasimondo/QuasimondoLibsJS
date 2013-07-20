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

var Intersection = function() {
	this.status = Intersection.NO_INTERSECTION;
	this.points = [];
}

Intersection.SQUARED_SNAP_DISTANCE = 1e-15;

Intersection.INTERSECTION = "INTERSECTION";
Intersection.NO_INTERSECTION = "NO INTERSECTION";
Intersection.COINCIDENT = "COINCIDENT";
Intersection.PARALLEL = "PARALLEL";
Intersection.INSIDE = "INSIDE";
Intersection.OUTSIDE = "OUTSIDE";
Intersection.TANGENT = "TANGENT";


Intersection.intersect = function( shape1, shape2 ) 
{
	switch(  shape1.type + shape2.type )
	{
		case "CircleCircle":
			return new Intersection().circle_circle( shape1, shape2 );
			break;
		case "Bezier2Bezier2":
			return new Intersection().bezier2_bezier2( shape1, shape2 );
		break;
		case "Bezier2LineSegment":
			return new Intersection().bezier2_line( shape1, shape2 );
		break;
		case "LineSegmentBezier2":
			return new Intersection().bezier2_line( shape2, shape1 );
		break;
		case "Bezier2Ellipse":
			return new Intersection().bezier2_ellipse( shape1, shape2 );
		break;
		case "EllipseBezier2":
			return new Intersection().bezier2_ellipse( shape2, shape1 );
		break;
		case "LineSegmentLineSegment":
			return new Intersection().line_line( shape1, shape2 );
		break;
		case "EllipseLineSegment":
			return new Intersection().ellipse_line( shape1, shape2 );
		break;
		case "LineSegmentEllipse":
			return new Intersection().ellipse_line( shape2, shape1 );
		break;
		case "EllipseEllipse":
			return new Intersection().ellipse_ellipse( shape1, shape2 );
		break;
		case "CircleLineSegment":
			return new Intersection().circle_line( shape1, shape2 );
			break;
		case "LineSegmentCircle":
			return new Intersection().circle_line( shape2, shape1 );
			break;
		case "Bezier2Bezier3":
			return new Intersection().bezier2_bezier3( shape1, shape2 );
			break;
		case "Bezier3Bezier2":
			return new Intersection().bezier2_bezier3( shape2, shape1 );
			break;
		case "Bezier3Bezier3":
			return new Intersection().bezier3_bezier3( shape2, shape1 );
			break;
		case "Bezier3LineSegment":
			return new Intersection().bezier3_line( shape1, shape2 );
			break;
		case "LineSegmentBezier3":
			return new Intersection().bezier3_line( shape2, shape1 );
			break;
		case "TriangleLineSegment":
			return new Intersection().line_triangle( shape2, shape1 );
			break;
		case "LineSegmentTriangle":
			return new Intersection().line_triangle( shape1, shape2 );
			break;
		case "PolygonLineSegment":
			return new Intersection().line_polygon( shape2, shape1 );
			break;
		case "LineSegmentPolygon":
			return new Intersection().line_polygon( shape1, shape2 );
			break;
		case "ConvexPolygonLineSegment":
			return new Intersection().line_convexPolygon( shape2, shape1 );
			break;
		case "ConvexPolygonConvexPolygon":
			return new Intersection().convexPolygon_convexPolygon( shape2, shape1 );
			break;
		case "LineSegmentConvexPolygon":
			return new Intersection().line_convexPolygon( shape1, shape2 );
			break;
		case "LineSegmentMixedPath":
			return new Intersection().line_mixedPath( shape1, shape2 );
			break;
		case "MixedPathLineSegment":
			return new Intersection().line_mixedPath(shape2, shape1 );
			break;
		case "PolygonPolygon":
			return new Intersection().polygon_polygon( shape2, shape1 );
			break;
		case "ConvexPolygonPolygon":
			return new Intersection().convexPolygon_polygon( shape1, shape2 );
			break;
		case "PolygonConvexPolygon":
			return new Intersection().convexPolygon_polygon( shape2, shape1 );
			break;
		case "CompoundShapeLineSegment":
			return new Intersection().compoundShape_line( shape1, shape2 );
			break;
		case "LineSegmentCompoundShape":
			return new Intersection().compoundShape_line( shape2, shape1 );
			break;
		case "CompoundShapeTriangle":
			return new Intersection().compoundShape_triangle( shape1, shape2 );
			break;
		case "TriangleCompoundShape":
			return new Intersection().compoundShape_triangle( shape2, shape1  );
			break;
		case "CompoundShapePolygon":
			return new Intersection().compoundShape_polygon( shape1, shape2 );
			break;
		case "PolygonCompoundShape":
			return new Intersection().compoundShape_polygon( shape2, shape1  );
			break;
		case "CompoundShapeCompoundShape":
			return new Intersection().compoundShape_compoundShape( shape1, shape2 );
			break;
		case "GeometricCompositeLineSegment":
			return new Intersection().geometricComposite_line( shape1, shape2 );
			break;
		case "LineSegmentGeometricComposite":
			return new Intersection().geometricComposite_line( shape2, shape1 );
			break;
		case "PolygonTriangle":
			return new Intersection().polygon_triangle( shape1, shape2  );
			break;
		case "TrianglePolygon":
			return new Intersection().polygon_triangle( shape2, shape1  );
			break;
		case "ConvexPolygonCircle":
			return new Intersection().circle_convexPolygon( shape2, shape1 );
			break;
		case "CircleConvexPolygon":
			return new Intersection().circle_convexPolygon( shape1, shape2 );
			break;
		case "PolygonCircle":
			return new Intersection().circle_polygon( shape2, shape1 );
			break;
		case "CirclePolygon":
			return new Intersection().circle_polygon( shape1, shape2 );
			break;
	}
	return null;
}


var p = Intersection.prototype;
	
// public properties:

	p.appendPoint = function( p )
	{
		for ( var i = this.points.length; --i > -1; )
		{
			if ( this.points[i].squaredDistanceToVector( p ) < Intersection.SQUARED_SNAP_DISTANCE ) return;
		}
		this.points.push(p);
	}
	
	p.circle_line = function( c, l )
	{
		var a = (l.p2.x-l.p1.x)*(l.p2.x-l.p1.x)+(l.p2.y-l.p1.y)*(l.p2.y-l.p1.y);
		var b = 2*((l.p2.x-l.p1.x)*(l.p1.x-c.c.x)+(l.p2.y-l.p1.y)*(l.p1.y-c.c.y));
		var cc = c.c.x * c.c.x + c.c.y * c.c.y + l.p1.x * l.p1.x + l.p1.y * l.p1.y - 2 *( c.c.x * l.p1.x + c.c.y * l.p1.y ) - c.r * c.r;
		var deter = b * b - 4 * a * cc;
		
		if (deter<0) 
		{
			status = Intersection.OUTSIDE;
		} else if (deter == 0) 
		{
			status = Intersection.TANGENT;
		} else 
		{
			var e = Math.sqrt(deter);
			var u1 = (-b+e)/(2*a);
			var u2 = (-b-e)/(2*a);
			if (((u1<0 && l.p1_end) || (u1>1 && l.p2_end)) && ((u2<0 && l.p1_end) || (u2>1 && l.p2_end))) 
			{
				if ((u1<0 && u2<0) || (u1>1 && u2>1)) 
				{
					status = Intersection.OUTSIDE;
				} else {
					status = Intersection.INSIDE;
				}
			} else 
			{
				status = Intersection.INTERSECTION;
				if ((0<=u1 || !l.p1_end) && (u1<=1 || !l.p2_end)) 
				{
					this.appendPoint(l.p1.getLerp(l.p2, u1));
				}
				if ((0<=u2 || !l.p1_end) && (u2<=1  || !l.p2_end)) {
					this.appendPoint(l.p1.getLerp(l.p2, u2));
				}
			}
		}
		return this;
	};
		
	p.circle_circle = function(c1, c2 )
	{
		var r_max = c1.r+c2.r;
		var r_min = Math.abs(c1.r-c2.r);
		var c_dist = c1.c.distanceToVector( c2.c );
		
		if (c_dist == 0 && r_min == 0) {
			this.status = Intersection.COINCIDENT;
		} else if (c_dist>r_max) {
			this.status = Intersection.OUTSIDE;
		} else if (c_dist<r_min) {
			this.status = Intersection.INSIDE;
		} else {
			this.status = Intersection.INTERSECTION;
			var a = (c1.r*c1.r-c2.r*c2.r+c_dist*c_dist)/(2*c_dist);
			if ( a > c1.r ) a = c1.r;
			var h = Math.sqrt(c1.r*c1.r-a*a);
			var p = c1.c.getLerp(c2.c, a/c_dist);
			var b = h / c_dist;
			this.appendPoint(new qlib.Vector2(p.x-b*(c2.c.y-c1.c.y), p.y+b*(c2.c.x-c1.c.x)));
			this.appendPoint(new qlib.Vector2(p.x+b*(c2.c.y-c1.c.y), p.y-b*(c2.c.x-c1.c.x)));
		}
		return this;
	};
	

	/**
	 * Returns a string representation of this object.
	 * @method toString
	 * @return {String} a string representation of the instance.
	 **/
	p.toString = function() {
		return "Intersection: "+this.status;
	}
	
qlib.Intersection = Intersection;
}());