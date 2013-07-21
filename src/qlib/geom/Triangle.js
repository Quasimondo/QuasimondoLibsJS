/*
* Triangle
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

var Triangle = function() {
  this.initialize( arguments );
}

var p = Triangle.prototype = new qlib.GeometricShape();

// public properties:
	p.type = "Triangle";
	
	
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
			this.p2 = new qlib.Vector2( args[i], args[i+1] );
			i += 2;
		} else {
			this.p2 = args[i];
			i++;
		}
		if ( typeof args[i] == "number" )
		{	
			this.p3 = new qlib.Vector2( args[i], args[i+1] );
			i += 2;
		} else {
			this.p3 = args[i];
			i++;
		}
		
	}
	
// public methods:

	p.translate = function(offset)
	{
		this.p1.plus( offset );
		this.p2.plus( offset );
		this.p3.plus( offset );
		return this;
	}
	
	p.scale= function( factorX, factorY, center )
	{
		if ( center == null ) center = this.incircleCenter();
		this.p1.minus( center ).multiplyXY( factorX, factorY ).plus( center );
		this.p2.minus( center ).multiplyXY( factorX, factorY ).plus( center );
		this.p3.minus( center ).multiplyXY( factorX, factorY ).plus( center );
		return this;
	}
	
	p.incircleCenter = function()
	{
		var a = this.p2.distanceToVector( this.p3 );
		var b = this.p1.distanceToVector( this.p3 );
		var c = this.p2.distanceToVector( this.p1 );
		var sum = a + b + c;
		return new qlib.Vector2( ( a * this.p1.x + b * this.p2.x + c * this.p3.x ) / sum, ( a * this.p1.y + b * this.p2.y + c * this.p3.y ) / sum );
	}
		
	p.centerOfMass = function()
	{
		return this.p1.getPlus( this.p2 ).plus( this.p3 ).divide( 3 );
	}
	
	p.getTouchingCornerCircles = function()
	{
		var a = this.getSideLength(0);
		var b = this.getSideLength(1);
		var c = this.getSideLength(2);
		
		if ( Math.abs(a-b) < 0.0000001 ) b = a;
		if ( Math.abs(a-c) < 0.0000001 ) c = a;
		if ( Math.abs(b-c) < 0.0000001 ) c = b;
		
		var result = [];
		result.push( new qlib.Circle( this.p1.clone(), 0.5 * ( b - c + a )) );
		result.push( new qlib.Circle( this.p2.clone(), 0.5 * ( c - b + a )) );
		result.push( new qlib.Circle( this.p3.clone(), 0.5 * ( b - a + c )) );
		return result;
	}
	
	p.getSideLength = function( index )
	{
		switch ( index )
		{
			case 0:
				return this.p1.distanceToVector( this.p2 );
			break;
			case 1:
				return this.p1.distanceToVector( this.p3 );
			break;
			case 2:
				return this.p2.distanceToVector( this.p3 );
			break;
		}
		return NaN;
	}
	
	p.getBoundingCircle = function()
	{
		return qlib.CircleUtils.from3Points( this.p1, this.p2, this.p3);
	}
	
	/**
	 * Returns a clone of the LineSegment instance.
	 * @method clone
	 * @return {LineSegment} a clone of the LineSegment instance.
	 **/
	p.clone = function( deepClone ) {
		if ( deepClone == true )
			return new qlib.Triangle( this.p1.clone(), this.p2.clone(), this.p2.clone());
		else 
			return new qlib.Triangle( this.p1, this.p2, this.p3 );
	}
	
	p.moveToStart = function( g )
	{
		g.moveTo( this.p1.x, this.p1.y );
	}
	
	p.draw = function(g ) 
	{
		this.moveToStart( g );
		this.lineTo( this.p2.x, this.p2.y );
		this.lineTo( this.p3.x, this.p3.y );
		this.lineTo( this.p4.x, this.p4.y );
	}
	
	/**
	 * Returns a string representation of this object.
	 * @method toString
	 * @return {String} a string representation of the instance.
	 **/
	p.toString = function() {
		return "Triangle";
	}
	
qlib.Triangle = Triangle;
}());