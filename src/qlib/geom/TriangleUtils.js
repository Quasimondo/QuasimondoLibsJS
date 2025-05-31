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
window["qlib"] = window.qlib || {};

(function() {

/**
 * A utility class providing static helper methods for creating `qlib.Triangle` objects.
 * This class is not intended to be instantiated.
 * @class TriangleUtils
 * @memberof qlib
 */
	var TriangleUtils = function() {
		// Static class, not meant to be instantiated.
		throw new Error("TriangleUtils cannot be instantiated.");
	}
	
	/**
	 * Creates a triangle defined by its side lengths, positioned with its centroid at a given center point, and rotated.
	 * Note: Not all combinations of three side lengths can form a valid triangle.
	 * The method first constructs the triangle at the origin, then translates and rotates it.
	 *
	 * @static
	 * @method getCenteredTriangle
	 * @param {qlib.Vector2} center - The desired center point for the triangle (centroid).
	 * @param {number} sideALength - Length of the side opposite the first vertex (e.g., side between v2 and v3).
	 * @param {number} sideBLength - Length of the side opposite the second vertex (e.g., side between v1 and v3).
	 * @param {number} sideCLength - Length of the side opposite the third vertex (e.g., side between v1 and v2, often used as the base).
	 * @param {number} [angle=0] - Desired rotation of the triangle in radians around its calculated centroid.
	 * @returns {qlib.Triangle|null} A new `qlib.Triangle`, or `null` if the side lengths cannot form a valid triangle.
	 */
	TriangleUtils.getCenteredTriangle = function( center, sideALength, sideBLength, sideCLength, angle  ) // Parameters renamed for clarity: left, right, bottom -> sideA, sideB, sideC (standard notation)
	{
		angle = angle || 0; // Default angle to 0 if not provided

		// Using Law of Cosines to find an angle (e.g., angle at vertex where sideBLength and sideCLength meet)
		// cos(alpha) = (b^2 + c^2 - a^2) / (2bc)
		var cosAlpha = ( sideBLength * sideBLength + sideCLength * sideCLength - sideALength * sideALength ) / ( 2 * sideBLength * sideCLength );
		
		if ( isNaN(cosAlpha) || cosAlpha < -1.0 || cosAlpha > 1.0 ) return null; // Invalid triangle if cosine out of bounds

		var alpha = Math.acos( cosAlpha );
		// Place first vertex at origin
		var v1 = new qlib.Vector2(0,0);
		// Place second vertex along x-axis based on one side length (e.g. sideCLength)
		var v2 = new qlib.Vector2(sideCLength, 0 );
		// Place third vertex using the other side length (sideBLength) and calculated angle alpha
		var v3 = new qlib.Vector2( Math.cos( alpha ) * sideBLength, Math.sin( alpha ) * sideBLength );
		
		var triangle = new qlib.Triangle( v1, v2, v3 );
		var ctr = triangle.centerOfMass(); // Calculate centroid of this initial triangle

		// Translate so its centroid is at the desired 'center'
		triangle.translate( center.getMinus( ctr ) );

		// Rotate if an angle is specified
		if ( angle !== 0 ) triangle.rotate( angle, center ); // Rotate around the new center

		return triangle;
	}
		
	/**
	 * Creates an equilateral triangle given two points `pa` and `pb` which form one side of the triangle.
	 * The third point is determined by rotating one point around the other by 60 degrees (PI/3 radians).
	 *
	 * @static
	 * @method getEquilateralTriangle
	 * @param {qlib.Vector2} pa - The first point of the base side.
	 * @param {qlib.Vector2} pb - The second point of the base side.
	 * @param {boolean} [flipped=false] - If true, the third point is constructed on the "other" side of the directed segment pa->pb,
	 *                                  effectively flipping the triangle's orientation relative to that segment.
	 *                                  Default (false) usually results in a counter-clockwise winding (pa, pb, p_new).
	 * @returns {qlib.Triangle} A new equilateral `qlib.Triangle`.
	 */
	TriangleUtils.getEquilateralTriangle = function( pa, pb, flipped )
	{
		flipped = flipped || false; // Default to false
		var angleToPb = pa.getAngleTo(pb); // Assuming Vector2 has getAngleTo
		var distanceToPb = pa.distanceToVector( pb );
		var angleOffset = Math.PI / 3 * ( flipped ? -1 : 1);

		var p3 = pa.getAddCartesian(angleToPb +  angleOffset, distanceToPb);
		return new qlib.Triangle( pa, pb, p3 );
	}
	
	qlib["TriangleUtils"] = TriangleUtils;
}());