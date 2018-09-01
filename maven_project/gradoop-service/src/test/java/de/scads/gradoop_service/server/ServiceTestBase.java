package de.scads.gradoop_service.server;

import de.scads.gradoop_service.server.helper.ServiceHelper;
import org.apache.log4j.Level;
import org.apache.log4j.Logger;
import org.gradoop.flink.io.impl.json.JSONDataSource;
import org.gradoop.flink.model.api.epgm.LogicalGraph;
import org.junit.Before;

public class ServiceTestBase {
    static Logger logger = Logger.getLogger(ServiceTestBase.class);

    LogicalGraph graph;

    @Before
    public void init() {
        logger.setLevel(Level.INFO);
        ServiceHelper.setLocalExecution();
        String file = ServiceTestBase.class.getResource("/data/testdata/").getFile();

        JSONDataSource source = new JSONDataSource(file, ServiceHelper.getConfig());
        graph = source.getLogicalGraph();
    }
}
