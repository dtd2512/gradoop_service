package de.scads.gradoop_service.server.helper.gelly.io;

import org.apache.flink.api.common.functions.MapFunction;
import org.apache.flink.api.java.functions.FunctionAnnotation;
import org.gradoop.common.model.impl.id.GradoopId;
import org.gradoop.common.model.impl.pojo.Edge;

/**
 * Maps EPGM edge to a Gelly edge.
 */
@FunctionAnnotation.ForwardedFields("id->f0")
@FunctionAnnotation.ReadFields("properties")
public class GenericEdgeToGellyEdgeMapper<EV extends Comparable> implements MapFunction<Edge, org.apache.flink.graph.Edge<GradoopId, EV>> {

    private final Class<EV> prototypeClass;

    /**
     * Reduce object instantiations
     */
    private final org.apache.flink.graph.Edge<GradoopId, EV> reuseEdge;

    /**
     * Constructor
     */
    public GenericEdgeToGellyEdgeMapper(Class<EV> prototypeClass) {
        this.reuseEdge = new org.apache.flink.graph.Edge<>();
        this.prototypeClass = prototypeClass;
    }

    @Override
    public org.apache.flink.graph.Edge<GradoopId, EV> map(Edge epgmEdge) throws Exception {
        reuseEdge.setSource(epgmEdge.getSourceId());
        reuseEdge.setTarget(epgmEdge.getTargetId());
        reuseEdge.setValue(prototypeClass.newInstance());
        return reuseEdge;
    }
}