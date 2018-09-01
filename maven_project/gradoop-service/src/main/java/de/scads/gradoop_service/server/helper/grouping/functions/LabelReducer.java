package de.scads.gradoop_service.server.helper.grouping.functions;

import org.apache.flink.api.common.functions.ReduceFunction;

import java.util.Set;

/**
 * Reduce the DEataset of labels to one set.
 */
public class LabelReducer implements ReduceFunction<Set<String>> {

    /**
     * {@inheritDoc}
     */
    @Override
    public Set<String> reduce(Set<String> set1, Set<String> set2) throws Exception {
        set1.addAll(set2);
        return set1;
    }
}