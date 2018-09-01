package de.scads.gradoop_service.server;

import de.scads.gradoop_service.server.helper.ClusterHelper;
import de.scads.gradoop_service.server.helper.FileUploadHelper;
import org.apache.hadoop.conf.Configuration;
import org.apache.hadoop.fs.FileSystem;
import org.apache.hadoop.fs.Path;
import org.apache.hadoop.fs.permission.FsAction;
import org.apache.hadoop.fs.permission.FsPermission;
import org.junit.Ignore;
import org.junit.Test;

import java.io.*;
import java.net.URI;
import java.net.URISyntaxException;

public class ClusterConnectionTest {

    @Test
    @Ignore
    public void connectionTest() throws IOException, URISyntaxException {

        System.out.println(ClusterHelper.getHdfsUri());
        System.out.println(ClusterHelper.listGraphs());

        Configuration configuration = new Configuration();
        FileSystem hdfs = FileSystem.get(new URI(ClusterHelper.getHdfsUri()), configuration);

        String dirName = ClusterHelper.getHdfsUri() + ClusterHelper.getGraphLocation()
                + "testGraph" + File.separator + "vertex";

        System.out.println("Create remote folder at: " + dirName);

        Path file = new Path(dirName);
        if(!hdfs.exists(file)) {
            hdfs.mkdirs(file, new FsPermission(FsAction.READ_WRITE, FsAction.READ_WRITE, FsAction.READ_WRITE));
        }
    }

    @Test
    @Ignore
    public void writeToCluster() throws IOException, URISyntaxException {
        String graphIdent = "testdata";

        Configuration conf = new Configuration();
        FileSystem hdfs = FileSystem.get(new URI(ClusterHelper.getHdfsUri()), conf);

        hdfs.delete(new Path(ClusterHelper.getHdfsUri() + ClusterHelper.getGraphLocation() + graphIdent), true);

        InputStream inHeads = new BufferedInputStream(new FileInputStream(ServiceTestBase.class.getResource("/data/testdata/graphs.json").getFile()));
        InputStream inVertices = new BufferedInputStream(new FileInputStream(ServiceTestBase.class.getResource("/data/testdata/vertices.json").getFile()));
        InputStream inEdges = new BufferedInputStream(new FileInputStream(ServiceTestBase.class.getResource("/data/testdata/edges.json").getFile()));

        FileUploadHelper.createFolderIfNotExists(graphIdent, "graphs", null);
        FileUploadHelper.saveToFile(inHeads, graphIdent, "graphs", "1", null);

        FileUploadHelper.createFolderIfNotExists(graphIdent, "vertices", null);
        FileUploadHelper.saveToFile(inVertices, graphIdent, "vertices", "1", null);

        FileUploadHelper.createFolderIfNotExists(graphIdent, "edges", null);
        FileUploadHelper.saveToFile(inEdges, graphIdent, "edges", "1", null);

    }
}
