package de.scads.gradoop_service.server.helper;

import org.apache.hadoop.conf.Configuration;
import org.apache.hadoop.fs.FileStatus;
import org.apache.hadoop.fs.FileSystem;
import org.apache.hadoop.fs.Path;
import org.apache.hadoop.fs.permission.FsAction;
import org.apache.hadoop.fs.permission.FsPermission;

import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.ArrayList;
import java.util.List;
import java.util.Properties;

public class ClusterHelper {
    private final static FsPermission permission = new FsPermission(FsAction.ALL, FsAction.ALL, FsAction.ALL);
    private final static String propertyFile = "hadoopAccessConfig.properties";
    private static String graphLocation = null;
    private static String hdfsUri = null;
    private static String flinkUri = null;
    private static int flinkPort = -1;

    private static void loadClusterConfig() {
        Properties prop = new Properties();
        InputStream input;

        try {
            input = ClusterHelper.class.getClassLoader().getResourceAsStream(propertyFile);
            if (input == null) {
                System.out.println("Sorry, unable to find " + propertyFile);
                return;
            }

            //load a properties file from class path, inside static method
            prop.load(input);

            hdfsUri = prop.getProperty("hdfs.uri");
            graphLocation = prop.getProperty("hdfs.graphstore");
            flinkUri = prop.getProperty("flink.host");
            flinkPort = Integer.parseInt(prop.getProperty("flink.port"));

        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    public static String getHdfsUri() {
        if (hdfsUri == null) {
            ClusterHelper.loadClusterConfig();
        }
        return hdfsUri;
    }

    public static String getGraphLocation() {
        return graphLocation;
    }

    public static FsPermission getPermissions() {
        return permission;
    }

    public static int getFlinkPort() {
        return flinkPort;
    }

    public static String getFlinkUri() {
        return flinkUri;
    }

    public static List<String> listGraphs() throws URISyntaxException, IOException {
        FileSystem fs = ServiceHelper.getFileSystem();
        FileStatus[] fileStatus = fs.listStatus(new Path(getHdfsUri() + getGraphLocation()));
        List<String> graphs = new ArrayList<>();
        for(FileStatus status : fileStatus){
            if(status.isDirectory()) {
                graphs.add(status.getPath().getName());
            }
            System.out.println(status.getPath().toString());
        }
        return graphs;
    }
}
