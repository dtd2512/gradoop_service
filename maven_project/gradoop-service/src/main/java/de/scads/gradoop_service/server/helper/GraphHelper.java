package de.scads.gradoop_service.server.helper;

import java.io.File;
import java.io.IOException;
import java.net.URISyntaxException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import javax.servlet.ServletContext;

import org.apache.commons.io.FileUtils;
import org.apache.flink.api.java.io.LocalCollectionOutputFormat;
import org.apache.hadoop.fs.Path;
import org.codehaus.jettison.json.JSONArray;
import org.codehaus.jettison.json.JSONException;
import org.gradoop.common.model.impl.pojo.Edge;
import org.gradoop.common.model.impl.pojo.GraphHead;
import org.gradoop.common.model.impl.pojo.Vertex;
import org.gradoop.flink.io.impl.json.JSONDataSource;
import org.gradoop.flink.model.api.epgm.LogicalGraph;

import java.util.logging.Level;
import java.util.logging.Logger;


/**
 * A simple helper class for making graph handling easier.
 */
public class GraphHelper {
    public final static String PATH_TO_DATA = "data/";
	public final static String PATH_TO_WORKFLOW = "workflows/";
    public final static String PATH_TO_COLORS = "colors/";


    public static String getDataPath(ServletContext contx) {
        if (contx != null) {
            return contx.getRealPath("/" + PATH_TO_DATA);
        } else
            return "src/main/webapp/" + PATH_TO_DATA;
    }

    public static String getColorPath(ServletContext contx) {
        if (contx != null) {
            return contx.getRealPath("/" + PATH_TO_COLORS);
        } else
            return "src/main/webapp/" + PATH_TO_COLORS;
    }

	public static String getWorkflowPath(ServletContext contx) {
        if (contx != null) {
            return contx.getRealPath("/" + PATH_TO_WORKFLOW);
        } else
            return "src/main/webapp/" + PATH_TO_WORKFLOW;
    }
	
    public static String getGraphPath(String graphIdentifier, ServletContext contx) {
        if (ServiceHelper.isLocalMode()) {
            return getDataPath(contx) + Path.SEPARATOR + graphIdentifier;
        } else {
            return ClusterHelper.getHdfsUri() + ClusterHelper.getGraphLocation() + graphIdentifier;
        }
    }


    /**
     * @return s an array of existing graphs
     */
    public static String[] getExistingGraphs(ServletContext contx) throws IOException, URISyntaxException {
        String[] databases;
        // get all subfolders of "/data/", they are considered as databases
        if (ServiceHelper.isLocalMode()) {
            File dataFolder = new File(getDataPath(contx));
            databases = dataFolder.list((current, name) -> new File(current, name).isDirectory());
        } else {
            System.out.println("Get graphs...");
            List<String> graphs = ClusterHelper.listGraphs();
            databases = graphs.toArray(new String[graphs.size()]);
        }
        return databases;
    }

    /**
     * @return s an array of existing workflows
     */
    public static JSONArray getExistingWorkflows(ServletContext contx) throws IOException, URISyntaxException {
        String[] fileNames;
        if (ServiceHelper.isLocalMode()) {
            File workflowsFolder = new File(getWorkflowPath(contx));
            fileNames = workflowsFolder.list((current, name) -> new File(current, name).isFile());
        }
        else {
            // TDB for cluster environment
        	fileNames = new String[0];
        }
        Arrays.sort(fileNames);
        
        JSONArray  workflows = new JSONArray();
        for (String fileName: fileNames) {
        	// skipping .json.crc files
        	if(fileName.endsWith(".json")) {
        		workflows.put(fileName.substring(0, fileName.length() - 5));
        	}
        }
        
        return workflows;
    }

    /**
     * @return belonging path as string
     */
    public static String getPath(String type, ServletContext contx){
        if (type.equals("colors")){
            return getColorPath(contx);
        }
        else if (type.equals("workflows")){
            return getWorkflowPath(contx);
        }
        else if (type.equals("graph")){
            return getDataPath(contx);
        }
        else{
            return null;
        }
    }

    /**
     * @return an array of existing data file names
     */
    public static JSONArray getExistingFileNames(String path) throws IOException, URISyntaxException {
        //Logger LOGGER = Logger.getLogger(GraphHelper.class.getName());
        //LOGGER.log(Level.INFO, " current path {0}", path);
        String[] fileNames;
        if (ServiceHelper.isLocalMode()) {
            File currentFolder = new File(path);
            fileNames = currentFolder.list((current, name) -> new File(current, name).isFile());
        }
        else {
            // TDB for cluster environment
            fileNames = new String[0];
        }
        Arrays.sort(fileNames);

        JSONArray  fileNameArray = new JSONArray();
        for (String fileName: fileNames) {
            // skipping .json.crc files
            if(fileName.endsWith(".json")) {
                fileNameArray.put(fileName.substring(0, fileName.length() - 5));
            }
        }

        return fileNameArray;
    }
    
    /**
     * Returns a {@link LogicalGraph} by its identifier
     *
     * @param identifier - the name of the graph to be read
     * @return the loaded {@link LogicalGraph}
     */
    public static LogicalGraph getGraph(String identifier, ServletContext contx) {

        String path = getGraphPath(identifier, contx);
        JSONDataSource dataSource = new JSONDataSource(
                path + "/graphs.json",
                path + "/vertices.json",
                path + "/edges.json",
                ServiceHelper.getConfig());

        return dataSource.getLogicalGraph();
    }

    /**
     * Checks if the graph exists and return corresponding boolean value
     * 
     * @param identifier graph identifier
     * @return true if graph exists and false otherwise
     */
    public static boolean graphExists(String identifier, ServletContext contx) {

        String path = getGraphPath(identifier, contx);

        if(Files.exists(Paths.get(path))) {
        	return true;
        }
        return false;
    }

    public static boolean renameGraph(String oldIdentifier, String newIdentifier, ServletContext contx) {

        String oldPath = getGraphPath(oldIdentifier, contx);
        String newPath = getGraphPath(newIdentifier, contx);
        
        File oldDir = new File(oldPath);
        File newDir = new File(newPath);
        
        try{
        	oldDir.renameTo(newDir);
        	return true;
        }
        catch(Exception e) {
        	return false;
        }
    }
    
    /**
     * Transform a {@link LogicalGraph} into a cytoscape readable json format.
     *
     * @param graph - the logical graph to be transformed
     * @return cytoscape readable json
     * @throws JSONException - happens if json can't be build properly
     */
    public static String getCytoJsonGraph(LogicalGraph graph) throws Exception {
        // specify the output collections
        List<GraphHead> resultHead = new ArrayList<>();
        List<Vertex> resultVertices = new ArrayList<>();
        List<Edge> resultEdges = new ArrayList<>();

        graph.getGraphHead().output(new LocalCollectionOutputFormat<>(resultHead));
        graph.getVertices().output(new LocalCollectionOutputFormat<>(resultVertices));
        graph.getEdges().output(new LocalCollectionOutputFormat<>(resultEdges));

        // execute the plan
        ServiceHelper.getConfig().getExecutionEnvironment().execute();

        return CytoJSONBuilder.getJSON(resultHead.get(0), resultVertices, resultEdges);
    }

    /**
     * Checks whether the identifier already exists and stores the graph if not.
     *
     * @param graph      - the {@link LogicalGraph} to be stored as JSON file
     * @param identifier - the name which should be used for the graph
     * @param force TODO
     * @return false if the folder/file already exists
     * @throws IOException - if writing the graph was not possible
     */
    public static boolean storeGraph(LogicalGraph graph, String identifier, ServletContext contx, boolean force) throws IOException {
        String path = GraphHelper.getGraphPath(identifier, contx);
        File dir = new File(path);
        
        if (dir.exists() && !force) {
            return false;
        }
        
        if(dir.exists() && force) {
        	FileUtils.cleanDirectory(dir);
        }

        GraphIoUtils.writeJson(graph, path, ServiceHelper.getConfig());
        return true;
    }
    
    public static void deleteGraph(String identifier, ServletContext contx) throws IOException {
        String path = GraphHelper.getGraphPath(identifier, contx);    	
    	FileUtils.deleteDirectory(new File(path));
    }
    
    public static void deleteGraph(String oldIdentifier, String newIdentifier, ServletContext contx) {
        String oldPath = GraphHelper.getGraphPath(oldIdentifier, contx);     	
        String newPath = GraphHelper.getGraphPath(newIdentifier, contx);
        File oldDirectory = new File(oldPath);
        File newDirectory = new File(newPath);
        oldDirectory.renameTo(newDirectory);        
    }
}