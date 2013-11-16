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
this.qlib = this.qlib||{};

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
		[0.1, 0.3, 0.6, 1.0],
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
	
	p.moveToStart = function( g )
	{
		g.moveTo( this.p1.x, this.p1.y );
	}
	
	p.moveToEnd = function( g )
	{
		g.moveTo( this.p2.x, this.p2.y );
	}
	
	p.draw = function( g ) 
	{
		this.moveToStart( g );
		this.drawTo( g );
	}
	
	p.drawNicely = function(g, segmentLength ) 
	{
		this.moveToStart( g );
		this.drawToNicely( g, segmentLength );
	}
	
	p.drawToNicely = function(g, segmentLength)
	{
		segmentLength = ( segmentLength == null ? 4 : segmentLength);
		var t_step = segmentLength / this.length;
		for ( var t = t_step; t < 1.0; t+=t_step )
		{
			var p = this.getPoint(t);
			g.lineTo(this.p.x,this.p.y);
		}
		g.lineTo(this.p2.x,this.p2.y);
	}
	
	p.drawExtras = function(g, factor ) 
	{
		factor = ( factor == null ? 1 : factor);
		this.moveToStart( g );
		g.lineTo(this.c1.x, this.c1.y);
		g.moveTo(this.c2.x, this.c2.y);
		g.lineTo(this.p2.x, this.p2.y);
		
		this.p1.draw(g,factor);
		this.p2.draw(g,factor);
		this.c1.draw(g,factor);
		this.c2.draw(g,factor);
	}
	
	p.drawTo = function(g) 
	{
		g.bezierCurveTo( this.c1.x, this.c1.y, this.c2.x,this.c2.y,this.p2.x,this.p2.y );
	}
	
	p.drawToReverse = function(g) 
	{
		g.bezierCurveTo( this.c2.x, this.c2.y, this.c1.x,this.c1.y,this.p1.x,this.p1.y );
		
	}

	/**
	 * Returns a string representation of this object.
	 * @method toString
	 * @return {String} a string representation of the instance.
	 **/
	p.toString = function() {
		return "Bezier3";
	}
	
	qlib.Bezier3 = Bezier3;
}());