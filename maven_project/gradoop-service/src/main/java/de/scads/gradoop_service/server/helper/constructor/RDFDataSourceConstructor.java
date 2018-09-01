
package de.scads.gradoop_service.server.helper.constructor;

import java.util.List;
import java.util.Map;

import org.gradoop.flink.io.impl.json.JSONDataSource;
import org.gradoop.flink.util.GradoopFlinkConfig;
import org.uni_leipzig.biggr.builder.GraphObjectType;
import org.uni_leipzig.biggr.builder.InvalidSettingsException;
import org.uni_leipzig.biggr.builder.constructors.AbstractFileDataSourceConstructor;

import de.scads.gradoop_service.server.RequestHandler;
import de.scads.gradoop_service.server.helper.GraphHelper;
import de.scads.gradoop_service.server.helper.RDFGraphHelper;


public class RDFDataSourceConstructor extends AbstractFileDataSourceConstructor {


    public static final String RDF_GRAPH_CONFIG = "rdfGraphConfig";
    //public static final String IDENTIFIER = "identifier";


    @Override
    public Object construct(final GradoopFlinkConfig gfc, final Map<String, Object> arguments, final List<Object> dependencies) throws InvalidSettingsException{
	    String rdfGraphConfig = (String)arguments.get(RDF_GRAPH_CONFIG);
	    //String identifier = (String)arguments.get(IDENTIFIER);
	    
	    Object result = null;
	    
		try {
			result = RDFGraphHelper.getRDFGraph(rdfGraphConfig, gfc);
		} catch (Exception e) {
			e.printStackTrace();
		}
		
		return result;
	}


    @Override
	public Object coerce(final Object graph, final GraphObjectType got) {
    	return graph;
	}

}
