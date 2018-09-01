package de.scads.gradoop_service.server.helper.gelly.io;

import org.apache.flink.api.common.functions.MapFunction;
import org.apache.flink.types.NullValue;
import org.gradoop.common.model.impl.id.GradoopId;
import org.gradoop.common.model.impl.pojo.Edge;

public class EdgeToGellyEdgeMapper implements MapFunction<Edge, org.apache.flink.graph.Edge<GradoopId, NullValue>> {
    private final org.apache.flink.graph.Edge<GradoopId, NullValue> reuseEdge = new org.apache.flink.graph.Edge();

    public EdgeToGellyEdgeMapper() {
        this.reuseEdge.setValue(NullValue.getInstance());
    }

    public org.apache.flink.graph.Edge<GradoopId, NullValue> map(Edge epgmEdge) throws Exception {
        this.reuseEdge.setSource(epgmEdge.getSourceId());
        this.reuseEdge.setTarget(epgmEdge.getTargetId());
        return this.reuseEdge;
    }
}