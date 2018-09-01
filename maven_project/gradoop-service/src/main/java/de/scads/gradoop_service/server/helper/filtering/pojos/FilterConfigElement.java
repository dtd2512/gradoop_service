package de.scads.gradoop_service.server.helper.filtering.pojos;

import de.scads.gradoop_service.server.helper.filtering.enums.FilterType;
import de.scads.gradoop_service.server.helper.filtering.enums.Operation;

import java.io.Serializable;

/**
 * A POJO which contains the configuration elements for filtering.
 */
public class FilterConfigElement implements Serializable{
    public final Integer id;
    public final FilterType type;
    public final String attribute;
    public final Operation operation;
    public final String rightSide;


    public FilterConfigElement(Integer id, FilterType type, String attribute, Operation operation, String rightSide) {
        this.id = id;
        this.type = type;
        this.attribute = attribute;
        this.operation = operation;
        this.rightSide = rightSide;
    }

    @Override
    public String toString() {
        return "FilterConfigElement{" +
                "id=" + id +
                ", type=" + type +
                ", attribute='" + attribute + '\'' +
                ", operation=" + operation +
                ", rightSide='" + rightSide + '\'' +
                '}';
    }
}
