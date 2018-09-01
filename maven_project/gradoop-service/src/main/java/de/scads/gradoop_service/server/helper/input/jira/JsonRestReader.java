package de.scads.gradoop_service.server.helper.input.jira;

import java.io.IOException;
import java.io.StringReader;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import javax.json.Json;
import javax.json.JsonArray;
import javax.json.JsonObject;
import javax.json.JsonReader;
import javax.json.JsonValue;

import org.apache.flink.api.java.tuple.Tuple2;

import de.scads.gradoop_service.server.helper.input.jira.model.Issue;
import de.scads.gradoop_service.server.helper.input.jira.model.Person;
import de.scads.gradoop_service.server.helper.input.jira.model.Project;


/**
 *
 * @author John Nguyen
 * Class to retrieve the Project and Issues using the Jira Rest API
 */
public class JsonRestReader {
    
    private final List<Issue> issues;
    private final List<Project> listOfProjects;
    public List<Project> getListOfProjects() {
		return listOfProjects;
	}

	private final List<Person> listOfPersons;
	private String jiraRestURL;
    
    public JsonRestReader(String jiraRestURL) {
        this.issues = new ArrayList<>();
        this.listOfProjects = new ArrayList<>();
        this.listOfPersons = new ArrayList<>();
        this.jiraRestURL = jiraRestURL;
    }
    
    /**
     * Get All Project with Jira API
     * @return List of projects
     */
    private List<Project> getAllProjects(){
        String json = RestClient.get(jiraRestURL+"/project");
        int counter = 0;
        try (JsonReader jsonReader = Json.createReader(new StringReader(json))) {
            JsonArray jsonArray = jsonReader.readArray();
            Iterator<JsonValue> iterator = jsonArray.iterator();
            while(iterator.hasNext()){
                
                if(counter > 10){
                    return listOfProjects;
                }
                
                JsonObject jsonObject = (JsonObject) iterator.next();
                
                
                // ID of Project should have at least 8 digits
                Project project = new Project(String.format("%08d", Integer.parseInt(jsonObject.getString("id"))),jsonObject.getString("key"),jsonObject.getString("name"),jsonObject.getString("self"));
                if(jsonObject.getString("key").equals("ABDERA")){
                	 listOfProjects.add(project);
                }
                counter++;
            }
            jsonReader.close();
        }
        return listOfProjects;
    }
    
    /**
     * Get All Issues of a Project according to its key
     * Inside the Issue are fields with some values
     * @param projectKey Key of the project
     * @return List of Issues
     */
    public List<Issue> getAllIssuesOfProject(String projectKey){
    	String url= jiraRestURL+"/search?maxResults=50&jql=project="+projectKey;
        String json = RestClient.get(url);
        //inital test of issues sizing
        JsonReader jsonReader = Json.createReader(new StringReader(json));
        JsonObject jsonObject = jsonReader.readObject();
        int total= jsonObject.getInt("total");
        this.issues.clear();
        this.listOfPersons.clear();
        
        this.getJSON(json);
        if(total>50){
        	for(int i=1; i<(total/50)+1;i++){
        		String newURL=url+"&startAt="+i*50;
        		String newjson = RestClient.get(newURL);
        		this.getJSON(newjson);
        	}
        }
        
        return issues;
    }
    
    public void jql(String jqlQuery, String outputLocation) throws Exception{
        String json = RestClient.get(jiraRestURL+"/search?"+jqlQuery);
        System.out.println("JSON of Reader: "+json);
        this.getJSON(json);
        SimpleGraph graph = new SimpleGraph();
        //this.printHelper();
        graph.createGraphStructure(this, outputLocation);
    }
    
    /**
     * Get the fields of a specific Issue
     * @param issueKey Key of Issue
     * @return List of fields
     */
    public List<String> getListOfFieldEntries(String issueKey){
        List<String> fields = new ArrayList<>();
        Issue issue = this.getIssue(issueKey);
        for(String field : issue.getFields().keySet()){
            fields.add(field);
        }
        return fields;
    }
    
    /**
     * Get the value of a field from a specific Issue
     * @param issueKey Key of Issue
     * @return List of values
     */
    public List<String> getListOfFieldValues(String issueKey){
        List<String> fields = new ArrayList<>();
        Issue issue = this.getIssue(issueKey);
        for(String field : issue.getFields().values()){
            fields.add(field);
        }
        return fields;
    }
    
    /**
     * Initiator for creating the whole graph
     * @throws IOException
     * @throws Exception 
     */
    public void parseFile(String outputLocation, String project) throws IOException, Exception {
            SimpleGraph graph = new SimpleGraph();
            if(project==null)
            	this.getAllProjects();
            else{
            	this.getProject(project);
            }
            //this.printHelper();
            graph.createGraphStructure(this, outputLocation);
        
    }
    
    private List<Project> getProject(String projectName) {
    	String json = RestClient.get(jiraRestURL+"/project");
        int counter = 0;
        try (JsonReader jsonReader = Json.createReader(new StringReader(json))) {
            JsonArray jsonArray = jsonReader.readArray();
            Iterator<JsonValue> iterator = jsonArray.iterator();
            while(iterator.hasNext()){
            	JsonObject jsonObject = (JsonObject) iterator.next();
            	// ID of Project should have at least 8 digits
                Project project = new Project(String.format("%08d", Integer.parseInt(jsonObject.getString("id"))),jsonObject.getString("key"),jsonObject.getString("name"),jsonObject.getString("self"));
                if(jsonObject.getString("key").equals("ABDERA")){
                	 listOfProjects.add(project);
                }
                counter++;
            }
            jsonReader.close();
        }
        return listOfProjects;
	}

	/**
     * Getter for List
     * @return 
     */
    public List<Person> getListOfPersons(){
        return listOfPersons;
    }
    
    /**
     * Helper Method for checking the Persons
     * @param keyEntry Key which will be compared
     * @return true if it's already inside else false
     */
    private boolean alreadyInList(String keyEntry){
        for(Person p : listOfPersons){
            if(p.getKey() == null ? keyEntry == null : p.getKey().equals(keyEntry)){
                return true;
            }
        }
        return false;
    }
    
    /**
     * Helper for get the correct Issue
     * @param issueKey Key of Issue
     * @return Issue
     */
    private Issue getIssue(String issueKey){
        for(Issue i : issues){
            if(i.getKey().equals(issueKey)){
                return i;
            }
        }
        return null;
    }
    
    private void addProjectToList(String json){
        if((json != null) || (!"".equals(json))){
            
        }
    }
    
    private void getJSON(String json){
        // CLEAR LISTS
      
        //this.listOfProjects.clear();
        if((json != null) || (!"".equals(json))){
            try (JsonReader jsonReader = Json.createReader(new StringReader(json))) {
                JsonObject jsonObject = jsonReader.readObject();
                JsonArray issuearray = jsonObject.getJsonArray("issues");
                for(JsonValue value : issuearray){
                    JsonObject valueObj = (JsonObject) value;
                    JsonObject fields = valueObj.getJsonObject("fields");
                    Map<String, String> fieldMap = new HashMap<>();
                    Issue issue = new Issue(String.format("%08d", Integer.parseInt(valueObj.getString("id"))), valueObj.getString("key"), fieldMap);
                    if(!fields.isNull("description")){
                        issue.setDescription(fields.getString("description"));
                    }
//                    if(!fields.isNull("project")){
//                        JsonObject jsonProject = fields.getJsonObject("project");
//                        Project project = new Project(jsonProject.getString("id"), jsonProject.getString("key"), jsonProject.getString("name"), jsonProject.getString("self"));
//                        listOfProjects.add(project);
//                    }
                    if(!fields.isNull("assignee")){
                        JsonObject assignee = fields.getJsonObject("assignee");
                        fieldMap.put("assignee", assignee.getString("key"));
                        Person person = new Person(assignee.getString("name"), assignee.getString("key"), assignee.getString("displayName"),assignee.getString("emailAddress") );
                        if(!this.alreadyInList(assignee.getString("key"))){
                            listOfPersons.add(person);
                        }
                    }
                    if(!fields.isNull("creator")){
                        JsonObject creator = fields.getJsonObject("creator");
                        fieldMap.put("creator", creator.getString("key"));
                        Person creatorperson = new Person(creator.getString("name"), creator.getString("key"), creator.getString("displayName"),creator.getString("emailAddress") );
                        if(!this.alreadyInList(creator.getString("key"))){
                            listOfPersons.add(creatorperson);
                        }
                    }
                    if(!fields.isNull("reporter")){
                        JsonObject reporter = fields.getJsonObject("reporter");
                        fieldMap.put("reporter", reporter.getString("key"));
                        Person reporterperson = new Person(reporter.getString("name"), reporter.getString("key"), reporter.getString("displayName"),reporter.getString("emailAddress") );
                        if(!this.alreadyInList(reporter.getString("key"))){
                            listOfPersons.add(reporterperson);
                        }
                    }

                    JsonObject status = fields.getJsonObject("status");
                    fieldMap.put("status", status.getString("name"));

                                      
                    issues.add(issue);
                }
                jsonReader.close();
                }
            }
    }
    
    /**
     * Just checking the content of the Arrays
     */
    private void printHelper(){
        System.out.println("--------- PERSONS -----------");
        for(Person p : listOfPersons){
            System.out.println("Name: "+p.getName()+" Key: "+p.getKey()+" Display Name: "+p.getDisplayName());
        }
        System.out.println("-----------------------------");
        System.out.println("--------- PROJECTS ----------");
        for(Project p : listOfProjects){
            System.out.println("Project: "+p.getName()+" ID: "+p.getId()+" Key: "+p.getKey());
        }
        System.out.println("-----------------------------");
    }
}
