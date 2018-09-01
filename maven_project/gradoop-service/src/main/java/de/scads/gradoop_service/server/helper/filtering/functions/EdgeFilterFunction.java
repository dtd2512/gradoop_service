package de.scads.gradoop_service.server.helper.filtering.functions;

import com.google.common.collect.Multimap;
import de.scads.gradoop_service.server.helper.filtering.pojos.FilterConfigElement;
import de.scads.gradoop_service.server.helper.filtering.pojos.FilterEvalElement;
import org.apache.flink.api.common.functions.FilterFunction;
import org.gradoop.common.model.impl.pojo.Edge;

/**
 *
 */
public class EdgeFilterFunction extends GraphElementFilterFunction implements FilterFunction<Edge> {
    public EdgeFilterFunction(Multimap<String, FilterEvalElement> filterEvalRules, Multimap<String, FilterConfigElement> filterRules) {
        super(filterEvalRules, filterRules);
    }

    @Override
    public boolean filter(Edge edge) throws Exception {
        return filter(edge.getLabel(), edge.getProperties());
    }
}
