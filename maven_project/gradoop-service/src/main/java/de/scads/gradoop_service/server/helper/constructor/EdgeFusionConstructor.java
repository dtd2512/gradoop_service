package de.scads.gradoop_service.server.helper.constructor;

import java.util.List;
import java.util.Map;

import org.gradoop.flink.model.api.epgm.LogicalGraph;
import org.gradoop.flink.util.GradoopFlinkConfig;
import org.uni_leipzig.biggr.builder.GradoopOperatorConstructor;
import org.uni_leipzig.biggr.builder.InvalidSettingsException;

import de.scads.gradoop_service.server.helper.edge_fusion.EdgeFusionHelper;




public class EdgeFusionConstructor implements GradoopOperatorConstructor{

    public static final String EDGE_FUSION_CONFIG = "edgeFusionConfig";
	/**
     * {@inheritDoc}
     */
    @Override
    public Object construct(final GradoopFlinkConfig gfc, final Map<String, Object> arguments, final List<Object> dependencies) throws InvalidSettingsException {
    	LogicalGraph graph = (LogicalGraph)dependencies.get(0);
	    String edgeFusionConfig = (String)arguments.get(EDGE_FUSION_CONFIG);
    	
	    LogicalGraph result = null;
    	
		try {
			result = EdgeFusionHelper.performEdgeFusion(graph, edgeFusionConfig);
		} catch (Exception e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
		
		return result;
    }
}
