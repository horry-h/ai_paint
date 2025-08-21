/**
 * OBJ文件加载器 - 微信小程序适配版
 * 用于解析OBJ文件并创建Three.js几何体
 */

function OBJLoader() {
  this.materials = null;
}

OBJLoader.prototype.load = function(url, onLoad, onProgress, onError) {
  const scope = this;

  wx.request({
    url: url,
    method: 'GET',
    success: function(response) {
      if (response.statusCode === 200) {
        const object = scope.parse(response.data);
        if (onLoad) onLoad(object);
      } else {
        if (onError) onError(new Error(`HTTP ${response.statusCode}`));
      }
    },
    fail: function(error) {
      if (onError) onError(error);
    }
  });
};

OBJLoader.prototype.parse = function(text) {
  const state = {
    objects: [],
    object: {},

    vertices: [],
    normals: [],
    uvs: [],

    materialLibraries: []
  };

  // 扩展state对象的方法
  Object.assign(state, {
    startObject: function(name) {
      const geometry = new THREE.BufferGeometry();
      const material = new THREE.MeshBasicMaterial();

      this.object = {
        name: name || '',
        geometry: geometry,
        material: material
      };

      this.objects.push(this.object);
    },

    finalize: function() {
      if (this.object && this.object.geometry) {
        // 简化处理，不计算法线
      }
    },

    addFace: function(a, b, c, d, ua, ub, uc, ud, na, nb, nc, nd) {
      const ia = this.parseVertexIndex(a);
      const ib = this.parseVertexIndex(b);
      const ic = this.parseVertexIndex(c);
      let id;

      if (d === undefined) {
        this.addVertex(ia, ib, ic);
      } else {
        id = this.parseVertexIndex(d);
        this.addVertex(ia, ib, id);
        this.addVertex(ib, ic, id);
      }
    },

    parseVertexIndex: function(value) {
      const index = parseInt(value);
      return (index >= 0 ? index - 1 : index + this.vertices.length / 3) * 3;
    },

    addVertex: function(a, b, c) {
      const src = this.vertices;
      const dst = this.object.geometry.vertices || [];

      dst.push(src[a], src[a + 1], src[a + 2]);
      dst.push(src[b], src[b + 1], src[b + 2]);
      dst.push(src[c], src[c + 1], src[c + 2]);

      this.object.geometry.vertices = dst;
    }
  });

    if (text.indexOf('\r\n') !== -1) {
      text = text.replace(/\r\n/g, '\n');
    }

    if (text.indexOf('\\\n') !== -1) {
      text = text.replace(/\\\n/g, '');
    }

    const lines = text.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (line.length === 0 || line.charAt(0) === '#') {
        continue;
      }

      const lineFirstChar = line.charAt(0);
      const lineSecondChar = line.charAt(1);

      let lineLength = line.length;

      if (lineFirstChar === 'v') {
        const data = line.split(/\s+/);

        switch (lineSecondChar) {
          case ' ':
          case '\t':
            if (data.length >= 4) {
              state.vertices.push(
                parseFloat(data[1]),
                parseFloat(data[2]),
                parseFloat(data[3])
              );
            }
            break;
          case 'n':
            if (data.length >= 4) {
              state.normals.push(
                parseFloat(data[1]),
                parseFloat(data[2]),
                parseFloat(data[3])
              );
            }
            break;
          case 't':
            if (data.length >= 3) {
              state.uvs.push(
                parseFloat(data[1]),
                parseFloat(data[2])
              );
            }
            break;
        }
      } else if (lineFirstChar === 'f') {
        const lineData = line.substr(1).trim();
        const vertexData = lineData.split(/\s+/);
        const faceVertices = [];

        for (let j = 0, jl = vertexData.length; j < jl; j++) {
          const vertex = vertexData[j];

          if (vertex.length > 0) {
            const vertexParts = vertex.split('/');
            faceVertices.push(vertexParts);
          }
        }

        if (faceVertices.length >= 3) {
          state.addFace(
            faceVertices[0][0], faceVertices[1][0], faceVertices[2][0],
            faceVertices[3] ? faceVertices[3][0] : undefined,
            faceVertices[0][1], faceVertices[1][1], faceVertices[2][1],
            faceVertices[3] ? faceVertices[3][1] : undefined,
            faceVertices[0][2], faceVertices[1][2], faceVertices[2][2],
            faceVertices[3] ? faceVertices[3][2] : undefined
          );
        }
      } else if (lineFirstChar === 'l') {
        const lineData = line.substr(1).trim();
        const vertexData = lineData.split(/\s+/);
        const lineVertices = [];

        for (let j = 0, jl = vertexData.length; j < jl; j++) {
          const vertex = vertexData[j];

          if (vertex.length > 0) {
            const vertexParts = vertex.split('/');
            lineVertices.push(vertexParts);
          }
        }

        if (lineVertices.length >= 2) {
          state.addLineGeometry(lineVertices);
        }
      } else if ((lineFirstChar === 'g' || lineFirstChar === 'o') && (lineSecondChar === ' ' || lineSecondChar === '\t')) {
        const name = line.substr(2).trim();
        state.startObject(name);
      }
    }

    state.finalize();

    const container = new THREE.Group();
    container.materialLibraries = [].concat(state.materialLibraries);

    for (let i = 0, l = state.objects.length; i < l; i++) {
      const object = state.objects[i];
      const geometry = object.geometry;
      const material = object.material;

      if (geometry.vertices.length > 0) {
        const mesh = new THREE.Mesh(geometry, material);
        mesh.name = object.name;
        container.add(mesh);
      }
    }

    return container;
  };
};

// 导出OBJLoader
if (typeof module !== 'undefined' && module.exports) {
  module.exports = OBJLoader;
}

// 如果THREE对象存在，将OBJLoader添加到THREE中
if (typeof THREE !== 'undefined') {
  THREE.OBJLoader = OBJLoader;
}
