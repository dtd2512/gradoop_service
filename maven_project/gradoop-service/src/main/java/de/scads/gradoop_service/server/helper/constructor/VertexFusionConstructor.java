package de.scads.gradoop_service.server.helper.constructor;

import java.util.List;
import java.util.Map;

import org.gradoop.flink.model.api.epgm.LogicalGraph;
import org.gradoop.flink.util.GradoopFlinkConfig;
import org.uni_leipzig.biggr.builder.GradoopOperatorConstructor;
import org.uni_leipzig.biggr.builder.InvalidSettingsException;

import de.scads.gradoop_service.server.helper.vertex_fusion.CountValues;
import de.scads.gradoop_service.server.helper.vertex_fusion.VertexFusionOperator;


public class VertexFusionConstructor implements GradoopOperatorConstructor{

    public static final String VERTEX_FUSION_CONFIG = "vertexFusionConfig";
	/**
     * {@inheritDoc}
     */
    @Override
    public Object construct(final GradoopFlinkConfig gfc, final Map<String, Object> arguments, final List<Object> dependencies) throws InvalidSettingsException {
    	LogicalGraph graph = (LogicalGraph)dependencies.get(0);
	    String vertexFusionConfig = (String)arguments.get(VERTEX_FUSION_CONFIG);

		return graph.callForGraph(new VertexFusionOperator(vertexFusionConfig, new CountValues()));
    }
}