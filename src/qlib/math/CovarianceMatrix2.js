/*
* CovarianceMatrix2
*
* Directly ported from Jonathan Blow's example code to his article
* "My Friend, the Covariance Body" published in Game Developer Magazine
* http://www.number-none.com/product/My%20Friend,%20the%20Covariance%20Body/index.html
* http://www.gdmag.com/src/sep02.zip
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
	
	var CovarianceMatrix2 = function() {
	  this.reset();
	}
	
	var p = CovarianceMatrix2.prototype;
	
	p.reset = function()
	{
		this.a = this.b = this.c = 0;
	}
		
	p.invert = function() 
	{
		var det = this.a*this.c - this.b*this.b;
		var factor = 1.0 / det;
		
		var result = new qlib.CovarianceMatrix2();
		result.a = this.c * factor;
		result.b = -this.b * factor;
		result.c = this.a * factor;
		
		return result;
	}
		
	p.add = function( other ) 
	{
		var result = new qlib.CovarianceMatrix2();
		result.a = this.a + other.a;
		result.b = this.b + other.b;
		result.c = this.c + other.c;
		
		return result;
	}
			
	p.scale= function( factor )
	{
		this.a *= factor;
		this.b *= factor;
		this.c *= factor;
	}
	
	p.rotate = function( theta )
	{
		var s = Math.sin(theta);
		var t = Math.cos(theta);
		
		var a_prime = this.a*t*t + this.b*2*s*t + this.c*s*s;
		var b_prime = -this.a*s*t + this.b*(t*t - s*s) + this.c*s*t;
		var c_prime = this.a*s*s - this.b*2*s*t + this.c*t*t;
		
		this.a = a_prime;
		this.b = b_prime;
		this.c = c_prime;
	}
		
		
	p.solve_quadratic_where_discriminant_is_known_to_be_nonnegative = function( a, b, c ) 
	{
		var result = {num_solutions: 0, solutions: []};
		
		if (a == 0.0) {  // Then bx + c = 0; thus, x = -c / b
			if (b == 0.0) {
				return result;
			}
			
			result.solutions[0] = -c / b;
			result.num_solutions = 1;
			return result;
		}
		
		var discriminant = b * b - 4 * a * c;
		if (discriminant < 0.0) discriminant = 0.0;
		
		var sign_b = 1.0;
		if (b < 0.0) sign_b = -1.0;
		
		var nroots = 0;
		var q = -0.5 * (b + sign_b * Math.sqrt(discriminant));
		
		nroots++;
		result.solutions[0] = q / a;
		
		if (q != 0.0) {
			var solution = c / q;
			if (solution != result.solutions[0]) {
				nroots++;
				result.solutions[1] = solution;
			}
		}
		
		result.num_solutions = nroots;
		return result;
	}
	
	// The CovarianceMatrix2 eigenvector path is completely separate (I wrote
	// it first, and it was simpler to just crank out).  
	
	p.find_eigenvalues = function( eigenvalues ) 
	{
		var qa = 1;
		var qb = -(this.a + this.c);
		var qc = this.a * this.c - this.b * this.b;
		
		var solution = this.solve_quadratic_where_discriminant_is_known_to_be_nonnegative( qa, qb, qc );
		
		// If there's only one solution, explicitly state it as a
		// double eigenvalue.
		if (solution.num_solutions == 1) 
		{
			solution.solutions[1] = solution.solutions[0];
			solution.num_solutions = 2;
		}
		
		eigenvalues[0] = solution.solutions[0];
		eigenvalues[1] = solution.solutions[1];
		return solution.num_solutions;
	}
	
	p.find_eigenvectors= function( eigenvalues, eigenvectors) 
	{
		var num_eigenvalues = this.find_eigenvalues(eigenvalues);
		if (num_eigenvalues != 2)
		{
			throw("Did not get 2 Eigenvalues but "+num_eigenvalues );
		};
		
		// Now that we have the quadratic coefficients, find the eigenvectors.
		
		const VANISHING_EPSILON = 1.0e-5;
		const SAMENESS_LOW = 0.9999;
		const SAMENESS_HIGH = 1.0001;
		
		var punt = false;
		const A_EPSILON = 0.0000001;
		
		if (this.a < A_EPSILON) {
			punt = true;
		} else {
			var ratio = Math.abs(eigenvalues[1] / eigenvalues[0]);
			if ((ratio > SAMENESS_LOW) && (ratio < SAMENESS_HIGH)) punt = true;
		}
		
		if (punt) {
			eigenvalues[0] = this.a;
			eigenvalues[1] = this.a;
			
			eigenvectors[0] = new qlib.Vector2(1, 0);
			eigenvectors[1] = new qlib.Vector2(0, 1);
			num_eigenvalues = 2;
			return num_eigenvalues;
		}
		
		for (var j = 0; j < num_eigenvalues; j++) {
			var lambda = eigenvalues[j];
			
			var result1 = new qlib.Vector2(-this.b, this.a - lambda);
			var result2 = new qlib.Vector2(-(this.c - lambda), this.b);
			
			var result;
			if (result1.getSquaredLength() > result2.getSquaredLength()) {
				result = result1;
			} else {
				result = result2;
			}
			
			result.normalize();
			eigenvectors[j] = result;
		}
		
		return num_eigenvalues;
	}
	
	p.move_to_global_coordinates= function( dest, x, y)
	{
		dest.a = this.a + x*x;
		dest.b = this.b + x*y;
		dest.c = this.c + y*y;
	}
	
	p.move_to_local_coordinates= function( dest, x, y)
	{
		dest.a = this.a - x*x;
		dest.b = this.b - x*y;
		dest.c = this.c - y*y;
	}
				
	qlib.CovarianceMatrix2 = CovarianceMatrix2;
}());









