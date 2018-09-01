package de.scads.gradoop_service.server.helper.constructor;

import java.util.List;
import java.util.Map;
import java.util.Objects;

import javax.ws.rs.core.Response;

import org.gradoop.flink.model.api.epgm.GraphCollection;
import org.gradoop.flink.model.api.epgm.LogicalGraph;
import org.gradoop.flink.model.impl.functions.epgm.Id;
import org.gradoop.flink.model.impl.operators.matching.common.MatchStrategy;
import org.gradoop.flink.model.impl.operators.matching.common.statistics.GraphStatistics;
import org.gradoop.flink.util.GradoopFlinkConfig;
import org.uni_leipzig.biggr.builder.GradoopOperatorConstructor;
import org.uni_leipzig.biggr.builder.InvalidSettingsException;


public class CypherConstructor implements GradoopOperatorConstructor{

    public static final String FORMDATA = "formdata";
	/**
     * {@inheritDoc}
     */
    @Override
    public Object construct(final GradoopFlinkConfig gfc, final Map<String, Object> arguments, final List<Object> dependencies) throws InvalidSettingsException {

    	LogicalGraph graph = (LogicalGraph)dependencies.get(0);
  
    	String formdata = (String)arguments.get(FORMDATA);
    
	    String cypherQuery = "";
	    String setAttachAttr = "";
	    String constructionPattern = "";
	    
		// formdata has the following structure
		// option 1: cypher-query=[value1]&cypher-attach-attr=on&cypher-constr-pattern=[value2]
		// option 2: cypher-query=[value1]&cypher-constr-pattern=[value2]
	    String[] formdataArray = formdata.split("&");
	    if(formdataArray.length == 2) {
	    	String[] cypherQueryArray = formdataArray[0].split("=");
	    	// check if argument value is not empty
	    	if(cypherQueryArray.length == 2) {
		    	cypherQuery = cypherQueryArray[1];
	    	}

	    	setAttachAttr = "off";
	    	
	    	String[] constructionPatternArray = formdataArray[1].split("=");
	    	// check if argument value is not empty
	    	if(constructionPatternArray.length == 2) {
	    		constructionPattern = constructionPatternArray[1];
	    	}
	    }
	    else {
	    	String[] cypherQueryArray = formdataArray[0].split("=");
	    	// check if argument value is not empty
	    	if(cypherQueryArray.length == 2) {
		    	cypherQuery = cypherQueryArray[1];
	    	}
	    	
	    	setAttachAttr = formdataArray[1].split("=")[1];
	    	
	    	String[] constructionPatternArray = formdataArray[2].split("=");
	    	// check if argument value is not empty
	    	if(constructionPatternArray.length == 2) {
	    		constructionPattern = constructionPatternArray[1];
	    	}
	    }
	    
        // Apparently checkboxes are encoded with "on" and "off"
        final boolean attachAttr = setAttachAttr.equals("on");

        // TODO: Get and store actual GraphStatistics by graphIdentifier
        GraphStatistics stats = new GraphStatistics(1,1,1,1);
        if (cypherQuery == null || cypherQuery.isEmpty()) {
            return Response.status(Response.Status.BAD_REQUEST).build();
        }
        // Making sure to use an empty construction pattern by default.
        if (Objects.toString(constructionPattern, "").isEmpty()) {
            constructionPattern = null;
        }
        GraphCollection cypher = graph.cypher(cypherQuery, constructionPattern, attachAttr,
                MatchStrategy.HOMOMORPHISM, MatchStrategy.ISOMORPHISM, stats);
        LogicalGraph result = graph.getConfig().getLogicalGraphFactory()
                .fromDataSets(cypher.getVertices().distinct(new Id<>()), cypher.getEdges().distinct(new Id<>()));
	    
        return result;
    }
}
