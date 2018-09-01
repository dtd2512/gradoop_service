/*
 * This file is part of Gradoop.
 *
 * Gradoop is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Gradoop is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Gradoop.  If not, see <http://www.gnu.org/licenses/>.
 */

package de.scads.gradoop_service.server;

import de.scads.gradoop_service.server.helper.ServiceHelper;
import org.apache.commons.cli.*;
import org.glassfish.grizzly.http.server.CLStaticHttpHandler;
import org.glassfish.grizzly.http.server.HttpHandler;
import org.glassfish.grizzly.http.server.HttpServer;
import org.glassfish.grizzly.http.server.StaticHttpHandler;
import org.glassfish.jersey.grizzly2.httpserver.GrizzlyHttpServerFactory;
import org.glassfish.jersey.media.multipart.MultiPartFeature;
import org.glassfish.jersey.server.ResourceConfig;

import javax.ws.rs.core.UriBuilder;
import java.io.IOException;
import java.net.URI;

/**
 * Basic class, used for starting and stopping the server.
 */
public class Server {

    private static final int DEFAULT_PORT = 2342;
    private static final String DEFAULT_BASE_URI = "http://localhost/gradoop-service/";
    /**
     * Path to demo application
     */
    private static final String APPLICATION_PATH = "index.html";


    
    /**
     * Starts the server and adds the request handlers.
     *
     * @param localMode true if local execution, false otherwise
     * @return the running server
     * @throws IOException if server creation fails
     */
    private static HttpServer startServer(boolean localMode, URI uri) throws IOException {
        System.out.println("Starting grizzly...");

        if (localMode) {
            System.out.println("Setting local Environment...");
        	   ServiceHelper.setLocalExecution();
        }

        ResourceConfig rc = new ResourceConfig()
                .packages("de/scads/gradoop_service/server")
                .register(MultiPartFeature.class);

        HttpServer server = GrizzlyHttpServerFactory.createHttpServer(uri, rc);

        // CLStaticHttpHandler has to be used for execution from a jar file
        HttpHandler handler = new StaticHttpHandler("src/main/webapp/");
        server.getServerConfiguration().addHttpHandler(handler, "/gradoop-service");

        return server;
    }

    private static Options getOptions() {
        // create Options object
        Options options = new Options();

        // add options
        options.addOption("h", "help", false, "prints the help")
                .addOption("l","localMode", false, "sets local mode")
                .addOption("u","uri", true , "the base URI, default: " + DEFAULT_BASE_URI)
                .addOption("p","port", true, "the application port, default: " + DEFAULT_PORT);

        return options;
    }

    /**
     * Main method. Run this to start the server.
     *
     * @param args command line parameters
     * @throws IOException if server creation fails
     */
    public static void main(String[] args) throws IOException {
        Options opt = getOptions();

        // create the parser
        CommandLineParser parser = new DefaultParser();
        try {
            // parse the command line arguments
            CommandLine line = parser.parse( opt, args );

            if(line.hasOption("h")) {
                // automatically generate the help statement
                HelpFormatter formatter = new HelpFormatter();
                formatter.printHelp( "java -jar PathToJarFile [options]", opt );
                return;
            }

            boolean localMode = line.hasOption("l");

            int port = line.hasOption("port") ? Integer.parseInt(line.getOptionValue("port")) : DEFAULT_PORT;
            String uriStringRest = line.hasOption("uri") ? line.getOptionValue("uri") + "rest/" : DEFAULT_BASE_URI + "rest/";
            String uriString = line.hasOption("uri") ? line.getOptionValue("uri") : DEFAULT_BASE_URI;
            URI uriRest = UriBuilder.fromUri(uriStringRest).port(port).build();
            URI uri = UriBuilder.fromUri(uriString).port(port).build();

            System.out.printf("Gradoop Service about to start at %s%s%n", uri, APPLICATION_PATH);
            
            System.out.println("To start in local mode pass \"-l true\" as command line argument");

            HttpServer httpServer = startServer(localMode, uriRest);
            

            System.out.printf("Gradoop Service started at %s%s%n Press any key to stop it.%n", uri, APPLICATION_PATH);

            System.in.read();
            httpServer.shutdownNow();
        }
        catch( ParseException exp ) {
            // oops, something went wrong
            System.err.println( "Parsing failed.  Reason: " + exp.getMessage() );
        }
    }
}
