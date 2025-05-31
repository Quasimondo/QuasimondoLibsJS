/*
* PolygonUtils
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
 * A utility class providing static helper methods for operations related to `qlib.Polygon` objects.
 * This class is not intended to be instantiated.
 * @class PolygonUtils
 * @memberof qlib
 */
	var PolygonUtils = function() {
		// Static class, not meant to be instantiated.
		throw new Error("PolygonUtils cannot be instantiated.");
	}
	
	// static methods:
	/**
	 * Creates a smoothed version of a given polygon, returned as a `qlib.MixedPath`.
	 * This is achieved by converting the polygon to a `qlib.LinearPath` and then calling
	 * its `getSmoothPath` method. The resulting path is treated as closed.
	 *
	 * @static
	 * @method getSmoothPath
	 * @param {qlib.Polygon} polygon - The polygon to smooth.
	 * @param {number} factor - The smoothing factor. Its interpretation depends on the `mode`.
	 * @param {number} [mode=0] - The smoothing mode, corresponding to constants in `qlib.LinearPath`
	 *                            (e.g., `qlib.LinearPath.SMOOTH_PATH_RELATIVE_EDGEWISE`). Defaults to 0.
	 * @returns {qlib.MixedPath} A new `qlib.MixedPath` instance representing the smoothed polygon.
	 * @see qlib.LinearPath#getSmoothPath
	 * @see qlib.LinearPath.SMOOTH_PATH_RELATIVE_EDGEWISE
	 * @see qlib.LinearPath.SMOOTH_PATH_ABSOLUTE_EDGEWISE
	 * @see qlib.LinearPath.SMOOTH_PATH_RELATIVE_MINIMUM
	 * @see qlib.LinearPath.SMOOTH_PATH_ABSOLUTE_MINIMUM
	 */
	PolygonUtils.getSmoothPath = function( polygon, factor, mode)
	{
		if ( mode == null ) mode = 0; // Corresponds to qlib.LinearPath.SMOOTH_PATH_RELATIVE_EDGEWISE
		// Polygon.toArray() returns a copy of points. clonePoints=true ensures they are new Vector2 instances for the LinearPath.
		return qlib.LinearPath.fromArray( polygon.toArray(true), false ).getSmoothPath( factor, mode, true ); // Pass true for clonePoints to fromArray if points should be cloned, then false to fromArray itself.
                                                                                                      // The polygon.toArray(true) already clones. So, fromArray's clonePoints can be false.
	}
	
	qlib["PolygonUtils"] = PolygonUtils;
}());