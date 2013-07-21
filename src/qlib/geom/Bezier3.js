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
		
		this.dirty = true;
		
	}
	
	
// public methods:
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
	
	p.draw = function(g ) 
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