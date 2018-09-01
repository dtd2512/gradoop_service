package de.scads.gradoop_service.server.sampling;

import org.apache.flink.api.common.functions.CrossFunction;
import org.gradoop.common.model.impl.pojo.GraphHead;
import org.gradoop.common.model.impl.pojo.Vertex;


public class VertexGraphHeadDegreeCross implements CrossFunction<Vertex, GraphHead, Vertex> {
    String propertyName;

    public VertexGraphHeadDegreeCross(String propertyName) {
        this.propertyName = propertyName;
    }

    @Override
    public Vertex cross(Vertex vertex, GraphHead graphHead) throws Exception {
        vertex.setProperty("min_" + propertyName, graphHead.getPropertyValue("min_" + propertyName));
        vertex.setProperty("max_" + propertyName, graphHead.getPropertyValue("max_" + propertyName));
        return vertex;
    }
}

