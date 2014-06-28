/*
* Ported from Stefan Gustavson's java implementation
* http://staffwww.itn.liu.se/~stegu/simplexnoise/simplexnoise.pdf
* Sean McCullough banksean@gmail.com
*
* Original JS code by Peter Nitsch - https://github.com/pnitsch/BitmapData.js
* HTML5 Canvas API implementation of the AS3 BitmapData class. 
*
* adapted and augmented by Mario Klingemann for qlib
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

	var SimplexNoise = function(gen) {
		this.rand = gen;
		
	};
	
	SimplexNoise.grad3 = [
		[1,1,0],[-1,1,0],[1,-1,0],[-1,-1,0], 
		[1,0,1],[-1,0,1],[1,0,-1],[-1,0,-1], 
		[0,1,1],[0,-1,1],[0,1,-1],[0,-1,-1]
	]; 
	
	SimplexNoise.simplex = [ 
		[0,1,2,3],[0,1,3,2],[0,0,0,0],[0,2,3,1],[0,0,0,0],[0,0,0,0],[0,0,0,0],[1,2,3,0], 
		[0,2,1,3],[0,0,0,0],[0,3,1,2],[0,3,2,1],[0,0,0,0],[0,0,0,0],[0,0,0,0],[1,3,2,0], 
		[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0], 
		[1,2,0,3],[0,0,0,0],[1,3,0,2],[0,0,0,0],[0,0,0,0],[0,0,0,0],[2,3,0,1],[2,3,1,0], 
		[1,0,2,3],[1,0,3,2],[0,0,0,0],[0,0,0,0],[0,0,0,0],[2,0,3,1],[0,0,0,0],[2,1,3,0], 
		[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0], 
		[2,0,1,3],[0,0,0,0],[0,0,0,0],[0,0,0,0],[3,0,1,2],[3,0,2,1],[0,0,0,0],[3,1,2,0], 
		[2,1,0,3],[0,0,0,0],[0,0,0,0],[0,0,0,0],[3,1,0,2],[0,0,0,0],[3,2,0,1],[3,2,1,0]
	]; 
	
	SimplexNoise.F2 = 0.5*(Math.sqrt(3.0)-1.0); 
	SimplexNoise.G2 = (3.0-Math.sqrt(3.0))/6.0; 
	
	var p = SimplexNoise.prototype; 

	p.setSeed = function(seed) {
		this.p = [];
		this.rand.seed = seed;
		
		for (var i=0; i<256; i++) {
			this.p[i] = (this.rand.nextRange(0, 255) | 0);
		}

		this.perm = []; 
		for(var i=0; i<512; i++) {
			this.perm[i]=this.p[i & 255];
		}
	}

	p.noise = function(xin, yin) { 
		var n0, n1, n2; 

		var s = (xin+yin)*SimplexNoise.F2; 
		var i = (xin+s) | 0; 
		var j = (yin+s) | 0; 
		
		var t = (i+j)*SimplexNoise.G2; 
		var X0 = i-t; 
		var Y0 = j-t; 
		var x0 = xin-X0; 
		var y0 = yin-Y0; 

		var i1, j1; 
		if(x0>y0) {i1=1; j1=0;} 
		else {i1=0; j1=1;}      

		var x1 = x0 - i1 + SimplexNoise.G2; 
		var y1 = y0 - j1 + SimplexNoise.G2; 
		var x2 = x0 - 1.0 + 2.0 * SimplexNoise.G2;  
		var y2 = y0 - 1.0 + 2.0 * SimplexNoise.G2; 

		var ii = i & 255; 
		var jj = j & 255; 
		var gi0 = SimplexNoise.grad3[this.perm[ii+this.perm[jj]] % 12]; 
		var gi1 = SimplexNoise.grad3[this.perm[ii+i1+this.perm[jj+j1]] % 12]; 
		var gi2 = SimplexNoise.grad3[this.perm[ii+1+this.perm[jj+1]] % 12]; 

		var t0 = 0.5 - x0*x0-y0*y0; 
		if(t0<0) n0 = 0.0; 
		else { 
			t0 *= t0; 
			n0 = t0 * t0 * (gi0[0]*x0 + gi0[1]*y0);
		}
		
		var t1 = 0.5 - x1*x1-y1*y1; 
		if(t1<0) n1 = 0.0; 
		else { 
			t1 *= t1; 
			n1 = t1 * t1 * (gi1[0]*x1 + gi1[1]*y1);
		}
		var t2 = 0.5 - x2*x2-y2*y2; 
		if(t2<0) n2 = 0.0; 
		else { 
			t2 *= t2; 
			n2 = t2 * t2 * (gi2[0]*x2 + gi2[1]*y2);
		} 

		return 70.0 * (n0 + n1 + n2); 
	};
	
	qlib["SimplexNoise"] = SimplexNoise;

}());