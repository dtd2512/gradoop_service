package de.scads.gradoop_service.server.helper.vertex_fusion;

import java.io.Serializable;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashSet;

import org.gradoop.common.model.impl.id.GradoopId;
import org.gradoop.common.model.impl.id.GradoopIdSet;
import org.gradoop.common.model.impl.pojo.Vertex;
import org.gradoop.common.model.impl.properties.Properties;
import org.gradoop.common.model.impl.properties.PropertyValue;

public class CountValues implements VertexFusionFunction, Serializable{
	
	@Override
	public Vertex apply(ArrayList<Vertex> vertices, String vertexAttribute) {
		Vertex superVertex = new Vertex();
		
		GradoopId superVertexId = GradoopId.get();
		
		Properties properties = new Properties();
		properties.set("count", vertices.size());
		
		GradoopIdSet graphIds = new GradoopIdSet();
		graphIds.add(superVertexId);
		
		boolean firstElement = true;
		
		HashSet<String> labels = new HashSet<String>();
		
		for(Vertex groupItem: vertices) {
			PropertyValue propertyValue = groupItem.getPropertyValue(vertexAttribute);

			long vertexAttributeValue = 0;
			
			// numerical properties passed as LogicalGraph can be passed as long
			if(propertyValue.getByteSize() == 9) {
				vertexAttributeValue = propertyValue.getLong();
			}
			// numerical properties read from disk are likely to be parsed as int
			else if(propertyValue.getByteSize() == 5) {
				vertexAttributeValue = (long)propertyValue.getInt();
			}
			  
			labels.add(groupItem.getLabel());
			
			if(firstElement) {
				superVertex.setId(superVertexId);
				superVertex.setProperties(properties);
				superVertex.setGraphIds(graphIds);
				
				properties.set("clusterId", vertexAttributeValue);
				
				firstElement = false;
			}
		}
		superVertex.setLabel(labels.toString());
		
		return superVertex;
	}
}