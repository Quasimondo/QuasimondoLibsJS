/*
* LinearPath
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
	
	var LinearPath = function() {
	  this.initialize();
	}
	
	LinearPath.fromArray = function( points, clonePoints )
	{
		if ( clonePoints == null ) clonePoints = false;
		var p = new qlib.LinearPath();
		for ( var i = 0; i < points.length; i++ )
		{
			p.addPoint( clonePoints ? points[i].clone() : points[i] );
		}
		
		return p;
	}
	
	LinearPath.SMOOTH_PATH_RELATIVE_EDGEWISE = 0;
	LinearPath.SMOOTH_PATH_ABSOLUTE_EDGEWISE = 1;
	LinearPath.SMOOTH_PATH_RELATIVE_MINIMUM = 2;
	LinearPath.SMOOTH_PATH_ABSOLUTE_MINIMUM = 3;
		
	
	var p = LinearPath.prototype = new qlib.GeometricShape();
	
	p.type = "LinearPath";
	
	p.initialize = function()
	{
		this.points = [];
		this.distances = [];
		this.totalLength = 0;
		this.dirty = false;
	}
	
	p.__defineGetter__("segmentCount", function(){
		return this.points.length;
	});
	
	p.addPoint = function( p, clonePoint )
	{
		if ( this.points.length>0 &&this.points[this.points.length-1].equals(p)) return false;
		
		if ( clonePoint == null ) clonePoint = true;
		this.points.push( clonePoint ? p.clone() : p );
		if ( this.points.length>1)
		{
			var d = p.distanceToVector( this.points[this.points.length - 2] );
			if ( d > 0 )
			{
				this.distances.push(d);
				this.totalLength += d;
			} else {
				this.points.pop();
				return false;
			}
		}
		
		this.dirty = true;
		return true;
	}
	
	p.getSmoothPath = function( factor, mode, loop)
	{
		if ( mode == null) mode = 0;
		if ( loop == null ) loop = false;
		if ( mode < 0 || mode > 3 )
		{
			return false;
		}
		var segments = [];
		var s;
		var l = Number.MAX_VALUE;;
		var p1, p2;
		 
		for ( var i = 0; i < this.points.length-(loop ? 0 : 1); i++ )
		{
			s = this.getSegment(i);
			segments.push( s );
			switch ( mode )
			{
				case LinearPath.SMOOTH_PATH_RELATIVE_MINIMUM:
				case LinearPath.SMOOTH_PATH_ABSOLUTE_MINIMUM:
					 l = Math.min( l, s.length ) ;
				break;
			}
		}
		
		switch ( mode )
		{
			case LinearPath.SMOOTH_PATH_RELATIVE_MINIMUM:
				l *= 0.5 * factor;
			break;
			case LinearPath.SMOOTH_PATH_ABSOLUTE_MINIMUM:
				 l = Math.min( l*0.5, factor ) ;
			break;
		}
		
		
		var mp = new qlib.MixedPath();
		if ( segments.length > 0 )
		{
			if ( !loop )
				mp.addPoint( segments[0].getPoint(0) );
			
		}
		for ( i = 0; i < segments.length; i++ )
		{
			s = segments[i];
			if ( s.length > 0 )
			{
				switch ( mode )
				{
					case LinearPath.SMOOTH_PATH_RELATIVE_EDGEWISE:
						l = s.length * 0.5 * factor;
					break;
					case LinearPath.SMOOTH_PATH_ABSOLUTE_EDGEWISE:
						 l = Math.min( s.length*0.5, factor ) ;
					break;
				}
				
				p1 = s.getPoint( l / s.length );
				p2 = s.getPoint( 1- ( l / s.length ) );
			
				mp.addPoint(p1);
				if ( !p1.equals(p2 )) mp.addPoint(p2);
				mp.addControlPoint( s.p2.clone() );
			}
		}
		if (  segments.length > 0 )
		{
			if (!loop)
				mp.addPoint( segments[segments.length-1].getPoint(1) );
		} 
		mp.closed = loop;
		return mp;
	}
	
	p.getSegment = function( index )
	{
		index = ( index % this.points.length + this.points.length) % this.points.length;
		return new qlib.LineSegment( this.points[index], this.points[(index+1)% this.points.length] );
	}
	
	p.getBoundingRect = function()
	{
		var p = this.points[0];
		var minX = p.x;
		var maxX = minX;
		var minY = p.y;
		var maxY = minY;
		for ( var i = 1; i< this.points.length; i++ )
		{
			p = this.points[i];
			if ( p.x < minX ) minX = p.x;
			else if ( p.x > maxX ) maxX = p.x;
			if ( p.y < minY ) minY = p.y;
			else if ( p.y > maxY ) maxY = p.y;
		}
		
		return new qlib.Rectangle( minX, minY, maxX - minX, maxY - minY );
	}
		
	
	qlib["LinearPath"] = LinearPath;
}());