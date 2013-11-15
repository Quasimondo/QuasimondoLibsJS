/*
* Vector2 Cloud
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
	
	var Vector2Cloud = function() {
	  this.clear();
	}
	var p = Vector2Cloud.prototype;

	Vector2Cloud.NUM_STANDARD_DEVIATIONS = 1.7;
	
	Vector2Cloud.fromArray = function( points, clonePoints )
	{
		if ( clonePoints == null ) clonePoints = false;
		var vc = new qlib.Vector2Cloud();
		if ( !clonePoints )
		{
			for ( var i = 0; i < points.length; i++ )
			{
				vc.accumulate( points[i] );
			}
		} else {
			for ( var i = 0; i < points.length; i++ )
			{
				vc.accumulate( points[i].getClone() );
			}
		}
		
		return vc;
	}
	
	p.clear = function()
	{
		if ( this.points == null )
			this.points = [];
		else 
			this.points.length = 0;
		
		this.sum = new qlib.Vector2();
		this._centroid = new qlib.Vector2();
		
		this.majorAngle = 0;
		this.dirty = this.centroidDirty = true;
		this.tree = new qlib.KDTree([],this.distance,["x","y"]);
		this.treeDirty = false;
	}
	
	
	p.accumulate = function( vector )
	{
		if ( this.treeDirty )
		{
			this.tree = new qlib.KDTree(this.points,this.distance,["x","y"]);
			this.treeDirty = false;
		}
		this.points.push( vector );
		this.sum.plus( vector );
		this.tree.insert( vector );
		this.dirty = this.centroidDirty = true;
	}
		
		
		
	p.distance = function(a, b){
	  var d;
	  return ( d = a.x - b.x ) * d + ( d = a.y - b.y) * d;
	}	
		
		
	p.getPointCount = function()
	{
		return this.points.length;
	}
	
	p.getCentroid = function()
	{
		if ( this.points.length > 0 && this.centroidDirty ) {
			this._centroid = this.sum.getDivide( this.points.length );
			this.centroidDirty = false;
		}
		return this._centroid;
	}	
		
		
		
	p.compute_covariance_body = function()
	{
		if (this.points.length == 0 || !this.dirty) return;
		
		this.covariance = new qlib.CovarianceMatrix2();
		var mean = this.getCentroid();
		
		for ( var i = 0; i < this.points.length; i++) 
		{
			var c = this.points[i].getMinus( mean );
			this.covariance.a += c.x * c.x;
			this.covariance.b += c.x * c.y;
			this.covariance.c += c.y * c.y;
		}
		
		var dy = 2 * this.covariance.b;
		var dx = this.covariance.a  - this.covariance.c + Math.sqrt(Math.pow(this.covariance.a - this.covariance.c,2) + Math.pow( 2 * this.covariance.b, 2 ) );
		if ( dy == 0 && dx == 0 )
		{
			this.majorAngle = ( this.covariance.a >= this.covariance.c ? 0 : Math.PI * 0.5 );
		} else {
			this.majorAngle = Math.atan2( dy, dx );
		}
		
		this.covariance.scale( 1 / this.points.length );
		this.dirty = false;
	}
		
		
		
	p.getMajorAngle = function()
	{
		if ( this.dirty ) this.compute_covariance_body();
		return this.majorAngle;
	}
		
	p.getObb = function()
	{
		var angle = this.majorAngle;
		var center = this.getCentroid();
	
		var minX, maxX, minY, maxY;
		
		var p = this.points[0].getRotateAround( -angle, center );
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
		
		var result = ConvexPolygon.fromArray([ new qlib.Vector2( minX, minY ), new qlib.Vector2( maxX, minY ), new qlib.Vector2( maxX, maxY ), new qlib.Vector2( minX, maxY ) ]);
		result.rotate( angle, this.getCentroid() );
		return result;
	}
		
	p.getDensity = function()
	{
		return this.getObb().area / this.pointCount;
	}
		
	p.getSplitClouds = function( line )
	{
		var result =[];
		result.push( new qlib.Vector2Cloud(), new qlib.Vector2Cloud() );
		for ( var i in this.points )
		{
			result[( this.points[i].isLeft( line.p1, line.p2 ) < 0 ? 0 : 1 )].accumulate( this.points[i]);
		}
		
		return result;
	}
		
	p.getClosestPoints = function( point, count, maxDistance )
	{
		if ( this.treeDirty )
		{
			this.tree = new qlib.KDTree(this.points,this.distance,["x","y"]);
			this.treeDirty = false;
		}
		var nearest = this.tree.nearest( point, count, maxDistance );
		var result = []
		for ( var i = 0; i < nearest.length; i++ )
		{
			result.push( nearest[i][0] );
		}
		return result;
	}
		
	p.drawCovarianceEllipse = function( canvas, standardDeviations) 
	{
		
		if ( this.dirty ) this.compute_covariance_body();
		if ( standardDeviations == null ) standardDeviations = Vector2Cloud.NUM_STANDARD_DEVIATIONS
		var axis = [];
		var lambda = [];
		
		this.covariance.find_eigenvectors(lambda, axis);
		
		var len0 = Math.sqrt(Math.abs(lambda[0])) * standardDeviations;
		var len1 = Math.sqrt(Math.abs(lambda[1])) * standardDeviations;
		
		var axis0 = axis[0];
		var axis1 = axis[1];
		
		axis0.multiply(len0);
		axis1.multiply(len1);
		
		const NUM_VERTICES = 300;
		
		// Generate the vertex coordinates for the ellipse.
		
		var theta = 0;
		var ct = Math.cos(theta);
		var st = Math.sin(theta);
		var pos = axis0.getMultiply(ct).plus( axis1.getMultiply(st) ).plus( this.getCentroid() );
		
		canvas.moveTo( pos.x, pos.y );
		for (var j = 1; j < NUM_VERTICES; j++) 
		{
			theta = 2 * Math.PI * (j / NUM_VERTICES);
			ct = Math.cos(theta);
			st = Math.sin(theta);
			pos = axis0.getMultiply(ct).plus( axis1.getMultiply(st) ).plus( this.getCentroid() );
			canvas.lineTo( pos.x, pos.y );
		}
	}
		
	p.rotate = function( angle, center )
	{
		if ( center == null ) center = this.getCentroid();
		for ( var i in this.points )
		{
			this.points[i].rotateAround( angle, center );
		}
		this.dirty = true;
		this.treeDirty = true;
		this.centroidDirty = true;
		return this;
	}
		
	p.getBoundingRect = function()
	{
		if ( this.points.length == 0 ) return new qlib.Rectangle();
		var minX, maxX, minY, maxY;
		
		minX = maxX = this.points[0].x;
		minY = maxY =  this.points[0].y;
		
		for ( var i = 0; i < this.points.length; i++)
		{
			var point = this.points[i];
			if ( point.x < minX ) minX = point.x;
			if ( point.x > maxX ) maxX = point.x;
			if ( point.y < minY ) minY = point.y;
			if ( point.y > maxY ) maxY = point.y;
		}
		
		return new qlib.Rectangle( minX, minY, maxX - minX + 1, maxY - minY + 1 );
	}
		
	p.convexHull = function()
	{
		return qlib.ConvexPolygon.fromArray( this.points );
	}
		
	p.getInnerCloud = function()
	{
		var hull = this.convexHull();
		var result =  this.points.concat();
		for ( var i = 0; i < hull.pointCount; i++ )
		{
			var hullPoint = hull.getPointAt(i);
			for ( var j = 0; j < result.length; j++ )
			{
				if ( result[j] == hullPoint )
				{
					result.splice(j,1);
					break;
				}
			}
		}	
		return qlib.Vector2Cloud.fromArray( result );
	}
			
		
	p.draw = function( canvas, radius )
	{
		for ( var i = 0; i < this.points.length; i++ )
		{
			this.points[i].draw( canvas, radius );
		}
	}
		
	p.clone = function( deepClone )
	{
		if ( deepClone == null || deepClone )
		{
			var tmp = [];
			for ( var i = 0; i < this.points.length; i++ )
			{
				tmp.push( this.points[i].getClone() );
			}
			return qlib.Vector2Cloud.fromArray( tmp );
		} else {
			return qlib.Vector2Cloud.fromArray( points );
		}
	}
		
	qlib.Vector2Cloud = Vector2Cloud;
}());
