/*
* TriangleUtils
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

	var TriangleUtils = function() {}
	
	TriangleUtils.getCenteredTriangle = function( center, leftLength, rightLength, bottomLength, angle  )
	{
		angle = ( angle == null ? angle : 0 );
		var alpha = - Math.acos( ( leftLength * leftLength - rightLength * rightLength + bottomLength * bottomLength ) / ( 2 * leftLength * bottomLength) );
		if ( isNaN( alpha )) return null;
		
		var v1 = new qlib.Vector2(0,0);
		var v2 = new qlib.Vector2(bottomLength,0 );
		var v3 = new qlib.Vector2( Math.cos( alpha ) * leftLength, Math.sin( alpha ) * leftLength );
		
		var triangle = new qlib.Triangle( v1, v2, v3 );
		var ctr = triangle.centerOfMass();
		if ( angle != 0 ) triangle.rotate( angle );
		triangle.translate( center.getMinus( ctr ) );
		return triangle;
	}
		
	TriangleUtils.getEquilateralTriangle = function( pa, pb, flipped )
	{
		flipped = ( flipped == 0 ? false : flipped );
		return new qlib.Triangle( pa, pb, new qlib.Vector2( pa.getAddCartesian(pa.angleTo(pb) +  Math.PI / 3 * ( flipped ? -1 : 1), pa.distanceToVector( pb ))) );
	}
	
qlib.TriangleUtils = TriangleUtils;
}());