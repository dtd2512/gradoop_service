package de.scads.gradoop_service.server.helper.filtering.enums;

/**
 * Textual operations for filtering and creation of vertex or edge induced subgraphs.
 */
public enum TextualOperation implements Operation<String> {
    EQUAL {
        @Override
        public boolean apply(String leftSide, String rightSide) {
            return leftSide.equals(rightSide);
        }
    },
    NOT_EQUAL {
        @Override
        public boolean apply(String leftSide, String rightSide) {
            return !leftSide.equals(rightSide);
        }
    },
    CONTAINS {
        @Override
        public boolean apply(String leftSide, String rightSide) {
            return leftSide.contains(rightSide);
        }
    },
    STARTS_WITH {
        @Override
        public boolean apply(String leftSide, String rightSide) {
            return leftSide.startsWith(rightSide);
        }
    },
    ENDS_WITH {
        @Override
        public boolean apply(String leftSide, String rightSide) {
            return leftSide.endsWith(rightSide);
        }
    },
    LEX_LESSER {
        @Override
        public boolean apply(String leftSide, String rightSide) {
            return leftSide.compareTo(rightSide) < 0;
        }
    },
    LEX_GREATER {
        @Override
        public boolean apply(String leftSide, String rightSide) {
            return leftSide.compareTo(rightSide) > 0;
        }
    },
    EXISTS {
        @Override
        public boolean apply(String leftSide, String rightSide) {
            return leftSide != null;
        }
    },
    NOT_EXISTS {
        @Override
        public boolean apply(String leftSide, String rightSide) {
        	// method called if element exists, it means that NOT_EXISTS is false
        	return false;
        }
    }
}
