/*
* Coons Patch
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

	var CoonsPatch = function( bound_top,bound_right,bound_bottom,bound_left ) {
	  this.initialize( bound_top,bound_right,bound_bottom,bound_left );
	}

	var p = CoonsPatch.prototype;


	// public properties:
	p.type = "CoonsPatch";
		
	p.initialize = function(bound_top,bound_right,bound_bottom,bound_left)
	{
		this.bound_top = bound_top;
		this.bound_right = bound_right;
		this.bound_bottom = bound_bottom;
		this.bound_left = bound_left;
		
	}
	
	p.getMesh = function( cols, rows )
	{
		var baseStep_x = 1 / (cols-1);
		var baseStep_y = 1 / (rows-1);
		var points = [];
		
		var p00 = this.bound_bottom.getPoint(0);
		var p11 = this.bound_top.getPoint(1);
		var p01 = this.bound_top.getPoint(0);
		var p10 = this.bound_bottom.getPoint(1);
		
		var p00x = p00.x;
		var p00y = p00.y;
		var p10x = p10.x;
		var p10y = p10.y;
		var p01x = p01.x;
		var p01y = p01.y;
		var p11x = p11.x;
		var p11y = p11.y;
		
		var u, iu, iv, pu0, pu1,pv0,pv1;
		var v = 0;
		
		for ( var y = 0; y < rows; y += 1 )
		{
			iv = 1 - v;
			pv0 = this.bound_left.getPoint(v);
			pv1 = this.bound_right.getPoint(iv);
			v += baseStep_y;
			u = 0;
			for ( var x = 0; x < cols; x +=1 )
			{
				iu = 1 - u;
				
				pu0 = this.bound_bottom.getPoint(u);
				pu1 = this.bound_top.getPoint(u);
				
				points.push( new qlib.Vector2(
					v * pu0.x + iv * pu1.x + iu * pv0.x + u * pv1.x - iu * v * p00x - u * v * p10x - iu * iv * p01x - u * iv * p11x,
					v * pu0.y + iv * pu1.y + iu * pv0.y + u * pv1.y - iu * v * p00y - u * v * p10y - iu * iv * p01y - u * iv * p11y ));
			
				u += baseStep_x;
				
			}
		}
		return points;
	}
	
	//rectangle corners in clockwise order, starting at top left;
	p.getHeightMesh = function( cols, rows, corners )
	{
		var baseStep_x = 1 / (cols-1);
		var baseStep_y = 1 / (rows-1);
		var points = [];
		
		var bb = this.bound_bottom;
		var bt = this.bound_top;
		var bl = this.bound_left;
		var br = this.bound_right;
		
		var p00 = bb.getPoint(0);
		var p11 = bt.getPoint(1);
		var p01 = bt.getPoint(0);
		var p10 = bb.getPoint(1);
		
		var p00x = p00.x;
		var p00y = p00.y;
		var p10x = p10.x;
		var p10y = p10.y;
		var p01x = p01.x;
		var p01y = p01.y;
		var p11x = p11.x;
		var p11y = p11.y;
		
		var ts = new qlib.LineSegment(corners[0],corners[1]);
		var ls = new qlib.LineSegment(corners[0],corners[3]);
		var rs = new qlib.LineSegment(corners[2],corners[1]);
		var bs = new qlib.LineSegment(corners[3],corners[2]);
		
		
		var u, iu, iv, pu0, pu1,pv0,pv1,qu0, qu1,qv0,qv1;
		var v = 0;
		
		for ( var y = 0; y < rows; y += 1 )
		{
			iv = 1 - v;
			pv0 = bl.getPoint(v);
			pv1 = br.getPoint(iv);
			qv0 = ls.getPoint(v);
			qv1 = rs.getPoint(iv);
			v += baseStep_y;
			u = 0;
			for ( var x = 0; x < cols; x +=1 )
			{
				iu = 1 - u;
				
				pu0 = bb.getPoint(u);
				pu1 = bt.getPoint(u);
				qu0 = bs.getPoint(u);
				qu1 = ts.getPoint(u);
				
				var du = (v * pu0.x + iv * pu1.x + iu * pv0.x + u * pv1.x - iu * v * p00x - u * v * p10x - iu * iv * p01x - u * iv * p11x) - 
						 (v * qu0.x + iv * qu1.x + iu * qv0.x + u * qv1.x - iu * v * p00x - u * v * p10x - iu * iv * p01x - u * iv * p11x);
				
				var dv = (v * pu0.y + iv * pu1.y + iu * pv0.y + u * pv1.y - iu * v * p00y - u * v * p10y - iu * iv * p01y - u * iv * p11y ) - 
						 (v * qu0.y + iv * qu1.y + iu * qv0.y + u * qv1.y - iu * v * p00y - u * v * p10y - iu * iv * p01y - u * iv * p11y );
						 
				points.push( du + dv );
			
				u += baseStep_x;
				
			}
		}
		return {cols:cols, rows:rows, heights:points };
	}
	
	
	p.getPoint = function( u, v )
	{
		var iu = 1 - u;
		var iv = 1 - v;
		
		var p00 = this.bound_bottom.getPoint(0);
		var p11 = this.bound_top.getPoint(1);
		var p01 = this.bound_top.getPoint(0);
		var p10 = this.bound_bottom.getPoint(1);
		
		var pu0 = this.bound_bottom.getPoint(u);
		var pu1 = this.bound_top.getPoint(u);
		var pv0 = this.bound_left.getPoint(iv);
		var pv1 = this.bound_right.getPoint(v);
		
		return new qlib.Vector2(  iv * pu0.x + v * pu1.x + iu * pv0.x + u * pv1.x - iu * iv * p00.x - u * iv * p10.x - iu * v * p01.x - u * v * p11.x,
					  iv * pu0.y + v * pu1.y + iu * pv0.y + u * pv1.y - iu * iv * p00.y - u * iv * p10.y - iu * v * p01.y - u * v * p11.y );

	}
	
	
	
	p.toString = function()
	{
		return "CoonsPatch";
	}
	
	
	
	qlib["CoonsPatch"] = CoonsPatch;
}());