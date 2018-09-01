package de.scads.gradoop_service.server.sampling;

import org.apache.flink.api.common.functions.JoinFunction;
import org.apache.flink.api.common.functions.MapFunction;
import org.apache.flink.api.java.DataSet;
import org.apache.flink.api.java.functions.KeySelector;
import org.apache.flink.graph.Graph;
import org.apache.flink.graph.Vertex;
import org.apache.flink.graph.library.link_analysis.PageRank;
import org.gradoop.common.model.impl.id.GradoopId;
import org.gradoop.common.model.impl.pojo.Edge;
import org.gradoop.flink.model.api.epgm.LogicalGraph;
import org.gradoop.flink.model.api.operators.UnaryGraphToGraphOperator;
import org.gradoop.flink.model.impl.functions.epgm.Id;
import org.gradoop.flink.model.impl.functions.epgm.SourceId;
import org.gradoop.flink.model.impl.functions.epgm.TargetId;
import org.gradoop.flink.model.impl.functions.utils.LeftSide;
import org.gradoop.flink.model.impl.operators.aggregation.functions.max.MaxVertexProperty;
import org.gradoop.flink.model.impl.operators.aggregation.functions.min.MinVertexProperty;


public class PageRankSampling implements UnaryGraphToGraphOperator {
    private final double threshold;
    private double dampeningFactor;

    public static String PageRankScore = "PageRankScore";
    public static String MinScore = "min_" + PageRankScore;
    public static String MaxScore = "max_" + PageRankScore;

    public PageRankSampling(double dampeningFactor, double threshold) {
        this.dampeningFactor = dampeningFactor;
        this.threshold = threshold;
    }

    public LogicalGraph sample(LogicalGraph graph) {

        // prepare vertex set for Gelly vertex centric iteration
        DataSet<Vertex<GradoopId, Double>> vertices =
                graph.getVertices().map(new VertexToGellyVertexMapperForPageRank());

        // prepare edge set for Gelly vertex centric iteration
        DataSet<org.apache.flink.graph.Edge<GradoopId, Double>> edges =
                graph.getEdges().map(new EdgeToGellyEdgeMapperForPageRank());

        // create Gelly graph
        Graph<GradoopId, Double, Double> gellyGraph = Graph.fromDataSet(
                vertices, edges, graph.getConfig().getExecutionEnvironment());
        DataSet<Vertex<GradoopId, Double>> newVertices = gellyGraph.getDegrees()
                .map(new GellyGraphDegreeMapFunction());

        // create new Gelly graph
        Graph<GradoopId, Double, Double> newGellyGraph = Graph.fromDataSet(
                newVertices, edges, graph.getConfig().getExecutionEnvironment());

        DataSet<PageRank.Result<GradoopId>> res = null;
        try {
            res = newGellyGraph.run(new PageRank<>(dampeningFactor, 100));
        } catch (Exception e) {
            e.printStackTrace();
        }

        DataSet<org.gradoop.common.model.impl.pojo.Vertex> labeledVertices = res.join(graph.getVertices())
                .where(new KeySelector<PageRank.Result<GradoopId>, GradoopId>() {
                    @Override
                    public GradoopId getKey(PageRank.Result<GradoopId> gradoopIdResult) throws Exception {
                        return gradoopIdResult.getVertexId0();
                    }
                }).equalTo(new Id<>())
                .with(new JoinFunction<PageRank.Result<GradoopId>, org.gradoop.common.model.impl.pojo.Vertex, org.gradoop.common.model.impl.pojo.Vertex>() {
                    @Override
                    public org.gradoop.common.model.impl.pojo.Vertex join(PageRank.Result<GradoopId> gradoopIdResult, org.gradoop.common.model.impl.pojo.Vertex vertex) throws Exception {
                        vertex.setProperty(PageRankScore, Float.parseFloat(gradoopIdResult.getPageRankScore().toString()));
                        return vertex;
                    }
                });
        graph = graph.getConfig().getLogicalGraphFactory().fromDataSets(labeledVertices, graph.getEdges());

        MinVertexProperty minVertexProperty = new MinVertexProperty(PageRankScore);
        MaxVertexProperty maxVertexProperty = new MaxVertexProperty(PageRankScore);
        graph = graph.aggregate(minVertexProperty).aggregate(maxVertexProperty);
        DataSet<org.gradoop.common.model.impl.pojo.Vertex> vs = graph.getVertices().cross(graph.getGraphHead().first(1))
                .with(new VertexGraphHeadDegreeCross(PageRankScore));
        graph = graph.getConfig().getLogicalGraphFactory().fromDataSets(vs, graph.getEdges());
        labeledVertices = graph.getVertices().map(new MapFunction<org.gradoop.common.model.impl.pojo.Vertex, org.gradoop.common.model.impl.pojo.Vertex>() {
            @Override
            public org.gradoop.common.model.impl.pojo.Vertex map(org.gradoop.common.model.impl.pojo.Vertex vertex) throws Exception {
                float score = Float.parseFloat(vertex.getPropertyValue(PageRankScore).toString());
                float min = Float.parseFloat(vertex.getPropertyValue(MinScore).toString());
                float max = Float.parseFloat(vertex.getPropertyValue(MaxScore).toString());
                if (max != min) vertex.setProperty(PageRankScore, (score - min) / (max - min));
                return vertex;
            }
        }).filter(new PageRankResultFilterFunction(threshold));

        DataSet<Edge> newEdges = graph.getEdges()
                .join(labeledVertices)
                .where(new SourceId<>())
                .equalTo(new Id<>())
                .with(new LeftSide<>())
                .join(labeledVertices)
                .where(new TargetId<>())
                .equalTo(new Id<>())
                .with(new LeftSide<>());


        return graph.getConfig().getLogicalGraphFactory().fromDataSets(labeledVertices, newEdges);
    }

    @Override
    public LogicalGraph execute(LogicalGraph graph) {
        try {
            return sample(graph);
        } catch (Exception e) {
            e.printStackTrace();
        }
        return graph;
    }

    @Override
    public String getName() {
        return PageRankSampling.class.getName();
    }
}