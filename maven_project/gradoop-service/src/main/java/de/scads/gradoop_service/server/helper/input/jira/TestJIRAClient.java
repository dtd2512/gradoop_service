package de.scads.gradoop_service.server.helper.input.jira;

import java.io.IOException;

public class TestJIRAClient {

	public static void main(String[] args) throws IOException, Exception{
		 JsonRestReader reader = new JsonRestReader("https://issues.apache.org/jira/rest/api/2");
		    reader.parseFile("src/main/webapp/data/abdera_jira", "ABDERA");
	}
}
