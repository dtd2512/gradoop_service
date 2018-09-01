package de.scads.gradoop_service.server;

import de.scads.gradoop_service.server.helper.ServiceHelper;
import org.apache.log4j.Level;
import org.apache.log4j.Logger;
import org.gradoop.flink.io.impl.json.JSONDataSource;
import org.gradoop.flink.model.api.epgm.LogicalGraph;
import org.junit.Before;
import org.junit.Test;

public class GradoopToGellyGraphTest {
    private static Logger logger = Logger.getLogger(GradoopToGellyGraphTest.class);

    @Before
    public void init() {
        logger.setLevel(Level.INFO);
        ServiceHelper.setLocalExecution();
    }

    @Test
    public void transformTest() throws Exception {
        String file = GroupingTest.class.getResource("/data/testdata/").getFile();

        JSONDataSource source = new JSONDataSource(file, ServiceHelper.getConfig());
        LogicalGraph graph = source.getLogicalGraph();


//        GradoopToGellyGraph<Double, Double> test = new GradoopToGellyGraph<>(Double.class, Double.class);
//        Graph<GradoopId, Double, Double> transformedGraph = test.transform(graph);
//        transformedGraph.getEdges().print();
    }
}
