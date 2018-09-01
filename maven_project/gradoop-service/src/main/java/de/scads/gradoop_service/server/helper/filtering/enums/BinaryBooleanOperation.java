package de.scads.gradoop_service.server.helper.filtering.enums;

/**
 * Binary boolean operations containing a evaluate method for easy use in dynamic cases.
 */
public enum BinaryBooleanOperation {
    AND {
        @Override
        public boolean evaluate(boolean l, boolean r) {
            return l && r;
        }
    },
    OR {
        @Override
        public boolean evaluate(boolean l, boolean r) {
            return l || r;
        }
    },
    XOR {
        @Override
        public boolean evaluate(boolean l, boolean r) {
            return l != r;
        }
    },
    NOR {
        @Override
        public boolean evaluate(boolean l, boolean r) {
            return !(l || r);
        }
    },
    NAND {
        @Override
        public boolean evaluate(boolean l, boolean r) {
            return !(l && r);
        }
    },
    ;

    public abstract boolean evaluate(boolean l, boolean r);
}
