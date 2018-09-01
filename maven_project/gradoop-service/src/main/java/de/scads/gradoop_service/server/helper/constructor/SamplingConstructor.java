package de.scads.gradoop_service.server.helper.constructor;

import java.util.List;
import java.util.Map;

import org.codehaus.jettison.json.JSONObject;
import org.gradoop.flink.model.api.epgm.LogicalGraph;
import org.gradoop.flink.util.GradoopFlinkConfig;
import org.uni_leipzig.biggr.builder.GradoopOperatorConstructor;
import org.uni_leipzig.biggr.builder.InvalidSettingsException;

import de.scads.gradoop_service.server.sampling.PageRankSampling;
import de.scads.gradoop_service.server.sampling.RandomEdgeSampling;

public class SamplingConstructor implements GradoopOperatorConstructor{
	
    public static final String SAMPLING_CONFIG = "samplingConfig";
	/**
     * {@inheritDoc}
     */
    @Override
    public Object construct(final GradoopFlinkConfig gfc, final Map<String, Object> arguments, final List<Object> dependencies) throws InvalidSettingsException {
    	LogicalGraph graph = (LogicalGraph)dependencies.get(0);
	    String samplingConfig = (String)arguments.get(SAMPLING_CONFIG);
    	
	    LogicalGraph resultGraph = null;
	    JSONObject samplingConfigObject;
	    String samplingMethod = "";
	    Double threshold = 0.0; 
  
		try {
			samplingConfigObject = new JSONObject(samplingConfig);
		    samplingMethod = samplingConfigObject.getString("samplingMethod");
		    threshold = samplingConfigObject.getDouble("samplingThreshold");
		    
	        switch (samplingMethod) {
	        case "No Sampling":
	        	resultGraph = graph;
	        	break;
            case "Node Sampling":
            	resultGraph = graph.sampleRandomNodes(threshold.floatValue());
                break;
            case "Edge Sampling":
            	resultGraph = new RandomEdgeSampling(threshold.floatValue(), 0L).execute(graph);
                break;
            case "PageRank Sampling":
            	resultGraph = new PageRankSampling(0.5, threshold.floatValue()).execute(graph);
                break;
            default:
                break;
	        }
			
		} catch (Exception e) {
			e.printStackTrace();
		}
		
		return resultGraph;
    }
}
