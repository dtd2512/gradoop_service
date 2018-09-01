package de.scads.gradoop_service.server.helper.filtering.enums;

/**
 * Numerical operations for filtering and creation of vertex or edge induced subgraphs.
 */
public enum NumericalOperation implements Operation<Double> {
    LESSER {
        @Override
        public boolean apply(Double leftSide, Double rightSide) {
            return leftSide.compareTo(rightSide) < 0;
        }
    },
    GREATER {
        @Override
        public boolean apply(Double leftSide, Double rightSide) {
            return leftSide.compareTo(rightSide) > 0;
        }
    },
    LESSER_EQUAL {
        @Override
        public boolean apply(Double leftSide, Double rightSide) {
            return leftSide.compareTo(rightSide) <= 0;
        }
    },
    GREATER_EQUAL {
        @Override
        public boolean apply(Double leftSide, Double rightSide) {
            return leftSide.compareTo(rightSide) >= 0;
        }
    },
    EQUAL {
        @Override
        public boolean apply(Double leftSide, Double rightSide) {
            return leftSide.compareTo(rightSide) == 0;
        }
    },
    NOT_EQUAL {
        @Override
        public boolean apply(Double leftSide, Double rightSide) {
            return leftSide.compareTo(rightSide) != 0;
        }
    },
    EXISTS {
        @Override
        public boolean apply(Double leftSide, Double rightSide) {
            return leftSide != null;
        }
    },
    NOT_EXISTS {
        @Override
        public boolean apply(Double leftSide, Double rightSide) {
        	// method called if element exists, it means that NOT_EXISTS is false
        	return false;
        }
    }
}