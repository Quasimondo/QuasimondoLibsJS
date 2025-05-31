/*
* ArcBall
*
* Original BitmapData.js code by Peter Nitsch - https://github.com/pnitsch/BitmapData.js
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

/**
 * Implements an ArcBall controller for 3D rotation.
 * An ArcBall is a virtual sphere projected onto the 2D screen, allowing users to
 * intuitively rotate a 3D object (represented by a `qlib.Matrix3D`) by "dragging"
 * points on this sphere.
 *
 * It maps 2D mouse coordinates to a point on a virtual 3D hemisphere,
 * and calculates rotation quaternions based on mouse movement.
 * This class assumes `qlib.Vector3` can represent quaternions (x, y, z for vector part, w for scalar part).
 * It also assumes the existence of `Orientation3D.QUATERNION` for matrix decomposition/recomposition.
 *
 * @class ArcBall
 * @param {qlib.Matrix3D} matrix3D - The 3D transformation matrix to be manipulated by the ArcBall.
 * @param {qlib.Vector2} center - The 2D screen coordinates of the ArcBall's center.
 * @param {number} [radius=200] - The radius of the virtual sphere in screen pixels. Defaults to 200 if not specified or if zero.
 */
	var ArcBall = function( matrix3D, center, radius )
	{
		/**
		 * The radius of the virtual sphere in screen pixels.
		 * @property {number} _radius
		 * @protected
		 */
		this._radius = radius || 200; // Use OR for default, as `|` is bitwise OR.
		/**
		 * The 2D screen coordinates of the ArcBall's center.
		 * @property {qlib.Vector2} _center
		 * @protected
		 */
		this._center = center;
		/**
		 * The `qlib.Matrix3D` instance that this ArcBall manipulates.
		 * @property {qlib.Matrix3D} _matrix3d
		 * @protected
		 */
		this._matrix3d = matrix3D;
		this.init();
	};
	
	var p = ArcBall.prototype; 
	
	/**
	 * Initializes internal vectors and quaternions used for calculations.
	 * Called by the constructor.
	 *
	 * @method init
	 * @protected
	 * @returns {void}
	 */
	p.init = function()
	{
		/**
		 * Stores the 3D vector on the sphere corresponding to the mouse down position.
		 * @property {qlib.Vector3} startVector
		 */
		this.startVector = new qlib.Vector3();
		/**
		 * Stores the initial orientation quaternion when a drag starts.
		 * (x,y,z are vector part, w is scalar part)
		 * @property {qlib.Vector3} startQuat
		 */
		this.startQuat = new qlib.Vector3(); // Used as a Quaternion
		/**
		 * Stores the quaternion representing the current drag rotation.
		 * @property {qlib.Vector3} dragQuat
		 */
		this.dragQuat = new qlib.Vector3(); // Used as a Quaternion
		/**
		 * Stores the 3D vector on the sphere corresponding to the current mouse drag position.
		 * @property {qlib.Vector3} dragVector
		 */
		this.dragVector = new qlib.Vector3();
		/**
		 * Stores the new orientation quaternion resulting from the drag.
		 * @property {qlib.Vector3} newQuat
		 */
		this.newQuat = new qlib.Vector3(); // Used as a Quaternion
		/**
		 * Temporary vector, possibly for radius calculations or unused.
		 * @property {qlib.Vector3} radiusVector
		 * @deprecated May not be used.
		 */
		this.radiusVector = new qlib.Vector3(); // Its usage is not clear from the provided code.
		/**
		 * Stores the decomposed components of the `_matrix3d` (translation, rotation, scale).
		 * @property {Array} transformComponents
		 */
		this.transformComponents = [];
	}
	
	/**
	 * Called when a mouse drag operation begins.
	 * It captures the initial orientation of the `_matrix3d` as a quaternion.
	 * Assumes `Orientation3D.QUATERNION` is available.
	 *
	 * @method startDrag
	 * @returns {void}
	 */
	p.startDrag = function()
	{
		this.transformComponents = this._matrix3d.decompose(Orientation3D.QUATERNION);
		var quat = this.transformComponents[1]; // Assuming index 1 is the quaternion
		this.startQuat.x = quat.x;
		this.startQuat.y = quat.y;
		this.startQuat.z = quat.z;
		this.startQuat.w = quat.w;
		this.dragQuat.x = this.dragQuat.y = this.dragQuat.z = 0; // Reset drag quaternion
		this.dragQuat.w = 1; // Identity quaternion
	}
	
	/**
	 * Calculates the new orientation based on the drag operation and updates the `_matrix3d`.
	 * The rotation is determined by the cross product (for axis) and dot product (for angle)
	 * of `startVector` and `dragVector`.
	 *
	 * @method dragTo
	 * @returns {void}
	 */
	p.dragTo = function()
	{
		var v = this.startVector.crossProduct(this.dragVector);
		this.dragQuat.x = v.x;
		this.dragQuat.y = v.y;
		this.dragQuat.z = v.z;
		this.dragQuat.w = this.startVector.dotProduct(this.dragVector);
		this.multiplyQuats(this.dragQuat, this.startQuat, this.newQuat);
		this.transformComponents[1] = this.newQuat; // Update rotation component
		this._matrix3d.recompose(this.transformComponents, Orientation3D.QUATERNION);
	}
	
	/**
	 * Converts 2D screen coordinates (x, y) to a 3D vector on the surface of the virtual sphere.
	 * If the 2D point is outside the projection of the sphere, it's mapped to the sphere's edge.
	 *
	 * @method coordinate2DToSphere
	 * @param {number} x - The x-coordinate on the screen.
	 * @param {number} y - The y-coordinate on the screen.
	 * @param {qlib.Vector3} targetVector - The `qlib.Vector3` instance to store the resulting 3D sphere coordinates.
	 * @returns {qlib.Vector3} The `targetVector` with the calculated sphere coordinates.
	 */
	p.coordinate2DToSphere = function(x, y, targetVector)
	{
		targetVector.x = (x - this._center.x)/this._radius; // Corrected: (x - center.x)
		targetVector.y = (y - this._center.y)/this._radius; // Corrected: (y - center.y)
		targetVector.z = 0;
		var lengthSquared = targetVector.x * targetVector.x + targetVector.y * targetVector.y; // Use local var for squared length
		if(lengthSquared > 1){
			targetVector.normalize(); // Normalizes x and y, z remains 0.
		}else{
			targetVector.z = Math.sqrt(1-lengthSquared);
		}
		return targetVector;
	}
	
	/**
	 * Event handler for mouse down events.
	 * Captures the initial mouse position on the sphere and starts the drag operation.
	 *
	 * @method onMouseDown
	 * @param {number} mouseX - The current x-coordinate of the mouse.
	 * @param {number} mouseY - The current y-coordinate of the mouse.
	 * @returns {void}
	 */
	p.onMouseDown = function( mouseX, mouseY)
	{
		// Initialize this.startVector if it's not already, or pass it to be modified.
		this.coordinate2DToSphere(mouseX, mouseY, this.startVector );
		this.startDrag(); // startDrag uses this.startVector internally
	}
		
	/**
	 * Event handler for mouse move events.
	 * Updates the drag vector based on the current mouse position and applies the rotation.
	 *
	 * @method onMouseMove
	 * @param {number} mouseX - The current x-coordinate of the mouse.
	 * @param {number} mouseY - The current y-coordinate of the mouse.
	 * @returns {void}
	 */
	p.onMouseMove = function(mouseX, mouseY)
	{
		this.coordinate2DToSphere(mouseX,mouseY,this.dragVector);
		this.dragTo(); // dragTo uses this.dragVector internally
	}
	
	/**
	 * Multiplies two quaternions (q1 * q2) and stores the result in `out`.
	 * Quaternions are represented as `qlib.Vector3` objects (x,y,z for vector part, w for scalar part).
	 *
	 * @method multiplyQuats
	 * @param {qlib.Vector3} q1 - The first quaternion.
	 * @param {qlib.Vector3} q2 - The second quaternion.
	 * @param {qlib.Vector3} out - The `qlib.Vector3` instance to store the resulting quaternion.
	 * @returns {void}
	 */
	p.multiplyQuats = function(q1, q2, out)
	{
		out.x = q1.w*q2.x+q1.x*q2.w+q1.y*q2.z-q1.z*q2.y;
		out.y = q1.w*q2.y+q1.y*q2.w+q1.z*q2.x-q1.x*q2.z;
		out.z = q1.w*q2.z+q1.z*q2.w+q1.x*q2.y-q1.y*q2.x;
		out.w = q1.w*q2.w-q1.x*q2.x-q1.y*q2.y-q1.z*q2.z;
	}
		
	qlib["ArcBall"] = ArcBall;
	
})();