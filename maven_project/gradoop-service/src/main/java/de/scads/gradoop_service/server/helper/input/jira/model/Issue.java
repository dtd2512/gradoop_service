package de.scads.gradoop_service.server.helper.input.jira.model;

import java.util.Map;

/**
 *
 * @author John Nguyen
 */
public class Issue {
    
    private  String id;
    private  String key;
    private  Map<String, String> fields;
    private  String description; 
    
    public void setDescription(String description) {
    	if(description.length()>200)
    		this.description = description.substring(0,199);
    	else
    		this.description = description;
	}

	public String getDescription() {
		return description;
	}

	public Issue(String id, String key, Map<String, String> fields){
        this.id = id;
        this.key = key;
        this.fields = fields;
    }
    
    public void addFields(String key, String value){
        if(key != null && value != null){
            fields.put(key, value);
        }
    }
    
    public String getID(){
        return id;
    }
    
    public String getKey(){
        return key;
    }
    
    public Map<String, String> getFields(){
        return fields;
    }
}
