package de.scads.gradoop_service.server.helper.gelly.io;

import org.apache.flink.api.java.DataSet;
import org.apache.flink.graph.Edge;
import org.apache.flink.graph.Graph;
import org.apache.flink.graph.Vertex;
import org.gradoop.common.model.impl.id.GradoopId;
import org.gradoop.flink.model.api.epgm.LogicalGraph;


public class GradoopToGellyGraph<VV extends Comparable, EV extends Comparable> {

    private final Class<VV> protoVertexValue;
    private final Class<EV> protoEdgeValue;

    public GradoopToGellyGraph(Class<VV> protoVertexValue, Class<EV> protoEdgeValue) {
        this.protoVertexValue = protoVertexValue;
        this.protoEdgeValue = protoEdgeValue;
    }

    @SuppressWarnings("unchecked")
    public Graph<GradoopId, VV, EV> transform(LogicalGraph graph) {
//        Vertex<GradoopId, VV> vertexTypeIdent = new Vertex<>();
//        TypeInformation vertexSetType = TypeExtractor.createTypeInfo(vertexTypeIdent.getClass());
//        TypeInformation vertexSetType = TypeInformation.of(vertexTypeIdent.getClass());
//        TypeInformation vertexSetType = TypeInformation.of(Vertex.class);
//        TypeInformation vertexSetType = TypeExtractor.createTypeInfo(Vertex.class, vertexTypeIdent.getClass(), 1, null, null);

        DataSet<Vertex<GradoopId, VV>> vertices = graph
                .getVertices()
                .map(new GenericVertexToGellyVertexMapper<>(protoVertexValue))
//                        .returns(vertexSetType)
                ;

//        Edge<GradoopId, EV> edgeTypeIdent = new Edge<>();
//        TypeInformation edgeSetType = TypeExtractor.createTypeInfo(edgeTypeIdent.getClass());
        DataSet<Edge<GradoopId, EV>> edges = graph
                .getEdges()
                .map(new GenericEdgeToGellyEdgeMapper<>(protoEdgeValue))
//                .returns(edgeSetType)
                ;

        return Graph.fromDataSet(vertices, edges, graph.getConfig().getExecutionEnvironment());
    }

}
