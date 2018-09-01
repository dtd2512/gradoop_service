package de.scads.gradoop_service.server.helper;

import org.apache.flink.api.java.ExecutionEnvironment;
import org.apache.hadoop.conf.Configuration;
import org.apache.hadoop.fs.FileSystem;
import org.gradoop.flink.util.GradoopFlinkConfig;

import java.io.IOException;
import java.net.URI;
import java.net.URISyntaxException;

/**
 * This helper returns helps with configuration of the service-backend communication.
 */
public class ServiceHelper {
    private static ExecutionEnvironment env = null;
    private static FileSystem fileSystem;
    private static GradoopFlinkConfig config = null;

    private static boolean localMode = false;


    /**
     * @return a predefined {@link ExecutionEnvironment} for flink
     */
    private static ExecutionEnvironment getExecutionEnvironment() {
        if(env == null) {
            if(ServiceHelper.isLocalMode()) {
                env = ExecutionEnvironment.getExecutionEnvironment();
            } else {
                env = ExecutionEnvironment.createRemoteEnvironment(ClusterHelper.getFlinkUri(), ClusterHelper.getFlinkPort());
            }
        }
        return env;
    }

    /**
     * @return the {@link GradoopFlinkConfig} based on the {@link ExecutionEnvironment}
     */
    public static GradoopFlinkConfig getConfig() {
        if(config == null) {
            config = GradoopFlinkConfig.createConfig(getExecutionEnvironment());
        }
        return config;
    }

    /**
     * Get the {@link FileSystem} of the backend.
     * Returns a local fs if the server is running in local mode or the HDFS.
     *
     * @throws RuntimeException if accessing the file system failed.
     * @return The {@link FileSystem}.
     */
    public static FileSystem getFileSystem() {
        if (fileSystem == null) {
            if (isLocalMode()) {
                try {
                    fileSystem = FileSystem.getLocal(new Configuration());
                } catch (IOException e) {
                    throw new RuntimeException("Failed to access local filesystem.", e);
                }
            } else {
                try {
                    fileSystem = FileSystem.get(new URI(ClusterHelper.getHdfsUri()), new Configuration());
                } catch (IOException e) {
                    throw new RuntimeException("Failed to get HDFS.", e);
                } catch (URISyntaxException e) {
                    throw new RuntimeException("Invalid HDFS URI.", e);
                }
            }
        }
        return fileSystem;
    }

    /**
     * You can use this method to set your {@link ExecutionEnvironment} and {@link GradoopFlinkConfig} to be local one.
     * The method getExecutionEnvironment and getConfig will return appropriate configured content.
     */
    public static void setLocalExecution() {
        env = ExecutionEnvironment.createLocalEnvironment(4);
        config = GradoopFlinkConfig.createConfig(getExecutionEnvironment());
        localMode = true;
    }

    /**
     * @return true if local mode is set, false otherwise
     */
    public static boolean isLocalMode() {
    	
        return localMode;
    }
}
