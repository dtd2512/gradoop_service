package de.scads.gradoop_service.server.helper.filtering.functions;

import com.google.common.collect.Multimap;
import de.scads.gradoop_service.server.helper.filtering.RuleEvaluation;
import de.scads.gradoop_service.server.helper.filtering.enums.FilterType;
import de.scads.gradoop_service.server.helper.filtering.enums.NumericalOperation;
import de.scads.gradoop_service.server.helper.filtering.enums.TextualOperation;
import de.scads.gradoop_service.server.helper.filtering.pojos.FilterConfigElement;
import de.scads.gradoop_service.server.helper.filtering.pojos.FilterEvalElement;
import org.apache.flink.api.common.functions.FilterFunction;
import org.gradoop.common.model.api.entities.EPGMElement;
import org.gradoop.common.model.impl.properties.Properties;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

/**
 *
 */
abstract class GraphElementFilterFunction implements Serializable {
    private final Multimap<String, FilterEvalElement> filterEvalRules;
    private final Multimap<String, FilterConfigElement> filterRules;


    GraphElementFilterFunction(Multimap<String, FilterEvalElement> filterEvalRules, Multimap<String, FilterConfigElement> filterRules) {
        this.filterEvalRules = filterEvalRules;
        this.filterRules = filterRules;
    }

    protected boolean filter(String label, Properties attributes) {
        // if no rules are defined for the current vertex type, we can return false right away
        // since the vertex should not be part of the result anymore
        if(!filterRules.containsKey(label)) {
            return false;
        }

        Collection<FilterConfigElement> filterRulesForType = filterRules.get(label);
        System.out.println("Rules For Type: " + filterRulesForType);

        List<Boolean> ruleEvaluations = new ArrayList<>();
        for (FilterConfigElement fce : filterRulesForType) {
            // we explicitly set the value to null if all vertices should be accepted of this "label"
            if(fce == null && filterRulesForType.size() == 1) {
                return true;
            }

            // check for attribute existence
            if(attributes.containsKey(fce.attribute)) {
                // Textual Filtering
                if (fce.type.equals(FilterType.TEXTUAL)) {
                    String attrValue = attributes.get(fce.attribute).getString();
                    TextualOperation op = (TextualOperation) fce.operation;
                    ruleEvaluations.add(op.apply(attrValue, fce.rightSide));
                }
                // Numerical Filtering
                else if (fce.type.equals(FilterType.NUMERIC)) {
                    Double attrValue = Double.parseDouble(attributes.get(fce.attribute).toString());
                    NumericalOperation op = (NumericalOperation) fce.operation;
                    ruleEvaluations.add(op.apply(attrValue, Double.parseDouble(fce.rightSide)));
                }
            } else {
            	// if the element does not contain the attribute we return: 
            	// true - only for operation NOT_EXISTS
            	// false - in all other cases
            	if(fce.operation.equals(TextualOperation.NOT_EXISTS)) {
            		ruleEvaluations.add(true);
            	}
            	else {
                	ruleEvaluations.add(false);
            	}
            }
        }
        boolean res = RuleEvaluation.evaluate(ruleEvaluations, (List<FilterEvalElement>)filterEvalRules.get(label));
        System.out.println("======================================================================================");
        System.out.println("Label: " + label);
        System.out.println("Attri: " + attributes);
        System.out.println("RuleE: " + ruleEvaluations);
        System.out.println("EvalR: " + filterEvalRules.get(label));
        System.out.println("Resul: " + res);
        System.out.println("======================================================================================");
        return res;
    }
}
