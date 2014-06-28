/*
Delaunay Triangulation

based on delaunay.java Code found on Ken Perlin's site:
http://mrl.nyu.edu/~perlin/experiments/incompressible/

original author: Dr. Marcus Apel
http://www.geo.tu-freiberg.de/~apelm/ 

ported and optimized for Actionscript by Mario Klingemann
*/

package com.quasimondo.delaunay
{
	
	class Delaunay
	{
		
		var nodes;  
		var edges; 
		var triangles;   
		var regions;   
		var hullStart;    
		var actE;
		var regionsReady;
		var this.min_x;
		var this.min_y;
		var this.max_x;
		var this.max_y;
		var ill_defined;
		var _boundingNodes;
		var viewport; 
		var flipCount;
		
		function Delaunay( viewport )
		{
			this.triangles = new qlib.DelaunayTriangles();
			this.nodes = new qlib.DelaunayNodes();
			this.edges = new qlib.DelaunayEdges();
			this.regions = new qlib.VoronoiRegions();
			this._boundingNodes = [];
			
			this.regionsReady = false;
			this.ill_defined = true;
			if ( viewport == null )
			{
				this.viewport = new qlib.Rectangle( -20,-20,2000,2000);
			} else {
				this.viewport = viewport;
			}
			this.regions.viewport = this.viewport;
			this.flipCount = 0
		}
		
		function createBoundingTriangle( center_x, center_y, radius, rotation )
		{
			
			if ( center_x == null ) center_x = 0;
			if ( center_y == null ) center_y = 0;
			if ( radius == null ) radius = 8000;
			if ( rotation == null ) rotation = 0;
			
			for ( var i = 0; i < 3; i++ )
			{
				this.insertXY( center_x + radius * Math.cos( i * 2 * Math.PI / 3 ) , center_y + radius * Math.sin( i * 2 * Math.PI / 3 ), new qlib.BoundingTriangleNodeProperties() );
			}
			
		}
		
		function clear()
		{
			this._boundingNodes.length = 0;
			this.flipCount=0;
			this.hullStart = null;
			this.actE = null;
			this.nodes.removeAllElements();
			this.edges.removeAllElements();
			this.triangles.removeAllElements();
			this.regions.removeAllElements();
			this.regionsReady = false;
			this.ill_defined = true;
			
		}
		
		function insertXY( px, py, data )
		{
			return this.insertNode(qlib.DelaunayNodes.getNode( px, py, data  ) );
		} 
		
		function insertVector2( v, data)
		{
			return this.insertNode( qlib.DelaunayNodes.getNode( v.x, v.y, data  ) );
		} 
		
		function insertNode( nd )
		{
			this.regionsReady = false;
			var nodes = this.nodes;
			nodes.addElement(nd);
			
			if ( nodes.size == 1 )
			{
				this.min_x = this.max_x = nd.x;
				this.min_y = this.max_y = nd.y;
				return false;
			} else if ( this.ill_defined )
			{
				if ( nd.x < this.min_x ) this.min_x = nd.x;
				else if ( nd.x > this.max_x ) this.max_x = nd.x;
				
				if ( nd.y < this.min_y ) this.min_y = nd.y;
				else if ( nd.y > this.max_y ) this.max_y = nd.y;
				
				if (  nodes.size > 2 )
				{
					if ( (this.min_x != this.max_x) && (this.min_y != this.max_y) )
					{
						if ( this.makeFirstTriangle( ) )
						{
						
							var insertCount = nodes.size - 4;
							var i = 0;
							while ( insertCount > -1 )
							{
								this.insert( nodes.elementAt(insertCount--) );
							}
							
							this.ill_defined = false;
						}
						
					}
					return false;
					
				} else {
					return false;
				}
			}
			
			return this.insert( nd );
			
		}
		
		function canInsert( x, y )
		{
			var nd = DelaunayNodes.getNode( x, y );
			var eid;
			actE = edges.elementAt(0);
			if( actE.onSide(nd) == -1)
			{ 
				if( actE.invE == null ) 
					eid = -1;
				else 
					eid = searchEdge( actE.invE, nd );
			} else {
				eid = searchEdge( actE, nd );
			}
			DelaunayNodes.deleteNode(nd);
			return ( eid != 0 );
		}
		
		function insert( nd )
		{
			var eid;
			actE = edges.elementAt(0);
			if( actE.onSide(nd) == -1)
			{ 
				if( actE.invE == null ) 
					eid = -1;
				else 
					eid = searchEdge( actE.invE, nd );
			} else {
				eid = searchEdge( actE, nd );
			}
			
			if( eid == 0) 
			{ 
				trace( "Point already exists - no insert" );   
				//throw( new Error("could not insert node!"));
				nodes.deleteElement(nd); 
				return false; 
			}
			if( eid > 0 ) 
				expandTri( actE, nd, eid );   // nd is inside or on a triangle
			else 
				if (!expandHull(nd))
				{             
					trace( "could not insert node! expandHull failed" );   
					nodes.deleteElement(nd); 
					return false; 
				} // nd is outside convex hull
			
			if ( nd.data is BoundingTriangleNodeProperties )
			{
				_boundingNodes.push( nd );
			}
			
			return true;
		}
		
		function makeFirstTriangle( )
		{
			
			var p1 = nodes.elementAt(nodes.size - 3);
			var p2 = nodes.elementAt(nodes.size - 2);
			var p3 = nodes.elementAt(nodes.size - 1);
			
			var e1 = DelaunayEdges.getEdge(p1,p2);
			e1.setFlip(flipCount++);
			
			if( e1.onSide(p3) == 0 )
			{ 
				DelaunayEdges.deleteEdge(e1);
				//nodes.deleteElement(nd); 
				return false; 
			}
			
			
			if( e1.onSide(p3) == -1 )  // right side
			{
				p1 = nodes.elementAt(nodes.size - 2);
				p2 = nodes.elementAt(nodes.size - 3);
				e1.update(p1,p2);
			}
			
			var e2 = DelaunayEdges.getEdge(p2,p3);
			e2.setFlip(flipCount++);
			var e3 = DelaunayEdges.getEdge(p3,p1);
			e3.setFlip(flipCount++);
			e1.nextH = e2;
			e2.nextH = e3;
			e3.nextH = e1;
			hullStart = e1;
			triangles.addElement(DelaunayTriangles.getTriangle(e1,e2,e3,edges));
			
			if ( p1.data is BoundingTriangleNodeProperties )
			{
				_boundingNodes.push( p1 );
			}
			if ( p2.data is BoundingTriangleNodeProperties )
			{
				_boundingNodes.push( p2 );
			}
			if ( p3.data is BoundingTriangleNodeProperties )
			{
				_boundingNodes.push( p3 );
			}
			
			
			
			return true;
		}
		
		
		function removeNearest( px, py )
		{
			if( nodes.size <= 3) return;   // not allow deletion for only 1 triangle
			removeNode( getNearestNode(px,py));
		}
		
		function removeNode( nd )
		{
			if(nd==null) return;          // not found
			
			var e, ee, start;
			start = e = nd.edge.mostRight;
			var nodetype = 0;
			var idegree = -1;
			var index:Vector.<DelaunayEdge> = new Vector.<DelaunayEdge>();
			//if ( index.length < edges.size ) index = []
		
			while(nodetype==0)
			{
				edges.removeElement( ee = e.nextE );
				index[++idegree]=ee;
				ee.asIndex();
				triangles.deleteElement( e.inT );
				edges.removeElement(e);
				edges.removeElement(ee.nextE);
				e=ee.nextE.invE;            // next left edge
				if( e == null ) nodetype=2;         // nd on convex hull
				if( e == start ) nodetype=1;        // inner node
			}
			// generate new triangles and add to triangulation
			var cur_i=0;
			var cur_n=0;
			var last_n=idegree;
			var e1;
			var e2;
			var e3;
		
			while(last_n>=1)
			{
				e1=index[cur_i];
				e2=index[cur_i+1];
				if(last_n==2 && nodetype==1)
				{
					triangles.addElement(DelaunayTriangles.getTriangle(e1,e2,index[2],edges));
					swapTest(e1);
					swapTest(e2);
					swapTest(index[2]);
					break;
				}
				if(last_n==1 && nodetype==1)
				{
					index[0].invE.linkSymm(index[1].invE);
					index[0].invE.asIndex();
					index[1].invE.asIndex();
					swapTest(index[0].invE);
					break;
				}
				if(e1.onSide(e2.p2)==1)  // left side
				{
					e3 = DelaunayEdges.getEdge(e2.p2,e1.p1);
					cur_i+=2;
					index[cur_n++]=e3.makeSymm();
					triangles.addElement(DelaunayTriangles.getTriangle(e1,e2,e3,edges));
					swapTest(e1);
					swapTest(e2);
				} else {
					index[cur_n++]=index[cur_i++];
				}
				if(cur_i==last_n) index[cur_n++]=index[cur_i++];
				if(cur_i==last_n+1)
				{
					if(last_n==cur_n-1) break;
					last_n=cur_n-1;
					cur_i=cur_n=0;
				}
			}
			if(nodetype==2)   // reconstruct the convex hull
			{
				index[last_n].invE.mostLeft.nextH = ( hullStart = index[last_n].invE );
				for(var i=last_n;i>0;i--)
				{ 
					index[i].invE.nextH = index[i-1].invE;
					index[i].invE.invE = null ;
				}
				index[0].invE.nextH = start.nextH;
				index[0].invE.invE = null ;
			}
			
			nodes.removeElement(nd);
			
		}
		
		
		function expandTri( e,  nd, type )
		{
			var e1=e;
			var e2=e1.nextE;
			var e3=e2.nextE;
			var p1=e1.p1;
			var p2=e2.p1;
			var p3=e3.p1;
			var e10;
			var e20;
			var e30;
			if( type == 2 )    // nd is inside of the triangle
			{
				e10 = DelaunayEdges.getEdge(p1,nd);
				e20 = DelaunayEdges.getEdge(p2,nd);
				e30 = DelaunayEdges.getEdge(p3,nd);
				e.inT.removeEdges(edges);
				triangles.deleteElement(e.inT);     // remove old triangle
				triangles.addElement(DelaunayTriangles.getTriangle(e1,e20,e10.makeSymm(),edges));
				triangles.addElement(DelaunayTriangles.getTriangle(e2,e30,e20.makeSymm(),edges));
				triangles.addElement(DelaunayTriangles.getTriangle(e3,e10,e30.makeSymm(),edges));
				swapTest(e1);   // swap test for the three new triangles
				swapTest(e2);
				swapTest(e3);
			}
			else           // nd is on the edge e
			{
				var e4=e1.invE;
				if(e4==null || e4.inT==null)           // one triangle involved
				{
					e30=DelaunayEdges.getEdge(p3,nd);
					var e02=DelaunayEdges.getEdge(nd,p2);
					e10=DelaunayEdges.getEdge(p1,nd);
					var e03=e30.makeSymm();
					e10.asIndex();
					e1.mostLeft.nextH = e10;
					e10.nextH = e02;
					e02.nextH = e1.nextH;
					hullStart = e02;
					triangles.deleteElement(e1.inT);                   // remove oldtriangle               // add two new triangles
					edges.deleteElement(e1);
					edges.addElement(e10);
					edges.addElement(e02);
					edges.addElement(e30);
					edges.addElement(e03);
					triangles.addElement(DelaunayTriangles.getTriangle(e2,e30,e02));
					triangles.addElement(DelaunayTriangles.getTriangle(e3,e10,e03));
					swapTest(e2);   // swap test for the two new triangles
					swapTest(e3);
					swapTest(e30);
				} else         
				{
					// two triangle involved
					var e5=e4.nextE;
					var e6=e5.nextE;
					var p4=e6.p1;
					e10=DelaunayEdges.getEdge(p1,nd);
					e20=DelaunayEdges.getEdge(p2,nd);
					e30=DelaunayEdges.getEdge(p3,nd);
					var e40=DelaunayEdges.getEdge(p4,nd);
					e.inT.removeEdges(edges);
					triangles.deleteElement(e.inT);                   // remove oldtriangle
					e4.inT.removeEdges(edges);
					triangles.deleteElement(e4.inT);               // remove old triangle
					e5.asIndex();   // because e, e4 removed, reset edge index of node p1 and p2
					e2.asIndex();
					triangles.addElement(DelaunayTriangles.getTriangle(e2,e30,e20.makeSymm(),edges));
					triangles.addElement(DelaunayTriangles.getTriangle(e3,e10,e30.makeSymm(),edges));
					triangles.addElement(DelaunayTriangles.getTriangle(e5,e40,e10.makeSymm(),edges));
					triangles.addElement(DelaunayTriangles.getTriangle(e6,e20,e40.makeSymm(),edges));
					swapTest(e2);   // swap test for the three new triangles
					swapTest(e3);
					swapTest(e5);
					swapTest(e6);
					swapTest(e10);
					swapTest(e20);
					swapTest(e30);
					swapTest(e40);
				}
			}
		}
		
		function expandHull( nd)
		{
			var e1;
			var e2;
			var e3;
			var enext;
			var e = hullStart;
			var comedge;
			var lastbe
			var round = 0;
			while(round<2)
			{
				
				enext = e.nextH;
				if ( enext == hullStart) round++;
				if( e.onSide(nd) == -1 )   // right side
				{
					if( lastbe != null )
					{
						e1 = e.makeSymm();
						e2 = DelaunayEdges.getEdge( e.p1, nd );
						e3 = DelaunayEdges.getEdge( nd, e.p2 );
						if( comedge == null )
						{
							hullStart = lastbe;
							lastbe.nextH = e2;
							lastbe = e2;
						}
						else comedge.linkSymm(e2);
						comedge=e3;
						triangles.addElement(DelaunayTriangles.getTriangle(e1,e2,e3,edges));
						swapTest(e);
					}
				}
				else
				{
					if(comedge!=null) break;
					lastbe=e;
				}
				e=enext;
			}
			
			if ( e3 != null )
			{
				lastbe.nextH = e3;
				e3.nextH = e;
				return true;
			}
			return false;
		}
		
		function searchEdge( e, nd )
		{
			
			var s;
			var f2, f3;
			var ee, enx, e0;
			var lastE;
			while ( true )
			{
				e0 = null;
				enx = e.nextE;
				if ( enx == null  )
				{
					trace("edge missing");
					return 0;
				}
				if(( f2 = enx.onSide(nd)) == -1 )
				{ 
					if( enx.invE != null ) 
					{
						if ( enx.invE == lastE )
						{
							trace("looks like an endless loop");
							return 0;
						}
						e = enx.invE;
						lastE = e;
					} else 
					{ 
						actE = e; 
						return -1;
					}
				} else 
				{
					if( f2 == 0 ) e0 = enx;
					
					ee = enx;
					enx = enx.nextE;
					
					if( ( f3 = enx.onSide(nd) ) == -1 )
					{ 
						if( enx.invE != null ) 
						{
							e = enx.invE;
						} else { 
							actE = enx; 
							return -1;
						}
					} else {
						if( f3 == 0 ) e0 = ee.nextE;
						if( e.onSide(nd) == 0 ) e0 = e;
						if( e0 != null )
						{
							enx = e0.nextE;
							actE = e0;
							if( enx.onSide(nd) == 0) 
							{
								actE = enx; 
								return 0;
							}
							
							if( enx.nextE.onSide(nd) == 0) 
							{
								return 0;
							}
							
							return 1;
							
						} else 
						{
							actE = ee;
							return 2;
						}
					}
				}
			}  
			return -1;
		}
		
		function swapTest( e11 )
		{
			var e21;
			var stack:Vector.<DelaunayEdge> = new Vector.<DelaunayEdge>();
			stack.push( e11 );
			
			var visited:Dictionary = new Dictionary();
			
			while ( stack.length > 0 )
			{
				e11 = stack.shift();
				if ( visited[ e11 ] ) continue;
				visited[ e11 ] = true;
				
				e21 = e11.invE;
				
				if( e21 == null || e21.inT == null ) continue;
				
				var e12 = e11.nextE;
				var e13 = e12.nextE;
				var e22 = e21.nextE;
				var e23 = e22.nextE;
				
				if( e11.inT.inCircle(e22.p2) || e21.inT.inCircle(e12.p2) )
				{
					e11.update( e22.p2, e12.p2 );
					e21.update( e12.p2, e22.p2 );
					e11.linkSymm( e21);
					e13.inT.update( e13, e22, e11 );
					e23.inT.update( e23, e12, e21 );
					e12.asIndex();
					e22.asIndex();
					stack.push( e12 );
					stack.push( e22 );
					stack.push( e13 );
					stack.push( e23 );
				}
			}
		}
		
		function getNearestNode( x, y)
		{
			if ( nodes.size < 10 ) return nodes.nearest(x,y);
			
			var nd = DelaunayNodes.getNode( x, y  );
			var eid;
			actE = edges.elementAt(0);
			
			if ( actE == null ) {
				DelaunayNodes.deleteNode( nd );
				return null;
			}
			
			if( actE.onSide(nd) == -1)
			{ 
				if( actE.invE == null ) 
					eid = -1;
				else 
					eid = searchEdge( actE.invE, nd );
			} else {
				eid = searchEdge( actE, nd );
			}
			
			if ( actE.inT )
			{
				var nTriangles:Vector.<DelaunayTriangle> = actE.inT.getNeighborTriangles();
				var tested:Dictionary = new Dictionary();
				var bestNode;
				var bestDistance = Number.MAX_VALUE;
				for each ( var ta:DelaunayTriangle in nTriangles )
				{
					var nNodes = ta.getNodes();
					for each ( var nn in nNodes )
					{
						if ( tested[nn] == null )
						{
							tested[nn] = true;
							var dist = nd.distanceTo( nn );
							if ( dist < bestDistance )
							{
								bestDistance = dist;
								bestNode = nn;
							}
						
						}
					}
				}
			}
			DelaunayNodes.deleteNode( nd );
			return bestNode;
		}
		
		/*
		function nearest( x, y)
		{
			return nodes.nearest(x,y);
		}
		*/
		
		function updateRegions()
		{
			regions.removeAllElements();
			edges.buildVoronoiRegions( regions );
			regionsReady = true;
		}
		
		function  drawPoints( g:Graphics, colorMap:BitmapData = null)
		{
			nodes.drawPoints(g,true,colorMap);
			
		}
		
		function animate( )
		{
			edges.animate();
			regionsReady = false;
		}
		
		function updateNodes( mode:String )
		{
			nodes.updateData(mode);
		}
		
		function updateSprites( )
		{
			nodes.updateSprites();
		}
		
		/*
		function updateNodes( )
		{
		nodes.update( this );
		}
		*/
		
		function drawTriangles( g:Graphics)
		{
			if(nodes.size==1)
			{
				g.drawRect(nodes.elementAt(0).x-1,nodes.elementAt(0).y-1,2,2);
			} else if(nodes.size==2){
				g.moveTo(nodes.elementAt(0).x,nodes.elementAt(0).y)
				g.lineTo(nodes.elementAt(1).x,nodes.elementAt(1).y)
			} else {
				edges.draw(g);
			}
		}
		
		function drawCircles( g:Graphics )
		{
			triangles.drawCircles(g);
		}
		
		function drawVoronoiDiagram( g:Graphics, ignoreOuterRegions = true )
		{
			edges.drawVoronoi(g);
		}
		
		function drawVoronoiRegions( g:Graphics, colorMap:BitmapData = null )
		{
			if ( !regionsReady) updateRegions();
			regions.draw( g, colorMap );
			
		}
		
		function getVoronoiRegions( ignoreOuterRegions = true ):Vector.<VoronoiRegion>
		{
			if ( !regionsReady) updateRegions();
			return regions.getRegions( ignoreOuterRegions );
		}
		
		function getVoronoiLines():Vector.<LineSegment>
		{
			return edges.getVoronoiLines();
		}
		
		function getVoronoiRegionsAsConvexPolygons( clone = true ):Vector.<ConvexPolygon>
		{
			if ( !regionsReady) updateRegions();
			return regions.getConvexPolygons( clone );
		}
		
		function getVertices( ignoreOuterVertices = true ):Vector.<DelaunayTriangle>
		{
			return triangles.getVertices();
		}
		
		function getEdges( ignoreOuterEdges = true ):Vector.<DelaunayEdge>
		{
			return edges.getEdges( ignoreOuterEdges );
		}
		
		function getTriangles( ignoreOuterTriangles = true ):Vector.<Triangle>
		{
			return triangles.getTriangles(ignoreOuterTriangles);
		}
		
		function drawVertices( g:Graphics, ignoreOuterTriangle = true )
		{
			triangles.drawVertex(g, ignoreOuterTriangle );
		}
		
		function getHull( ignoreOuterTriangle = true ):ConvexPolygon
		{
			return ConvexPolygon.fromVector( nodes.getVectors( ignoreOuterTriangle ) ); 
		}
		
		function relaxVoronoi( minOffset = 1, constrain:GeometricShape = null )
		{
			var squaredDistance = minOffset * minOffset;
			var regions:Vector.<VoronoiRegion> = getVoronoiRegions();
			var newCenters:Vector.<Vector2> = new Vector.<Vector2>();
			var relaxable:Vector.<Boolean> = new Vector.<Boolean>();
			if ( constrain == null ) constrain = getHull().toPolygon();
			var changed = false;
			var center = new Vector2();
			var centroid;
			
			for each ( var region:VoronoiRegion in regions )
			{
				center.x = region.p.x;
				center.y = region.p.y;
				centroid = region.polygon.centroid;
				if (  region.p.data.relaxable == true && centroid.distanceToVector( center ) > squaredDistance )
				{
					if ( constrain.hasPoint( center ))
					{
						centroid = constrain.getClosestPoint( centroid );
					}
					
					if ( !constrain.isInside( centroid, true ) )
					{
						centroid = constrain.getClosestPoint( centroid );
						/*
						var intersectionersection = new LineSegment( center, centroid ).intersect( constrain );
						if ( intersection.points.length > 0 )
						{
							centroid = intersection.points[0]
						} else {
							
							centroid = constrain.getClosestPoint( centroid );
						}
						*/
					}
					if ( centroid.distanceToVector( center ) > squaredDistance ) changed = true;
					region.p.x = centroid.x;
					region.p.y = centroid.y;
					
				} 
				if ( !(region.p.data is BoundingTriangleNodeProperties) )
				{
					newCenters.push( new Vector2( region.p.x, region.p.y ) );
					relaxable.push( region.p.data.relaxable );
				}
			}
			if ( changed )
			{
				var boundingNodes = getBoundingNodes();
				
				var bounds:Vector.<Vector2> = new Vector.<Vector2>();
				for ( var i = 0; i < boundingNodes.length; i++ )
				{
					bounds.push( new Vector2( boundingNodes[i].x, boundingNodes[i].y ) );
				}
				
				clear();
				
				for (  i = 0; i < bounds.length; i++ )
				{
					insertXY( bounds[i].x, bounds[i].y, new BoundingTriangleNodeProperties() );
				}
				
				for ( i = 0; i < newCenters.length; i++ )
				{
					insertXY( newCenters[i].x, newCenters[i].y, new DelaunayColorNodeProperties(0xffff0000, relaxable[i]) );
				}
			}
			return changed;
		}
		
		function getBoundingNodes()
		{
			return _boundingNodes.concat();
		}
	}
}