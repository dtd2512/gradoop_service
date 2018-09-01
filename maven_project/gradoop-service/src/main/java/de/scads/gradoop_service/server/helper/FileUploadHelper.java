package de.scads.gradoop_service.server.helper;

import org.apache.hadoop.fs.FileSystem;
import org.apache.hadoop.fs.Path;
import org.apache.hadoop.io.IOUtils;
import org.apache.log4j.Logger;

import javax.servlet.ServletContext;
import java.io.*;

public class FileUploadHelper {
    /**
     * Utility method to save a graph file to the file system.
     *
     * @param inStream InputStream to be saved.
     * @param graph    The graph identifier.
     * @param type     The type of the file (vertices, edges, ...).
     * @param fileName The name of the actual file.
     * @return The absolute target Path.
     * @throws IOException when writing to the file system fails.
     */
    public static String saveToFile(final InputStream inStream, final String graph, final String type, final String fileName, final ServletContext contx) throws IOException {
        final FileSystem fs = ServiceHelper.getFileSystem();
        final String target = GraphHelper.getGraphPath(graph, contx) + File.separator + type + ".json" + File.separator + fileName;
        final Path targetPath = new Path(target);
        if (!ServiceHelper.isLocalMode()) {
            fs.setPermission(targetPath, ClusterHelper.getPermissions());
        }
        final OutputStream outputStream = fs.create(targetPath, true);
        IOUtils.copyBytes(inStream, outputStream, 4096, true);
        return target;
    }

	public static String saveWorkflowToFile(final String workflowName, final String workflowConfig, final ServletContext contx) throws IOException {
        final FileSystem fs = ServiceHelper.getFileSystem();
        InputStream inStream = new ByteArrayInputStream(workflowConfig.getBytes());
        final String target = GraphHelper.getWorkflowPath(contx) + File.separator + workflowName + ".json";
        final Path targetPath = new Path(target);
        if (!ServiceHelper.isLocalMode()) {
            fs.setPermission(targetPath, ClusterHelper.getPermissions());
        }
        final OutputStream outputStream = fs.create(targetPath, true);
        IOUtils.copyBytes(inStream, outputStream, 4096, true);
        return target;
    }
	
    /**
     * Creates a folder to store the graph in (if it does not exist).
     *
     * @param graphIdentifier  The graph identifier.
     * @param graphElementType The type of the file (vertices, edges, ...).
     * @throws IOException When accessing the file system fails.
     */
    public static void createFolderIfNotExists(final String graphIdentifier, final String graphElementType, final ServletContext contx) throws IOException {
        final String dirName = GraphHelper.getGraphPath(graphIdentifier, contx) + File.separator + graphElementType + ".json";
        final Path directory = new Path(dirName);
        final FileSystem fs = ServiceHelper.getFileSystem();
        if (!fs.exists(directory)) {
            fs.mkdirs(directory);
            if (!ServiceHelper.isLocalMode()) {
                fs.setPermission(directory, ClusterHelper.getPermissions());
            }
        }
    }

    /**
     * Utility method to save config-data (e.g. vertex colors) in current graph folder
     *
     * @param data     data to be saved.
     * @param graph    The graph identifier.
     * @param fileName name of json-file
     * @param contx    ServletContext
     * @return The absolute target Path.
     * @throws IOException when writing to the file system fails.
     */
    public static String saveToJSON(final String data, final String graph, final String fileName, final ServletContext contx) throws IOException {
        final FileSystem fs = ServiceHelper.getFileSystem();
        final String target = GraphHelper.getGraphPath(graph, contx) + File.separator + fileName + ".json";
        final Path targetPath = new Path(target);
        if (!ServiceHelper.isLocalMode()) {
            fs.setPermission(targetPath, ClusterHelper.getPermissions());
        }
        final File toWrite = new File(target);
        toWrite.createNewFile();
        try (FileWriter dataWriter = new FileWriter(toWrite)) {
            dataWriter.write(data);
        }
        return target;
    }
    public static String saveColorsToFile(final String data, final String fileName, final ServletContext contx) throws IOException {
        final FileSystem fs = ServiceHelper.getFileSystem();

        final String target = GraphHelper.getColorPath(contx) + File.separator + fileName + ".json";
        final Path targetPath = new Path(target);
        if (!ServiceHelper.isLocalMode()) {
            fs.setPermission(targetPath, ClusterHelper.getPermissions());
        }
        final File toWrite = new File(target);
        toWrite.createNewFile();
        try (FileWriter dataWriter = new FileWriter(toWrite)) {
            dataWriter.write(data);
        }
        return target;
    }

}
