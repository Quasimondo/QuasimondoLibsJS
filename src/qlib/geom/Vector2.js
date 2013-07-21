/*
* Vector2
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

var Vector2 = function() {
  this.initialize(arguments);
}
var p = Vector2.prototype;
	
// public properties:

	/** 
	 * X position. 
	 * @property x
	 * @type Number
	 **/
	p.x = 0;
	
	/** 
	 * Y position. 
	 * @property y
	 * @type Number
	 **/
	p.y = 0;
	
// constructor:
	/** 
	 * Initialization method.
	 * @method initialize
	 * @protected
	*/
	p.initialize = function(args) 
	{
		if (args.length == 0)
		{ 
			this.x = this.y = 0;
		} else if ( typeof args[0] == "number" )
		{	
			this.x = ( args[0] == null ? 0 : args[0]);
			this.y = ( args[1] == null ? 0 : args[1]);
		} else {
			this.x = args[0].x;
			this.y = args[0].y;
		}
	}
	
// public methods:

	p.setValue = function()
	{
		if (arguments.length == 0)
		{ 
			this.x = this.y = 0;
		} else if ( typeof arguments[0] == "number" )
		{	
			this.x = ( arguments[0] == null ? 0 : arguments[0]);
			this.y = ( arguments[1] == null ? 0 : arguments[1]);
		} else {
			this.x = arguments[0].x;
			this.y = arguments[0].y;
		}
	}

	p.squaredDistanceToVector = function( v )
	{
		var dx = this.x - v.x;
		var dy = this.y - v.y;
		return dx * dx + dy * dy;
	}
	
	p.distanceToVector = function( v )
	{
		return Math.sqrt( this.squaredDistanceToVector(v) );
	}
	
	
	p.getLerp = function( v, l )
	{
		return new qlib.Vector2( this.x + (v.x - this.x) * l, this.y + (v.y - this.y) * l );
	}
		
	p.lerp = function( v, l )
	{
		this.x += (v.x - this.x) * l
		this.y += (v.y - this.y) * l;
		return this;
	}

	p.snaps = function( v, squaredSnapDistance ) 
	{
		return this.squaredDistanceToVector( v ) < ( squaredSnapDistance == null ? 0.00000001 : squaredSnapDistance);
	};
	
	p.getLength = function()
	{
		return Math.sqrt( this.x * this.x + this.y * this.y );
	}
		
	p.getSquaredLength = function()
	{
		return this.x * this.x + this.y * this.y;
	}
		
	p.getAngle = function( )
	{
		return Math.atan2( this.y , this.x );
	}
	
	p.newLength = function( len )
	{
		var l = this.getLength();
		if ( l == 0 ) return this;
		this.x *= len / l;
		this.y *= len / l;
		
		return this;
	}
	
	p.getNewLength = function( len )
	{
		var l = this.getLength();
		return new qlib.Vector2( this.x / l * len, this.y / l * len );
	}
	
	p.plus = function( v )
	{
		this.x += v.x;
		this.y += v.y;
		return this;
	}
	
	p.getPlus = function( v )
	{
		return new qlib.Vector2( this.x + v.x, this.y + v.y );
	}
	
	p.plusXY = function( tx, ty )
	{
		this.x += tx;
		this.y += ty;
		return this;
	}
	
	p.getPlusXY = function( tx, ty )
	{
		return new qlib.Vector2( this.x + tx, this.y + ty );
	}
	
	p.minus = function( v )
	{
		this.x -= v.x;
		this.y -= v.y;
		return this;
	}
	
	p.getMinus = function( v )
	{
		return new qlib.Vector2( this.x - v.x, this.y - v.y );
	}
	
	p.multiply = function( f )
	{
		this.x *= f;
		this.y *= f;
		return this;
	}
	
	p.getMultiply = function( f )
	{
		return new qlib.Vector2( this.x * f, this.y * f );
	}
	
	p.multiplyXY = function( fx, fy )
	{
		this.x *= fx;
		this.y *= fy;
		return this;
	}
	
	p.getMultiplyXY = function( fx, fy )
	{
		return new qlib.Vector2( this.x * fx, this.y * fy );
	}
	
	p.divide = function( d )
	{
		this.x /= d;
		this.y /= d;
		return this;
	}
	
	p.getDivide = function( d )
	{
		return new qlib.Vector2( this.x / d, this.y / d );
	}
	
	p.getAddCartesian = function( angle, length )
	{
		return new qlib.Vector2 (this.x + Math.cos ( angle ) * length, this.y + Math.sin ( angle ) * length );
	}
	
	p.addCartesian = function( angle, length )
	{
		this.x += Math.cos ( angle ) * length;
		this.y += Math.sin ( angle ) * length;
		return this;
	}
	
	p.getAngle = function( )
	{
		return Math.atan2( this.y , this.x );
	}
	
	p.getAngleTo= function( v )
	{
		return Math.atan2( v.y - this.y, v.x - this.x );
	};
	
	p.dot= function( v )
	{
		return this.x * v.x + this.y * v.y;
	}
	
	p.cross = function( v )
	{
		return this.x * v.y - this.y * v.x;
	}
		
	p.angleBetween = function( v )
	{
		return Math.acos ( this.dot( v ) / ( this.getLength() * v.getLength() ) );
	}
	
	p.cornerAngle = function( v1, v2 )
	{
		return v1.getMinus(this).angleBetween( v2.getMinus(this) );
	}
	
	
	p.getProject = function( a, b )
	{
		
		// upgraded version by Fabien  Bizot 
		// http://www.lafabrick.com/blog
		var len = a.distanceToVector( b );
		var r = (((a.y - this.y) * (a.y - b.y)) - ((a.x - this.x) * (b.x - a.x))) / (len * len);
		
		var px = a.x + r * (b.x - a.x);
		var py = a.y + r * (b.y - a.y);
		
		return new qlib.Vector2(px, py);
	}
	
	p.project = function( a, b )
	{
		
		// upgraded version by Fabien  Bizot 
		// http://www.lafabrick.com/blog
		var len = a.distanceToVector( b );
		var r = (((a.y - this.y) * (a.y - b.y)) - ((a.x - this.x) * (b.x - a.x))) / (len * len);
		
		this.x = a.x + r * (b.x - a.x);
		this.y = a.y + r * (b.y - a.y);
		
		return this;
	}
	
	
	/**
	 * Returns a clone of the Vector2 instance.
	 * @method clone
	 * @return {Vector2} a clone of the Vector2 instance.
	 **/
	p.clone = function() {
		return new Vector2(this);
	}

	
	p.draw = function( g, radius )
	{
		radius = ( radius == null ? 2 : radius );
		g.moveTo(this.x-radius,this.y)
		g.lineTo(this.x+radius,this.y);
		g.moveTo(this.x,this.y-radius);
		g.lineTo(this.x,this.y+radius);
	}
		
	p.drawCircle = function( g, radius )
	{
		radius = ( radius == null ? 2 : radius );
		g.drawRect(this.x-0.5,this.y-0.5,1,1);
		g.drawCircle(this.x,this.y,radius);
	}
		
	p.drawRect = function( g, radius )
	{
		radius = ( radius == null ? 2 : radius );
		g.drawRect(this.x-radius,this.y-radius,radius+radius,radius+radius);
	}
	
	
	/**
	 * Returns a string representation of this object.
	 * @method toString
	 * @return {String} a string representation of the instance.
	 **/
	p.toString = function() {
		return "Vector2";//"[Vector2 (x="+this.x+" y="+this.y+")]";
	}
	
qlib.Vector2 = Vector2;
}());