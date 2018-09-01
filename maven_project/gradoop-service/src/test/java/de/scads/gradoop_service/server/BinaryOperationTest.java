package de.scads.gradoop_service.server;

import de.scads.gradoop_service.server.helper.ServiceHelper;
import org.gradoop.flink.io.impl.json.JSONDataSource;
import org.gradoop.flink.model.api.epgm.LogicalGraph;
import org.junit.Before;
import org.junit.Test;

import static org.assertj.core.api.Assertions.assertThat;

public class BinaryOperationTest extends ServiceTestBase {
    private LogicalGraph sameGraph;

    @Before
    public void init() {
        super.init();
        String file = ServiceTestBase.class.getResource("/data/testdata/").getFile();

        JSONDataSource source = new JSONDataSource(file, ServiceHelper.getConfig());
        sameGraph = source.getLogicalGraph();
    }

    @Test
    public void exclusionTest() throws Exception {
        LogicalGraph exclude = graph.exclude(graph);
        assertThat(exclude.getVertices().count()).isEqualTo(0);
        assertThat(exclude.getEdges().count()).isEqualTo(0);

        LogicalGraph excludeSame = graph.exclude(sameGraph);
        assertThat(excludeSame.getVertices().count()).isEqualTo(0);
        assertThat(excludeSame.getEdges().count()).isEqualTo(0);
    }

    @Test
    public void overlapTest() throws Exception {
        LogicalGraph overlap = graph.overlap(graph);
        assertThat(overlap.getVertices().count()).isEqualTo(11);
        assertThat(overlap.getEdges().count()).isEqualTo(24);
        
        LogicalGraph overlapSame = graph.overlap(sameGraph);
        assertThat(overlapSame.getVertices().count()).isEqualTo(11);
        assertThat(overlapSame.getEdges().count()).isEqualTo(24);

        sameGraph.getVertices().print();
    }

}