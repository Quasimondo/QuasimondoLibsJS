/*
* LineSegment
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

	var Bezier3 = function() {
	  this.initialize( arguments );
	}

	Bezier3.CURVE_LENGTH_PRECISION = 31;
	Bezier3.OFFSET_PRECISION = 10;
	Bezier3.MAXDEPTH = 64;    // Maximum depth for recursion
  	Bezier3.EPSILON = Math.pow(2, -Bezier3.MAXDEPTH-1); // Flatness control value
		
	/* Precomputed "z" for cubics   */
	Bezier3.cubicZ = [  
		[1.0, 0.6, 0.3, 0.1],
		[0.4, 0.6, 0.6, 0.4],
		[0.1, 0.3, 0.6, 1.0]
	];

	var p = Bezier3.prototype = new qlib.GeometricShape();

	// public properties:
	p.type = "Bezier3";
	
	
	// constructor:
	/** 
	 * Initialization method.
	 * @method initialize
	 * @protected
	*/
	p.initialize = function( args ) {
		var i = 0;
		if ( args.length == 0 )
		{
			this.p1 = new qlib.Vector2();
			this.p2 = new qlib.Vector2();
			this.c1 = new qlib.Vector2();
			this.c2 = new qlib.Vector2();
		} else {
			if ( typeof args[0] == "number" )
			{	
				this.p1 = new qlib.Vector2( args[0], args[1] );
				i += 2;
			} else {
				this.p1 = args[0];
				i++;
			}
			if ( typeof args[i] == "number" )
			{	
				this.c1 = new qlib.Vector2( args[i], args[i+1] );
				i += 2;
			} else {
				this.c1 = args[i];
				i++;
			}
			if ( typeof args[i] == "number" )
			{	
				this.c2 = new qlib.Vector2( args[i], args[i+1] );
				i += 2;
			} else {
				this.c2 = args[i];
				i++;
			}
			if ( typeof args[i] == "number" )
			{	
				this.p2 = new qlib.Vector2( args[i], args[i+1] );
			} else {
				this.p2 = args[i];
			}
		}
		this.updateFactors();
	}
	
	p.updateFactors = function()
	{
		this.gx = 3 * (this.c1.x - this.p1.x);
		this.bx = 3 * (this.c2.x - this.c1.x) - this.gx;
		this.ax = this.p2.x - this.p1.x - this.bx - this.gx;
		
		this.gy = 3 * (this.c1.y - this.p1.y);
		this.by = 3 * (this.c2.y - this.c1.y) - this.gy;
		this.ay = this.p2.y - this.p1.y - this.by - this.gy;
		
		this.pre_pt = {};
		this.pre_seg = {};
		
		this.dirty = false;
		this.lengthDirty = true;
		
	}
	
	p.intersect = function( s ) {
		this.updateFactors();
		return qlib.Intersection.intersect( this, s );
	}
	
// public methods:
	
	p.getPoint = function( t ) 
	{
		if ( this.pre_pt[t] == null ) 
		{
			var ts = t*t;
			this.pre_pt[t] = new qlib.Vector2 (  this.ax*ts*t +  this.bx*ts +  this.gx*t +  this.p1.x,  this.ay*ts*t +  this.by*ts +  this.gy*t +  this.p1.y );
		}
		return this.pre_pt[t];
		
	}
	
	p.__defineGetter__("length", function(){
		if ( !this.lengthDirty ) return this.__length;
		
		this.updateFactors();
		var min_t = 0;
		var max_t = 1;
		var	i;
		var	len = 0;
		var n_eval_pts = Bezier3.CURVE_LENGTH_PRECISION;
		if ( !( n_eval_pts & 1 ) ) n_eval_pts++;
	
		var t = [];
		var pt = [];
	
		for ( i = 0 ; i < n_eval_pts ; ++i ){
			t[i]  =  i / ( n_eval_pts - 1 );
			pt[i] = this.getPoint(t[i]);
		}
	
		for ( i = 0 ; i < n_eval_pts - 1 ; i += 2 ){
			len += this.getSectionLength (t[i] , t[i+1] , t[i+2] , pt[i] , pt[i+1] , pt[i+2]);
		}
		
		this.__length = len;
		this.lengthDirty = false;
	
		return len;
	});
	
	//	Compute the length of a small section of a parametric curve from
	//	t0 to t2 , recursing if necessary. t1 is the mid-point.
	//	The 3 points at these parametric values are precomputed.
	
	
	p.getSectionLength = function (t0, t1, t2, pt0, pt1, pt2 )
	{
	
		var hash = t0+"|"+t1+"|"+t2;
		if ( this.pre_seg[hash] == null )
		{
			
			var kEpsilon	= 1e-5;
			var kEpsilon2	= 1e-6;
			var kMaxArc	= 1.05;
			var kLenRatio	= 1.2;
		
			var d1,d2,len_1,len_2,da,db;
		
			d1 = pt0.getMinus( pt2 ).length;
			da = pt0.getMinus( pt1 ).length;
			db = pt1.getMinus( pt2 ).length;
			d2 = da + db;
		
			if ( d2 < kEpsilon )
			{
				this.pre_seg[hash] = ( d2 + ( d2 - d1 ) / 3 );
			} else if ( ( d1 < kEpsilon || d2/d1 > kMaxArc ) || ( da < kEpsilon2 || db/da > kLenRatio ) || ( db < kEpsilon2 || da/db > kLenRatio ) ) {
				var	mid_t = ( t0 + t1 ) / 2;
		
				var	pt_mid= this.getPoint ( mid_t );
		
				len_1 = this.getSectionLength( t0, mid_t, t1, pt0, pt_mid, pt1 );
		
				mid_t = ( t1 + t2 ) / 2;
				
				pt_mid = this.getPoint ( mid_t );
		
				len_2 = this.getSectionLength (t1, mid_t, t2, pt1, pt_mid, pt2 );
		
				this.pre_seg[hash] = ( len_1 + len_2 );
		
			} else {
				this.pre_seg[hash] = ( d2 + ( d2 - d1 ) / 3 );
			}
		} 
		return this.pre_seg[hash];
	}
	
	/**
	 * Returns a clone of the LineSegment instance.
	 * @method clone
	 * @return {LineSegment} a clone of the LineSegment instance.
	 **/
	p.clone = function( deepClone ) {
		if ( deepClone == true )
			return new qlib.Bezier3( this.p1.clone(), this.c1.clone(), this.c2.clone(), this.p2.clone());
		else 
			return new qlib.Bezier3( this.p1, this.c1, this.c2, this.p2 );
	}
	
	p.moveToStart = function( g, offset )
	{
		g.moveTo( this.p1.x+ ( offset != null ? offset.x : 0 ), this.p1.y + ( offset != null ? offset.y : 0 ));
	}
	
	p.moveToEnd = function( g, offset )
	{
		g.moveTo( this.p2.x+ ( offset != null ? offset.x : 0 ), this.p2.y + ( offset != null ? offset.y : 0 ));
	}
	
	p.draw = function( g, offset ) 
	{
		this.moveToStart( g,offset );
		this.drawTo( g,offset );
	}
	
	p.drawNicely = function(g, segmentLength, offset ) 
	{
		this.moveToStart( g, offset );
		this.drawToNicely( g, segmentLength, offset );
	}
	
	p.drawToNicely = function(g, segmentLength, offset)
	{
		segmentLength = ( segmentLength == null ? 4 : segmentLength);
		var t_step = segmentLength / this.length;
		if ( offset == null )
		{
			for ( var t = t_step; t < 1.0; t+=t_step )
			{
				var p = this.getPoint(t);
				g.lineTo(this.p.x,this.p.y);
			}
			g.lineTo(this.p2.x,this.p2.y);
		} else {
			for ( var t = t_step; t < 1.0; t+=t_step )
			{
				var p = this.getPoint(t);
				g.lineTo(this.p.x+offset.x,this.p.y+offset.y);
			}
			g.lineTo(this.p2.x+offset.x,this.p2.y+offset.y);
		}
	}
	
	p.drawExtras = function(g, factor, offset ) 
	{
		factor = ( factor == null ? 1 : factor);
		this.moveToStart( g, offset );
		if ( offset == null )
		{
			g.lineTo(this.c1.x, this.c1.y);
			g.moveTo(this.c2.x, this.c2.y);
			g.lineTo(this.p2.x, this.p2.y);
		} else {
			g.lineTo(this.c1.x+offset.x, this.c1.y+offset.y);
			g.moveTo(this.c2.x+offset.x, this.c2.y+offset.y);
			g.lineTo(this.p2.x+offset.x, this.p2.y+offset.y);
		}
		this.p1.draw(g,factor,offset);
		this.p2.draw(g,factor,offset);
		this.c1.draw(g,factor,offset);
		this.c2.draw(g,factor,offset);
	}
	
	p.drawTo = function(g, offset) 
	{
		if ( offset == null )
		{
			g.bezierCurveTo( this.c1.x, this.c1.y, this.c2.x,this.c2.y,this.p2.x,this.p2.y );
		} else {
			g.bezierCurveTo( this.c1.x + offset.x, this.c1.y+ offset.y, this.c2.x+ offset.x,this.c2.y+ offset.y,this.p2.x+ offset.x,this.p2.y+ offset.y );
		}
	}
	
	p.drawToReverse = function(g, offset) 
	{
		if ( offset == null )
		{
			g.bezierCurveTo( this.c2.x, this.c2.y, this.c1.x,this.c1.y,this.p1.x,this.p1.y );
		} else {
			g.bezierCurveTo( this.c2.x+ offset.x, this.c2.y+ offset.y, this.c1.x+ offset.x,this.c1.y+ offset.y,this.p1.x+ offset.x,this.p1.y+ offset.y );
		}
	}

	p.getBoundingRect = function()
	{
		var minP = this.p1.getMin( this.p2 ).min( this.c1 ).min( this.c2 );
		var size = this.p1.getMax( this.p2 ).max( this.c1 ).max( this.c2 ).minus( minP );
		return new qlib.Rectangle( minP.x, minP.y , size.x, size.y  );
	}
	
	/**
	 * Subdivides a cubic B&eacute;zier at a given value for the curve's parameter.
	 * The method uses de Casteljau algorithm.
	 * Author: Adrian Colomitchi
	 * http://www.caffeineowl.com/graphics/2d/vectorial/index.html
	 */
	
	p.getSplitAtT = function( t, clonePoints )
	{
		if ( clonePoints == null ) clonePoints = true;
		var result = [];
		if ( t == 0 || t == 1 )
		{
			result.push( clonePoints ? this.clone() : this );
		}
		if ( t<=0 || t>=1) return result;
		
		var p0x = this.p1.x + ( t * (this.c1.x - this.p1.x ));
		var p0y = this.p1.y + ( t * (this.c1.y - this.p1.y ));
		var p1x = this.c1.x + ( t * (this.c2.x - this.c1.x ));
		var p1y = this.c1.y + ( t * (this.c2.y - this.c1.y ));
		var p2x = this.c2.x + ( t * (this.p2.x - this.c2.x ));
		var p2y = this.c2.y + ( t * (this.p2.y - this.c2.y ));
		
		var p01x = p0x + ( t * (p1x-p0x));
		var p01y = p0y + ( t * (p1y-p0y));
		var p12x = p1x + ( t * (p2x-p1x));
		var p12y = p1y + ( t * (p2y-p1y));
		
		var dpx = p01x+(t*(p12x-p01x));
		var dpy = p01y+(t*(p12y-p01y));
		var t_p = new qlib.Vector2( dpx, dpy );
		result.push( new qlib.Bezier3( clonePoints ? this.p1.clone() : this.p1, new qlib.Vector2( p0x, p0y ), new qlib.Vector2( p01x, p01y ), t_p));
		result.push( new qlib.Bezier3( clonePoints ? t_p.clone() : t_p, new qlib.Vector2( p12x, p12y ), new qlib.Vector2( p2x, p2y ),  clonePoints ? this.p2.clone() : this.p2));
		
		return result;
	}
	
	/**
	 * Return the nearest point  on cubic bezier curve nearest to point pa.
	 *
	 */    
	p.getClosestPoint = function( pa ) 
	{
									
		var tCandidate = [];     // Possible roots
	   
		// Convert problem to 5th-degree Bezier form
		var w = this.convertToBezierForm( pa );

		// Find all possible roots of 5th-degree equation
		var nSolutions = this.findRoots( w, tCandidate, 0);

		// Compare distances of P5 to all candidates, and to t=0, and t=1
		// Check distance to beginning of curve, where t = 0
		//var minDistance:Number = pa.distanceToVector( p1 );
		var minDistance = pa.squaredDistanceToVector( this.p1 );
		var p;
		var bestP = this.p1;
		
		// Find distances for candidate points
	   
		var distance;
		for (var i = 0; i < nSolutions; i++) 
		{
			p = this.getPoint(tCandidate[i]);
			//distance = pa.distanceToVector( p );
			distance = pa.squaredDistanceToVector( p );
			if (distance < minDistance) 
			{
				minDistance = distance;
				bestP = p;
			}
		}

		// Finally, look at distance to end point, where t = 1.0
		//distance =  pa.distanceToVector( p2 );
		distance =  pa.squaredDistanceToVector( this.p2 );
		if (distance < minDistance) {
			minDistance = distance;
			bestP = this.p2;
		}

		return bestP;
	}
	
	/**
	 * Return the nearest t on cubic bezier curve nearest to point pa.
	 *
	 */    
	p.getClosestT = function( pa ) 
	{
		
		var tCandidate =[];     // Possible roots
		
		// Convert problem to 5th-degree Bezier form
		var w = this.convertToBezierForm( pa );
		
		// Find all possible roots of 5th-degree equation
		var nSolutions = this.findRoots( w, tCandidate, 0);
		
		// Compare distances of P5 to all candidates, and to t=0, and t=1
		// Check distance to beginning of curve, where t = 0
		var minDistance = pa.squaredDistanceToVector( this.p1 );
		var p;
		var bestT = 0;
		
		// Find distances for candidate points
		
		var distance;
		for (var i = 0; i < nSolutions; i++) 
		{
			p = this.getPoint(tCandidate[i]);
			distance = pa.squaredDistanceToVector( p );
			if (distance < minDistance) 
			{
				minDistance = distance;
				bestT = tCandidate[i];
			}
		}
		
		// Finally, look at distance to end point, where t = 1.0
		distance =  pa.squaredDistanceToVector( this.p2 );
		if (distance < minDistance) {
			minDistance = distance;
			bestT = 1;
		}
		
		return bestT;
	}
	
	
	 /**
	 *  ConvertToBezierForm :
	 *      Given a point and a Bezier curve, generate a 5th-degree
	 *      Bezier-format equation whose solution finds the point on the
	 *      curve nearest the user-defined point.
	 */
	
	p.convertToBezierForm = function( pa )
	{
		var lb, ub, i, j, k
		var v;
		var c = [];   // v(i) - pa
		var d = [];    // v(i+1) - v(i)
		var cdTable = [[],[],[]];  // Dot product of c, d
		var w =[]; // Ctl pts of 5th-degree curve

		// Determine the c's -- these are vectors created by subtracting
		// point pa from each of the control points
		c.push( this.p1.getMinus( pa ) );
		c.push( this.c1.getMinus( pa ) );
		c.push( this.c2.getMinus( pa ) );
		c.push( this.p2.getMinus( pa ) );
		
		// Determine the d's -- these are vectors created by subtracting
		// each control point from the next
		var s = 3;
		d.push( this.c1.getMinus( this.p1 ).multiply( s ) );
		d.push( this.c2.getMinus( this.c1 ).multiply( s ) );
		d.push( this.p2.getMinus( this.c2 ).multiply( s ) );
		
		// Create the c,d table -- this is a table of dot products of the
		// c's and d's                          */
		for (var row = 0; row <= 2; row++) 
		{
			for (var column = 0; column <= 3; column++) 
			{
				cdTable[row][column] = d[row].dot(c[column]);
			}
		}

		// Now, apply the z's to the dot products, on the skew diagonal
		// Also, set up the x-values, making these "points"
		for ( i = 0; i <= 5; i++) {
			w[i] = new qlib.Vector2( i / 5, 0 );
		}
		
		var n = 3;
		var m = 2;
		for ( k = 0; k <= n + m; k++) 
		{
			lb = Math.max(0, k - m);
			ub = Math.min(k, n);
			for ( i = lb; i <= ub; i++) 
			{
				j = k - i;
				w[i+j].y += cdTable[j][i] * Bezier3.cubicZ[j][i];
			}
		}

		return w;
	}
	
	 /**
	 *  FindRoots :
	 *  Given a 5th-degree equation in Bernstein-Bezier form, find
	 *  all of the roots in the interval [0, 1].  Return the number
	 *  of roots found.
	 */
	p.findRoots = function( w, t, depth )
	{  

		switch ( this.crossingCount(w, 5)) 
		{
			case 0 : { // No solutions here
				return 0;   
			}
			case 1 : { // Unique solution
				// Stop recursion when the tree is deep enough
				// if deep enough, return 1 solution at midpoint
				if (depth >= Bezier3.MAXDEPTH) 
				{
					t[0] = ( w[0].x + w[5].x) / 2.0;
					return 1;
				}
				if (this.controlPolygonFlatEnough(w, 5)) 
				{
					t[0] = this.computeXIntercept(w, 5);
					return 1;
				}
				break;
			}
		}

		// Otherwise, solve recursively after
		// subdividing control polygon
		var left = [];    // New left and right
		var right = [];   // control polygons
		var leftT = [];            // Solutions from kids
		var rightT = [];
		
		var p = [[],[],[],[],[],[]];
																	
		var i, j;
		for ( j=0; j <= 5; j++) 
		{
			p[0][j] = new qlib.Vector2( w[j] );
		}
	   
		/* Triangle computation */
		for ( i = 1; i <= 5; i++) {  
			for ( j = 0 ; j <= 5 - i; j++) {
				p[i][j] = new qlib.Vector2(
					0.5 * p[i-1][j].x + 0.5 * p[i-1][j+1].x,
					0.5 * p[i-1][j].y + 0.5 * p[i-1][j+1].y
				);
			}
		}
	
		if (left != null) {
			for ( j = 0; j <= 5; j++) {
				left[j]  = p[j][0];
			}
		}
	
		if (right != null) {
			for ( j = 0; j <= 5; j++) {
				right[j] = p[5-j][j];
			}
		}
	
		var leftCount  = this.findRoots(left,  leftT, depth+1);
		var rightCount = this.findRoots(right, rightT, depth+1);
	
		// Gather solutions together
		for ( i = 0; i < leftCount; i++) 
		{
			t[i] = leftT[i];
		}
		for ( i = 0; i < rightCount; i++) 
		{
			t[i+leftCount] = rightT[i];
		}
	
		// Send back total number of solutions  */
		return leftCount+rightCount;
	}
	
	/**
	 * CrossingCount :
	 *  Count the number of times a Bezier control polygon 
	 *  crosses the 0-axis. This number is >= the number of roots.
	 *
	 */
		
	 p.crossingCount = function( v, degree ) 
	 {
		var nCrossings = 0;
		var sign = v[0].y < 0 ? -1 : 1;
		var oldSign = sign;
		for (var i = 1; i <= degree; i++) 
		{
			sign = v[i].y < 0 ? -1 : 1;
			if (sign != oldSign) nCrossings++;
			oldSign = sign;
		}
		return nCrossings;
	}
	
	 /*
	 *  ComputeXIntercept :
	 *  Compute intersection of chord from first control point to last
	 *      with 0-axis.
	 * 
	 */
	p.computeXIntercept = function( v, degree )
	{
		var XNM = v[degree].x - v[0].x;
		var YNM = v[degree].y - v[0].y;
		var XMK = v[0].x;
		var YMK = v[0].y;
		var detInv = - 1.0/YNM;
	
		return (XNM*YMK - YNM*XMK) * detInv;
	}
	
	 /*  ControlPolygonFlatEnough :
	 *  Check if the control polygon of a Bezier curve is flat enough
	 *  for recursive subdivision to bottom out.
	 *
	 */
	 p.controlPolygonFlatEnough = function( v, degree )
	 {

		// Find the  perpendicular distance
		// from each interior control point to
		// line connecting v[0] and v[degree]
	
		// Derive the implicit equation for line connecting first
		// and last control points
		var a = v[0].y - v[degree].y;
		var b = v[degree].x - v[0].x;
		var c = v[0].x * v[degree].y - v[degree].x * v[0].y;
	
	   // supposedly fixed code replacement
		// http://tog.acm.org/resources/GraphicsGems/gems/NearestPoint.c
		var maxDistanceAbove = 0.0;
		var maxDistanceBelow = 0.0;
		
		for (var i = 1; i < degree; i++)
		{
			var value = a * v[i].x + b * v[i].y + c;
			
			if (value > maxDistanceAbove)
			{
				maxDistanceAbove = value;
			}
			else if (value < maxDistanceBelow)
			{
				maxDistanceBelow = value;
			}
		}
		
		// Implicit equation for "above" line
		var dInv = -1.0/a;
		var intercept1 = (c + maxDistanceAbove) * dInv;
		
		//  Implicit equation for "below" line
		var intercept2 = (c + maxDistanceBelow) * dInv;
		
		
		// Compute intercepts of bounding box
		var leftIntercept = Math.min(intercept1, intercept2);
		var rightIntercept = Math.max(intercept1, intercept2);
	
		var error = 0.5 * (rightIntercept-leftIntercept);    
		
		return error < Bezier3.EPSILON;
	}
	
	/**
	 * Returns a string representation of this object.
	 * @method toString
	 * @return {String} a string representation of the instance.
	 **/
	p.toString = function() {
		return "Bezier3";
	}
	
	qlib["Bezier3"] = Bezier3;
}());