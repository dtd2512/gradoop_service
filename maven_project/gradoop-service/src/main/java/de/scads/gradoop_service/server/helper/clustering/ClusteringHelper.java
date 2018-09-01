package de.scads.gradoop_service.server.helper.clustering;

import org.apache.flink.api.common.functions.MapFunction;
import org.apache.flink.api.java.operators.MapOperator;
import org.codehaus.jettison.json.JSONObject;
import org.gradoop.common.model.impl.pojo.Edge;
import org.gradoop.famer.clustering.clustering;
import org.gradoop.famer.clustering.parallelClusteringGraph2Graph.Center;
import org.gradoop.famer.clustering.parallelClusteringGraph2Graph.ConnectedComponents;
import org.gradoop.famer.clustering.parallelClusteringGraph2Graph.CorrelationClustering;
import org.gradoop.famer.clustering.parallelClusteringGraph2Graph.MergeCenter;
import org.gradoop.famer.clustering.parallelClusteringGraph2Graph.Star;
import org.gradoop.flink.model.api.epgm.LogicalGraph;

/**
 * Contains method(s) to be used for clustering a logical graph
 */
public class ClusteringHelper {
	
	/**
	 * Performs clustering of a logical graph
	 * 
	 * @param inputGraph - graph to be clustered
	 * @param clusteringConfig - clustering configuration
	 * @return returns clustered graph
	 */
	public static LogicalGraph runClustering(LogicalGraph inputGraph, String clusteringConfig) throws Exception {
		
		LogicalGraph clusteredGraph = null;
		
		JSONObject clusteringConfigObject = new JSONObject(clusteringConfig);
		String clusteringMethod = clusteringConfigObject.getString("clusteringMethod");
		String edgeAttribute = clusteringConfigObject.getString("edgeAttribute");
		
		// we preserve existing value if no edge attribute was input by user
		if(!edgeAttribute.equals("")) {
			inputGraph = performPreprocessing(inputGraph, edgeAttribute);	
		}
		
		boolean isEdgeBidirection = false;
		clustering.ClusteringOutputType clusteringOutputType = clustering.ClusteringOutputType.GraphCollection;
        
		switch (clusteringMethod) {
			case "CONCON":
				clusteredGraph = inputGraph.callForGraph(new ConnectedComponents());
				break;
			case "CORRELATION_CLUSTERING":
				clusteredGraph = inputGraph.callForGraph(new CorrelationClustering(isEdgeBidirection, clusteringOutputType));
				break;
			case "CENTER":
				clusteredGraph = inputGraph.callForGraph(new Center(1, isEdgeBidirection, clusteringOutputType));
				break;
			case "MERGE_CENTER":
				clusteredGraph = inputGraph.callForGraph(new MergeCenter(1, 0.0, isEdgeBidirection, clusteringOutputType));
				break;
			case "STAR1":
				clusteredGraph = inputGraph.callForGraph(new Star(1, 1, isEdgeBidirection, clusteringOutputType));
				break;
			case "STAR2":
				clusteredGraph = inputGraph.callForGraph(new Star(1, 2, isEdgeBidirection, clusteringOutputType));
				break;
		}
		
		return clusteredGraph;
	}
	
	/**
	 * Performs input graph preprocessing: renames edge attribute containing similarities, that was chosen for clustering, into "value"-
	 * This is required in famer-clustering 
	 * 
	 * @param inputGraph - name of the input graph
	 * @param edgeAttribute - name of the currently existing attribute 
	 * @return preprocessed input graph
	 */
	private static LogicalGraph performPreprocessing(LogicalGraph inputGraph, String edgeAttribute) {
		
		@SuppressWarnings("serial")
		MapOperator<Edge, Edge> graphEdgesTmp = inputGraph.getEdges().map(new MapFunction<Edge, Edge>() {
			@Override
			public Edge map(Edge input) throws Exception {
				input.setProperty("value", input.getPropertyValue(edgeAttribute).getDouble());
				input.removeProperty("similarity");
				return input;	
			}
		});
		
		return inputGraph.getConfig().getLogicalGraphFactory().fromDataSets(inputGraph.getVertices(), graphEdgesTmp);
	}
}