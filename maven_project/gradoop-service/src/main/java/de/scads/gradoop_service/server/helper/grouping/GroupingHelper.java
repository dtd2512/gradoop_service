package de.scads.gradoop_service.server.helper.grouping;

import com.google.common.collect.Lists;
import com.google.gson.*;
import org.gradoop.flink.model.impl.operators.grouping.Grouping;
import org.gradoop.flink.model.impl.operators.grouping.GroupingStrategy;
import org.gradoop.flink.model.impl.operators.grouping.functions.aggregation.CountAggregator;
import org.gradoop.flink.model.impl.operators.grouping.functions.aggregation.PropertyValueAggregator;
import org.gradoop.flink.model.impl.operators.grouping.functions.aggregation.SumAggregator;

import java.util.Arrays;
import java.util.List;

/**
 * Utility methods for easier handling of grouping requests
 */
public class GroupingHelper {
	public static final String ARRAY_IDENTIFIER = "conf";
	public static final String GROUPING_PRIMITIVE = "type";
	public static final String GROUPING_LABEL = "label";
	public static final String GROUPING_KEYS = "keys";
	public static final String GROUPING_NEIGHBORS = "byneighbor";

	/**
	 * Builds a grouping workflow on base of a json configuration.
	 *
	 * @param groupingStrat
	 *            the grouping strategy, denoted from {@link GroupingStrategy}
	 * @param groupingConfigJson
	 *            a json describing how to group the graph
	 * @return the configures {@link Grouping} object
	 */
	public static Grouping buildGroupingWorkflow(String groupingStrat, String groupingConfigJson) {
		// prepare grouping
		Grouping.GroupingBuilder builder = new Grouping.GroupingBuilder();
		builder.setStrategy(GroupingStrategy.valueOf(groupingStrat));
		builder.addVertexGroupingKey(Grouping.LABEL_SYMBOL);
		builder.addEdgeGroupingKey(Grouping.LABEL_SYMBOL);
		builder.addVertexAggregator(new CountAggregator());
		builder.addEdgeAggregator(new CountAggregator());

		// parse grouping configuration
		JsonParser parser = new JsonParser();
		JsonArray array = parser.parse(groupingConfigJson).getAsJsonObject().get(ARRAY_IDENTIFIER).getAsJsonArray();
		for (JsonElement element : array) {
			JsonObject configElement = element.getAsJsonObject();
			String type = configElement.get(GROUPING_PRIMITIVE).getAsString();
			String label = configElement.get(GROUPING_LABEL).getAsString();
			if (configElement.has(GROUPING_KEYS)) {
				String keys = configElement.get(GROUPING_KEYS).getAsString();
				

				List<String> keyList = Arrays.asList(keys.split(","));
				if (type.equals("vertex")) {
					List<PropertyValueAggregator> aggregatorList = Lists.newArrayList();
					aggregatorList.add(new CountAggregator());
					if(configElement.has("byneighbor")){
						if(keys.length()>0)keys+=",";
						keys+="_neighbor_";
					}
					keyList = Arrays.asList(keys.split(","));
					if(keys.length()>0){
						builder.addVertexLabelGroup(label, keyList, aggregatorList);
					}
				} else if (type.equals("edge")) {
					List<PropertyValueAggregator> aggregatorList = Lists.newArrayList();
					aggregatorList.add(new CountAggregator());
					builder.addEdgeLabelGroup(label, keyList, aggregatorList);
				} else {
					throw new JsonParseException("Malformed GroupingConfiguration! '" + type
							+ "' is not appropriate! Use 'vertex' or 'edge' instead.");
				}
			}
		}

		return builder.build();
	}
}
