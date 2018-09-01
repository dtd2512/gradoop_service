package de.scads.gradoop_service.server.helper.grouping.functions;


import org.apache.flink.api.common.functions.GroupReduceFunction;
import org.apache.flink.api.java.tuple.Tuple3;
import org.apache.flink.util.Collector;

import java.util.HashSet;
import java.util.Set;

/**
 * Reduce the Dataset of properties, represented as tuples3 of label of vertices with this
 * property, property key and a boolean specifying if it is numerical into one tuple3 with all
 * vertex labels in the first field.
 */
public class LabelGroupReducer implements GroupReduceFunction<
        Tuple3<String, String, Boolean>, Tuple3<Set<String>, String, Boolean>> {

    /**
     * {@inheritDoc}
     */
    @Override
    public void reduce(
            Iterable<Tuple3<String, String, Boolean>> iterable,
            Collector<Tuple3<Set<String>, String, Boolean>> collector) throws Exception {

        Tuple3<Set<String>, String, Boolean> result = new Tuple3<>();

        result.f0 = new HashSet<>();
        for (Tuple3<String, String, Boolean> tuple : iterable) {
            result.f0.add(tuple.f0);
            result.f1 = tuple.f1;
            result.f2 = tuple.f2;
        }

        collector.collect(result);
    }
}