package de.scads.gradoop_service.server.helper.gelly.io;

import org.apache.flink.api.common.functions.MapFunction;
import org.gradoop.common.model.impl.id.GradoopId;
import org.gradoop.common.model.impl.pojo.Vertex;

/**
 * Maps EPGM vertex to a Gelly vertex consisting of the EPGM identifier and the
 * label propagation value.
 */
public class VertexToGellyVertexMapper implements
        MapFunction<Vertex, org.apache.flink.graph.Vertex<GradoopId, GradoopId>> {

    /**
     * Reduce object instantiations
     */
    private final org.apache.flink.graph.Vertex<GradoopId, GradoopId>
            reuseVertex;

    /**
     * Constructor
     */
    public VertexToGellyVertexMapper() {
        this.reuseVertex = new org.apache.flink.graph.Vertex<>();
    }

    @Override
    public org.apache.flink.graph.Vertex<GradoopId, GradoopId> map(Vertex epgmVertex) throws Exception {
        reuseVertex.setId(epgmVertex.getId());
        reuseVertex.setValue(epgmVertex.getId());
        return reuseVertex;
    }
}