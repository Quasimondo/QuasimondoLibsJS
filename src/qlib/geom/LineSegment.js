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
this.qlib = this.qlib || {};

(function() {
	"use strict";
	
	var LineSegment = function() {
	  this.initialize( arguments );
	};

	var p = LineSegment.prototype = new qlib.GeometricShape();

	// public properties:
	p.type = "LineSegment";
	
	// constructor:
	/** 
	 * Initialization method.
	 * @method initialize
	 * @protected
	*/
	p.initialize = function( args ) 
	{
		if ( args.length == 0 )
		{ 
			this.p1 = new qlib.Vector2();
			this.p2 = new qlib.Vector2();
		} else if ( typeof args[0] === "number" )
		{	
			this.p1 = new qlib.Vector2( args[0], args[1] );
			if ( typeof args[2] === "number" )
			{	
				this.p2 = new qlib.Vector2( args[2], args[3] );
			} else {
				this.p2 = args[2];
			}
		} else {
			this.p1 = args[0];
			if ( typeof args[1] === "number" )
			{	
				this.p2 = new qlib.Vector2( args[1], args[2] );
			} else {
				this.p2 = args[1];
			}
		}
		
		this.p1_end = true;
		this.p2_end = true;
	
	};
	
	p.getPoint = function( t ) 
	{
		return this.p1.getLerp(this.p2,t);
	};
	
	p.getNormal = function()
	{
		return new qlib.Vector2(this.p1, this.p2).getNormal();
	};
	
	p.getNormalAtPoint = function()
	{
		return this.getNormal();
	};
	
	p.scale = function( factorX, factorY, center )
	{
		if ( center == null ) { center = this.p1.getLerp( this.p2, 0.5 ); }
		this.p1.minus( center ).multiplyXY( factorX, factorY ).plus( center );
		this.p2.minus( center ).multiplyXY( factorX, factorY ).plus( center );
		return this;
	};
	
	p.rotate = function( angle, center )
	{
		if ( center == null ) center = this.p1.getLerp( this.p2, 0.5 );
		
		this.p1.rotateAround(angle, center );
		this.p2.rotateAround(angle, center );
		return this;
	}
		
	p.getClosestT = function( pt )
	{
		var Dx = this.p2.x - this.p1.x;
		var Dy = this.p2.y - this.p1.y;
		var DdD = Dx*Dx + Dy*Dy;
		if ( DdD == 0 ) return 0;
		
		var YmP0x = pt.x - this.p1.x;
		var YmP0y = pt.y - this.p1.y;
		var t =  YmP0x * Dx + YmP0y * Dy;
		
		return t / DdD;
	
	};
	
	p.getClosestPointOnLine = function( pt )
	{
		var Dx = this.p2.x - this.p1.x, 
			Dy = this.p2.y - this.p1.y,
			YmP0x = pt.x - this.p1.x,
			YmP0y = pt.y - this.p1.y,
			t = YmP0x * Dx + YmP0y * Dy,
			DdD = Dx*Dx + Dy*Dy;
		
		if (DdD === 0) 
		{
			return new qlib.Vector2( this.p1 );
		}
		
		return this.p1.getLerp( this.p2, t / DdD );
	};
	
	p.squaredDistanceToPoint = function( pt ) 
	{
		var D = new qlib.Vector2(this.p1, this.p2),
			YmP0 = new qlib.Vector2(this.p1, pt),
			t = D.dot(YmP0);
		if (t<=0) 
		{
			return YmP0.dot(YmP0);
		}
		var DdD = D.dot(D);
		if (t>=DdD) 
		{
			var YmP1 = new qlib.Vector2(pt, this.p2);
			return YmP1.dot(YmP1);
		}
		return YmP0.dot(YmP0)-t*t/DdD;
	};
	
	p.getSplitAtT = function( t, clonePoints )
	{
		if (clonePoints== null) clonePoints = true;
		var result = [];
		if ( t == 0 || t == 1 )
		{
			result.push( clonePoints ? this.clone() : this );
		}
		if ( t<=0 || t>=1) return result;
		
		var p_t = this.getPoint( t );
		
		result.push( new qlib.LineSegment( clonePoints ? this.p1.clone() : this.p1, p_t));
		result.push( new qlib.LineSegment( clonePoints ? p_t.clone() : p_t, clonePoints ? this.p2.clone() : this.p2));
		
		return result;
	}
	
	p.getMirrorPoint = function( p )
	{
		var Dx = this.p2.x - this.p1.x,
			Dy = this.p2.y - this.p1.y,
			DdD = Dx*Dx + Dy*Dy;
		if (DdD === 0) 
		{
			return p.getMirror( this.p1 );
		}
		
		var YmP0x = p.x - this.p1.x,
			YmP0y = p.y - this.p1.y,
			t = YmP0x * Dx + YmP0y * Dy;
		
		return p.getMirror( this.p1.getLerp( this.p2, t / DdD ) );
	};
	
	p.mirrorPoint = function( p )
	{
		
		var Dx = this.p2.x - this.p1.x,
			Dy = this.p2.y - this.p1.y,
			DdD = Dx*Dx + Dy*Dy;
			
		if (DdD === 0) 
		{
			return p.mirror( this.p1 );
		}
		
		var YmP0x = p.x - this.p1.x,
			YmP0y = p.y - this.p1.y,
			t = YmP0x * Dx + YmP0y * Dy;
		
		return p.mirror( this.p1.getLerp( this.p2, t / DdD ) );
	};
	
	p.isLeft = function( p )
	{
		return (this.p2.x-this.p1.x)*(p.y-this.p1.y)-(p.x-this.p1.x)*(this.p2.y-this.p1.y);
	};
	
	p.getSlope = function()
	{
		return (this.p2.y-this.p1.y) / (this.p2.x-this.p1.x);
	};
	
	p.getIntercept = function()
	{
		return this.p1.y - this.getSlope() * this.p1.x;
	};
	
	p.getIntersection = function( l, onlyInThisSegment, onlyInOtherSegment)
	{
		if ( onlyInThisSegment == null ) onlyInThisSegment = false;
		if ( onlyInOtherSegment == null ) onlyInThisSegment = false;
		var result = [];
		var ua_t = (l.p2.x-l.p1.x)*(this.p1.y-l.p1.y)-(l.p2.y-l.p1.y)*(this.p1.x-l.p1.x);
		var ub_t = (this.p2.x-this.p1.x)*(this.p1.y-l.p1.y)-(this.p2.y-this.p1.y)*(this.p1.x-l.p1.x);
		var u_b  = (l.p2.y-l.p1.y)*(this.p2.x-this.p1.x)-(l.p2.x-l.p1.x)*(this.p2.y-this.p1.y);
		
		if (u_b != 0) 
		{
			var ua = ua_t/u_b;
			var ub = ub_t/u_b;
			if ( onlyInThisSegment && ( ua < 0 || ua > 1 || ub < 0 || ub > 1 ) ) return result
			if ( onlyInOtherSegment && ( ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1 ) ) return result
			result.push( new qlib.Vector2(this.p1.x+ua*(this.p2.x-this.p1.x), this.p1.y+ua*(this.p2.y-this.p1.y)) );
		} else if ( onlyInThisSegment ) {
			if ( this.contains( l.p1 ) ) result.push( l.p1.clone() );
			if ( this.contains( l.p2 ) ) result.push( l.p2.clone() );
			if ( l.contains( this.p1 ) ) result.push( this.p1.clone() );
			if ( l.contains( this.p2 ) ) result.push( this.p2.clone() );
		}
		return result;
	};
	
	p.getClosestPoint = function( pt )
	{
		var Dx = this.p2.x - this.p1.x,
			Dy = this.p2.y - this.p1.y,
			YmP0x = pt.x - this.p1.x,
			YmP0y = pt.y - this.p1.y,
			t = YmP0x * Dx + YmP0y * Dy;
		
		if ( t <= 0) 
		{
			return new qlib.Vector2( this.p1 );
		}
		
		var DdD = Dx*Dx + Dy*Dy;
		if ( t >= DdD ) 
		{
			return new qlib.Vector2( this.p2 );
		}
		
		if (DdD === 0) 
		{
			return new qlib.Vector2( this.p1 );
		}
		
		return this.p1.getLerp( this.p2, t / DdD );
	};
	
	p.getBoundingRect = function( )
	{
		var minP = this.p1.getMin( this.p2 );
		var size = this.p1.getMax( this.p2 ).minus( minP );
		return new qlib.Rectangle( minP.x, minP.y , size.x, size.y  );
	}
	
	p.getParallel = function( d )
	{
		var v = new qlib.Vector2( this.p1, this.p2),
			n = v.getNormal().multiply(d);
		return new qlib.LineSegment( this.p1.getPlus(n), this.p2.getPlus(n) );
	};
	
	p.moveToStart = function( g, offset )
	{
		g.moveTo( this.p1.x + ( offset != null ? offset.x : 0 ), this.p1.y + ( offset != null ? offset.y : 0 ) );
	};
	
	p.moveToEnd = function( g, offset )
	{
		g.moveTo( this.p2.x+ ( offset != null ? offset.x : 0 ), this.p2.y + ( offset != null ? offset.y : 0 ) );
	};
	
	p.draw = function( g, offset ) 
	{
		g.moveTo( this.p1.x+ ( offset != null ? offset.x : 0 ), this.p1.y + ( offset != null ? offset.y : 0 ) );
		g.lineTo( this.p2.x+ ( offset != null ? offset.x : 0 ), this.p2.y + ( offset != null ? offset.y : 0 ) );
	};
	
	p.drawTo = function( g, offset )
	{
		g.lineTo( this.p2.x+ ( offset != null ? offset.x : 0 ), this.p2.y + ( offset != null ? offset.y : 0 ) );
	};
	
	p.drawExtras = function( g, factor, offset )
	{
		var p = this.getParallel( 10 );
		if ( offset == null )
		{
			g.moveTo(  this.p1.x,  this.p1.y );
			g.lineTo( p.p1.x, p.p1.y );
			g.moveTo(  this.p2.x,  this.p2.y );
			g.lineTo( p.p2.x, p.p2.y );
		} else {
			g.moveTo(  this.p1.x + offset.x,  this.p1.y  + offset.y);
			g.lineTo( p.p1.x + offset.x, p.p1.y  + offset.y);
			g.moveTo(  this.p2.x + offset.x,  this.p2.y  + offset.y);
			g.lineTo( p.p2.x + offset.x, p.p2.y  + offset.y);
		}
		
		p = this.getParallel( 5 );
		p.draw( g, offset );
		factor = factor || 1;
		this.p1.draw(g,factor, offset);
		this.p2.draw(g,factor, offset);
	};
	
	p.__defineGetter__("angle", function(){return this.p1.getAngleTo( this.p2 );});
	
	p.__defineGetter__("length", function(){return this.p1.distanceToVector( this.p2 );});
	
	// public methods:
	/**
	 * Returns a clone of the LineSegment instance.
	 * @method clone
	 * @return {LineSegment} a clone of the LineSegment instance.
	 **/
	p.clone = function( deepClone ) 
	{
		if ( deepClone === true )
		{
			return new LineSegment(this.p1.x, this.p1.y, this.p2.x, this.p2.y);
		} 
		return new LineSegment( this.p1, this.p2 );
	};

	/**
	 * Returns a string representation of this object.
	 * @method toString
	 * @return {String} a string representation of the instance.
	 **/
	p.toString = function() 
	{
		return "LineSegment";
	};
	
	LineSegment.fromPointAndAngleAndLength = function( p1, angle, length, centered )
	{
		var line;
		if ( !centered )
		{
			line = new qlib.LineSegment( p1, p1.getAddCartesian( angle, length ) );
		} else {
			line = new qlib.LineSegment( p1.getAddCartesian( angle, -length*0.5 ), p1.getAddCartesian( angle, length*0.5 ) );
		}
		return line;
	};
	
	qlib["LineSegment"] = LineSegment;
}());