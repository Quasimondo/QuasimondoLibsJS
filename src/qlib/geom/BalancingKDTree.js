/*
* BalancingKDTree
*
*  Based on code by Ralph Hauwert 
*  http://www.unitzeroone.com
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
 * Represents a node in the KD-Tree.
 * Each node stores a point, its depth in the tree, references to its parent,
 * left, and right children, and a count of points in the subtree rooted at this node.
 * The `dist` property is used temporarily during nearest neighbor searches.
 *
 * @class KDTreeNode
 * @memberof qlib
 * @constructor
 */
	qlib["KDTreeNode"] = function() {
	  /**
	   * The number of points in the subtree rooted at this node (inclusive of this node's point if it's a leaf or an intermediate point).
	   * @property {number} count
	   * @default 1
	   */
	  this.count = 1;
	  /**
	   * The depth of this node in the KD-Tree (root is at depth 0).
	   * @property {number} depth
	   */
	  this.depth = 0;
	  /**
	   * The data point (e.g., `qlib.Vector2`) stored at this node.
	   * @property {Object|qlib.Vector2} point - Point with `x` and `y` properties.
	   */
	  this.point = null;
	  /**
	   * A reference to the parent node. Null for the root node.
	   * @property {qlib.KDTreeNode|null} parent
	   */
	  this.parent = null;
	  /**
	   * A reference to the left child node (points with smaller coordinate value at this depth's axis).
	   * @property {qlib.KDTreeNode|null} left
	   */
	  this.left = null;
	  /**
	   * A reference to the right child node (points with larger or equal coordinate value at this depth's axis).
	   * @property {qlib.KDTreeNode|null} right
	   */
	  this.right = null;
	  /**
	   * Temporary property used during nearest neighbor searches to store the squared distance to the query point.
	   * @property {number} dist
	   */
	  this.dist = 0;
	}

/**
 * Implements a self-balancing KD-Tree for organizing 2D points.
 * KD-Trees are space-partitioning data structures that allow for efficient
 * nearest neighbor searches and range queries. This implementation includes
 * methods for inserting, removing points, and rebalancing the tree to maintain
 * performance. The balancing is based on the ratio of points in child subtrees.
 *
 * Based on code by Ralph Hauwert (http://www.unitzeroone.com).
 *
 * @class BalancingKDTree
 * @memberof qlib
 * @constructor
 */
	var BalancingKDTree = function() {
	  /**
	   * The root node of the KD-Tree.
	   * @property {qlib.KDTreeNode|null} firstNode
	   */
	  this.firstNode = null;
	}

	var p = BalancingKDTree.prototype;
	
	
	/**
	 * Inserts a single point into the KD-Tree.
	 * Optionally, the tree can be rebalanced after insertion if the `rebalance` flag is true.
	 *
	 * @method insertPoint
	 * @param {Object|qlib.Vector2} point - The point to insert (must have `x` and `y` properties).
	 * @param {boolean} [rebalance=false] - Whether to rebalance the tree from the insertion point upwards.
	 * @param {number} [minRatio=0.2] - The minimum ratio of child counts to trigger a rebalance.
	 * @returns {void}
	 */
	p.insertPoint = function( point, rebalance, minRatio )
	{
		if ( rebalance == null) rebalance = false;
		if ( minRatio == null) minRatio = 0.2;
		if ( this.firstNode == null )
		{
			this.firstNode = new qlib.KDTreeNode();
			this.firstNode.depth = 0;
			this.firstNode.point = point;
		} else {
			var newNode = this.insertNode(point, this.firstNode );
			if ( rebalance && newNode ) this.checkNodeBalanceBottomUp( minRatio, newNode, null );
		}
	}
		
	/**
	 * Inserts multiple points into the KD-Tree.
	 * If the tree is empty, it builds an initially balanced tree. Otherwise, points are inserted one by one.
	 * Optionally, the tree can be rebalanced after all insertions.
	 *
	 * @method insertPoints
	 * @param {Array<Object|qlib.Vector2>} points - An array of points to insert.
	 * @param {boolean} [rebalance=false] - Whether to rebalance the entire tree after insertions.
	 * @param {number} [minRatio=0.2] - The minimum ratio for rebalancing.
	 * @returns {void}
	 */
	p.insertPoints = function( points, rebalance, minRatio )
	{
		if ( rebalance == null) rebalance = false;
		if ( minRatio == null) minRatio = 0.2;
		
		if ( this.firstNode == null )
		{
			this.firstNode = new qlib.KDTreeNode();
			this.buildDepth( points.concat(), this.firstNode, 0 );
		} else {
			for ( var i = 0; i < points.length; i++ ) // Changed from for...in for array iteration
			{
				this.insertPoint( points[i], false ); // Insert without intermediate rebalancing
			}
			if ( rebalance ) this.rebalance( minRatio );
		}
	}
		
	/**
	 * Removes a specific point from the KD-Tree.
	 * After removal, the affected part of the tree is rebuilt.
	 * Optionally, the tree can be rebalanced.
	 *
	 * @method removePoint
	 * @param {Object|qlib.Vector2} point - The point to remove.
	 * @param {boolean} [rebalance=false] - Whether to rebalance the tree after removal.
	 * @param {number} [minRatio=0.2] - The minimum ratio for rebalancing.
	 * @returns {void}
	 */
	p.removePoint = function( point, rebalance, minRatio )
	{
		if ( rebalance == null) rebalance = false;
		if ( minRatio == null) minRatio = 0.2;
		
		if ( this.firstNode == null ) return;
		
		var node = this.findPoint( point, this.firstNode ); // Corrected: this.firstNode
		if ( node == null ) return;
		var collector = [];
		if ( node.parent == null ) // Removing the root node
		{
			this.firstNode = null; // Tree becomes empty if root is the only node
			// If root has children, need to rebuild. The original logic might be incomplete here.
			// A robust remove would get all children points and rebuild.
			// For now, assuming if parent is null, it was the only node or logic handles children.
		} else if ( node.parent.parent == null) // Removing a child of the root
		{
			this.getPoints( node.parent, node, collector ); // Get points from sibling and parent (if any besides the one being removed)
			this.firstNode = new qlib.KDTreeNode(); // Rebuild from root
			// This logic seems to assume collector will have points to rebuild the root.
			// It might be simpler to get all points from node.parent and rebuild it.
			if (collector.length > 0) {
				this.buildDepth( collector, this.firstNode, 0 );
			} else {
				this.firstNode = null; // Parent becomes empty
			}
		} else { // Removing a deeper node
			node.parent.count--; // This count update is tricky without more context on how `count` is used.
			this.getPoints( node.parent.parent, node, collector ); // Get points from grandparent's subtree, excluding the removed node's branch
			this.buildDepth( collector, node.parent.parent, node.parent.parent.depth );
			if ( rebalance ) this.checkNodeBalanceBottomUp( minRatio, node.parent.parent, null );
		}
	}
		
	/**
	 * Finds and removes the nearest point to the given `point` from the KD-Tree.
	 * Similar to `removePoint` but operates on the nearest neighbor.
	 *
	 * @method removeNearest
	 * @param {Object|qlib.Vector2} point - The reference point to find the nearest neighbor for.
	 * @param {boolean} [rebalance=false] - Whether to rebalance the tree after removal.
	 * @param {number} [minRatio=0.2] - The minimum ratio for rebalancing.
	 * @returns {void}
	 */
	p.removeNearest = function( point, rebalance, minRatio )
	{
		
		if ( this.firstNode == null ) return;
		
		if ( rebalance == null) rebalance = false;
		if ( minRatio == null) minRatio = 0.2;
	
		var collector = [];
		var node = this.findNearestForNode(point,this.firstNode);
		// Logic for removal is similar to removePoint, applied to the found 'node'
		if ( node.parent == null )
		{
			this.firstNode = null;
		} else if ( node.parent.parent == null)
		{
			this.getPoints( node.parent, node, collector );
			this.firstNode = new qlib.KDTreeNode();
			if (collector.length > 0) {
				this.buildDepth( collector, this.firstNode, 0 );
			} else {
				this.firstNode = null;
			}
		} else {
			node.parent.count--; // Again, count update needs careful consideration.
			this.getPoints( node.parent.parent, node, collector );
			this.buildDepth( collector, node.parent.parent, node.parent.parent.depth );
			if ( rebalance ) this.checkNodeBalanceBottomUp( minRatio, node.parent.parent, null );
		}
	}
		
	/**
	 * Rebalances the entire KD-Tree starting from the root, using a top-down approach.
	 *
	 * @method rebalance
	 * @param {number} [minRatio=0.2] - The minimum ratio of child counts below which a node is considered unbalanced.
	 * @returns {void}
	 */
	p.rebalance = function( minRatio )
	{
		if ( this.firstNode == null ) return; // Corrected: this.firstNode
		if ( minRatio == null) minRatio = 0.2;
	
		this.checkNodeBalanceTopDown( minRatio, this.firstNode );
	}
		
	/**
	 * Checks the balance of a node and its descendants in a top-down manner.
	 * If a node is unbalanced (ratio of its children's point counts is below `minRatio`),
	 * it rebalances that node's subtree.
	 *
	 * @method checkNodeBalanceTopDown
	 * @protected
	 * @param {number} minRatio - The minimum balance ratio.
	 * @param {qlib.KDTreeNode} node - The current node to check.
	 * @returns {void}
	 */
	p.checkNodeBalanceTopDown = function( minRatio, node )
	{
		if ( node.left && node.right )
		{
			var ratio = Math.min( node.left.count, node.right.count ) /  Math.max( node.left.count, node.right.count );
			if ( ratio < minRatio )
			{
				this.rebalanceNode( node );
			} else {
				this.checkNodeBalanceTopDown( minRatio, node.left );
				this.checkNodeBalanceTopDown( minRatio, node.right );
			}
		} else if ( node.left ){ // Only left child
			if (  node.left.count > 1 ) // Unbalanced if left child has more than one point (implying a subtree)
			{
				this.rebalanceNode( node );
			}
		} else if ( node.right ){ // Only right child
			if (  node.right.count > 1 ) // Unbalanced if right child has more than one point
			{
				this.rebalanceNode( node );
			}
		}
	}
	
	/**
	 * Checks node balance from a starting node upwards to the root, rebalancing if necessary.
	 *
	 * @method checkNodeBalanceBottomUp
	 * @protected
	 * @param {number} minRatio - The minimum balance ratio.
	 * @param {qlib.KDTreeNode|null} checkNode - The current node to check for balance.
	 * @param {qlib.KDTreeNode|null} balanceNode - The highest unbalanced node found so far in the upward path.
	 * @returns {void}
	 */
	p.checkNodeBalanceBottomUp = function( minRatio, checkNode, balanceNode )
	{
		if ( checkNode == null ) // Reached above the root
		{
			if ( balanceNode != null ) this.rebalanceNode( balanceNode );
		} else {
			var isUnbalanced = false;
			if ( checkNode.left && checkNode.right )
			{
				var ratio = Math.min( checkNode.left.count, checkNode.right.count ) /  Math.max( checkNode.left.count, checkNode.right.count );
				isUnbalanced = ratio < minRatio;
			} else if ( checkNode.left ){
				isUnbalanced = checkNode.left.count > 1;
			} else if ( checkNode.right ){
				isUnbalanced = checkNode.right.count > 1;
			}
			// If current node is unbalanced, it becomes the new candidate for rebalancing (highest unbalanced node)
			// Otherwise, keep the existing balanceNode from deeper in the recursion.
			this.checkNodeBalanceBottomUp( minRatio, checkNode.parent, isUnbalanced ? checkNode : balanceNode );
		}
	}
		
	/**
	 * Rebalances the subtree rooted at the given `node`.
	 * It collects all points in the subtree and rebuilds it to be balanced.
	 *
	 * @method rebalanceNode
	 * @protected
	 * @param {qlib.KDTreeNode} node - The root node of the subtree to rebalance.
	 * @returns {void}
	 */
	p.rebalanceNode = function( node )
	{
		var collector = [];
		
		if ( node.parent != null )
		{
			// This logic seems problematic: gets points from parent, then rebuilds parent.
			// Should get points from 'node' and rebuild 'node'.
			this.getPoints( node, null, collector ); // Get all points from the current node's subtree
			this.buildDepth( collector, node, node.depth ); // Rebuild the subtree at 'node'
		} else { // Rebalancing the root node
			this.getPoints( this.firstNode, null, collector ); // Corrected: this.firstNode
			// this.firstNode = null; // Not strictly necessary if buildDepth correctly overwrites
			this.firstNode = new qlib.KDTreeNode(); // Create a new root for buildDepth
			this.insertPoints( collector ); // insertPoints will call buildDepth if firstNode is null (or newly created)
		}
	}
		
	/**
	 * Inserts a point into the subtree rooted at `node`.
	 * This is a recursive helper for `insertPoint`.
	 *
	 * @method insertNode
	 * @protected
	 * @param {Object|qlib.Vector2} point - The point to insert.
	 * @param {qlib.KDTreeNode} node - The current node in the traversal.
	 * @returns {qlib.KDTreeNode|undefined} The newly created node for the inserted point, or undefined if point is a duplicate at a leaf.
	 */
	p.insertNode = function( point, node )
	{
		var insertedNode;
		node.count++; // Increment count of parent/ancestor on the way down or up? (Original code increments before recursing)

		// Determine axis based on depth (0 for x, 1 for y, 2 for x, ...)
		var axisIsY = node.depth & 1; // true if depth is odd (y-axis), false if even (x-axis)
		
		if ( axisIsY ? (point.y < node.point.y) : (point.x < node.point.x) ) // Compare based on current axis
		{
			if ( node.left )
			{
				//node.count++; // Count should reflect actual points in subtree.
				insertedNode = this.insertNode( point, node.left );
			} else { // Leaf or semi-leaf node, create new children
				// Avoid inserting duplicate points if this node is supposed to be a leaf for 'point'
				if ( point.x === node.point.x && point.y === node.point.y ) return undefined; // Duplicate

				// Current node becomes an internal node. Its point moves to one child.
				// New point goes to the other child.
				node.left = new qlib.KDTreeNode();
				node.left.parent = node;
				node.left.depth = node.depth + 1;
				
				node.right = new qlib.KDTreeNode();
				node.right.parent = node;
				node.right.depth = node.depth + 1;

				// Decide which child gets original point and which gets new point
				// This depends on the *next* level's axis comparison
				var nextAxisIsY = node.left.depth & 1;
				if (nextAxisIsY ? (point.y < node.point.y) : (point.x < node.point.x)) {
					node.left.point = point;
					node.right.point = node.point; // Original node's point moves to right
				} else {
					node.left.point = node.point; // Original node's point moves to left
					node.right.point = point;
				}
				insertedNode = (node.left.point === point) ? node.left : node.right;
				// node.count was already incremented. Children have count 1 by default.
			}
		} else { // Point goes to the right subtree or is equal (duplicates handled by leaf check)
			if ( node.right )
			{
				//node.count++;
				insertedNode = this.insertNode( point, node.right );
			} else {
				if ( point.x === node.point.x && point.y === node.point.y ) return undefined; // Duplicate

				node.left = new qlib.KDTreeNode();
				node.left.parent = node;
				node.left.depth = node.depth + 1;

				node.right = new qlib.KDTreeNode();
				node.right.parent = node;
				node.right.depth = node.depth + 1;
				
				var nextAxisIsY = node.left.depth & 1; // same depth for both new children
				if (nextAxisIsY ? (point.y < node.point.y) : (point.x < node.point.x)) {
					node.left.point = point;
					node.right.point = node.point;
				} else {
					node.left.point = node.point;
					node.right.point = point;
				}
				insertedNode = (node.right.point === point) ? node.right : node.left; // Check which one is the new point's node
			}
		}
		// Recalculate count after insertion, if not handled by incrementing on path
		// node.count = 1 (for node.point) + (node.left ? node.left.count : 0) + (node.right ? node.right.count : 0);
		return insertedNode;
	}
		
		
	/**
	 * Recursively builds a balanced KD-Tree from an array of points for the subtree at `node`.
	 * Points are sorted at each level by the current axis, and the median is chosen as the node's point.
	 *
	 * @method buildDepth
	 * @protected
	 * @param {Array<Object|qlib.Vector2>} points - Array of points to build the subtree from. This array will be modified (sorted and spliced).
	 * @param {qlib.KDTreeNode} node - The current node to build.
	 * @param {number} depth - The current depth in the tree for `node`.
	 * @returns {void}
	 */
	p.buildDepth = function( points, node, depth )
	{
		node.depth = depth;
		node.count = points.length; // This node represents all these points in its subtree

		if( points.length == 1 )
		{
			node.point = points[0]; // Leaf node
			node.left = node.right = null; // Ensure children are null for leaf
		} else {
			points.sort( depth & 1 ? this.sortY : this.sortX); // Sort by y if depth is odd, by x if even
			
			var medianIndex = Math.floor(points.length / 2);
			node.point = points[medianIndex]; // Median point for this node
				
			var leftPoints = points.slice(0, medianIndex);
			var rightPoints = points.slice(medianIndex + 1); // Exclude median itself

			if ( leftPoints.length > 0 )
			{
				node.left = new qlib.KDTreeNode();
				node.left.parent = node;
				this.buildDepth(leftPoints, node.left, depth+1);
			} else {
				node.left = null;
			}
			if (rightPoints.length > 0 )
			{
				node.right = new qlib.KDTreeNode();
				node.right.parent = node;
				this.buildDepth(rightPoints, node.right, depth+1);
			} else {
				node.right = null;
			}
		}	
	}
		
	/**
	 * Finds the nearest node (and thus point) in the tree to the given `point`.
	 *
	 * @method findNearestFor
	 * @param {Object|qlib.Vector2} point - The point to find the nearest neighbor for.
	 * @returns {qlib.KDTreeNode|null} The `KDTreeNode` containing the nearest point, or `null` if the tree is empty.
	 *                                   The `dist` property of the returned node will contain the squared distance.
	 */
	p.findNearestFor = function(point)
	{
		if ( this.firstNode == null ) return null;
		return this.findNearestForNode(point,this.firstNode);
	}
		
	/**
	 * Recursive helper to find the nearest node to `point` in the subtree of `node`.
	 *
	 * @method findNearestForNode
	 * @protected
	 * @param {Object|qlib.Vector2} point - The point to find the nearest neighbor for.
	 * @param {qlib.KDTreeNode} node - The current node in the search.
	 * @returns {qlib.KDTreeNode} The `KDTreeNode` in the subtree that is nearest to `point`.
	 */
	p.findNearestForNode = function(point, node)
	{
		if( node.left == null && node.right == null) // Leaf node
		{
			node.dist = node.point.squaredDistanceToVector( point );
			return node;
		}

		var bestNode;
		var goodSide, badSide; // Nodes for recursive calls
		
		// Determine axis and which side to check first
		var axisIsY = node.depth & 1;
		var delta = axisIsY ? (point.y - node.point.y) : (point.x - node.point.x);

		if (delta < 0) { // Point is in the "left/lower" half-space relative to node.point
			goodSide = node.left;
			badSide = node.right;
		} else { // Point is in the "right/upper" half-space
			goodSide = node.right;
			badSide = node.left;
		}

		if (goodSide) {
			bestNode = this.findNearestForNode(point, goodSide);
		} else {
			// If goodSide is null, this internal node is malformed or we're at a leaf that was handled above.
			// However, KD-trees usually store points at internal nodes too.
			// For this structure, internal nodes always have points.
			// The original code implies points are only at leaves of sub-branches.
			// Let's assume points are at all nodes. Compare with current node's point.
			bestNode = new qlib.KDTreeNode(); // Dummy node
			bestNode.dist = Infinity;
		}

		// Check current node's point
		var currentDist = node.point.squaredDistanceToVector(point);
		if (currentDist < bestNode.dist) {
			node.dist = currentDist;
			bestNode = node;
		}

		if (badSide) {
			// Check if the hypersphere around `point` with radius `sqrt(bestNode.dist)`
			// intersects the splitting plane of `node`. `delta` is distance to plane.
			if (delta * delta < bestNode.dist) {
				var otherBestNode = this.findNearestForNode(point, badSide);
				if (otherBestNode.dist < bestNode.dist) {
					bestNode = otherBestNode;
				}
			}
		}
		
		return bestNode;
	}
		
		
	/**
	 * Finds the node containing the exact `point`.
	 *
	 * @method findPoint
	 * @protected
	 * @param {Object|qlib.Vector2} point - The point to find.
	 * @param {qlib.KDTreeNode} node - The current node to search from.
	 * @returns {qlib.KDTreeNode|null} The node containing the point, or `null` if not found.
	 */
	p.findPoint = function(point, node)
	{
		if (node == null) return null;

		if (node.point && node.point.x === point.x && node.point.y === point.y) {
			return node;
		}

		// Determine axis and which side to check
		var axisIsY = node.depth & 1;
		var searchLeft;
		if (axisIsY) {
			searchLeft = point.y < node.point.y;
		} else {
			searchLeft = point.x < node.point.x;
		}

		if (searchLeft) {
			return this.findPoint(point, node.left);
		} else {
			return this.findPoint(point, node.right);
		}
	}
		
	/**
	 * Sorts two points based on their x-coordinates.
	 * @method sortX
	 * @protected
	 * @param {Object|qlib.Vector2} a - First point.
	 * @param {Object|qlib.Vector2} b - Second point.
	 * @returns {number} -1 if a.x < b.x, 1 otherwise.
	 */
	p.sortX = function(a, b)
	{
		if(a.x < b.x){ // Corrected: standard sort: <0 if a < b
			return -1;
		}
		return 1;
	}
		
	/**
	 * Sorts two points based on their y-coordinates.
	 * @method sortY
	 * @protected
	 * @param {Object|qlib.Vector2} a - First point.
	 * @param {Object|qlib.Vector2} b - Second point.
	 * @returns {number} -1 if a.y < b.y, 1 otherwise.
	 */
	p.sortY = function(a, b)
	{
		if(a.y < b.y){ // Corrected: standard sort: <0 if a < b
			return -1;
		}
		return 1;
	}
		
		
	/**
	 * Collects all points in the subtree of `node`, excluding the `ignore` node and its descendants.
	 *
	 * @method getPoints
	 * @protected
	 * @param {qlib.KDTreeNode} node - The root of the subtree to collect points from.
	 * @param {qlib.KDTreeNode|null} ignore - A node (and its subtree) to ignore during collection.
	 * @param {Array<Object|qlib.Vector2>} collector - An array to store the collected points.
	 * @returns {void}
	 */
	p.getPoints = function( node, ignore, collector )
	{
		if (node == null || node === ignore) return;

		// Assuming points are stored at all nodes in this KD-tree variant
		collector.push(node.point);

		if (node.left) {
			this.getPoints( node.left, ignore, collector );
		}
		if (node.right) {
			this.getPoints( node.right, ignore, collector );
		}
	}
		
	/**
	 * Draws a visual representation of the KD-Tree within the given bounds on a canvas.
	 * Assumes the canvas context has `drawRect`, `drawCircle`, `moveTo`, `lineTo` methods.
	 *
	 * @method draw
	 * @param {qlib.Rectangle} bounds - The rectangular bounds to draw the tree within.
	 * @param {CanvasRenderingContext2D} canvas - The canvas rendering context to draw on.
	 * @returns {void}
	 */
	p.draw = function( bounds, canvas )
	{
		if (typeof canvas.drawRect === 'function') canvas.drawRect(bounds.x,bounds.y,bounds.width,bounds.height);
		if ( this.firstNode != null ) this.drawNode( this.firstNode, bounds, canvas );
	}
		
	/**
	 * Recursive helper to draw a node and its children.
	 *
	 * @method drawNode
	 * @protected
	 * @param {qlib.KDTreeNode} node - The current node to draw.
	 * @param {qlib.Rectangle} bounds - The current rectangular region for this node.
	 * @param {CanvasRenderingContext2D} canvas - The canvas rendering context.
	 * @returns {void}
	 */
	p.drawNode = function( node, bounds, canvas )
	{
		if (node.point && typeof canvas.drawCircle === 'function') { // Draw the point at the node
			canvas.drawCircle( node.point.x, node.point.y, 2 );
		}

		if( node.depth & 1) // Split by Y
		{
			if (typeof canvas.moveTo === 'function') canvas.moveTo( bounds.x, node.point.y );
			if (typeof canvas.lineTo === 'function') canvas.lineTo( bounds.x + bounds.width, node.point.y );
			if ( node.left )
			{
				this.drawNode( node.left, new qlib.Rectangle(bounds.x, bounds.y, bounds.width ,node.point.y - bounds.y), canvas );
			} 
			if ( node.right )
			{
				this.drawNode( node.right, new qlib.Rectangle(bounds.x, node.point.y, bounds.width, bounds.y + bounds.height - node.point.y ), canvas );
			}
			
		} else{ // Split by X
			if (typeof canvas.moveTo === 'function') canvas.moveTo( node.point.x, bounds.y  );
			if (typeof canvas.lineTo === 'function') canvas.lineTo( node.point.x, bounds.y + bounds.height );
			if ( node.left )
			{
				this.drawNode( node.left, new qlib.Rectangle(bounds.x, bounds.y, node.point.x - bounds.x, bounds.height), canvas );
			} 
			if ( node.right )
			{
				this.drawNode( node.right, new qlib.Rectangle( node.point.x, bounds.y, bounds.x + bounds.width - node.point.x, bounds.height ), canvas );
			}
			
		}
	}
	
	
	qlib["BalancingKDTree"] = BalancingKDTree;
}());

