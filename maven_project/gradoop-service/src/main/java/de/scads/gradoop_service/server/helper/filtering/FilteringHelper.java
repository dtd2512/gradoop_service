package de.scads.gradoop_service.server.helper.filtering;

import com.google.common.collect.ArrayListMultimap;
import com.google.common.collect.Multimap;
import com.google.gson.*;
import de.scads.gradoop_service.server.helper.filtering.enums.*;
import de.scads.gradoop_service.server.helper.filtering.functions.EdgeFilterFunction;
import de.scads.gradoop_service.server.helper.filtering.functions.VertexFilterFunction;
import de.scads.gradoop_service.server.helper.filtering.pojos.FilterConfigElement;
import de.scads.gradoop_service.server.helper.filtering.pojos.FilterEvalElement;
import org.gradoop.flink.model.api.epgm.LogicalGraph;


/**
 * Contains the logic for creating vertex or edge induced subgraphs.
 */
public class FilteringHelper {
    private static final String VERTEX = "vertex";
    private static final String EDGE = "edge";

    /**
     * @return Returns a json string filled with the possible operations for filtering
     */
    public static String getFilterOperations() {
        JsonObject eval = new JsonObject();
        JsonArray evalOperations = new JsonArray();
        for(BinaryBooleanOperation to : BinaryBooleanOperation.values()) {
            evalOperations.add(to.toString().toLowerCase());
        }
        eval.add("eval", evalOperations);

        JsonObject numeric = new JsonObject();
        JsonArray numericOperations = new JsonArray();
        for(NumericalOperation to : NumericalOperation.values()) {
            numericOperations.add(to.toString().toLowerCase());
        }
        numeric.add("numeric", numericOperations);

        JsonObject textual = new JsonObject();
        JsonArray textualOperations = new JsonArray();
        for(TextualOperation to : TextualOperation.values()) {
            textualOperations.add(to.toString().toLowerCase());
        }
        textual.add("textual", textualOperations);


        JsonArray parentElements = new JsonArray();
        parentElements.add(eval);
        parentElements.add(numeric);
        parentElements.add(textual);

        JsonObject parent = new JsonObject();
        parent.add("operations", parentElements);

        return parent.toString();
    }

    /**
     * this method creates a vertex or edge induced subgraph from the JSON filterConfig.
     *
     * @param graph        - the graph to be filtered
     * @param filterConfig - the configuration for the filtering process
     * @return the vertex or edge induced subgraph
     */
    public static LogicalGraph createSubGraph(LogicalGraph graph, String filterConfig) {
        	

    	
    	LogicalGraph filteredGraph = graph;
    	
    	Multimap<String, FilterEvalElement> vertexFilterEvalRules = extractFilterEvalRules(VERTEX, filterConfig);
    	Multimap<String, FilterConfigElement> vertexFilterRules = extractFilterRules(VERTEX, filterConfig);
    	Multimap<String, FilterEvalElement> edgeFilterEvalRules = extractFilterEvalRules(EDGE, filterConfig);
    	Multimap<String, FilterConfigElement> edgeFilterRules = extractFilterRules(EDGE, filterConfig);
    	
    	boolean hasVertexFilteringType = hasFilteringType(filterConfig, VERTEX);
    	boolean hasEdgeFilteringType = hasFilteringType(filterConfig, EDGE);
    	
    	if(hasVertexFilteringType && !hasEdgeFilteringType) {
    		filteredGraph = filteredGraph.vertexInducedSubgraph(new VertexFilterFunction(vertexFilterEvalRules, vertexFilterRules));
    	}
    	else if(!hasVertexFilteringType && hasEdgeFilteringType) {
            filteredGraph = filteredGraph.edgeInducedSubgraph(new EdgeFilterFunction(edgeFilterEvalRules, edgeFilterRules));
    	}
    	else if (!hasVertexFilteringType && !hasEdgeFilteringType) {
    		return filteredGraph;
    	}
    	else {
    		filteredGraph = filteredGraph.vertexInducedSubgraph(new VertexFilterFunction(vertexFilterEvalRules, vertexFilterRules));
            filteredGraph = filteredGraph.edgeInducedSubgraph(new EdgeFilterFunction(edgeFilterEvalRules, edgeFilterRules));
    	}
    	
    	return filteredGraph;
		
		// alternative implementation with different functionality
		/*return graph.subgraph(
    		new VertexFilterFunction(extractFilterEvalRules(VERTEX, filterConfig), extractFilterRules(VERTEX, filterConfig)), 
			new EdgeFilterFunction(extractFilterEvalRules(EDGE, filterConfig), extractFilterRules(EDGE, filterConfig))
    	);*/
		
    }

    /*private static String extractFilteringType(String filterConfig) {
        // parse grouping configuration
        JsonParser parser = new JsonParser();
        JsonObject obj = parser.parse(filterConfig).getAsJsonObject();

        if (obj.has(VERTEX)) {
            return VERTEX;
        } else if (obj.has(EDGE)) {
            return EDGE;
        } else {
            throw new JsonParseException("Malformed Filter Configuration! The Outer array identifier is not appropriate! Use 'vertex' or 'edge' instead.");
        }
    }*/

    private static boolean hasFilteringType(String filterConfig, String filteringType) {
    	
        // filterConfig has the form {"edge":[...],"vertex":[...]}
    	// "edge" and "vertex" are both possible filtering types
    	// returns true if array with filtering options for the given filteringType is not empty       
    	JsonParser parser = new JsonParser();
        JsonObject obj = parser.parse(filterConfig).getAsJsonObject();
        
        if (obj.getAsJsonArray(filteringType).size() != 0) {
        	return true;
        }
        return false;
    }
    
    private static Multimap<String, FilterConfigElement> extractFilterRules(String filteringType, String filterConfig) {
        Multimap<String, FilterConfigElement> filterRules = ArrayListMultimap.create();

        // parse grouping configuration
        JsonParser parser = new JsonParser();
        JsonArray array = parser.parse(filterConfig).getAsJsonObject().get(filteringType).getAsJsonArray();
        for (JsonElement element : array) {
            JsonObject configElement = element.getAsJsonObject();
            String label = configElement.get("label").getAsString();

            // if all nodes of a certain label should be accepted we only add the label to the multimap
            if((configElement.get("filter") == null) || (configElement.get("filter").getAsJsonArray().size() == 0)) {
                filterRules.put(label, null);
            } else {
                JsonArray filterArray = configElement.get("filter").getAsJsonArray();
                for (JsonElement filterElement : filterArray) {
                    JsonObject filterObject = filterElement.getAsJsonObject();

                    Integer id = filterObject.get("id").getAsInt();
                    FilterType filterType = FilterType.valueOf(filterObject.get("type").getAsString().toUpperCase());
                    String attribute = filterObject.get("attribute").getAsString();
                    String rightSide = filterObject.get("rightSide").getAsString();

                    Operation operation = null;
                    if (filterType.equals(FilterType.NUMERIC)) {
                        operation = NumericalOperation.valueOf(filterObject.get("operation").getAsString().toUpperCase());
                    } else if (filterType.equals(FilterType.TEXTUAL)) {
                        operation = TextualOperation.valueOf(filterObject.get("operation").getAsString().toUpperCase());
                    }

                    FilterConfigElement fce = new FilterConfigElement(id, filterType, attribute, operation, rightSide);
                    filterRules.put(label, fce);
                }
            }
        }
        

        return filterRules;
    }

    private static Multimap<String, FilterEvalElement> extractFilterEvalRules(String filteringType, String filterConfig) {
        Multimap<String, FilterEvalElement> evalRules = ArrayListMultimap.create();

        // parse grouping configuration
        JsonParser parser = new JsonParser();
        JsonArray array = parser.parse(filterConfig).getAsJsonObject().get(filteringType).getAsJsonArray();

        for (JsonElement element : array) {
            JsonObject configElement = element.getAsJsonObject();
            String label = configElement.get("label").getAsString();
            JsonElement eval = configElement.get("eval");

            if ((eval != null) && (!eval.getAsString().isEmpty())) {
                String[] evalOperators = eval.getAsString().split(",");

                for (int i = 0; i < evalOperators.length; i++) {
                    BinaryBooleanOperation op = BinaryBooleanOperation.valueOf(evalOperators[i].toUpperCase());
                    FilterEvalElement evalElement = new FilterEvalElement(op, i, i + 1);
                    evalRules.put(label, evalElement);
                }
            }
        }
        return evalRules;
    }
}
