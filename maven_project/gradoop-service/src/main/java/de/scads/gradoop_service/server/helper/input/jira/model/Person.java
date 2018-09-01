/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package de.scads.gradoop_service.server.helper.input.jira.model;

/**
 *
 * @author john.nguyen
 */
public class Person {
    private final String name;
    private final String key;
    private final String displayName;
    private final String emailAddress;
    
    public String getEmailAddress() {
		return emailAddress;
	}

	public Person(String name, String key, String displayName, String emailAddress){
        this.name = name;
        this.key = key;
        this.displayName = displayName;
        this.emailAddress=emailAddress;
    }
    
    public String getName(){
        return name;
    }
    
    public String getKey(){
        return key;
    }
    
    public String getDisplayName(){
        return displayName;
    }
}

