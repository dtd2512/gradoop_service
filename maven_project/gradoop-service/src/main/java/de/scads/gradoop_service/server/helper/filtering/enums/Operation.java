package de.scads.gradoop_service.server.helper.filtering.enums;

/**
 * Implementations: {@link TextualOperation} & {@link NumericalOperation}
 */
public interface Operation<T> {
    boolean apply(T leftSide, T rightSide);
}
