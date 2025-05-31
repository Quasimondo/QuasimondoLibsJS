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
window["qlib"] = window.qlib || {};

(function() {

/**
 * Represents an interactive UI handle, typically used to manipulate a `qlib.Vector2` point
 * on a canvas or other visual interface.
 * If `window.createjs` is available, `Handle` extends `createjs.Container` and uses
 * `createjs.Shape` for its visual representation. Otherwise, it functions as a basic
 * logical handle with a position.
 *
 * Handles can dispatch a `"change"` event (of type `qlib.Event`) when their underlying
 * point is modified through user interaction.
 *
 * @class Handle
 * @extends {createjs.Container} If `window.createjs` is available.
 * @param {number|qlib.Vector2} [arg1] - Optional. The initial x-coordinate of the handle's point,
 *                                       or a `qlib.Vector2` instance representing the point.
 *                                       If not provided, defaults to (0,0).
 * @param {number} [arg2] - Optional. The initial y-coordinate of the handle's point.
 *                          Used only if `arg1` is a number.
 */
	var Handle = function() {
	  this.initialize(arguments);
	}
	
	/**
	 * Defines the color scheme for the handle's visual states.
	 * The index for the color is determined by a bitwise OR of state flags:
	 * - `selected ? 4 : 0`
	 * - `mouseIsDown ? 2 : 0`
	 * - `mouseIsOver ? 1 : 0`
	 * For example:
	 * - Normal: index 0
	 * - Mouse Over: index 1
	 * - Mouse Down: index 2
	 * - Selected: index 4
	 * - Selected + Mouse Over: index 5
	 * etc.
	 * @static
	 * @property {string[]} colorScheme
	 * @default ["#000","#888","#fff","#fff","#ff8000","#ffe000","#ffff00","#ffff00"]
	 */
	Handle.colorScheme = ["#000","#888","#fff","#fff","#ff8000","#ffe000","#ffff00","#ffff00"];
	
	if ( window.createjs != null )
		var p = Handle.prototype = new createjs.Container();
	else
		var p = Handle.prototype;
		
	
	/**
	 * Reference to the superclass's initialize method.
	 * If `createjs.Container` is available, this is `Container.prototype.initialize`.
	 * Called internally during `Handle` initialization.
	 * @method Container_initialize
	 * @protected
	 * @type {Function}
	 **/
	p.Container_initialize = p.initialize; // Preserves superclass initialize

	/**
	 * Initializes the Handle instance. Called by the constructor.
	 * Sets up the handle's associated `qlib.Vector2` point, its visual representation (`grabber`),
	 * and initial properties.
	 *
	 * @method initialize
	 * @protected
	 * @param {IArguments} args - The arguments passed to the constructor.
	 *   - No arguments: Initializes `point` to `new qlib.Vector2(0,0)`.
	 *   - `(x: number, y: number)`: Initializes `point` to `new qlib.Vector2(x,y)`.
	 *   - `(point: qlib.Vector2)`: Initializes `point` with the given `qlib.Vector2` instance.
	 * @returns {void}
	 */
	p.initialize = function( args ) 
	{
		if (this.Container_initialize) this.Container_initialize(); // Call superclass initialize if available

		/**
		 * The underlying `qlib.Vector2` data point that this handle represents or controls.
		 * Modifying this point directly will require calling `updatePositionFromPoint()`
		 * to update the handle's visual position if it's a `createjs.Container`.
		 * @property {qlib.Vector2} point
		 */
		if ( args.length == 0 )
		{
			this.point = new qlib.Vector2();
		} else if ( typeof args[0] == "number" )
		{		
			this.point = new qlib.Vector2( args[0], args[1] );
		} else {
			this.point = args[0];
		}

		/**
		 * The visual representation of the handle.
		 * If `window.createjs` is available, this is a `createjs.Shape` object.
		 * Otherwise, it's a plain empty object, and drawing methods will not have a visual effect.
		 * @property {createjs.Shape|Object} grabber
		 */
		this.grabber = (window.createjs != null ? new createjs.Shape() : {});
		if (this.addChild) this.addChild( this.grabber ); // Add grabber to display list if Handle is a Container
		
		/**
		 * The size (width and height) of the handle's visual representation (the grabber).
		 * @property {number} HANDLE_SIZE
		 * @default 7
		 */
		this.HANDLE_SIZE = 7;
		
		/**
		 * Indicates whether the handle is currently interactive and can respond to mouse events.
		 * @property {boolean} active
		 * @default false
		 */
		this.active = false;
		/**
		 * True if the mouse button is currently pressed down over this handle.
		 * @property {boolean} mouseIsDown
		 * @default false
		 */
		this.mouseIsDown = false;
		/**
		 * True if the mouse cursor is currently hovering over this handle.
		 * @property {boolean} mouseIsOver
		 * @default false
		 */
		this.mouseIsOver = false;
		/**
		 * True if the handle is in a "selected" state, which can affect its appearance.
		 * @property {boolean} selected
		 * @default false
		 */
		this.selected = false;
		
		// Set initial position if Handle is a Container (from createjs)
		if (this.x !== undefined) this.x = this.point.x;
		if (this.y !== undefined) this.y = this.point.y;

		/**
		 * The CSS cursor style to display when the mouse is over this handle.
		 * Relevant if this handle is part of an HTML/DOM context where cursors apply (e.g., EaselJS stage).
		 * @property {string} cursor
		 * @default "pointer"
		 */
		this.cursor = "pointer";
		this.updateGrabber();
	}
	
	/**
	 * Activates or deactivates the handle's interactivity.
	 * When activated, the handle listens for mouse events (mousedown, mouseover, mouseout)
	 * to change its state and allow dragging. Dragging the handle will update its
	 * associated `point` and dispatch a `"change"` event of type `qlib.Event`.
	 *
	 * @method setActive
	 * @param {boolean} value - True to activate the handle, false to deactivate.
	 * @returns {void}
	 */
	p.setActive = function( value )
	{
		this.active = value;
		if ( value && this.addEventListener) // Check if addEventListener is available (from CreateJS)
		{
			var self = this; // Store reference to 'this' for use in event handlers
			this.addEventListener("mousedown", function(evt) {
				var o = self; // Use stored reference
				o.mouseIsDown = true;
				o.updateGrabber();
				// Calculate offset from handle's current position to mouse stage position
				var offset = {x:o.x-evt.stageX, y:o.y-evt.stageY};

				evt.addEventListener("mousemove", function(ev) {
					// o.lastOffset = { x: (ev.stageX+offset.x) -  o.point.x, y: ( ev.stageY+offset.y) - o.point.y}; // lastOffset not used elsewhere
					o.point.x = o.x = ev.stageX+offset.x;
					o.point.y = o.y = ev.stageY+offset.y;
					
					if (o.dispatchEvent) o.dispatchEvent( new qlib.Event( "change", o ) );
				});
				
				evt.addEventListener("mouseup", function(ev) {
					o.mouseIsDown = false;
					o.updateGrabber();
				});
			});
			
			this.addEventListener("mouseover", function(evt) {
				var o = self;
				o.mouseIsOver = true;
				o.updateGrabber();
			});
			
			this.addEventListener("mouseout", function(evt) {
				var o = self;
				o.mouseIsOver = false;
				o.updateGrabber();
			});
		
		} else if (this.removeEventListener) { // Check if removeEventListener is available
			// Consider removing specific listeners if they were stored,
			// but current EaselJS removeEventListener by type might be okay if these are the only "mousedown" listeners.
			this.removeEventListener("mousedown");
			this.removeEventListener("mouseover");
			this.removeEventListener("mouseout");
		}
	}
	
	
	/**
	 * Redraws the visual representation of the handle (`grabber`) based on its current state
	 * (`selected`, `mouseIsDown`, `mouseIsOver`) using the `Handle.colorScheme`.
	 * This method requires `createjs` to be available for `grabber.graphics` to work.
	 *
	 * @method updateGrabber
	 * @returns {void}
	 */
	p.updateGrabber = function()
	{
		if (!window.createjs || !this.grabber || !this.grabber.graphics) return; // Only run if createjs and grabber are available

		var g = this.grabber.graphics;
		g.clear();
		g.setStrokeStyle(1, 'round', 'round');
	    g.beginStroke("#fff"); // White border for all states
		
		var colorIndex = (this.selected ? 4 : 0) | (this.mouseIsDown ? 2 : 0) | (this.mouseIsOver ? 1 : 0);
		g.beginFill( Handle.colorScheme[colorIndex] );
		g.drawRect( - this.HANDLE_SIZE *0.5, - this.HANDLE_SIZE*0.5, this.HANDLE_SIZE, this.HANDLE_SIZE );
		g.endFill();
	}
	
	/**
	 * Sets the position of the handle and its underlying `point`.
	 * The handle's visual position (if it's a `createjs.Container`) is rounded to the nearest integer.
	 *
	 * @method setPosition
	 * @param {number} x - The new x-coordinate.
	 * @param {number} y - The new y-coordinate.
	 * @returns {void}
	 */
	p.setPosition = function( x, y )
	{
		this.point.x =  x;
		this.point.y =  y;
		if (this.x !== undefined) this.x = Math.round( x );
		if (this.y !== undefined) this.y = Math.round( y );
	}
		
	/**
	 * Updates the handle's underlying `point` and its visual position from another `qlib.Vector2` instance.
	 * The handle's visual position is rounded.
	 *
	 * @method updatePoint
	 * @param {qlib.Vector2} p - The `qlib.Vector2` instance containing the new coordinates.
	 * @returns {void}
	 */
	p.updatePoint = function( p )
	{
		this.point.x =  p.x;
		this.point.y =  p.y;
		if (this.x !== undefined) this.x = Math.round( p.x );
		if (this.y !== undefined) this.y = Math.round( p.y );
	}
	
	/**
	 * Updates the handle's visual position (if it's a `createjs.Container`) based on its
	 * current `point` coordinates. The visual position is rounded.
	 *
	 * @method updatePositionFromPoint
	 * @returns {void}
	 */
	p.updatePositionFromPoint = function( )
	{
		if (this.x !== undefined) this.x = Math.round( this.point.x );
		if (this.y !== undefined) this.y = Math.round( this.point.y );
	}
		
	/**
	 * Sets the handle's underlying `qlib.Vector2` point to a new instance `p`.
	 * Also updates the handle's visual position based on the new point's coordinates (rounded).
	 *
	 * @method setPoint
	 * @param {qlib.Vector2} p - The new `qlib.Vector2` instance to associate with this handle.
	 * @returns {void}
	 */
	p.setPoint = function( p )
	{
		this.point = p;
		if (this.x !== undefined) this.x = Math.round(  p.x );
		if (this.y !== undefined) this.y = Math.round(  p.y );
	}

	/**
	 * Returns a string representation of this Handle object.
	 *
	 * @method toString
	 * @return {string} A string representation of the instance, typically "Handle".
	 **/
	p.toString = function() {
		return "Handle";
	}
	
	qlib["Handle"] = Handle;
}());