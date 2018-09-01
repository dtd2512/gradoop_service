package de.scads.gradoop_service.server.helper;

import java.util.ArrayList;
import java.util.Collection;

import org.codehaus.jettison.json.JSONArray;
import org.gradoop.flink.model.api.epgm.GraphCollection;
import org.gradoop.flink.model.api.epgm.LogicalGraph;
import org.gradoop.flink.model.api.epgm.LogicalGraphFactory;
import org.gradoop.flink.model.impl.operators.combination.Combination;
import org.gradoop.flink.model.impl.operators.matching.common.statistics.GraphStatistics;
import org.gradoop.flink.model.impl.operators.union.Union;

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

public class PatternMatchingHelper {

	public static LogicalGraph runPatternMatching(LogicalGraph graph, String patternMatchConfig) throws Exception {

		StringBuffer cypherQuery = new StringBuffer();
		cypherQuery.append("MATCH ");

		JsonParser parser = new JsonParser();
		JsonObject config = parser.parse(patternMatchConfig).getAsJsonObject();

		JsonArray edges = config.get("edges").getAsJsonArray();
		for (JsonElement element : edges) {
			JsonObject configElement = element.getAsJsonObject();
			String auri = configElement.get("auri").getAsString();
			String buri = configElement.get("buri").getAsString();
			String edgeLabel = configElement.get("uri").getAsString();
			cypherQuery.append("(" + auri + ":" + auri + ")-[:" + edgeLabel + "]->(" + buri + ":" + buri + ")");
		}

		StringBuffer collectTypes = new StringBuffer();

		StringBuffer whereClause = new StringBuffer();
		JsonArray types = config.get("types").getAsJsonArray();
	
		boolean first = true;
		boolean foundPredicate = false;
		for (JsonElement element : types) {

			JsonObject configElement = element.getAsJsonObject();
			String type = configElement.get("uri").getAsString();
			collectTypes.append("(" + type + ":" + type + ")");
			if (configElement.has("propFilter")) {
				
				JsonArray propFilter = configElement.get("propFilter").getAsJsonArray();
				for (JsonElement proFilterElement : propFilter) {
					if (!first)
						whereClause.append(" AND ");
					JsonObject proFilterObject = proFilterElement.getAsJsonObject();
					String prop = proFilterObject.get("prop").getAsString();
					String comparison = proFilterObject.get("comparison").getAsString();
					String value = proFilterObject.get("value").getAsString();
					if (comparison.equals("equal")){
						comparison = "=";
						whereClause.append(type + "." + prop + comparison + "\"" + value + "\"");
					}else if(value.startsWith(">=") || value.startsWith("<=") || value.startsWith("<>")){
						whereClause.append(type + "." + prop + value.substring(0,2)+ value.substring(2) );
					}else if(value.startsWith(">") || value.startsWith("<") || value.startsWith("=")){
						whereClause.append(type + "." + prop + value.substring(0,1) + value.substring(1) );
					}
					
					foundPredicate=true;
					first = false;
				}
			}

		}

		if (edges.size() == 0) {
			cypherQuery.append(collectTypes);
		}
		if(foundPredicate){
			cypherQuery.append("WHERE ");
			cypherQuery.append(whereClause);
		}
		System.out.println(cypherQuery.toString());

		return runCyperQuery(graph, cypherQuery.toString());
	}

	public static LogicalGraph runCyperQuery(LogicalGraph graph, String query){
		
    	GraphCollection collection= graph.cypher(query, new GraphStatistics(10, 10, 10, 10));
    	//collection.
    	LogicalGraph result= graph.getConfig().getLogicalGraphFactory().fromDataSets(collection.getVertices(), collection.getEdges());
		return result;
    	
    }

}
