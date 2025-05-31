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
/**
 * Represents a linear path composed of a sequence of connected line segments (a polyline).
 * Provides methods for adding points, calculating length, retrieving segments,
 * and generating a smoothed version of the path as a `qlib.MixedPath`.
 * Inherits from `qlib.GeometricShape`.
 *
 * @class LinearPath
 * @extends qlib.GeometricShape
 * @constructor
 * Initializes an empty linear path.
 */
	var LinearPath = function() {
	  this.initialize();
	}
	
	/**
	 * Creates a new `LinearPath` instance from an array of points.
	 *
	 * @static
	 * @method fromArray
	 * @param {Array<Object|qlib.Vector2>} points - An array of point-like objects (having `x` and `y` properties)
	 *                                              or `qlib.Vector2` instances.
	 * @param {boolean} [clonePoints=false] - If true, the points in the input array are cloned before being added to the path.
	 *                                        If false (default), references are used.
	 * @returns {qlib.LinearPath} A new `LinearPath` instance.
	 */
	LinearPath.fromArray = function( points, clonePoints )
	{
		if ( clonePoints == null ) clonePoints = false;
		var path = new qlib.LinearPath(); // Renamed p to path for clarity
		for ( var i = 0; i < points.length; i++ )
		{
			path.addPoint( clonePoints ? points[i].clone() : points[i] );
		}
		return path;
	}
	
	/** @static @property {number} SMOOTH_PATH_RELATIVE_EDGEWISE - Smoothing mode: factor is relative to current edge length. */
	LinearPath.SMOOTH_PATH_RELATIVE_EDGEWISE = 0;
	/** @static @property {number} SMOOTH_PATH_ABSOLUTE_EDGEWISE - Smoothing mode: factor is absolute, capped by half edge length. */
	LinearPath.SMOOTH_PATH_ABSOLUTE_EDGEWISE = 1;
	/** @static @property {number} SMOOTH_PATH_RELATIVE_MINIMUM - Smoothing mode: factor is relative to minimum edge length in path. */
	LinearPath.SMOOTH_PATH_RELATIVE_MINIMUM = 2;
	/** @static @property {number} SMOOTH_PATH_ABSOLUTE_MINIMUM - Smoothing mode: factor is absolute, capped by half minimum edge length. */
	LinearPath.SMOOTH_PATH_ABSOLUTE_MINIMUM = 3;
		
	
	var p = LinearPath.prototype = new qlib.GeometricShape();
	
	/**
	 * The type of this geometric shape.
	 * @property {string} type
	 * @default "LinearPath"
	 */
	p.type = "LinearPath";
	
	/**
	 * Initializes the properties of the LinearPath.
	 * Called by the constructor.
	 * @method initialize
	 * @protected
	 * @returns {void}
	 */
	p.initialize = function()
	{
		/**
		 * Array of `qlib.Vector2` objects representing the vertices of the path.
		 * @property {qlib.Vector2[]} points
		 */
		this.points = [];
		/**
		 * Array storing the length of each segment in the path.
		 * `distances[i]` stores the length of the segment from `points[i]` to `points[i+1]`.
		 * @property {number[]} distances
		 * @protected
		 */
		this.distances = [];
		/**
		 * The total accumulated length of all segments in the path.
		 * @property {number} totalLength
		 * @protected
		 */
		this.totalLength = 0;
		/**
		 * Flag indicating if path properties (like `totalLength` or derived data) need recalculation.
		 * Set to true when points are added.
		 * @property {boolean} dirty
		 * @protected
		 */
		this.dirty = false;
	}
	
	/**
	 * [read-only] The number of points (vertices) in the path.
	 * Note: The number of segments is typically `points.length - 1` for an open path,
	 * or `points.length` if considered a closed loop for methods like `getSegment`.
	 * @property {number} segmentCount
	 */
	p.__defineGetter__("segmentCount", function(){
		return this.points.length;
	});
	
	/**
	 * Adds a point to the end of the path.
	 * If the new point is identical to the last point already in the path, it is not added.
	 * Updates segment distances and total length. Sets the `dirty` flag.
	 *
	 * @method addPoint
	 * @param {qlib.Vector2} p_to_add - The point to add.
	 * @param {boolean} [clonePoint=true] - If true (default), the point `p_to_add` is cloned before being added.
	 *                                      If false, the reference to `p_to_add` is used.
	 * @returns {boolean} True if the point was successfully added, false if it was a duplicate of the last point
	 *                    or resulted in a zero-length segment (and was thus rejected).
	 */
	p.addPoint = function( p_to_add, clonePoint ) // Renamed p to p_to_add
	{
		if ( this.points.length>0 && this.points[this.points.length-1].equals(p_to_add)) return false;
		
		if ( clonePoint == null ) clonePoint = true;
		var point_to_store = clonePoint ? p_to_add.clone() : p_to_add;
		this.points.push( point_to_store );

		if ( this.points.length > 1)
		{
			var d = point_to_store.distanceToVector( this.points[this.points.length - 2] );
			if ( d > 1e-9 ) // Check for non-zero length segment with tolerance
			{
				this.distances.push(d);
				this.totalLength += d;
			} else { // Zero-length segment, remove the just-added point
				this.points.pop();
				return false;
			}
		}
		
		this.dirty = true;
		return true;
	}
	
	/**
	 * Creates a smoothed version of this linear path, returning it as a `qlib.MixedPath`.
	 * Smoothing is achieved by replacing corners with quadratic Bezier curves (chamfering/filleting).
	 *
	 * @method getSmoothPath
	 * @param {number} factor - The smoothing factor. Its interpretation depends on the `mode`.
	 * @param {number} [mode=qlib.LinearPath.SMOOTH_PATH_RELATIVE_EDGEWISE] - The smoothing mode. Determines how `factor` is used.
	 *        Possible values:
	 *        - `qlib.LinearPath.SMOOTH_PATH_RELATIVE_EDGEWISE` (0): `factor` is relative to current edge length (0.0-1.0).
	 *        - `qlib.LinearPath.SMOOTH_PATH_ABSOLUTE_EDGEWISE` (1): `factor` is an absolute distance, capped by half edge length.
	 *        - `qlib.LinearPath.SMOOTH_PATH_RELATIVE_MINIMUM` (2): `factor` is relative to the minimum edge length in path.
	 *        - `qlib.LinearPath.SMOOTH_PATH_ABSOLUTE_MINIMUM` (3): `factor` is an absolute distance, capped by half minimum edge length.
	 * @param {boolean} [loop=false] - If true, the path is treated as a closed loop for smoothing the connection
	 *                                 between the last and first points.
	 * @returns {qlib.MixedPath|false} A new `qlib.MixedPath` representing the smoothed path, or `false` if the mode is invalid or path is too short.
	 */
	p.getSmoothPath = function( factor, mode, loop)
	{
		if ( mode == null) mode = LinearPath.SMOOTH_PATH_RELATIVE_EDGEWISE; // Default to static property
		if ( loop == null ) loop = false;
		if ( mode < 0 || mode > 3 || this.points.length < (loop ? 3:2) ) // Need at least 2 points for a segment, 3 for a loop with a corner
		{
			return false;
		}
		var segments = [];
		var s; // Current segment
		var min_len = Number.MAX_VALUE; // Renamed l to min_len for clarity
		var p1_on_curve, p2_on_curve; // Renamed p1,p2 to avoid conflict
		 
		var numSegments = loop ? this.points.length : this.points.length - 1;
		if (numSegments <= 0) return new qlib.MixedPath(); // Empty or single point path

		for ( var i = 0; i < numSegments; i++ )
		{
			s = this.getSegment(i);
			segments.push( s );
			if (mode === LinearPath.SMOOTH_PATH_RELATIVE_MINIMUM || mode === LinearPath.SMOOTH_PATH_ABSOLUTE_MINIMUM) {
				 if (s.length > 0) min_len = Math.min( min_len, s.length ) ;
			}
		}
		if (min_len === Number.MAX_VALUE) min_len = 0; // Handle case where all segments had zero length (though addPoint tries to prevent this)
		
		var current_l_factor = 0; // Stores the calculated length for smoothing based on mode
		switch ( mode )
		{
			case LinearPath.SMOOTH_PATH_RELATIVE_MINIMUM:
				current_l_factor = min_len * 0.5 * factor;
			break;
			case LinearPath.SMOOTH_PATH_ABSOLUTE_MINIMUM:
				 current_l_factor = Math.min( min_len*0.5, factor ) ;
			break;
		}
		
		var mp = new qlib.MixedPath();
		if ( segments.length > 0 ) {
			if ( !loop ) { // Add the very first point of the path if it's not a loop
				mp.addPoint( segments[0].p1.clone() ); // Start with the first point of the first segment
			}
		} else {
			return mp; // No segments to process
		}

		for ( i = 0; i < segments.length; i++ )
		{
			s = segments[i];
			if ( s.length > 1e-9 ) // Process only if segment has a tangible length
			{
				switch ( mode )
				{
					case LinearPath.SMOOTH_PATH_RELATIVE_EDGEWISE:
						current_l_factor = s.length * 0.5 * factor;
					break;
					case LinearPath.SMOOTH_PATH_ABSOLUTE_EDGEWISE:
						 current_l_factor = Math.min( s.length*0.5, factor ) ;
					break;
					// For MINIMUM modes, current_l_factor is already set
				}
				current_l_factor = Math.min(current_l_factor, s.length * 0.5); // Ensure factor doesn't exceed half segment length

				p1_on_curve = s.getPoint( current_l_factor / s.length );
				p2_on_curve = s.getPoint( 1.0 - ( current_l_factor / s.length ) );
			
				if (i > 0 || loop) { // If not the first segment of an open path, or if it's a loop
					// The previous segment's p2_on_curve is the start of this smoothing curve's line part
					// The control point is the shared vertex s.p1
					mp.addControlPoint( s.p1.clone() );
				}
				mp.addPoint(p1_on_curve); // Add start of straight part of current segment
				if ( !p1_on_curve.equals(p2_on_curve) ) mp.addPoint(p2_on_curve); // Add end of straight part if distinct

				// If it's the last segment of a loop, the last control point is points[0]
				if (loop && i === segments.length - 1) {
					mp.addControlPoint(this.points[0].clone());
				}
			} else if (i > 0 || loop) { // Zero length segment, just add the control point if not first open segment
                 mp.addControlPoint(s.p1.clone());
            }
		}
		mp.closed = loop;
		return mp;
	}
	
	/**
	 * Retrieves a line segment from the path at a given index.
	 * If the index refers to the last point and the path is considered conceptually closed,
	 * it returns the segment connecting the last point to the first point.
	 *
	 * @method getSegment
	 * @param {number} index - The index of the starting point of the segment.
	 * @returns {qlib.LineSegment} A new `qlib.LineSegment` instance.
	 */
	p.getSegment = function( index )
	{
		// Ensure index is within bounds, wraps around for conceptual closure
		var p1_idx = ( index % this.points.length + this.points.length) % this.points.length;
		var p2_idx = ( (index+1) % this.points.length + this.points.length) % this.points.length;
		return new qlib.LineSegment( this.points[p1_idx], this.points[p2_idx] );
	}
	
	/**
	 * Calculates and returns the bounding rectangle of this linear path.
	 *
	 * @method getBoundingRect
	 * @returns {qlib.Rectangle} A new `qlib.Rectangle` instance. Returns a zero-size rectangle at (0,0) if path has no points.
	 */
	p.getBoundingRect = function()
	{
		if (!this.points || this.points.length === 0) return new qlib.Rectangle(0,0,0,0);

		var p_current = this.points[0]; // Renamed p to p_current
		var minX = p_current.x;
		var maxX = minX;
		var minY = p_current.y;
		var maxY = minY;
		for ( var i = 1; i< this.points.length; i++ )
		{
			p_current = this.points[i];
			if ( p_current.x < minX ) minX = p_current.x;
			else if ( p_current.x > maxX ) maxX = p_current.x;
			if ( p_current.y < minY ) minY = p_current.y;
			else if ( p_current.y > maxY ) maxY = p_current.y;
		}
		
		return new qlib.Rectangle( minX, minY, maxX - minX, maxY - minY );
	}
		
	
	qlib["LinearPath"] = LinearPath;
}());