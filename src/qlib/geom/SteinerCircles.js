/*
* Circle
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


	var SteinerCircles = function() {}

	var p = SteinerCircles.prototype;
	
	p.calculate = function( parentCircle, circleCount, ratio, rotation, startAngle  ) 
	{
		var i;
		
		this.parentCircle = parentCircle;
		this.circleCount = Math.max(3,circleCount);
		this.ratio = ratio;
		rotation = ( rotation == null ? 0 : rotation );
		startAngle = ( startAngle == null ? 0 : startAngle );
		
		var angleStep = Math.PI / circleCount;
		var piFactor = Math.sin( angleStep );
		var centerFactor = ( 1 - piFactor) / ( 1 + piFactor );
		
		var radius = parentCircle.r;
		var a = 2 * radius;
		var b = a * centerFactor;
		var c = ( a - b ) / 2;
		
		var satelitesDistance = b + c;
		var rotAngle = 0;
		
		var center = new qlib.Vector2();
		this.circles = [];
		
		var points = [];
		var angle;
		for ( i = 0; i < circleCount; i++) 
		{
			var angle = 2 * angleStep*i - rotation + startAngle;
			points.push( new qlib.Vector2( Math.cos(angle+angleStep)*satelitesDistance, Math.sin(angle+angleStep)*satelitesDistance));
			points.push( new qlib.Vector2( Math.cos(angle)*a, Math.sin(angle)*a));
			points.push( new qlib.Vector2( Math.cos(angle)*b, Math.sin(angle)*b));
		}
	
		
		this.inverter = new qlib.Vector2( parentCircle.r * ratio * Math.cos(rotation), parentCircle.r * ratio * Math.sin(rotation) );
		
		var innerPoints = [];
		var outerPoints = [];
		var p;
		var j;
		var p1;
		var p2;
		var p3;
		
		for ( i = 0;  i < circleCount; i++) 
		{
			p1 = this.invert( points[ i * 3 ] );
			p2 = this.invert( points[ i * 3 + 1 ] );
			p3 = this.invert( points[ i * 3 + 2 ] );
			
			innerPoints.push( p2 );
			outerPoints.push( p3 );
			
			this.circles.push( qlib.CircleUtils.from3Points(p1, p2, p3) );
		}
	
		this.circles.push( qlib.CircleUtils.from3Points( innerPoints[0],  innerPoints[1],  innerPoints[2] ) );
		this.outerCircle = qlib.CircleUtils.from3Points( outerPoints[0],  outerPoints[1],  outerPoints[2] );
		
		
		var scale =  parentCircle.r / this.outerCircle.r;
		var circle;
		
		
		for ( i = 0;  i < this.circles.length; i++) 
		{
			circle = this.circles[i];
			circle.c.minus( this.outerCircle.c );
			circle.c.multiply( scale );
			circle.r *= scale;
			circle.c.plus( parentCircle.c );
		}
		
		this.outerCircle.r *= scale;
		this.outerCircle.c.setValue( parentCircle.c );
		
		
	
	}
	
	p.invert = function( p )
	{
		var dx = p.x - this.inverter.x;
		var dy = p.y - this.inverter.y;
		var dxy = dx * dx + dy * dy ;
		if ( dxy == 0 ) dxy = 1 / Number.MAX_VALUE;
		return this.inverter.getPlus( new qlib.Vector2( dx  / dxy, dy / dxy) );
	}
	
	p.draw = function( canvas )
	{
		for ( var i = 0;  i < this.circles.length; i++) 
		{
			this.circles[i].draw(canvas);
		}
	}
	
	
		
		

	/**
	 * Returns a string representation of this object.
	 * @method toString
	 * @return {String} a string representation of the instance.
	 **/
	p.toString = function() {
		return "SteinerCircles";
	}
	
	qlib["SteinerCircles"] = SteinerCircles;
}());