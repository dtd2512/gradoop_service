package de.scads.gradoop_service.server.helper.gelly.io;

import org.apache.flink.api.common.functions.MapFunction;
import org.apache.flink.api.java.functions.FunctionAnnotation;
import org.gradoop.common.model.impl.id.GradoopId;
import org.gradoop.common.model.impl.pojo.Vertex;

/**
 * Maps EPGM vertex to a Gelly vertex.
 */
@FunctionAnnotation.ForwardedFields("id->f0")
@FunctionAnnotation.ReadFields("properties")
public class GenericVertexToGellyVertexMapper<VV extends Comparable> implements MapFunction<Vertex, org.apache.flink.graph.Vertex<GradoopId, VV>> {

    private final Class<VV> prototypeClass;

    /**
     * Reduce object instantiations
     */
    private final org.apache.flink.graph.Vertex<GradoopId, VV> reuseVertex;

    /**
     * Constructor
     */
    public GenericVertexToGellyVertexMapper(Class<VV> prototypeClass) {
        this.reuseVertex = new org.apache.flink.graph.Vertex<>();
        this.prototypeClass = prototypeClass;
    }

    @Override
    public org.apache.flink.graph.Vertex<GradoopId, VV> map(Vertex epgmVertex) throws Exception {
        reuseVertex.setId(epgmVertex.getId());
        reuseVertex.setValue(prototypeClass.newInstance());
        return reuseVertex;
    }
}