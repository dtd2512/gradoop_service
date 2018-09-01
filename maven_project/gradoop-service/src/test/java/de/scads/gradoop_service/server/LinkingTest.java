package de.scads.gradoop_service.server;

import de.scads.gradoop_service.server.helper.ServiceHelper;
import de.scads.gradoop_service.server.helper.linking.LinkingHelper;

import org.apache.flink.api.java.io.LocalCollectionOutputFormat;
import org.assertj.core.api.Condition;
import org.codehaus.jettison.json.JSONObject;
import org.gradoop.common.model.impl.pojo.Edge;
import org.gradoop.flink.model.api.epgm.LogicalGraph;
import org.junit.Test;

import static org.assertj.core.api.Assertions.anyOf;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.util.Sets.newLinkedHashSet;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;


public class LinkingTest {
	
	private static final String BASIC_CONFIG = "{\"linkingConfig\":{"
			+ "\"linkSpec\":{"
				+ "\"blockingComponents\":[{\"blockingMethod\":\"CARTESIAN_PRODUCT\",\"windowSize\":-1,"
					+ "\"keyGenerationComponent\":{\"attribute\":\"\",\"prefixLength\":-1,\"qgramNo\":-1,\"qgramThreshold\":-1,\"tokenizer\":\"\"}}],"
				+ "\"similarityComponents\":["
					+ "{\"id\":\"sim1\",\"sourceGraph\":\"testdata\",\"targetGraph\":\"testdata\",\"sourceLabel\":\"Person\",\"targetLabel\":\"Person\","
					+ "\"sourceAttribute\":\"name\",\"targetAttribute\":\"name\",\"weight\":\"1\","
					+ "\"similarityMethod\":\"EDIT_DISTANCE\",\"threshold\":-1,\"length\":-1,\"padding\":-1,\"tokenizer\":\"\","
					+ "\"jaroWinklerThreshold\":-1,\"minLength\":-1,\"maxToleratedDis\":-1,\"maxToleratedPercentage\":-1}],"
				+ "\"selectionComponent\":{\"aggregationStrategy\":\"ARITHMETIC_AVERAGE\",\"aggregationThreshold\":\"0.2\","
					+ "\"ruleComponents\":[{\"componentType\":\"COMPUTED_EXPRESSION_TRUE\"}]},"
				+ "\"keepCurrentEdges\":false,"
				+ "\"edgeLabel\":\"similarity\","
				+ "\"aggregationRuleEnabled\":true,"
				+ "\"selectionRuleEnabled\":false}},"
			+ "\"inputGraphs\":["
				+ "{\"connectorIdentifier\":\"testdata\",\"inputGraphIdentifier\":\"testdata\"}]}";
	
	private static final String MULTIPLE_INPUTS_CONFIG = "{\"linkingConfig\":{"
			+ "\"linkSpec\":{"
				+ "\"blockingComponents\":[{\"blockingMethod\":\"CARTESIAN_PRODUCT\",\"windowSize\":-1,"
					+ "\"keyGenerationComponent\":{\"attribute\":\"\",\"prefixLength\":-1,\"qgramNo\":-1,\"qgramThreshold\":-1,\"tokenizer\":\"\"}}],"
				+ "\"similarityComponents\":["
					+ "{\"id\":\"sim1\",\"sourceGraph\":\"anotherdata\",\"targetGraph\":\"somedata\",\"sourceLabel\":\"AnotherPerson\",\"targetLabel\":\"SomePerson\","
					+ "\"sourceAttribute\":\"name\",\"targetAttribute\":\"name\",\"weight\":\"1\","
					+ "\"similarityMethod\":\"EDIT_DISTANCE\",\"threshold\":-1,\"length\":-1,\"padding\":-1,\"tokenizer\":\"\","
					+ "\"jaroWinklerThreshold\":-1,\"minLength\":-1,\"maxToleratedDis\":-1,\"maxToleratedPercentage\":-1},"
					+ "{\"id\":\"sim2\",\"sourceGraph\":\"filteredTestdata\",\"targetGraph\":\"filteredTestdata\",\"sourceLabel\":\"Person\",\"targetLabel\":\"Person\","
					+ "\"sourceAttribute\":\"name\",\"targetAttribute\":\"name\",\"weight\":\"1\","
					+ "\"similarityMethod\":\"EDIT_DISTANCE\",\"threshold\":-1,\"length\":-1,\"padding\":-1,\"tokenizer\":\"\","
					+ "\"jaroWinklerThreshold\":-1,\"minLength\":-1,\"maxToleratedDis\":-1,\"maxToleratedPercentage\":-1}],"
				+ "\"selectionComponent\":{\"aggregationStrategy\":\"ARITHMETIC_AVERAGE\",\"aggregationThreshold\":\"0.2\","
					+ "\"ruleComponents\":[{\"componentType\":\"COMPUTED_EXPRESSION_TRUE\"}]},"
				+ "\"keepCurrentEdges\":false,"
				+ "\"edgeLabel\":\"similarity\","
				+ "\"aggregationRuleEnabled\":true,"
				+ "\"selectionRuleEnabled\":false}},"
			+ "\"inputGraphs\":["
				+ "{\"connectorIdentifier\":\"filteredTestdata\",\"inputGraphIdentifier\":\"testdata\"},"
				+ "{\"connectorIdentifier\":\"anotherdata\",\"inputGraphIdentifier\":\"anotherdata\"},"
				+ "{\"connectorIdentifier\":\"somedata\",\"inputGraphIdentifier\":\"somedata\"}]}";
	
	private static final String STANDARD_BLOCKING_CONFIG = "{\"linkingConfig\":{"
			+ "\"linkSpec\":{"
				+ "\"blockingComponents\":[{\"blockingMethod\":\"STANDARD_BLOCKING\",\"windowSize\":-1,"
					+ "\"keyGenerationComponent\":{\"keyGenerationMethod\":\"QGRAMS\",\"attribute\":\"city\",\"prefixLength\":-1,\"qgramNo\":\"3\",\"qgramThreshold\":\"0.5\",\"tokenizer\":\"\"}}],"
				+ "\"similarityComponents\":["
					+ "{\"id\":\"sim1\",\"sourceGraph\":\"testdata\",\"targetGraph\":\"testdata\",\"sourceLabel\":\"Person\",\"targetLabel\":\"Person\","
					+ "\"sourceAttribute\":\"name\",\"targetAttribute\":\"name\",\"weight\":\"1\","
					+ "\"similarityMethod\":\"EDIT_DISTANCE\",\"threshold\":-1,\"length\":-1,\"padding\":-1,\"tokenizer\":\"\","
					+ "\"jaroWinklerThreshold\":-1,\"minLength\":-1,\"maxToleratedDis\":-1,\"maxToleratedPercentage\":-1}],"
				+ "\"selectionComponent\":{\"aggregationStrategy\":\"ARITHMETIC_AVERAGE\",\"aggregationThreshold\":\"0.2\",\"ruleComponents\":[{\"componentType\":\"COMPUTED_EXPRESSION_TRUE\"}]},"
				+ "\"keepCurrentEdges\":false,"
				+ "\"edgeLabel\":\"similarity\","
				+ "\"aggregationRuleEnabled\":true,"
				+ "\"selectionRuleEnabled\":false}},"
			+ "\"inputGraphs\":[{\"connectorIdentifier\":\"testdata\",\"inputGraphIdentifier\":\"testdata\"}]}";
	
	private static final String SORTED_NEIGHBORHOOD_CONFIG = "{\"linkingConfig\":{"
			+ "\"linkSpec\":{"
				+ "\"blockingComponents\":[{\"blockingMethod\":\"SORTED_NEIGHBORHOOD\",\"windowSize\":\"3\","
					+ "\"keyGenerationComponent\":{\"keyGenerationMethod\":\"FULL_ATTRIBUTE\",\"attribute\":\"name\",\"prefixLength\":-1,\"qgramNo\":-1,\"qgramThreshold\":-1,\"tokenizer\":\"\"}}],"
				+ "\"similarityComponents\":["
					+ "{\"id\":\"sim1\",\"sourceGraph\":\"testdata\",\"targetGraph\":\"testdata\",\"sourceLabel\":\"Person\",\"targetLabel\":\"Person\","
					+ "\"sourceAttribute\":\"name\",\"targetAttribute\":\"name\",\"weight\":\"1\","
					+ "\"similarityMethod\":\"EDIT_DISTANCE\",\"threshold\":-1,\"length\":-1,\"padding\":-1,\"tokenizer\":\"\","
					+ "\"jaroWinklerThreshold\":-1,\"minLength\":-1,\"maxToleratedDis\":-1,\"maxToleratedPercentage\":-1}],"
				+ "\"selectionComponent\":{\"aggregationStrategy\":\"ARITHMETIC_AVERAGE\",\"aggregationThreshold\":\"0.2\",\"ruleComponents\":[{\"componentType\":\"COMPUTED_EXPRESSION_TRUE\"}]},"
				+ "\"keepCurrentEdges\":false,"
				+ "\"edgeLabel\":\"similarity\","
				+ "\"aggregationRuleEnabled\":true,"
				+ "\"selectionRuleEnabled\":false}},"
			+ "\"inputGraphs\":[{\"connectorIdentifier\":\"testdata\",\"inputGraphIdentifier\":\"testdata\"}]}";
	
	
    @Test
    public void basicTest() throws Exception {
    	ServiceHelper.setLocalExecution();
    	
    	JSONObject configObject = new JSONObject(BASIC_CONFIG);  	
    	String linkingConfig = configObject.getString("linkingConfig");
    	String inputGraphs = configObject.getString("inputGraphs");
	
		LogicalGraph inputGraph = LinkingHelper.prepareInputGraph(inputGraphs, null);			
		LogicalGraph linkedGraph = LinkingHelper.runLinking(inputGraph, linkingConfig);
    			
        long vertexCount = linkedGraph.getVertices().count();
        long edgeCount = linkedGraph.getEdges().count();

		System.out.println("Linked graph vertex count is " + vertexCount + ", supposed to be 11");
		System.out.println("Linked graph edge count is " + edgeCount + ", supposed to be 6");        
        
        assertThat(vertexCount).isEqualTo(11);
        assertThat(edgeCount).isEqualTo(6);
        
        List<Edge> resultEdges = new ArrayList<>();
        linkedGraph.getEdges().output(new LocalCollectionOutputFormat<>(resultEdges));
        
        ServiceHelper.getConfig().getExecutionEnvironment().execute();  
        
        Set<Double> similarities = newLinkedHashSet(0.25, 0.33, 0.40, 0.50);
        Condition<Double> allowedSimilarities = new Condition<>(similarities::contains, "similarities");
        
        // count of similarities with value 0.4
        int similarity040ValueCount = 0;
        
        for(Edge e: resultEdges) {
        	double value = Double.parseDouble(e.getPropertyValue("similarity").toString());
        	Double roundedValue = Math.round(value*100)/100.0;

        	if(roundedValue.compareTo(0.4) == 0) {
        		similarity040ValueCount++;	
        	}
        	
        	assertThat(roundedValue).is(anyOf(allowedSimilarities));
        }
        
		System.out.println("Number of edges with similarity of 0.4 is " + similarity040ValueCount + ", supposed to be 3");
        assertThat(similarity040ValueCount).isEqualTo(3);
    }

    @Test
    public void multipleInputsTest() throws Exception {
    	ServiceHelper.setLocalExecution();
    	
    	JSONObject configObject = new JSONObject(MULTIPLE_INPUTS_CONFIG);  	
    	String linkingConfig = configObject.getString("linkingConfig");
    	String inputGraphs = configObject.getString("inputGraphs");
	
		LogicalGraph inputGraph = LinkingHelper.prepareInputGraph(inputGraphs, null);			
		LogicalGraph linkedGraph = LinkingHelper.runLinking(inputGraph, linkingConfig);
    			
        long vertexCount = linkedGraph.getVertices().count();
        long edgeCount = linkedGraph.getEdges().count();

		System.out.println("Linked graph vertex count is " + vertexCount + ", supposed to be 33");
		System.out.println("Linked graph edge count is " + edgeCount + ", supposed to be 24");        
        
        assertThat(vertexCount).isEqualTo(33);
        assertThat(edgeCount).isEqualTo(24);
        
        List<Edge> resultEdges = new ArrayList<>();
        linkedGraph.getEdges().output(new LocalCollectionOutputFormat<>(resultEdges));
        
        ServiceHelper.getConfig().getExecutionEnvironment().execute();  
        
        Set<Double> similarities = newLinkedHashSet(0.25, 0.33, 0.40, 0.50, 1.00);
        Condition<Double> allowedSimilarities = new Condition<>(similarities::contains, "similarities");
        
        // count of similarities with value 0.25, 0.33, 0.40, 0.50, 1.00
        int similarity025ValueCount = 0;
        int similarity033ValueCount = 0;
        int similarity040ValueCount = 0;
        int similarity050ValueCount = 0;
        int similarity100ValueCount = 0;
        
        for(Edge e: resultEdges) {
        	double value = Double.parseDouble(e.getPropertyValue("similarity").toString());
        	Double roundedValue = Math.round(value*100)/100.0;

	        	if(roundedValue.compareTo(0.25) == 0) {
	        		similarity025ValueCount++;	
	        	}
	        	else if(roundedValue.compareTo(0.33) == 0) {
	        		similarity033ValueCount++;	
	        	}
	        	else if(roundedValue.compareTo(0.40) == 0) {
	        		similarity040ValueCount++;	
	        	}
	        	else if(roundedValue.compareTo(0.50) == 0) {
	        		similarity050ValueCount++;	
	        	}
	        	else if(roundedValue.compareTo(1.00) == 0) {
	        		similarity100ValueCount++;	
	        	}
        	
        	assertThat(roundedValue).is(anyOf(allowedSimilarities));
        }
        
		System.out.println("Number of edges with similarity of 0.25 is " + similarity025ValueCount + ", supposed to be 3");
		System.out.println("Number of edges with similarity of 0.33 is " + similarity033ValueCount + ", supposed to be 3");
		System.out.println("Number of edges with similarity of 0.40 is " + similarity040ValueCount + ", supposed to be 9");
		System.out.println("Number of edges with similarity of 0.50 is " + similarity050ValueCount + ", supposed to be 3");
		System.out.println("Number of edges with similarity of 1.00 is " + similarity100ValueCount + ", supposed to be 6");
        
        assertThat(similarity025ValueCount).isEqualTo(3);
        assertThat(similarity033ValueCount).isEqualTo(3);
        assertThat(similarity040ValueCount).isEqualTo(9);
        assertThat(similarity050ValueCount).isEqualTo(3);
        assertThat(similarity100ValueCount).isEqualTo(6);
    }
    
    @Test
    public void standardBlockingTest() throws Exception {
    	ServiceHelper.setLocalExecution();
    	
    	JSONObject configObject = new JSONObject(STANDARD_BLOCKING_CONFIG);  	
    	String linkingConfig = configObject.getString("linkingConfig");
    	String inputGraphs = configObject.getString("inputGraphs");
	
		LogicalGraph inputGraph = LinkingHelper.prepareInputGraph(inputGraphs, null);			
		LogicalGraph linkedGraph = LinkingHelper.runLinking(inputGraph, linkingConfig);
    			
        long vertexCount = linkedGraph.getVertices().count();
        long edgeCount = linkedGraph.getEdges().count();

		System.out.println("Linked graph vertex count is " + vertexCount + ", supposed to be 11");
		System.out.println("Linked graph edge count is " + edgeCount + ", supposed to be 2");        
        
        assertThat(vertexCount).isEqualTo(11);
        assertThat(edgeCount).isEqualTo(2);
        
        List<Edge> resultEdges = new ArrayList<>();
        linkedGraph.getEdges().output(new LocalCollectionOutputFormat<>(resultEdges));
        
        ServiceHelper.getConfig().getExecutionEnvironment().execute();  
        
        Set<Double> similarities = newLinkedHashSet(0.40, 0.50);
        Condition<Double> allowedSimilarities = new Condition<>(similarities::contains, "similarities");
        
        // count of similarities with value 0.40, 0.50
        int similarity040ValueCount = 0;
        int similarity050ValueCount = 0;
        
        for(Edge e: resultEdges) {
        	double value = Double.parseDouble(e.getPropertyValue("similarity").toString());
        	Double roundedValue = Math.round(value*100)/100.0;

	        	if(roundedValue.compareTo(0.40) == 0) {
	        		similarity040ValueCount++;	
	        	}
	        	else if(roundedValue.compareTo(0.50) == 0) {
	        		similarity050ValueCount++;	
	        	}
        	
        	assertThat(roundedValue).is(anyOf(allowedSimilarities));
        }
        
		System.out.println("Number of edges with similarity of 0.40 is " + similarity040ValueCount + ", supposed to be 1");
		System.out.println("Number of edges with similarity of 0.50 is " + similarity050ValueCount + ", supposed to be 1");
        
        assertThat(similarity040ValueCount).isEqualTo(1);
        assertThat(similarity050ValueCount).isEqualTo(1);
    }
    
    @Test
    public void sortedNeighborhoodTest() throws Exception {
    	ServiceHelper.setLocalExecution();
    	
    	JSONObject configObject = new JSONObject(SORTED_NEIGHBORHOOD_CONFIG);  	
    	String linkingConfig = configObject.getString("linkingConfig");
    	String inputGraphs = configObject.getString("inputGraphs");
	
		LogicalGraph inputGraph = LinkingHelper.prepareInputGraph(inputGraphs, null);			
		LogicalGraph linkedGraph = LinkingHelper.runLinking(inputGraph, linkingConfig);
    			
        long vertexCount = linkedGraph.getVertices().count();
        long edgeCount = linkedGraph.getEdges().count();

		System.out.println("Linked graph vertex count is " + vertexCount + ", supposed to be 11");
		System.out.println("Linked graph edge count is " + edgeCount + ", supposed to be 4");        
        
        assertThat(vertexCount).isEqualTo(11);
        assertThat(edgeCount).isEqualTo(4);
        
        List<Edge> resultEdges = new ArrayList<>();
        linkedGraph.getEdges().output(new LocalCollectionOutputFormat<>(resultEdges));
        
        ServiceHelper.getConfig().getExecutionEnvironment().execute();  
        
        Set<Double> similarities = newLinkedHashSet(0.40, 0.50);
        Condition<Double> allowedSimilarities = new Condition<>(similarities::contains, "similarities");
        
        // count of similarities with value 0.40, 0.50
        int similarity040ValueCount = 0;
        int similarity050ValueCount = 0;
        
        for(Edge e: resultEdges) {
        	double value = Double.parseDouble(e.getPropertyValue("similarity").toString());
        	Double roundedValue = Math.round(value*100)/100.0;

	        	if(roundedValue.compareTo(0.40) == 0) {
	        		similarity040ValueCount++;	
	        	}
	        	else if(roundedValue.compareTo(0.50) == 0) {
	        		similarity050ValueCount++;	
	        	}
        	
        	assertThat(roundedValue).is(anyOf(allowedSimilarities));
        }
        
		System.out.println("Number of edges with similarity of 0.40 is " + similarity040ValueCount + ", supposed to be 3");
		System.out.println("Number of edges with similarity of 0.50 is " + similarity050ValueCount + ", supposed to be 1");
        
        assertThat(similarity040ValueCount).isEqualTo(3);
        assertThat(similarity050ValueCount).isEqualTo(1);
    }
}
