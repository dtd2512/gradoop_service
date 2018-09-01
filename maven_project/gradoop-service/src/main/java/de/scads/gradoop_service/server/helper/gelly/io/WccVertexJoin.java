package de.scads.gradoop_service.server.helper.gelly.io;

import org.apache.flink.api.common.functions.JoinFunction;
import org.apache.flink.graph.library.link_analysis.PageRank;
import org.gradoop.common.model.impl.id.GradoopId;
import org.gradoop.common.model.impl.pojo.Vertex;

public class WccVertexJoin implements JoinFunction<org.apache.flink.graph.Vertex<GradoopId, GradoopId>, Vertex, Vertex> {

    /**
     * Property key to access the value which will be propagated
     */
    private final String propertyKey;

    /**
     * Constructor
     *
     * @param propertyKey property key to access the propagation value
     */
    public WccVertexJoin(String propertyKey) {
        this.propertyKey = propertyKey;
    }

    @Override
    public Vertex join(org.apache.flink.graph.Vertex<GradoopId, GradoopId> wccResult, Vertex epgmVertex) throws Exception {
        epgmVertex.setProperty(propertyKey, wccResult.getValue().toString());
        return epgmVertex;
    }
}
