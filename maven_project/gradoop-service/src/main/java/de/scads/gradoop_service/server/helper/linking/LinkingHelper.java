package de.scads.gradoop_service.server.helper.linking;

import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.servlet.ServletContext;

import org.apache.flink.api.common.functions.MapFunction;
import org.apache.flink.api.java.operators.MapOperator;
import org.codehaus.jettison.json.JSONArray;
import org.codehaus.jettison.json.JSONException;
import org.gradoop.common.model.impl.id.GradoopId;
import org.gradoop.common.model.impl.pojo.Vertex;
import org.gradoop.famer.linking.blocking.blocking_methods.data_structures.BlockingComponent;
import org.gradoop.famer.linking.blocking.blocking_methods.data_structures.BlockingMethod;
import org.gradoop.famer.linking.blocking.blocking_methods.data_structures.CartesianProductComponent;
import org.gradoop.famer.linking.blocking.blocking_methods.data_structures.SortedNeighborhoodComponent;
import org.gradoop.famer.linking.blocking.blocking_methods.data_structures.StandardBlockingComponent;
import org.gradoop.famer.linking.blocking.key_generation.BlockingKeyGenerator;
import org.gradoop.famer.linking.blocking.key_generation.key_generation_methods.data_structures.KeyGenerationComponent;
import org.gradoop.famer.linking.blocking.key_generation.key_generation_methods.data_structures.KeyGenerationMethod;
import org.gradoop.famer.linking.blocking.key_generation.key_generation_methods.data_structures.PrefixLengthComponent;
import org.gradoop.famer.linking.blocking.key_generation.key_generation_methods.data_structures.QGramsComponent;
import org.gradoop.famer.linking.blocking.key_generation.key_generation_methods.data_structures.WordTokenizerComponent;
import org.gradoop.famer.linking.linking.Linker;
import org.gradoop.famer.linking.linking.data_structures.LinkerComponent;
import org.gradoop.famer.linking.selection.data_structures.SelectionComponent;
import org.gradoop.famer.linking.selection.data_structures.Condition.Condition;
import org.gradoop.famer.linking.selection.data_structures.Condition.ConditionOperator;
import org.gradoop.famer.linking.selection.data_structures.SelectionRule.RuleComponent;
import org.gradoop.famer.linking.selection.data_structures.SelectionRule.SelectionComponentType;
import org.gradoop.famer.linking.selection.data_structures.SelectionRule.SelectionOperator;
import org.gradoop.famer.linking.selection.data_structures.SelectionRule.SelectionRule;
import org.gradoop.famer.linking.selection.data_structures.SimilarityAggregatorRule.AggregationComponentType;
import org.gradoop.famer.linking.selection.data_structures.SimilarityAggregatorRule.AggregatorComponent;
import org.gradoop.famer.linking.selection.data_structures.SimilarityAggregatorRule.AlgebraicOperator;
import org.gradoop.famer.linking.selection.data_structures.SimilarityAggregatorRule.SimilarityAggregatorRule;
import org.gradoop.famer.linking.similarity_measuring.data_structures.SimilarityComponent;
import org.gradoop.famer.linking.similarity_measuring.data_structures.SimilarityComputationMethod;
import org.gradoop.flink.model.api.epgm.GraphCollection;
import org.gradoop.flink.model.api.epgm.LogicalGraph;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

import de.scads.gradoop_service.server.helper.GraphHelper;

public class LinkingHelper {

	private static JsonObject configElement;
	private static Integer parallelismDegree;
	private static String similarityFieldId;

	private static Boolean RECOMPUTE_SIMILARITY_FOR_CURRENT_EDGES = false;
	
	//private static HashMap<String, Double> weightedSimilarities = new HashMap<String, Double>();
	
	public static LogicalGraph runLinking(LogicalGraph graph, String matchConfig) throws Exception {
		
		
		GraphCollection inputCollection = graph.getConfig().getGraphCollectionFactory().fromGraph(graph);
		
		parallelismDegree = graph.getConfig().getExecutionEnvironment().getParallelism();

		configElement = new JsonParser().parse(matchConfig).getAsJsonObject().get("linkSpec").getAsJsonObject();
		
		
		// blocking components
		Collection<BlockingComponent> blockingComponents = new ArrayList<>();
		JsonArray blockingConfigs = configElement.getAsJsonArray("blockingComponents");
		
		for(int i = 0; i < blockingConfigs.size(); i++) {
			JsonObject blockingConfig = blockingConfigs.get(i).getAsJsonObject();
			blockingComponents.add(getBlockingComponent(blockingConfig));
		}
		
		
		// similarity components
		Collection<SimilarityComponent> similarityComponents = new ArrayList<>();
		JsonArray similarityConfigs = configElement.getAsJsonArray("similarityComponents");		
		int similarityConfigCount = similarityConfigs.size();
		String aggregationStrategy = configElement.getAsJsonObject("selectionComponent").get("aggregationStrategy").getAsString();
		
		for(int i = 0; i < similarityConfigCount; i++) {
			JsonObject similarityConfig = similarityConfigs.get(i).getAsJsonObject();
			similarityFieldId = similarityConfig.get("id").getAsString();
			
//			if(aggregationStrategy.equals("WEIGHTED_AVERAGE")) {
//				Double similarityWeight = similarityConfig.get("weight").getAsDouble();
//				weightedSimilarities.put(similarityFieldId, similarityWeight);
//			}
//			else if(aggregationStrategy.equals("ARITHMETIC_AVERAGE")) {
//				weightedSimilarities.put(similarityFieldId, 1.0/similarityConfigCount);
//			}
			similarityComponents.add(getSimilarityComponent(similarityConfig));
		}
		//normalizeWeightedSimilarities();
		
		
		// selection component
		SelectionComponent selectionComponent = getSelectionComponent();
		
		
		// linker component
		String edgeLabel = configElement.get("edgeLabel").getAsString();
		Boolean keepCurrentEdges = configElement.get("keepCurrentEdges").getAsBoolean();
		
		LinkerComponent linkerComponent = new LinkerComponent(
				blockingComponents,
				similarityComponents,
				selectionComponent,
				keepCurrentEdges,
				RECOMPUTE_SIMILARITY_FOR_CURRENT_EDGES,
				edgeLabel);

		
		// linking
		GraphCollection result_collection = inputCollection.callForCollection(new Linker(linkerComponent));
		LogicalGraph result = result_collection.getConfig().getLogicalGraphFactory()
				.fromDataSets(result_collection.getVertices(), result_collection.getEdges());

		System.out.println("\n**************************** Number of computed Match-Pairs: " + result.getEdges().count());

		return result;
	}
	
	@SuppressWarnings("serial")
	public static LogicalGraph prepareInputGraph(String inputs, ServletContext context) throws JSONException {
    	
		LogicalGraph preparedGraph = null;
		
		JSONArray inputGraphs = new JSONArray(inputs);
		
		for(int i = 0; i < inputGraphs.length(); i++) {
    		final int j = i;
    		if(i == 0) {
    			// use the name as of the saved graph
    			preparedGraph = GraphHelper.getGraph(inputGraphs.getJSONObject(j).getString("inputGraphIdentifier"), context);
    			
    			MapOperator<Vertex, Vertex> graphVertexTmp = preparedGraph.getVertices().map(new MapFunction<Vertex, Vertex>() {
    				@Override
    				public Vertex map(Vertex vertex) throws Exception {
    					// use the name of the graph, that was used in the UI and was passed to linkingConfig
    					vertex.setProperty("graphLabel", inputGraphs.getJSONObject(j).getString("connectorIdentifier"));
    					return vertex;	
    				}
    			});
    			
    			preparedGraph = preparedGraph.getConfig().getLogicalGraphFactory().fromDataSets(graphVertexTmp, preparedGraph.getEdges());
    		}
    		else{
    			LogicalGraph nextGraph = GraphHelper.getGraph(inputGraphs.getJSONObject(j).getString("inputGraphIdentifier"), context);
    			
    			MapOperator<Vertex, Vertex> graphVertexTmp = nextGraph.getVertices().map(new MapFunction<Vertex, Vertex>() {
    				@Override
    				public Vertex map(Vertex vertex) throws Exception {
    					vertex.setProperty("graphLabel", inputGraphs.getJSONObject(j).getString("connectorIdentifier"));
    					return vertex;	
    				}
    			});
    			
    			nextGraph = nextGraph.getConfig().getLogicalGraphFactory().fromDataSets(graphVertexTmp, nextGraph.getEdges());
    			
    			preparedGraph = preparedGraph.combine(nextGraph);
    		}
    	}
		
		return preparedGraph;
	}
	
	private static BlockingComponent getBlockingComponent(JsonObject blockingConfig) {

		String blockingMethodString = blockingConfig.get("blockingMethod").getAsString();
		Integer windowSize = blockingConfig.get("windowSize").getAsInt();
				
		BlockingKeyGenerator blockingKeyGenerator = null;
		BlockingMethod blockingMethodName = null;
		Boolean intraDataSetComparison = true;

		BlockingComponent blockingComponent = null;
		
		switch(blockingMethodString) {
		case "CARTESIAN_PRODUCT":
			blockingMethodName = BlockingMethod.CARTESIAN_PRODUCT; 
			blockingComponent = new CartesianProductComponent(true, blockingMethodName);
			break;
		case "STANDARD_BLOCKING":
			blockingMethodName = BlockingMethod.STANDARD_BLOCKING;
			blockingKeyGenerator = new BlockingKeyGenerator(getKeyGenerationComponent(blockingConfig));
	        blockingComponent = new StandardBlockingComponent(
	        		intraDataSetComparison, 
	        		blockingMethodName, 
	        		blockingKeyGenerator, 
	        		parallelismDegree);
			break;
		case "SORTED_NEIGHBORHOOD":	    
			intraDataSetComparison = true;
			blockingMethodName = BlockingMethod.SORTED_NEIGHBORHOOD;
			blockingKeyGenerator = new BlockingKeyGenerator(getKeyGenerationComponent(blockingConfig));			
			blockingComponent = new SortedNeighborhoodComponent(
	        		intraDataSetComparison,
	        		blockingMethodName,
	        		blockingKeyGenerator,
	        		windowSize);
			break;
		default: throw new AssertionError();
		}
		
		return blockingComponent;
	}
	
	private static KeyGenerationComponent getKeyGenerationComponent(JsonObject blockingConfig) {
		
		String keyGenerationMethodString = blockingConfig.getAsJsonObject("keyGenerationComponent").get("keyGenerationMethod").getAsString();
		String keyAttribute = blockingConfig.getAsJsonObject("keyGenerationComponent").get("attribute").getAsString();
		Integer prefixLength = blockingConfig.getAsJsonObject("keyGenerationComponent").get("prefixLength").getAsInt();		
		Integer qgramNo = blockingConfig.getAsJsonObject("keyGenerationComponent").get("qgramNo").getAsInt();
		Double qgramThreshold = blockingConfig.getAsJsonObject("keyGenerationComponent").get("qgramThreshold").getAsDouble();
		String tokenizer = blockingConfig.getAsJsonObject("keyGenerationComponent").get("tokenizer").getAsString();
		
		KeyGenerationMethod keyGenerationMethod = null;
		KeyGenerationComponent keyGenerationComponent = null;
		
		switch(keyGenerationMethodString) {
		case "FULL_ATTRIBUTE":
			keyGenerationMethod = KeyGenerationMethod.FULL_ATTRIBUTE;
			keyGenerationComponent = new KeyGenerationComponent(keyGenerationMethod, keyAttribute);
			break;
		case "PREFIX_LENGTH":
			keyGenerationMethod = KeyGenerationMethod.PREFIX_LENGTH;
			keyGenerationComponent = new PrefixLengthComponent(keyGenerationMethod, keyAttribute, prefixLength);
			break;
		case "QGRAMS":
			keyGenerationMethod = KeyGenerationMethod.QGRAMS;
			keyGenerationComponent = new QGramsComponent(keyGenerationMethod, keyAttribute, qgramNo, qgramThreshold);
			break;
		case "WORD_TOKENIZER":
			keyGenerationMethod = KeyGenerationMethod.WORD_TOKENIZER;
			keyGenerationComponent = new WordTokenizerComponent(keyGenerationMethod, keyAttribute, tokenizer);
			break;
		default:
			break;
		}
		
		return keyGenerationComponent;
	}
	
	private static SimilarityComponent getSimilarityComponent(JsonObject similarityConfig) {

		String sourceGraph = similarityConfig.get("sourceGraph").getAsString();
		String targetGraph = similarityConfig.get("targetGraph").getAsString();		
		String sourceLabel = similarityConfig.get("sourceLabel").getAsString();
		String targetLabel = similarityConfig.get("targetLabel").getAsString();
		String sourceAttribute = similarityConfig.get("sourceAttribute").getAsString();
		String targetAttribute = similarityConfig.get("targetAttribute").getAsString();
		Double weight = similarityConfig.get("weight").getAsDouble();
		String similarityMethodName = similarityConfig.get("similarityMethod").getAsString();
		Double threshold = similarityConfig.get("threshold").getAsDouble();
		Integer length = similarityConfig.get("length").getAsInt();
		Boolean padding = similarityConfig.get("padding").getAsBoolean();
		String tokenizer = similarityConfig.get("tokenizer").getAsString();
		Double jaroWinklerThreshold = similarityConfig.get("jaroWinklerThreshold").getAsDouble();
		Integer minLength = similarityConfig.get("minLength").getAsInt();
		Double maxToleratedDis = similarityConfig.get("maxToleratedDis").getAsDouble();
		Double maxToleratedPercentage = similarityConfig.get("maxToleratedPercentage").getAsDouble();
		String aggregationStrategy = configElement.getAsJsonObject("selectionComponent").get("aggregationStrategy").getAsString();
		
		// internally the same code is used for calculation of both arithmetic and weighted average
		// arithmetic average is calculated as weighted average with equal weights
		if(aggregationStrategy.equals("ARITHMETIC_AVERAGE")) {
			weight = 1.0;
		}
		
		SimilarityComputationMethod similarityComputationMethod = null;

		org.gradoop.famer.linking.similarity_measuring.data_structures.SimilarityComponent similarityComponent = null;
		
		switch(similarityMethodName) {
		case "JAROWINKLER":
			similarityComputationMethod = SimilarityComputationMethod.JAROWINKLER;
			similarityComponent = new org.gradoop.famer.linking.similarity_measuring.data_structures.JaroWinklerComponent(
					similarityFieldId, similarityComputationMethod, sourceGraph, sourceLabel, sourceAttribute, targetGraph, targetLabel, targetAttribute, weight, threshold);
			break;
		case "TRUNCATE_BEGIN":
			similarityComputationMethod = SimilarityComputationMethod.TRUNCATE_BEGIN;
			similarityComponent = new org.gradoop.famer.linking.similarity_measuring.data_structures.TruncateComponent(
					similarityFieldId, similarityComputationMethod, sourceGraph, sourceLabel, sourceAttribute, targetGraph, targetLabel, targetAttribute, weight, length);
			break;
		case "TRUNCATE_END":
			similarityComputationMethod = SimilarityComputationMethod.TRUNCATE_END;
			similarityComponent = new org.gradoop.famer.linking.similarity_measuring.data_structures.TruncateComponent(
					similarityFieldId, similarityComputationMethod, sourceGraph, sourceLabel, sourceAttribute, targetGraph, targetLabel, targetAttribute, weight, length);
			break;
		case "EDIT_DISTANCE":
			similarityComputationMethod = SimilarityComputationMethod.EDIT_DISTANCE;
			similarityComponent = new org.gradoop.famer.linking.similarity_measuring.data_structures.SimilarityComponent(
					similarityFieldId, similarityComputationMethod, sourceGraph, sourceLabel, sourceAttribute, targetGraph, targetLabel, targetAttribute, weight);
			break;
		case "QGRAMS":
			similarityComputationMethod = SimilarityComputationMethod.QGRAMS;
			similarityComponent = new org.gradoop.famer.linking.similarity_measuring.data_structures.QGramsComponent(
					similarityFieldId, similarityComputationMethod, sourceGraph, sourceLabel, sourceAttribute, targetGraph, targetLabel, targetAttribute, weight, length, padding, getSecondMethod(similarityConfig));
			break;
		case "MONGE_ELKAN":
			similarityComputationMethod = SimilarityComputationMethod.MONGE_ELKAN;
			similarityComponent = new org.gradoop.famer.linking.similarity_measuring.data_structures.MongeElkanComponent(
					similarityFieldId, similarityComputationMethod, sourceGraph, sourceLabel, sourceAttribute, targetGraph, targetLabel, targetAttribute, weight, tokenizer, threshold);
			break;
		case "EXTENDED_JACCARD":
			similarityComputationMethod = SimilarityComputationMethod.EXTENDED_JACCARD;
			similarityComponent = new org.gradoop.famer.linking.similarity_measuring.data_structures.ExtendedJaccardComponent(
					similarityFieldId, similarityComputationMethod, sourceGraph, sourceLabel, sourceAttribute, targetGraph, targetLabel, targetAttribute, weight, tokenizer, threshold, jaroWinklerThreshold);
			break;
		case "LONGEST_COMMON_SUBSTRING":
			similarityComputationMethod = SimilarityComputationMethod.LONGEST_COMMON_SUBSTRING;
			similarityComponent = new org.gradoop.famer.linking.similarity_measuring.data_structures.LongestCommSubComponent(
					similarityFieldId, similarityComputationMethod, sourceGraph, sourceLabel, sourceAttribute, targetGraph, targetLabel, targetAttribute, weight, minLength, getSecondMethod(similarityConfig));
			break;
		case "NUMERICAL_SIMILARITY_MAXDISTANCE":
			similarityComputationMethod = SimilarityComputationMethod.NUMERICAL_SIMILARITY_MAXDISTANCE;
			similarityComponent = new org.gradoop.famer.linking.similarity_measuring.data_structures.NumeriacalSimilarityWithMaxDisComponent(
					similarityFieldId, similarityComputationMethod, sourceGraph, sourceLabel, sourceAttribute, targetGraph, targetLabel, targetAttribute, weight, maxToleratedDis);
			break;
		case "NUMERICAL_SIMILARITY_MAXPERCENTAGE":
			similarityComputationMethod = SimilarityComputationMethod.NUMERICAL_SIMILARITY_MAXPERCENTAGE;
			similarityComponent = new org.gradoop.famer.linking.similarity_measuring.data_structures.NumeriacalSimilarityWithMaxPercentgComponent(
					similarityFieldId, similarityComputationMethod, sourceGraph, sourceLabel, sourceAttribute, targetGraph, targetLabel, targetAttribute, weight, maxToleratedPercentage);
			break;
		default:
			break;
		}
		
		return similarityComponent;
	}
	
	private static SimilarityComputationMethod getSecondMethod(JsonObject similarityConfig) {
		String secondMethodName = similarityConfig.get("secondMethod").getAsString();
		
		SimilarityComputationMethod secondMethod = null;
		
		switch(secondMethodName) {
		case "OVERLAP":
			secondMethod = SimilarityComputationMethod.OVERLAP;
			break;
		case "JACARD":
			secondMethod = SimilarityComputationMethod.JACARD;
			break;
		case "DICE":
			secondMethod = SimilarityComputationMethod.DICE;
			break;
		default:
			break;
		}
		
		return secondMethod;
	}
	
	private static SelectionComponent getSelectionComponent() {

		Boolean aggregationRuleEnabled = configElement.get("aggregationRuleEnabled").getAsBoolean();
		Boolean selectionRuleEnabled = configElement.get("selectionRuleEnabled").getAsBoolean();		
		
		SelectionComponent selectionComponent = new SelectionComponent(getSelectionConditions(),
																	   getSelectionRule(),
																	   getSimilarityAggregatorRule(),
																	   aggregationRuleEnabled,
																	   selectionRuleEnabled);
		
		return selectionComponent;
	}
	
	private static Collection<Condition> getSelectionConditions() {
		
		Collection<Condition> selectionConditions = new ArrayList<>();
		
		JsonArray inputRuleComponents = configElement.getAsJsonObject("selectionComponent").getAsJsonArray("ruleComponents");
		
		for(int i = 0; i < inputRuleComponents.size(); i++) {
			JsonObject inputRuleComponent = inputRuleComponents.get(i).getAsJsonObject();
			
			if(inputRuleComponent.get("componentType").getAsString().equals("CONDITION")) {
				String conditionId = inputRuleComponent.get("conditionId").getAsString();
				String relatedSimilarityFieldId = inputRuleComponent.get("similarityFieldId").getAsString();
				String conditionOperatorString = inputRuleComponent.get("operator").getAsString();
				Double conditionThreshold = inputRuleComponent.get("threshold").getAsDouble();
								
				ConditionOperator conditionOperator = null;
				
				switch(conditionOperatorString) {
				case "EQUAL":
					conditionOperator = ConditionOperator.EQUAL;
					break;
				case "GREATER":
					conditionOperator = ConditionOperator.GREATER;
					break;
				case "SMALLER":
					conditionOperator = ConditionOperator.SMALLER;
					break;
				case "GREATER_EQUAL":
					conditionOperator = ConditionOperator.GREATER_EQUAL;
					break;
				case "SMALLER_EQUAL":
					conditionOperator = ConditionOperator.SMALLER_EQUAL;
					break;
				case "NOT_EQUAL":
					conditionOperator = ConditionOperator.NOT_EQUAL;
					break;
				default:
					break;
				}
				
				selectionConditions.add(new Condition(conditionId, relatedSimilarityFieldId, conditionOperator, conditionThreshold));
			}
		}
		
		return selectionConditions;
	}
	
	private static SelectionRule getSelectionRule() {
		List<RuleComponent> ruleComponents = new ArrayList<>();

		JsonArray inputRuleComponents = configElement.getAsJsonObject("selectionComponent").getAsJsonArray("ruleComponents");		
		
		for(int i = 0; i < inputRuleComponents.size(); i++) {
			JsonObject inputRuleComponent = inputRuleComponents.get(i).getAsJsonObject();
			
			String componentType = inputRuleComponent.get("componentType").getAsString(); 
			
			SelectionComponentType ruleComponentType = null;
			String ruleComponentValue = null;
			
			switch(componentType) {
			case "OPEN_PARENTHESIS":
				ruleComponentType = SelectionComponentType.OPEN_PARENTHESIS;
				ruleComponentValue = "(";
				break;
			case "CLOSE_PARENTHESIS":
				ruleComponentType = SelectionComponentType.CLOSE_PARENTHESIS;
				ruleComponentValue = ")";
				break;
			case "SELECTION_OPERATOR_AND":
				ruleComponentType = SelectionComponentType.SELECTION_OPERATOR;
				ruleComponentValue = SelectionOperator.AND.toString();
				break;
			case "SELECTION_OPERATOR_OR":
				ruleComponentType = SelectionComponentType.SELECTION_OPERATOR;
				ruleComponentValue = SelectionOperator.OR.toString();
				break;
			case "CONDITION":
				ruleComponentType = SelectionComponentType.CONDITION_ID;
				ruleComponentValue = inputRuleComponent.get("conditionId").getAsString();
				break;
			case "COMPUTED_EXPRESSION_TRUE":
				ruleComponentType = SelectionComponentType.COMPUTED_EXPRESSION;
				ruleComponentValue = "true";
				break;
			default:
				break;
			}
			
			ruleComponents.add(new RuleComponent(ruleComponentType, ruleComponentValue));
		}			
		
		SelectionRule selectionRule = new SelectionRule(ruleComponents);
		
		return selectionRule;
	}
	
	private static SimilarityAggregatorRule getSimilarityAggregatorRule(){

		// currently only aggregation threshold is used internally
		List<AggregatorComponent> aggregatorComponents = new ArrayList<>();
		Double aggregationThreshold = configElement.getAsJsonObject("selectionComponent").get("aggregationThreshold").getAsDouble();
		SimilarityAggregatorRule similarityAggregatorRule = new SimilarityAggregatorRule(aggregatorComponents, aggregationThreshold);
		
		return similarityAggregatorRule;
		
//		List<AggregatorComponent> aggregatorComponents = new ArrayList<>();
//
//		Double aggregationThreshold = configElement.getAsJsonObject("selectionComponent").get("aggregationThreshold").getAsDouble();
//		
//		int totalItems = weightedSimilarities.size();
//		int itemIndex = 0;
//		
//		if(totalItems > 1) {
//			aggregatorComponents.add(new AggregatorComponent(AggregationComponentType.OPEN_PARENTHESIS, "("));
//		}	
//		
//		for (Map.Entry<String, Double> similarity : weightedSimilarities.entrySet()) {
//		    String similarityFieldId = similarity.getKey();
//		    Double similarityWeight = similarity.getValue();
//			aggregatorComponents.add(new AggregatorComponent(AggregationComponentType.OPEN_PARENTHESIS, "("));
//			aggregatorComponents.add(new AggregatorComponent(AggregationComponentType.SIMILARITY_FIELD_ID, similarityFieldId));	
//		    aggregatorComponents.add(new AggregatorComponent(AggregationComponentType.ALGEBRAIC_OPERATOR, AlgebraicOperator.MULTIPLY.toString()));
//		    aggregatorComponents.add(new AggregatorComponent(AggregationComponentType.COMPUTED_EXPRESSION, String.valueOf(similarityWeight)));
//			aggregatorComponents.add(new AggregatorComponent(AggregationComponentType.CLOSE_PARENTHESIS, ")"));
//			if(itemIndex < (totalItems - 1)) {
//		    	aggregatorComponents.add(new AggregatorComponent(AggregationComponentType.ALGEBRAIC_OPERATOR, AlgebraicOperator.PLUS.toString()));
//		    }
//		    itemIndex++;
//		}
//		
//		if(totalItems > 1) {
//			aggregatorComponents.add(new AggregatorComponent(AggregationComponentType.CLOSE_PARENTHESIS, ")"));
//		}
//		
//		SimilarityAggregatorRule similarityAggregatorRule = new SimilarityAggregatorRule(aggregatorComponents, aggregationThreshold);
//		
//		return similarityAggregatorRule;
	}
	
//	private static void normalizeWeightedSimilarities() {
//		double total = 0.0;
//		for (Double similarityValue: weightedSimilarities.values()) {
//		    total += similarityValue;
//		}
//		for (Map.Entry<String, Double> similarity : weightedSimilarities.entrySet()) {		    
//		    weightedSimilarities.put(similarity.getKey(), similarity.getValue() / total);
//		}
//	}
	
	// CARTESIAN_PRODUCT
	/*BlockingMethod blockingMethodName = BlockingMethod.CARTESIAN_PRODUCT; 
	BlockingKeyGenerator blockingKeyGenerator = null;
	CartesianProductComponent blockingComponent = new CartesianProductComponent(true, blockingMethodName);
	Collection<BlockingComponent> blockingComponents = new ArrayList<>();
	blockingComponents.add(blockingComponent);*/

	// STANDARD_BLOCKING
	/*		
    KeyGenerationMethod keyGenerationMethod = KeyGenerationMethod.PREFIX_LENGTH;
    String keyAttribute = "city";
    Integer prefixLength = 1;

    PrefixLengthComponent keyGenerationComponent = new PrefixLengthComponent(
    		keyGenerationMethod, 
    		keyAttribute,
    		prefixLength);
    BlockingKeyGenerator blockingKeyGenerator = new BlockingKeyGenerator(keyGenerationComponent);

	Boolean intraDataSetComparison = true;
	BlockingMethod blockingMethodName = BlockingMethod.STANDARD_BLOCKING;
    StandardBlockingComponent blockingComponent = new StandardBlockingComponent(
    		intraDataSetComparison, 
    		blockingMethodName, 
    		blockingKeyGenerator, 
    		parallelismDegree);
    Collection<BlockingComponent> blockingComponents = new ArrayList<>();
    blockingComponents.add(blockingComponent);
	*/
    
	// SORTED_NEIGHBORHOOD
	
	/*KeyGenerationMethod keyGenerationMethod = KeyGenerationMethod.PREFIX_LENGTH;
    String keyAttribute = "city";
    Integer prefixLength = 1;

    PrefixLengthComponent keyGenerationComponent = new PrefixLengthComponent(
    		keyGenerationMethod, 
    		keyAttribute,
    		prefixLength);
    BlockingKeyGenerator blockingKeyGenerator = new BlockingKeyGenerator(keyGenerationComponent);

	Boolean intraDataSetComparison = true;
	Integer windowSize = 10;
	BlockingMethod blockingMethodName = BlockingMethod.SORTED_NEIGHBORHOOD;
	SortedNeighborhoodComponent blockingComponent = new SortedNeighborhoodComponent(
    		intraDataSetComparison,
    		blockingMethodName,
    		blockingKeyGenerator,
    		windowSize);
    Collection<BlockingComponent> blockingComponents = new ArrayList<>();
    blockingComponents.add(blockingComponent);
	*/
	
	/*
    PrefixLengthComponent keyGenerationComponent1 = new PrefixLengthComponent(KeyGenerationMethod.PREFIX_LENGTH, "city", 1);
    PrefixLengthComponent keyGenerationComponent2 = new PrefixLengthComponent(KeyGenerationMethod.PREFIX_LENGTH, "gender", 1);
    
    BlockingKeyGenerator blockingKeyGenerator1 = new BlockingKeyGenerator(keyGenerationComponent1);
    BlockingKeyGenerator blockingKeyGenerator2 = new BlockingKeyGenerator(keyGenerationComponent2);
    
    StandardBlockingComponent blockingComponent1 = new StandardBlockingComponent(true, BlockingMethod.STANDARD_BLOCKING, blockingKeyGenerator1, parallelismDegree);
    StandardBlockingComponent blockingComponent2 = new StandardBlockingComponent(true, BlockingMethod.STANDARD_BLOCKING, blockingKeyGenerator2, parallelismDegree);
    blockingComponents.add(blockingComponent1);
    blockingComponents.add(blockingComponent2);
    */
	
	/*		
	aggregatorComponents.add(new AggregatorComponent(AggregationComponentType.COMPUTED_EXPRESSION, "4"));
	aggregatorComponents.add(new AggregatorComponent(AggregationComponentType.ALGEBRAIC_OPERATOR, AlgebraicOperator.DIVISION.toString()));		
	aggregatorComponents.add(new AggregatorComponent(AggregationComponentType.OPEN_PARENTHESIS, "("));		
	aggregatorComponents.add(new AggregatorComponent(AggregationComponentType.COMPUTED_EXPRESSION, "5"));
	aggregatorComponents.add(new AggregatorComponent(AggregationComponentType.ALGEBRAIC_OPERATOR, AlgebraicOperator.PLUS.toString()));
	aggregatorComponents.add(new AggregatorComponent(AggregationComponentType.COMPUTED_EXPRESSION, "5"));
	aggregatorComponents.add(new AggregatorComponent(AggregationComponentType.ALGEBRAIC_OPERATOR, AlgebraicOperator.PLUS.toString()));
	aggregatorComponents.add(new AggregatorComponent(AggregationComponentType.COMPUTED_EXPRESSION, "2"));		
	aggregatorComponents.add(new AggregatorComponent(AggregationComponentType.ALGEBRAIC_OPERATOR, AlgebraicOperator.MULTIPLY.toString()));
	aggregatorComponents.add(new AggregatorComponent(AggregationComponentType.COMPUTED_EXPRESSION, "5"));			
	aggregatorComponents.add(new AggregatorComponent(AggregationComponentType.CLOSE_PARENTHESIS, ")"));	
	*/
	
	/*String aggregationStrategy = configElement.getAsJsonObject("selectionComponent").get("aggregationStrategy").getAsString();
	
	Collection<SimilarityComponent> similarityComponents = new ArrayList<>();
	similarityComponents.add(new org.gradoop.famer.linking.similarity_measuring.data_structures.SimilarityComponent(
			"sim1",
			SimilarityComputationMethod.EDIT_DISTANCE,
			"GRAPH1",
			"Person",
			"name",
			"GRAPH2",
			"AnotherPerson",
			"name",
			1.0)
	);
	weightedSimilarities.put("sim1", 0.5);

	similarityComponents.add(new org.gradoop.famer.linking.similarity_measuring.data_structures.SimilarityComponent(
			"sim2",
			SimilarityComputationMethod.EDIT_DISTANCE,
			"GRAPH2",
			"AnotherPerson",
			"name",
			"GRAPH3",
			"SomePerson",
			"name",
			1.0)
	);
	weightedSimilarities.put("sim2", 0.5);*/
}
