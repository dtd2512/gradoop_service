package de.scads.gradoop_service.server.sampling;

import org.apache.flink.api.common.functions.FilterFunction;
import org.gradoop.common.model.impl.pojo.Vertex;

public class PageRankResultFilterFunction implements FilterFunction<Vertex> {
    private double threshold;
    public PageRankResultFilterFunction(double threshold) {
        this.threshold = threshold;
    }

    @Override
    public boolean filter(Vertex vertex) throws Exception {
        return Float.parseFloat(vertex.getPropertyValue(PageRankSampling.PageRankScore).toString()) >= threshold;
    }
}
