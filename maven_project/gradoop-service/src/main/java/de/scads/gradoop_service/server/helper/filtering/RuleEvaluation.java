package de.scads.gradoop_service.server.helper.filtering;


import de.scads.gradoop_service.server.helper.filtering.pojos.FilterEvalElement;

import java.util.Comparator;
import java.util.List;

/**
 * A helper class for evaluation of boolean expressions for filtering
 */
public class RuleEvaluation {

    public static boolean evaluate(List<Boolean> ruleEvaluations, List<FilterEvalElement> filterEvalRules) {

        if(ruleEvaluations.size() == 1) {
            return ruleEvaluations.get(0);
        }
        else if (ruleEvaluations.size() != filterEvalRules.size() + 1) {
            throw new IllegalArgumentException("Length of rule arrays are inappropriate! They should hold the equation \n"
                    + "evaluatedRules.size() == evalRules + 1 \n But actually is: " + ruleEvaluations.size() + " == " + filterEvalRules.size());
        }

        // sort filter eval rules by the id of the first operand
        filterEvalRules.sort(Comparator.comparingInt(l -> l.firstId));

        boolean result = filterEvalRules.get(0).booleanOperation.evaluate(ruleEvaluations.get(0), ruleEvaluations.get(1));
        for (int i = 1; i < filterEvalRules.size(); i++) {
            result = filterEvalRules.get(i).booleanOperation.evaluate(result, ruleEvaluations.get(i+1));
        }

        return result;
    }
}
