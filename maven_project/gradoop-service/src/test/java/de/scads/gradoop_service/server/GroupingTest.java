package de.scads.gradoop_service.server;

import de.scads.gradoop_service.server.helper.ServiceHelper;
import de.scads.gradoop_service.server.helper.grouping.GroupingHelper;

import org.apache.flink.api.common.functions.CoGroupFunction;
import org.apache.flink.api.common.functions.FilterFunction;
import org.apache.flink.api.common.functions.JoinFunction;
import org.apache.flink.api.java.DataSet;
import org.apache.flink.api.java.functions.KeySelector;
import org.apache.flink.api.java.io.LocalCollectionOutputFormat;
import org.apache.flink.api.java.operators.JoinOperator;
import org.apache.flink.api.java.operators.join.JoinFunctionAssigner;
import org.apache.flink.api.java.tuple.Tuple2;
import org.apache.flink.util.Collector;
import org.apache.log4j.Level;
import org.apache.log4j.Logger;
import org.gradoop.common.model.impl.id.GradoopId;
import org.gradoop.common.model.impl.pojo.Edge;
import org.gradoop.common.model.impl.pojo.Vertex;
import org.gradoop.flink.io.impl.json.JSONDataSource;
import org.gradoop.flink.model.api.epgm.LogicalGraph;
import org.gradoop.flink.model.impl.operators.grouping.Grouping;
import org.junit.Before;
import org.junit.Test;

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

import java.util.ArrayList;
import java.util.List;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;

/**
 * Test class for the grouping part of the request handler
 */
public class GroupingTest {
    /**********************************************************************************************
     MetaData of the graph "testdata"

     {
     "vertexKeys":
     [
     {"labels":["Person"],"name":"speaks","numerical":false},
     {"labels":["Forum"],"name":"title","numerical":false},
     {"labels":["Tag","Person"],"name":"name","numerical":false},
     {"labels":["Person"],"name":"age","numerical":true},
     {"labels":["Person"],"name":"city","numerical":false},
     {"labels":["Person"],"name":"gender","numerical":false},
     {"labels":["Person"],"name":"locIP","numerical":false}
     ],

     "edgeKeys":
     [
     {"labels":["knows"],"name":"since","numerical":true}
     ],

     "vertexLabels": ["Tag","Person","Forum"],
     "edgeLabels":["hasInterest","hasTag","hasMember","hasModerator","knows"]
     }

     **********************************************************************************************/

    // the test config is based on the meta data of test data
    private static final String GROUPING = "{ \"conf\":" +
            "[{\"type\": \"vertex\", \"label\": \"Person\", \"keys\": \"city\"}," +
            "{\"type\": \"vertex\", \"label\": \"Forum\", \"keys\": \"title\"}" +
            "]}";
    private static final String GROUPING_STRAT = "GROUP_COMBINE";
    private static Logger logger = Logger.getLogger(GroupingTest.class);

    @Before
    public void init() {
        logger.setLevel(Level.INFO);
        ServiceHelper.setLocalExecution();
    }

    @Test
    public void executeGrouping() throws Exception {
        String file = GroupingTest.class.getResource("/data/testdata/").getFile();

        JSONDataSource source = new JSONDataSource(file, ServiceHelper.getConfig());
        LogicalGraph graph = source.getLogicalGraph();

       
        /*DataSet<Vertex> result = graph.getVertices().join(graph.getEdges()).where("id").equalTo("sourceId").with(new JoinFunction<Vertex, Edge, Vertex>() {
            
			@Override
			public Vertex join(Vertex arg0, Edge arg1) throws Exception {
				// TODO Auto-generated method stub
				return arg0;
			}
         });*/
 
     
        //graph = graph.getConfig().getLogicalGraphFactory().fromDataSets(result, graph.getEdges());

        //System.out.println(graph.getVertices().count());
        //System.out.println(graph.getEdges().count());       
        
        
        Grouping grouping = GroupingHelper.buildGroupingWorkflow(GROUPING_STRAT, GROUPING);
        assertNotNull(grouping);

        LogicalGraph groupedGraph = grouping.execute(graph);
        long vertexCount = groupedGraph.getVertices().count();
        long edgeCount = groupedGraph.getEdges().count();

        List<Vertex> resultVertices = new ArrayList<>();
        groupedGraph.getVertices().output(new LocalCollectionOutputFormat<>(resultVertices));

        List<Edge> resultEdges = new ArrayList<>();
        groupedGraph.getEdges().output(new LocalCollectionOutputFormat<>(resultEdges));

     
        
//        GraphHelper.storeGraph(groupedGraph,"grouped_testdata");

        ServiceHelper.getConfig().getExecutionEnvironment().execute();

//        System.out.println("Vertices("+resultVertices.size()+"/"+vertexCount+"): " + resultVertices);
//        System.out.println("Edges("+resultEdges.size()+"/"+edgeCount+"): " + resultEdges);

        assertEquals(6, vertexCount);
        assertEquals(14, edgeCount);
        
        

    }
    
  
    
    ////-------------
    
    
    
    public LogicalGraph annotateWithNeighbor(LogicalGraph graph, String groupedElement, String neighborLabel){
		
//    	//get all Vertices with given label
        DataSet<Vertex> tagVertices = graph.getVertices().filter(new FilterFunction<Vertex>() {
			
			@Override
			public boolean filter(Vertex value) throws Exception {
				return value.getLabel().equals(neighborLabel);
			}
		});
        
        
        DataSet<Vertex> personVertices = graph.getVertices().filter(new FilterFunction<Vertex>() {
			
			@Override
			public boolean filter(Vertex value) throws Exception {
				return value.getLabel().equals(groupedElement);
			}
		});
        
        
        DataSet<Vertex> outgoing = personVertices.join(graph.getEdges()).where("id").equalTo("sourceId").
        		join(tagVertices).where(new KeySelector<Tuple2<Vertex,Edge>, GradoopId>() {

					@Override
					public GradoopId getKey(Tuple2<Vertex, Edge> value) throws Exception {
						return value.f1.getTargetId();
					}
				}).equalTo("id").with(new JoinFunction<Tuple2<Vertex,Edge>,Vertex, Vertex>() {
					@Override
					public Vertex join(Tuple2<Vertex, Edge> first, Vertex second) throws Exception {
						 first.f0.setProperty("_neighbor_", second.getId());
						return first.f0;
					}
				});
        
        DataSet<Vertex> incoming = personVertices.join(graph.getEdges()).where("id").equalTo("targetId").
        		join(tagVertices).where(new KeySelector<Tuple2<Vertex,Edge>, GradoopId>() {

					@Override
					public GradoopId getKey(Tuple2<Vertex, Edge> value) throws Exception {
						return value.f1.getSourceId();
					}
				}).equalTo("id").with(new JoinFunction<Tuple2<Vertex,Edge>,Vertex, Vertex>() {
					@Override
					public Vertex join(Tuple2<Vertex, Edge> first, Vertex second) throws Exception {
						 first.f0.setProperty("_neighbor_", second.getId());
						return first.f0;
					}
				});
        		 
       DataSet inAndOut=incoming.union(outgoing).distinct("id"); 	
       DataSet allVertices= graph.getVertices().leftOuterJoin(inAndOut).where("id").equalTo("id").with(new JoinFunction<Vertex, Vertex, Vertex>(){

			@Override
			public Vertex join(Vertex first, Vertex second) throws Exception {
				if(second!=null)
				return second;
				return first;
			}
        	
        });
  
         graph = graph.getConfig().getLogicalGraphFactory().fromDataSets(allVertices, graph.getEdges());

        
    	
    	return graph;
    }
    
    
    private static final String GROUPING_BY_NEIGHBORS = "{ \"conf\":" +
            "[{\"type\": \"vertex\", \"label\": \"Person\", \"keys\": \"\", \"byneighbor\": \"Forum\"}" +
            "]}";
    
    @Test
    public void executeGroupingWithEdges() throws Exception {
    	    	
        String file = GroupingTest.class.getResource("/data/testdata/").getFile();

        JSONDataSource source = new JSONDataSource(file, ServiceHelper.getConfig());
        LogicalGraph graph = source.getLogicalGraph();
             
        JsonParser parser = new JsonParser();
		JsonArray array = parser.parse(GROUPING_BY_NEIGHBORS).getAsJsonObject().get(GroupingHelper.ARRAY_IDENTIFIER).getAsJsonArray();
		for (JsonElement element : array) {
			JsonObject configElement = element.getAsJsonObject();
			String type = configElement.get(GroupingHelper.GROUPING_PRIMITIVE).getAsString();
			String label = configElement.get(GroupingHelper.GROUPING_LABEL).getAsString();
			if (configElement.has(GroupingHelper.GROUPING_NEIGHBORS)) {
				String neighbor = configElement.get(GroupingHelper.GROUPING_NEIGHBORS).getAsString();
				graph= annotateWithNeighbor(graph, label, neighbor);
			}	
		}
		
        Grouping grouping = GroupingHelper.buildGroupingWorkflow(GROUPING_STRAT, GROUPING_BY_NEIGHBORS);
        assertNotNull(grouping);
      
        LogicalGraph groupedGraph = grouping.execute(graph);
        long vertexCount = groupedGraph.getVertices().count();
        long edgeCount = groupedGraph.getEdges().count();

        List<Vertex> resultVertices = new ArrayList<>();
        groupedGraph.getVertices().output(new LocalCollectionOutputFormat<>(resultVertices));

        List<Edge> resultEdges = new ArrayList<>();
        groupedGraph.getEdges().output(new LocalCollectionOutputFormat<>(resultEdges));

        ServiceHelper.getConfig().getExecutionEnvironment().execute();
        groupedGraph.getVertices().print();

        assertEquals(5, vertexCount);
        assertEquals(14, edgeCount);
    } 
}



