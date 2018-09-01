package de.scads.gradoop_service.server;

import de.scads.gradoop_service.server.helper.ServiceHelper;
import de.scads.gradoop_service.server.helper.gelly.GellyHelper;
import org.apache.log4j.Level;
import org.apache.log4j.Logger;
import org.gradoop.flink.io.impl.json.JSONDataSource;
import org.gradoop.flink.model.api.epgm.LogicalGraph;
import org.junit.Before;
import org.junit.Test;

public class GellyHelperTest {
    private static Logger logger = Logger.getLogger(GradoopToGellyGraphTest.class);

    @Before
    public void init() {
        logger.setLevel(Level.INFO);
        ServiceHelper.setLocalExecution();
    }

    @Test
    public void ccTest() throws Exception {
        String file = GroupingTest.class.getResource("/data/testdata/").getFile();

        JSONDataSource source = new JSONDataSource(file, ServiceHelper.getConfig());
        LogicalGraph graph = source.getLogicalGraph();

        GellyHelper.calculateConnectedComponents(graph);
    }
}
