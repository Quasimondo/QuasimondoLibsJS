/*
* Polynomial
*
*	Based on http://www.kevlindev.com/gui/math/polynomial/Polynomial.js
*	by Kevin Lindev
*
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

	var Polynomial = function(coefficients) {
		this.initialize(coefficients);
	}
	
	var p = Polynomial.prototype; 
	
	p.TOLERANCE = 1e-6;
	p.ACCURACY = 6;
	
	
	p.interpolate = function ( xs, ys, n, offset, x ) 
	{
		var y  = 0;
		var dy = 0;
		var c = Array(n);
		var d = Array(n);
		var ns = 0;
		var result;
		
		var diff = Math.abs(x - xs[offset]);
		for ( var i = 0; i < n; i++ ) 
		{
			var dift = Math.abs(x - xs[offset+i]);
			
			if ( dift < diff ) 
			{
				ns = i;
				diff = dift;
			}
			c[i] = d[i] = ys[offset+i];
		}
		y = ys[offset+ns];
		ns--;
		
		for ( var m = 1; m < n; m++ ) 
		{
			for ( i = 0; i < n-m; i++ ) 
			{
				var ho = xs[offset+i] - x;
				var hp = xs[offset+i+m] - x;
				var w = c[i+1]-d[i];
				var den = ho - hp;
				
				if ( den == 0.0 ) 
				{
					result = { y: 0, dy: 0};
					break;
				}
				
				den = w / den;
				d[i] = hp*den;
				c[i] = ho*den;
			}
			dy = (2*(ns+1) < (n-m)) ? c[ns+1] : d[ns--];
			y += dy;
		}
		
		return { y: y, dy: dy };
	};

	
	p.initialize = function( coefficients )
	{
		this.coefs  = coefficients.concat().reverse();
		this.length = this.coefs.length;
		this.degree = this.length - 1;
	}
	
	
	p.getRoots = function()
	{
		var result;
		this.simplify();
		switch (this.degree) 
		{
			case 0:
				result = [];
				break;
			case 1:
				result = this.getLinearRoot();
				break;
			case 2:
				result = this.getQuadraticRoots();
				break;
			case 3:
				result = this.getCubicRoots();
				break;
			case 4:
				result = this.getQuarticRoots();
				break;
			default:
				result = [];
				break;
		}
		return result;
	};
	
	p.simplify = function()
	{
		for (var i = this.degree;i>=0;i-- ) 
		{
			if ( Math.abs( this.coefs[i]) <= this.TOLERANCE ) 
			{
				this.coefs.pop();
				this.length--;
				this.degree--;
			} else {
				break;
			}
		}
	};
	
	p.getRootsInInterval = function (min, max ) 
	{
		var roots = [];
		var root;
		if (this.degree == 1) 
		{
			root = this.bisection( min, max);
			if (!isNaN(root)) roots.push(root);
		} else {
			var deriv = this.getDerivative();
			var droots = deriv.getRootsInInterval(min, max);
			if ( droots.length > 0 ) 
			{
				root = this.bisection( min, droots[0] );
				if ( !isNaN(root)) roots.push(root);
				for (var i = 0; i <= droots.length -2 ; i++) 
				{
					root = this.bisection(droots[i], droots[i+1]);
					if (!isNaN(root)) roots.push(root);
				}
				root = this.bisection(droots[droots.length-1], max);
				if (!isNaN(root)) roots.push(root);
			} else {
				root = this.bisection(min, max);
				if (!isNaN(root)) roots.push(root);
			}
		}
		return roots;
	};
	
	p.bisection = function( min, max )
	{
		var minValue = this.evaluate(min);
		var maxValue = this.evaluate(max);
		var result = NaN;
		
		if (Math.abs(minValue) <= this.TOLERANCE ) 
		{
			result = min;
		} else if (Math.abs(maxValue) <= this.TOLERANCE) 
		{
			result = max;
		} else if ( minValue*maxValue <= 0 ) 
		{
			
			var tmp1 = Math.log(max-min);
			var tmp2 = Math.LN10 * this.ACCURACY;
			var iters = Math.ceil((tmp1+tmp2) / Math.LN2 );
			for ( var i = 0; i < iters; i++) 
			{
				result = 0.5 * ( min + max );
				var value = this.evaluate(result);
				if (Math.abs(value)<=this.TOLERANCE) 
				{
					break;
				}
				if ( value * minValue < 0 ) 
				{
					max = result;
					maxValue = value;
				} else {
					min = result;
					minValue = value;
				}
			}
		}
		return result;
	};
	
	
	p.evaluate = function( x ) 
	{
		if ( isNaN( x) ) throw( new Error("Polynomial.evaluate: parameter must be a number" ) );
		var result = 0;
		for (var i =  this.length; --i >- 1;) 
		{
			result = result * x + this.coefs[i];
		}
		return result;
	};
	
	p.getDerivative = function()
	{
		var derivative = new qlib.Polynomial([]);
		for (var i = 1; i < this.length; i++) 
		{
			derivative.coefs.push(i*this.coefs[i]);
		}
		derivative.length = this.length - 1;
		derivative.degree = this.length - 2;
		return derivative;
	};
	
	p.getLinearRoot = function()
	{
		var result = [];
		var a = this.coefs[1];
		if (a != 0) 
		{
			result.push(-this.coefs[0] / a);
		}
		return result;
	};
	
	p.getQuadraticRoots = function()
	{
		var results = [];
		if ( this.degree == 2 ) 
		{
			var a = this.coefs[2];
			var b = this.coefs[1]/a;
			var c = this.coefs[0]/a;
			var d = b*b-4*c;
			if (d>0) 
			{
				var e = Math.sqrt(d);
				results.push(0.5*(-b+e));
				results.push(0.5*(-b-e));
			} else if (d == 0) {
				results.push(0.5*-b);
			}
		}
		return results;
	};
	
	/*****
	 *
	 *   getCubicRoots
	 *
	 *   This code is based on MgcPolynomial.cpp written by David Eberly.  His
	 *   code along with many other excellent examples are avaiable at his site:
	 *   http://www.magic-software.com
	 *
	 *****/
	p.getCubicRoots = function()
	{
		var tmp;
		
		var results = [];
		if (this.degree == 3) 
		{
			var c3 = this.coefs[3];
			var c2 = this.coefs[2]/c3;
			var c1 = this.coefs[1]/c3;
			var c0 = this.coefs[0]/c3;
			var a = (3*c1-c2*c2)/3;
			var b = (2*c2*c2*c2-9*c1*c2+27*c0)/27;
			var offset = c2/3;
			var discrim = b*b/4+a*a*a/27;
			var halfB = b/2;
			if (Math.abs(discrim)<=this.TOLERANCE) 
			{
				discrim = 0;
			}
			if (discrim>0) 
			{
				var e = Math.sqrt(discrim);
				var root;
				tmp = -halfB+e;
				if (tmp>=0) {
					root = Math.pow(tmp, 1/3);
				} else 
				{
					root = -Math.pow(-tmp, 1/3);
				}
				tmp = -halfB-e;
				if (tmp>=0) 
				{
					root += Math.pow(tmp, 1/3);
				} else 
				{
					root -= Math.pow(-tmp, 1/3);
				}
				results.push(root-offset);
			} else if (discrim<0) 
			{
				var distance = Math.sqrt(-a/3);
				var angle = Math.atan2(Math.sqrt(-discrim), -halfB)/3;
				var cos = Math.cos(angle);
				var sin = Math.sin(angle);
				var sqrt3 = Math.sqrt(3);
				results.push(2*distance*cos-offset);
				results.push(-distance*(cos+sqrt3*sin)-offset);
				results.push(-distance*(cos-sqrt3*sin)-offset);
			} else {
				if (halfB>=0) 
				{
					tmp = -Math.pow(halfB, 1/3);
				} else {
					tmp = Math.pow(-halfB, 1/3);
				}
				results.push(2*tmp-offset);
				results.push(-tmp-offset);
			}
		}
		return results;
	};
	
	/*****
	 *
	 *   getQuarticRoots
	 *
	 *   This code is based on MgcPolynomial.cpp written by David Eberly.  His
	 *   code along with many other excellent examples are avaiable at his site:
	 *   http://www.magic-software.com
	 *
	 *****/

	p.getQuarticRoots = function()
	{
		var d, t1, t2, f;
		var results = [];
		if (this.degree == 4) 
		{
			
			var c4 = this.coefs[4];
			var c3 = this.coefs[3]/c4;
			var c2 = this.coefs[2]/c4;
			var c1 = this.coefs[1]/c4;
			var c0 = this.coefs[0]/c4;
			
			
			
			var resolveRoots = new qlib.Polynomial( [ 1, -c2, c3*c1-4*c0, -c3*c3*c0+4*c2*c0-c1*c1]).getCubicRoots();
			var y = resolveRoots[0];
			var discrim = c3*c3/4-c2+y;
			if (Math.abs(discrim)<=this.TOLERANCE) {
				discrim = 0;
			}
			if (discrim>0) 
			{
				var e = Math.sqrt(discrim);
				t1 = 0.75*c3*c3-e*e-2*c2;
				t2 = (4*c3*c2-8*c1-c3*c3*c3)/(4*e);
				var plus = t1+t2;
				var minus = t1-t2;
				if (Math.abs(plus)<=this.TOLERANCE) 
				{
					plus = 0;
				}
				if (Math.abs(minus)<=this.TOLERANCE) 
				{
					minus = 0;
				}
				if (plus>=0) {
					f = Math.sqrt(plus);
					results.push(-0.25 * c3+0.5*(e+f));
					results.push(-0.25 * c3+0.5*(e-f));
				}
				if (minus>=0) {
					f = Math.sqrt(minus);
					results.push(-0.25 *c3+0.5*(f-e));
					results.push(-0.25 *c3-0.5*(f+e));
				}
			} else if (discrim<0) 
			{
				//????
				trace("ERROR IN getQuarticRoots - discrim: "+discrim)
			} else {
				t2 = y*y-4*c0;
				if (t2>=-this.TOLERANCE) {
					if (t2<0) {
						t2 = 0;
					}
					t2 = 2*Math.sqrt(t2);
					t1 = 3*c3*c3/4-2*c2;
					if (t1+t2>=this.TOLERANCE) 
					{
						d = Math.sqrt(t1+t2);
						results.push(-c3/4+d/2);
						results.push(-c3/4-d/2);
					}
					if (t1-t2>=this.TOLERANCE) 
					{
						d = Math.sqrt(t1-t2);
						results.push(-c3/4+d/2);
						results.push(-c3/4-d/2);
					}
				}
			}
		}
		return results;
	};
	
	p.mult = function( that )
	{
		var result = new qlib.Polynomial( [] );
		var i, j;
		for ( i = 0; i<= this.degree + that.degree; i++) 
		{
			result.coefs.push(0);
		}
		for ( i = 0; i <= this.degree; i++) 
		{
			for ( j = 0; j<=that.degree; j++) 
			{
				result.coefs[i+j] += this.coefs[i] * that.coefs[j];
			}
		}
		return result;
	};
	
	p.divide_scalar = function ( scalar )
	{
		for (var i = 0; i< this.length; i++) 
		{
			this.coefs[i] /= scalar;
		}
	};
		
qlib.Polynomial = Polynomial;
}());