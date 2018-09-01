package de.scads.gradoop_service.server.helper.constructor;

import java.util.List;
import java.util.Map;
import java.util.Objects;

import org.gradoop.flink.model.api.epgm.LogicalGraph;
import org.gradoop.flink.util.GradoopFlinkConfig;
import org.gradoop.gretl.graph.operations.expand.ExpandGraph;
import org.uni_leipzig.biggr.builder.GradoopOperatorConstructor;
import org.uni_leipzig.biggr.builder.InvalidSettingsException;


public class ExpandGraphConstructor implements GradoopOperatorConstructor{
	
    public static final String TYPE_PROPERTY_KEY = "typePropertyKey";
	
    /**
     * {@inheritDoc}
     */
    @Override
    public Object construct(final GradoopFlinkConfig gfc, final Map<String, Object> arguments, final List<Object> dependencies) throws InvalidSettingsException {
    	LogicalGraph graph = (LogicalGraph)dependencies.get(0);

	    String typeProperty = (String)arguments.get(TYPE_PROPERTY_KEY);    	
    	
		return graph.callForGraph(new ExpandGraph(Objects.toString(typeProperty, "").isEmpty() ?
                ExpandGraph.DEFAULT_PROPERTY_KEY : typeProperty));
    }
}
