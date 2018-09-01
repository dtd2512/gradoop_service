package de.scads.gradoop_service.server.helper.filtering.pojos;

import de.scads.gradoop_service.server.helper.filtering.enums.BinaryBooleanOperation;

import java.io.Serializable;

/**
 * POJO for handling logic between operations.
 */
public class FilterEvalElement implements Serializable {
    public final BinaryBooleanOperation booleanOperation;
    public final int firstId;
    public final int secondId;

    public FilterEvalElement(BinaryBooleanOperation booleanOperation, int firstId, int secondId) {
        this.booleanOperation = booleanOperation;
        this.firstId = firstId;
        this.secondId = secondId;
    }

    @Override
    public String toString() {
        return "FilterEvalElement{" +
                "booleanOperation=" + booleanOperation +
                ", firstId=" + firstId +
                ", secondId=" + secondId +
                '}';
    }
}