package de.scads.gradoop_service.server.helper.edge_fusion;


import java.util.ArrayList;

import org.apache.flink.api.common.functions.FilterFunction;
import org.apache.flink.api.common.functions.GroupReduceFunction;
import org.apache.flink.api.java.DataSet;
import org.apache.flink.api.java.functions.KeySelector;
import org.apache.flink.util.Collector;
import org.codehaus.jettison.json.JSONObject;
import org.gradoop.common.model.impl.id.GradoopId;
import org.gradoop.common.model.impl.id.GradoopIdSet;
import org.gradoop.common.model.impl.pojo.Edge;
import org.gradoop.common.model.impl.properties.Properties;
import org.gradoop.flink.model.api.epgm.LogicalGraph;


public class EdgeFusionHelper {
	public static LogicalGraph performEdgeFusion(LogicalGraph inputGraph, String config) throws Exception {
		
		JSONObject configObject = new JSONObject(config);
		
		String edgeLabel = configObject.getString("edgeLabel");
		String edgeAttribute = configObject.getString("edgeAttribute");
		String edgeFusionMethod = configObject.getString("edgeFusionMethod");
		Boolean keepCurrentEdges = configObject.getBoolean("keepCurrentEdges");
		
		DataSet<Edge> superEdges = inputGraph.getEdges()
			.filter(new FilterFunction<Edge>() {
					public boolean filter(Edge e) {
						if(e.getLabel().equals(edgeLabel)) {
							return true;
						}
						return false;
					}
				})
			.groupBy(new KeySelector<Edge, String>(){
					public String getKey(Edge e) {
						return e.getSourceId().toString() + e.getTargetId().toString();
					}
				})
			.reduceGroup(new GroupReduceFunction<Edge, Edge>(){
					public void reduce(Iterable<Edge> group, Collector<Edge> output) {
						
						boolean firstElement = true;
						

						GradoopId sourceId = null;
						GradoopId targetId = null;
						
						GradoopIdSet graphIds = null;
						
						ArrayList<Edge> attributevalues = new ArrayList<Edge>();
						
						for(Edge groupItem: group) {
							if(firstElement) {
								sourceId = groupItem.getSourceId();
								targetId = groupItem.getTargetId();
								graphIds = groupItem.getGraphIds();
								
								firstElement = false;
							}
							attributevalues.add(groupItem);
						}
						
						long fnResult = new SumValues().apply(attributevalues, edgeAttribute);
						
						Properties properties = new Properties();
						properties.set("totalValue", Long.valueOf(fnResult));
						
						Edge e = new Edge();
						e.setId(GradoopId.get());
						e.setSourceId(sourceId);
						e.setTargetId(targetId);
						e.setLabel(edgeLabel);
						e.setProperties(properties);
						e.setGraphIds(graphIds);
						
						output.collect(e);
					}
				});
		
		DataSet<Edge> otherEdges = null;
		
		if(keepCurrentEdges) {
			otherEdges = inputGraph.getEdges();
		}
		else {
			otherEdges = inputGraph.getEdges()
					.filter(new FilterFunction<Edge>() {
						public boolean filter(Edge e) {
							if(!e.getLabel().equals(edgeLabel)) {
								return true;
							}
							return false;
						}
					});
		}

		return inputGraph.getConfig().getLogicalGraphFactory().fromDataSets(inputGraph.getVertices(), superEdges.union(otherEdges));
	}
	
	
	
	private static class SumValues implements EdgeFusionFunction<Long>{
		
		public Long apply(ArrayList<Edge> edges, String edgeAttribute) {
			long result = 0L;
			
			for(Edge e: edges) {
				result += e.getPropertyValue(edgeAttribute).getInt();
			}
			
			return Long.valueOf(result);
		}
	}
}
