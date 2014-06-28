/*
* Function Patch
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

	var FunctionPatch = function( function_top,function_right,function_bottom,function_left ) {
	  this.initialize( function_top,function_right,function_bottom,function_left );
	}

	var p = FunctionPatch.prototype;


	// public properties:
	p.type = "FunctionPatch";
		
	p.initialize = function(function_top,function_right,function_bottom,function_left)
	{
		this.function_top = function_top;
		this.function_right = function_right;
		this.function_bottom = function_bottom;
		this.function_left = function_left;
		if ( function_top(0) instanceof Array ) 
		{
			if (  function_top(0).length != function_right(0).length ||  function_bottom(0).length != function_left(0).length ||  function_top(0).length != function_left(0).length )
			{
				throw("FunctionPatch: provided boundary functions return arrays of different length!");
			}
			this.getMesh = this._getMeshAsArray;
		}
	}
	
	p.getMesh = function( cols, rows )
	{
		var baseStep_x = 1 / (cols-1);
		var baseStep_y = 1 / (rows-1);
		var points = [];
		
		var p00 = (this.function_top(0) + this.function_left(0)) * 0.5;
		var p11 = (this.function_bottom(1)  + this.function_right(1)) * 0.5;
		var p01 = (this.function_top(1) + this.function_right(0) ) * 0.5;
		var p10 = (this.function_bottom(0) + this.function_left(1) ) * 0.5;
		
		var u, iu, iv, pu0, pu1,pv0,pv1;
		var v = 0;
		
		for ( var y = 0; y < rows; y += 1 )
		{
			iv = 1 - v;
			pv0 = this.function_left(v);
			pv1 = this.function_right(v);
			v += baseStep_y;
			u = 0;
			for ( var x = 0; x < cols; x +=1 )
			{
				iu = 1 - u;
				pu0 = this.function_top(u);
				pu1 = this.function_bottom(u);
			
				points.push( iv * pu0 + v * pu1 + iu * pv0 + u * pv1 - iu * iv * p00 - iu * v * p10 - u * iv * p01 - u * v * p11 );
			
				u += baseStep_x;
			}
		}
		return { cols:cols, rows:rows, values:points};
	}
	
	p._getMeshAsArray = function( cols, rows )
	{
		var baseStep_x = 1 / (cols-1);
		var baseStep_y = 1 / (rows-1);
		var points = [];
		var ft = this.function_top;
		var fb = this.function_bottom;
		var fl = this.function_left;
		var fr = this.function_right;
		var ft0 = ft(0);
		var ft1 = ft(1);
		var fl0 = fl(0);
		var fl1 = fl(1);
		var fb0 = fb(0);
		var fb1 = fb(1);
		var fr0 = fr(0);
		var fr1 = fr(1);
		var l = ft0.length;
		
		var p00 = [(ft0[0] + fl0[0]) * 0.5,(ft0[1] + fl0[1]) * 0.5,(ft0[2] + fl0[2]) * 0.5];
		var p11 = [(fb1[0] + fr1[0]) * 0.5,(fb1[1] + fr1[1]) * 0.5,(fb1[2] + fr1[2]) * 0.5];
		var p01 = [(ft1[0] + fr0[0]) * 0.5,(ft1[1] + fr0[1]) * 0.5,(ft1[2] + fr0[2]) * 0.5];
		var p10 = [(fb0[0] + fl1[0]) * 0.5,(fb0[1] + fl1[1]) * 0.5,(fb0[2] + fl1[2]) * 0.5];
		
		var u, iu, iv, pu0, pu1,pv0,pv1;
		var v = 0;
		
		for ( var y = 0; y < rows; y += 1 )
		{
			iv = 1 - v;
			pv0 = fl(v);
			pv1 = fr(v);
			v += baseStep_y;
			u = 0;
			for ( var x = 0; x < cols; x +=1 )
			{
				iu = 1 - u;
				pu0 = ft(u);
				pu1 = fb(u);
				var p = [];
				for ( var i = 0; i < l; i++ )
				{
					p[i] = iv * pu0[i] + v * pu1[i] + iu * pv0[i] + u * pv1[i] - iu * iv * p00[i] - iu * v * p10[i] - u * iv * p01[i] - u * v * p11[i];
				}
				points.push(p);
				u += baseStep_x;
			}
		}
		return { cols:cols, rows:rows, values:points};
	}
	
	p.getPoint = function( u, v )
	{
		var iu = 1 - u;
		var iv = 1 - v;
		
		var p00 = (this.function_top(0) + this.function_left(0)) * 0.5;
		var p11 = (this.function_bottom(1)  + this.function_right(1)) * 0.5;
		var p01 = (this.function_top(1) + this.function_right(0) ) * 0.5;
		var p10 = (this.function_bottom(0) + this.function_left(1) ) * 0.5;
		
		var pu0 = this.function_top(u);
		var pu1 = this.function_bottom(u);
		var pv0 = this.function_left(v);
		var pv1 = this.function_right(v);
		
		return  iv * pu0 + v * pu1 + iu * pv0 + u * pv1 - iu * iv * p00 - u * iv * p10 - iu * v * p01 - u * v * p11;

	}
	
	
	
	p.toString = function()
	{
		return "FunctionPatch";
	}
	
	
	
	qlib["FunctionPatch"] = FunctionPatch;
}());