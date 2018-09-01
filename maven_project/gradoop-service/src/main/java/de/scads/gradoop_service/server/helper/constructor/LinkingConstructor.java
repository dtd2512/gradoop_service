package de.scads.gradoop_service.server.helper.constructor;

import java.util.List;
import java.util.Map;

import org.apache.flink.api.common.functions.MapFunction;
import org.apache.flink.api.java.operators.MapOperator;
import org.codehaus.jettison.json.JSONArray;
import org.codehaus.jettison.json.JSONObject;
import org.gradoop.common.model.impl.id.GradoopId;
import org.gradoop.common.model.impl.pojo.Vertex;
import org.gradoop.flink.model.api.epgm.LogicalGraph;
import org.gradoop.flink.util.GradoopFlinkConfig;
import org.uni_leipzig.biggr.builder.GradoopOperatorConstructor;
import org.uni_leipzig.biggr.builder.InvalidSettingsException;

import de.scads.gradoop_service.server.helper.linking.LinkingHelper;

public class LinkingConstructor implements GradoopOperatorConstructor{

    public static final String LINKING_CONFIG = "linkingConfig";
	/**
     * {@inheritDoc}
     */
    @SuppressWarnings("serial")
	@Override
    public Object construct(final GradoopFlinkConfig gfc, final Map<String, Object> arguments, final List<Object> dependencies) throws InvalidSettingsException {
    	    	
    	String input = (String)arguments.get(LINKING_CONFIG);

    	JSONObject configObject;
		try {
			configObject = new JSONObject(input);
			
	    	String linkingConfig = configObject.getString("linkingConfig");
	    	System.out.println(linkingConfig);
	    	// contains ordered list of names used to refer to graphs or subworkflows in the UI 
	    	JSONArray inputsArray = configObject.getJSONArray("inputsArray");
	    	
			GradoopId gradoopId = new GradoopId();   	
			LogicalGraph inputGraph = null;
			
			
	    	for(int i = 0; i < inputsArray.length(); i++) {
		    	System.out.println(inputsArray.getString(i));
	    		final int j = i;
	    		if(i == 0) {
	    			inputGraph = (LogicalGraph)dependencies.get(i);
	    			
	    			MapOperator<Vertex, Vertex> graphVertexTmp = inputGraph.getVertices().map(new MapFunction<Vertex, Vertex>() {
	    				@Override
	    				public Vertex map(Vertex arg0) throws Exception {
	    					// use the name of the graph, that was used in the UI and was passed to linkingConfig
	    					arg0.setProperty("graphLabel", inputsArray.getString(j));
	    					arg0.resetGraphIds();
	    					arg0.addGraphId(gradoopId);
	    					return arg0;	
	    				}
	    			});
	    			
	    			inputGraph = inputGraph.getConfig().getLogicalGraphFactory().fromDataSets(graphVertexTmp, inputGraph.getEdges());
	    		}
	    		else{
	    			LogicalGraph nextGraph = (LogicalGraph)dependencies.get(i);
	    			
	    			MapOperator<Vertex, Vertex> graphVertexTmp = nextGraph.getVertices().map(new MapFunction<Vertex, Vertex>() {
	    				@Override
	    				public Vertex map(Vertex arg0) throws Exception {
	    					arg0.setProperty("graphLabel", inputsArray.getString(j));
	    					arg0.resetGraphIds();
	    					arg0.addGraphId(gradoopId);
	    					return arg0;	
	    				}
	    			});
	    			
	    			nextGraph = nextGraph.getConfig().getLogicalGraphFactory().fromDataSets(graphVertexTmp, nextGraph.getEdges());
	    			
	    			inputGraph = inputGraph.combine(nextGraph);
	    		}
	    	}
	    	
	    	return LinkingHelper.runLinking(inputGraph, linkingConfig);
		} catch (Exception e) {
			e.printStackTrace();
		}
    	
		// should not happen during normal program execution
		throw new RuntimeException();
    }
}