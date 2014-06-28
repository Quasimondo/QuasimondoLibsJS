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

	qlib["KDTreeNode"] = function() {
	  this.count = 1;
	}


	var BalancingKDTree = function() {
	  this.firstNode = null;
	}

	var p = BalancingKDTree.prototype;
	
	
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
			if ( rebalance ) this.checkNodeBalanceBottomUp( minRatio, newNode, null );
		}
	}
		
	p.insertPoints = function( points, rebalance, minRatio )
	{
		if ( rebalance == null) rebalance = false;
		if ( minRatio == null) minRatio = 0.2;
		
		if ( this.firstNode == null )
		{
			this.firstNode = new qlib.KDTreeNode();
			this.buildDepth( points.concat(), this.firstNode, 0 );
		} else {
			for ( var p in points )
			{
				this.insertPoint( points[p] );
			}
			if ( rebalance ) this.rebalance( minRatio );
		}
	}
		
	p.removePoint = function( point, rebalance, minRatio )
	{
		if ( rebalance == null) rebalance = false;
		if ( minRatio == null) minRatio = 0.2;
		
		if ( this.firstNode == null ) return;
		
		var node = this.findPoint( point, firstNode );
		if ( node == null ) return;
		var collector = [];
		if ( node.parent == null )
		{
			firstNode = null;
		} else if ( node.parent.parent == null)
		{
			this.getPoints( node.parent, node, collector );
			this.firstNode = new qlib.KDTreeNode();
			this.firstNode.depth = 0;
			this.firstNode.point = collector[0];
		} else {
			node.parent.count--;
			this.getPoints( node.parent.parent, node, collector );
			this.buildDepth( collector, node.parent.parent, node.parent.parent.depth );
			if ( rebalance ) this.checkNodeBalanceBottomUp( minRatio, node.parent.parent, null );
		}
	}
		
	p.removeNearest = function( point, rebalance, minRatio )
	{
		
		if ( this.firstNode == null ) return;
		
		if ( rebalance == null) rebalance = false;
		if ( minRatio == null) minRatio = 0.2;
	
		var collector = [];
		var node = this.findNearestForNode(point,this.firstNode);
		if ( node.parent == null )
		{
			firstNode = null;
		} else if ( node.parent.parent == null)
		{
			this.getPoints( node.parent, node, collector );
			this.firstNode = new qlib.KDTreeNode();
			this.firstNode.depth = 0;
			this.firstNode.point = collector[0];
		} else {
			node.parent.count--;
			this.getPoints( node.parent.parent, node, collector );
			this.buildDepth( collector, node.parent.parent, node.parent.parent.depth );
			if ( rebalance ) this.checkNodeBalanceBottomUp( minRatio, node.parent.parent, null );
		}
	}
		
	p.rebalance = function( minRatio )
	{
		if ( firstNode == null ) return;
		if ( minRatio == null) minRatio = 0.2;
	
		this.checkNodeBalanceTopDown( minRatio, this.firstNode );
	}
		
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
		} else if ( node.left ){
			if (  node.left.count > 1 )
			{
				this.rebalanceNode( node );
			}
		} else if ( node.right ){
			if (  node.right.count > 1 )
			{
				this.rebalanceNode( node );
			}
		}
	}
	
	p.checkNodeBalanceBottomUp = function( minRatio, checkNode, balanceNode )
	{
		if ( checkNode == null )
		{
			if ( balanceNode != null ) this.rebalanceNode( balanceNode );
		} else {
			if ( checkNode.left && checkNode.right )
			{
				var ratio = Math.min( checkNode.left.count, checkNode.right.count ) /  Math.max( checkNode.left.count, checkNode.right.count );
				this.checkNodeBalanceBottomUp( minRatio, checkNode.parent, ratio < minRatio ? checkNode : balanceNode );
			} else if ( checkNode.left ){
				this.checkNodeBalanceBottomUp( minRatio, checkNode.parent, checkNode.left.count > 1 ? checkNode : balanceNode );
			} else if ( checkNode.right ){
				this.checkNodeBalanceBottomUp( minRatio, checkNode.parent, checkNode.right.count > 1 ? checkNode : balanceNode );
			} else {
				this.checkNodeBalanceBottomUp( minRatio, checkNode.parent, balanceNode );
			}
		}
	}
		
	p.rebalanceNode = function( node )
	{
		var collector = [];
		
		if ( node.parent != null )
		{
			this.getPoints( node.parent, null, collector );
			this.buildDepth( collector, node.parent, node.parent.depth );
		} else {
			this.getPoints( firstNode, null, collector );
			this.firstNode = null;
			this.insertPoints( collector );
		}
	}
		
	p.insertNode = function( point, node )
	{
		var insertedNode;
		
		if ( node.depth & 1 ? (point.y < node.point.y) : (point.x < node.point.x) )
		{
			if ( node.left )
			{
				node.count++;
				insertedNode = this.insertNode( point, node.left );
			} else if ( point.x != node.point.x || point.y != node.point.y )
			{
				node.count += 2;
				
				node.left = new qlib.KDTreeNode();
				node.left.parent = node;
				node.left.depth = node.depth + 1;
				node.left.point = point;
				
				node.right = new qlib.KDTreeNode();
				node.right.parent = node;
				node.right.depth = node.depth + 1;
				node.right.point = node.point;
				
				insertedNode = node.left;
				
			}
		} else {
			
			if ( node.right )
			{
				node.count++;
				insertedNode = this.insertNode( point, node.right );
			} else if ( point.x != node.point.x || point.y != node.point.y )
			{
				node.count += 2;
				
				node.left = new qlib.KDTreeNode();
				node.left.parent = node;
				node.left.depth = node.depth + 1;
				node.left.point = node.point;
				
				node.right = new qlib.KDTreeNode();
				node.right.parent = node;
				node.right.depth = node.depth + 1;
				node.right.point = point;
				
				insertedNode = node.right;
			}
		}
		
		return insertedNode;
	}
		
		
	p.buildDepth = function( points, node, depth )
	{
		node.depth = depth;
		if( points.length == 1 )
		{
			node.point = points[0];//If there are no more then 1 point for this node, let's keep it and make this an end node.
		} else {
			points.sort( depth & 1 ? this.sortY : this.sortX);//This can be higly optimized.	
			
			//This can be higly optimized.hm
			var half = (points.length >> 1)|0;
			var other = points.splice(half,points.length-half);
			node.point = points[points.length-1];//This point will be the middle point.
				
			//Build the other nodes with the other 2 halves.
			if ( points.length > 0 )
			{
				node.count++;
				node.left = new qlib.KDTreeNode();
				node.left.parent = node;
				this.buildDepth(points, node.left, depth+1);
			}
			if (other.length > 0 )
			{
				node.count++;
				node.right = new qlib.KDTreeNode();
				node.right.parent = node;
				this.buildDepth(other, node.right, depth+1);
			}
		}	
	}
		
	p.findNearestFor = function(point)
	{
		if ( this.firstNode == null ) return null;
		return this.findNearestForNode(point,this.firstNode);
	}
		
	p.findNearestForNode = function(point, node)
	{
		if( node.left && node.right)
		{
			var side;
			var dist;
			var sideA;
			var sideB;
			var nodeA;
			var nodeB;
			
			side = ( node.depth & 1 ) ? node.point.y - point.y : node.point.x - point.x;
			
			if(side <= 0){
				sideA = node.right;
				sideB = node.left;
			}else{
				sideA = node.left;
				sideB = node.right;
			}
			
			nodeA = this.findNearestForNode( point, sideA );//Traversal like this is costly, so you could stack them and process them in one function instead.
			dist = nodeA.dist;
			
			if( dist < side*side){//Does it overlap a boundary ? 
				return nodeA;
			}else{
				nodeB = this.findNearestForNode(point, sideB );//Traversal like this is costly, so you could stack them and process them in one function instead.
			}
			if(nodeB.dist < dist){//Get the shortest dist.
				return nodeB;
			}else{
				return nodeA;
			}
		} else if (node.left )
		{
			return this.findNearestForNode( point, node.left )
		} else if ( node.right )
		{
			return this.findNearestForNode( point, node.right )
		}
		
		node.dist = node.point.squaredDistanceToVector( point )
		return node;
		
	}
		
		
	p.findPoint = function(point, node)
	{
		if( node.left && node.right)
		{
			var nodeA = this.findPoint( point, node.left );//Traversal like this is costly, so you could stack them and process them in one function instead.
			if ( nodeA != null ) return nodeA;
			var nodeB = this.findPoint(point, node.right );//Traversal like this is costly, so you could stack them and process them in one function instead.
			if ( nodeB != null ) return nodeB;
		} else if (node.left )
		{
			return this.findPoint( point, node.left )
		} else if ( node.right )
		{
			return this.findPoint( point, node.right )
		} else {
			if ( node.point == point ) return node;
		}
		return null;
	}
		
	p.sortX = function(a, b)
	{
		if(a.x > b.x){
			return 1;
		}
		return -1;
	}
		
	p.sortY = function(a, b)
	{
		if(a.y > b.y){
			return 1;
		}
		return -1;
	}
		
		
	p.getPoints = function( node, ignore, collector )
	{
		if(!node.left || !node.right)
		{
			if ( node != ignore ) collector.push(  node.point );
		} else {
			this.getPoints( node.left, ignore, collector );
			this.getPoints( node.right, ignore, collector );
		}
	}
		
	p.draw = function( bounds, canvas )
	{
		canvas.drawRect(bounds.x,bounds.y,bounds.width,bounds.height)
		if ( this.firstNode != null ) this.drawNode( this.firstNode, bounds, canvas );
	}
		
	p.drawNode = function( node, bounds, canvas )
	{
		if ( !node.left || !node.right ) canvas.drawCircle( node.point.x, node.point.y, 2 );
		if( node.depth & 1)
		{
			canvas.moveTo( bounds.x, node.point.y );
			canvas.lineTo( bounds.x + bounds.width, node.point.y );
			if ( node.left )
			{
				this.drawNode( node.left, new qlib.Rectangle(bounds.x, bounds.y, bounds.width ,node.point.y - bounds.y), canvas );
			} 
			if ( node.right )
			{
				this.drawNode( node.right, new qlib.Rectangle(bounds.x, node.point.y, bounds.width, bounds.y + bounds.height - node.point.y ), canvas );
			}
			
		} else{
			canvas.moveTo( node.point.x, bounds.y  );
			canvas.lineTo( node.point.x, bounds.y + bounds.height );
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

