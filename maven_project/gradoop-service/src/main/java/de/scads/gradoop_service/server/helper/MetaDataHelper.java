package de.scads.gradoop_service.server.helper;

import de.scads.gradoop_service.server.helper.grouping.functions.LabelGroupReducer;
import de.scads.gradoop_service.server.helper.grouping.functions.LabelMapper;
import de.scads.gradoop_service.server.helper.grouping.functions.LabelReducer;
import de.scads.gradoop_service.server.helper.grouping.functions.PropertyKeyMapper;
import org.apache.commons.io.IOUtils;
import org.apache.flink.api.java.tuple.Tuple3;
import org.apache.hadoop.fs.FSDataInputStream;
import org.apache.hadoop.fs.FSDataOutputStream;
import org.apache.hadoop.fs.FileSystem;
import org.apache.hadoop.fs.Path;
import org.codehaus.jettison.json.JSONArray;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;
import org.gradoop.flink.io.impl.json.JSONDataSource;
import org.gradoop.flink.model.api.epgm.LogicalGraph;

import java.io.FileOutputStream;
import java.io.IOException;
import java.io.OutputStreamWriter;
import java.io.StringWriter;
import java.io.Writer;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.logging.Level;
import java.util.logging.Logger;

import javax.servlet.ServletContext;

/**
 * This Helper calculates and handles meta information of graphs.
 */
public class MetaDataHelper {
    /**
     * Relative path for storing graph metadata.
     */
    private static final String metaDataPath = Path.SEPARATOR + "metadata.json";
    /**
     * Logger for this class.
     */
    private static final Logger LOGGER = Logger.getLogger(MetaDataHelper.class.getName());
    private static Map<String, JSONObject> graphMetaData = new HashMap<>();

    /**
     * @param graphIdentifier - the graph of which the meta data is needed
     * @return The JsonObject specifying the graph meta data
     */
    public static JSONObject getGraphMetaData(String graphIdentifier, ServletContext contx) throws IOException {
        JSONObject result;
        if (!graphMetaData.containsKey(graphIdentifier)) {
            result = MetaDataHelper.computeKeysAndLabels(graphIdentifier , contx);
            graphMetaData.put(graphIdentifier, result);
        } else {
            result = graphMetaData.get(graphIdentifier);
        }
        return result;
    }

    /**
     * Calculates combined metadata for the given list of graphs
     * @param graphList - list of graphs the metadata have to be combined  
     * @return JSONObject specifying the combined graph meta data
     */
    public static JSONObject getCombinedGraphMetaData(String graphIdentifierList, ServletContext contx) throws JSONException, IOException {
    	
    	JSONArray jsonArray = new JSONArray(graphIdentifierList);
    	ArrayList<JSONObject> metaDataObjects = new ArrayList<>();
    	
    	for(int i = 0; i < jsonArray.length(); i++) {
    		String graphMetaData = MetaDataHelper.getGraphMetaData(jsonArray.get(i).toString(), contx).toString();
    		// creating  a copy of the initial JSONObject due to reference being stored
    		metaDataObjects.add(new JSONObject(graphMetaData));
    	}

    	JSONObject combined = new JSONObject();
    	
        combined.put("vertexKeys", new JSONArray());
        combined.put("edgeKeys", new JSONArray());
        combined.put("vertexLabels", new JSONArray());
        combined.put("edgeLabels", new JSONArray());
      
    	for(JSONObject metaDataObject: metaDataObjects) {
    		if (metaDataObject.opt("vertexLabels") != null) {
    			JSONArray ja = (JSONArray)metaDataObject.opt("vertexLabels");
    			for(int i = 0; i < ja.length(); i++) {
    				String str = (String)ja.get(i);
    				JSONArray existingVertexLabels = (JSONArray)combined.get("vertexLabels");
    				boolean isNew = true;
    				for(int j = 0; j < existingVertexLabels.length(); j++) {
    					if(str.equals(existingVertexLabels.get(j))) {
    						isNew = false;
    					}
    				}
    				if(isNew) {
    					existingVertexLabels.put(str);
    				}
    			}
    	    	
    		}
    		
    		if (metaDataObject.opt("edgeLabels") != null) {
    			JSONArray ja = (JSONArray)metaDataObject.opt("edgeLabels");
    			for(int i = 0; i < ja.length(); i++) {
    				String str = (String)ja.get(i);
    				JSONArray existingEdgeLabels = (JSONArray)combined.get("edgeLabels");
    				boolean isNew = true;
    				for(int j = 0; j < existingEdgeLabels.length(); j++) {
    					if(str.equals(existingEdgeLabels.get(j))) {
    						isNew = false;
    					}
    				}
    				if(isNew) {
    					existingEdgeLabels.put(str);
    				}
    			}
    		}
    		
    		if (metaDataObject.opt("vertexKeys") != null) {
    			JSONArray ja = (JSONArray)metaDataObject.opt("vertexKeys");
    			
    			for(int i = 0; i < ja.length(); i++) {
    				JSONObject vertexKey = (JSONObject)ja.get(i);
    				boolean isNew = true;
    				JSONArray combinedVertexKeys = (JSONArray)combined.get("vertexKeys");
    				String currentVertexKeyName = vertexKey.getString("name");
    				for(int j = 0; j < combinedVertexKeys.length(); j++) {
    					String combinedVertexKeyName = ((JSONObject)combinedVertexKeys.get(j)).getString("name");
    					if(combinedVertexKeyName.equals(currentVertexKeyName)) {
    						isNew = false;
    					}
    				}
    				
    				JSONArray vertexKeyLabels = (JSONArray)vertexKey.get("labels");
    				
    				if(isNew) {
    					for(int k = 0; k < metaDataObjects.size(); k++) {
    						JSONArray otherVertexKeys = (JSONArray)metaDataObjects.get(k).opt("vertexKeys");
    						for(int m = 0; m < otherVertexKeys.length(); m++) {
    							if(((JSONObject)otherVertexKeys.get(m)).getString("name").equals(currentVertexKeyName)) {
    								JSONArray otherVertexKeyLabels = (JSONArray)((JSONObject)otherVertexKeys.get(m)).get("labels");
    								for(int n = 0; n < otherVertexKeyLabels.length(); n++) {
    									boolean labelExists = false;
    									for(int p = 0; p < vertexKeyLabels.length(); p++) {
    										if(vertexKeyLabels.getString(p).equals(otherVertexKeyLabels.getString(n))) {
    											labelExists = true;
    										}
    									}
    									if(!labelExists) {
    										vertexKeyLabels.put(otherVertexKeyLabels.getString(n));
    									}
    								}	
    							}
    						}
    					}
    					((JSONArray)combined.get("vertexKeys")).put(vertexKey);
    				}
    			}
    		}
    		
    		if (metaDataObject.opt("edgeKeys") != null) {
    			JSONArray ja = (JSONArray)metaDataObject.opt("edgeKeys");
    			
    			for(int i = 0; i < ja.length(); i++) {
    				JSONObject vertexKey = (JSONObject)ja.get(i);
    				boolean isNew = true;
    				JSONArray combinedVertexKeys = (JSONArray)combined.get("edgeKeys");
    				String currentVertexKeyName = vertexKey.getString("name");
    				for(int j = 0; j < combinedVertexKeys.length(); j++) {
    					String combinedVertexKeyName = ((JSONObject)combinedVertexKeys.get(j)).getString("name");
    					if(combinedVertexKeyName.equals(currentVertexKeyName)) {
    						isNew = false;
    					}
    				}
    				
    				JSONArray vertexKeyLabels = (JSONArray)vertexKey.get("labels");
    				
    				if(isNew) {
    					for(int k = 0; k < metaDataObjects.size(); k++) {
    						JSONArray otherVertexKeys = (JSONArray)metaDataObjects.get(k).opt("edgeKeys");
    						for(int m = 0; m < otherVertexKeys.length(); m++) {
    							if(((JSONObject)otherVertexKeys.get(m)).getString("name").equals(currentVertexKeyName)) {
    								JSONArray otherVertexKeyLabels = (JSONArray)((JSONObject)otherVertexKeys.get(m)).get("labels");
    								for(int n = 0; n < otherVertexKeyLabels.length(); n++) {
    									boolean labelExists = false;
    									for(int p = 0; p < vertexKeyLabels.length(); p++) {
    										if(vertexKeyLabels.getString(p).equals(otherVertexKeyLabels.getString(n))) {
    											labelExists = true;
    										}
    									}
    									if(!labelExists) {
    										vertexKeyLabels.put(otherVertexKeyLabels.getString(n));
    									}
    								}	
    							}
    						}
    					}
    					((JSONArray)combined.get("edgeKeys")).put(vertexKey);
    				}
    			}
    		}
	
    	}
    	
    	return combined;
    }
    
    /**
     * Recomputes meta data of the given graph
     * @param graphIdentifier - the graph of which the meta data recomputation is needed
     * @return The JsonObject specifying the graph meta data
     */
    public static JSONObject updateGraphMetaData(String graphIdentifier, ServletContext contx) throws IOException {
    	
    	JSONObject jsonObject = null;
    	
    	jsonObject = computeKeysAndLabelsHelper(graphIdentifier, contx, jsonObject);
        
        graphMetaData.put(graphIdentifier, jsonObject);
        
        return jsonObject;
    }
    
    /**
     * Compute property keys and labels.
     *
     * @param graphIdentifier name of the database
     * @return JSONObject containing property keys and labels
     */
    private static JSONObject computeKeysAndLabels(String graphIdentifier, ServletContext contx) throws IOException {
        JSONObject jsonObject = null;
        try {
            jsonObject = readKeysAndLabels(graphIdentifier, contx);
        } catch (IOException | JSONException e) {
            e.printStackTrace();
        }
        if (jsonObject != null) {
            LOGGER.info("Using data read from JSON.");
            return jsonObject;
        }

        // if no jsonObject data is available it is going to be calculated
        jsonObject = computeKeysAndLabelsHelper(graphIdentifier, contx, jsonObject);
        
        return jsonObject;
    }

    /**
     * Helper class that performs calculation of metadata for the given graph. 
     * Does not perform check for existence of metadata. 
     * @param graphIdentifier name of the database
     * @param jsonObject containing property keys and labels (metadata)
     * @return jsonObject containing property keys and labels (metadata)
     */
    private static JSONObject computeKeysAndLabelsHelper(
    		String graphIdentifier, 
    		ServletContext contx,
    		JSONObject jsonObject
    		) throws IOException{
    	
        String path = GraphHelper.getGraphPath(graphIdentifier,contx);

        JSONDataSource source = new JSONDataSource(path, ServiceHelper.getConfig());
        LogicalGraph graph = source.getLogicalGraph();

        jsonObject = new JSONObject();

        //compute the vertex and edge property keys and return them
        try {
            jsonObject.put("vertexKeys", getVertexKeys(graph));
            jsonObject.put("edgeKeys", getEdgeKeys(graph));
            jsonObject.put("vertexLabels", getVertexLabels(graph));
            jsonObject.put("edgeLabels", getEdgeLabels(graph));

            writeNewMetaData(graphIdentifier, jsonObject,contx);
            return jsonObject;
        } catch (Exception e) {
            e.printStackTrace();
            // if any exception is thrown, return an error to the client
            return null;
        }
    }
    
    /**
     * Read the property keys and labels from the buffered JSON.
     *
     * @param graphIdentifier name of the database
     * @return JSONObject containing the property keys and labels or null.
     * @throws IOException   if reading fails
     * @throws JSONException if JSON creation fails
     */
    private static JSONObject readKeysAndLabels(String graphIdentifier, ServletContext contx) throws IOException, JSONException {
        FileSystem fs = ServiceHelper.getFileSystem();
        String inPath = GraphHelper.getGraphPath(graphIdentifier, contx) + metaDataPath;
        LOGGER.log(Level.INFO, "Reading from {0}", inPath);
        Path path = new Path(inPath);
        if (!fs.exists(path)) {
            return null;
        }
        StringWriter stringWriter = new StringWriter();
        try (FSDataInputStream inputStream = fs.open(path)) {
            IOUtils.copy(inputStream, stringWriter);
        }
        String jsonData = stringWriter.toString();
        return jsonData.isEmpty() ? null : new JSONObject(jsonData);
    }

    /**
     * Takes any given graph and creates a JSONArray containing the vertex property keys and a
     * boolean,
     * specifying it the property has a numerical type.
     *
     * @param graph input graph
     * @return JSON array with property keys and boolean, that is true if the property type is
     * numercial
     * @throws Exception if the collecting of the distributed data fails
     */
    private static JSONArray getVertexKeys(LogicalGraph graph) throws Exception {

        List<Tuple3<Set<String>, String, Boolean>> vertexKeys = graph.getVertices()
                .flatMap(new PropertyKeyMapper<>())
                .groupBy(1)
                .reduceGroup(new LabelGroupReducer())
                .collect();

        return buildArrayFromKeys(vertexKeys);
    }

    /**
     * Takes any given graph and creates a JSONArray containing the edge property keys and a boolean,
     * specifying it the property has a numerical type.
     *
     * @param graph input graph
     * @return JSON array with property keys and boolean, that is true if the property type is
     * numercial
     * @throws Exception if the collecting of the distributed data fails
     */
    private static JSONArray getEdgeKeys(LogicalGraph graph) throws Exception {

        List<Tuple3<Set<String>, String, Boolean>> edgeKeys = graph.getEdges()
                .flatMap(new PropertyKeyMapper<>())
                .groupBy(1)
                .reduceGroup(new LabelGroupReducer())
                .collect();

        return buildArrayFromKeys(edgeKeys);
    }

    /**
     * Convenience method.
     * Takes a set of tuples of property keys and booleans, specifying if the property is numerical,
     * and creates a JSON array containing the same data.
     *
     * @param keys set of tuples of property keys and booleans, that are true if the property type
     *             is numerical
     * @return JSONArray containing the same data as the input
     * @throws JSONException if the construction of the JSON fails
     */
    private static JSONArray buildArrayFromKeys(List<Tuple3<Set<String>, String, Boolean>> keys)
            throws JSONException {
        JSONArray keyArray = new JSONArray();
        for (Tuple3<Set<String>, String, Boolean> key : keys) {
            JSONObject keyObject = new JSONObject();
            JSONArray labels = new JSONArray();
            key.f0.forEach(labels::put);
            keyObject.put("labels", labels);
            keyObject.put("name", key.f1);
            keyObject.put("numerical", key.f2);
            keyArray.put(keyObject);
        }
        return keyArray;
    }

    /**
     * Compute the labels of the vertices.
     *
     * @param graph logical graph
     * @return JSONArray containing the vertex labels
     * @throws Exception if the computation fails
     */
    private static JSONArray getVertexLabels(LogicalGraph graph) throws Exception {
        List<Set<String>> vertexLabels = graph.getVertices()
                .map(new LabelMapper<>())
                .reduce(new LabelReducer())
                .collect();

        if (vertexLabels.size() > 0) {
            return buildArrayFromLabels(vertexLabels.get(0));
        } else {
            return new JSONArray();
        }
    }

    /**
     * Compute the labels of the edges.
     *
     * @param graph logical graph
     * @return JSONArray containing the edge labels
     * @throws Exception if the computation fails
     */
    private static JSONArray getEdgeLabels(LogicalGraph graph) throws Exception {
        List<Set<String>> edgeLabels = graph.getEdges()
                .map(new LabelMapper<>())
                .reduce(new LabelReducer())
                .collect();

        if (edgeLabels.size() > 0) {
            return buildArrayFromLabels(edgeLabels.get(0));
        } else {
            return new JSONArray();
        }
    }

    /**
     * Create a JSON array from the sets of labels.
     *
     * @param labels set of labels
     * @return JSON array of labels
     */
    private static JSONArray buildArrayFromLabels(Set<String> labels) {
        JSONArray labelArray = new JSONArray();
        labels.forEach(labelArray::put);
        return labelArray;
    }

    /**
     * Write graph metadata.
     * Data will be overwritten, if it already exists.
     *
     * @param graphIdentifier Identifier of the graph.
     * @param data            The metadata, as JSON.
     */
    private static void writeMetaData(String graphIdentifier, JSONObject data, ServletContext contx) throws Exception {
        String outPath = GraphHelper.getGraphPath(graphIdentifier, contx) + metaDataPath;
        FileSystem fs = ServiceHelper.getFileSystem();
        Path path = new Path(outPath);
        LOGGER.log(Level.INFO, "Writing to {0}.", outPath);
        if (!ServiceHelper.isLocalMode()) {
            fs.setPermission(path, ClusterHelper.getPermissions());
        }
        try (FSDataOutputStream outputStream = fs.create(path, true)) {
            Writer writer = data.write(new OutputStreamWriter(outputStream));
            writer.flush();
        }
    }
    
    private static void writeNewMetaData(String graphIdentifier, JSONObject data, ServletContext contx) throws Exception {
        String outPath = GraphHelper.getGraphPath(graphIdentifier, contx) + metaDataPath;
        FileSystem fs = ServiceHelper.getFileSystem();
        Path path = new Path(outPath);
        LOGGER.log(Level.INFO, "Writing to {0}.", outPath);
        if (!ServiceHelper.isLocalMode()) {
            fs.setPermission(path, ClusterHelper.getPermissions());
        }        
        
        
        if(ServiceHelper.isLocalMode()) {
        	FileOutputStream fos = new FileOutputStream(path.toString());
			fos.write(data.toString().getBytes());
			fos.close();
        }
        else {
            try (FSDataOutputStream outputStream = fs.create(path, true)) {
                Writer writer = data.write(new OutputStreamWriter(outputStream));
                writer.flush();
            }
        }

    }

    /**
     * Read context from the buffered JSON.
     *
     * @param filename name of json file
     * @return JSONObject containing the property keys and labels or null.
     * @throws IOException   if reading fails
     * @throws JSONException if JSON creation fails
     */
    public static JSONObject readJSONFile(String path2file, String filename) throws IOException, JSONException {
        FileSystem fs = ServiceHelper.getFileSystem();
        String inPath = path2file+"/" +filename +".json";
        //LOGGER.log(Level.INFO, "Reading from {0}", inPath);
        Path path = new Path(inPath);
        if (fs.exists(path)) {
            StringWriter stringWriter = new StringWriter();
            try (FSDataInputStream inputStream = fs.open(path)) {
                IOUtils.copy(inputStream, stringWriter);
            }
            String jsonData = stringWriter.toString();
            return jsonData.isEmpty() ? null : new JSONObject(jsonData);
        }
        return null;
    }
	
	
    public static JSONObject readWorkflowFile(String workflow, ServletContext contx) throws IOException, JSONException {
        FileSystem fs = ServiceHelper.getFileSystem();
        String inPath = GraphHelper.getWorkflowPath(contx) + workflow + ".json";
        //LOGGER.log(Level.INFO, "Reading from {0}", inPath);
        Path path = new Path(inPath);
        if (fs.exists(path)) {
            StringWriter stringWriter = new StringWriter();
            try (FSDataInputStream inputStream = fs.open(path)) {
                IOUtils.copy(inputStream, stringWriter);
            }
            String jsonData = stringWriter.toString();
            return jsonData.isEmpty() ? null : new JSONObject(jsonData);
        }
        return null;
    }
}
