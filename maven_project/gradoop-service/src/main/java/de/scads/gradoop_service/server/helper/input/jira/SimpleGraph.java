/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package de.scads.gradoop_service.server.helper.input.jira;

import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.gradoop.common.model.impl.properties.Properties;
import org.gradoop.flink.io.impl.graph.tuples.ImportEdge;
import org.gradoop.flink.io.impl.graph.tuples.ImportVertex;

import de.scads.gradoop_service.server.helper.input.jira.model.Issue;
import de.scads.gradoop_service.server.helper.input.jira.model.Person;
import de.scads.gradoop_service.server.helper.input.jira.model.Project;


/**
 *
 * @author John Nguyen
 */
public class SimpleGraph {
    
    private final Map<String, ImportVertex> vertices = new HashMap<>();
    private final Map<String, ImportEdge> edges = new HashMap<>();
    
    private List<Issue> listOfIssues = new ArrayList<>();
    private List<String> listOfIssueFields = new ArrayList<>();
   // private final JsonRestReader reader = new JsonRestReader(); // not static because is needed for filling the list of persons
    
    public void createGraphStructure(JsonRestReader jsonRestReader, String outputLocation) throws IOException, Exception {
        for(Project project : jsonRestReader.getListOfProjects()){
            ImportVertex<String> projectVertex = new ImportVertex<>(project.getKey(), "Project");
            Properties prop= new Properties();
            prop.set("name", project.getName());
            prop.set("key", project.getKey());
            projectVertex.setProperties(prop);
            vertices.put(project.getKey(), projectVertex);
            listOfIssues = jsonRestReader.getAllIssuesOfProject(project.getKey());
            this.createPersonsVertices(jsonRestReader.getListOfPersons());
            this.createIssueVertices(listOfIssues, project.getKey(), jsonRestReader);
        }
        //this.printOutputs();
        GraphCreationHelper.writeGraph(vertices, edges, outputLocation);
    }
    
    /**
     * Helper Method for creating the Issues vertices
     * @param issues List of Issues
     * @param projectkey Key of the Project
     * @param jsonRestReader 
     */
    private void createIssueVertices(List<Issue> issues, String projectkey, JsonRestReader jsonRestReader){
        for(Issue issue : issues){
            ImportVertex<String> issueVertex = new ImportVertex<>(issue.getID(), "Issue");
            
            vertices.put(issue.getKey(), issueVertex);
            listOfIssueFields = jsonRestReader.getListOfFieldEntries(issue.getKey());
            Properties prop= new Properties();
            prop.set("key", issue.getKey());
            prop.set("desription", issue.getDescription());
            issueVertex.setProperties(prop);
            
            for(String field : listOfIssueFields){
                String fieldkey = "key_"+field;
                //ImportVertex<String> fieldVertex = new ImportVertex<>(fieldkey, field);
               
               
                String fieldValue = issue.getFields().get(field);
                String edgePersonFieldKey = fieldValue + "|" + issue.getKey();
                ImportEdge<String> personFieldEdge = new ImportEdge<>(edgePersonFieldKey, fieldValue, issue.getID(), field);
                edges.put(edgePersonFieldKey, personFieldEdge);
                prop.set(field, fieldValue);
            }
            String edgeKey = projectkey + "|" + issue.getKey();
            ImportEdge<String> edge;
            edge = new ImportEdge<>(edgeKey, issue.getID(), projectkey);
            edges.put(edgeKey, edge);
        }
    }
    
    /**
     * Helper Method to create vertices for persons
     * @param persons 
     */
    private void createPersonsVertices(List<Person> persons){
        for(Person p : persons){
            ImportVertex<String> personVertex = new ImportVertex<>(p.getKey(),"Person");
            Properties prop= new Properties();
            prop.set("name", p.getName());
            prop.set("key", p.getKey());
            prop.set("displayName", p.getDisplayName());
            prop.set("email", p.getEmailAddress());
            personVertex.setProperties(prop);
            vertices.put(p.getKey(), personVertex);
        }
    }
    
    /**
     * Helper for checking the content
     */
    private void printOutputs(){
        System.out.println("----------- VERTICES -----------");
        for(Map.Entry<String, ImportVertex> entry : vertices.entrySet()){
            System.out.println(entry.getKey()+" / "+entry.getValue());
        }
        System.out.println("-------------------------------");
        System.out.println("----------- ISSUES ------------");
        for(Issue i : listOfIssues){
            System.out.println("Issue ID: "+i.getID()+" Issue Key: "+i.getKey());
        }
    }
}
