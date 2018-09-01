package de.scads.gradoop_service.server.sampling;

import org.apache.flink.api.common.functions.MapFunction;
import org.gradoop.common.model.impl.id.GradoopId;
import org.gradoop.common.model.impl.pojo.Edge;

public class EdgeToGellyEdgeMapperForPageRank
        implements MapFunction<Edge, org.apache.flink.graph.Edge<GradoopId, Double>> {

    @Override
    public org.apache.flink.graph.Edge<GradoopId, Double> map(Edge edge) throws Exception {
        org.apache.flink.graph.Edge<GradoopId, Double> e = new org.apache.flink.graph.Edge<>();
        e.setSource(edge.getSourceId());
        e.setTarget(edge.getTargetId());
        e.setValue(0d);
        return e;
    }
}