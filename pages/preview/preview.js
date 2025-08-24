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
    // 简化的OBJ解析器
    const lines = text.split('\n');
    const vertices = [];
    const faces = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const parts = line.split(/\s+/);
      
      if (parts[0] === 'v' && parts.length >= 4) {
        vertices.push([
          parseFloat(parts[1]),
          parseFloat(parts[2]),
          parseFloat(parts[3])
        ]);
      } else if (parts[0] === 'f' && parts.length >= 4) {
        const face = [];
        for (let j = 1; j < parts.length; j++) {
          const vertexIndex = parseInt(parts[j].split('/')[0]) - 1;
          face.push(vertexIndex);
        }
        faces.push(face);
      }
    }
    
    // 创建几何体
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    const indices = [];
    
    for (let i = 0; i < faces.length; i++) {
      const face = faces[i];
      if (face.length >= 3) {
        // 添加三角形
        for (let j = 0; j < face.length - 2; j++) {
          const v1 = vertices[face[0]];
          const v2 = vertices[face[j + 1]];
          const v3 = vertices[face[j + 2]];
          
          positions.push(v1[0], v1[1], v1[2]);
          positions.push(v2[0], v2[1], v2[2]);
          positions.push(v3[0], v3[1], v3[2]);
        }
      }
    }
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.computeVertexNormals();
    
    // 创建材质和网格
    const material = new THREE.MeshBasicMaterial({ 
      color: 0x888888,
      side: THREE.DoubleSide
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    const group = new THREE.Group();
    group.add(mesh);
    
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

// 3D预览页面
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
    scale: 1, // 新增：缩放比例
    isLoading: true,
    loadError: false,
    modelLoaded: false,
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
  
  // 新增：缩放相关变量
  initialDistance: 0,
  initialScale: 1,
  isScaling: false,

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

    // 延迟初始化，确保页面完全加载
    setTimeout(() => {
      this.initThreeJS();
    }, 500);
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

  onUnload() {
    // 清理资源
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    if (this.renderer) {
      this.renderer.dispose();
    }
    if (this.scene) {
      this.scene.clear();
    }
  },

  // 初始化Three.js
  initThreeJS() {
    try {
      // 检查THREE对象是否正确加载
      if (!THREE || !THREE.global) {
        console.error('THREE对象未正确加载:', THREE);
        console.log('将使用备用模型方案');
        
        // 直接创建备用模型，不显示错误
        this.createFallbackModel();
        this.setData({ 
          webglSupported: false,
          isLoading: false,
          modelLoaded: true,
          loadError: false
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
    this.scene.background = new THREE.Color(0xffffff); // 白色背景

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
    if (this.isModelLoading) {
      console.log('模型正在加载中，跳过重复请求');
      return;
    }

    this.isModelLoading = true;
    console.log('开始加载3D模型');

    // 清理之前的模型
    this.clearModel();

    // 创建OBJ加载器
    const loader = new THREE.OBJLoader();
    
    // 加载模型
    loader.load(
      'https://aipaint-1251760642.cos.ap-guangzhou.myqcloud.com/test.obj',
      (object) => {
        console.log('3D模型加载成功:', object);
        
        // 调整模型大小和位置
        const box = new THREE.Box3().setFromObject(object);
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 2 / maxDim;
        object.scale.setScalar(scale);
        
        // 居中模型
        const center = box.getCenter(new THREE.Vector3());
        object.position.sub(center.multiplyScalar(scale));
        
        // 添加材质
        object.traverse((child) => {
          if (child.isMesh) {
            child.material = new THREE.MeshPhongMaterial({ 
              color: 0x8B4513,
              shininess: 30
            });
          }
        });
        
        this.model = object;
        this.scene.add(object);
        
        this.setData({
          isLoading: false,
          modelLoaded: true,
          loadError: false
        });
        
        this.isModelLoading = false;
      },
      (progress) => {
        console.log('加载进度:', progress);
      },
      (error) => {
        console.error('3D模型加载失败:', error);
        this.setData({
          isLoading: false,
          loadError: true 
        });
        console.log('模型加载失败，设置loadError为true');
        
        // 创建备用模型
        this.createFallbackModel();
        
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
      // 检查THREE是否可用
      if (!THREE) {
        console.log('THREE不可用，创建简单的2D备用显示');
        // 设置状态，显示2D备用内容
        this.setData({
          webglSupported: false,
          isLoading: false,
          modelLoaded: true,
          loadError: false
        });
        return true;
      }
      
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
      if (this.scene) {
        this.scene.add(this.model);
      }
      
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

  // Canvas触摸事件处理
  touchStart(e) {
    console.log('canvas touchstart', e);
    this.documentTouchStart(e);
    this.setData({ showTouchHint: false });
  },

  touchMove(e) {
    console.log('canvas touchmove', e);
    this.documentTouchMove(e);
  },

  touchEnd(e) {
    console.log('canvas touchend', e);
    this.documentTouchEnd(e);
  },

  touchCancel(e) {
    console.log('canvas touchcancel', e);
    this.documentTouchEnd(e);
  },

  longTap(e) {
    console.log('canvas longtap', e);
  },

  tap(e) {
    console.log('canvas tap', e);
    this.documentTouchEnd(e);
  },

  // 动画循环
  animate() {
    this.animationId = this.renderer.domElement.requestAnimationFrame(() => {
      this.animate();
    });

    // 更新模型旋转和缩放
    if (this.model) {
      // 使用弧度制，确保旋转流畅
      this.model.rotation.y = this.data.rotationY * Math.PI / 180;
      this.model.rotation.x = this.data.rotationX * Math.PI / 180;
      
      // 应用缩放
      this.model.scale.setScalar(this.data.scale);
      
      // 限制X轴旋转范围，避免模型翻转
      if (this.model.rotation.x > Math.PI / 2) {
        this.model.rotation.x = Math.PI / 2;
        // 同步更新data中的值，保持状态一致
        this.setData({
          rotationX: 90
        });
      } else if (this.model.rotation.x < -Math.PI / 2) {
        this.model.rotation.x = -Math.PI / 2;
        // 同步更新data中的值，保持状态一致
        this.setData({
          rotationX: -90
        });
      }
    }

    // 自动旋转（仅在开启时执行）
    if (this.data.autoRotate && this.model) {
      this.model.rotation.y += 0.01;
      // 更新data中的rotationY，保持状态同步
      this.setData({
        rotationY: this.model.rotation.y * 180 / Math.PI
      });
    }

    // 渲染场景
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  },

  // 触摸事件处理
  documentTouchStart(e) {
    const touches = e.touches;
    
    if (touches.length === 1) {
      // 单指触摸 - 旋转
      this.isTouching = true;
      this.isScaling = false;
      this.touchStartX = touches[0].clientX;
      this.touchStartY = touches[0].clientY;
      this.lastTouchX = touches[0].clientX;
      this.lastTouchY = touches[0].clientY;
    } else if (touches.length === 2) {
      // 双指触摸 - 缩放
      this.isScaling = true;
      this.isTouching = false;
      this.initialDistance = this.getDistance(touches[0], touches[1]);
      this.initialScale = this.data.scale;
    }
  },

  documentTouchMove(e) {
    const touches = e.touches;
    
    if (touches.length === 1 && this.isTouching) {
      // 单指移动 - 旋转
      const deltaX = touches[0].clientX - this.lastTouchX;
      const deltaY = touches[0].clientY - this.lastTouchY;
      
      this.setData({
        rotationY: this.data.rotationY + deltaX * 0.5,
        rotationX: this.data.rotationX + deltaY * 0.5
      });
      
      this.lastTouchX = touches[0].clientX;
      this.lastTouchY = touches[0].clientY;
    } else if (touches.length === 2 && this.isScaling) {
      // 双指移动 - 缩放
      const currentDistance = this.getDistance(touches[0], touches[1]);
      const scaleFactor = currentDistance / this.initialDistance;
      const newScale = Math.max(0.5, Math.min(3.0, this.initialScale * scaleFactor));
      
      this.setData({
        scale: newScale
      });
    }
  },

  documentTouchEnd(e) {
    this.isTouching = false;
    this.isScaling = false;
    
    // 检查是否为双击
    const now = Date.now();
    if (now - this.lastTapTime < 300) {
      // 双击重置所有变换
      // this.resetAll();
    }
    this.lastTapTime = now;
  },

  // 计算两点距离
  getDistance(touch1, touch2) {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  },

  // 按钮控制
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

  // 缩放控制
  zoomIn() {
    const newScale = Math.min(3.0, this.data.scale + 0.2);
    this.setData({
      scale: newScale
    });
  },

  zoomOut() {
    const newScale = Math.max(0.5, this.data.scale - 0.2);
    this.setData({
      scale: newScale
    });
  },

  resetScale() {
    this.setData({
      scale: 1
    });
  },

  // 重置所有变换（旋转和缩放）
  resetAll() {
    this.setData({
      rotationY: 0,
      rotationX: 0,
      scale: 1
    });
  },

  toggleAutoRotate() {
    this.setData({
      autoRotate: !this.data.autoRotate
    });
  },

  // 页面导航
  goBack() {
    wx.navigateBack();
  },

  buyNow() {
    // 构建订单数据
    const orderData = {
      image: this.data.image,
      aiGeneratedColor: this.data.aiGeneratedColor,
      styleName: this.data.styleName,
      sizeName: this.data.sizeName,
      matName: this.data.matName,
      price: this.data.price,
      timestamp: Date.now()
    };

    // 跳转到结算页面
    wx.navigateTo({
      url: `/pages/checkout/checkout?orderData=${encodeURIComponent(JSON.stringify(orderData))}`
    });
  }
});

