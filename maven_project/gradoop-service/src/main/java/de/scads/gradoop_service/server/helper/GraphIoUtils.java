package de.scads.gradoop_service.server.helper;

import org.gradoop.flink.io.impl.dot.DOTDataSink;
import org.gradoop.flink.io.impl.json.JSONDataSink;
import org.gradoop.flink.model.api.epgm.LogicalGraph;
import org.gradoop.flink.util.GradoopFlinkConfig;

import java.io.IOException;

/**
 * This class contains several static methods for easier handling of common IO operations in GRETL.
 */
public class GraphIoUtils {
    /**
     * Simple helper for .dot file writing
     *
     * @param graph - the graph to be saved as .dot file
     * @param path  - the path to the resulting .dot file
     * @throws IOException - if something during the write operation fails
     */
    public static void writeDot(LogicalGraph graph, String path) throws IOException {
        DOTDataSink sink = new DOTDataSink(path, false);
        sink.write(graph, true);
    }

    /**
     * Simple helper for .json file writing
     *
     * @param graph  - the graph to be saved as .dot file
     * @param path   - the path to the resulting .dot file
     * @param config - the used config
     * @throws IOException - if something during the write operation fails
     */
    public static void writeJson(LogicalGraph graph, String path, GradoopFlinkConfig config) throws IOException {
        JSONDataSink sink = new JSONDataSink(path, config);
        sink.write(graph, true);
    }
}
