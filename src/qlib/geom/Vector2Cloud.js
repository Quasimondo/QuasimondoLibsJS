/*
* Vector2 Cloud
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
 * Represents a collection (cloud) of 2D points (`qlib.Vector2`).
 * Provides methods for accumulating points, calculating statistical properties like
 * centroid and covariance, finding the major orientation angle, computing an
 * oriented bounding box (OBB), and performing spatial queries like finding the
 * closest points using an internal KD-Tree.
 *
 * @class Vector2Cloud
 * @memberof qlib
 * @constructor
 * Initializes an empty point cloud.
 */
	var Vector2Cloud = function() {
	  this.clear();
	}
	var p = Vector2Cloud.prototype;

	/**
	 * Default number of standard deviations used for drawing the covariance ellipse.
	 * @static
	 * @property {number} NUM_STANDARD_DEVIATIONS
	 * @default 1.7
	 */
	Vector2Cloud.NUM_STANDARD_DEVIATIONS = 1.7;
	
	/**
	 * Creates a new `Vector2Cloud` instance from an array of points.
	 * @static
	 * @method fromArray
	 * @param {Array<Object|qlib.Vector2>} points - An array of point-like objects (having `x`, `y` properties) or `qlib.Vector2` instances.
	 * @param {boolean} [clonePoints=false] - If true, the points are cloned. Otherwise, references are used (if points are `qlib.Vector2` instances).
	 * @returns {qlib.Vector2Cloud} A new `Vector2Cloud` instance.
	 */
	Vector2Cloud.fromArray = function( points, clonePoints )
	{
		if ( clonePoints == null ) clonePoints = false;
		var vc = new qlib.Vector2Cloud();
		if ( !clonePoints )
		{
			for ( var i = 0; i < points.length; i++ )
			{
				vc.accumulate( points[i] ); // accumulate will clone if necessary or handle type
			}
		} else {
			for ( var i = 0; i < points.length; i++ )
			{
				// Assuming points[i] has a getClone method if it's a complex object,
				// or that qlib.Vector2 constructor can handle it for cloning.
				// accumulate itself handles creating new Vector2 if needed.
				vc.accumulate( points[i].getClone ? points[i].getClone() : new qlib.Vector2(points[i].x, points[i].y) );
			}
		}
		
		return vc;
	}
	
	/**
	 * Clears all points and resets statistical properties of the cloud.
	 * Initializes an empty points array, sum, centroid, and a new KD-Tree.
	 * Sets dirty flags to true.
	 * @method clear
	 * @returns {void}
	 */
	p.clear = function()
	{
		/**
		 * Array of `qlib.Vector2` objects in the cloud.
		 * @property {qlib.Vector2[]} points
		 */
		if ( this.points == null )
			this.points = [];
		else 
			this.points.length = 0;
		
		/**
		 * The sum of all point vectors, used for centroid calculation.
		 * @property {qlib.Vector2} sum
		 * @protected
		 */
		this.sum = new qlib.Vector2();
		/**
		 * Cached centroid of the point cloud.
		 * @property {qlib.Vector2} _centroid
		 * @private
		 */
		this._centroid = new qlib.Vector2();
		
		/**
		 * The major orientation angle of the point cloud (in radians), based on covariance.
		 * Updated by `compute_covariance_body`.
		 * @property {number} majorAngle
		 * @protected
		 */
		this.majorAngle = 0;
		/**
		 * Flag indicating if covariance-dependent properties (like `majorAngle`) need recalculation.
		 * @property {boolean} dirty
		 * @protected
		 */
		this.dirty = true;
		/**
		 * Flag indicating if the centroid needs recalculation.
		 * @property {boolean} centroidDirty
		 * @protected
		 */
		this.centroidDirty = true;
		/**
		 * KD-Tree for spatial indexing of the points.
		 * @property {qlib.KDTree} tree
		 * @protected
		 */
		this.tree = new qlib.KDTree([],this.distance,["x","y"]); // Initialize KDTree with empty points and dimensions
		/**
		 * Flag indicating if the KD-Tree needs to be rebuilt (e.g., after point modifications not done via `accumulate`).
		 * @property {boolean} treeDirty
		 * @protected
		 */
		this.treeDirty = false; // Initially not dirty as it's fresh
		/**
		 * The 2x2 covariance matrix of the point cloud.
		 * Assumes `qlib.CovarianceMatrix2` class exists.
		 * @property {qlib.CovarianceMatrix2} covariance
		 * @protected
		 */
		this.covariance = null; // Will be created in compute_covariance_body
	}
	
	
	/**
	 * Adds a point to the cloud. Updates sums for centroid calculation,
	 * inserts the point into the KD-Tree, and marks statistical properties as dirty.
	 * If the KD-Tree was marked as dirty, it's rebuilt before insertion.
	 * @method accumulate
	 * @param {qlib.Vector2|Object} vector - The point to add (either a `qlib.Vector2` or an object with x,y properties).
	 *                                       If not a `qlib.Vector2`, it will be converted to one.
	 * @returns {void}
	 */
	p.accumulate = function( vector )
	{
		if ( this.treeDirty )
		{
			this.tree = new qlib.KDTree(this.points,this.distance,["x","y"]);
			this.treeDirty = false;
		}
		var pointToAdd = (vector instanceof qlib.Vector2) ? vector : new qlib.Vector2(vector.x, vector.y);
		this.points.push( pointToAdd );
		this.sum.plus( pointToAdd );
		this.tree.insert( pointToAdd );
		this.dirty = this.centroidDirty = true;
	}
		
		
	/**
	 * Calculates the squared Euclidean distance between two points.
	 * This function is used as the metric for the internal KD-Tree.
	 * @method distance
	 * @protected
	 * @param {Object} a - First point (must have `x` and `y` properties).
	 * @param {Object} b - Second point (must have `x` and `y` properties).
	 * @returns {number} The squared distance between points `a` and `b`.
	 */
	p.distance = function(a, b){
	  var dx = a.x - b.x; // Renamed d to dx
	  var dy = a.y - b.y; // Renamed d to dy
	  return dx * dx + dy * dy;
	}	
		
	/**
	 * Gets the number of points currently in the cloud.
	 * @method getPointCount
	 * @returns {number} The number of points.
	 */
	p.getPointCount = function()
	{
		return this.points.length;
	}
	
	/**
	 * Calculates and returns the centroid (average position) of all points in the cloud.
	 * The result is cached; subsequent calls return the cached value unless `centroidDirty` is true.
	 * @method getCentroid
	 * @returns {qlib.Vector2} A new `qlib.Vector2` representing the centroid.
	 *                         Returns (0,0) if the cloud is empty.
	 */
	p.getCentroid = function()
	{
		if ( this.points.length > 0 && this.centroidDirty ) {
			this._centroid.x = this.sum.x / this.points.length; // Directly update _centroid
			this._centroid.y = this.sum.y / this.points.length;
			this.centroidDirty = false;
		}
		return this._centroid.clone(); // Return a clone to prevent external modification of cached value
	}	
		
	/**
	 * Computes the covariance matrix and major orientation angle of the point cloud.
	 * This method is called internally when `dirty` is true and these properties are accessed.
	 * Assumes `qlib.CovarianceMatrix2` class is available.
	 * @method compute_covariance_body
	 * @protected
	 * @returns {void}
	 */
	p.compute_covariance_body = function()
	{
		if (this.points.length == 0 || !this.dirty) return;
		
		this.covariance = new qlib.CovarianceMatrix2(); // Assuming this class exists and has a,b,c properties
		var mean = this.getCentroid(); // Ensure centroid is up-to-date
		
		for ( var i = 0; i < this.points.length; i++) 
		{
			var c = this.points[i].getMinus( mean );
			this.covariance.a += c.x * c.x; // Sum of (x_i - mean_x)^2
			this.covariance.b += c.x * c.y; // Sum of (x_i - mean_x)(y_i - mean_y)
			this.covariance.c += c.y * c.y; // Sum of (y_i - mean_y)^2
		}
		
		// Eigenvector calculation for orientation (simplified from covariance matrix properties)
		// atan2(2*covXY, covXX - covYY) / 2
		var dy_eigen = 2 * this.covariance.b; // 2 * sum_xy_dev
		var dx_eigen = this.covariance.a  - this.covariance.c; // sum_x_dev_sq - sum_y_dev_sq

		if ( Math.abs(dy_eigen) < 1e-9 && Math.abs(dx_eigen) < 1e-9 ) // Avoid atan2(0,0)
		{
			// If principal components are equal, orientation can be ambiguous or based on data order.
			// Default to 0 or based on whether variance in X is greater than Y.
			this.majorAngle = ( this.covariance.a >= this.covariance.c ? 0 : Math.PI * 0.5 );
		} else {
			this.majorAngle = Math.atan2( dy_eigen, dx_eigen ) / 2; // Angle of major eigenvector
		}
		
		this.covariance.scale( 1 / this.points.length ); // Finalize covariance matrix entries
		this.dirty = false;
	}
		
	/**
	 * Gets the major orientation angle (in radians) of the point cloud.
	 * This angle corresponds to the principal component with the largest variance.
	 * If `dirty` is true, recalculates covariance first.
	 * @method getMajorAngle
	 * @returns {number} The major orientation angle in radians.
	 */
	p.getMajorAngle = function()
	{
		if ( this.dirty ) this.compute_covariance_body();
		return this.majorAngle;
	}
		
	/**
	 * Calculates and returns the Oriented Bounding Box (OBB) of the point cloud.
	 * The OBB is aligned with the major and minor axes of the point distribution.
	 * If `dirty` is true, recalculates covariance first.
	 * @method getObb
	 * @returns {qlib.ConvexPolygon} A `qlib.ConvexPolygon` representing the OBB.
	 */
	p.getObb = function()
	{
		if (this.points.length === 0) return new qlib.ConvexPolygon();
		if ( this.dirty ) this.compute_covariance_body(); // Ensures majorAngle and centroid are up-to-date

		var angle = this.majorAngle;
		var center = this.getCentroid(); // Use the actual centroid for rotation
	
		var minX, maxX, minY, maxY;
		
		// Rotate first point to the aligned frame
		var p_rotated = this.points[0].clone().minus(center).rotateBy(-angle); // Rotate around (0,0) in translated space
		minX = maxX = p_rotated.x;
		minY = maxY = p_rotated.y;
	
		// Find min/max in the rotated coordinate system
		for ( var i = 1; i < this.points.length; i++ )
		{
			p_rotated = this.points[i].clone().minus(center).rotateBy(-angle);
			if ( p_rotated.x < minX ) minX = p_rotated.x;
			if ( p_rotated.x > maxX ) maxX = p_rotated.x;
			if ( p_rotated.y < minY ) minY = p_rotated.y;
			if ( p_rotated.y > maxY ) maxY = p_rotated.y;
		}
		
		// Create corner points of the OBB in the rotated frame (relative to origin)
		var obb_points_rotated = [
			new qlib.Vector2( minX, minY ),
			new qlib.Vector2( maxX, minY ),
			new qlib.Vector2( maxX, maxY ),
			new qlib.Vector2( minX, maxY )
		];

		// Rotate points back to original frame and translate by centroid
		for (i = 0; i < obb_points_rotated.length; i++) {
			obb_points_rotated[i].rotateBy(angle).plus(center);
		}

		return qlib.ConvexPolygon.fromArray(obb_points_rotated, false); // fromArray will compute hull
	}
		
	/**
	 * Calculates the density of the point cloud, defined as the area of its
	 * Oriented Bounding Box (OBB) divided by the number of points.
	 * @method getDensity
	 * @returns {number} The density. Returns 0 if point count is zero.
	 */
	p.getDensity = function()
	{
		if (this.getPointCount() === 0) return 0;
		var obb = this.getObb();
		return obb.area / this.getPointCount(); // Assumes ConvexPolygon has an 'area' getter
	}
		
	/**
	 * Splits this point cloud into two new clouds based on which side of a given line segment
	 * the points lie. Points on the line might be assigned to one side based on floating point precision.
	 * @method getSplitClouds
	 * @param {qlib.LineSegment} line - The dividing line segment.
	 * @returns {qlib.Vector2Cloud[]} An array containing two new `Vector2Cloud` instances.
	 *                                 The first element contains points to one side (e.g., "left"),
	 *                                 the second contains points to the other side (e.g., "right").
	 */
	p.getSplitClouds = function( line )
	{
		var result =[];
		result.push( new qlib.Vector2Cloud(), new qlib.Vector2Cloud() );
		for ( var i=0; i < this.points.length; i++ ) // Changed for...in to standard for loop
		{
			// Vector2.isLeft returns >0 if left, <0 if right, 0 if collinear
			// Assuming points to the right (or collinear) go to index 0, left to index 1
			result[( this.points[i].isLeft( line.p1, line.p2 ) < 0 ? 0 : 1 )].accumulate( this.points[i]); // Original code, no cloning needed as accumulate handles it.
		}
		return result;
	}
		
	/**
	 * Finds the closest points in the cloud to a given point, using the internal KD-Tree.
	 * @method getClosestPoints
	 * @param {qlib.Vector2} point - The reference point.
	 * @param {number} count - The maximum number of closest points to return.
	 * @param {number} [maxDistance] - Optional maximum squared distance for points to be considered.
	 * @returns {qlib.Vector2[]} An array of the closest `qlib.Vector2` points found.
	 */
	p.getClosestPoints = function( point, count, maxDistance )
	{
		if ( this.treeDirty && this.points.length > 0) // Rebuild tree if dirty and has points
		{
			this.tree = new qlib.KDTree(this.points, this.distance, ["x","y"]);
			this.treeDirty = false;
		}
		if (this.points.length === 0) return [];

		var nearest = this.tree.nearest( point, count, maxDistance ); // KDTree.nearest returns [[obj, dist], ...]
		var result = [];
		for ( var i = 0; i < nearest.length; i++ )
		{
			if (nearest[i] && nearest[i][0]) { // Ensure the object exists
				result.push( nearest[i][0] ); // Extract only the point object
			}
		}
		return result;
	}
		
	/**
	 * Draws a covariance ellipse for the point cloud on a canvas.
	 * The ellipse represents the distribution of points, scaled by a number of standard deviations.
	 * Requires `qlib.CovarianceMatrix2` to have a `find_eigenvectors` method.
	 * @method drawCovarianceEllipse
	 * @param {CanvasRenderingContext2D} canvas - The canvas rendering context.
	 * @param {number} [standardDeviations=Vector2Cloud.NUM_STANDARD_DEVIATIONS] - Number of standard deviations to scale the ellipse axes.
	 * @returns {void}
	 */
	p.drawCovarianceEllipse = function( canvas, standardDeviations) 
	{
		if (this.points.length < 2) return; // Need at least 2 points for covariance
		if ( this.dirty ) this.compute_covariance_body();
		if (!this.covariance) return; // Covariance could not be computed

		standardDeviations = ( standardDeviations == null ) ? Vector2Cloud.NUM_STANDARD_DEVIATIONS : standardDeviations;
		var axisVectors = []; // Should be [new qlib.Vector2(), new qlib.Vector2()];
		var eigenvalues = []; // Should be array of 2 numbers
		
		// Assuming this.covariance.find_eigenvectors(eigenvalues, axisVectors) populates these arrays.
		this.covariance.find_eigenvectors(eigenvalues, axisVectors);
		if (axisVectors.length < 2 || eigenvalues.length < 2) return; // Eigenvector calculation failed

		var len0 = Math.sqrt(Math.abs(eigenvalues[0])) * standardDeviations;
		var len1 = Math.sqrt(Math.abs(eigenvalues[1])) * standardDeviations;
		
		var axis0 = axisVectors[0]; // Should be a qlib.Vector2
		var axis1 = axisVectors[1]; // Should be a qlib.Vector2
		
		// Ensure axis0 and axis1 are Vector2 instances if find_eigenvectors doesn't guarantee it
		if (!(axis0 instanceof qlib.Vector2)) axis0 = new qlib.Vector2(axis0.x, axis0.y);
		if (!(axis1 instanceof qlib.Vector2)) axis1 = new qlib.Vector2(axis1.x, axis1.y);

		var tempAxis0 = axis0.clone().multiply(len0); // Use clones for scaled versions
		var tempAxis1 = axis1.clone().multiply(len1);
		
		var NUM_VERTICES = 300; // Number of segments to approximate ellipse
		var centroid = this.getCentroid();
		
		canvas.beginPath();
		var theta = 0;
		var ct = Math.cos(theta);
		var st = Math.sin(theta);
		// pos = center + axis0_scaled*cos(theta) + axis1_scaled*sin(theta)
		var pos = centroid.getPlus( tempAxis0.getMultiply(ct) ).plus( tempAxis1.getMultiply(st) );
		
		canvas.moveTo( pos.x, pos.y );
		for (var j = 1; j <= NUM_VERTICES; j++) // Include last point to close ellipse
		{
			theta = 2 * Math.PI * (j / NUM_VERTICES);
			ct = Math.cos(theta);
			st = Math.sin(theta);
			pos = centroid.getPlus( tempAxis0.getMultiply(ct) ).plus( tempAxis1.getMultiply(st) );
			canvas.lineTo( pos.x, pos.y );
		}
		// canvas.closePath(); // Already connects back to start due to loop to NUM_VERTICES
		// canvas.stroke(); // Or fill, depending on desired drawing
	}
		
	/**
	 * Rotates all points in the cloud around a center point. Modifies points in place.
	 * Marks statistical properties and KD-Tree as dirty.
	 * @method rotate
	 * @param {number} angle - The angle of rotation in radians.
	 * @param {qlib.Vector2} [center] - The center of rotation. Defaults to the cloud's centroid.
	 * @returns {this} This Vector2Cloud instance for chaining.
	 */
	p.rotate = function( angle, center )
	{
		if ( center == null ) center = this.getCentroid(); // Get centroid before modifying points
		for ( var i=0; i < this.points.length; i++ ) // Use standard loop
		{
			this.points[i].rotateAround( angle, center );
		}
		this.dirty = true;
		this.treeDirty = true;
		this.centroidDirty = true; // Centroid will change if rotation is not around current centroid
		return this;
	}
		
	/**
	 * Calculates and returns the axis-aligned bounding rectangle of the point cloud.
	 * @method getBoundingRect
	 * @returns {qlib.Rectangle} A new `qlib.Rectangle` instance. Returns an empty rectangle if cloud has no points.
	 */
	p.getBoundingRect = function()
	{
		if ( this.points.length == 0 ) return new qlib.Rectangle();
		var minX, maxX, minY, maxY;
		
		minX = maxX = this.points[0].x;
		minY = maxY =  this.points[0].y;
		
		for ( var i = 1; i < this.points.length; i++) // Start from 1 as 0 is initialized
		{
			var point = this.points[i];
			if ( point.x < minX ) minX = point.x;
			if ( point.x > maxX ) maxX = point.x;
			if ( point.y < minY ) minY = point.y;
			if ( point.y > maxY ) maxY = point.y;
		}
		// Width/Height should be (max - min). Adding 1 is unusual for bounding boxes.
		return new qlib.Rectangle( minX, minY, maxX - minX, maxY - minY );
	}
		
	/**
	 * Computes the convex hull of the point cloud.
	 * @method convexHull
	 * @returns {qlib.ConvexPolygon} A new `qlib.ConvexPolygon` instance representing the convex hull.
	 */
	p.convexHull = function()
	{
		// fromArray clones points by default if its second arg is true or omitted by some Polygon versions
		return qlib.ConvexPolygon.fromArray( this.points, true );
	}
		
	/**
	 * Returns a new `Vector2Cloud` containing points from this cloud that are not part of its convex hull.
	 * @method getInnerCloud
	 * @returns {qlib.Vector2Cloud} A new cloud of inner points.
	 */
	p.getInnerCloud = function()
	{
		if (this.points.length < 3) return new qlib.Vector2Cloud(); // No inner points if not enough for a hull area
		var hullPolygon = this.convexHull();
		var innerPoints = []; // Renamed result to innerPoints

		for ( var i = 0; i < this.points.length; i++ )
		{
			var currentPoint = this.points[i];
			var isOnHull = false;
			// Check if currentPoint is one of the hull polygon's vertices
			for ( var j = 0; j < hullPolygon.points.length; j++ )
			{
				if ( currentPoint.equals( hullPolygon.points[j] ) ) // Assuming Vector2.equals for comparison
				{
					isOnHull = true;
					break;
				}
			}
			if (!isOnHull) {
				innerPoints.push(currentPoint); // Add if not on hull; cloning handled by fromArray
			}
		}	
		return qlib.Vector2Cloud.fromArray( innerPoints, false ); // Points are already Vector2 instances
	}
			
	/**
	 * Draws all points in the cloud on a canvas.
	 * Assumes points have a `draw` method (e.g., `qlib.Vector2` might have one).
	 * @method draw
	 * @param {CanvasRenderingContext2D} canvas - The canvas rendering context.
	 * @param {number} [radius] - Radius or size for drawing each point.
	 * @returns {void}
	 */
	p.draw = function( canvas, radius )
	{
		for ( var i = 0; i < this.points.length; i++ )
		{
			if (this.points[i] && typeof this.points[i].draw === 'function') {
				this.points[i].draw( canvas, radius );
			}
		}
	}
		
	/**
	 * Creates and returns a clone of this Vector2Cloud instance.
	 * @method clone
	 * @param {boolean} [deepClone=true] - If true (default), the `qlib.Vector2` points are cloned.
	 *                                     If false, references to the original points are used in the new cloud.
	 * @returns {qlib.Vector2Cloud} A new `Vector2Cloud` instance.
	 */
	p.clone = function( deepClone )
	{
		deepClone = (deepClone == null) ? true : deepClone; // Default to true
		// fromArray's second parameter is clonePoints. If deepClone is true, we want fromArray to clone them.
		return qlib.Vector2Cloud.fromArray( this.points, deepClone );
	}
		
	qlib["Vector2Cloud"] = Vector2Cloud;
}());
