/*
* Circle
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


	var Handle = function() {
	  this.initialize(arguments);
	}
	
	var p = Handle.prototype = new createjs.Container();
	
	Handle.colorScheme = ["#000","#888","#fff","#fff","#ff8000","#ffe000","#ffff00","#ffff00"];
	
	/**
	 * @property DisplayObject_initialize
	 * @type Function
	 * @private
	 **/
	p.Container_initialize = p.initialize;

	p.initialize = function( args ) 
	{
		this.Container_initialize();
		if ( args.length == 0 )
		{
			//arguments: none
			this.point = new qlib.Vector2();
		} else if ( typeof args[0] == "number" )
		{		
			//arguments: center x, center y
			this.point = new qlib.Vector2( args[0], args[1] );
		} else {
			//arguments: center
			this.point = args[0];
		}
		this.grabber = new createjs.Shape();
		this.addChild( this.grabber );
		
		this.HANDLE_SIZE = 7;
		
		this.active = false;
		this.mouseIsDown = false;
		this.mouseIsOver = false;
		this.selected = false;
		
		this.x = this.point.x;
		this.y = this.point.y;
		this.cursor = "pointer";
		this.updateGrabber();
	}
	
	p.setActive = function( value )
	{
		this.active = value;
		if ( value )
		{
			
			this.addEventListener("mousedown", function(evt) {
				
				// bump the target in front of it's siblings:
				var o = evt.target;
				o.mouseIsDown = true;
				o.updateGrabber();
				var offset = {x:o.x-evt.stageX, y:o.y-evt.stageY};

				// add a listener to the event object's mouseMove event
				// this will be active until the user releases the mouse button:
				evt.addEventListener("mousemove", function(ev) {
					o.lastOffset = { x: (ev.stageX+offset.x) -  o.point.x, y: ( ev.stageY+offset.y) - o.point.y};
					o.point.x = o.x = ev.stageX+offset.x;
					o.point.y = o.y = ev.stageY+offset.y;
					
					o.dispatchEvent(  new qlib.Event( "change", o ) );
					// indicate that the stage should be updated on the next tick:
					
				});
				
				evt.addEventListener("mouseup", function(ev) {
					o.mouseIsDown = false;
					o.updateGrabber();
					// indicate that the stage should be updated on the next tick:
					
				});
				
			});
			
			this.addEventListener("mouseover", function(evt) {
				var o = evt.target;
				o.mouseIsOver = true;
				o.updateGrabber();
			});
			
			this.addEventListener("mouseout", function(evt) {
				var o = evt.target;
				o.mouseIsOver = false;
				o.updateGrabber();
			});
		
			
		} else {
			this.removeEventListener("mousedown");
		}
	}
	
	
	
	p.updateGrabber = function()
	{
		var g = this.grabber.graphics;
		g.clear();
		g.setStrokeStyle(1, 'round', 'round');
	    g.beginStroke("#fff");
		
		
		g.beginFill(  Handle.colorScheme[(this.selected ? 4 : 0) | (this.mouseIsDown ? 2 : 0) | (this.mouseIsOver ? 1 : 0)] );
		g.drawRect( - this.HANDLE_SIZE *0.5, - this.HANDLE_SIZE*0.5, this.HANDLE_SIZE, this.HANDLE_SIZE );
		g.endFill();
	}
	
	p.setPosition = function( x, y )
	{
		this.point.x =  x;
		this.point.y =  y;
		this.x = Math.round( x );
		this.y = Math.round( y );
	}
		
	p.updatePoint = function( p )
	{
		this.point.x =  p.x;
		this.point.y =  p.y;
		this.x = Math.round( p.x );
		this.y = Math.round( p.y );
	}
	
	p.updatePositionFromPoint = function( )
	{
		this.x = Math.round( this.point.x );
		this.y = Math.round( this.point.y );
	}
		
	p.setPoint = function( p )
	{
		this.point = p;
		this.x = Math.round(  p.x );
		this.y = Math.round(  p.y );
	}

	/**
	 * Returns a string representation of this object.
	 * @method toString
	 * @return {String} a string representation of the instance.
	 **/
	p.toString = function() {
		return "Handle";
	}
	
qlib.Handle = Handle;
}());