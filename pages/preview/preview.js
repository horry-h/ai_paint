// pages/preview/preview.js
// 引入Three.js weapp版本
let THREE;

// 尝试多种方式加载THREE
try {
  // 方法1: 直接require
  THREE = require('../../assets/libs/three.weapp.min.js')
  console.log('Method 1 - THREE loaded:', THREE)
} catch (error) {
  console.log('Method 1 failed:', error)
  try {
    // 方法2: 尝试获取全局THREE
    THREE = global.THREE || this.THREE
    console.log('Method 2 - THREE from global:', THREE)
  } catch (error2) {
    console.log('Method 2 failed:', error2)
    THREE = null
  }
}

// 检查THREE是否正确加载
if (THREE && THREE.global) {
  console.log('THREE.global found:', THREE.global)
  
  // 创建简化的OBJLoader
  function SimpleOBJLoader() {
    this.materials = null;
  }
  
  SimpleOBJLoader.prototype.load = function(url, onLoad, onProgress, onError) {
    const scope = this;
    let retryCount = 0;
    const maxRetries = 3;
    
    function makeRequest() {
      console.log(`尝试加载模型 (第${retryCount + 1}次):`, url);
      
      wx.request({
        url: url,
        method: 'GET',
        timeout: 10000, // 10秒超时
        success: function(response) {
          console.log('网络请求成功:', response.statusCode);
          if (response.statusCode === 200) {
            const object = scope.parse(response.data);
            if (onLoad) onLoad(object);
          } else {
            console.error('HTTP错误:', response.statusCode);
            if (onError) onError(new Error(`HTTP ${response.statusCode}`));
          }
        },
        fail: function(error) {
          console.error('网络请求失败:', error);
          retryCount++;
          if (retryCount < maxRetries) {
            console.log(`重试加载 (${retryCount}/${maxRetries})`);
            setTimeout(makeRequest, 1000 * retryCount); // 递增延迟
          } else {
            console.error('达到最大重试次数，加载失败');
            if (onError) onError(error);
          }
        }
      });
    }
    
    makeRequest();
  };
  
  SimpleOBJLoader.prototype.parse = function(text) {
    console.log('开始解析OBJ文件，数据长度:', text.length);
    
    // 改进的OBJ解析器
    const lines = text.split('\n');
    const vertices = [];
    const normals = [];
    const uvs = [];
    const faces = [];
    
    console.log('OBJ文件总行数:', lines.length);
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line || line.startsWith('#')) continue;
      
      const parts = line.split(/\s+/);
      const type = parts[0];
      
      switch (type) {
        case 'v': // 顶点
          if (parts.length >= 4) {
            vertices.push([
              parseFloat(parts[1]),
              parseFloat(parts[2]),
              parseFloat(parts[3])
            ]);
          }
          break;
          
        case 'vn': // 法线
          if (parts.length >= 4) {
            normals.push([
              parseFloat(parts[1]),
              parseFloat(parts[2]),
              parseFloat(parts[3])
            ]);
          }
          break;
          
        case 'vt': // 纹理坐标
          if (parts.length >= 3) {
            uvs.push([
              parseFloat(parts[1]),
              parseFloat(parts[2])
            ]);
          }
          break;
          
        case 'f': // 面
          if (parts.length >= 4) {
            const face = [];
            for (let j = 1; j < parts.length; j++) {
              const vertexData = parts[j].split('/');
              const vertexIndex = parseInt(vertexData[0]) - 1;
              face.push(vertexIndex);
            }
            faces.push(face);
          }
          break;
      }
    }
    
    console.log('解析结果:', {
      vertices: vertices.length,
      normals: normals.length,
      uvs: uvs.length,
      faces: faces.length
    });
    
    if (vertices.length === 0 || faces.length === 0) {
      console.error('OBJ文件解析失败：没有找到顶点或面数据');
      throw new Error('Invalid OBJ file: no vertices or faces found');
    }
    
    // 创建几何体
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    const normalsArray = [];
    const uvsArray = [];
    
    // 处理面数据
    for (let i = 0; i < faces.length; i++) {
      const face = faces[i];
      if (face.length >= 3) {
        // 三角化多边形面
        for (let j = 0; j < face.length - 2; j++) {
          const v1 = vertices[face[0]];
          const v2 = vertices[face[j + 1]];
          const v3 = vertices[face[j + 2]];
          
          // 添加顶点位置
          positions.push(v1[0], v1[1], v1[2]);
          positions.push(v2[0], v2[1], v2[2]);
          positions.push(v3[0], v3[1], v3[2]);
          
          // 添加法线（如果有的话）
          if (normals.length > 0) {
            const n1 = normals[face[0]] || [0, 1, 0];
            const n2 = normals[face[j + 1]] || [0, 1, 0];
            const n3 = normals[face[j + 2]] || [0, 1, 0];
            normalsArray.push(n1[0], n1[1], n1[2]);
            normalsArray.push(n2[0], n2[1], n2[2]);
            normalsArray.push(n3[0], n3[1], n3[2]);
          }
          
          // 添加纹理坐标（如果有的话）
          if (uvs.length > 0) {
            const uv1 = uvs[face[0]] || [0, 0];
            const uv2 = uvs[face[j + 1]] || [0, 0];
            const uv3 = uvs[face[j + 2]] || [0, 0];
            uvsArray.push(uv1[0], uv1[1]);
            uvsArray.push(uv2[0], uv2[1]);
            uvsArray.push(uv3[0], uv3[1]);
          }
        }
      }
    }
    
    // 设置几何体属性
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    
    if (normalsArray.length > 0) {
      geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normalsArray, 3));
    } else {
      geometry.computeVertexNormals();
    }
    
    if (uvsArray.length > 0) {
      geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvsArray, 2));
    }
    
    console.log('几何体创建完成:', {
      positionCount: positions.length / 3,
      normalCount: normalsArray.length / 3,
      uvCount: uvsArray.length / 2
    });
    
    // 创建材质和网格
    const material = new THREE.MeshBasicMaterial({ 
      color: 0x8B4513, // 木色
      side: THREE.DoubleSide
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    const group = new THREE.Group();
    group.add(mesh);
    
    console.log('OBJ解析完成，返回模型组');
    return group;
  };
  
  // 将简化的OBJLoader附加到THREE对象
  THREE.OBJLoader = SimpleOBJLoader;
  console.log('SimpleOBJLoader created and attached to THREE');
  
} else {
  console.error('THREE not properly loaded or missing global property')
  // 尝试备用方案：直接使用全局变量
  try {
    THREE = getApp().THREE || global.THREE
    console.log('Fallback - THREE from app/global:', THREE)
  } catch (fallbackError) {
    console.error('All THREE loading methods failed:', fallbackError)
  }
}

Page({
  data: {
    image: '',
    aiGeneratedColor: '',
    styleName: '',
    sizeName: '',
    matName: '',
    price: 0,
    rotationY: 0,
    rotationX: 0,
    isLoading: true,
    loadError: false,
    modelLoaded: false, // 新增：标记模型是否成功加载
    autoRotate: false,
    webglSupported: true,
    showTouchHint: true,
    canvasId: ''
  },

  // 防止重复加载的标志
  isModelLoading: false,

  // 触摸控制相关变量
  touchStartX: 0,
  touchStartY: 0,
  isTouching: false,
  lastTouchX: 0,
  lastTouchY: 0,
  lastTapTime: 0,

  // 场景相关变量
  scene: null,
  camera: null,
  renderer: null,
  model: null,
  controls: null,
  animationId: null,

  onLoad(options) {
    console.log('页面加载，参数:', options);
    
    // 检查运行环境
    const systemInfo = wx.getSystemInfoSync();
    console.log('运行环境:', {
      platform: systemInfo.platform,
      system: systemInfo.system,
      version: systemInfo.version,
      SDKVersion: systemInfo.SDKVersion,
      brand: systemInfo.brand,
      model: systemInfo.model
    });
    // 获取传入的参数
    if (options.image) {
      this.setData({
        image: decodeURIComponent(options.image)
      });
    } else if (options.color && options.source === 'ai') {
      this.setData({
        aiGeneratedColor: decodeURIComponent(options.color)
      });
    }

    if (options.style) {
      this.setData({
        styleName: decodeURIComponent(options.style)
      });
    }
    if (options.size) {
      this.setData({
        sizeName: decodeURIComponent(options.size)
      });
    }
    if (options.mat) {
      this.setData({
        matName: decodeURIComponent(options.mat)
      });
    }
    if (options.price) {
      this.setData({
        price: parseFloat(options.price)
      });
    }

    // 初始化Three.js
    this.initThreeJS();
  },

  onShow() {
    console.log('页面显示');
    // 检查网络状态
    wx.getNetworkType({
      success: (res) => {
        console.log('当前网络类型:', res.networkType);
        if (res.networkType === 'none') {
          wx.showToast({
            title: '网络连接不可用',
            icon: 'none',
            duration: 2000
          });
        }
      }
    });
    
    // 调试：输出当前状态
    console.log('当前页面状态:', {
      isLoading: this.data.isLoading,
      loadError: this.data.loadError,
      modelLoaded: this.data.modelLoaded,
      webglSupported: this.data.webglSupported
    });
  },

  // 初始化Three.js
  initThreeJS() {
    try {
      // 检查THREE对象是否正确加载
      if (!THREE || !THREE.global) {
        console.error('THREE对象未正确加载:', THREE);
        this.setData({ 
          webglSupported: false,
          isLoading: false,
          loadError: true 
        });
        return;
      }

      // 检查WebGL支持
      wx.getSystemInfo({
        success: (res) => {
          console.log('系统信息:', {
            platform: res.platform,
            system: res.system,
            version: res.version,
            SDKVersion: res.SDKVersion
          });
          
          // 检查是否支持WebGL
          if (res.platform === 'ios' && parseFloat(res.system.split(' ')[1]) < 9.0) {
            console.warn('iOS版本过低，可能不支持WebGL');
          }
        }
      });

      // 获取canvas节点
      wx.createSelectorQuery()
        .select('#webgl')
        .node()
        .exec((res) => {
          if (res[0] && res[0].node) {
            const canvas = THREE.global.registerCanvas(res[0].node);
            this.setData({ canvasId: canvas._canvasId });
            
            // 初始化场景
            this.initScene(canvas);
            
            // 加载3D模型
            this.load3DModel();
          } else {
            console.error('Canvas节点获取失败');
            this.setData({ 
              webglSupported: false,
              isLoading: false,
              loadError: true 
            });
          }
        });
    } catch (error) {
      console.error('Three.js初始化失败:', error);
      this.setData({ 
        webglSupported: false,
        isLoading: false,
        loadError: true 
      });
    }
  },

  // 初始化场景
  initScene(canvas) {
    // 创建相机
    this.camera = new THREE.PerspectiveCamera(70, canvas.width / canvas.height, 1, 1000);
    this.camera.position.set(0, 0, 5);

    // 创建场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a1a2e);

    // 创建渲染器
    this.renderer = new THREE.WebGLRenderer({ 
      canvas: canvas,
      antialias: true 
    });
    this.renderer.setSize(canvas.width, canvas.height);

    // 添加光源
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 1);
    this.scene.add(directionalLight);

    // 开始渲染循环
    this.animate();
  },

  // 加载3D模型
  load3DModel() {
    // 防止重复加载
    if (this.isModelLoading) {
      console.log('模型正在加载中，跳过重复请求');
      return;
    }
    
    this.isModelLoading = true;
    const modelUrl = 'https://aipaint-1251760642.cos.ap-guangzhou.myqcloud.com/test.obj';
    
    console.log('开始加载3D模型:', modelUrl);
    
    // 清理之前的模型
    this.clearModel();
    
    // 检查网络连接
    wx.getNetworkType({
      success: (res) => {
        console.log('网络类型:', res.networkType);
        if (res.networkType === 'none') {
          console.error('网络连接不可用');
          this.setData({ 
            isLoading: false,
            loadError: true 
          });
          return;
        }
      }
    });
    
    // 使用OBJLoader加载模型
    const loader = new THREE.OBJLoader();
    
    loader.load(
      modelUrl,
      (object) => {
        console.log('3D模型加载成功:', object);
        
        // 清理之前的模型
        this.clearModel();
        
        // 模型加载成功
        this.model = object;
        
        // 设置材质
        this.model.traverse((child) => {
          if (child.isMesh) {
            child.material = new THREE.MeshBasicMaterial({
              color: new THREE.Color(0x8B4513), // 木色
              side: THREE.DoubleSide
            });
          }
        });

        // 添加到场景
        this.scene.add(this.model);
        
        // 更新状态
        this.setData({ 
          isLoading: false,
          modelLoaded: true, // 标记模型已成功加载
          loadError: false,  // 确保错误状态为false
          showTouchHint: true
        });
        
        this.isModelLoading = false; // 重置加载标志
        console.log('模型状态更新完成，loadError:', false);
      },
      (progress) => {
        // 加载进度
        console.log('加载进度:', progress);
      },
      (error) => {
        // 加载失败
        console.error('模型加载失败:', error);
        console.error('错误详情:', {
          message: error.message,
          stack: error.stack,
          type: error.type
        });
        
        // 尝试备用方案：创建一个简单的立方体
        const fallbackSuccess = this.createFallbackModel();
        
        if (fallbackSuccess) {
          // 备用方案成功，不显示错误
          this.setData({ 
            isLoading: false,
            modelLoaded: true,
            loadError: false
          });
          console.log('备用模型创建成功，loadError保持为false');
        } else {
          // 备用方案也失败，才显示错误
          this.setData({ 
            isLoading: false,
            loadError: true 
          });
          console.log('模型加载失败，设置loadError为true');
        }
        
        this.isModelLoading = false; // 重置加载标志
      }
    );
  },

  // 清理模型
  clearModel() {
    console.log('清理之前的模型');
    if (this.model && this.scene) {
      // 从场景中移除模型
      this.scene.remove(this.model);
      
      // 清理模型的几何体和材质
      this.model.traverse((child) => {
        if (child.isMesh) {
          if (child.geometry) {
            child.geometry.dispose();
          }
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach(material => material.dispose());
            } else {
              child.material.dispose();
            }
          }
        }
      });
      
      this.model = null;
      console.log('模型清理完成');
    }
  },

  // 创建备用模型（当OBJ加载失败时）
  createFallbackModel() {
    console.log('创建备用模型');
    try {
      // 清理之前的模型
      this.clearModel();
      
      // 创建一个简单的立方体
      const geometry = new THREE.BoxGeometry(2, 2, 2);
      const material = new THREE.MeshBasicMaterial({ 
        color: 0x8B4513,
        side: THREE.DoubleSide
      });
      this.model = new THREE.Mesh(geometry, material);
      
      // 添加到场景
      this.scene.add(this.model);
      
      console.log('备用模型创建成功');
      return true; // 返回成功标志
    } catch (error) {
      console.error('备用模型创建失败:', error);
      this.model = null;
      return false; // 返回失败标志
    }
  },

  // 重试加载模型
  retryLoad() {
    console.log('重试加载模型');
    this.setData({
      isLoading: true,
      loadError: false,
      modelLoaded: false
    });
    
    // 清理之前的模型
    this.clearModel();
    
    // 重新加载
    this.load3DModel();
  },

  // 动画循环
  animate() {
    this.animationId = this.renderer.domElement.requestAnimationFrame(() => {
      this.animate();
    });

    // 更新模型旋转
    if (this.model) {
      // 使用弧度制，确保旋转流畅
      this.model.rotation.y = this.data.rotationY * Math.PI / 180;
      this.model.rotation.x = this.data.rotationX * Math.PI / 180;
      
      // 限制X轴旋转范围，避免模型翻转
      if (this.model.rotation.x > Math.PI / 2) {
        this.model.rotation.x = Math.PI / 2;
      } else if (this.model.rotation.x < -Math.PI / 2) {
        this.model.rotation.x = -Math.PI / 2;
      }
    }

    // 自动旋转
    if (this.data.autoRotate) {
      this.setData({
        rotationY: this.data.rotationY + 1
      });
    }

    // 渲染场景
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  },

  // 自定义触摸事件处理 - 外层容器
  documentTouchStart(e) {
    this.handleTouchStart(e);
  },

  documentTouchMove(e) {
    this.handleTouchMove(e);
  },

  documentTouchEnd(e) {
    this.handleTouchEnd(e);
  },

  // 自定义触摸事件处理 - canvas
  touchStart(e) {
    console.log('canvas touchstart', e);
    this.handleTouchStart(e);
    this.setData({ showTouchHint: false });
  },

  touchMove(e) {
    console.log('canvas touchmove', e);
    this.handleTouchMove(e);
  },

  touchEnd(e) {
    console.log('canvas touchend', e);
    this.handleTouchEnd(e);
  },

  touchCancel(e) {
    console.log('canvas touchcancel', e);
    this.handleTouchEnd(e);
  },

  longTap(e) {
    console.log('canvas longtap', e);
  },

  tap(e) {
    console.log('canvas tap', e);
    
    // 检测双击
    const now = Date.now();
    if (now - this.lastTapTime < 300) {
      // 双击重置视角
      this.resetRotation();
      console.log('双击重置视角');
    }
    this.lastTapTime = now;
  },

  // 自定义触摸处理方法
  handleTouchStart(e) {
    if (e.touches && e.touches.length > 0) {
      const touch = e.touches[0];
      this.touchStartX = touch.clientX;
      this.touchStartY = touch.clientY;
      this.lastTouchX = touch.clientX;
      this.lastTouchY = touch.clientY;
      this.isTouching = true;
      
      console.log('触摸开始:', {
        x: this.touchStartX,
        y: this.touchStartY
      });
    }
  },

  handleTouchMove(e) {
    if (!this.isTouching || !e.touches || e.touches.length === 0) {
      return;
    }

    const touch = e.touches[0];
    const deltaX = touch.clientX - this.lastTouchX;
    const deltaY = touch.clientY - this.lastTouchY;

    // 防止页面滚动
    e.preventDefault && e.preventDefault();

    // 计算旋转角度（灵敏度可调）
    const sensitivity = 0.8; // 增加灵敏度
    const newRotationY = this.data.rotationY + deltaX * sensitivity;
    const newRotationX = this.data.rotationX - deltaY * sensitivity; // 注意Y轴方向

    // 限制X轴旋转范围
    const maxRotationX = 80;
    const clampedRotationX = Math.max(-maxRotationX, Math.min(maxRotationX, newRotationX));

    // 更新旋转角度
    this.setData({
      rotationY: newRotationY,
      rotationX: clampedRotationX
    });

    // 更新最后触摸位置
    this.lastTouchX = touch.clientX;
    this.lastTouchY = touch.clientY;

    console.log('触摸移动:', {
      deltaX: deltaX,
      deltaY: deltaY,
      rotationY: newRotationY,
      rotationX: clampedRotationX
    });
  },

  handleTouchEnd(e) {
    this.isTouching = false;
    console.log('触摸结束');
  },

  // 控制按钮
  rotateLeft() {
    this.setData({
      rotationY: this.data.rotationY - 30
    });
  },

  rotateRight() {
    this.setData({
      rotationY: this.data.rotationY + 30
    });
  },

  resetRotation() {
    this.setData({
      rotationY: 0,
      rotationX: 0
    });
  },

  toggleAutoRotate() {
    this.setData({
      autoRotate: !this.data.autoRotate
    });
  },

  // 重试加载
  retryLoad() {
    this.setData({ 
      loadError: false,
      isLoading: true 
    });
    this.load3DModel();
  },

  // 返回上一页
  goBack() {
    wx.navigateBack();
  },

  // 页面卸载时的清理
  onUnload() {
    console.log('页面卸载，开始清理资源');
    
    // 停止动画循环
    if (this.animationId) {
      this.renderer.domElement.cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    
    // 清理模型
    this.clearModel();
    
    // 清理渲染器
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer = null;
    }
    
    // 清理场景
    if (this.scene) {
      this.scene.clear();
      this.scene = null;
    }
    
    // 清理相机
    this.camera = null;
    
    console.log('资源清理完成');
  },

  // 立即购买
  buyNow() {
    // 构建订单数据
    const orderData = {
      image: this.data.image,
      aiGeneratedColor: this.data.aiGeneratedColor,
      styleName: this.data.styleName,
      sizeName: this.data.sizeName,
      matName: this.data.matName,
      price: this.data.price
    };
    
    // 跳转到订单页面
    wx.navigateTo({
      url: `/pages/checkout/checkout?orderData=${encodeURIComponent(JSON.stringify(orderData))}`
    });
  },

  onUnload() {
    // 清理资源
    if (this.animationId) {
      this.renderer.domElement.cancelAnimationFrame(this.animationId);
    }
    
    if (this.renderer) {
      this.renderer.dispose();
    }
    
    if (this.scene) {
      this.scene.clear();
    }
    
    // 注销canvas
    if (this.data.canvasId) {
      THREE.global.unregisterCanvas(this.data.canvasId);
    }
  }
});

