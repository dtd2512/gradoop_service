package de.scads.gradoop_service.server.helper.constructor;

import java.util.List;
import java.util.Map;

import org.gradoop.flink.model.api.epgm.LogicalGraph;
import org.gradoop.flink.util.GradoopFlinkConfig;
import org.gradoop.gretl.graph.operations.SchemaGraph;
import org.uni_leipzig.biggr.builder.GradoopOperatorConstructor;
import org.uni_leipzig.biggr.builder.InvalidSettingsException;


public class SchemaGraphConstructor implements GradoopOperatorConstructor{
    /**
     * {@inheritDoc}
     */
    @Override
    public Object construct(final GradoopFlinkConfig gfc, final Map<String, Object> arguments, final List<Object> dependencies) throws InvalidSettingsException {
    	LogicalGraph graph = (LogicalGraph)dependencies.get(0);

		return SchemaGraph.extract(graph);
    }
}
