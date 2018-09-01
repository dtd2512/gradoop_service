package de.scads.gradoop_service.server;

import de.scads.gradoop_service.server.helper.ServiceHelper;
import de.scads.gradoop_service.server.helper.filtering.FilteringHelper;
import org.apache.flink.api.java.io.LocalCollectionOutputFormat;
import org.assertj.core.api.Condition;
import org.gradoop.common.model.impl.pojo.Edge;
import org.gradoop.common.model.impl.pojo.Vertex;
import org.gradoop.flink.model.api.epgm.LogicalGraph;
import org.junit.Test;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.anyOf;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.util.Sets.newLinkedHashSet;

/**
 * test class for filtering
 */
public class FilteringTest extends ServiceTestBase {
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

    // a simple filter example based on the graph "testdata"
	private static final String FILTER_EXAMPLE = 
			 "{\"vertex\": [\n"
			+"\t\t{\"label\": \"Person\",\n"
			+"\t\t \"eval\": \"and,or\",\n"
			+"\t\t \"filter\": [\n"
			+"\t\t\t\t{\"id\": 0,\"type\": \"textual\",\"attribute\": \"city\",\"operation\": \"equal\",\"rightSide\": \"Dresden\"},\n"
			+"\t\t\t\t{\"id\": 1,\"type\": \"textual\",\"attribute\": \"gender\",\"operation\": \"starts_with\",\"rightSide\": \"f\"},\n"
			+"\t\t\t\t{\"id\": 2,\"type\": \"numeric\",\"attribute\": \"age\",\"operation\": \"lesser\",\"rightSide\": 25}]},\n"
			+"\t\t{\"label\": \"Forum\",\n"
			+"\t\t \"eval\": \"\",\n"
			+"\t\t \"filter\": [\n"
			+"\t\t\t\t{\"id\": 0,\"type\": \"textual\",\"attribute\": \"title\",\"operation\": \"contains\",\"rightSide\": \"Graph\"}]}],\n"
			+" \"edge\": []}";
				
    // an existance filter example test based on the graph "testdata"
	private static final String EXISTANCE_EXAMPLE =
			 "{\"vertex\": [\n"
			+"\t\t{\"label\": \"Person\",\n"
			+"\t\t \"eval\": \"or\",\n"
			+"\t\t \"filter\": [\n"
			+"\t\t\t{\"id\": 0,\"type\": \"textual\",\"attribute\": \"speaks\",\"operation\": \"exists\",\"rightSide\": \"\"},\n"
			+"\t\t\t{\"id\": 1,\"type\": \"textual\",\"attribute\": \"locIP\",\"operation\": \"exists\",\"rightSide\": \"\"}]}],\n"
			+" \"edge\": []}";
	
    // a non-existance filter example test based on the graph "testdata"
    private static final String NON_EXISTANCE_EXAMPLE = 
    		 "{\"vertex\": [\n"
    		+"\t\t{\"label\": \"Person\",\n"
    		+"\t\t \"eval\": \"\",\n"
    		+"\t\t \"filter\": [\n"
    		+"\t\t\t{\"id\": 0,\"type\": \"textual\",\"attribute\": \"speaks\",\"operation\": \"not_exists\",\"rightSide\": \"\"}]}],\n"
    		+" \"edge\": []}";
    
    // an existance filter example test based on the graph "testdata"
    private static final String ALL_OF_LABEL_EXAMPLE =
	    	 "{\"vertex\": [\n"
		    +"\t\t{\"label\": \"Person\",\n"
		    +"\t\t \"eval\": \"\",\n"
		    +"\t\t \"filter\": []}],\n"
		    +" \"edge\": []}";
    
    @Test
    public void executeFiltering() throws Exception {
        LogicalGraph filteredGraph = FilteringHelper.createSubGraph(graph, FILTER_EXAMPLE);

        long vertexCount = filteredGraph.getVertices().count();
        long edgeCount = filteredGraph.getEdges().count();

        List<Vertex> resultVertices = new ArrayList<>();
        filteredGraph.getVertices().output(new LocalCollectionOutputFormat<>(resultVertices));

        List<Edge> resultEdges = new ArrayList<>();
        filteredGraph.getEdges().output(new LocalCollectionOutputFormat<>(resultEdges));

//        GraphHelper.storeGraph(filteredGraph,"filtered_testdata");

        ServiceHelper.getConfig().getExecutionEnvironment().execute();

        assertThat(vertexCount).isEqualTo(5);
        assertThat(edgeCount).isEqualTo(4);

        // check whether all females and cites are contained
        Set<String> females = newLinkedHashSet("Carol", "Eve", "Alice");
        Condition<String> acceptedFemale = new Condition<>(females::contains, "females");
        Set<String> cities = newLinkedHashSet("Leipzig", "Dresden");
        Condition<String> acceptedCity = new Condition<>(cities::contains, "cities");

        for (Vertex v : resultVertices) {
            if (v.getLabel().equals("Person")) {
                String name = v.getPropertyValue("name").getString();
                String city = v.getPropertyValue("city").getString();

                assertThat(name).is(anyOf(acceptedFemale));
                assertThat(city).is(anyOf(acceptedCity));
            }
        }
    }

    @Test
    public void executeExistanceTest() throws Exception {
        LogicalGraph filteredGraph = FilteringHelper.createSubGraph(graph, EXISTANCE_EXAMPLE);

        long vertexCount = filteredGraph.getVertices().count();
        long edgeCount = filteredGraph.getEdges().count();

        List<Vertex> resultVertices = new ArrayList<>();
        filteredGraph.getVertices().output(new LocalCollectionOutputFormat<>(resultVertices));

        List<Edge> resultEdges = new ArrayList<>();
        filteredGraph.getEdges().output(new LocalCollectionOutputFormat<>(resultEdges));

        Set<String> persons = newLinkedHashSet("Eve", "Frank");
        Condition<String> acceptedPersons = new Condition<>(persons::contains, "persons");
        
        assertThat(vertexCount).isEqualTo(2);
        assertThat(edgeCount).isEqualTo(0);
        
        for (Vertex v : resultVertices) {
        	assertThat(v.hasProperty("speaks") || v.hasProperty("locIP"));
        	
            String name = v.getPropertyValue("name").getString();
            assertThat(name).is(anyOf(acceptedPersons));
        }
    }
    
  
    @Test
    public void executeNonExistanceTest() throws Exception {
        LogicalGraph filteredGraph = FilteringHelper.createSubGraph(graph, NON_EXISTANCE_EXAMPLE);

        long vertexCount = filteredGraph.getVertices().count();
        long edgeCount = filteredGraph.getEdges().count();

        List<Vertex> resultVertices = new ArrayList<>();
        filteredGraph.getVertices().output(new LocalCollectionOutputFormat<>(resultVertices));

        List<Edge> resultEdges = new ArrayList<>();
        filteredGraph.getEdges().output(new LocalCollectionOutputFormat<>(resultEdges));

        Set<String> persons = newLinkedHashSet("Alice", "Bob", "Carol", "Dave", "Frank");
        Condition<String> acceptedPersons = new Condition<>(persons::contains, "persons");
        
        assertThat(vertexCount).isEqualTo(5);
        assertThat(edgeCount).isEqualTo(8);
        
        for (Vertex v : resultVertices) {
        	assertThat(!v.hasProperty("speaks"));
        	
            String name = v.getPropertyValue("name").getString();
            assertThat(name).is(anyOf(acceptedPersons));
        }
    }
    

    @Test
    public void acceptAllNodesOfLabel() throws Exception {
        LogicalGraph filteredGraph = FilteringHelper.createSubGraph(graph, ALL_OF_LABEL_EXAMPLE);

        List<Vertex> initialVertices = new ArrayList<>();
        graph.getVertices().output(new LocalCollectionOutputFormat<>(initialVertices));        
        
        long vertexCount = filteredGraph.getVertices().count();
        long edgeCount = filteredGraph.getEdges().count();

        List<Vertex> resultVertices = new ArrayList<>();
        filteredGraph.getVertices().output(new LocalCollectionOutputFormat<>(resultVertices));

        List<Edge> resultEdges = new ArrayList<>();
        filteredGraph.getEdges().output(new LocalCollectionOutputFormat<>(resultEdges));


        assertThat(vertexCount).isEqualTo(6);
        assertThat(edgeCount).isEqualTo(10);
        
        for(Vertex v: initialVertices) {
        	if (v.getLabel().equals("Person")) {
        		assertThat(resultVertices.contains(v));
        	}
        }
        
        for (Vertex v : resultVertices) {
        	assertThat(v.getLabel().equals("Person"));
        }
    }
}
