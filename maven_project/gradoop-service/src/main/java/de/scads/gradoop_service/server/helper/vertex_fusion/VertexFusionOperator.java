package de.scads.gradoop_service.server.helper.vertex_fusion;


import java.util.ArrayList;
import java.util.HashSet;

import org.apache.flink.api.common.functions.FilterFunction;
import org.apache.flink.api.common.functions.FlatMapFunction;
import org.apache.flink.api.common.functions.GroupReduceFunction;
import org.apache.flink.api.common.functions.JoinFunction;
import org.apache.flink.api.common.functions.MapFunction;
import org.apache.flink.api.java.DataSet;
import org.apache.flink.api.java.functions.KeySelector;
import org.apache.flink.api.java.tuple.Tuple2;
import org.apache.flink.api.java.tuple.Tuple3;
import org.apache.flink.util.Collector;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;
import org.gradoop.common.model.impl.id.GradoopId;
import org.gradoop.common.model.impl.pojo.Edge;
import org.gradoop.common.model.impl.pojo.Vertex;
import org.gradoop.common.model.impl.properties.PropertyValue;
import org.gradoop.flink.model.api.epgm.LogicalGraph;
import org.gradoop.flink.model.api.operators.UnaryGraphToGraphOperator;


public class VertexFusionOperator implements UnaryGraphToGraphOperator {
	
	private String config;
	private VertexFusionFunction vertexFusionFunction;
	
	public VertexFusionOperator(String config, VertexFusionFunction vertexFusionFunction) {
		this.config = config;
		this.vertexFusionFunction = vertexFusionFunction;
	}
	
	public LogicalGraph execute(LogicalGraph inputGraph) {
		
		String vertexAttribute = "";
		String vertexFusionMethod = "";
		boolean deleteRefelexiveEdges = false;
		
		JSONObject configObject;
		try {
			configObject = new JSONObject(config);
			vertexAttribute = configObject.getString("vertexAttribute");
			vertexFusionMethod = configObject.getString("vertexFusionMethod");
			deleteRefelexiveEdges = configObject.getBoolean("deleteReflexiveEdges");
		} catch (JSONException e) {
			e.printStackTrace();
		}
		
		final String finalVertexAttribute = vertexAttribute;
		final String finalVertexFusionMethod = vertexFusionMethod;
		final VertexFusionFunction finalVertexFusionFunction = vertexFusionFunction;
		
		
		
		DataSet<SuperVertexContainer> superVertexContainers = inputGraph.getVertices()
				.filter(new FilterFunction<Vertex>() {
					public boolean filter(Vertex v) {
						if(v.hasProperty(finalVertexAttribute)) {
							return true;
						}
						return false;
					}
				})
				.groupBy(new KeySelector<Vertex, Long>(){
					public Long getKey(Vertex v) {
						PropertyValue propertyValue = v.getPropertyValue(finalVertexAttribute);
						
						Long result = null;
						
						// numerical properties passed as LogicalGraph can be passed as long
						if(propertyValue.getByteSize() == 9) {
							result = propertyValue.getLong();
						}
						// numerical properties read from disk are likely to be parsed as int
						else if(propertyValue.getByteSize() == 5) {
							result = (long)propertyValue.getInt();
						}

						return result;
					}
				})
				.reduceGroup(new GroupReduceFunction<Vertex, SuperVertexContainer>(){
					public void reduce(Iterable<Vertex> groupItems, Collector<SuperVertexContainer> out) {

						ArrayList<Vertex> groupItemsArray = new ArrayList<Vertex>();					
						for(Vertex groupItem: groupItems) {
							groupItemsArray.add(groupItem);
						}
						System.out.println("group size is " + groupItemsArray.size());
						Vertex superVertex = finalVertexFusionFunction.apply(groupItemsArray, finalVertexAttribute);
						
						SuperVertexContainer vertexContainer = new SuperVertexContainer();
						HashSet<GradoopId> vertexIds = new HashSet<GradoopId>();
						
						for(Vertex groupItem: groupItemsArray) {							
							vertexIds.add(groupItem.getId());
						}
						
						vertexContainer.setSuperVertex(superVertex);
						vertexContainer.setVertexIds(vertexIds);
						out.collect(vertexContainer);
					}
				});
		
		DataSet<Vertex> superVertices = superVertexContainers
				.map(new MapFunction<SuperVertexContainer, Vertex>(){
					public Vertex map(SuperVertexContainer vertexContainer) {
						return vertexContainer.getSuperVertex();
					}
				});
		
		DataSet<VertexMapping> vertexMappingFragment1 = superVertexContainers
				.flatMap(new FlatMapFunction<SuperVertexContainer, VertexMapping>(){
					public void flatMap(SuperVertexContainer vertexContainer, Collector<VertexMapping> out) {
						
						VertexMapping mapping = new VertexMapping();
						
						Vertex superVertex = vertexContainer.getSuperVertex();
						for(GradoopId vertexId: vertexContainer.getVertexIds()) {
							mapping.setVertexId(vertexId);
							mapping.setSuperVertexId(superVertex.getId());
							
							out.collect(mapping);
						}
					}
				});
		
		DataSet<Vertex> unalteredVertices = inputGraph.getVertices()
				.filter(new FilterFunction<Vertex>() {
					public boolean filter(Vertex v) {
						if(v.hasProperty(finalVertexAttribute)) {
							return false;
						}
						return true;
					}
				});

		DataSet<VertexMapping> vertexMapping = unalteredVertices
				.map(new MapFunction<Vertex, VertexMapping>(){
					public VertexMapping map(Vertex vertex) {
						VertexMapping vertexMapping = new VertexMapping();
						vertexMapping.setVertexId(vertex.getId());
						vertexMapping.setSuperVertexId(vertex.getId());
						return vertexMapping;
					}
				})
				.union(vertexMappingFragment1);

		
		DataSet<Edge> resultEdges = inputGraph.getEdges()
			.join(vertexMapping)
			.where(new KeySelector<Edge, GradoopId>(){
				public GradoopId getKey(Edge e) {
					return e.getSourceId();
				}
			})
			.equalTo(0)
			.with(new JoinFunction<Edge, VertexMapping, Edge> (){
				public Edge join(Edge edge, VertexMapping mapping) {
					edge.setSourceId(mapping.getSuperVertexId());
					return edge;
				}
			})
			.join(vertexMapping)
			.where(new KeySelector<Edge, GradoopId>(){
				public GradoopId getKey(Edge e) {
					return e.getTargetId();
				}
			})
			.equalTo(0)
			.with(new JoinFunction<Edge, VertexMapping, Edge> (){
				public Edge join(Edge edge, VertexMapping mapping) {
					edge.setTargetId(mapping.getSuperVertexId());
					return edge;
				}
			});
		
		
		if(deleteRefelexiveEdges) {
			System.out.println("starts filtering...");
			resultEdges = resultEdges
				.filter(new FilterFunction<Edge>() {
					public boolean filter(Edge e) {
						if(e.getSourceId().equals(e.getTargetId())) {
							return false;
						};
						return true;
					}
				});
		}
		
//			.groupBy(new KeySelector<Edge, Tuple3<GradoopId, GradoopId, String>>(){
//				public Tuple3<GradoopId, GradoopId, String> getKey(Edge e) {
//					return Tuple3.of(e.getSourceId(), e.getTargetId(), e.getLabel());
//				}
//			})
//			.reduceGroup(new GroupReduceFunction<Edge, Edge>(){
//				public void reduce(Iterable<Edge> in, Collector<Edge> out) {
//					
//					Edge result = null;
//					
//					boolean firstItem = true;
//					int count = 0;
//					for(Edge e: in) {
//						if(firstItem) {
//							result = e;
//						}
//						count++;
//					}
//					result.setProperty("count", count);
//					
//					out.collect(result);
//				}
//			});

		return inputGraph.getConfig().getLogicalGraphFactory().fromDataSets(superVertices.union(unalteredVertices), resultEdges);
	}
	
	@Override
	public String getName() {
		return VertexFusionOperator.class.getName();
	}
	
	public static class SuperVertexContainer extends Tuple2<Vertex, HashSet<GradoopId>>{
		public Vertex getSuperVertex() {
			return f0;
		}
		
		public HashSet<GradoopId> getVertexIds() {
			return f1;
		}
		
		public void setSuperVertex(Vertex vertex) {
			f0 = vertex;
		}
		
		public void setVertexIds(HashSet<GradoopId> vertexId) {
			f1 = vertexId;
		}
	}
	
	public static class VertexMapping extends Tuple2<GradoopId, GradoopId>{
		public GradoopId getVertexId() {
			return f0;
		}
		
		public GradoopId getSuperVertexId() {
			return f1;
		}
		
		public void setVertexId(GradoopId vertexId) {
			f0 = vertexId;
		}
		
		public void setSuperVertexId(GradoopId superVertexId) {
			f1 = superVertexId;
		}
	}
}
