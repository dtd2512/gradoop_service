/*
 * This file is part of Gradoop.
 *
 * Gradoop is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Gradoop is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Gradoop.  If not, see <http://www.gnu.org/licenses/>.
 */

package de.scads.gradoop_service.server;

import java.io.IOException;
import java.io.InputStream;
import java.net.URISyntaxException;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.Random;

import javax.annotation.PostConstruct;
import javax.servlet.ServletContext;
import javax.ws.rs.Consumes;
import javax.ws.rs.DefaultValue;
import javax.ws.rs.FormParam;
import javax.ws.rs.GET;
import javax.ws.rs.MatrixParam;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

import org.apache.commons.lang3.StringUtils;
import org.apache.flink.api.common.functions.FilterFunction;
import org.apache.flink.api.common.functions.JoinFunction;
import org.apache.flink.api.common.functions.MapFunction;
import org.apache.flink.api.java.DataSet;
import org.apache.flink.api.java.ExecutionEnvironment;
import org.apache.flink.api.java.functions.KeySelector;
import org.apache.flink.api.java.operators.MapOperator;
import org.apache.flink.api.java.tuple.Tuple2;
import org.codehaus.jettison.json.JSONArray;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;
import org.glassfish.jersey.media.multipart.FormDataContentDisposition;
import org.glassfish.jersey.media.multipart.FormDataParam;
import org.gradoop.common.model.impl.id.GradoopId;
import org.gradoop.common.model.impl.pojo.Edge;
import org.gradoop.common.model.impl.pojo.Vertex;
import org.gradoop.flink.model.api.epgm.GraphCollection;
import org.gradoop.flink.model.api.epgm.LogicalGraph;
import org.gradoop.flink.model.impl.functions.epgm.Id;
import org.gradoop.flink.model.impl.operators.grouping.GroupingStrategy;
import org.gradoop.flink.model.impl.operators.matching.common.MatchStrategy;
import org.gradoop.flink.model.impl.operators.matching.common.statistics.GraphStatistics;
import org.gradoop.flink.util.GradoopFlinkConfig;
import org.gradoop.gretl.graph.operations.SchemaGraph;
import org.gradoop.gretl.graph.operations.expand.ExpandGraph;
import org.uni_leipzig.biggr.builder.GradoopFlowBuilder;
import org.uni_leipzig.biggr.builder.pojo.GradoopOperatorFlow;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

import de.scads.gradoop_service.server.helper.FileUploadHelper;
import de.scads.gradoop_service.server.helper.GraphHelper;
import de.scads.gradoop_service.server.helper.MetaDataHelper;
import de.scads.gradoop_service.server.helper.PatternMatchingHelper;
import de.scads.gradoop_service.server.helper.RDFGraphHelper;
import de.scads.gradoop_service.server.helper.ServiceHelper;
import de.scads.gradoop_service.server.helper.clustering.ClusteringHelper;
import de.scads.gradoop_service.server.helper.edge_fusion.EdgeFusionHelper;
import de.scads.gradoop_service.server.helper.filtering.FilteringHelper;
import de.scads.gradoop_service.server.helper.gelly.GellyHelper;
import de.scads.gradoop_service.server.helper.grouping.GroupingHelper;
import de.scads.gradoop_service.server.helper.linking.LinkingHelper;
import de.scads.gradoop_service.server.helper.vertex_fusion.CountValues;
import de.scads.gradoop_service.server.helper.vertex_fusion.VertexFusionOperator;
import de.scads.gradoop_service.server.sampling.PageRankSampling;
import de.scads.gradoop_service.server.sampling.RandomEdgeSampling;



/**
 * Handles REST requests to the server.
 */
@Path("")
public class RequestHandler {

	@Context
	private ServletContext context;

	@PostConstruct
	public void init() {
		if (context != null && "true".equals(context.getInitParameter("local.exec"))) {
		    ServiceHelper.setLocalExecution();
        }
	}
	
    /**
     * Creates a list of all available databases from the file structure under the /data/ folder.
     *
     * @return List of folders (databases) under the /data/ folder.
     */
    @GET
    @Path("/databases")
    @Produces("application/json;charset=utf-8")
    public Response getDatabases() throws IOException, URISyntaxException {
        JSONArray jsonArray = new JSONArray();
        String[] databases = GraphHelper.getExistingGraphs(context);
        Arrays.sort(databases);

        // return the found databases to the client
        for (String database : databases) {
            jsonArray.put(database);
        }
        return Response.ok(jsonArray.toString()).build();
    }

    /**
     * Creates a list of all available workflows from the file structure under the /workflow/ folder.
     *
     * @return List of workflows under the /workflow/ folder.
     */
    @GET
    @Path("/filenames/{type}")
    @Produces("application/json;charset=utf-8")
    public Response getFileNames(@PathParam("type") String type) throws IOException, URISyntaxException {
        JSONArray jsonArray = GraphHelper.getExistingFileNames(GraphHelper.getPath(type, context));

        return Response.ok(jsonArray.toString()).build();
    }

    
    /**
     * Creates a list of all available workflows from the file structure under the /workflow/ folder.
     *
     * @return List of workflows under the /workflow/ folder.
     */
    @GET
    @Path("/workflows")
    @Produces("application/json;charset=utf-8")
    public Response getWorkflows() throws IOException, URISyntaxException {
        JSONArray jsonArray = GraphHelper.getExistingWorkflows(context);
        
        return Response.ok(jsonArray.toString()).build();
    }
    
    /**
     * Creates a json string containing all valid operations that could be executed during filtering.
     *
     * @return json string
     */
    @GET
    @Path("/filterOperations")
    @Produces("application/json;charset=utf-8")
    public Response getFilterOperations() {
        return Response.ok(FilteringHelper.getFilterOperations()).build();
    }


    /**
     * Takes a graphIdentifier name via a POST request and returns the keys of all
     * vertex and edge properties, and a boolean value specifying if the property has a numerical
     * type. The return is a string in the JSON format, for easy usage in a JavaScript web page.
     *
     * @param graphIdentifier name of the loaded graph
     * @return A JSON containing the vertices and edges property keys
     */
    @GET
    @Path("/keys/{graph}")
    @Produces("application/json;charset=utf-8")
    public Response getKeysAndLabels(@PathParam("graph") String graphIdentifier) throws IOException {
        return Response.ok(MetaDataHelper.getGraphMetaData(graphIdentifier, context).toString()).build();
    }
    
    
	/**
     * Takes a list of graphIdentifier names via a POST request and returns combined metaData for the given graphIdentifierList. 
     * The return is a string in the JSON format.
     *
     * @param graphIdentifierList JSON array containing graphIdentifiers
     * @return A JSON containing combined metaData for the given graphIdentifiers
     */   
    @POST
    @Path("/combinedKeys")
    @Consumes("application/json;charset=utf-8")
    public Response getCombinedKeysAndLabels(String graphIdentifierList) throws IOException, JSONException, InterruptedException {
        return Response.ok(MetaDataHelper.getCombinedGraphMetaData(graphIdentifierList, context).toString()).build();
    }
  
    @POST
    @Path("/linkingKeys")
    @Consumes("application/json;charset=utf-8")
    public Response getLinkingKeysAndLabels(String inputList) throws IOException, JSONException, InterruptedException {
 	   	JSONArray resultArray = new JSONArray(inputList);
 	   	
 	   	HashSet<String> allGraphs = new HashSet<String>();	   	
 	   		
 	   	for(int i = 0; i < resultArray.length(); i++) {
 	   		JSONObject jsonObject = resultArray.getJSONObject(i);
 	   		
 	   		if(jsonObject.getString("type").equals("Graph")) {
 	   			String graphIdentifier = jsonObject.getString("identifier");
 	   			JSONObject metaData = MetaDataHelper.getGraphMetaData(graphIdentifier, context);
 	   			jsonObject.put("metaData", metaData.toString());
 	   			
 	   			allGraphs.add(graphIdentifier);
 	   		}
 	   		else if(jsonObject.getString("type").equals("SubWorkflow")) {
 	   			JSONObject metaData = MetaDataHelper.getCombinedGraphMetaData(jsonObject.getString("value"), context);
 	   			jsonObject.put("metaData", metaData.toString());
 	   			
 	   			JSONArray graphIdentifiers = jsonObject.getJSONArray("value");
 	   			for(int j = 0; j < graphIdentifiers.length(); j++) {
 	 	   			allGraphs.add(graphIdentifiers.getString(j));
 	   			}
 	   		}
 	   		else if(jsonObject.getString("type").equals("AllGraphs")) {

	 	   	   	JSONArray allGraphsJSONArray = new JSONArray();
	 		   	for(String s: allGraphs) {
	 		   		allGraphsJSONArray.put(s);
	 		   	}		   	
	 		   	JSONObject metaData = MetaDataHelper.getCombinedGraphMetaData(allGraphsJSONArray.toString(), context);
 	   			jsonObject.put("metaData", metaData.toString());
 	   		}
 	   		resultArray.put(i, jsonObject);
 	   	}
   		   	
    	return Response.ok(new JSONObject().put("data", resultArray).toString()).build();
    }
    
    
    /**
     * Get the complete graph in cytoscape-conform form.
     *
     * @param graphIdentifier name of the graph
     * @param sampling Type of the sampling (optional)
     * @param threshold Sampling threshold (optional)
     * @return Response containing the graph as a JSON, in cytoscape conform format.
     * @throws JSONException if JSON creation fails
     * @throws IOException   if reading fails
     */
    @GET
    @Path("/graph/{graph}")
    @Produces("application/json;charset=utf-8")
    public Response getGraph(@PathParam("graph") String graphIdentifier,
                             @MatrixParam("sampling") @DefaultValue("") String sampling,
                             @MatrixParam("threshold") @DefaultValue("0.0") float threshold) throws Exception {
        LogicalGraph graph = GraphHelper.getGraph(graphIdentifier,context);
        switch (sampling) {
            case "Node Sampling":
                graph = graph.sampleRandomNodes(threshold);
                break;
            case "Edge Sampling":
                graph = new RandomEdgeSampling(threshold, 0L).execute(graph);
                break;
            case "PageRank Sampling":
                graph = new PageRankSampling(0.5, threshold).execute(graph);
                break;
            default:
                // Ignore.
        }
        String json = GraphHelper.getCytoJsonGraph(graph);
        return Response.ok(json).build();
    }

    /**
     * Gets graph from an RDF endpoint
     * 
     * @param outputGraphIdentifier graph identifier
     * @param rdfGraphConfig configuration to obtain the graph, that contains RDF endpoint and SPARQL query
     * @return Response containing the graph as a JSON, in cytoscape conform format
     */
    @POST
    @Path("/rdfgraph/")
    @Produces("application/json;charset=utf-8")
    public Response getRDFGraph(@QueryParam("outGraph") String outputGraphIdentifier,
    							String rdfGraphConfig) throws Exception {
    	LogicalGraph graph = null;
    	
    	if(GraphHelper.graphExists(outputGraphIdentifier, context)) {
    		System.out.println("requesting existing graph: " + outputGraphIdentifier);
    		graph = GraphHelper.getGraph(outputGraphIdentifier, context);
    	}
    	else {
        	graph = RDFGraphHelper.getRDFGraph(rdfGraphConfig, ServiceHelper.getConfig());
        	
            if (StringUtils.isNotEmpty(outputGraphIdentifier)) {
                GraphHelper.storeGraph(graph, outputGraphIdentifier, context, true);
            }
    	}
        
        String json = GraphHelper.getCytoJsonGraph(graph);
        return Response.ok(json).build();
    }
    
	/**
	 * Returns information regarding of whether the graph exists or not
	 * 
	 * @param graphIdentifier identifier of the graph to be checked
	 * @return JSON response containing key-value pair "graphExists":[true/false]
	 */
    @GET
    @Path("/graphExists/{graph}")
    @Produces("application/json;charset=utf-8")
    public Response graphExists(@PathParam("graph") String graphIdentifier) throws Exception {
    	
    	JSONObject response = new JSONObject();
    	
    	if(GraphHelper.graphExists(graphIdentifier, context)){
    		response.put("graphExists", Boolean.TRUE);
    	}
    	else {
    		response.put("graphExists", Boolean.FALSE);
    	}

        return Response.ok(response.toString()).build();
    }
    
    @GET
    @Path("/renameGraph/{graph}")
    @Produces("application/json;charset=utf-8")
    public Response renameGraph(@PathParam("graph") String oldGraphIdentifier,
    							@QueryParam("outGraph") String newGraphIdentifier) throws Exception {
    	
    	JSONObject response = new JSONObject();
        
    	if(!oldGraphIdentifier.equals(newGraphIdentifier)) {
        	GraphHelper.deleteGraph(newGraphIdentifier, context);
            
        	if(GraphHelper.renameGraph(oldGraphIdentifier, newGraphIdentifier, context)){
        		response.put("success", Boolean.TRUE);
        	}
        	else {
        		response.put("success", Boolean.FALSE);
        	}
    	}
    	else {
    		response.put("success", Boolean.TRUE);
    	}

        return Response.ok(response.toString()).build();
    }
    
    /**
     * Get the complete graph in cytoscape-conform form.
     *
     * @param graphIdentifier name of the graph
     * @param sampling Type of the sampling (optional)
     * @param threshold Sampling threshold (optional)
     * @return Response containing the graph as a JSON, in cytoscape conform format.
     * @throws JSONException if JSON creation fails
     * @throws IOException   if reading fails
     */
    @GET
    @Path("/graph/sampling/{graph}")
    @Produces("application/json;charset=utf-8")
    public Response getSampledGraph(@PathParam("graph") String graphIdentifier,
                             @MatrixParam("sampling") @DefaultValue("") String sampling,
                             @MatrixParam("threshold") @DefaultValue("0.0") float threshold,
                             @MatrixParam("outGraph") @DefaultValue("") String outputGraphIdentifier) throws Exception {
        LogicalGraph graph = GraphHelper.getGraph(graphIdentifier,context);
        switch (sampling) {
            case "Node Sampling":
                graph = graph.sampleRandomNodes(threshold);
                break;
            case "Edge Sampling":
                graph = new RandomEdgeSampling(threshold, 0L).execute(graph);
                break;
            case "PageRank Sampling":
                graph = new PageRankSampling(0.5, threshold).execute(graph);
                break;
            default:
                break;
        }
        
        String json = "";
        if (StringUtils.isNotEmpty(outputGraphIdentifier)) {
        	if(graphIdentifier.equals(outputGraphIdentifier)) {
        		outputGraphIdentifier = outputGraphIdentifier + "_" + Integer.toHexString(new Random().nextInt(Integer.MAX_VALUE));
        		GraphHelper.storeGraph(graph, outputGraphIdentifier, context, true);
        		json = GraphHelper.getCytoJsonGraph(graph);
                GraphHelper.deleteGraph(graphIdentifier, context);
                GraphHelper.renameGraph(outputGraphIdentifier, graphIdentifier, context);
        	}
        	else {
        		GraphHelper.storeGraph(graph, outputGraphIdentifier, context, true);
                json = GraphHelper.getCytoJsonGraph(graph);
        	}
        }
        else {
        	json = GraphHelper.getCytoJsonGraph(graph);
        }
        
        return Response.ok(json).build();
    }
    
    /**
     * Calculates the graph schema for a given graph
     *
     * @param graphIdentifier       - name of the graph
     * @param outputGraphIdentifier - the identifier of the schema to be stored
     * @return Response containing the graph as a JSON, in cytoscape conform format.
     * @throws JSONException if JSON creation fails
     * @throws IOException   if reading or writing fails
     */
    @GET
    @Path("/graph/schema/{graph}")
    @Produces("application/json;charset=utf-8")
    public Response getSchemaGraph(@PathParam("graph") String graphIdentifier,
                                   @QueryParam("outGraph") String outputGraphIdentifier) throws Exception {

        LogicalGraph graph = GraphHelper.getGraph(graphIdentifier,context);
        LogicalGraph outputGraph = SchemaGraph.extract(graph); 

        String json = "";
        if (StringUtils.isNotEmpty(outputGraphIdentifier)) {
        	if(graphIdentifier.equals(outputGraphIdentifier)) {
        		outputGraphIdentifier = outputGraphIdentifier + "_" + Integer.toHexString(new Random().nextInt(Integer.MAX_VALUE));
        		GraphHelper.storeGraph(outputGraph, outputGraphIdentifier, context, true);
        		json = GraphHelper.getCytoJsonGraph(graph);
                GraphHelper.deleteGraph(graphIdentifier, context);
                GraphHelper.renameGraph(outputGraphIdentifier, graphIdentifier, context);
        	}
        	else {
        		GraphHelper.storeGraph(outputGraph, outputGraphIdentifier, context, true);
                json = GraphHelper.getCytoJsonGraph(graph);
        	}
        }
        else {
        	json = GraphHelper.getCytoJsonGraph(graph);
        }
        
        return Response.ok(json).build();
    }


    /**
     * @param graphIdentifier        - the name of the graph
     * @param groupingStrat          - the {@link GroupingStrategy}. Has to be "GROUP_COMBINE" (default) or "GROUP_REDUCE".
     * @param outputGraphIdentifier - the identifier for the grouped graph if it should be stored
     * @param groupingConfig         - a json string defining which vertex and egde properties for which type has to be grouped
     * @return Response containing the graph as a JSON, in cytoscape conform format.
     * @throws JSONException if JSON creation fails
     * @throws IOException   if reading or writing fails
     */
    @POST
    @Path("/graph/grouping/{graph}")
    @Consumes("application/json;charset=utf-8")
    @Produces("application/json;charset=utf-8")
    public Response groupByTypeAndAttributes(@PathParam("graph") String graphIdentifier,
                                             @DefaultValue("GROUP_COMBINE") @QueryParam("grpStrat") String groupingStrat,
                                             @QueryParam("outGraph") String outputGraphIdentifier,
                                             String groupingConfig) throws Exception {

        LogicalGraph graph = GraphHelper.getGraph(graphIdentifier,context);
        
        JsonParser parser = new JsonParser();
		JsonArray array = parser.parse(groupingConfig).getAsJsonObject().get(GroupingHelper.ARRAY_IDENTIFIER).getAsJsonArray();
		for (JsonElement element : array) {
			JsonObject configElement = element.getAsJsonObject();
			String type = configElement.get(GroupingHelper.GROUPING_PRIMITIVE).getAsString();
			String label = configElement.get(GroupingHelper.GROUPING_LABEL).getAsString();
			if (configElement.has(GroupingHelper.GROUPING_NEIGHBORS)) {
				String neighbor = configElement.get(GroupingHelper.GROUPING_NEIGHBORS).getAsString();
				graph= annotateWithNeighbor(graph, label, neighbor);
			}	
		}

        LogicalGraph outputGraph = GroupingHelper.buildGroupingWorkflow(groupingStrat, groupingConfig).execute(graph);

        String json = "";
        if (StringUtils.isNotEmpty(outputGraphIdentifier)) {
        	if(graphIdentifier.equals(outputGraphIdentifier)) {
        		outputGraphIdentifier = outputGraphIdentifier + "_" + Integer.toHexString(new Random().nextInt(Integer.MAX_VALUE));
        		GraphHelper.storeGraph(outputGraph, outputGraphIdentifier, context, true);
        		json = GraphHelper.getCytoJsonGraph(outputGraph);
                GraphHelper.deleteGraph(graphIdentifier, context);
                GraphHelper.renameGraph(outputGraphIdentifier, graphIdentifier, context);
        	}
        	else {
        		GraphHelper.storeGraph(outputGraph, outputGraphIdentifier, context, true);
                json = GraphHelper.getCytoJsonGraph(outputGraph);
        	}
        }
        else {
        	json = GraphHelper.getCytoJsonGraph(outputGraph);
        }
        
        return Response.ok(json).build();
    }

    public LogicalGraph annotateWithNeighbor(LogicalGraph graph, String groupedElement, String neighborLabel){
		
//    	//get all Vertices with given label
        DataSet<Vertex> tagVertices = graph.getVertices().filter(new FilterFunction<Vertex>() {
			
			@Override
			public boolean filter(Vertex value) throws Exception {
				return value.getLabel().equals(neighborLabel);
			}
		});
        
        
        DataSet<Vertex> personVertices = graph.getVertices().filter(new FilterFunction<Vertex>() {
			
			@Override
			public boolean filter(Vertex value) throws Exception {
				return value.getLabel().equals(groupedElement);
			}
		});
        
        
        DataSet<Vertex> outgoing = personVertices.join(graph.getEdges()).where("id").equalTo("sourceId").
        		join(tagVertices).where(new KeySelector<Tuple2<Vertex,Edge>, GradoopId>() {

					@Override
					public GradoopId getKey(Tuple2<Vertex, Edge> value) throws Exception {
						return value.f1.getTargetId();
					}
				}).equalTo("id").with(new JoinFunction<Tuple2<Vertex,Edge>,Vertex, Vertex>() {
					@Override
					public Vertex join(Tuple2<Vertex, Edge> first, Vertex second) throws Exception {
						 first.f0.setProperty("_neighbor_", second.getId());
						return first.f0;
					}
				});
        
        DataSet<Vertex> incoming = personVertices.join(graph.getEdges()).where("id").equalTo("targetId").
        		join(tagVertices).where(new KeySelector<Tuple2<Vertex,Edge>, GradoopId>() {

					@Override
					public GradoopId getKey(Tuple2<Vertex, Edge> value) throws Exception {
						return value.f1.getSourceId();
					}
				}).equalTo("id").with(new JoinFunction<Tuple2<Vertex,Edge>,Vertex, Vertex>() {
					@Override
					public Vertex join(Tuple2<Vertex, Edge> first, Vertex second) throws Exception {
						 first.f0.setProperty("_neighbor_", second.getId());
						return first.f0;
					}
				});
        		 
       DataSet inAndOut=incoming.union(outgoing).distinct("id"); 	
       DataSet allVertices= graph.getVertices().leftOuterJoin(inAndOut).where("id").equalTo("id").with(new JoinFunction<Vertex, Vertex, Vertex>(){

			@Override
			public Vertex join(Vertex first, Vertex second) throws Exception {
				if(second!=null)
				return second;
				return first;
			}
        	
        });
  
         graph = graph.getConfig().getLogicalGraphFactory().fromDataSets(allVertices, graph.getEdges());

        
    	
    	return graph;
    }
    
    @POST
    @Path("/graph/edge_fusion/{graph}")
    @Consumes("application/json;charset=utf-8")
    @Produces("application/json;charset=utf-8")
    public Response edgeFusion(@PathParam("graph") String graphIdentifier,
                                  @QueryParam("outGraph") String outputGraphIdentifier,
                                  String edgeFusionConfig) throws Exception {

        LogicalGraph inputGraph = GraphHelper.getGraph(graphIdentifier,context);

        LogicalGraph outputGraph = EdgeFusionHelper.performEdgeFusion(inputGraph, edgeFusionConfig);

        String json = "";
        if (StringUtils.isNotEmpty(outputGraphIdentifier)) {
        	if(graphIdentifier.equals(outputGraphIdentifier)) {
        		outputGraphIdentifier = outputGraphIdentifier + "_" + Integer.toHexString(new Random().nextInt(Integer.MAX_VALUE));
        		GraphHelper.storeGraph(outputGraph, outputGraphIdentifier, context, true);
        		json = GraphHelper.getCytoJsonGraph(outputGraph);
                GraphHelper.deleteGraph(graphIdentifier, context);
                GraphHelper.renameGraph(outputGraphIdentifier, graphIdentifier, context);
        	}
        	else {
        		GraphHelper.storeGraph(outputGraph, outputGraphIdentifier, context, true);
                json = GraphHelper.getCytoJsonGraph(outputGraph);
        	}
        }
        else {
        	json = GraphHelper.getCytoJsonGraph(outputGraph);
        }
        
        return Response.ok(json).build();
    }    

    @POST
    @Path("/graph/vertex_fusion/{graph}")
    @Consumes("application/json;charset=utf-8")
    @Produces("application/json;charset=utf-8")
    public Response vertexFusion(@PathParam("graph") String graphIdentifier,
                                  @QueryParam("outGraph") String outputGraphIdentifier,
                                  String vertexFusionConfig) throws Exception {

        LogicalGraph inputGraph = GraphHelper.getGraph(graphIdentifier,context);

        LogicalGraph outputGraph = inputGraph.callForGraph(new VertexFusionOperator(vertexFusionConfig, new CountValues()));

        String json = "";
        if (StringUtils.isNotEmpty(outputGraphIdentifier)) {
        	if(graphIdentifier.equals(outputGraphIdentifier)) {
        		outputGraphIdentifier = outputGraphIdentifier + "_" + Integer.toHexString(new Random().nextInt(Integer.MAX_VALUE));
        		GraphHelper.storeGraph(outputGraph, outputGraphIdentifier, context, true);
        		json = GraphHelper.getCytoJsonGraph(outputGraph);
                GraphHelper.deleteGraph(graphIdentifier, context);
                GraphHelper.renameGraph(outputGraphIdentifier, graphIdentifier, context);
        	}
        	else {
        		GraphHelper.storeGraph(outputGraph, outputGraphIdentifier, context, true);
                json = GraphHelper.getCytoJsonGraph(outputGraph);
        	}
        }
        else {
        	json = GraphHelper.getCytoJsonGraph(outputGraph);
        }
        
        return Response.ok(json).build();
    }
    
    
    @POST
    @Path("/graph/pattern_match/{graph}")
    @Consumes("application/json;charset=utf-8")
    @Produces("application/json;charset=utf-8")
    public Response pattern_match(@PathParam("graph") String graphIdentifier,
                                  @QueryParam("outGraph") String outputGraphIdentifier,
                                  String patternMatchingConfig) throws Exception {

        LogicalGraph graph = GraphHelper.getGraph(graphIdentifier,context);

        LogicalGraph outputGraph = PatternMatchingHelper.runPatternMatching(graph, patternMatchingConfig);
        
        String json = "";
        if (StringUtils.isNotEmpty(outputGraphIdentifier)) {
        	if(graphIdentifier.equals(outputGraphIdentifier)) {
        		outputGraphIdentifier = outputGraphIdentifier + "_" + Integer.toHexString(new Random().nextInt(Integer.MAX_VALUE));
        		GraphHelper.storeGraph(outputGraph, outputGraphIdentifier, context, true);
        		json = GraphHelper.getCytoJsonGraph(outputGraph);
                GraphHelper.deleteGraph(graphIdentifier, context);
                GraphHelper.renameGraph(outputGraphIdentifier, graphIdentifier, context);
        	}
        	else {
        		GraphHelper.storeGraph(outputGraph, outputGraphIdentifier, context, true);
                json = GraphHelper.getCytoJsonGraph(outputGraph);
        	}
        }
        else {
        	json = GraphHelper.getCytoJsonGraph(outputGraph);
        }
        return Response.ok(json).build();
    }


    /**
     * Creates a vertex or edge induced subgraph where defined filter criterion are met and stores it with the name
     * of the given identifier.
     *
     * @param graphIdentifier         - name of the graph
     * @param filteredGraphIdentifier - the identifier to store the filtered graph
     * @param filterConfig            - JSON configuration for filtering the graph
     * @return Response containing the graph as a JSON, in cytoscape conform format.
     * @throws JSONException if JSON creation fails
     * @throws IOException   if reading or writing fails
     */
    @POST
    @Path("/graph/filter/{graph}")
    @Consumes("application/json;charset=utf-8")
    @Produces("application/json;charset=utf-8")
    public Response filterGraph(@PathParam("graph") String graphIdentifier,
                                @QueryParam("outGraph") String outputGraphIdentifier,
                                String filterConfig) throws Exception {
        LogicalGraph graph = GraphHelper.getGraph(graphIdentifier,context);
        LogicalGraph subGraph = FilteringHelper.createSubGraph(graph, filterConfig);
        
        String json = "";
        
        if (StringUtils.isNotEmpty(outputGraphIdentifier)) {
        	if(graphIdentifier.equals(outputGraphIdentifier)) {
        		outputGraphIdentifier = outputGraphIdentifier + "_" + Integer.toHexString(new Random().nextInt(Integer.MAX_VALUE));
        		GraphHelper.storeGraph(subGraph, outputGraphIdentifier, context, true);
        		json = GraphHelper.getCytoJsonGraph(subGraph);
                GraphHelper.deleteGraph(graphIdentifier, context);
                GraphHelper.renameGraph(outputGraphIdentifier, graphIdentifier, context);
        	}
        	else {
        		GraphHelper.storeGraph(subGraph, outputGraphIdentifier, context, true);
                json = GraphHelper.getCytoJsonGraph(subGraph);
        	}
        }
        else {
        	json = GraphHelper.getCytoJsonGraph(subGraph);
        }
       
        return Response.ok(json).build();
    }

    
    /**
     * Creates a clustered graph
     *
     * @param graphIdentifier          - name of the graph
     * @param outputGraphIdentifier - the identifier to store the clustered graph
     * @param clusteringConfig         - JSON configuration for clustering the graph
     * @return Response containing the graph as a JSON, in cytoscape conform format.
     * @throws JSONException if JSON creation fails
     * @throws IOException   if reading or writing fails
     */
    @POST
    @Path("/graph/clustering/{graph}")
    @Consumes("application/json;charset=utf-8")
    @Produces("application/json;charset=utf-8")
    public Response clusterGraph(@PathParam("graph") String graphIdentifier,
                                @QueryParam("outGraph") String outputGraphIdentifier,
                                String clusteringConfig) throws Exception {
        LogicalGraph graph = GraphHelper.getGraph(graphIdentifier,context);
        LogicalGraph outputGraph = ClusteringHelper.runClustering(graph, clusteringConfig);

        String json = "";
        if (StringUtils.isNotEmpty(outputGraphIdentifier)) {
        	if(graphIdentifier.equals(outputGraphIdentifier)) {
        		outputGraphIdentifier = outputGraphIdentifier + "_" + Integer.toHexString(new Random().nextInt(Integer.MAX_VALUE));
        		GraphHelper.storeGraph(outputGraph, outputGraphIdentifier, context, true);
        		json = GraphHelper.getCytoJsonGraph(outputGraph);
                GraphHelper.deleteGraph(graphIdentifier, context);
                GraphHelper.renameGraph(outputGraphIdentifier, graphIdentifier, context);
        	}
        	else {
        		GraphHelper.storeGraph(outputGraph, outputGraphIdentifier, context, true);
                json = GraphHelper.getCytoJsonGraph(outputGraph);
        	}
        }
        else {
        	json = GraphHelper.getCytoJsonGraph(outputGraph);
        }
        
        return Response.ok(json).build();
    }

    @POST
    @Path("/graph/cypher/{graph}")
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_FORM_URLENCODED)
    public Response cypherQuery(@PathParam("graph") String graphIdentifier,
                                @QueryParam("outGraph") String outputGraphIdentifier,
                                @FormParam("cypher-query") String cypherQuery,
                                @FormParam("cypher-attach-attr") @DefaultValue("on") String setAttachAttr,
                                @FormParam("cypher-constr-pattern") String constructionPattern) throws Exception {
        // Apparently checkboxes are encoded with "on" and "off"
        final boolean attachAttr = setAttachAttr.equals("on");
        LogicalGraph graph = GraphHelper.getGraph(graphIdentifier, context);
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
        LogicalGraph outputGraph = graph.getConfig().getLogicalGraphFactory()
                .fromDataSets(cypher.getVertices().distinct(new Id<>()), cypher.getEdges().distinct(new Id<>()));

        String json = "";
        
        if (StringUtils.isNotEmpty(outputGraphIdentifier)) {
        	if(graphIdentifier.equals(outputGraphIdentifier)) {
        		outputGraphIdentifier = outputGraphIdentifier + "_" + Integer.toHexString(new Random().nextInt(Integer.MAX_VALUE));
        		GraphHelper.storeGraph(outputGraph, outputGraphIdentifier, context, true);
        		json = GraphHelper.getCytoJsonGraph(outputGraph);
                GraphHelper.deleteGraph(graphIdentifier, context);
                GraphHelper.renameGraph(outputGraphIdentifier, graphIdentifier, context);
        	}
        	else {
        		GraphHelper.storeGraph(outputGraph, outputGraphIdentifier, context, true);
                json = GraphHelper.getCytoJsonGraph(outputGraph);
        	}
        }
        else {
        	json = GraphHelper.getCytoJsonGraph(outputGraph);
        }
        
        return Response.ok(json).build();
    }

    @GET
    @Path("/graph/expand/{graph}")
    @Produces(MediaType.APPLICATION_JSON)
    public Response expand(@PathParam("graph") String graphIdentifier,
                           @QueryParam("outGraph") String outputGraphIdentifier,
                           @QueryParam("typeProperty") String typeProperty) throws Exception {
        LogicalGraph graph = GraphHelper.getGraph(graphIdentifier, context);
        System.out.println("Calling expand");
        LogicalGraph outputGraph = graph.callForGraph(new ExpandGraph(Objects.toString(typeProperty, "").isEmpty() ?
                ExpandGraph.DEFAULT_PROPERTY_KEY : typeProperty));

        String json = "";
        if (StringUtils.isNotEmpty(outputGraphIdentifier)) {
        	if(graphIdentifier.equals(outputGraphIdentifier)) {
        		outputGraphIdentifier = outputGraphIdentifier + "_" + Integer.toHexString(new Random().nextInt(Integer.MAX_VALUE));
        		GraphHelper.storeGraph(outputGraph, outputGraphIdentifier, context, true);
        		json = GraphHelper.getCytoJsonGraph(outputGraph);
                GraphHelper.deleteGraph(graphIdentifier, context);
                GraphHelper.renameGraph(outputGraphIdentifier, graphIdentifier, context);
        	}
        	else {
        		GraphHelper.storeGraph(outputGraph, outputGraphIdentifier, context, true);
                json = GraphHelper.getCytoJsonGraph(outputGraph);
        	}
        }
        else {
        	json = GraphHelper.getCytoJsonGraph(outputGraph);
        }
        
        return Response.ok(json).build();
    }

    /**
     * Creates a new graph by computing a similarity Graph and adding edges between similar nodes to the input graph.
     *
     * @param similarityGraphIdentifier - the identifier to store the linked graph
     * @param config               - JSON configuration which describes linking configuration und an array of input graphs
     * @return Response containing the graph as a JSON, in cytoscape conform format.
     * @throws JSONException if JSON creation fails
     * @throws IOException   if reading or writing fails
     */
    @POST
    @Path("/graph/linking")
    @Consumes("application/json;charset=utf-8")
    @Produces("application/json;charset=utf-8")
    public Response dedupGraph(@QueryParam("linkedGraph") String outputGraphIdentifier,
                               String config) throws Exception {
    	
    	JSONObject configObject = new JSONObject(config);
    	
    	String linkingConfig = configObject.getString("linkingConfig");
    	
    	// contains json array with matching pairs of saved graphs and names used to refer to them in the UI 
    	String inputGraphs = configObject.getString("inputGraphs");

    	// performs preprocessing and outputs combined input graph
		LogicalGraph inputGraph = LinkingHelper.prepareInputGraph(inputGraphs, context);
    			
		LogicalGraph outputGraph = LinkingHelper.runLinking(inputGraph, linkingConfig);
    	
		JSONArray inputGraphsArray = new JSONArray(inputGraphs);
		boolean hasEqualGraph = false;
		String graphIdentifier = "";
		
		for(int i = 0; i < inputGraphsArray.length(); i++) {
			String inputGraphIdentifier = inputGraphsArray.getJSONObject(i).getString("inputGraphIdentifier");
			if(inputGraphIdentifier.equals(outputGraphIdentifier)) {
				hasEqualGraph = true;
				graphIdentifier = inputGraphIdentifier;
			}
		}
		
        String json = "";
        if (StringUtils.isNotEmpty(outputGraphIdentifier)) {
        	if(hasEqualGraph) {
        		outputGraphIdentifier = outputGraphIdentifier + "_" + Integer.toHexString(new Random().nextInt(Integer.MAX_VALUE));
        		GraphHelper.storeGraph(outputGraph, outputGraphIdentifier, context, true);
        		json = GraphHelper.getCytoJsonGraph(outputGraph);
                GraphHelper.deleteGraph(graphIdentifier, context);
                GraphHelper.renameGraph(outputGraphIdentifier, graphIdentifier, context);
        	}
        	else {
        		GraphHelper.storeGraph(outputGraph, outputGraphIdentifier, context, true);
                json = GraphHelper.getCytoJsonGraph(outputGraph);
        	}
        }
        else {
        	json = GraphHelper.getCytoJsonGraph(outputGraph);
        }
		
		return Response.ok(json).build();
    }

    /**
     * Creates a new graph where every vertex has a "ccId" for it's corresponding weakly connected component
     *
     * @param graphIdentifier       - name of the inputgraph
     * @param outputGraphIdentifier - the identifier to store the graph with the connected components ids
     * @return Response containing the graph as a JSON, in cytoscape conform format.
     * @throws JSONException if JSON creation fails
     * @throws IOException   if reading or writing fails
     */
    @GET
    @Path("/graph/wcc/{graph}")
    @Consumes("application/json;charset=utf-8")
    @Produces("application/json;charset=utf-8")
    public Response weaklyConnectedComponents(@PathParam("graph") String graphIdentifier,
                                              @QueryParam("outGraph") String outputGraphIdentifier) throws Exception {
        LogicalGraph graph = GraphHelper.getGraph(graphIdentifier, context);
        LogicalGraph outputGraph = GellyHelper.calculateConnectedComponents(graph);

        String json = "";
        if (StringUtils.isNotEmpty(outputGraphIdentifier)) {
        	if(graphIdentifier.equals(outputGraphIdentifier)) {
        		outputGraphIdentifier = outputGraphIdentifier + "_" + Integer.toHexString(new Random().nextInt(Integer.MAX_VALUE));
        		GraphHelper.storeGraph(outputGraph, outputGraphIdentifier, context, true);
        		json = GraphHelper.getCytoJsonGraph(outputGraph);
                GraphHelper.deleteGraph(graphIdentifier, context);
                GraphHelper.renameGraph(outputGraphIdentifier, graphIdentifier, context);
        	}
        	else {
        		GraphHelper.storeGraph(outputGraph, outputGraphIdentifier, context, true);
                json = GraphHelper.getCytoJsonGraph(outputGraph);
        	}
        }
        else {
        	json = GraphHelper.getCytoJsonGraph(outputGraph);
        }
        
        return Response.ok(json).build();
    }

    /**
     * Creates a new graph where every vertex has a "pagerank" calculated by gelly
     *
     * @param graphIdentifier   - name of the inputgraph
     * @param prGraphIdentifier - the identifier to store the graph with the pageranks
     * @return Response containing the graph as a JSON, in cytoscape conform format.
     * @throws JSONException if JSON creation fails
     * @throws IOException   if reading or writing fails
     */
    @GET
    @Path("/graph/pr/{graph}")
    @Consumes("application/json;charset=utf-8")
    @Produces("application/json;charset=utf-8")
    public Response pageRank(@PathParam("graph") String graphIdentifier,
                             @QueryParam("outGraph") String outputGraphIdentifier,
                             @DefaultValue("0.85") @QueryParam("damping") Double dampingFactor,
                             @DefaultValue("30") @QueryParam("iter") Integer iterations) throws Exception {
        LogicalGraph graph = GraphHelper.getGraph(graphIdentifier,context);
        LogicalGraph outputGraph = GellyHelper.calculatePageRank(graph, dampingFactor, iterations);

        String json = "";
        if (StringUtils.isNotEmpty(outputGraphIdentifier)) {
        	if(graphIdentifier.equals(outputGraphIdentifier)) {
        		outputGraphIdentifier = outputGraphIdentifier + "_" + Integer.toHexString(new Random().nextInt(Integer.MAX_VALUE));
        		GraphHelper.storeGraph(outputGraph, outputGraphIdentifier, context, true);
        		json = GraphHelper.getCytoJsonGraph(outputGraph);
                GraphHelper.deleteGraph(graphIdentifier, context);
                GraphHelper.renameGraph(outputGraphIdentifier, graphIdentifier, context);
        	}
        	else {
        		GraphHelper.storeGraph(outputGraph, outputGraphIdentifier, context, true);
                json = GraphHelper.getCytoJsonGraph(outputGraph);
        	}
        }
        else {
        	json = GraphHelper.getCytoJsonGraph(outputGraph);
        }
        
        return Response.ok(json).build();
    }

    /**
     * Creates a new graph where every vertex has a "pagerank" calculated by gelly
     *
     * @param graphIdentifier      - name of the inputgraph
     * @param otherGraphIdentifier - name of the other input graph
     * @param outGraph             - the identifier to store the graph with the pageranks
     * @return Response containing the graph as a JSON, in cytoscape conform format.
     * @throws JSONException if JSON creation fails
     * @throws IOException   if reading or writing fails
     */
    @GET
    @Path("/graph/binary/{graph}/{otherGraph}")
    @Consumes("application/json;charset=utf-8")
    @Produces("application/json;charset=utf-8")
    public Response binaryOperation(@PathParam("graph") String graphIdentifier,
                                    @PathParam("otherGraph") String otherGraphIdentifier,
                                    @QueryParam("op") String operation,
                                    @QueryParam("outGraph") String outputGraphIdentifier) throws Exception {
        LogicalGraph graph = GraphHelper.getGraph(graphIdentifier,context);
        LogicalGraph otherGraph = GraphHelper.getGraph(otherGraphIdentifier,context);

        LogicalGraph outputGraph = null;
        if (operation.equals("combination")) {
        	outputGraph = graph.combine(otherGraph);
        } else if(operation.equals("overlap")) {
        	outputGraph = graph.overlap(otherGraph);
        } else if(operation.equals("exclusion")) {
        	outputGraph = graph.exclude(otherGraph);
        }
        
        String json = "";
        if (StringUtils.isNotEmpty(outputGraphIdentifier) && outputGraph != null) {
        	if(graphIdentifier.equals(outputGraphIdentifier)) {
        		outputGraphIdentifier = outputGraphIdentifier + "_" + Integer.toHexString(new Random().nextInt(Integer.MAX_VALUE));
        		GraphHelper.storeGraph(outputGraph, outputGraphIdentifier, context, true);
        		json = GraphHelper.getCytoJsonGraph(outputGraph);
                GraphHelper.deleteGraph(graphIdentifier, context);
                GraphHelper.renameGraph(outputGraphIdentifier, graphIdentifier, context);
        	}
        	else {
        		GraphHelper.storeGraph(outputGraph, outputGraphIdentifier, context, true);
                json = GraphHelper.getCytoJsonGraph(outputGraph);
        	}
        }
        else {
        	json = GraphHelper.getCytoJsonGraph(outputGraph);
        }

        return Response.ok(json).build();
    }

    /**
     * Returns text response to caller containing uploaded file location
     *
     * @return error response in case of missing parameters an internal
     * exception or success response if file has been stored
     * successfully
     */
    @POST
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @Path("/upload/{graph}/{element}")
    public Response uploadFile(@PathParam("graph") String graphIdentifier,
                               @PathParam("element") String graphElementType,
                               @FormDataParam("file") InputStream uploadedInputStream,
                               @FormDataParam("file") FormDataContentDisposition fileDetail) {
        // check if all form parameters are provided
        if (uploadedInputStream == null || fileDetail == null)
            return Response.status(400).entity("Invalid form data").build();
        // create our destination folder, if it not exists
        try {
            FileUploadHelper.createFolderIfNotExists(graphIdentifier, graphElementType, context);
        } catch (IOException | SecurityException se) {
            return Response.status(500)
                    .entity("Can not create destination folder on server")
                    .build();
        }
        String uploadedFileLocation;
        try {
            uploadedFileLocation = FileUploadHelper.saveToFile(uploadedInputStream, graphIdentifier,
                    graphElementType, fileDetail.getFileName(), context);
        } catch (IOException e) {
            return Response.status(500).entity("Can not save file").build();
        }
        return Response.status(200)
                .entity("File saved to " + uploadedFileLocation).build();
    }

    @POST
    @Path("/colors/{filename}")
    @Consumes(MediaType.APPLICATION_JSON)
    public Response uploadConfig(@PathParam("filename") String filename,
                              String data){
        // check if all form parameters are provided
        //InputStream uploadedInputStream = new ByteArrayInputStream(data.getBytes(StandardCharsets.UTF_8.name()));
        if (data == null )
            return Response.status(400).entity("Invalid form data").build();
        // create our destination folder, if it not exists

        String uploadedFileLocation;
        try {
            uploadedFileLocation = FileUploadHelper.saveColorsToFile(data, filename, context);
        } catch (IOException e) {
            return Response.status(500).entity("Can not save file").build();
        }
        return Response.status(200)
                .entity(filename +" saved to " + uploadedFileLocation).build();
    }


    /**
     * save config-data (colors) as json file to current graph directory
     *
     * @param graphIdentifier current graph
     * @param data data to be stored
     * @return error response in case of missing parameters an internal
     * exception or success response if file has been stored
     * successfully
     */
    @POST
    @Path("/upload/{graph}")
    @Consumes(MediaType.APPLICATION_FORM_URLENCODED)
    public Response uploadJSON(@PathParam("graph") String graphIdentifier,
                               @FormParam("name") String filename,
                               @FormParam("file") String data){
        // check if all form parameters are provided
        //InputStream uploadedInputStream = new ByteArrayInputStream(data.getBytes(StandardCharsets.UTF_8.name()));
        if (data == null )
            return Response.status(400).entity("Invalid form data").build();
        // create our destination folder, if it not exists

        String uploadedFileLocation;
        try {
            uploadedFileLocation = FileUploadHelper.saveToJSON(data, graphIdentifier, filename, context);
        } catch (IOException e) {
            return Response.status(500).entity("Can not save file").build();
        }
        return Response.status(200)
                .entity(filename +" saved to " + uploadedFileLocation).build();
    }

    /**
    *
    * @return JSON Array of nodes and corresponding colors
    */
   @GET
   @Path("/json/{type}")
   //@Consumes("application/json;charset=utf-8")
   //@Produces("application/json;charset=utf-8")
   public Response getJSONFile(@PathParam("type") String identifier, @QueryParam("json") String filename) throws IOException, URISyntaxException {
       try {
           String path = GraphHelper.getPath(identifier, context);
           //Logger.getLogger(RequestHandler.class.getName()).log(Level.INFO, "Reading from {0}", filename);
           JSONObject jsonFile = MetaDataHelper.readJSONFile(path, filename);
           if (jsonFile == null) {
               return Response.ok("null").build();
           } else {
               return Response.ok(jsonFile.toString()).build();
           }

       } catch (JSONException e) {
           e.printStackTrace();
       }
       return Response.status(Response.Status.NOT_FOUND).build();

   }

   /**
    *
    * @return JSON Array of nodes and corresponding colors from graph folder
    */
   @GET
   @Path("/graph")
   //@Consumes("application/json;charset=utf-8")
   //@Produces("application/json;charset=utf-8")
   public Response getJSONFileFromGraph(@QueryParam("graph") String graphIdentifier, @QueryParam("json") String filename) throws IOException, URISyntaxException {
       try {
           String path = GraphHelper.getGraphPath(graphIdentifier, context);
           JSONObject jsonFile = MetaDataHelper.readJSONFile(path, filename);
           if (jsonFile == null) {
               return Response.ok("null").build();
           } else {
               return Response.ok(jsonFile.toString()).build();
           }

       } catch (JSONException e) {
           e.printStackTrace();
       }
       return Response.status(Response.Status.NOT_FOUND).build();

   }

    /**
    * Recomputates graph metadata for existing graphs and returns status message.
    * If recomputation was successful additionally returns contents of the new metadata file.
    * @return status message after recalculating graph metadata
    */
   @GET
   @Path("/updateMetaData/{graph}")
   //@Consumes("application/json;charset=utf-8")
   //@Produces("application/json;charset=utf-8")
   public Response updateMetaData(
		   @PathParam("graph") String graphIdentifier, 
		   @QueryParam("json") String filename) throws IOException, URISyntaxException {

       try {	   
    	   List<String> existingGraphs = Arrays.asList(GraphHelper.getExistingGraphs(context));
    	   if (existingGraphs.contains(graphIdentifier)) {
        	   JSONObject metaData = MetaDataHelper.updateGraphMetaData(graphIdentifier, context);
        	   return Response.ok("Metadata for graph \"" + graphIdentifier + "\" successfully updated.<br><br>" + metaData).build();
    	   }
    	   else {
    	       return Response.ok("Graph \"" + graphIdentifier + "\" does not exist").build();
    	   }	   
       } catch (Exception e) {
           e.printStackTrace();
       }
       
       return Response.ok("Error during metadata recalculation for graph " + graphIdentifier).build();
   }

   @POST
   @Path("/workflow/compute/")
   @Consumes("application/json;charset=utf-8")
   @Produces("application/json;charset=utf-8")
   public Response computeWorkflow(String builderConfig) throws Exception {
	   
	   JSONObject builderConfigObject = new JSONObject(builderConfig);
	   JSONArray builderConfigArray = (JSONArray)builderConfigObject.get("connections");

		// searching for the identifier of the output graph before we change identifier to path
		String outputGraph = "";
		for(int i = 0; i < builderConfigArray.length(); i++ ) {
			String className = ((JSONObject)((JSONObject)builderConfigArray.get(i)).get("to")).getString("className");     	
			if(className.equals("org.uni_leipzig.biggr.builder.constructors.JSONDataSinkConstructor")) {
				outputGraph = ((JSONObject)((JSONObject)((JSONObject)builderConfigArray.get(i)).get("to")).get("arguments")).getString("path");
			}
		}
		
	   // changing graph identifier to graph path, due to graph path data is not available on the client side
	   for(int i = 0; i < builderConfigArray.length(); i++ ) {
			String className = ((JSONObject)((JSONObject)builderConfigArray.get(i)).get("from")).getString("className");     	
			// data source can be both source and target of the connection
			// data sink can be only target of the connection
			if(className.equals("org.uni_leipzig.biggr.builder.constructors.JSONDataSourceConstructor") ) {			
				String graphIdentifier = ((JSONObject)((JSONObject)((JSONObject)builderConfigArray.get(i)).get("from")).get("arguments")).getString("path");
				String graphPath = GraphHelper.getGraphPath(graphIdentifier, context);
				
				((JSONObject)((JSONObject)((JSONObject)builderConfigArray.get(i)).get("from")).get("arguments")).put("path", graphPath);
			}

			className = ((JSONObject)((JSONObject)builderConfigArray.get(i)).get("to")).getString("className"); 
			if(className.equals("org.uni_leipzig.biggr.builder.constructors.JSONDataSourceConstructor") 
					|| className.equals("org.uni_leipzig.biggr.builder.constructors.JSONDataSinkConstructor") ) {			
				String graphIdentifier = ((JSONObject)((JSONObject)((JSONObject)builderConfigArray.get(i)).get("to")).get("arguments")).getString("path");
				String graphPath = GraphHelper.getGraphPath(graphIdentifier, context);
				((JSONObject)((JSONObject)((JSONObject)builderConfigArray.get(i)).get("to")).get("arguments")).put("path", graphPath);
			}
		}
	    
	    // removing identifiers from edges
	    for(int i = 0; i < builderConfigArray.length(); i++ ) {
	    	JSONObject jsonObject = builderConfigArray.getJSONObject(i);
	    	jsonObject.remove("identifier");
	    	builderConfigArray.put(i, jsonObject);
	    }    
	    
	   	builderConfigObject.put("connections", builderConfigArray);
	   	
	    // computing workflow using gradoop-builder
		GradoopOperatorFlow operatorFlow = new ObjectMapper().readValue(builderConfigObject.toString().getBytes(), GradoopOperatorFlow.class);
		ExecutionEnvironment env = ExecutionEnvironment.getExecutionEnvironment();
		GradoopFlinkConfig gfc = GradoopFlinkConfig.createConfig(env);
		GradoopFlowBuilder.createFlinkJob(gfc, operatorFlow);
		env.execute(); 		
		
		
		// getting output graph and sending it to the front-end
		LogicalGraph graph = GraphHelper.getGraph(outputGraph,context);
		String graphJson = GraphHelper.getCytoJsonGraph(graph);      
		
		JSONObject output = new JSONObject();
		output.put("data", graphJson);
		output.put("name", outputGraph);
		
		return Response.ok(output.toString()).build();
   }
   
   @POST
   @Path("/workflow/save/{workflow}")
   @Consumes("application/json;charset=utf-8")
   public Response saveWorkflow(
		   @PathParam("workflow") String workflowName, 
		   String workflowConfig) throws Exception {
       try {
    	   FileUploadHelper.saveWorkflowToFile(workflowName, workflowConfig, context);
    	   return Response.ok(new JSONObject().put("message", "workflow saved").toString()).build();   
       } catch (IOException e) {
           return Response.status(500).entity("Can not save file").build();
       }
   }
   
   @GET
   @Path("/workflow/load/{workflow}")
   @Consumes("application/json;charset=utf-8")
   @Produces("application/json;charset=utf-8")
   public Response getWorkflow(
		   @PathParam("workflow") String workflowName) throws Exception {
	   
	    JSONObject workflowObject = MetaDataHelper.readWorkflowFile(workflowName, context);
	   
		return Response.ok(workflowObject.toString()).build(); 			   
   }
	
	
}