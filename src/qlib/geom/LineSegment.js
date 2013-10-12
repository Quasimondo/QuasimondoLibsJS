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

var LineSegment = function() {
  this.initialize( arguments );
}


LineSegment.fromPointAndAngleAndLength = function( p1, angle, length, centered )
{
	var line
	if ( !centered )
		line = new qlib.LineSegment( p1, p1.getAddCartesian( angle, length ) );
	else
		line = new qlib.LineSegment( p1.getAddCartesian( angle, -length*0.5 ), p1.getAddCartesian( angle, length*0.5 ) );
	return line
}

var p = LineSegment.prototype = new qlib.GeometricShape();

// public properties:
	p.type = "LineSegment";
	
	
	// constructor:
	/** 
	 * Initialization method.
	 * @method initialize
	 * @protected
	*/
	p.initialize = function( args ) {
		if ( typeof args[0] == "number" )
		{	
			this.p1 = new qlib.Vector2( args[0], args[1] );
			if ( typeof args[2] == "number" )
			{	
				this.p2 = new qlib.Vector2( args[2], args[3] );
			} else {
				this.p2 = args[2];
			}
		} else {
			this.p1 = args[0];
			if ( typeof args[1] == "number" )
			{	
				this.p2 = new qlib.Vector2( args[1], args[2] );
			} else {
				this.p2 = args[1];
			}
		}
		
		this.p1_end = true;
		this.p2_end = true;
	
	}
	
	p.getClosestPointOnLine = function( pt )
	{
		var Dx = this.p2.x - this.p1.x;
		var Dy = this.p2.y - this.p1.y;
		
		var YmP0x = pt.x - this.p1.x;
		var YmP0y = pt.y - this.p1.y;
		
		var t = YmP0x * Dx + YmP0y * Dy;
		
		var DdD = Dx*Dx + Dy*Dy;
		
		if (DdD == 0) 
		{
			return new qlib.Vector2( this.p1 );
		}
		
		return this.p1.getLerp( this.p2, t / DdD );
	};
	
	p.getPoint = function( t ) 
	{
		return this.p1.getLerp(this.p2,t);
	}
	
	p.getNormalAtPoint = function( p )
	{
		return new qlib.Vector2(this.p1, this.p2).getNormal();
	}
	
	p.angle = function()
	{
		return this.p1.getAngleTo( this.p2 );
	}
	
	p.getMirrorPoint = function( p )
	{
		var Dx = this.p2.x - this.p1.x;
		var Dy = this.p2.y - this.p1.y;
		var DdD = Dx*Dx + Dy*Dy;
		if (DdD == 0) 
		{
			return p.getMirror( this.p1 );
		}
		
		var YmP0x = p.x - this.p1.x;
		var YmP0y = p.y - this.p1.y;
		var t = YmP0x * Dx + YmP0y * Dy;
		
		return p.getMirror( this.p1.getLerp( this.p2, t / DdD ) );
	}
	
	p.mirrorPoint = function( p )
	{
		
		var Dx = this.p2.x - this.p1.x;
		var Dy = this.p2.y - this.p1.y;
		var DdD = Dx*Dx + Dy*Dy;
		if (DdD == 0) 
		{
			return p.mirror( this.p1 );
		}
		
		var YmP0x = p.x - this.p1.x;
		var YmP0y = p.y - this.p1.y;
		var t = YmP0x * Dx + YmP0y * Dy;
		
		return p.mirror( this.p1.getLerp( this.p2, t / DdD ) );
	}
		
	
	p.draw = function(g ) 
	{
		g.moveTo( this.p1.x, this.p1.y );
		g.lineTo( this.p2.x, this.p2.y );
	}
	
// public methods:
	/**
	 * Returns a clone of the LineSegment instance.
	 * @method clone
	 * @return {LineSegment} a clone of the LineSegment instance.
	 **/
	p.clone = function( deepClone ) {
		if ( deepClone == true )
			return new LineSegment(this.p1.x, this.p1.y, this.p2.x, this.p2.y);
		else 
			return new LineSegment( this.p1, this.p2 );
	}

	/**
	 * Returns a string representation of this object.
	 * @method toString
	 * @return {String} a string representation of the instance.
	 **/
	p.toString = function() {
		return "LineSegment";
	}
	
qlib.LineSegment = LineSegment;
}());