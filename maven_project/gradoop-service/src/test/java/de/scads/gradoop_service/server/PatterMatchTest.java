package de.scads.gradoop_service.server;

import de.scads.gradoop_service.server.helper.GraphHelper;
import de.scads.gradoop_service.server.helper.PatternMatchingHelper;
import de.scads.gradoop_service.server.helper.ServiceHelper;
import de.scads.gradoop_service.server.helper.filtering.FilteringHelper;
import de.scads.gradoop_service.server.helper.linking.LinkingHelper;

import org.gradoop.common.model.impl.pojo.Edge;
import org.gradoop.flink.io.impl.json.JSONDataSource;
import org.gradoop.flink.model.api.epgm.LogicalGraph;
import org.junit.Test;

import static org.junit.Assert.assertTrue;

import java.util.List;

public class PatterMatchTest {

   
	String pattern= "{\r\n\t\"types\": [\r\n\t\t{\r\n\t\t\t\"uri\": \"Person\",\r\n\t\t\t\"id\": \"5\",\r\n\t\t\t\"included\": true,\r\n\t\t\t\"propFilter\": [\r\n\t\t\t\t{\r\n\t\t\t\t\t\"prop\": \"name\",\r\n\t\t\t\t\t\"comparison\": \"equal\",\r\n\t\t\t\t\t\"value\": \"Eve\"\r\n\t\t\t\t}\r\n\t\t\t]\r\n\t\t},\r\n\t\t{\r\n\t\t\t\"uri\": \"Tag\",\r\n\t\t\t\"id\": \"4\",\r\n\t\t\t\"included\": false,\r\n\t\t\t\"propFilter\": [\r\n\t\t\t\t{\r\n\t\t\t\t\t\"prop\": \"name\",\r\n\t\t\t\t\t\"comparison\": \"equal\",\r\n\t\t\t\t\t\"value\": \"Databases\"\r\n\t\t\t\t}\r\n\t\t\t]\r\n\t\t}\r\n\t],\r\n\t\"edges\": [\r\n\t\t{\r\n\t\t\t\"auri\": \"Person\",\r\n\t\t\t\"uri\": \"hasInterest\",\r\n\t\t\t\"buri\": \"Tag\"\r\n\t\t}\r\n\t]\r\n}\r\n";
    @Test
    public void test() throws Exception {

        ServiceHelper.getConfig().getExecutionEnvironment().setParallelism(1);

        String file = PatterMatchTest.class.getResource("/data/testdata").getFile();

        JSONDataSource source = new JSONDataSource(file, ServiceHelper.getConfig());

        LogicalGraph graph = source.getLogicalGraph();

        LogicalGraph result= PatternMatchingHelper.runPatternMatching(graph, pattern);
        
      System.out.println( result.getVertices().count()); 
        
        
    }
    
    /**
     * Test with comparision
     */
    String pattern2 = "{\r\n\t\"types\": [\r\n\t\t{\r\n\t\t\t\"uri\": \"Person\",\r\n\t\t\t\"id\": \"1\",\r\n\t\t\t\"included\": true,\r\n\t\t\t\"propFilter\": [\r\n\t\t\t\t{\r\n\t\t\t\t\t\"prop\": \"age\",\r\n\t\t\t\t\t\"comparison\": \"expression\",\r\n\t\t\t\t\t\"value\": \">10\"\r\n\t\t\t\t}\r\n\t\t\t]\r\n\t\t}\r\n\t],\r\n\t\"edges\": []\r\n}";
    @Test
    public void testComparison() throws Exception {
    	ServiceHelper.setLocalExecution();
        ServiceHelper.getConfig().getExecutionEnvironment().setParallelism(1);

        String file = PatterMatchTest.class.getResource("/data/testdata").getFile();

        JSONDataSource source = new JSONDataSource(file, ServiceHelper.getConfig());

        LogicalGraph graph = source.getLogicalGraph();

        LogicalGraph result= PatternMatchingHelper.runPatternMatching(graph, pattern2);
        
      System.out.println( result.getVertices().count()); 
        
        
    }
    
    String pattern3="{\r\n\t\"types\": [\r\n\t\t{\r\n\t\t\t\"uri\": \"Person\",\r\n\t\t\t\"id\": \"1\",\r\n\t\t\t\"included\": true,\r\n\t\t\t\"propFilter\": [\r\n\t\t\t\t{\r\n\t\t\t\t\t\"prop\": \"age\",\r\n\t\t\t\t\t\"comparison\": \"expression\",\r\n\t\t\t\t\t\"value\": \">=10\"\r\n\t\t\t\t}\r\n\t\t\t]\r\n\t\t}\r\n\t],\r\n\t\"edges\": []\r\n}";
    @Test
    public void testComparisonGreaterEqual() throws Exception {
    	ServiceHelper.setLocalExecution();
        ServiceHelper.getConfig().getExecutionEnvironment().setParallelism(1);

        String file = PatterMatchTest.class.getResource("/data/testdata").getFile();

        JSONDataSource source = new JSONDataSource(file, ServiceHelper.getConfig());

        LogicalGraph graph = source.getLogicalGraph();

        LogicalGraph result= PatternMatchingHelper.runPatternMatching(graph, pattern3);
        
      System.out.println( result.getVertices().count()); 
        
        
    }
    
    /**
     * multiple attributes..
     */
    
    String pattern4="{\r\n\t\"types\": [\r\n\t\t{\r\n\t\t\t\"uri\": \"Person\",\r\n\t\t\t\"id\": \"3\",\r\n\t\t\t\"included\": true,\r\n\t\t\t\"propFilter\": [\r\n\t\t\t\t{\r\n\t\t\t\t\t\"prop\": \"age\",\r\n\t\t\t\t\t\"comparison\": \"expression\",\r\n\t\t\t\t\t\"value\": \">21\"\r\n\t\t\t\t},\r\n\t\t\t\t{\r\n\t\t\t\t\t\"prop\": \"gender\",\r\n\t\t\t\t\t\"comparison\": \"equal\",\r\n\t\t\t\t\t\"value\": \"f\"\r\n\t\t\t\t}\r\n\t\t\t]\r\n\t\t}\r\n\t],\r\n\t\"edges\": []\r\n}";
    @Test
    public void testComparisoMulitpleAttributes() throws Exception {
    	ServiceHelper.setLocalExecution();
        ServiceHelper.getConfig().getExecutionEnvironment().setParallelism(1);

        String file = PatterMatchTest.class.getResource("/data/testdata").getFile();

        JSONDataSource source = new JSONDataSource(file, ServiceHelper.getConfig());

        LogicalGraph graph = source.getLogicalGraph();

        LogicalGraph result= PatternMatchingHelper.runPatternMatching(graph, pattern4);
        
         long resultCount = result.getVertices().count();
         assertTrue(resultCount==2);
      System.out.println( resultCount); 
        
        
    }
    
    
    @Test
    public void testCypherExecute() throws Exception{
    	ServiceHelper.getConfig().getExecutionEnvironment().setParallelism(1);

        String file = PatterMatchTest.class.getResource("/data/testdata").getFile();

        JSONDataSource source = new JSONDataSource(file, ServiceHelper.getConfig());

        LogicalGraph graph = source.getLogicalGraph();

       String  query= "MATCH (Person:Person)-[:hasInterest]->(Tag:Tag) (Forum:Forum)-[:hasTag]->(Tag:Tag) WHERE Person.name=\"Eve\"";
        LogicalGraph result= PatternMatchingHelper.runCyperQuery(graph, query);
        
      System.out.println( result.getVertices().count()); 
    }
    
  
}
