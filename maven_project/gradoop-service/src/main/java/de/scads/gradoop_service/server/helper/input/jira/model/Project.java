/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package de.scads.gradoop_service.server.helper.input.jira.model;

import java.util.List;

/**
 *
 * @author John Nguyen
 */
public class Project {
    
    private final String id;
    private final String key;
    private final String name;
    private final String projectURI;
    //private final List<Issue> issues;
    
    public Project(String id, String key, String name, String projectURI){
        this.id = id;
        this.name = name;
        this.projectURI = projectURI;
        this.key = key;
        //this.issues = issues;
    }
    
    public String getProjectURI(){
        return projectURI;
    }
    
    //public List<Issue> getIssues(){
    //    return issues;
    //}
    
    public String getKey(){
        return key;
    }
    
    public String getName(){
        return name;
    }
    
    public String getId(){
        return id;
    }
}
