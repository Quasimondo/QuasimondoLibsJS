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
			this.y = args[1].y;
		}
	}
	
// public methods:


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
	
	/**
	 * Returns a clone of the Vector2 instance.
	 * @method clone
	 * @return {Vector2} a clone of the Vector2 instance.
	 **/
	p.clone = function() {
		return new Vector2(this);
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