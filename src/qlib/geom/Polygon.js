/*
* Polygon
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

	var Polygon = function() {
	  this.initialize( arguments );
	}

	var p = Polygon.prototype = new qlib.GeometricShape();


// public properties:
	p.type = "Polygon";
		
	
	Polygon.NON_CONVEX_CCW = "NON_CONVEX_CCW";
	Polygon.NON_CONVEX_CW = "NON_CONVEX_CW";
	Polygon.NON_CONVEX_DEGENERATE = "NON_CONVEX_DEGENERATE";
	Polygon.CONVEX_DEGENERATE = "CONVEX_DEGENERATE";
	Polygon.CONVEX_CCW = "CONVEX_CCW";
	Polygon.CONVEX_CW = "CONVEX_CW";
		
	Polygon.CCW = "CCW";
	Polygon.CW = "CW";
	Polygon.DEGENERATE = "DEGENERATE";
	Polygon.CACHE_SIZE = 200;
	
	Polygon.fromArray = function( points, clonePoints )
	{
		var cv = new qlib.Polygon();
		for ( var i = 0; i < points.length; i++ )
		{
			cv.addPoint( !clonePoints ? points[i] : points[i].getClone() );
		}
		
		return cv;
	}
	
	Polygon.fromRectangle = function( rect )
	{
		return Polygon.fromArray( [
									new qlib.Vector2( rect.x,rect.y ),
									new qlib.Vector2( rect.x + rect.width,rect.y ),
									new qlib.Vector2( rect.x + rect.width,rect.y+  rect.height ),
									new qlib.Vector2( rect.x,rect.y+ rect.height )
								 ]);
	}
	
	Polygon.getRectangle = function( x, y, width, height )
	{
		return Polygon.fromArray( [
			new qlib.Vector2( x,y ),
			new qlib.Vector2( x + width,y ),
			new qlib.Vector2( x + width,y+height ),
			new qlib.Vector2( x, y+height )
		]);
	}

	Polygon.getRegularPolygon = function( sideLength, sides, center, rotation )
	{
		var angle  = 2 * Math.PI / sides;
		var radius = (sideLength * 0.5 ) / Math.sin(angle*0.5);
		if ( center == null ) center = new qlib.Vector2();
		rotation = rotation || 0;
		var points = [];
		for ( var i = 0; i< sides; i++ )
		{
			points.push( new qlib.Vector2( center.x + radius * Math.cos( rotation + i * angle ),center.y + radius * Math.sin( rotation + i * angle )  ) );
		}	
		return Polygon.fromArray( points );
	}
	
	Polygon.getCircle = function( center, radius, maxSegmentLength )
	{
		var c = new qlib.Circle( center, radius );
		return c.toPolygon( maxSegmentLength || 2);
	}
	
	Polygon.getRegularCenteredPolygon = function( radius, sides, center , rotation )
	{
		var angle  = 2 * Math.PI / sides;
		if ( center == null ) center = new qlib.Vector2();
		rotation = rotation || 0;
		var points = [];
		for ( var i = 0; i< sides; i++ )
		{
			points.push( new qlib.Vector2( center.x + radius * Math.cos( rotation + i * angle ),center.y + radius * Math.sin( rotation + i * angle )  ) );
		}	
		return Polygon.fromArray( points );
	}
	
	Polygon.getCenteredStar = function( outerRadius, innerRadius, spokes, center, rotation  )
	{
		var sides = spokes * 2;
		var angle  = 2 * Math.PI / sides;
		if ( center == null ) center = new qlib.Vector2();
		rotation = rotation || 0;
		var points = [];
		for ( var i = 0; i< sides; i++ )
		{
			var radius = ( i % 2 == 0 ? outerRadius : innerRadius );
			points.push( new qlib.Vector2( center.x + radius * Math.cos( rotation + i * angle ),center.y + radius * Math.sin( rotation + i * angle )  ) );
		}	
		return Polygon.fromArray( points );
	}
	
	p.initialize = function()
	{
		this.points = [];
		this.tree = new qlib.KDTree([], this.treeDistance, ["x", "y"]);
	}
	
	p.addSegment = function( line )
	{
		this.addPoint( line.p1 );
		this.addPoint( line.p2 );
	}
	
	p.addPoint = function( p )
	{
		if ( p == null ) return;
		this.dirty = true;
		this.points.push( p );
		this.tree.insert( p );
	}
	
	p.treeDistance = function(a, b){
	  return Math.pow(a.x - b.x, 2) +  Math.pow(a.y - b.y, 2);
	}

	
	p.fixIndex = function( index )
	{
		return (((index % (this.points.length+1)) + (this.points.length+1))% (this.points.length+1)) | 0;
	}
	
	p.addPointAt = function( index, p )
	{
		if ( p == null ) return;
		this.dirty = true;
		index = this.fixIndex(index);
		this.points.splice(index+1,0,p);
		this.tree.insert( p );
	}
	
	p.removePointAt = function( index )
	{
		this.dirty = true;
		index = this.fixIndex(index);
		var p = this.points[index];
		this.tree.remove( p );
		this.points.splice(index,1);
		
	}
	
	function updatePointInTreeAt( index )
	{
		index = this.fixIndex(index);
		var p = this.points[index];
		this.tree.remove( p );
		this.tree.insert( p );
	}
	
	
	p.getPointAt = function( index )
	{
		return this.points[ this.fixIndex(index) ];
	}
	
	 p.getPoint = function( t )
	{
		if ( t <= 0 || this.points.length == 1) return this.points[0];
		if ( t >= 1) return this.points[this.points.length - 1] ;
		if ( this.dirty ) this.update();
		
		var i = this.t_cache[( t*Polygon.CACHE_SIZE ) | 0];
		var l =  t * this.length - this.l_cache[(t*Polygon.CACHE_SIZE) | 0];
		
		while ( l > this.distances[i++] && i < this.distances.length )
		{
			l -= this.distances[i-1];
		}
		
		i--;
		
		return this.points[i].getLerp( this.points[(i+1)%this.pointCount],  ( l / this.distances[i] ) );
		
	}
	
	 p.addPointAtClosestSide = function( p )
	{
		if ( this.points.length > 2 )
		{
			this.addPointAt( this.getClosestSideIndex(p) + 1, p );
		} else {
			this.addPoint( p );
		}
	}
	
	p.shiftIndices = function( offset )
	{
		offset %= this.points.length;
		if ( offset == 0 ) return;
		var i;
		
		if ( offset > 0 )
		{
			for ( i = 0; i < offset; i++ )
			{
				this.points.unshift( this.points.pop() );
			}
		} else {
			for ( i = 0; i < -offset; i++ )
			{
				this.points.push( this.points.shift() );
			}
		}
	}
	
	p.getNormalAtIndex = function( index, length )
	{
		length = length || 1
		var p1 = this.getPointAt( index-1 );
		var p2 = this.getPointAt( index );
		var p3 = this.getPointAt( index+1 );
		
		var p4 = p3.getMinus(p2).newLength( p1.distanceToVector(p2) ).plus( p2 ).lerp(p1,0.5).minus(p2).newLength( -p3.windingDirection( p1,p2 ) * length);
		return p4;
	}
	
	 p.getNormalAt = function( t, radius )
	{
		if ( t <= 0 ) { t = 0;}
		else if ( t >= 1){ t = 1;}
		if ( this.dirty ) this.update();
		
		radius = radius || 3;
		var i = this.t_cache[( t*Polygon.CACHE_SIZE ) | 0];
		var vl = this.points[i].getClone();
		var vr = this.points[i].getClone();
		var v,lc = 1, rc = 1;
		
		for ( var j = 1;j<=radius;j++)
		{
			if ( i-j >= 0 )
			{
				vl.plus( this.points[i-j] );
				lc++;
			}
			if ( i+j < this.points.length )
			{
				vr.plus( this.points[i+j] );
				rc++;
			}
		}
		
		vl.multiply( 1 / lc );
		vr.multiply( 1 / rc );
		return vl.getMinus(vr).normal();
	}
	
	p.hasPoint = function( p )
	{
		var nearest = this.tree.nearest({ x:p.x, y: p.y }, 1);
		return nearest != null && p.squaredDistanceToVector( nearest.point ) < Polygon.SNAP_DISTANCE * Polygon.SNAP_DISTANCE;
	}
	
	p.getIndexOfPoint = function( p )
	{
		var nearest = this.tree.nearest({ x:p.x, y: p.y }, 1);
		if (  nearest != null && p.squaredDistanceToVector( nearest.point ) < Polygon.SNAP_DISTANCE * Polygon.SNAP_DISTANCE )
		{
			for ( var i = this.points.length; --i>-1;)
			{
				if ( this.points[i] == nearest.point ) return i;
			}
		}
		return -1;
	}
	
	p.getIndexOfCorner = function( p )
	{
		return this.points.indexOf(p);
	}
	
	//warning this can also be a negative value!
	p.__defineGetter__("area", function(){
		var sx = 0,sy = 0,a = 0,p1, p2;
		for ( var i = 0; i< this.points.length; i++ )
		{
			p1 = this.points[i];
			p2 = this.points[(i+1) % this.points.length];
			a +=  p1.x * p2.y - p2.x * p1.y;
		} 
		return a * 0.5;
	});

	
	p.__defineGetter__("centroid", function() {
		if ( this.points.length == 1 ) return this.points[0].getClone();
		if ( this.points.length == 2 ) return this.points[0].getLerp( this.points[1], 0.5 );
		
		var sx = 0,sy = 0,a = 0, p1,p2,f;
		
		for ( var i = 0; i< this.points.length; i++ )
		{
			p1 = this.points[i];
			p2 = this.points[((i+1) % this.points.length)];
			a += ( f = p1.x * p2.y - p2.x * p1.y );
			sx += (p1.x + p2.x) * f;
			sy += (p1.y + p2.y) * f;
		}
		f = 1 / ( 3 * a );
		return new qlib.Vector2( sx * f, sy * f );
	});
	
	
	
	p.getSplit = function( index1, index2 )
	{
		var pCount = this.pointCount;
		if ( index1 < index2 )
		{
			var minIndex = index1;
			var maxIndex = index2;
		} else {
			minIndex = index2;
			maxIndex = index1;
		}
		
		if ( this.points.length < 4 || Math.abs( index1 - index2 ) < 2 || (maxIndex+1)%pCount == minIndex ) return [];
		
		var temp = this.points.concat();
		var p1 = Polygon.fromArray( temp.slice( minIndex, maxIndex+1 ) );
		temp.splice( minIndex+1, (maxIndex-minIndex)-1 )
		var p2 = Polygon.fromArray( temp );
		
		return [p1,p2];
	}
	
	
	p.__defineGetter__("classification", function() {
		if ( this.dirty ){ this.update();}
		return this.__classification;
	});
	
	p.__defineGetter__("selfIntersects", function() {
		if ( this.dirty ){ this.update();}
		return this.__selfIntersects;
	});
	
	p.__defineGetter__("length", function() {
		return this.circumference;
	});
	
	p.__defineGetter__("circumference", function() {
		var result = 0;
		for ( var i = 0; i< this.points.length; i++ )
		{
			result += this.getSide(i).length;
		}
		return result;
	});
	
	p.__defineGetter__("pointCount", function() {
		return this.points.length;
	});
	
	p.__defineGetter__("windingDirection", function() {
		if ( this.dirty ){ this.update();}
		return this.__windingDirection;
	});
	
	p.__defineGetter__("majorAngle", function() {
		var centerOfMass = this.centroid;
		
		var dx_sum = 0;
		var dy_sum = 0;
		var dxy_sum = 0;
		
		for ( var i = this.points.length; --i > -1; )
		{
			var p = this.points[i];
			dx_sum += Math.pow(p.x - centerOfMass.x,2);
			dy_sum += Math.pow(p.y - centerOfMass.y,2);
			dxy_sum += (p.x - centerOfMass.x) * (p.y - centerOfMass.y)
		}
		var dy = 2*dxy_sum;
		var dx = dx_sum  - dy_sum + Math.sqrt(Math.pow(dx_sum-dy_sum,2) + Math.pow(2 * dxy_sum,2) );
		if ( dy == 0 && dx == 0 )
		{
			return ( dx_sum >= dy_sum ? 0 : Math.PI * 0.5 );
		}
		return Math.atan2( dy, dx );
	});
	
	
	p.clone = function( deepClone )
	{
		if ( deepClone == null ) deepClone = true;
		if ( deepClone )
		{
			var tmp = [];
			for ( var i = 0; i < this.points.length; i++ )
			{
				tmp.push( this.points[i].getClone() );
			}
			return Polygon.fromArray( tmp );
		} else {
			return Polygon.fromArray( this.points );
		}
	}
	
	p.getPointAtOffset = function( t )
	{
		t %= 1;
		if ( t<0) t+= 1;
		
		var side;
		var totalLength = this.circumference;
		var t_sub;
		
		for ( var i = 0; i< this.points.length; i++ )
		{
			side =  this.getSide(i);
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
	
	p.getSide = function( index )
	{
		index = this.fixIndex(index);;
		return new qlib.LineSegment( this.points[index], this.points[(index+1)% this.points.length] );
	}
	
	p.squaredDistanceToPoint = function( p )
	{
		var minDist = this.getSide( 0 ).getClosestPoint( p ).squaredDistanceToVector( p );
		var dist;
		for ( var i = 1; i < this.points.length; i++ )
		{
			dist = this.getSide( i ).getClosestPoint( p ).squaredDistanceToVector( p );
			if ( dist < minDist ) minDist = dist;
		}
		return minDist;
	}
	
	 p.getClosestPoint = function( p )
	{
		var closest = this.getSide( 0 ).getClosestPoint( p );
		var minDist = closest.squaredDistanceToVector( p );
		var dist;
		var pt;
		for ( var i = 1; i < this.points.length; i++ )
		{
			pt = this.getSide( i ).getClosestPoint( p );
			dist = pt.squaredDistanceToVector( p );
			if ( dist < minDist ) {
				minDist = dist ;
				closest = pt;
			}
		}
		return closest;
	}
	
	 p.getClosestCorner = function( p )
	{
		if ( this.pointCount == 0 ) return null;
		var nearest = this.tree.nearest({ x:p.x, y: p.y }, 1);
		return nearest.point;
	}
	
	 p.distanceToVector2 = function( p )
	{
		var closest = this.getSide( 0 ).getClosestPoint( p );
		var minDist = closest.squaredDistanceToVector( p );
		var dist;
		var pt;
		for ( var i = 1; i < this.points.length; i++ )
		{
			pt = this.getSide( i ).getClosestPoint( p );
			dist = pt.squaredDistanceToVector( p );
			if ( dist < minDist ) {
				minDist = dist ;
			}
		}
		return Math.sqrt( minDist);
	}
	
	 p.getClosestIndexToClosestPoint = function( p )
	{
		if ( this.pointCount == 0 ) return -1;
		var nearest = this.tree.nearest({ x:p.x, y: p.y }, 1);
		return this.getIndexOfPoint( nearest.point );
	}
	
	p.subdivide = function( maxSegmentLength )
	{
		
		for ( var i = 0; i < this.points.length; i++ )
		{
			var p1 = this.points[i];
			var p2 = this.points[(i+1) % this.points.length];
			var d = p1.distanceToVector(p2);
			if ( d > maxSegmentLength )
			{
				var step = 1 / Math.floor( d / maxSegmentLength );
				var t = step;
				while ( t < 1 )
				{
					i++;
					this.points.splice(i,0,p1.getLerp(p2,t));
					t += step;
				}
			}
		}
		this.dirty = true;
		
	}
	
	p.getClosestSideIndex = function( p )
	{
		var closestIndex = 0;
		var minDist = this.getSide( closestIndex ).getClosestPoint( p ).squaredDistanceToVector( p );
		var dist;
		var pt;
		for ( var i = 1; i < this.points.length; i++ )
		{
			pt = this.getSide( i ).getClosestPoint( p );
			dist = pt.squaredDistanceToVector( p );
			if ( dist < minDist ) {
				minDist = dist ;
				closestIndex = i;
			}
		}
		return closestIndex;
	}
	
	p.getClosestSide = function( p )
	{
		return this.getSide( this.getClosestSideIndex(p) );
	}
	
	 p.getClosestConnectionToLine = function( l )
	{
		var shortest = this.getSide( 0 ).getShortestConnectionToLine( l );
		var connection;
		if (shortest.length == 0 ) return shortest;
		for ( var i = 1; i < this.points.length; i++ )
		{
			connection = this.getSide( i ).getShortestConnectionToLine( l );
			if ( connection.length < shortest.length )
			{
				if (shortest.length == 0 ) return shortest;
				shortest = connection;
			} 
		}
		return shortest;
	}
	
	 p.getClosestIndex = function( p )
	{
		var nearest = this.tree.nearest({ x:p.x, y: p.y }, 1);
		if (  nearest != null )
		{
			for ( var i = this.points.length; --i>-1;)
			{
				if ( this.points[i] == nearest.point ) return i;
			}
		}
		return -1;
	}
	
	
	p.distanceToLine = function( l )
	{
		return this.getClosestConnectionToLine( l ).length;
	}
	
	p.getSmallestAngle = function()
	{
		var smallestAngle = 10; // > Math.PI * 2;
		var angle;
		var p;
		for ( var i = 0; i < this.points.length; i++ )
		{
			p = this.getPointAt(i);
			angle = (this.getPointAt(i-1).getMinus(p).angleBetween( this.getPointAt(i+1).getMinus(p) ) + Math.PI * 2) % (Math.PI * 2);
			if ( angle < smallestAngle )
			{
				smallestAngle = angle;
			}
		}
		return smallestAngle;
	}
	
	p.convexHull = function( clone )
	{
		return qlib.ConvexPolygon.fromArray( this.points, clone );
	}
	
	
	p.getOffsetPolygon = function( offset )
	{
		var f = this.area > 0 ? 1 : -1;
		var poly = new qlib.Polygon();
		
		for ( var i = 0; i < this.points.length; i++ )
		{
			var norm = this.getNormalAtIndex( i, 10 );
			var l1 = new qlib.LineSegment( this.points[i].getMinus(norm), this.points[i].getPlus(norm) );
			var l2 = this.getSide( i ).getParallel( -offset * f);
			var intersection = l1.getIntersection(l2);
			if ( intersection.length > 0 ) poly.addPoint(intersection[0]);
		}
		
		return poly;
	}
	
	 p.getDynamicOffsetPolygon = function( stepSize, offset )
	{
		var f = this.area > 0 ? 1 : -1;
		var poly = new qlib.Polygon();
		
		var l = this.length;
		var steps = (l / stepSize) | 0;
		for ( var i = 0; i < steps; i++ )
		{
			var t = i / steps;
			var p = getPoint( t );
			var norm = getNormalAt( t );
			norm.multiply( offset(t) );
			poly.addPoint(p.getPlus(norm));
		}
		
		return poly;
	}
	
	
	 p.getOffsetPolygons = function( offset )
	{
		var poly1 = this.getOffsetPolygon( Math.abs(offset) );
		var poly2 = this.getOffsetPolygon( -Math.abs(offset) );
		var result = [];
		result.push(poly1);
		if ( Math.abs(poly1.area) < Math.abs(poly2.area)) result.push(poly2);
		else result.unshift(poly2);
		return result;
	}
	
	p.update = function()
	{
		this.__classification = this.updateClassification();
		switch (this.__classification )
		{
			case Polygon.CONVEX_DEGENERATE:
			case Polygon.NON_CONVEX_DEGENERATE:
				this.__windingDirection = DEGENERATE;
				break;
			case Polygon.CONVEX_CW:
			case Polygon.NON_CONVEX_CW:
				this.__windingDirection = CW;
				break;
			case Polygon.CONVEX_CCW:
			case Polygon.NON_CONVEX_CCW:
				this.__windingDirection = CCW;
				break;
		}
		this.__selfIntersects = this.updateSelfIntersection();
		this.calculateIndex();
		this.dirty = false;
	}
	
	 p.updateDistanceTree = function()
	{
		this.tree = new qlib.KDTree(this.points, this.treeDistance, ["x", "y"]);
	}
	
	 p.updateClassification = function()
	{
		var curDir, thisDir, thisSign, dirChanges = 0, angleSign = 0, iread ;
		var cross;
		var pCount = this.pointCount;
	   
		if ( this.points.length < 3 ) return Polygon.CONVEX_DEGENERATE;
	   
		var index = 0;
		
		var first  = this.points[index++];
		var second = this.points[index++];
		var third;
		
		curDir = first.compare( second );
		
		while( index < pCount + 2 )
		{
			third = this.points[(index%this.points.length)];
			if ( (thisDir = second.compare(third)) == -curDir )		
			++dirChanges;						
			curDir = thisDir;		
			thisSign = third.windingDirection( first,second )				
			if ( thisSign ) {		
				if ( angleSign == -thisSign )
				{
					return area > 0 ? Polygon.NON_CONVEX_CCW : Polygon.NON_CONVEX_CW;					
				}
				angleSign = thisSign;					
			}								
			first = second; 
			second = third;
			index++;
		}
		
		/* Decide on polygon type given accumulated status */
		if ( dirChanges > 2 ) return angleSign ? ( area > 0 ? Polygon.NON_CONVEX_CCW : Polygon.NON_CONVEX_CW ) : Polygon.NON_CONVEX_DEGENERATE;
		if ( angleSign > 0 ) return Polygon.CONVEX_CCW;
		if ( angleSign < 0 ) return Polygon.CONVEX_CW;
		return Polygon.CONVEX_DEGENERATE;
	}
	
	p.updateSelfIntersection = function()
	{
		 if ( this.points.length < 4 ) return false;
		 var pCount = this.pointCount;
		 var side;
		
		 for ( var i = 0; i < pCount - 2; i++ )
		 {
			side = this.getSide( i );
			for ( var j = i+2; j < pCount; j++ )
			{
				if ( (j+1) % pCount != i && side.crosses(this.getSide(j)) )
				{
					return {lowerIndex:Math.min(i,j), upperIndex: Math.max(i,j), self_intersects:true};
				}
			}	
		 }
		 return false;
	}
	
	 p.calculateDistanceIndex = function()
	{
		this.distances = [];
		for ( var i = 0; i < this.pointCount; i++ )
		{
			this.distances[i] = this.getSide(i).length;
		}
	}
	
	 p.calculateIndex = function( )
	{
		var f;
		
		this.t_cache = [];
		this.l_cache = [];
		var l = 0;
		
		this.calculateDistanceIndex();
		
		var t = 0;
		var last_t = -1;
		var old_cache_t = 0;
		var old_cache_l = 0;
		
		for ( var i = 0; i < this.pointCount; i++ )
		{
			t = ( Polygon.CACHE_SIZE * l / this.length ) | 0;
			if ( t != last_t )
			{
				if ( t - last_t > 1)
				{
					old_cache_t = this.t_cache[last_t];
					old_cache_l = this.l_cache[last_t];
					while ( t - last_t > 1 )
					{
						this.t_cache[++last_t] = old_cache_t;
						this.l_cache[last_t] = old_cache_l;
					}
					
				}
				this.t_cache[t] = i;
				this.l_cache[t] = l;
				last_t = t;
			}
			l += this.distances[i];
		}
		
		while ( t < Polygon.CACHE_SIZE ) 
		{
			this.t_cache[++t] = old_cache_t;
			this.l_cache[t] = old_cache_l;
		}
		
		
	}
	
	p.joinNeighbors = function( radius  )
	{
		radius = radius || 1;
		var r2 = radius * radius;
		for ( var i = 0; i < this.points.length; i++ )
		{
			if ( this.points[i].snaps( this.points[ (i + 1) % this.points.length] , r2 ) )
			{
				this.points[i].lerp(	this.points[ (i + 1) % this.points.length], 0.5 );
				this.points.splice((i + 1) % this.points.length,1);
				i--;
				this.dirty = true;
			}
		}
		
	}
	
	p.getBoundingRect = function()
	{
		var p = this.points[0];
		var minX = p.x;
		var maxX = minX;
		var minY = p.y;
		var maxY = minY;
		for ( var i = 1; i< this.points.length; i++ )
		{
			p = this.points[i];
			if ( p.x < minX ) minX = p.x;
			else if ( p.x > maxX ) maxX = p.x;
			if ( p.y < minY ) minY = p.y;
			else if ( p.y > maxY ) maxY = p.y;
		}
		
		return new qlib.Rectangle( minX, minY, maxX - minX, maxY - minY );
	}
	
	 p.isInside = function( p, includeVertices )
	{
		if ( this.points.length < 3 ) return false;
		if ( includeVertices == null ) includeVertices = true;
			
		if ( hasPoint( p ) ) return includeVertices;
		
		if ( this.getClosestPoint( p ).squaredDistanceToVector( p ) < Polygon.SNAP_DISTANCE * Polygon.SNAP_DISTANCE ) return includeVertices;
		
		var i, n = this.points.length;
		
		// due to some topology theorem, if the ray intersects shape
		// perimeter odd number of times, the point is inside
		
		// shorter and faster code thanks to Alluvian
		// http://board.flashkit.com/board/showpost.php?p=4037392&postcount=5
		
		var V = this.points.concat(); 
		V.push(V[0]);
		
		var crossing = 0; 
		n = V.length - 1;
		for (i = 0; i < n; i++) 
		{
			if (((V[i].y <= p.y) && (V[i+1].y > p.y)) || ((V[i].y > p.y) && (V[i+1].y <= p.y)))
			{
				var vt = (p.y - V[i].y) / (V[i+1].y - V[i].y);
				if (p.x < V[i].x + vt * (V[i+1].x - V[i].x)) {
					crossing++;
				}
			}
		}
		
		return (crossing % 2 != 0);
	}
	
	
	 p.getLinearPathSegment = function( startIndex, endIndex, clonePoints = true )
	{
		if ( clonePoints == null ) clonePoints = true;
		endIndex = this.fixIndex(endIndex);
		var p = new qlib.LinearPath();
		startIndex = this.fixIndex(startIndex);
		var index = startIndex;
		while ( index != endIndex )
		{
			p.addPoint( clonePoints ? this.getPointAt( index ).getClone() : this.getPointAt( index ) );
			index = (index+1) % this.pointCount;
		}
		p.addPoint( clonePoints ? this.getPointAt( index ).getClone() : this.getPointAt( index ) );
		return p;
	}
	
	 p.invalidate = function()
	{
		this.dirty = true;
	}
	
	p.translate = function( offset )
	{
		for ( var i = 0; i < this.points.length; i++ )
		{
			this.points[i].plus(offset);
		}
		this.dirty = true;
		return this;
	}
	
	p.scale = function( factorX, factorY, center )
	{
		if ( center == null ) center = this.centroid;
		for ( var i = 0; i < this.points.length; i++ )
		{
			this.points[i].minus( center ).multiplyXY( factorX, factorY ).plus( center );
		}
		this.dirty = true;
		return this;
	}
	
	p.rotate = function( angle, center = null )
	{
		if ( center == null ) center = this.centroid;
		for ( var i = 0; i < this.points.length; i++ )
		{
			this.points[i].rotateAround(angle, center );
		}
		this.dirty = true;
		return this;
	}
	
	 p.getBoundingCircle = function( method)
	{
		method = method || qlib.BoundingCircle.BOUNDINGCIRCLE_EXACT
		switch ( method )
		{
			case qlib.BoundingCircle.BOUNDINGCIRCLE_SIMPLE:
				return qlib.BoundingCircle.boundingCircle1( this.points );
			break;
			case qlib.BoundingCircle.BOUNDINGCIRCLE_EFFICIENT:
				return qlib.BoundingCircle.boundingCircle2( this.points );
			break;
			case qlib.BoundingCircle.BOUNDINGCIRCLE_EXACT:
				return qlib.BoundingCircle.boundingCircle3( this.points );
			break;
		}
		return null;
	}
	
	p.detangle = function()
	{
		var result = [];
		var temp = [];
		
		var lowerIndex, upperIndex, i;
		var selfIntersectionInfo;
		while ( (selfIntersectionInfo = this.selfIntersects) != false )
		{
			result.length = 0;
		
			lowerIndex = selfIntersectionInfo.lowerIndex + 1 ;
			upperIndex = selfIntersectionInfo.upperIndex + 1;
		
			for ( i = lowerIndex; i < upperIndex; i++ )
			{
				result.push( this.points[i % this.points.length ] );
			}
		
			temp.length = 0
			for ( i = upperIndex; i < this.points.length; i++ )
			{
				temp.push( this.points[i] );
			}
			for ( i = 0; i < lowerIndex; i++ )
			{
				temp.push( this.points[i] );
			}
			temp.reverse();
		
			for ( i = 0; i < temp.length; i++ )
			{
				result.push( temp[i] );
			}
			if ( this.points.length != result.length )
			{
				throw new Error("wrong length");
			}
			this.points = result.concat();
			this.dirty = true;
		}
	}
	
	p.cleanEdges = function()
	{
		var ok, i, n;
		do
		{
			ok = true;
			n = this.pointCount;
			for (i = 0; i < n; i++)
			{
				if ( this.getPointAt(i).squaredDistanceToVector(this.getPointAt(i+1)) < Polygon.SNAP_DISTANCE * Polygon.SNAP_DISTANCE )
				{
					this.points.splice (((i + 1) % n == 0) ? 0 : i, 2); 
					i = n; 
					ok = false;
					this.dirty = true;
				}
			}
		}
		while (!ok);
	}
	
	 p.drawIntersectingEdges = function( g )
	{
		var selfIntersectionInfo;
		if ( !(selfIntersectionInfo = this.selfIntersects) ) return;
		
		this.getSide(selfIntersectionInfo.lowerIndex).draw(g);
		this.getSide(selfIntersectionInfo.upperIndex).draw(g);
		
		var lowerIndex = selfIntersectionInfo.lowerIndex+1;
		var upperIndex = selfIntersectionInfo.upperIndex;
		
		for ( var i = 0; i < this.points.length; i++ )
		{
			if ( i < lowerIndex || i > upperIndex )
			this.getPointAt(i).draw(g,4);
		}
	}
	
	p.drawWithOffset = function( g, offset )
	{
		if ( this.points.length > 0 )
		{
			g.moveTo( this.points[this.points.length-1].x + offset.x, this.points[this.points.length-1].y + offset.y);
			for (var i=0; i < this.points.length; i++ )
			{
				g.lineTo( this.points[i].x + offset.x, this.points[i].y + offset.y);
			}
		} 
	}
	
	p.draw = function( g )
	{
		
		if ( this.points.length > 0 )
		{
			g.moveTo( this.points[this.points.length-1].x, this.points[this.points.length-1].y );
			for (var i=0; i < this.points.length; i++ )
			{
				g.lineTo( this.points[i].x, this.points[i].y );
			}
		} 
	}
	
	p.drawExtras = function( g )
	{
		for (var i=0; i < this.points.length; i++ )
		{
			this.points[i].draw(g);
		}
		
	}
	
	p.toMixedPath = function( clonePoints )
	{
		var path = new qlib.MixedPath();
		for ( var i = 0; i < this.points.length; i++ )
		{
			path.addPoint( clonePoints ? points[i].getClone() : points[i] );
		}
		path.closed = true;
		return path;
	}
	
	 p.getCopyOfPoints = function( deepClone )
	{
		if (!deepClone )
		{
			return points.concat();
		} else {
			var result = [];
			for ( var i = 0; i < points.length; i++ )
			{
				result[i] =  points[i].getClone();
			}
			return result;
		}
	}
	
	p.setPoints = function( points )
	{
		this.points = points;
		this.tree = new qlib.KDTree(this.points, this.treeDistance, ["x", "y"]);
		this.dirty = true;
	}
	
	 p.getAngleAt = function( index )
	{
		return this.getPointAt( index ).cornerAngle( this.getPointAt( index-1 ), this.getPointAt( index+1 ));
	}
	
	p.reflect = function( lineSegment )
	{
		for ( var i = 0; i < this.points.length; i++ )
		{
			this.points[i] = lineSegment.mirrorPoint( this.points[i] );
		}
		this.dirty = true;
		return this;
	}
	
	
	 p.getSlices = function( l )
	{
		var result =[];
		var intersections = [];
		var intersectionIndices = [];
		var intersection,s;
		for ( var i = 0; i < this.pointCount; i++ )
		{
			s = this.getSide( i );
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
			var smallestDistance = Number.MAX_VALUE;
			var smallestIndex = -1;
			var distance, intersectionPoint;
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
			var cv = new qlib.Polygon();
			cv.addPoint( intersections[0] );
			for ( i = intersectionIndices[0]+1; i<intersectionIndices[1];i++)
			{
				cv.addPoint( points[i] );
			}
			cv.addPoint( points[i % points.length] );
			cv.addPoint( intersections[1] );
			
			if ( cv.pointCount > 2 )
			{
				result.push( cv );
			}
			
			cv = new qlib.Polygon();
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
	
	 p.getInsidePoint = function()
	{
		if ( this.pointCount == 3 ) return this.centroid;
		
		for ( var i = 0; i < this.pointCount; i++ )
		{
			var t = new qlib.Triangle( this.getPointAt(i),this.getPointAt(i+1),this.getPointAt(i+2));
			var c = t.centerOfMass;
			if ( this.isInside( c, false ) ) return c;
		}
		return null;
	}
	
	 p.getBarycentricWeights = function( p )
	{
		
		var weightSum = 0;
		var weights = [];
		var q_prev = this.points[this.points.length-1];
		var q_j =  this.points[0];
		var bc1_x = q_prev.x - q_j.x;
		var bc1_y = q_prev.y - q_j.y;
		for ( var j = 0; j < this.points.length; j++ )
		{
			var ba_x = p.x - q_j.x;
			var ba_y = p.y - q_j.y;
			var cross1 = bc1_x * ba_y - bc1_y * ba_x;
			if ( cross1 < 0 ) cross1 *= -1; 
			var cot1 = (bc1_x * ba_x + bc1_y * ba_y) / cross1;
			
			 var q_next = this.points[(j+1)%this.points.length];
			 var bc2_x = q_next.x - q_j.x;
			 var bc2_y = q_next.y - q_j.y;
			 var cross2 = bc2_x * ba_y - bc2_y * ba_x;
			 if ( cross2 < 0 ) cross2 *= -1; 
			 var cot2 = (bc2_x * ba_x + bc2_y * ba_y) / cross2;
			 weights[j] = (cot1 + cot2) / ( ba_x * ba_x + ba_y * ba_y );
			 weightSum += weights[j];
			 
			 q_prev = q_j;
			 q_j =  q_next;
			 bc1_x = - bc2_x;
			 bc1_y = - bc2_y;
		}
		weightSum = 1 / weightSum;
		for ( j = 0; j < this.points.length; j++ )
		{
			weights[j] *= weightSum;
		}
		return weights;
	}
	
	
	p.reverse = function()
	{
		this.oints.reverse();
		this.dirty = true;		
	}
	
	 p.get_obb = function()
	{
		
		var angle = this.majorAngle;
		var center = this.centroid;
		
		var minX, maxX, minY, maxY, p;
		
		p = this.points[0].getRotateAround( -angle, center );
		minX = maxX = p.x;
		minY = maxY = p.y;
		
		for ( var i = 1; i < this.points.length; i++ )
		{
			p = this.points[i].getRotateAround( -angle, center );
			if ( p.x < minX ) minX = p.x;
			if ( p.x > maxX ) maxX = p.x;
			if ( p.y < minY ) minY = p.y;
			if ( p.y > maxY ) maxY = p.y;
		}
		
		var rect = new qlib.Rectangle(minX,minY, maxX-minX, maxY-minY );
		var bounds = Polygon.fromRectangle(rect);
		bounds.rotate( angle, centroid );
		
		return new qlib.OBB(rect,center.getClone(),angle,bounds);
	}
	
	 p.toMultiResolutionPolygon = function( paddedPointCount, indexOffset)
	{
		return new qlib.MultiresolutionPolygon( this, paddedPointCount || -1, indexOffset || 0);
		
	}
	
	
	p.toString = function()
	{
		return "Polygon.fromArray(["+this.points.toString()+"])";
	}
	
	p.padPointCount = function( count )
	{
		var findLongestEdge = function(item, index, vector) 
		{
			if ( item > longestLength )
			{
				longestLength = item;
				longestIndex = index;
			}
			return true;
		};
		
		this.calculateDistanceIndex();
		while ( points.length < count )
		{
			var longestIndex = -1;
			var longestLength = 0;
			this.distances.every(findLongestEdge);
			this.distances[longestIndex] *= 0.5;
			this.distances.splice( longestIndex+1,0,this.distances[longestIndex]);
			this.addPointAt(longestIndex+1,this.getPointAt(longestIndex).getLerp(this.getPointAt(longestIndex+1),0.5));
		}
		
	}
	
	qlib.Polygon = Polygon;
}());