package de.scads.gradoop_service.server;

import de.scads.gradoop_service.server.helper.ServiceHelper;
import org.codehaus.jettison.json.JSONArray;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;
import org.junit.After;
import org.junit.Before;
import org.junit.Ignore;
import org.junit.Test;

import javax.ws.rs.core.Response;
import java.util.ArrayList;
import java.util.List;
import java.util.function.Function;

import static org.junit.Assert.*;

public class CypherTest {

    /**
     * The test query.
     */
    private static final String query = "MATCH (p1:Person)-[:hasInterest]->(t:Tag) " +
            " (p2:Person)-[:hasInterest]->(t) WHERE p1<>p2";

    /**
     * The test construction pattern.
     */
    private static final String constPattern = "(p1)-[e:commonInterest]->(p2)";

    /**
     * The test graph name.
     */
    private static final String testGraph = "testdata";
    /**
     * A function getting the ID for nodes.
     */
    private final Function<JSONObject, String> toId = e -> {
        try {
            return ((String) ((JSONObject) e.get("data")).get("id"));
        } catch (JSONException e1) {
            throw new RuntimeException(e1);
        }
    };
    /**
     * A function getting source- and target ID for edges.
     */
    private final Function<JSONObject, String> toSourceTarget = e -> {
        try {
            JSONObject data = (JSONObject) e.get("data");
            return ((String) data.get("source")) + "-->" + ((String) data.get("target"));
        } catch (JSONException e1) {
            throw new RuntimeException(e1);
        }
    };
    /**
     * The RequestHandler to test.
     */
    private RequestHandler handler;

    @Before
    public void init() {
        ServiceHelper.setLocalExecution();
        handler = new RequestHandler();
        handler.init();
    }

    @After
    public void teardown() {
        handler = null;
    }

    /**
     * Test a simple cypher query.
     *
     * @throws Exception
     */
    @Test
    public void testCypher() throws Exception {
        Response response = handler.cypherQuery(testGraph, null, query, "on", "");
        assertEquals(200, response.getStatus());
        assertNotNull(response.getEntity());
        JSONObject expected = new JSONObject(
                "{\"type\":\"graph\",\"graphs\":[{\"id\":\"5a786f009ececf2ed4b1b76c\",\"label\":\"\",\"prop" +
                        "erties\":{}}],\"nodes\":[{\"data\":{\"id\":\"000000000000000000000002\",\"label\":\"Perso" +
                        "n\",\"properties\":{\"locIP\":\"127.0.0.1\",\"gender\":\"m\",\"city\":\"Berlin\",\"name\"" +
                        ":\"Frank\",\"age\":\"35\"}}},{\"data\":{\"id\":\"000000000000000000000008\",\"label\":\"P" +
                        "erson\",\"properties\":{\"gender\":\"f\",\"city\":\"Dresden\",\"speaks\":\"English\",\"na" +
                        "me\":\"Eve\",\"age\":\"35\"}}},{\"data\":{\"id\":\"000000000000000000000003\",\"label\":" +
                        "\"Tag\",\"properties\":{\"name\":\"Databases\"}}},{\"data\":{\"id\":\"0000000000000000000" +
                        "00000\",\"label\":\"Person\",\"properties\":{\"gender\":\"m\",\"city\":\"Dresden\",\"name" +
                        "\":\"Dave\",\"age\":\"40\"}}},{\"data\":{\"id\":\"000000000000000000000001\",\"label\":\"" +
                        "Tag\",\"properties\":{\"name\":\"Hadoop\"}}},{\"data\":{\"id\":\"000000000000000000000006" +
                        "\",\"label\":\"Person\",\"properties\":{\"gender\":\"f\",\"city\":\"Leipzig\",\"name\":\"" +
                        "Alice\",\"age\":\"20\"}}}],\"edges\":[{\"data\":{\"source\":\"000000000000000000000000\"," +
                        "\"target\":\"000000000000000000000001\",\"id\":\"00000000000000000100000b\",\"label\":\"h" +
                        "asInterest\",\"properties\":{}}},{\"data\":{\"source\":\"000000000000000000000002\",\"tar" +
                        "get\":\"000000000000000000000001\",\"id\":\"00000000000000000100000e\",\"label\":\"hasInt" +
                        "erest\",\"properties\":{}}},{\"data\":{\"source\":\"000000000000000000000008\",\"target\"" +
                        ":\"000000000000000000000003\",\"id\":\"000000000000000001000007\",\"label\":\"hasInterest" +
                        "\",\"properties\":{}}},{\"data\":{\"source\":\"000000000000000000000006\",\"target\":\"00" +
                        "0000000000000000000003\",\"id\":\"000000000000000001000017\",\"label\":\"hasInterest\",\"" +
                        "properties\":{}}}]}");
        JSONObject responseGraph = new JSONObject(response.getEntity().toString());
        testForElementIds(expected, responseGraph);
    }

    /**
     * Test a simple construction pattern with the same query.
     *
     * @throws Exception
     */
    @Test
    public void testConstructionPattern() throws Exception {
        Response response = handler.cypherQuery(testGraph, null, query, "on", constPattern);
        assertEquals(200, response.getStatus());
        assertNotNull(response.getEntity());
        JSONObject expected = new JSONObject(
                "{\"type\":\"graph\",\"graphs\":[{\"id\":\"5a7876f39ececf2ed4b1b772\",\"label\":\"\",\"prope" +
                        "rties\":{}}],\"nodes\":[{\"data\":{\"id\":\"000000000000000000000000\",\"label\":\"Person\"" +
                        ",\"properties\":{\"gender\":\"m\",\"city\":\"Dresden\",\"name\":\"Dave\",\"age\":\"40\"}}}" +
                        ",{\"data\":{\"id\":\"000000000000000000000006\",\"label\":\"Person\",\"properties\":{\"gen" +
                        "der\":\"f\",\"city\":\"Leipzig\",\"name\":\"Alice\",\"age\":\"20\"}}},{\"data\":{\"id\":\"" +
                        "000000000000000000000002\",\"label\":\"Person\",\"properties\":{\"locIP\":\"127.0.0.1\",\"" +
                        "gender\":\"m\",\"city\":\"Berlin\",\"name\":\"Frank\",\"age\":\"35\"}}},{\"data\":{\"id\":" +
                        "\"000000000000000000000008\",\"label\":\"Person\",\"properties\":{\"gender\":\"f\",\"city" +
                        "\":\"Dresden\",\"speaks\":\"English\",\"name\":\"Eve\",\"age\":\"35\"}}}],\"edges\":[{\"da" +
                        "ta\":{\"source\":\"000000000000000000000000\",\"target\":\"000000000000000000000002\",\"id" +
                        "\":\"5a7876f49ececf2ed4b1b779\",\"label\":\"commonInterest\",\"properties\":{}}},{\"data\"" +
                        ":{\"source\":\"000000000000000000000002\",\"target\":\"000000000000000000000000\",\"id\":\"" +
                        "5a7876f49ececf2ed4b1b775\",\"label\":\"commonInterest\",\"properties\":{}}},{\"data\":{\"s" +
                        "ource\":\"000000000000000000000008\",\"target\":\"000000000000000000000006\",\"id\":\"5a78" +
                        "76f49ececf2ed4b1b777\",\"label\":\"commonInterest\",\"properties\":{}}},{\"data\":{\"sourc" +
                        "e\":\"000000000000000000000006\",\"target\":\"000000000000000000000008\",\"id\":\"5a7876f4" +
                        "9ececf2ed4b1b773\",\"label\":\"commonInterest\",\"properties\":{}}}]}");
        JSONObject responseGraph = new JSONObject(response.getEntity().toString());
        testForElementIds(expected, responseGraph);
    }

    /**
     * Check if two graphs are equal by comparing their node- and edge-sets.
     *
     * @param expected The expected graph.
     * @param actual   The actual graph.
     * @throws JSONException
     */
    private void testForElementIds(JSONObject expected, JSONObject actual) throws JSONException {
        Object[] expectedNodes = toList((JSONArray) expected.get("nodes")).stream()
                .map(toId).sorted().toArray();
        Object[] actualNodes = toList((JSONArray) actual.get("nodes")).stream()
                .map(toId).sorted().toArray();
        assertArrayEquals("Node sets not equal.", expectedNodes, actualNodes);
        Object[] expectedEdges = toList((JSONArray) expected.get("edges")).stream()
                .map(toSourceTarget).sorted().toArray();
        Object[] actualEdges = toList((JSONArray) actual.get("edges")).stream()
                .map(toSourceTarget).sorted().toArray();
        assertArrayEquals("Edge sets not equal.", expectedEdges, actualEdges);
    }

    /**
     * Convert a JSONArray to a List of JSONObjects (assuming the array only contains JSONObjects).
     *
     * @param array The input array.
     * @return A List of JSONObjects.
     * @throws JSONException
     */
    private List<JSONObject> toList(JSONArray array) throws JSONException {
        List<JSONObject> objs = new ArrayList<>();
        for (int i = 0; i < array.length(); i++) {
            objs.add((JSONObject) array.get(i));
        }
        return objs;
    }
}
