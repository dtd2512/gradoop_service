package de.scads.gradoop_service.server.sampling;

import org.gradoop.common.model.impl.pojo.Vertex;
import org.gradoop.flink.model.api.functions.TransformationFunction;

public class VAddMin implements TransformationFunction<Vertex>  {
    float min, max;
    public VAddMin(float min, float max) {
        this.min = min; this.max=max;
    }

    @Override
    public Vertex apply(Vertex vertex, Vertex el1) {
        vertex.setProperty(PageRankSampling.MaxScore, max);
        vertex.setProperty(PageRankSampling.MinScore, min);
        return vertex;
    }
}
