package de.scads.gradoop_service.server.helper.constructor;

import java.util.List;
import java.util.Map;

import org.gradoop.flink.model.api.epgm.LogicalGraph;
import org.gradoop.flink.util.GradoopFlinkConfig;
import org.uni_leipzig.biggr.builder.GradoopOperatorConstructor;
import org.uni_leipzig.biggr.builder.InvalidSettingsException;

import de.scads.gradoop_service.server.helper.gelly.GellyHelper;


public class WeaklyConnectedComponentsConstructor implements GradoopOperatorConstructor {

    /**
     * {@inheritDoc}
     */
    @Override
    public Object construct(final GradoopFlinkConfig gfc, final Map<String, Object> arguments, final List<Object> dependencies) throws InvalidSettingsException {
		LogicalGraph graph = (LogicalGraph)dependencies.get(0);
		LogicalGraph resultGraph = null;
		try {
			resultGraph = GellyHelper.calculateConnectedComponents(graph);
		} catch (Exception e) {
			e.printStackTrace();
		}
		return resultGraph;
    }
}

