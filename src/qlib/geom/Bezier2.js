/*
* Quadratic Bezier Curve
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
	"use strict";

	var Bezier2 = function() {
	  this.initialize( arguments );
	}

	var p = Bezier2.prototype = new qlib.GeometricShape();

	
	Bezier2.CURVE_LENGTH_PRECISION = 31;
	Bezier2.OFFSET_PRECISION = 10;
		
	// public properties:
	p.type = "Bezier2";
	
	
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
			this.c = new qlib.Vector2( args[i], args[i+1] );
			i += 2;
		} else {
			this.c = args[i];
			i++;
		}
		if ( typeof args[i] == "number" )
		{	
			this.p2 = new qlib.Vector2( args[i], args[i+1] );
		} else {
			this.p2 = args[i];
		}
		this.dirty = true;
	}
	
// public methods:


	p.getPoint = function( t ) 
	{
		var ti = 1-t;
		return new qlib.Vector2( ti*ti*this.p1.x+2*t*ti*this.c.x+t*t*this.p2.x , ti*ti*this.p1.y+2*t*ti*this.c.y+t*t*this.p2.y);
	}
	
	p.__defineGetter__("length", function(){
		if ( !this.dirty ) return this.__length;
		
		var min_t = 0;
		var max_t = 1;
		var	i;
		var	len = 0;
		var n_eval_pts = Bezier2.CURVE_LENGTH_PRECISION;
		if ( !( n_eval_pts & 1 ) ) n_eval_pts++;
	
		var t = [];
		var pt = [];
	
		for ( i = 0 ; i < n_eval_pts ; ++i )
		{
			t[i]  =  i / ( n_eval_pts - 1 );
			pt[i] = this.getPoint(t[i]);
		}
	
		for ( i = 0 ; i < n_eval_pts - 1 ; i += 2 )
		{
			len += this.getSectionLength (t[i] , t[i+1] , t[i+2] , pt[i] , pt[i+1] , pt[i+2]);
		}
		
		this.__length = len;
		this.dirty = false;
	
		return len;
	});
	
	p.getSectionLength = function (t0, t1, t2, pt0, pt1, pt2 )
	{
	
		var kEpsilon	= 1e-5;
		var kEpsilon2	= 1e-6;
		var kMaxArc	= 1.05;
		var kLenRatio	= 1.2;
	
		var d2,len_1,len_2;
	
		var d1 = pt0.getMinus( pt2 ).length;
		var da = pt0.getMinus( pt1 ).length;
		var db = pt1.getMinus( pt2 ).length;
	
		d2 = da + db;
	
		if ( d2 < kEpsilon || da==0 || db == 0){
			return ( d2 + ( d2 - d1 ) / 3 );
		} else if ( ( d1 < kEpsilon || d2/d1 > kMaxArc ) || ( da < kEpsilon2 || db/da > kLenRatio ) || ( db < kEpsilon2 || da/db > kLenRatio ) ) {
			var	mid_t = ( t0 + t1 ) / 2;
	
			var	pt_mid = this.getPoint ( mid_t );
	
			len_1 = this.getSectionLength( t0, mid_t, t1, pt0, pt_mid, pt1 );
	
			mid_t = ( t1 + t2 ) / 2;
			
			pt_mid = this.getPoint ( mid_t );
	
			len_2 = this.getSectionLength (t1, mid_t, t2, pt1, pt_mid, pt2 );
	
			return ( len_1 + len_2 );
	
		} else {
			return ( d2 + ( d2 - d1 ) / 3 );
		}
	
	}

	/**
	 * Returns a clone of the LineSegment instance.
	 * @method clone
	 * @return {LineSegment} a clone of the LineSegment instance.
	 **/
	p.clone = function( deepClone ) {
		if ( deepClone == true )
			return new qlib.Bezier2( this.p1.clone(), this.c.clone(), this.p2.clone());
		else 
			return new qlib.Bezier2( this.p1, this.c, this.p2 );
	}
	
	p.moveToStart = function( g )
	{
		g.moveTo( this.p1.x, this.p1.y );
	}
	
	p.moveToEnd = function( g )
	{
		g.moveTo( this.p2.x, this.p2.y );
	}
	
	p.draw = function(g ) 
	{
		this.moveToStart( g );
		this.drawTo( g );
	}
	
	p.drawExtras = function(g, factor ) 
	{
		factor = ( factor == null ? 1 : factor);
		this.moveToStart( g );
		g.lineTo(this.c.x, this.c.y);
		g.lineTo(this.p2.x, this.p2.y);
		
		this.p1.draw(g,factor);
		this.p2.draw(g,factor);
		this.c.draw(g,factor);
		
	}
	
	p.drawTo = function(g) 
	{
		g.curveTo( this.c.x, this.c.y, this.p2.x,this.p2.y );
	}
	
	p.drawToReverse = function(g) 
	{
		g.curveTo( this.c.x,this.c.y,this.p1.x,this.p1.y );
		
	}

	/**
	 * Returns a string representation of this object.
	 * @method toString
	 * @return {String} a string representation of the instance.
	 **/
	p.toString = function() {
		return "Bezier2";
	}
	
qlib.Bezier2 = Bezier2;
}());