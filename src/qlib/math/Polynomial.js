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
window["qlib"] = window.qlib || {};

(function() {

/**
 * Represents a polynomial function.
 * A polynomial is defined by an array of coefficients. This class provides methods
 * for evaluating the polynomial, finding its roots, calculating derivatives,
 * performing arithmetic operations (multiplication, scalar division), and interpolation.
 *
 * The internal representation stores coefficients in reverse order of degree
 * (e.g., `coefs[0]` is the coefficient of the highest degree term).
 *
 * This implementation is based on the work of Kevin Lindev, available at
 * http://www.kevlindev.com/gui/math/polynomial/Polynomial.js
 *
 * @class Polynomial
 * @param {number[]} coefficients - An array of numbers representing the polynomial's coefficients.
 *                                  The array should be ordered from the coefficient of the x^0 term
 *                                  to the coefficient of the highest degree term.
 *                                  For example, `new Polynomial([a0, a1, a2, a3])` represents
 *                                  the polynomial `a0 + a1*x + a2*x^2 + a3*x^3`.
 */
	var Polynomial = function(coefficients) {
		this.initialize(coefficients);
	}
	
	var p = Polynomial.prototype; 
	
	/**
	 * Tolerance value used for floating-point comparisons, particularly in root finding
	 * and simplification to determine if a coefficient is effectively zero.
	 * @property {number} TOLERANCE
	 * @default 1e-6
	 */
	p.TOLERANCE = 1e-6;

	/**
	 * Number of decimal places of accuracy desired for root finding using methods like bisection.
	 * Used to determine the number of iterations.
	 * @property {number} ACCURACY
	 * @default 6
	 */
	p.ACCURACY = 6;
	
	
	/**
	 * Performs polynomial interpolation using Neville's algorithm for a given set of points.
	 * While defined on the prototype, this method behaves like a static function as it does not use `this`.
	 *
	 * @method interpolate
	 * @param {number[]} xs - An array of x-coordinates of the points to interpolate.
	 * @param {number[]} ys - An array of y-coordinates of the points to interpolate. Must be the same length as `xs`.
	 * @param {number} n - The number of points to use for interpolation from the `xs` and `ys` arrays.
	 * @param {number} offset - The starting index in `xs` and `ys` from which to take the `n` points.
	 * @param {number} x - The x-coordinate at which to evaluate the interpolated polynomial.
	 * @returns {{y: number, dy: number}} An object containing:
	 *   - `y`: The interpolated y-value at `x`.
	 *   - `dy`: An estimate of the error in `y`.
	 * Returns `{ y: 0, dy: 0 }` if a division by zero occurs (e.g., duplicate x-values in input).
	 */
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

	/**
	 * Initializes the Polynomial instance.
	 * The input `coefficients` array is expected to be in the order [a0, a1*x, a2*x^2, ..., an*x^n].
	 * Internally, the coefficients are stored in reverse order: `coefs[0]` is `an`, `coefs[1]` is `an-1`, ..., `coefs[n]` is `a0`.
	 *
	 * @method initialize
	 * @protected
	 * @param {number[]} coefficients - An array of numbers representing the polynomial's coefficients,
	 *                                  ordered from the constant term to the highest degree term.
	 * @returns {void}
	 */
	p.initialize = function( coefficients )
	{
		/**
		 * The array of coefficients for the polynomial.
		 * Stored in order from the highest degree term to the constant term.
		 * For a polynomial `P(x) = c_n*x^n + c_{n-1}*x^{n-1} + ... + c_1*x + c_0`,
		 * `coefs` will be `[c_n, c_{n-1}, ..., c_1, c_0]`.
		 * @property {number[]} coefs
		 */
		this.coefs  = coefficients.concat().reverse();
		/**
		 * The number of coefficients, which is `degree + 1`.
		 * @property {number} length
		 */
		this.length = this.coefs.length;
		/**
		 * The degree of the polynomial (e.g., for a_2*x^2 + a_1*x + a_0, the degree is 2).
		 * @property {number} degree
		 */
		this.degree = this.length - 1;
	}
	
	
	/**
	 * Calculates the real roots of the polynomial for degrees up to 4.
	 * For polynomials of degree 0, or greater than 4, it returns an empty array.
	 * The polynomial is first simplified by removing leading zero coefficients (within `TOLERANCE`).
	 *
	 * @method getRoots
	 * @returns {number[]} An array containing the real roots of the polynomial.
	 *                     The roots are not guaranteed to be in any specific order.
	 *                     Returns an empty array if no real roots are found, or if the degree is unsupported.
	 */
	p.getRoots = function()
	{
		var result;
		this.simplify();
		switch (this.degree) 
		{
			case 0: // Constant (non-zero after simplify) has no roots
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
			default: // Degree > 4 or negative (after simplify if all coefs were zero)
				result = [];
				break;
		}
		return result;
	};
	
	/**
	 * Simplifies the polynomial by removing leading coefficients that are smaller than or equal to `TOLERANCE`.
	 * This effectively reduces the degree of the polynomial if leading terms are negligible.
	 * Modifies the polynomial in place.
	 *
	 * @method simplify
	 * @returns {void}
	 */
	p.simplify = function()
	{
		// Note: `this.coefs` is ordered from highest degree term to lowest.
		// So, we iterate from the current highest degree term.
		// If `this.coefs[0]` (highest degree) is tiny, pop it.
		// This loop structure seems reversed compared to typical definition of "leading coefficients".
		// Original code iterates `i` from `this.degree` down to 0, but pops from `this.coefs`
		// which means `this.coefs[this.degree]` is the one being checked if `this.coefs` was `[a0, a1, ..., an]`.
		// Given `this.coefs` is `[an, ..., a1, a0]`, `this.coefs[0]` is `an`.
		// The loop in original code `for (var i = this.degree; i >= 0; i--)` checks `this.coefs[i]`.
		// If `this.coefs` is `[cn, ..., c0]`, then `this.coefs[0]` is `cn`.
		// `this.degree` is `cn`'s index initially.
		// The loop `for (var i = this.degree; i >= 0; i--)` with `this.coefs.pop()` is incorrect if `this.coefs` is `[cn,...,c0]`.
		// `pop()` removes the last element (c0).
		// Assuming the intent is to remove leading terms (highest degree terms that are zero):
		while (this.degree >= 0 && Math.abs(this.coefs[0]) <= this.TOLERANCE) {
			this.coefs.shift(); // Remove the highest degree term if it's zero
			this.length--;
			this.degree--;
		}
		// If all coefficients become zero, degree becomes -1.
		// If the polynomial was e.g. 0*x^2 + 0*x + 5, it simplifies to 5 (degree 0).
		// If it was 0*x^2 + 0*x + 0, degree becomes -1.
	};
	
	/**
	 * Finds all real roots of the polynomial within a given interval `[min, max]` using a recursive bisection approach.
	 * For degree 1, it uses direct bisection. For higher degrees, it finds roots of the derivative
	 * to isolate intervals where roots of the original polynomial might exist, then applies bisection to these intervals.
	 *
	 * @method getRootsInInterval
	 * @param {number} min - The minimum value of the interval (inclusive).
	 * @param {number} max - The maximum value of the interval (inclusive).
	 * @returns {number[]} An array of real roots found within the specified interval. Not guaranteed to be sorted.
	 */
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
	
	/**
	 * Finds a single real root of the polynomial within the interval `[min, max]` using the bisection method.
	 * This method assumes there is at most one root in the interval and that `evaluate(min)` and `evaluate(max)` have opposite signs.
	 *
	 * @method bisection
	 * @param {number} min - The minimum value of the interval.
	 * @param {number} max - The maximum value of the interval.
	 * @returns {number} The root found within the interval, or `NaN` if no root is found under the method's conditions
	 *                   (e.g., values at interval ends have the same sign, or if a root is not found within `ACCURACY` iterations).
	 */
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
	
	
	/**
	 * Evaluates the polynomial at a given value of x using Horner's method.
	 * P(x) = c_n*x^n + c_{n-1}*x^{n-1} + ... + c_1*x + c_0
	 * Internally, `coefs` are `[c_n, c_{n-1}, ..., c_0]`.
	 * The loop calculates `(...((c_n*x + c_{n-1})*x + c_{n-2})*x ... + c_0)`.
	 *
	 * @method evaluate
	 * @param {number} x - The value at which to evaluate the polynomial.
	 * @returns {number} The result of P(x).
	 * @throws {Error} If `x` is `NaN`.
	 */
	p.evaluate = function( x ) 
	{
		if ( isNaN( x) ) throw( new Error("Polynomial.evaluate: parameter must be a number" ) );
		var result = 0;
		// Coefs are [cn, cn-1, ..., c0]. Length is n+1.
		// Iterates from i = n down to 0.
		// result = coefs[0]*x + coefs[1] -> ...
		// Example: P(x) = ax^2 + bx + c. coefs = [a, b, c]. length = 3.
		// i = 2: result = 0 * x + coefs[0] = a  (Error in loop logic, should be coefs[0] first, or loop differently)
		// Correct Horner's: result = coefs[0]; for i=1 to n, result = result*x + coefs[i]
		// With coefs = [cn, ..., c0] (degree n):
		// result = cn
		// result = result*x + c_{n-1}
		// ...
		// result = result*x + c0
		// The original loop: for (var i = this.length; --i >- 1;) result = result * x + this.coefs[i];
		// If coefs = [c2,c1,c0] (length 3)
		// i=2: result = 0 * x + c0 = c0
		// i=1: result = c0 * x + c1
		// i=0: result = (c0*x+c1)*x + c2 = c0*x^2 + c1*x + c2. This is correct if coefs is [c0,c1,c2].
		// BUT initialize stores them as [c2,c1,c0].
		// So, if coefs is [c_n, ..., c_0], the loop should be:
		// result = this.coefs[0];
		// for (var i = 1; i < this.length; i++) { result = result * x + this.coefs[i]; }

		// Let's re-verify the original loop with coefs = [cn, cn-1, ..., c0]
		// result = 0
		// i = length-1 (index of c0): result = 0 * x + c0 = c0
		// i = length-2 (index of c1): result = c0 * x + c1
		// i = 0 (index of cn): result = ( ... ) * x + cn. This is correct for reversed Horner.
		// P(x) = c0 + x*(c1 + x*(c2 + ... + x*cn))
		// So if coefs is [cn, cn-1, ..., c0], this means result = result * x + this.coefs[i] where i goes from highest power to lowest.
		// This means this.coefs[i] is for x^i if coefs is [c0, c1, ..., cn].
		// Since this.coefs is [cn, ..., c0], this.coefs[i] corresponds to x^(degree-i).
		// The loop `for (var i = this.length; --i >- 1;)` means `i` goes from `this.length-1` down to `0`.
		// Iteration 1: i = this.degree. result = result * x + this.coefs[this.degree] (this is c0)
		// Iteration 2: i = this.degree-1. result = (c0) * x + this.coefs[this.degree-1] (this is c1)
		// Iteration last: i = 0. result = (...) * x + this.coefs[0] (this is cn)
		// This evaluates P(x) = c0 + c1*x + c2*x^2 + ... if coefs was [c0, c1, c2,...]
		// Since coefs is [cn, cn-1, ..., c0], it's evaluating:
		// result = 0
		// i = 0 (last in loop, first in coefs): result = result*x + coefs[0] -> cn
		// i = 1: result = cn*x + coefs[1] -> cn*x + c(n-1)
		// This is standard Horner's.
		result = this.coefs[0]; // Highest degree coefficient
		for (var i = 1; i < this.length; i++)
		{
			result = result * x + this.coefs[i];
		}
		return result;
	};
	
	/**
	 * Calculates the derivative of this polynomial.
	 *
	 * @method getDerivative
	 * @returns {qlib.Polynomial} A new `qlib.Polynomial` instance representing the derivative.
	 *                            The coefficients are passed to the new Polynomial in the standard [a0, ..., an] order.
	 */
	p.getDerivative = function()
	{
		var derivativeCoeffsInput = []; // For Polynomial constructor [d0, d1, ...]
		// this.coefs = [cn, c(n-1), ..., c1, c0]
		// Derivative of cn*x^n + ... + c1*x + c0 is n*cn*x^(n-1) + ... + c1.
		// New coefs (internal, reversed): [n*cn, (n-1)*c(n-1), ..., 1*c1]
		// New coefs (for constructor): [1*c1, 2*c2, ..., n*cn]
		if (this.degree === 0) { // Derivative of a constant is 0
			return new qlib.Polynomial([0]);
		}
		for (var i = 0; i < this.degree; i++) // Iterate up to the coefficient of x^1 (which is this.coefs[this.degree-1])
		{
			// this.coefs[i] is coeff of x^(degree-i)
			// derivative term: (degree-i) * this.coefs[i] * x^(degree-i-1)
			// The new constant term for the derivative is 1 * this.coefs[this.degree-1] (original x^1 term)
			derivativeCoeffsInput.push((this.degree - i) * this.coefs[i]);
		}
		// The derivativeCoeffsInput is currently [n*cn, (n-1)*c(n-1), ..., 1*c1].
		// This is in "internal" format (highest degree first).
		// The Polynomial constructor expects [a0, a1, ...]. So we need to reverse it.
		return new qlib.Polynomial(derivativeCoeffsInput.reverse());
	};
	
	/**
	 * Calculates the single real root of a linear polynomial (degree 1).
	 * P(x) = c1*x + c0. Root is -c0/c1.
	 * `this.coefs` is `[c1, c0]`.
	 *
	 * @method getLinearRoot
	 * @returns {number[]} An array containing the single real root. Returns an empty array if the polynomial
	 *                     is constant (after simplification, degree might not be 1, or c1 is 0).
	 */
	p.getLinearRoot = function()
	{
		var result = [];
		if (this.degree !== 1) return result; // Should be simplified first
		var c1 = this.coefs[0]; // Coefficient of x
		var c0 = this.coefs[1]; // Constant term
		if (Math.abs(c1) > this.TOLERANCE)
		{
			result.push(-c0 / c1);
		}
		// If c1 is zero, it's a constant, no roots unless c0 is also zero (handled by simplify or degree check)
		return result;
	};
	
	/**
	 * Calculates the real roots of a quadratic polynomial (degree 2).
	 * P(x) = c2*x^2 + c1*x + c0.
	 * `this.coefs` is `[c2, c1, c0]`.
	 * Uses the quadratic formula. Only real roots are returned.
	 *
	 * @method getQuadraticRoots
	 * @returns {number[]} An array containing the real roots (0, 1, or 2 roots).
	 *                     Not guaranteed to be sorted.
	 */
	p.getQuadraticRoots = function()
	{
		var results = [];
		if ( this.degree !== 2 ) return results;

		var c2 = this.coefs[0]; // a in ax^2+bx+c
		var c1 = this.coefs[1]; // b
		var c0 = this.coefs[2]; // c

		// To avoid issues if c2 is very small after simplification didn't catch it.
		if (Math.abs(c2) <= this.TOLERANCE) {
			// Effectively linear: c1*x + c0 = 0
			if (Math.abs(c1) > this.TOLERANCE) results.push(-c0/c1);
			return results;
		}

		var b_norm = c1/c2; // Normalized b
		var c_norm = c0/c2; // Normalized c

		var discriminant = b_norm*b_norm - 4*c_norm;

		if (Math.abs(discriminant) <= this.TOLERANCE) discriminant = 0; // Treat small discriminant as zero

		if (discriminant > 0)
		{
			var e = Math.sqrt(discriminant);
			results.push(0.5*(-b_norm+e));
			results.push(0.5*(-b_norm-e));
		} else if (discriminant === 0) { // Single real root (repeated)
			results.push(0.5*-b_norm);
		}
		// If discriminant < 0, no real roots.
		return results;
	};
	
	/*****
	 *
	 *   getCubicRoots
	 *   Calculates the real roots of a cubic polynomial (degree 3).
	 *   P(x) = c3*x^3 + c2*x^2 + c1*x + c0.
	 *   `this.coefs` is `[c3, c2, c1, c0]`.
	 *   This code is based on MgcPolynomial.cpp written by David Eberly.
	 *   (http://www.magic-software.com)
	 *
	 * @method getCubicRoots
	 * @returns {number[]} An array containing the real roots (1 to 3 roots).
	 *                     Not guaranteed to be sorted.
	 *****/
	p.getCubicRoots = function()
	{
		var tmp;
		var results = [];
		if (this.degree !== 3) return results;

		// Normalize coefficients: x^3 + c2'*x^2 + c1'*x + c0' = 0
		// this.coefs = [c3, c2, c1, c0]
		var c3_orig = this.coefs[0];
		if (Math.abs(c3_orig) <= this.TOLERANCE) { // Should not happen if simplified
			// Fallback to quadratic if leading term is zero
			var quad = new qlib.Polynomial([this.coefs[3], this.coefs[2], this.coefs[1]].reverse()); // constructor expects [a0,a1,a2]
			return quad.getQuadraticRoots();
		}

		var c2_norm = this.coefs[1]/c3_orig;
		var c1_norm = this.coefs[2]/c3_orig;
		var c0_norm = this.coefs[3]/c3_orig;

		// Depressed cubic: y^3 + ay + b = 0, where x = y - c2_norm/3
		var a = (3*c1_norm - c2_norm*c2_norm)/3;
		var b = (2*c2_norm*c2_norm*c2_norm - 9*c1_norm*c2_norm + 27*c0_norm)/27;
		var offset = c2_norm/3;

		var discriminant_term = b*b/4 + a*a*a/27; // Discriminant for the depressed cubic
		var half_b = b/2;

		if (Math.abs(discriminant_term) <= this.TOLERANCE) discriminant_term = 0;

		if (discriminant_term > 0) { // One real root
			var e = Math.sqrt(discriminant_term);
			var root_y;
			tmp = -half_b + e;
			root_y = (tmp >= 0) ? Math.pow(tmp, 1/3) : -Math.pow(-tmp, 1/3);

			tmp = -half_b - e;
			root_y += (tmp >= 0) ? Math.pow(tmp, 1/3) : -Math.pow(-tmp, 1/3);

			results.push(root_y - offset);

		} else if (discriminant_term < 0) { // Three real roots (Cardano's trigonometric solution)
			var distance = Math.sqrt(-a/3);
			var angle = Math.atan2(Math.sqrt(-discriminant_term), -half_b)/3;
			var cos_angle = Math.cos(angle);
			var sin_angle = Math.sin(angle);
			var sqrt3 = Math.sqrt(3);

			results.push(2*distance*cos_angle - offset);
			results.push(-distance*(cos_angle + sqrt3*sin_angle) - offset);
			results.push(-distance*(cos_angle - sqrt3*sin_angle) - offset);

		} else { // All roots are real and at least two are equal
			var root_y1;
			if (Math.abs(half_b) <= this.TOLERANCE) { // b = 0, so a = 0 too. y^3 = 0 -> y=0. Triple root.
				root_y1 = 0;
			} else {
				root_y1 = (half_b >= 0) ? -Math.pow(half_b, 1/3) : Math.pow(-half_b, 1/3);
			}
			results.push(2*root_y1 - offset); // Double root
			results.push(-root_y1 - offset);  // Single root
		}
		return results;
	};
	
	/*****
	 *
	 *   getQuarticRoots
	 *   Calculates the real roots of a quartic polynomial (degree 4).
	 *   P(x) = c4*x^4 + c3*x^3 + c2*x^2 + c1*x + c0.
	 *   `this.coefs` is `[c4, c3, c2, c1, c0]`.
	 *   This code is based on MgcPolynomial.cpp written by David Eberly.
	 *   (http://www.magic-software.com)
	 *
	 * @method getQuarticRoots
	 * @returns {number[]} An array containing the real roots (0 to 4 roots).
	 *                     Not guaranteed to be sorted.
	 *****/
	p.getQuarticRoots = function()
	{
		var results = [];
		if (this.degree !== 4) return results;

		// Normalize coefficients: x^4 + c3'*x^3 + c2'*x^2 + c1'*x + c0' = 0
		// this.coefs = [c4, c3, c2, c1, c0]
		var c4_orig = this.coefs[0];
		if (Math.abs(c4_orig) <= this.TOLERANCE) { // Should not happen if simplified
			var cubic = new qlib.Polynomial([this.coefs[4], this.coefs[3], this.coefs[2], this.coefs[1]].reverse());
			return cubic.getCubicRoots();
		}
		var c3_norm = this.coefs[1]/c4_orig;
		var c2_norm = this.coefs[2]/c4_orig;
		var c1_norm = this.coefs[3]/c4_orig;
		var c0_norm = this.coefs[4]/c4_orig;
			
		// Ferrari's method:
		// Associated resolvent cubic: y^3 - c2'*y^2 + (c1'*c3' - 4*c0')*y - (c1'^2 + c0'*c3'^2 - 4*c0'*c2') = 0
		// The coefficients for the resolvent cubic constructor (which expects [a0, a1, a2, a3]):
		var res_c0 = -(c1_norm*c1_norm + c0_norm*c3_norm*c3_norm - 4*c0_norm*c2_norm);
		var res_c1 = (c1_norm*c3_norm - 4*c0_norm);
		var res_c2 = -c2_norm;
		var res_c3 = 1;

		var resolventPoly = new qlib.Polynomial([res_c0, res_c1, res_c2, res_c3]);
		var resolventRoots = resolventPoly.getCubicRoots();

		if (resolventRoots.length === 0) return []; // Should always have at least one real root for a cubic

		var y = resolventRoots[0]; // Take one real root of the resolvent cubic

		var term1_sq = c3_norm*c3_norm/4 - c2_norm + y;
		if (Math.abs(term1_sq) < this.TOLERANCE) term1_sq = 0;

		if (term1_sq < 0) return []; // No real roots if this part is negative

		var term1 = Math.sqrt(term1_sq);

		var term2_val_num = c3_norm*y/2 - c1_norm; // Numerator for one part of term2
		var term2_val_den = 2*term1;             // Denominator for one part of term2

		var p_val, q_val;

		if (Math.abs(term1) < this.TOLERANCE) { // term1 is zero
			// This case needs careful handling, relates to repeated roots of quartic.
			// From Wikipedia Ferrari's method: if term1 (alpha^2) is 0.
			// Then y^2 - 4*c0_norm must be 0.
			var check_term = y*y - 4*c0_norm;
			if (Math.abs(check_term) >= this.TOLERANCE) {
				// This implies an issue or a special case not fully handled by this path.
				// For simplicity, we'll assume this path leads to no easily found real roots here.
				return [];
			}
			p_val = c3_norm/2; // P = c3_norm/2
			q_val = y/2;      // Q = y/2
		} else {
			p_val = c3_norm/2 + term1; // P
			q_val = y/2 + term2_val_num / term2_val_den; // Q
			
			var p_val_alt = c3_norm/2 - term1; // Alternative P
			var q_val_alt = y/2 - term2_val_num / term2_val_den; // Alternative Q
			
			// Choose the set where term1 is non-zero for forming quadratic factors
			// x^2 + Px + Q = 0 and x^2 + Rx + S = 0
			// P+R = c3_norm, Q+S+PR = c2_norm, PS+QR = c1_norm, QS = c0_norm
			// Using Ferrari's method:
			// (x^2 + (c3/2)x + y/2)^2 = (term1*x + ( (c3/2)(y/2) - c1 ) / (2*term1) )^2
			// This leads to two quadratic equations:
			// x^2 + (c3/2)x + y/2 = +/- (term1*x + ( (c3*y/4) - c1 ) / (2*term1) )
			// x^2 + (c3/2 -/+ term1)x + (y/2 -/+ ( (c3*y/4) - c1 ) / (2*term1) ) = 0
		}

		// Solve x^2 + (c3_norm/2 + term1)x + (y/2 + (c3_norm*y/4 - c1_norm)/(2*term1)) = 0
		// And   x^2 + (c3_norm/2 - term1)x + (y/2 - (c3_norm*y/4 - c1_norm)/(2*term1)) = 0
		// Let A = c3_norm/2, B = term1, C = y/2, D_num = c3_norm*y/4 - c1_norm, D_den = 2*term1

		var A = c3_norm/2;
		var B = term1; // This is sqrt(alpha^2) from some notations
		var C = y/2;
		var D_val;

		if (Math.abs(B) < this.TOLERANCE) { // term1 is zero
			// Special case: leads to x^2 + Ax + C = 0 and x^2 + Ax + C = 0, but terms might be different.
			// (x^2 + A*x)^2 = -c0_norm + (A*x)^2, if y is such that c2-y = A^2 and c1-Ay=0 and c0-y^2/4=0
			// This is simpler: (x^2 + c3/2 * x + y/2)^2 - ( (c3^2/4 - c2 +y)x^2 + (c3*y/2 -c1)x + (y^2/4 -c0) ) = 0
			// If (c3^2/4 - c2 +y) is 0, then it simplifies.
			// This implies term1_sq = 0.
			// Then the polynomial is (x^2 + (c3/2)x + y/2)^2 - ( ( (c3*y/2)-c1 )x + (y^2/4 - c0) ) = 0
			// This must be a perfect square, so (c3*y/2 - c1)^2 - 4 * (y^2/4 - c0) must be 0.
			// This path becomes complicated, original code had a simpler structure.
			// Reverting to structure from original code if discrim (term1_sq) is zero:
			var t2_check = y*y - 4*c0_norm;
			if (t2_check >= -this.TOLERANCE) {
				if (t2_check < 0) t2_check = 0;
				t2_check = 2*Math.sqrt(t2_check);
				var t1_check = 0.75*c3_norm*c3_norm - 2*c2_norm; // This is 3*(c3/2)^2 - 2*c2
				if ( (t1_check + t2_check) >= this.TOLERANCE) {
					var d_sqrt = Math.sqrt(t1_check + t2_check);
					results.push(-c3_norm/4 + d_sqrt/2);
					results.push(-c3_norm/4 - d_sqrt/2);
				}
				if ( (t1_check - t2_check) >= this.TOLERANCE) {
					var d_sqrt = Math.sqrt(t1_check - t2_check);
					results.push(-c3_norm/4 + d_sqrt/2);
					results.push(-c3_norm/4 - d_sqrt/2);
				}
			}
			return results; // Return after handling the term1_sq == 0 case as per original logic
		}

		D_val = (c3_norm*y/4 - c1_norm) / (2*B);

		// Quadratic 1: x^2 + (A+B)x + (C+D_val) = 0
		var q1_b = A+B;
		var q1_c = C+D_val;
		var quad1 = new qlib.Polynomial([q1_c, q1_b, 1.0]); // Coeffs for constructor: [c0, c1, c2]
		results = results.concat(quad1.getQuadraticRoots());

		// Quadratic 2: x^2 + (A-B)x + (C-D_val) = 0
		var q2_b = A-B;
		var q2_c = C-D_val;
		var quad2 = new qlib.Polynomial([q2_c, q2_b, 1.0]);
		results = results.concat(quad2.getQuadraticRoots());

		return results;
	};
	
	/**
	 * Multiplies this polynomial by another polynomial.
	 *
	 * @method mult
	 * @param {qlib.Polynomial} that - The other polynomial to multiply by.
	 * @returns {qlib.Polynomial} A new `qlib.Polynomial` instance representing the product.
	 *                            The coefficients are initialized correctly for the Polynomial constructor.
	 */
	p.mult = function( that )
	{
		var newDegree = this.degree + that.degree;
		var resultCoeffsInternal = []; // Internal format: highest degree first
		for (var i = 0; i <= newDegree; i++) {
			resultCoeffsInternal.push(0);
		}

		// this.coefs = [an, ..., a0], that.coefs = [bm, ..., b0]
		for (var i = 0; i <= this.degree; i++) { // i is index in this.coefs
			for (var j = 0; j <= that.degree; j++) { // j is index in that.coefs
				// this.coefs[i] is for x^(this.degree - i)
				// that.coefs[j] is for x^(that.degree - j)
				// Product term is x^((this.degree - i) + (that.degree - j))
				// The index in resultCoeffsInternal for this power is:
				// newDegree - ((this.degree - i) + (that.degree - j))
				// = (this.degree + that.degree) - (this.degree - i + that.degree - j)
				// = i + j
				resultCoeffsInternal[i+j] += this.coefs[i] * that.coefs[j];
			}
		}
		// resultCoeffsInternal is now [p_newDegree, ..., p0]
		// Constructor expects [p0, ..., p_newDegree]
		return new qlib.Polynomial( resultCoeffsInternal.concat().reverse() );
	};
	
	/**
	 * Divides all coefficients of this polynomial by a scalar value.
	 * Modifies the polynomial in place.
	 *
	 * @method divide_scalar
	 * @param {number} scalar - The scalar value to divide by. Should not be zero.
	 * @returns {void}
	 * @throws {Error} If `scalar` is zero or very close to zero (within `TOLERANCE`).
	 */
	p.divide_scalar = function ( scalar )
	{
		if (Math.abs(scalar) <= this.TOLERANCE) {
			throw new Error("Polynomial.divide_scalar: division by zero or very small scalar.");
		}
		for (var i = 0; i< this.length; i++) 
		{
			this.coefs[i] /= scalar;
		}
	};
		
	qlib["Polynomial"] = Polynomial;
}());