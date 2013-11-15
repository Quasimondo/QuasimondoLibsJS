/*
* Convex Polygon
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

var ConvexPolygon = function() {
  this.points = [];
  this.dirty = false;
  this.centroid = new qlib.Vector2();
}

ConvexPolygon.fromArray = function( points )
{
	var cv = new qlib.ConvexPolygon();
	var p = cv.points;
	for ( var i = 0; i < points.length; i++ )
	{
		cv.points.push( points[i] );
	}
	cv.updateConvexHull();
	return cv;
}
		

	var p = ConvexPolygon.prototype = new qlib.GeometricShape();
	p.type = "ConvexPolygon";

	p.updateConvexHull = function()
	{
		this.dirty = false;
		var points = this.points;
		
		points.sort( this.vectorSort );
		if ( points.length<3)
		{
			return;
		}
		
	
		
		var n = points.length;
		var result = [];
		var bot = 0;
		var top = -1;
		var i;
		var minmin = 0;
		var minmax;
		var p;
		var p_minmin;
		var p_maxmin;
		var p_maxmax;
		var p_minmax;
		
		var xmin = points[0].x;
		
		for ( i=1; i<n; i++) 
		{
			if ( points[i].x != xmin) 
			{
				break;
			}
		}
		minmax = i-1;
		if (minmax == n-1) 
		{
			p =  points[minmin];
			result[++top] = p;
			if (points[minmax].y != p.y)
			{
				result[++top] = points[minmax];
			}
			result[++top] = p;
			points = result;
			return;
		}
		
		var maxmin;
		var maxmax = n-1;
		var xmax = points[n-1].x;
		
		for (i=n-2; i>=0; i--) 
		{
			if ( points[i].x != xmax) 
			{
				break;
			}
		}
		maxmin = i+1;
		result[++top] = points[minmin];
		i = minmax;
		p_minmin = points[minmin];
		p_maxmin = points[maxmin];
		
		while ( ++i <= maxmin ) 
		{
			
			p = points[i];
			
			if ( ( p.isLeft( p_minmin, p_maxmin) >= 0 ) && ( i < maxmin ) ) 
			{
				continue;
			}
			
			while ( top > 0 ) 
			{
				if ( p.isLeft( result[top-1], result[top] ) > 0 ) 
				{
					break;
				} else {
					top--;
				}
			}
			result[++top] = p;
		}
		
		p_maxmax = points[maxmax];
		p_minmax = points[minmax];
		
		if ( maxmax != maxmin ) 
		{
			result[++top] = p_maxmax;
		}
		
		bot = top;
		i = maxmin;
		
		while ( --i >= minmax ) 
		{
			
			p = points[i];
			
			if ( ( p.isLeft(p_maxmax, p_minmax)>=0 ) && ( i>minmax )) 
			{
				continue;
			}
			
			while (top>bot) 
			{
				if ( p.isLeft( result[top-1], result[top])>0) 
				{
					break;
				} else {
					top--;
				}
			}
			result[++top] = p;
		}
		
		if (minmax != minmin ) 
		{
			result[int(++top)] = p_minmin;
		}
		
		this.points = result.slice( 0, top );
		this.updateBoundingRect();
	}
	
	p.vectorSort = function( a, b )
	{
		if (a.x<b.x) return -1;
		if (a.x>b.x) return 1;
		if (a.x==b.x){
			if (a.y<b.y) return -1;
			if (a.y>b.y) return 1;
		}
		return 0;
	}
	
	p.updateBoundingRect = function()
	{
		var points = this.points;
		var p = points[0];
		var minX = p.x;
		var maxX = minX;
		var minY = p.y;
		var maxY = minY;
		for ( var i = 1; i< points.length; i++ )
		{
			p =  points[i];
			if ( p.x < minX ) minX = p.x;
			else if ( p.x > maxX ) maxX = p.x;
			if ( p.y < minY ) minY = p.y;
			else if ( p.y > maxY ) maxY = p.y;
		}
		
		this._boundingRect = new qlib.Rectangle( minX, minY, maxX - minX, maxY - minY );
	}
	
	p.rotate = function( angle, center )
	{
		if ( center == null ) center = this.getCentroid();
		var points = this.points;
		for ( var i in points )
		{
			points[i].rotateAround(angle, center );
		}
		this.dirty = true;
		return this;
	}
	
	p.scale = function( factorX, factorY, center )
	{
		if ( center == null ) center = this.getCentroid();;
		var points = this.points;
		for ( var i in points )
		{
			points[i].minus( center ).multiplyXY( factorX, factorY ).plus( center );
		}
		this.dirty = true;
		return this;
	}
	
	p.translate = function( offset )
	{
		var points = this.points;
		for ( var i in points )
		{
			points[i].plus(offset);
		}
		this.dirty = true;
		return this;
	}
	
	p.getCentroid = function()
	{
		
		if ( this.dirty ) 
		{
			this.updateConvexHull();
			
			var sx = 0;
			var sy = 0;
			var a = 0;
			
			var p1;
			var p2;
			var f;
			var points = this.points;
			for ( var i = 0; i< points.length; i++ )
			{
				p1 = points[i];
				p2 = points[(i+1) % points.length];
				a += ( f = p1.x * p2.y - p2.x * p1.y );
				sx += (p1.x + p2.x) * f;
				sy += (p1.y + p2.y) * f;
			}
			
			if ( a != 0 )
			{
				f = 1 / ( 3 * a );
			} else {
				f = 0;
			}
			this.centroid.x = sx * f;
			this.centroid.y = sy * f;
		}
		return this.centroid;
	}
	
	p.draw = function( canvas )
	{
		if ( this.dirty )
		{
			this.updateConvexHull();
		}
		var points = this.points;
		if ( points.length > 0 )
		{
			canvas.moveTo( points[points.length-1].x, points[points.length-1].y );
			for (var i=0;i<points.length;i++)
			{
				canvas.lineTo( points[i].x, points[i].y );
			}
		} 
	}

qlib.ConvexPolygon = ConvexPolygon;
}());
	/*
	public class ConvexPolygon extends GeometricShape implements IIntersectable, ICountable
	{
		
		public static const SMOOTH_PATH_RELATIVE_EDGEWISE = 0;
		public static const SMOOTH_PATH_ABSOLUTE_EDGEWISE = 1;
		public static const SMOOTH_PATH_RELATIVE_MINIMUM = 2;
		public static const SMOOTH_PATH_ABSOLUTE_MINIMUM = 3;
		
		public static const CUBIC_PATH_RELATIVE = 0;
		public static const CUBIC_PATH_ABSOLUTE = 1;
		
		public static const CONVEX_DEGENERATE:String = "CONVEX_DEGENERATE";
		public static const CONVEX_CCW:String = "CONVEX_CCW";
		public static const CONVEX_CW:String = "CONVEX_CW";
		
		public static const TRIANGULATE_SIMPLE = 0;
		public static const TRIANGULATE_CENTER = 1;
		public static const TRIANGULATE_DIVIDE = 2;
		
		private var _boundingRect:Rectangle;
		
		
		
		public static function fromVector( points:Vector.<Vector2> ):ConvexPolygon
		{
			var cv:ConvexPolygon = new ConvexPolygon();
			cv.points = points.concat();
			cv.updateConvexHull();
			return cv;
		}
		
		public static function fromRectangle( rect:Rectangle ):ConvexPolygon
		{
			var cv:ConvexPolygon = new ConvexPolygon();
			cv.addPoint( new Vector2( rect.x, rect.y ) );
			cv.addPoint( new Vector2( rect.x + rect.width,rect.y ) );
			cv.addPoint( new Vector2( rect.x + rect.width,rect.y + rect.height ) );
			cv.addPoint( new Vector2( rect.x, rect.y + rect.height ) );
			cv.updateConvexHull();
			return cv;
		}
		
		public static function getRegularPolygon( sideLength:Number, sides:Number, center:Vector2 = null, rotation:Number = 0 ):ConvexPolygon
		{
			var angle:Number = 2 * Math.PI / sides;
			var radius:Number = (sideLength * 0.5 ) / Math.sin(angle*0.5);
			if ( center == null ) center = new Vector2();
			var poly:ConvexPolygon = new ConvexPolygon();
			for ( var i = 0; i< sides; i++ )
			{
				poly.addPoint( new Vector2( center.x + radius * Math.cos( rotation + i * angle ),center.y + radius * Math.sin( rotation + i * angle )  ) );
			}	
			return poly;
		}
		
		public function ConvexPolygon()
		{
			points = new Vector.<Vector2>();
		}
		
		public function addSegment( line:LineSegment ):void
		{
			
			addPoint( line.p1 );
			addPoint( line.p2 );
			
		}
		
		public function addPoint( p:Vector2 ):void
		{
			if ( p == null || hasPoint( p ) ) return;
			points.push( p );
			dirty = true;
		}
		
		public function getPointAt( index ):Vector2
		{
			return points[int(((index % points.length )+ points.length) % points.length )];
		}
		
		override public function hasPoint( p:Vector2 ):Boolean
		{
			for ( var i = points.length; --i>-1;)
			{
				if ( p.squaredDistanceToVector( points[i] ) < SNAP_DISTANCE * SNAP_DISTANCE) {
					return true;
				}
			}
			return false;
		}
		
		public function getIndexOfPoint( p:Vector2 ):int
		{
			for ( var i = points.length; --i>-1;)
			{
				if ( p.squaredDistanceToVector( points[i] ) < SNAP_DISTANCE * SNAP_DISTANCE ) {
					return i;
				}
			}
			return -1;
		}
		
		override public function clone( deepClone:Boolean = true ):GeometricShape
		{
			if ( deepClone )
			{
				var tmp:Vector.<Vector2> = new Vector.<Vector2>();
				for ( var i = 0; i < points.length; i++ )
				{
					tmp.push( points[i].getClone() );
				}
				return ConvexPolygon.fromVector( tmp );
			} else {
				return ConvexPolygon.fromVector( points );
			}
		}
		
		public function clonePoints():ConvexPolygon
		{
			for ( var i = 0; i < points.length; i++ )
			{
				points[i] = points[i].getClone();
			}
			return this;
		}
		
		
		public function get pointCount():int
		{
			if ( dirty )
			{
				updateConvexHull();
			}
			return points.length;
		}
		
		override public function get length():Number
		{
			var result:Number = 0;
			for ( var i = 0; i< points.length; i++ )
			{
				result += getSide(i).length;
			}
			return result;
		}
		
		override public function getPointAtOffset( offset:Number ):Vector2
		{
			return getPoint( offset / length );
		}
		
		override public function getPoint( t:Number ):Vector2
		{
		    t %= 1;
		    if ( t<0) t+= 1;
		    
			var side:LineSegment;
			var totalLength:Number = length;
			var t_sub:Number;
			
			for ( var i = 0; i< points.length; i++ )
			{
				side =  getSide(i);
				t_sub = side.length / totalLength;
				if ( t > t_sub )
				{
				 	t-= t_sub;
				}else {
					return side.getPoint( t / t_sub );
				}
			}
			return null;
		}
		
		public function get area():Number
		{
			
			if ( dirty )
			{
				updateConvexHull();
			}
			
			var sx:Number = 0;
			var sy:Number = 0;
			var a:Number = 0;
			
			var p1:Vector2;
			var p2:Vector2;
			
			
			for ( var i = 0; i< points.length; i++ )
			{
				p1 = points[i];
				p2 = points[(i+1) % points.length];
				a += p1.x * p2.y - p2.x * p1.y ;
				
			}
			
			return 0.5 * a;
		}
		
		
		public function get majorAngle():Number
		{
			var centerOfMass:Vector2 = centroid;
		
			var dx_sum:Number = 0;
			var dy_sum:Number = 0;
			var dxy_sum:Number = 0;
			
			for each ( var p:Vector2 in points )
			{
				dx_sum += Math.pow(p.x - centerOfMass.x,2);
				dy_sum += Math.pow(p.y - centerOfMass.y,2);
				dxy_sum += (p.x - centerOfMass.x) * (p.y - centerOfMass.y)
			}
			var dy:Number = 2*dxy_sum;
			var dx:Number = dx_sum  - dy_sum + Math.sqrt(Math.pow(dx_sum-dy_sum,2) + Math.pow(2 * dxy_sum,2) );
			if ( dy == 0 && dx == 0 )
			{
				return ( dx_sum >= dy_sum ? 0 : Math.PI * 0.5 );
			}
			return Math.atan2( dy, dx );
		}
		
		
		
		
		override public function isInside( p:Vector2, includeVertices:Boolean = true ):Boolean
		{
			if ( dirty )
			{
				updateConvexHull();
			}
			
			var num_verts = points.length;
			var v1:Vector2;
			var nx:Number, ny:Number, x:Number, y:Number;
			
			for ( var loop = 0; loop < num_verts; loop++ )
			{
				v1 = points[ loop ];
			//	generate a 2d normal ( no need to normalise ).
				nx = points[ int(( loop + 1 ) % num_verts)].y - v1.y;
				ny = v1.x - points[ int(( loop + 1 ) % num_verts) ].x;
		
				x = p.x - v1.x;
				y = p.y - v1.y;
		
			//	Dot with edge normal to find side.
				var t:Number = ( x * nx ) + ( y * ny );
				if (t == 0) return includeVertices;
				else if ( t > 0 ) return false
				//if ( includeVertices ? (( x * nx ) + ( y * ny ) > 0) : (( x * nx ) + ( y * ny ) >= 0) )
				//	return false;
			}
		
			return true;
		}
		
		public function getSide( index ):LineSegment
		{
			index = ( index % points.length + points.length) % points.length;
			return new LineSegment( points[index], points[int((index+1)% points.length)] );
		}
		
		
		
		public function getSlices( l:LineSegment ):Vector.<ConvexPolygon>
		{
			if ( dirty )
			{
				updateConvexHull();
			}
			
			var result:Vector.<ConvexPolygon> = new Vector.<ConvexPolygon>();
			var intersections:Vector.<Vector2> = new Vector.<Vector2>();
			var intersectionIndices:Vector.<int> =  new Vector.<int>();
			var intersection:Vector.<Vector2>;
			var s:LineSegment;
			for ( var i = 0; i < pointCount; i++ )
			{
				s = getSide( i );
				intersection = s.getIntersection( l, true, false );
				if ( intersection.length == 1 )
				{
					intersections.push( intersection[0] );
					intersectionIndices.push( i );
				} else if ( intersection.length == 2 )
				{
					intersections.push( intersection[0] );
					intersectionIndices.push( i );
					intersections.push( intersection[1] );
					intersectionIndices.push( i );
					//throw( new Error("unhandled colinear intersection in ConvexPolygon - write code to handle this!"));
				}
			} 
			
			while ( intersections.length > 2 )
			{
				var smallestDistance:Number = Number.MAX_VALUE;
				var smallestIndex = -1;
				var distance:Number;
				var intersectionPoint:Vector2;
				for ( i = intersections.length; --i >0; )
				{
					intersectionPoint = intersections[i];
				
					for ( var j = i; --j >-1; )
					{
						distance = intersectionPoint.squaredDistanceToVector( intersections[j] );
						if (  distance < smallestDistance )
						{
							smallestDistance = distance;
							smallestIndex = j;
						}
					}
				}
				intersections.splice( smallestIndex, 1 );
				intersectionIndices.splice( smallestIndex, 1 );
			}
			
			if ( intersections.length == 2 )
			{
				var cv:ConvexPolygon = new ConvexPolygon();
				cv.addPoint( intersections[0] );
				for ( i = intersectionIndices[0]+1; i<intersectionIndices[1];i++)
				{
					cv.addPoint( points[i] );
				}
				cv.addPoint( points[i] );
				cv.addPoint( intersections[1] );
				
				if ( cv.pointCount > 2 )
				{
					result.push( cv );
				}
				
				cv = new ConvexPolygon();
				cv.addPoint( intersections[1] );
				for ( i = (intersectionIndices[1]+1)%points.length; i!=intersectionIndices[0];i = (i + 1) % points.length)
				{
					cv.addPoint( points[i]);
				}
				cv.addPoint( points[i] );
				cv.addPoint( intersections[0] );
				if ( cv.pointCount > 2 )
				{
					result.push( cv );
				}
			} else {
				result.push( this );
			}
			
			return result;
		}
		
		// Offsets < 0 shrink, offsets > 0 grow
		public function getOffsetPolygon( offset:Number ):ConvexPolygon
		{
			if ( dirty )
			{
				updateConvexHull()
			}
			
			if ( offset==0 || points.length < 3) return ConvexPolygon(clone());
			
			offset = -offset;
			
			var finalPoly:ConvexPolygon;
			var side:LineSegment;
			var side2:LineSegment;
			var index;
			var slices:Vector.<ConvexPolygon>;
			var p:Vector2;
			var d:Number;
			var intersection:Intersection;
				
			if ( offset > 0 )
			{
				finalPoly = ConvexPolygon(clone());
			
				var snapOffset:Number = offset * 0.999;
				
				for ( var i = 0; i < points.length; i++ )
				{
					side = getSide( i );
					
					// in theory this could fail in rare cases: - the getSlices method should work with infinite lines
					slices = finalPoly.getSlices( side.getParallel( offset ).multiply( 100* Math.max(1, Math.abs(offset)) ));
					
					if ( slices.length == 2 ) 
					{
						finalPoly = slices[0];
						d = finalPoly.distanceToLine( side );
						if (  d < snapOffset ) 
						{
							finalPoly = slices[1];
							d = finalPoly.distanceToLine( side );
							if ( d < snapOffset ) {
								return null;
							}
						} else if ( slices[1].distanceToLine( side )  > d )
						{
							finalPoly = slices[1];
						}
						
					} else if ( slices.length == 0 )
					{
						d = finalPoly.distanceToLine( side ) ;
						if (  d < snapOffset ) {
							return null;					
						}
						
					} else if ( slices.length == 1 )
					{
						d = slices[0].distanceToLine( side ) ;
						if (  d < snapOffset ) {
							return null;					
						};
						
					}
				}
			} else {
				
				finalPoly = new ConvexPolygon();
				side2 = getSide( i-1 ).getParallel( offset );
				for ( i = 0; i < points.length; i++ )
				{
					side = getSide( i ).getParallel( offset );
					var intersections:Vector.<Vector2> = side.getIntersection( side2 );
					if ( intersections.length != 0 ) finalPoly.addPoint( intersections[0] );
					side2 = side;
				}
			}
			return finalPoly;
		}
		
		public function squaredDistanceToPoint( p:Vector2 ):Number
		{
			var minDist:Number = getSide( 0 ).getClosestPoint( p ).squaredDistanceToVector( p );
			var dist:Number;
			for ( var i = 1; i < points.length; i++ )
			{
				dist = getSide( i ).getClosestPoint( p ).squaredDistanceToVector( p );
				if ( dist < minDist ) dist = minDist;
			}
			return dist;
		}
		
		public function getClosestConnectionToLine( l:LineSegment ):LineSegment
		{
			var shortest:LineSegment = getSide( 0 ).getShortestConnectionToLine( l );
			var connection:LineSegment;
			if (shortest.length == 0 ) return shortest;
			for ( var i = 1; i < points.length; i++ )
			{
				connection = getSide( i ).getShortestConnectionToLine( l );
				if ( connection.length < shortest.length ){
					if (shortest.length == 0 ) return shortest;
					shortest = connection;
				} 
			}
			return shortest;
		}
		
		public function distanceToLine( l:LineSegment ):Number
		{
			return getClosestConnectionToLine( l ).length;
		}
		
		override public function getClosestPoint( p:Vector2 ):Vector2
		{
			var closest:Vector2 = getSide( 0 ).getClosestPoint( p );
			var minDist:Number = closest.squaredDistanceToVector( p );
			var dist:Number;
			var pt:Vector2;
			for ( var i = 1; i < points.length; i++ )
			{
				pt = getSide( i ).getClosestPoint( p );
				dist = pt.squaredDistanceToVector( p );
				if ( dist < minDist ) {
					minDist = dist ;
					closest = pt;
				}
			}
			return closest;
		}
		
		public function getCubicBezierPath( smoothFactor:Number, mode = CUBIC_PATH_RELATIVE ):MixedPath
		{
			if ( dirty )
			{
				updateConvexHull();
			}
			
			var path:MixedPath = new MixedPath();
			var p0:Vector2, p1:Vector2, p2:Vector2, p3:Vector2;
			
			for ( var i = 0; i < points.length; i++ )
			{
				p0 = points[ (i-4+2*points.length) % points.length];
				p1 = points[ (i-3+2*points.length) % points.length];
				p2 = points[ (i-2+2*points.length) % points.length];
				p3 = points[ (i-1+2*points.length) % points.length];
				
				var v0:Vector2 = p0.getMinus( p1 );
				var v1:Vector2 = p1.getMinus( p2 );
				
				var tangentLength:Number = ( mode == CUBIC_PATH_RELATIVE ? v1.length * smoothFactor : smoothFactor );
				v1.newLength( v0.length );
				v0 = p1.getPlus( v0 ).lerp( p1.getPlus( v1 ), 0.5 ).minus(p1);
				v0.newLength(tangentLength );
				
				v1 = p1.getMinus( p2 );
				var v2:Vector2 = p2.getMinus( p3 );
				
				tangentLength = ( mode == CUBIC_PATH_RELATIVE ? v1.length * smoothFactor : smoothFactor );
				var tangentLength2:Number = ( mode == CUBIC_PATH_RELATIVE ? v2.length * smoothFactor : smoothFactor );
				v2.newLength( v1.length );
				v1 = p2.getPlus( v1 ).lerp( p2.getPlus( v2 ), 0.5 ).minus(p2);
				v1.newLength(tangentLength );
				
				path.addPoint( p1 );
				path.addControlPoint( p1.getMinus(v0) );
				path.addControlPoint( p2.getPlus( v1 ) );
			}
			
			path.setClosed( true );
				
			return path;	
		}
		
		public function getSmoothPath( factor:Number, mode = 0):MixedPath
		{
			if ( dirty )
			{
				updateConvexHull();
			}
			
			var sides:Array = [];
			var s:LineSegment;
			var l:Number = Number.MAX_VALUE;;
			var p1:Vector2, p2:Vector2;
			 
			for ( var i = 0; i < points.length; i++ )
			{
				s = getSide(i);
				sides.push( s );
				switch ( mode )
				{
					case SMOOTH_PATH_RELATIVE_MINIMUM:
					case SMOOTH_PATH_ABSOLUTE_MINIMUM:
						 l = Math.min( l, s.length ) ;
					break;
				}
			}
			
			switch ( mode )
			{
				case SMOOTH_PATH_RELATIVE_MINIMUM:
					l *= 0.5 * factor;
				break;
				case SMOOTH_PATH_ABSOLUTE_MINIMUM:
					 l = Math.min( l*0.5, factor ) ;
				break;
			}
			
			
			var mp:MixedPath = new MixedPath();
			mp.setClosed( true );
			
			for ( i = 0; i < sides.length; i++ )
			{
				s = LineSegment( sides[i] );
				if ( s.length > 0 )
				{
					switch ( mode )
					{
						case SMOOTH_PATH_RELATIVE_EDGEWISE:
							l = s.length * 0.5 * factor;
						break;
						case SMOOTH_PATH_ABSOLUTE_EDGEWISE:
							 l = Math.min( s.length*0.5, factor ) ;
						break;
					}
					
					p1 = s.getPoint( l / s.length );
					p2 = s.getPoint( 1- ( l / s.length ) );
				
					mp.addPoint(p1);
					mp.addPoint(p2);
					mp.addControlPoint( s.p2.getClone() );
				}
			}
			
			return mp;
		}
		
	
		
		override public function export( canvas:IGraphics ):void
		{
			if ( dirty )
			{
				updateConvexHull()
			}
			
			if ( points.length > 0 )
			{
				canvas.moveTo( Vector2(points[points.length-1]).x, Vector2(points[points.length-1]).y );
				for (var i=0;i<points.length;i++)
				{
					canvas.lineTo( Vector2(points[i]).x, Vector2(points[i]).y );
				}
			} 
		}
		
		override public function drawExtras( canvas:Graphics, factor:Number = 1 ):void
		{
			for each ( var p:Vector2 in points )
			{
				p.draw( canvas, factor );
			}
		}
		
		
		
		
		
		
		override public function getBoundingRect(  loose:Boolean = true  ):Rectangle
		{
			if ( dirty ) updateConvexHull();
			return _boundingRect;
		}
		
		public function getBoundingCircle( method = BoundingCircle.BOUNDINGCIRCLE_EXACT):Circle
		{
			switch ( method )
			{
				case BoundingCircle.BOUNDINGCIRCLE_SIMPLE:
					return BoundingCircle.boundingCircle1( points );
				break;
				case BoundingCircle.BOUNDINGCIRCLE_EFFICIENT:
					return BoundingCircle.boundingCircle2( points );
				break;
				case BoundingCircle.BOUNDINGCIRCLE_EXACT:
					return BoundingCircle.boundingCircle3( points );
				break;
			}
			return null;
		}
		
		public function getCenterCircle():Circle
		{
			if ( dirty ) updateConvexHull();
			var center:Vector2 = centroid;
			var bestRadius:Number = getSide(0).distanceToPoint( center );
			for ( var i = 1; i < pointCount; i++ )
			{
				bestRadius = Math.min( bestRadius, getSide(i).distanceToPoint( center ) );
			}
			return new Circle( center.getClone(), bestRadius );
		}
		
		public function getRotatedBoundingRect():ConvexPolygon
		{
			var angle:Number = majorAngle;
			var p:ConvexPolygon = ConvexPolygon(clone());
			p.rotate(-angle)
			var r:ConvexPolygon = ConvexPolygon.fromRectangle(p.getBoundingRect());
			r.rotate( angle, centroid );
			return r;
		}	
		
		public function getGradientMatrix( angle:Number = 0):Matrix
		{
			var m:Matrix = new Matrix();
			
			if ( pointCount < 3 ) return m;
			
			var p:ConvexPolygon = ConvexPolygon(clone());
			if ( angle != 0 ) p.rotate(-angle)
			var r:Rectangle = p.getBoundingRect();
			
			m.createGradientBox( 200,200 );
			m.translate( -100, -100 );
			m.scale( r.width / 200, r.height / 200 );
			if ( angle != 0 ) m.rotate( angle );
			
			var r2:ConvexPolygon = ConvexPolygon.fromRectangle(r);
			if ( angle != 0 ) r2.rotate( angle, centroid );
			var c:Vector2 = r2.centroid;
			m.translate( c.x, c.y );
			return m;
			
		}	
				
		
		
		
		public function clipByRectangle( rect:Rectangle ):ConvexPolygon
		{
			if ( dirty )
			{
				updateConvexHull();
			}
			if ( _boundingRect==null || !_boundingRect.intersects(rect))
			{
				points = new Vector.<Vector2>();
				dirty = true;
				return this;
			}
			var newPoly:ConvexPolygon = new ConvexPolygon();
			for ( var i = 0; i < pointCount; i++ )
			{
				var p:Vector2 = getPointAt(i);
				if ( rect.contains(p.x,p.y) )
				{
					newPoly.addPoint(p);
				}
			}
			p = new Vector2(rect.topLeft);
			if ( isInside(p) ) newPoly.addPoint(p);
			p = new Vector2(rect.bottomRight);
			if ( isInside(p) ) newPoly.addPoint(p);
			p = new Vector2(rect.left,rect.bottom);
			if ( isInside(p) ) newPoly.addPoint(p);
			p = new Vector2(rect.right,rect.top);
			if ( isInside(p) ) newPoly.addPoint(p);
			
			var poly:Polygon = Polygon.fromRectangle(rect);
			var its:Intersection = poly.intersect(this);
			for ( i = 0; i < its.points.length;i++ )
			{
				newPoly.addPoint(its.points[i]);
			}
			this.points = newPoly.points;
			this.dirty = true;
			return this;
		}
		
		
		public function clip( clipObject:Object ):ConvexPolygon
		{
			if ( dirty )
			{
				updateConvexHull();
			}
			
			
			
			if ( clipObject is Rectangle )
			{
				var rect:Rectangle = Rectangle( clipObject );
				
				if ( _boundingRect==null || !_boundingRect.intersects(rect))
				{
					points = new Vector.<Vector2>();
					dirty = true;
					return this;
				}
				
				//trace( "before ",this );
				
				var slices:Vector.<ConvexPolygon>;
				
				var tl:Vector2 = new Vector2( rect.x, rect.y );
				var tr:Vector2 = new Vector2( rect.x + rect.width, rect.y );
				var bl:Vector2 = new Vector2( rect.x, rect.y +rect.height );
				var br:Vector2 = new Vector2( rect.x + rect.width, rect.y + rect.height );
				
				slices = getSlices( new LineSegment( tl,bl ) );
				if ( slices.length  == 2 )
				{
					if ( ConvexPolygon(slices[0]).getBoundingRect().x > ConvexPolygon(slices[1]).getBoundingRect().x )
					{
						points = ConvexPolygon(slices[0]).points.concat();
					} else {
						points = ConvexPolygon(slices[1]).points.concat();
					}
					dirty = true;
				} else if ( slices.length != 0 ){
					if ( ConvexPolygon(slices[0]).getBoundingRect().x < rect.x)
					{
						points = new Vector.<Vector2>();
						dirty = true;
						return this;
					} 
				}
				
				slices = getSlices( new LineSegment( tl,tr ) );
				if ( slices.length == 2 )
				{
					if ( ConvexPolygon(slices[0]).getBoundingRect().y > ConvexPolygon(slices[1]).getBoundingRect().y )
					{
						points = ConvexPolygon(slices[0]).points.concat();
					} else {
						points = ConvexPolygon(slices[1]).points.concat();
					}
					dirty = true;
				} else if ( slices.length != 0 ) {
					if ( ConvexPolygon(slices[0]).getBoundingRect().y < rect.y)
					{
						points = new Vector.<Vector2>();
						dirty = true;
						return this;
					} 
				}
				
				slices = getSlices( new LineSegment( tr,br ) );
				if ( slices.length  == 2 )
				{
					if ( ConvexPolygon(slices[0]).getBoundingRect().x < ConvexPolygon(slices[1]).getBoundingRect().x )
					{
						points = ConvexPolygon(slices[0]).points.concat();
					} else {
						points = ConvexPolygon(slices[1]).points.concat();
					}
					dirty = true;
				}else if ( slices.length != 0 ) {
					if ( ConvexPolygon(slices[0]).getBoundingRect().right > rect.right)
					{
						points = new Vector.<Vector2>();
						dirty = true;
						return this;
					} 
				}
				
				
				
				slices = getSlices( new LineSegment( bl,br ) );
				if ( slices.length  == 2 )
				{
					if ( ConvexPolygon(slices[0]).getBoundingRect().y < ConvexPolygon(slices[1]).getBoundingRect().y )
					{
						points = ConvexPolygon(slices[0]).points.concat();
					} else {
						points = ConvexPolygon(slices[1]).points.concat();
					}
					dirty = true;
				} else if ( slices.length != 0 ) {
					if ( ConvexPolygon(slices[0]).getBoundingRect().bottom > rect.bottom)
					{
						points = new Vector.<Vector2>();
						dirty = true;
						return this;
					} 
				}
			} else if ( clipObject is ConvexPolygon )
			{
				var poly:ConvexPolygon = ConvexPolygon( clipObject );
				var intersection:Intersection = poly.intersect( this );
				var insidePoints:Vector.<Vector2> = new Vector.<Vector2>();
				var point:Vector2;
				for ( var i = poly.pointCount; --i >-1;)
				{
					if ( isInside( point = poly.getPointAt( i ) ))
					{
						insidePoints.push( point.getClone() );
					}
				} 
				
				for ( i = points.length; --i >-1;)
				{
					if ( !poly.isInside(points[i]) )
					{
						points.splice(i,1);
					}	
				} 
				for each( point in intersection.points )
				{
					if ( !hasPoint( point ) ) points.push( point );
				}
				for each( point in insidePoints )
				{
					if ( !hasPoint( point ) ) points.push( point );
				}
				dirty = true;
				return this;
			}
			//trace( "after ",this );
			
			return this;
		}
		
		public function getInsidePoint( fx:Number, fy:Number ):Vector2
		{
			var r:Rectangle = getBoundingRect();
			
			var y:Number = r.top + r.height * fy;
			
			var intersection:Intersection = intersect( new LineSegment( r.left- 500, y, r.right+500, y) );
			if ( intersection.points.length > 1 )
			{
				var p1:Vector2 = new Vector2( Math.min(intersection.points[0].x,intersection.points[1].x), y );
				var p2:Vector2 = new Vector2( Math.max(intersection.points[0].x,intersection.points[1].x), y );
				var pa:Vector2 = p1.getLerp( p2, fx );
				
				var x:Number = r.left + r.width * fx;
				intersection = intersect( new LineSegment( x,r.top- 500, x, r.bottom+500) );
				p1 = new Vector2( x, Math.min(intersection.points[0].y,intersection.points[1].y));
				p2 = new Vector2( x, Math.max(intersection.points[0].y,intersection.points[1].y) );
				var pb:Vector2 = p1.getLerp( p2, fy );
				
				return pa.lerp( pb, 0.5 );
			} 
			return intersection.points[0];
		}
		
		
		public function getHatchingPath( distance:Number, angle:Number, offsetFactor:Number, mode:String = HatchingMode.ZIGZAG ):LinearPath
		{
			if ( distance == 0 ) return null;
			distance = Math.abs( distance );
			angle %= Math.PI;
			offsetFactor %= 2;
			
			var bounds:Rectangle = getBoundingRect();
			var lineLength:Number = 3 * Math.sqrt( bounds.width * bounds.width + bounds.height *  bounds.height );
			
			
			var center:Vector2 = centroid;
			var line:LineSegment = LineSegment.fromPointAndAngleAndLength( center, angle,lineLength,true);
			var normalOffset:Vector2 = line.getNormalAtPoint( center );
			
			var sortedPoints:Array = [];
			for ( var i = 0; i < points.length; i++ )
			{
				var offset:Number = line.distanceToPoint( points[i]);
				var direction:Number = ( line.isLeft( points[i] ) > 0 ? 1 : -1 );
				sortedPoints.push( { index:i, d: direction * offset } );
			}
			
			sortedPoints.sort( function( a:Object, b:Object ):int{
				if ( a.d > b.d ) return 1;
				if ( a.d < b.d ) return -1;
				return 0;
			});
			
			
			var startIndex = sortedPoints[0].index;
			var endIndex = sortedPoints[sortedPoints.length-1].index ;
			
			var pts:Intersection;
			var middle:Vector2;
			var startLength:Number =  - (Math.abs(sortedPoints[0].d) - (Math.abs(sortedPoints[0].d) % distance) - distance * offsetFactor);
			
			normalOffset.newLength( startLength );
			line.translate( normalOffset );
			normalOffset.newLength(-distance);
			
			
			var path:LinearPath = new LinearPath();
			var zigzag = 0;
			var startLeft:Boolean = ( Math.abs(startLength) % (distance * 4 ) < distance * 2 );
			
			var maxIterations = 2 + points[startIndex].distanceToVector(points[endIndex]) / distance;
			while ( maxIterations-- > -1)
			{
				pts = this.intersect( line );
				if ( pts.points.length == 2) 
				{
					middle = pts.points[0].getLerp( pts.points[1], 0.5 );
					if ( (pts.points[0].isLeft(middle,middle.getPlus(normalOffset)) < 0) == startLeft )
					{
						var tmp:Vector2 = pts.points[0];
						pts.points[0] = pts.points[1];
						pts.points[1] = tmp;
					}
					
					path.addPoint(pts.points[1-zigzag]);
					if ( mode != HatchingMode.SAWTOOTH ) path.addPoint(pts.points[zigzag]);
					if ( mode != HatchingMode.CRISSCROSS	) zigzag = 1 - zigzag;
				}
				line.translate( normalOffset );
			}
			
			return path;
		}
		
		public function drawHatching( distance:Number, angle:Number, offsetFactor:Number, canvas:Graphics ):void
		{
			if ( distance == 0 ) return;
			
			angle %= Math.PI;
			offsetFactor %= 1;
			
			var bounds:Rectangle = getBoundingRect();
			var lineLength:Number = 3 * Math.sqrt( bounds.width * bounds.width + bounds.height *  bounds.height );
			
			
			var center:Vector2 = centroid;
			var line:LineSegment = LineSegment.fromPointAndAngleAndLength( center, angle,lineLength,true);
			var normalOffset:Vector2 = line.getNormalAtPoint( center );
			
			var sortedPoints:Array = [];
			for ( var i = 0; i < points.length; i++ )
			{
				var offset:Number = line.distanceToPoint( points[i]);
				var direction:Number = ( line.isLeft( points[i] ) > 0 ? 1 : -1 );
				sortedPoints.push( { index:i, d: direction * offset } );
			}
			
			sortedPoints.sort( function( a:Object, b:Object ):int{
				if ( a.d > b.d ) return 1;
				if ( a.d < b.d ) return -1;
				return 0;
			});
			
			
			var startIndex = sortedPoints[0].index;
			var endIndex = sortedPoints[sortedPoints.length-1].index ;
			
			normalOffset.newLength( - (Math.abs(sortedPoints[0].d) - (Math.abs(sortedPoints[0].d) % distance) - distance * offsetFactor) );
			line.translate( normalOffset );
			normalOffset.newLength(-distance);
			
			var maxIterations = 2 + points[startIndex].distanceToVector(points[endIndex]) / distance;
			
			while ( maxIterations-- > -1 )
			{
				var pts:Intersection = this.intersect( line );
				if ( pts.points.length == 2) 
				{
					canvas.moveTo( 	pts.points[0].x,pts.points[0].y);
					canvas.lineTo( 	pts.points[1].x,pts.points[1].y);
				}
				line.translate( normalOffset );
			}
		}
		
		
		public function toPolygon( clonePoints:Boolean = false ):Polygon
		{
			if ( dirty )
			{
				updateConvexHull();
			}
			return Polygon.fromVector( points, clonePoints );
		}
		
		public function toVector( clonePoints:Boolean = false ):Vector.<Vector2>
		{
			if ( dirty )
			{
				updateConvexHull();
			}
			if ( !clonePoints ) return points;
			else {
				var result:Vector.<Vector2> = new Vector.<Vector2>();
				for ( var i = 0; i < points.length; i++)
				{
					result.push( points[i].getClone() );
				}
				return result;
			}
			
		}
		
		public function get classification():String
		{
			if ( points.length < 3 ) return CONVEX_DEGENERATE;
			
			var angleSign =  points[2].windingDirection( points[0],points[1] );	
			if ( angleSign > 0 ) return CONVEX_CCW;
			if ( angleSign < 0 ) return CONVEX_CW;
			
			return CONVEX_DEGENERATE;
		}
		
		public function toString():String
		{
			var result:String = "ConvexPolygon dirty:"+dirty+" points: "+points.length+" ";
			var first:Boolean = true;
			for each ( var p:Vector2 in points )
			{
				result += (first ? "" :",") + p.toString();
				first = false;
			}
			return result;
		}
		
		override public function intersect ( that:IIntersectable ):Intersection 
		{
			if ( dirty )
			{
				updateConvexHull();
			}
			return Intersection.intersect( this, that );
		};
		
		public function getTriangle( index1, index2, index3 ):Triangle
		{
			return new Triangle( getPointAt(index1),getPointAt(index2),getPointAt(index3) );
		}
		
		// Algorithm by Dobin & Snyder
		// found here:
		// http://stackoverflow.com/questions/1621364/how-to-find-largest-triangle-in-convex-hull-aside-from-brute-force-search
		public function getBiggestInscribedTriangle():Triangle
		{
			var A = 0;
			var B = 1; 
			var C = 2;
			var bA = A; 
			var bB = B;
			var bC = C;
			var n = pointCount;
			var bestArea:Number = getTriangle(bA, bB, bC).area;
			var area:Number;
			
			while (true)
			{
				while (true)
				{
					while ( getTriangle( A, B, C ).area <= getTriangle(A, B, C+1).area )
						C = (C+1)%n;
					
					if ( getTriangle( A, B, C ).area <= getTriangle(A, B+1, C).area ) 
					{
						B = (B+1)%n;
						continue;
					} else {
						break;
					}
				}
				if ( (area = getTriangle( A, B, C ).area)  > bestArea )
				{
					bA = A; bB = B; bC = C;
					bestArea = area;
				}
				A = (A+1)%n
				if (A==B) B = (B+1)%n
				if (B==C) C = (C+1)%n
				if (A==0) break;
			}
			return getTriangle( bA, bB, bC );
		}
		
		public function triangulate ( mode = 0 ):Vector.<Triangle>
		{
			if ( pointCount == 3 )
			{
				return Vector.<Triangle>([ getTriangle(0,1,2) ]);
			}
			
			switch ( mode )
			{
				case TRIANGULATE_SIMPLE:
					return triangulateSimple();
				break;
				case TRIANGULATE_CENTER:
					return triangulateCenter();
				break;
				case TRIANGULATE_DIVIDE:
					return triangulateDivide();
					break;
			}
			return null;
		}
		
		public function triangulateCenter():Vector.<Triangle>
		{
			var result:Vector.<Triangle> = new Vector.<Triangle>();
			var center:Vector2 = centroid;
			for ( var i =0; i < pointCount; i++ )
			{
				result.push( new Triangle(center,getPointAt(i),getPointAt(i+1)) );
			}
			return result;
		}
		
		public function triangulateSimple():Vector.<Triangle>
		{
			var result:Vector.<Triangle> = new Vector.<Triangle>();
			for ( var i = 1; i < pointCount-1; i++ )
			{
				result.push( getTriangle(0,i,i+1) );
			}
			return result;
		}
		
		public function triangulateDivide():Vector.<Triangle>
		{
			var result:Vector.<Triangle> = new Vector.<Triangle>();
			var stack:Vector.<ConvexPolygon> = Vector.<ConvexPolygon>([this]);
			while ( stack.length > 0 )
			{
				var cw:ConvexPolygon = stack.pop();
				if ( cw.pointCount > 2 )
				{
					trace("total "+cw.pointCount);
					var maxDist:Number = 0;
					var dist:Number;
					var idx1 = -1;
					var idx2 = -1;
					
					for ( var i = 0; i < cw.pointCount -2; i++ )
					{
						var p1:Vector2 = cw.getPointAt(i);
						for ( var j = i+2; j < cw.pointCount; j++ )
						{
							if ( i + cw.pointCount - j > 1 )
							{
								var p2:Vector2 = cw.getPointAt(j);	
								if ( (dist = p1.squaredDistanceToVector(p2) ) > maxDist )
								{
									maxDist = dist;
									idx1 = i;
									idx2 = j;
								}
							}
						}
					}
					
					if ( idx2 == idx1 + 2 )
					{
						result.push(  cw.getTriangle( idx1, idx1+1, idx1+ 2) );
						trace("part 1 triangle");
					} else {
						var cw2:ConvexPolygon = new ConvexPolygon();
						for ( var i = idx1; i <= idx2; i++ )
						{
							cw2.addPoint( cw.getPointAt(i) ); 
						}
						stack.push( cw2 );
						trace("part 1 "+cw2.pointCount+" pts");
					}
					
					idx1 += cw.pointCount;
					
					if ( idx1 == idx2 + 2 )
					{
						trace("part 2 triangle");
						result.push( cw.getTriangle( idx2, idx2+1, idx2+ 2) );
					} else {
						var cw2:ConvexPolygon = new ConvexPolygon();
						for ( var i = idx2; i <= idx1; i++ )
						{
							cw2.addPoint( cw.getPointAt(i) );
						}
						stack.push( cw2 );
						trace("part 2 "+cw2.pointCount+" pts");
					}
				}
			}
			return result;
		}
		
		public function getWachspressWeights( p:Vector2 ):Vector.<Number>
		{
			var lambdas:Vector.<Number> = new Vector.<Number>();
			var sum:Number = 0;
			var d:Vector2 = points[points.length-1];
			var a:Vector2 = points[0];
			var d_da:Number = d.y - a.y;
			var d_pa:Number = p.y - a.y;
			var d_dp:Number = d.y - p.y;
			var area_dap:Number = p.x * d_da - d.x * d_pa - a.x * d_dp; 
			for ( var i = 0; i < points.length; i++ )
			{
				var b:Vector2 = points[(i+1)%points.length];
				var d_ab:Number = a.y - b.y;
				var d_db:Number = d.y - b.y;
				var d_bp:Number = b.y - p.y;
				var area_abp:Number = p.x * d_ab + a.x * d_bp + b.x * d_pa; 
				var area_dab:Number = b.x * d_da + d.x * d_ab - a.x * d_db;
				
				lambdas[i] = area_dab / ( area_dap * area_abp);
				sum += lambdas[i];
				d = a;
				a = b;
				d_da = d_ab;
				d_dp = -d_pa;
				d_pa = -d_bp;
				area_dap = area_abp;
			}
			
			sum = 1 / sum;
			for ( i = 0; i < points.length; i++ )
			{
				lambdas[i] *= sum;
			}
			return lambdas;
		}
		
		public function getBoundingQuadrilateral():Polygon
		{
			if ( pointCount < 5 )
			{
				var result:Polygon = toPolygon(true);
				while( result.pointCount < 4 )
					result.addPoint( result.getPointAt(-1).getClone());
				return result;
			}
			var bestArea:Number = Number.MAX_VALUE;
			var bestBounds:ConvexPolygon;
			var idxOffset;
			var bestIndex1;
			var bestIndex2;
			var bestIndex3;
			var bestIndex4;
			
			for ( var index1 = 0; index1 < pointCount - 3; index1++ )
			{
				var seg1:LineSegment = getSide(index1);
				for ( var index2 = index1+1; index2 < pointCount - 2; index2++ )
				{
					var seg2:LineSegment = getSide(index2);
					var i1:Vector.<Vector2> = seg1.getIntersection(seg2);
					if ( i1.length == 1 )
					{
						for ( var index3 = index2+1; index3 < pointCount - 1; index3++ )
						{
							var seg3:LineSegment = getSide(index3);
							var i2:Vector.<Vector2> = seg2.getIntersection(seg3);
							if ( i2.length == 1 )
							{
								for ( var index4 = index3+1; index4 < pointCount; index4++ )
								{
									var seg4:LineSegment = getSide(index4);
									var i3:Vector.<Vector2> = seg3.getIntersection(seg4);
									var i4:Vector.<Vector2> = seg4.getIntersection(seg1);
									
									if (  i3.length == 1  && i4.length == 1 )
									{
										var cp2:ConvexPolygon = new ConvexPolygon();
										cp2.addPoint(i1[0]);
										cp2.addPoint(i2[0]);
										cp2.addPoint(i3[0]);
										cp2.addPoint(i4[0]);
										cp2.updateConvexHull();
										var idx = cp2.getIndexOfPoint(i1[0])
										if ( cp2.getPointAt(idx+1) == i2[0] )
										{
											var area:Number = Math.abs( cp2.area );
											if ( area < bestArea )
											{
												idxOffset = idx;
												bestIndex1 = index1;
												bestIndex2 = index2;
												bestIndex3 = index3;
												bestIndex4 = index4;
												
												bestArea = area;
												bestBounds = cp2;
											}
										}
									}
								}
							}
						}
					}
				}
			}
			return bestBounds.toPolygon();
		}
	}
}
*/