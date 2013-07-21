/*
* Rectangle
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

var Rectangle = function( x, y, width, height ) {
  this.initialize( x, y, width, height );
}

var p = Rectangle.prototype = new qlib.GeometricShape();

// public properties:
	p.type = "Rectangle";
	
	
	// constructor:
	/** 
	 * Initialization method.
	 * @method initialize
	 * @protected
	*/
	p.initialize = function( x, y, width, height ) {
		this.x = (x == null ? 0 : x);
		this.y = (y == null ? 0 : y);
		this.width = (width == null ? 0 : width);
		this.height = (height == null ? 0 : height);
		this.fixValues();
	}
	
	p.fixValues = function () 
	{
		if ( this.width < 0 )
		{
			this.x += this.width;
			this.width *= -1;
		}
		if ( this.height < 0 )
		{
			this.y += this.height;
			this.height *= -1;
		}
	}
	
	p.scale = function( factorX, factorY, center )
	{
		if ( center == null ) center = new qlib.Vector2( this.x + this.width * 0.5, this.y + this.height * 0.5);
		var newXY = new qlib.Vector2( this.x, this.y).minus( center ).multiplyXY( factorX, factorY ).plus( center );
		this.x = newXY.x;
		this.y = newXY.y;
		this.width *= factorX;
		this.height *= factorY;
		this.fixValues();
		return this;
	}
	
	p.union = function( rect )
	{
		if ( this.width == 0 || this.height == 0 )
		{
			return rect.clone();
		}
		if ( rect.width == 0 || rect.height == 0 )
		{
			return this.clone();
		}
		var minx = Math.min( this.x, rect.x );
		var miny = Math.min( this.y, rect.y );
		var maxx = Math.max( this.x + this.width, rect.x + rect.width);
		var maxy = Math.max( this.y + this.height, rect.y + rect.height);
		return new qlib.Rectangle( minx, miny, maxx - minx, maxy - miny );
		
	}
	
// public methods:
	/**
	 * Returns a clone of the Rectangle instance.
	 * @method clone
	 * @return {Rectangle} a clone of the Rectangle instance.
	 **/
	p.clone = function( deepClone ) {
		return new Rectangle( this.x, this.y, this.width, this.height );
	}
	
	p.draw = function( graphics )
	{
		graphics.drawRect(this.x, this.y, this.width, this.height );
	}

	/**
	 * Returns a string representation of this object.
	 * @method toString
	 * @return {String} a string representation of the instance.
	 **/
	p.toString = function() {
		return "Rectangle";
	}
	
qlib.Rectangle = Rectangle;
}());