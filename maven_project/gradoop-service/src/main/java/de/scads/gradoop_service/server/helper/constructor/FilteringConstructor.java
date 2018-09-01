package de.scads.gradoop_service.server.helper.constructor;

import java.util.List;
import java.util.Map;

import org.gradoop.flink.model.api.epgm.LogicalGraph;
import org.gradoop.flink.util.GradoopFlinkConfig;
import org.uni_leipzig.biggr.builder.GradoopOperatorConstructor;
import org.uni_leipzig.biggr.builder.InvalidSettingsException;

import de.scads.gradoop_service.server.helper.filtering.FilteringHelper;


public class FilteringConstructor implements GradoopOperatorConstructor{

    public static final String FILTERING_CONFIG = "filteringConfig";
	/**
     * {@inheritDoc}
     */
    @Override
    public Object construct(final GradoopFlinkConfig gfc, final Map<String, Object> arguments, final List<Object> dependencies) throws InvalidSettingsException {
    	LogicalGraph graph = (LogicalGraph)dependencies.get(0);
	    String filteringConfig = (String)arguments.get(FILTERING_CONFIG);
    	
		return FilteringHelper.createSubGraph(graph, filteringConfig);
    }
}
