package de.scads.gradoop_service.server.sampling;

import org.apache.flink.api.common.functions.MapFunction;
import org.apache.flink.graph.Vertex;
import org.gradoop.common.model.impl.id.GradoopId;

public class VertexToGellyVertexMapperForPageRank
        implements MapFunction<org.gradoop.common.model.impl.pojo.Vertex, Vertex<GradoopId, Double>> {
    //LogicalGraph graph;
    public VertexToGellyVertexMapperForPageRank() {
      //  this.graph = graph;
    }

    @Override
    public Vertex<GradoopId, Double> map(org.gradoop.common.model.impl.pojo.Vertex vertex) throws Exception {
        Vertex<GradoopId, Double> v = new Vertex<>();
        v.setId(vertex.getId());
        v.setValue(0d);
        //v.set
        //v.setField('tst',);
        return v;
    }
}