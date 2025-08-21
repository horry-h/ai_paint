// 选框页面
Page({
  data: {
    selectedImage: '',
    aiGeneratedColor: '',
    selectedStyle: 1,
    selectedSize: 2,
    selectedMat: 1,
    totalPrice: 0,
    
    styles: [
      {
        id: 1,
        name: '经典原木',
        price: 30,
        color: '#8B4513'
      },
      {
        id: 2,
        name: '现代金属',
        price: 50,
        color: '#708090'
      },
      {
        id: 3,
        name: '简约白色',
        price: 20,
        color: '#F5F5F5'
      },
      {
        id: 4,
        name: '复古胡桃',
        price: 60,
        color: '#654321'
      }
    ],
    
    sizes: [
      {
        id: 1,
        name: 'A5',
        desc: '14.8 × 21cm',
        price: 0
      },
      {
        id: 2,
        name: 'A4',
        desc: '21 × 29.7cm',
        price: 20
      },
      {
        id: 3,
        name: 'A3',
        desc: '29.7 × 42cm',
        price: 60
      },
      {
        id: 4,
        name: '30×40',
        desc: '30 × 40cm',
        price: 80
      },
      {
        id: 5,
        name: '40×60',
        desc: '40 × 60cm',
        price: 150
      }
    ],
    
    mats: [
      {
        id: 1,
        name: '白色',
        color: '#ffffff'
      },
      {
        id: 2,
        name: '黑色',
        color: '#000000'
      },
      {
        id: 3,
        name: '米色',
        color: '#f5f5dc'
      },
      {
        id: 4,
        name: '灰色',
        color: '#808080'
      }
    ]
  },

  onLoad(options) {
    // 获取传入的图片或颜色
    if (options.image) {
      this.setData({
        selectedImage: decodeURIComponent(options.image)
      });
    } else if (options.color && options.source === 'ai') {
      // AI生成的图片，使用颜色块
      this.setData({
        selectedImage: '',
        aiGeneratedColor: decodeURIComponent(options.color)
      });
    } else {
      // 默认图片 - 使用占位符
      this.setData({
        selectedImage: ''
      });
    }
    
    this.calculatePrice();
  },

  // 选择相框样式
  selectStyle(e) {
    const id = e.currentTarget.dataset.id;
    this.setData({ selectedStyle: id }, () => {
      this.calculatePrice();
    });
  },

  // 选择尺寸
  selectSize(e) {
    const id = e.currentTarget.dataset.id;
    this.setData({ selectedSize: id }, () => {
      this.calculatePrice();
    });
  },

  // 选择卡纸颜色
  selectMat(e) {
    const id = e.currentTarget.dataset.id;
    this.setData({ selectedMat: id });
  },

  // 计算价格
  calculatePrice() {
    const basePrice = 99;
    const style = this.data.styles.find(s => s.id === this.data.selectedStyle);
    const size = this.data.sizes.find(s => s.id === this.data.selectedSize);
    
    const total = basePrice + (style ? style.price : 0) + (size ? size.price : 0);
    
    this.setData({ totalPrice: total });
  },

  // 跳转到3D预览
  goPreview() {
    const params = {
      style: this.data.selectedStyle,
      size: this.data.selectedSize,
      mat: this.data.selectedMat,
      price: this.data.totalPrice
    };
    
    // 根据图片类型传递不同参数
    if (this.data.selectedImage) {
      params.image = encodeURIComponent(this.data.selectedImage);
    } else if (this.data.aiGeneratedColor) {
      params.color = encodeURIComponent(this.data.aiGeneratedColor);
      params.source = 'ai';
    }
    
    wx.navigateTo({
      url: `/pages/preview/preview?${Object.keys(params).map(k => `${k}=${params[k]}`).join('&')}`
    });
  }
});
