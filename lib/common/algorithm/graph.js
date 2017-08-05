"use strict";
/**
 * ts-util / graph
 * @author Wang Guan <momocraft@gmail.com>
 *
 * TODO freeze API / test
 */
class DirectedGraph {
    constructor() {
        this.vertices = new Map();
        this.edges = [];
    }
    addVertice(v) {
        if (this.containsV(v)) {
            throw new RangeError(`Vertex of id=${v.id} already existed.`);
        }
        this.vertices.set(v.id, v);
    }
    addEdge(edge) {
        if (!this.containsVbyId(edge.from)) {
            throw new RangeError(`Vertex of id=${edge.from} not found`);
        }
        else if (!this.containsVbyId(edge.to)) {
            throw new RangeError(`Vertex of id=${edge.to} not found`);
        }
        this.edges.push(edge);
    }
    containsV(vertice) {
        return vertice.id in this.vertices;
    }
    edgesFrom(vertice) {
        return this.edges.filter(e => e.from === vertice.id);
    }
    edgesTo(vertice) {
        return this.edges.filter(e => e.to === vertice.id);
    }
    containsVbyId(vertex_id) {
        return this.vertices.has(vertex_id);
    }
}
//# sourceMappingURL=graph.js.map