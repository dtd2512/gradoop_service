package de.scads.gradoop_service.server.helper.input.jira;

import java.io.File;
import java.util.Map;
import org.apache.commons.io.FileUtils;
import org.apache.flink.api.java.DataSet;
import org.apache.flink.api.java.ExecutionEnvironment;
import org.gradoop.flink.io.api.DataSink;
import org.gradoop.flink.io.api.DataSource;
import org.gradoop.flink.io.impl.graph.GraphDataSource;
import org.gradoop.flink.io.impl.graph.tuples.ImportEdge;
import org.gradoop.flink.io.impl.graph.tuples.ImportVertex;
import org.gradoop.flink.io.impl.json.JSONDataSink;
import org.gradoop.flink.model.api.epgm.LogicalGraph;
import org.gradoop.flink.util.GradoopFlinkConfig;

/**
 *
 * @author John Nguyen
 * adapted from DBLP TO GRADOOP (https://github.com/ScaDS/dblp-to-gradoop)
 */
public class GraphCreationHelper {
    public static void writeGraph(Map<String, ImportVertex> vertices, Map<String, ImportEdge> edges,
                                  String path) throws Exception {
        // translate to flink datastructures
        final ExecutionEnvironment env = ExecutionEnvironment.getExecutionEnvironment();
        env.setParallelism(1);
        // create default Gradoop config
        GradoopFlinkConfig config = GradoopFlinkConfig.createConfig(env);
        
        System.out.println("Vertices: " + vertices.size());
        System.out.println("Edges   : " + edges.size());
        System.out.println("Vertice Value: "+vertices.values());
        System.out.println("Edges Value: "+edges.values());
        DataSet<ImportVertex> v = env.fromCollection(vertices.values());
        DataSet<ImportEdge> e = env.fromCollection(edges.values());

        DataSource gds = new GraphDataSource(v, e, config);
        System.out.println("DataSource GetGraphtransactio: "+gds.getLogicalGraph().getEdges());
        System.out.println("Datasource getGraphCollectionHead: "+gds.getGraphCollection().getGraphHeads());
        // read logical graph
        LogicalGraph logicalGraph = gds.getLogicalGraph();
        DataSink ds = new JSONDataSink(path, config);
        ds.write(logicalGraph, true);
        
        env.execute();
    }
}
