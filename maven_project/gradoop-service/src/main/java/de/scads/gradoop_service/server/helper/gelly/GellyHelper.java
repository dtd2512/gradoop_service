package de.scads.gradoop_service.server.helper.gelly;


import de.scads.gradoop_service.server.helper.ServiceHelper;
import de.scads.gradoop_service.server.helper.gelly.io.PageRankVertexJoin;
import de.scads.gradoop_service.server.helper.gelly.io.WccVertexJoin;
import org.apache.flink.api.java.DataSet;
import org.apache.flink.graph.Graph;
import org.apache.flink.graph.library.ConnectedComponents;
import org.apache.flink.graph.library.link_analysis.PageRank;
import org.apache.flink.types.NullValue;
import org.gradoop.common.model.impl.id.GradoopId;
import org.gradoop.common.model.impl.pojo.Vertex;
import org.gradoop.common.model.impl.properties.PropertyValue;
import org.gradoop.flink.algorithms.gelly.functions.EdgeToGellyEdgeWithNullValue;
import org.gradoop.flink.algorithms.gelly.functions.VertexToGellyVertexWithPropertyValue;
import org.gradoop.flink.model.api.epgm.LogicalGraph;
import org.gradoop.flink.model.impl.functions.epgm.Id;

/**
 * This class provides access to gelly algorithms.
 */
public class GellyHelper {
    private static final String CC_PROP_KEY = "ccId";
    private static final String PR_PROP_KEY = "pagerank";

    /**
     * A method which transforms the {@link LogicalGraph} in a Gelly {@link Graph} to calculate weakly connected components.
     *
     * @param graph - the graph on which the connected components are calculated
     * @return a graph where each vertex has the additional attribute "ccId" which
     */
    public static LogicalGraph calculateConnectedComponents(LogicalGraph graph) throws Exception {
        Graph<GradoopId, GradoopId, NullValue> gGraph = transform(graph);

        DataSet<org.apache.flink.graph.Vertex<GradoopId, GradoopId>> wccRes = gGraph.run(new ConnectedComponents<>(Integer.MAX_VALUE));

        DataSet<Vertex> wccVertices = wccRes
                .join(graph.getVertices())
                .where(0).equalTo(new Id<>())
                .with(new WccVertexJoin(CC_PROP_KEY));

        return graph.getConfig()
                .getLogicalGraphFactory()
                .fromDataSets(wccVertices, graph.getEdges());
    }

    /**
     * A method which transforms the {@link LogicalGraph} in a Gelly {@link Graph} to calculate weakly connected components.
     *
     * @param graph         - the graph on which the connected components are calculated
     * @param dampingFactor - the damping factor (e.g. 0.85)
     * @return a graph where each vertex has the additional attribute "ccId" which
     */
    public static LogicalGraph calculatePageRank(LogicalGraph graph, double dampingFactor, int iterations) throws Exception {
        Graph<GradoopId, PropertyValue, NullValue> gGraph = transform(graph, PR_PROP_KEY);

        DataSet<Vertex> pageRankVertices = new PageRank<GradoopId, PropertyValue, NullValue>(dampingFactor, iterations)
                .run(gGraph)
                .join(graph.getVertices())
                .where(0).equalTo(new Id<>())
                .with(new PageRankVertexJoin(PR_PROP_KEY));

        return graph.getConfig()
                .getLogicalGraphFactory()
                .fromDataSets(pageRankVertices, graph.getEdges());
    }


    private static Graph<GradoopId, PropertyValue, NullValue> transform(LogicalGraph graph, String propertyKey) {
        return Graph.fromDataSet(
                graph.getVertices().map(new VertexToGellyVertexWithPropertyValue(propertyKey)),
                graph.getEdges().map(new EdgeToGellyEdgeWithNullValue()),
                ServiceHelper.getConfig().getExecutionEnvironment());
    }

    private static Graph<GradoopId, GradoopId, NullValue> transform(LogicalGraph graph) {
        return Graph.fromDataSet(
                graph.getVertices().map(new de.scads.gradoop_service.server.helper.gelly.io.VertexToGellyVertexMapper()),
                graph.getEdges().map(new de.scads.gradoop_service.server.helper.gelly.io.EdgeToGellyEdgeMapper()),
                ServiceHelper.getConfig().getExecutionEnvironment());
    }

}