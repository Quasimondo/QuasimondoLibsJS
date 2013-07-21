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

var Bezier2 = function() {
  this.initialize( arguments );
}

var p = Bezier2.prototype = new qlib.GeometricShape();

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
		
	}
	
// public methods:


	p.getPoint = function( t ) 
	{
		var ti = 1-t;
		return new qlib.Vector2( ti*ti*this.p1.x+2*t*ti*this.c.x+t*t*this.p2.x , ti*ti*this.p1.y+2*t*ti*this.c.y+t*t*this.p2.y);
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