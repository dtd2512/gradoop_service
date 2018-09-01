package de.scads.gradoop_service.server.helper.input.jira;

import com.sun.jersey.api.client.Client;
import com.sun.jersey.api.client.ClientResponse;
import com.sun.jersey.api.client.WebResource;
/**
 *
 * @author john.nguyen
 */
public class RestClient {	
	
	private static Client client = Client.create();
	private final static String MEDIA_TYPE = "application/json";
	
	public static String get(String url) 
	{
		WebResource webResource = client.resource(url);
	
		ClientResponse response = webResource.accept(MEDIA_TYPE).get(ClientResponse.class);
	
		/*if (response.getStatus() != 200) {
			throw new RuntimeException("Failed : HTTP error code : " + response.getStatus());
		}*/

		return response.getEntity(String.class);
	}
	
}

