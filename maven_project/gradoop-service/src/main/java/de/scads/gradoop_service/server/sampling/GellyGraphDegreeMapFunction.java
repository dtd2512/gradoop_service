package de.scads.gradoop_service.server.sampling;

import org.apache.flink.api.common.functions.MapFunction;
import org.apache.flink.api.java.tuple.Tuple2;
import org.apache.flink.graph.Vertex;
import org.apache.flink.types.LongValue;
import org.gradoop.common.model.impl.id.GradoopId;

public class GellyGraphDegreeMapFunction implements MapFunction<Tuple2<GradoopId,LongValue>, Vertex<GradoopId, Double>> {
    @Override
    public Vertex<GradoopId, Double> map(Tuple2<GradoopId, LongValue> gradoopIdLongValueTuple2) throws Exception {
        Vertex<GradoopId, Double> v = new Vertex<>();
        v.setId(gradoopIdLongValueTuple2.f0);
        v.setValue((double) gradoopIdLongValueTuple2.f1.getValue());
        return v;
    }
}
