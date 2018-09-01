package de.scads.gradoop_service.server.helper;

import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

import org.apache.flink.api.common.functions.FlatMapFunction;
import org.apache.flink.api.java.DataSet;
import org.apache.flink.util.Collector;
import org.codehaus.jettison.json.JSONObject;
import org.eclipse.rdf4j.query.BindingSet;
import org.eclipse.rdf4j.query.QueryLanguage;
import org.eclipse.rdf4j.query.TupleQueryResult;
import org.eclipse.rdf4j.repository.Repository;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.eclipse.rdf4j.repository.sparql.SPARQLRepository;
import org.gradoop.common.model.impl.id.GradoopId;
import org.gradoop.common.model.impl.id.GradoopIdSet;
import org.gradoop.common.model.impl.pojo.Edge;
import org.gradoop.common.model.impl.pojo.GraphHead;
import org.gradoop.common.model.impl.pojo.Vertex;
import org.gradoop.common.model.impl.properties.Properties;
import org.gradoop.common.model.impl.properties.Property;
import org.gradoop.flink.model.api.epgm.LogicalGraph;
import org.gradoop.flink.util.GradoopFlinkConfig;

public class RDFGraphHelper {
	
	public static LogicalGraph getRDFGraph(String config, final GradoopFlinkConfig gfc) throws Exception {
		
		// parsing json configuration
		JSONObject configObject = new JSONObject(config);
		
		String endpoint = configObject.getString("endpoint");
		String query = 	configObject.getString("query");
		
		
		// initializing sparql repository uning user input
		Repository repository = new SPARQLRepository(endpoint);
		repository.initialize();
		
		RepositoryConnection connection = repository.getConnection();
		
		// temporary storing query result in following format:
		// [vertex1];[vertex1GradoopId];[edge];[edgeGradoopId];[vertex2];[vertex2GradoopId]
		Set<String> queryResults = new HashSet<String>();
		
		// storing labels separately
		String vertex1Label = "";
		String edgeLabel = "";
		String vertex2Label = "";
		
		// key-value pairs of vertex and it's GradoopId as a string
		// is needed to ensure the same element gets the same GradoopId
		Map<String, String> vertex1Map = new HashMap<String, String>();
		Map<String, String> vertex2Map = new HashMap<String, String>();
		
		try {					    
			TupleQueryResult result = connection.prepareTupleQuery(QueryLanguage.SPARQL, query).evaluate(); 		

			while(result.hasNext()) {
				BindingSet bs = result.next();
				
				// obtaining labels
				int j = 1;
				Set<String> names = bs.getBindingNames();						         
				for(String n: names) {
					if(j == 1) {
						vertex1Label = n;
					}
					else if(j == 2) {
						edgeLabel = n;
					}
					if(j == 3) {
						vertex2Label = n;
					}
					j++;
				}
				
				// initializing variables to store String representation of GradoopIds
				String id1;
				String id2 = GradoopId.get().toString();
				String id3;
				
				// obtaining already created GradoopId for the vertex if it is has already been processed in another triple
				if(vertex1Map.get(bs.getValue(vertex1Label).toString()) != null) {
					id1 = vertex1Map.get(bs.getValue(vertex1Label).toString());
				}
				// creating new GradoopId for the vertex if it is processed for the first time
				else {
					id1 = GradoopId.get().toString();
					vertex1Map.put(bs.getValue(vertex1Label).toString(), id1);
				}

				if(vertex2Map.get(bs.getValue(vertex2Label).toString()) != null) {
					id3 = vertex2Map.get(bs.getValue(vertex2Label).toString());
				}
				else {
					id3 = GradoopId.get().toString();
					vertex2Map.put(bs.getValue(vertex2Label).toString(), id3);
				}
				
				
				// generating temporary String representation of a triple, that is to be processed for graph creation
				String triple = bs.getValue(vertex1Label) + ";" + id1 + ";"
							  +	bs.getValue(edgeLabel) + ";" + id2 + ";"
							  +	bs.getValue(vertex2Label) + ";" + id3;

				queryResults.add(triple);
			}
		}
		finally {
			connection.close();
		}
		
		GradoopId graphId = GradoopId.get();
		GradoopIdSet graphIds = new GradoopIdSet();
		graphIds.add(graphId);
		
		String finalVertex1Label = vertex1Label;
		String finalEdgeLabel = edgeLabel;
		String finalVertex2Label = vertex2Label;

		// temporary sets of vertice ids, that have already been created, needed to avoid multiple creation of the same vertex
		Set<GradoopId> vertex1IdSet = new HashSet<GradoopId>();
		Set<GradoopId> vertex2IdSet = new HashSet<GradoopId>();
		
		DataSet<Vertex> vertices = gfc.getExecutionEnvironment().fromCollection(queryResults)
				.flatMap(new FlatMapFunction<String, Vertex>(){
					public void flatMap(String input, Collector<Vertex> output){

						String[] inputs = input.split(";");
											
						Properties properties = new Properties();
						properties.set(Property.create("value", inputs[0]));
						GradoopId vertex1Id = GradoopId.fromString(inputs[1]);
						
						// check if the same vertex has already been created before creating a new one
						if(!vertex1IdSet.contains(vertex1Id)) {
							vertex1IdSet.add(vertex1Id);
							output.collect(new Vertex(vertex1Id, finalVertex1Label, properties, graphIds));
						}
						
						properties = new Properties();
						properties.set(Property.create("value", inputs[4]));
						GradoopId vertex2Id = GradoopId.fromString(inputs[5]);
						
						if(!vertex2IdSet.contains(vertex2Id)) {
							vertex2IdSet.add(vertex2Id);
							output.collect(new Vertex(vertex2Id, finalVertex2Label, properties, graphIds));
						}
					}
				});
		DataSet<Edge> edges = gfc.getExecutionEnvironment().fromCollection(queryResults)
				.flatMap(new FlatMapFunction<String, Edge>(){
					public void flatMap(String input, Collector<Edge> output){

						String[] inputs = input.split(";");
						
						Properties properties = new Properties();
						properties.set(Property.create("value", inputs[2]));
						output.collect(new Edge(GradoopId.fromString(inputs[3]), finalEdgeLabel, GradoopId.fromString(inputs[1]),GradoopId.fromString(inputs[5]), properties, graphIds));
					}
				});
		DataSet<GraphHead> graphHeads= gfc.getExecutionEnvironment().fromCollection(queryResults)
				.flatMap(new FlatMapFunction<String, GraphHead>(){
					public void flatMap(String input, Collector<GraphHead> output){

						String[] inputs = input.split(";");
						
						Properties properties = new Properties();
						properties.set(Property.create("value", inputs[2]));
						output.collect(new GraphHead(graphId, "", new Properties()));
					}
				});		
		
		return ServiceHelper.getConfig().getLogicalGraphFactory().fromDataSets(graphHeads, vertices, edges);
	}
}
