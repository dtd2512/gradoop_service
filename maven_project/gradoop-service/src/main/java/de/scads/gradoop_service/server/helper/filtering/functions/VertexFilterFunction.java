package de.scads.gradoop_service.server.helper.filtering.functions;

import com.google.common.collect.Multimap;
import de.scads.gradoop_service.server.helper.filtering.pojos.FilterConfigElement;
import de.scads.gradoop_service.server.helper.filtering.pojos.FilterEvalElement;
import org.apache.flink.api.common.functions.FilterFunction;
import org.gradoop.common.model.impl.pojo.Vertex;

/**
 *
 */
public class VertexFilterFunction extends GraphElementFilterFunction implements FilterFunction<Vertex> {


    public VertexFilterFunction(Multimap<String, FilterEvalElement> filterEvalRules, Multimap<String, FilterConfigElement> filterRules) {
        super(filterEvalRules, filterRules);
    }

    @Override
    public boolean filter(Vertex vertex) throws Exception {
        return filter(vertex.getLabel(), vertex.getProperties());
    }
}
