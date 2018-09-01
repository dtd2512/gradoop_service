package de.scads.gradoop_service.server.helper.grouping.functions;

import com.google.common.collect.Sets;
import org.apache.flink.api.common.functions.MapFunction;
import org.gradoop.common.model.api.entities.EPGMElement;

import java.util.Set;

/**
 * Extracts all labels from an epgm element
 *
 * @param <E> epgm element type
 */
public class LabelMapper<E extends EPGMElement> implements MapFunction<E, Set<String>> {
    /**
     * {@inheritDoc}
     */
    @Override
    public Set<String> map(E e) throws Exception {
        return Sets.newHashSet(e.getLabel());
    }
}