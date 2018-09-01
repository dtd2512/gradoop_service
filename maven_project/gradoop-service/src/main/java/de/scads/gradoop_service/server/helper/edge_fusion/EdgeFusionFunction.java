package de.scads.gradoop_service.server.helper.edge_fusion;

import java.util.ArrayList;

import org.gradoop.common.model.impl.pojo.Edge;

public interface EdgeFusionFunction<T> {
	 T apply(ArrayList<Edge> edges, String edgeAttribute);
}