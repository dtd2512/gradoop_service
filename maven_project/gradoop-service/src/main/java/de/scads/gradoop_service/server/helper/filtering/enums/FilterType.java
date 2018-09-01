package de.scads.gradoop_service.server.helper.filtering.enums;

/**
 * Supported types for filter operations.
 */
public enum FilterType {
    /**
     * NUMERIC support all common types numerical like int, long, float, double
     */
    NUMERIC,

    /**
     * Is meant for Strings.
     */
    TEXTUAL;
}
