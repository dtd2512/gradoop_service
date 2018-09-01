package de.scads.gradoop_service.server.helper.constructor;

import java.util.List;
import java.util.Map;

import org.gradoop.flink.model.api.epgm.LogicalGraph;
import org.gradoop.flink.util.GradoopFlinkConfig;
import org.uni_leipzig.biggr.builder.GradoopOperatorConstructor;
import org.uni_leipzig.biggr.builder.InvalidSettingsException;

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

import de.scads.gradoop_service.server.RequestHandler;
import de.scads.gradoop_service.server.helper.grouping.GroupingHelper;


public class GroupingConstructor implements GradoopOperatorConstructor{

    public static final String GROUPING_CONFIG = "groupingConfig";
	/**
     * {@inheritDoc}
     */
    @Override
    public Object construct(final GradoopFlinkConfig gfc, final Map<String, Object> arguments, final List<Object> dependencies) throws InvalidSettingsException {
    	LogicalGraph graph = (LogicalGraph)dependencies.get(0);
    	String groupingConfig = (String)arguments.get(GROUPING_CONFIG);
    	String groupingStrat = "GROUP_COMBINE";
    	
        JsonParser parser = new JsonParser();
		JsonArray array = parser.parse(groupingConfig).getAsJsonObject().get(GroupingHelper.ARRAY_IDENTIFIER).getAsJsonArray();
		for (JsonElement element : array) {
			JsonObject configElement = element.getAsJsonObject();
			String label = configElement.get(GroupingHelper.GROUPING_LABEL).getAsString();
			if (configElement.has(GroupingHelper.GROUPING_NEIGHBORS)) {
				String neighbor = configElement.get(GroupingHelper.GROUPING_NEIGHBORS).getAsString();
				graph= new RequestHandler().annotateWithNeighbor(graph, label, neighbor);
			}	
		}

        return GroupingHelper.buildGroupingWorkflow(groupingStrat, groupingConfig).execute(graph);
    }
}