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

	var ArcBall = function( matrix3D, center, radius )
	{
		this._radius = radius | 200;
		this._center = center;
		this._matrix3d = matrix3D;
		this.init();
	};
	
	var p = ArcBall.prototype; 
	
	p.init = function()
	{
		this.startVector = new qlib.Vector3();
		this.startQuat = new qlib.Vector3();
		this.dragQuat = new qlib.Vector3();
		this.dragVector = new qlib.Vector3();
		this.newQuat = new qlib.Vector3();
		this.radiusVector = new qlib.Vector3();
		this.transformComponents = [];
	}
	
	p.startDrag = function()
	{
		this.transformComponents = this._matrix3d.decompose(Orientation3D.QUATERNION);
		var quat = this.transformComponents[1];
		this.startQuat.x = quat.x;
		this.startQuat.y = quat.y;
		this.startQuat.z = quat.z;
		this.startQuat.w = quat.w;
		this.dragQuat.x = this.dragQuat.y = this.dragQuat.z = this.dragQuat.w = 0;
	}
	
	p.dragTo = function()
	{
		var v = this.startVector.crossProduct(this.dragVector);
		this.dragQuat.x = v.x;
		this.dragQuat.y = v.y;
		this.dragQuat.z = v.z;
		this.dragQuat.w = this.startVector.dotProduct(this.dragVector);
		this.multiplyQuats(this.dragQuat, this.startQuat, this.newQuat);
		this.transformComponents[1] = this.newQuat;
		this._matrix3d.recompose(this.transformComponents, Orientation3D.QUATERNION);
	}
	
	p.coordinate2DToSphere = function(x, y, targetVector)
	{
		targetVector.x = (this._center.x-x)/this._radius;
		targetVector.y = (this._center.y-y)/this._radius;
		targetVector.z = 0;
		if(targetVector.lengthSquared > 1){
			targetVector.normalize();
		}else{
			targetVector.z = Math.sqrt(1-targetVector.lengthSquared);
		}
		return targetVector;
	}
	
	p.onMouseDown = function( mouseX, mouseY)
	{
		this.startVector = this.coordinate2DToSphere(mouseX, mouseY, startVector );
		this.startDrag(this.startVector);
	}
		
	p.onMouseMove = function(mouseX, mouseY)
	{
		this.dragVector = this.coordinate2DToSphere(mouseX,mouseY,this.dragVector);
		this.dragTo(this.dragVector);
	}
	
	p.multiplyQuats = function(q1, q2, out)
	{
		out.x = q1.w*q2.x+q1.x*q2.w+q1.y*q2.z-q1.z*q2.y;
		out.y = q1.w*q2.y+q1.y*q2.w+q1.z*q2.x-q1.x*q2.z;
		out.z = q1.w*q2.z+q1.z*q2.w+q1.x*q2.y-q1.y*q2.x;
		out.w = q1.w*q2.w-q1.x*q2.x-q1.y*q2.y-q1.z*q2.z;
	}
		
	qlib["ArcBall"] = ArcBall;
	
})();