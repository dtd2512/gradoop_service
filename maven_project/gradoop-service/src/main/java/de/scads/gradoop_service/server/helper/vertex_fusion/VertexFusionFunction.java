package de.scads.gradoop_service.server.helper.vertex_fusion;

import java.util.ArrayList;

import org.gradoop.common.model.impl.pojo.Vertex;

public interface VertexFusionFunction {
	Vertex apply(ArrayList<Vertex> vertices, String vertexAttribute);
}
