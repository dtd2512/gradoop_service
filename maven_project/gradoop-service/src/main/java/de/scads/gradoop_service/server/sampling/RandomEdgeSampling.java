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
 * along with Gradoop. If not, see <http://www.gnu.org/licenses/>.
 */

package de.scads.gradoop_service.server.sampling;

import org.apache.flink.api.java.DataSet;
import org.gradoop.common.model.impl.pojo.Edge;
import org.gradoop.flink.model.api.epgm.LogicalGraph;
import org.gradoop.flink.model.api.operators.UnaryGraphToGraphOperator;

/**
 * Takes a logical graph and a user defined aggregate function as input. The
 * aggregate function is applied on the logical graph and the resulting
 * aggregate is stored as an additional property at the result graph.
 */
public class RandomEdgeSampling implements UnaryGraphToGraphOperator {
  /**
   * relative amount of nodes in the result graph
   */
  private final float sampleSize;

  /**
   * seed for the random number generator
   * if no seed is null, the random generator is created without seed
   */
  private final long randomSeed;

  /**
   * Creates new RandomNodeSampling instance.
   *
   * @param sampleSize relative preprocess size
   */
  public RandomEdgeSampling(float sampleSize) {
    this(sampleSize, 0L);
  }

  /**
   * Creates new RandomNodeSampling instance.
   *
   * @param sampleSize relative preprocess size
   * @param randomSeed random seed value (can be {@code null})
   */
  public RandomEdgeSampling(float sampleSize, long randomSeed) {
    this.sampleSize = sampleSize;
    this.randomSeed = randomSeed;
  }

  /**
   * {@inheritDoc}
   */
  @Override
  public LogicalGraph execute(LogicalGraph graph) {
    DataSet<Edge> newEdges = graph.getEdges()
            .filter(new EdgeRandomFilter<>(sampleSize,randomSeed));

//    DataSet<Vertex> newVertices1 = graph.getVertices()
//            .join(newEdges)
//            .where(new Id<>())
//            .equalTo(new SourceId<>())
//            .with(new LeftSide<>());
//
//    DataSet<Vertex> newVertices2 = graph.getVertices()
//            .join(newEdges)
//            .where(new Id<>())
//            .equalTo(new TargetId<>())
//            .with(new LeftSide<>());
//
//    DataSet<Vertex> newVertices= newVertices1.union(newVertices2);
//      LogicalGraph g2 = new GradoopLabelPropagation(100,"id").execute(graph);
//      try {
//          g2.getVertices().print();
//      } catch (Exception e) {
//          e.printStackTrace();
//      }


      return graph.getConfig().getLogicalGraphFactory().fromDataSets(graph.getVertices(), newEdges);
  }

  /**
   * {@inheritDoc}
   */
  @Override
  public String getName() {
    return RandomEdgeSampling.class.getName();
  }
}
