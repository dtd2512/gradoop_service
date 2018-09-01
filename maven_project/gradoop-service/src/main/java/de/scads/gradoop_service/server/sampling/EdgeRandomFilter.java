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

import org.apache.flink.api.common.functions.FilterFunction;
import org.gradoop.common.model.impl.pojo.Edge;

import java.util.Random;

/**
 * Creates a random value for each vertex and filters those that are below a
 * given threshold.
 *
 * @param <E> EPGM edge type
 */
public class EdgeRandomFilter<E extends Edge>
  implements FilterFunction<E> {
  /**
   * Threshold to decide if a vertex needs to be filtered.
   */
  private final float threshold;
  /**
   * Random instance
   */
  private final Random randomGenerator;

  /**
   * Creates a new filter instance.
   *
   * @param sampleSize relative sample size
   * @param randomSeed random seed (can be {@code} null)
   */
  public EdgeRandomFilter(float sampleSize, long randomSeed) {
    threshold = sampleSize;
    randomGenerator =
      (randomSeed != 0L) ? new Random(randomSeed) : new Random();
  }

  /**
   * {@inheritDoc}
   */
  @Override
  public boolean filter(E edge) throws Exception {
    return randomGenerator.nextFloat() < threshold;
  }
}
