// 首页 - 专业UI设计
Page({
  data: {
    // 最近作品
    recentImages: [],
    
    // 推荐样式
    featuredStyles: [
      {
        id: 1,
        name: '经典原木',
        price: 129,
        color: '#8B4513'
      },
      {
        id: 2, 
        name: '现代金属',
        price: 159,
        color: '#708090'
      },
      {
        id: 3,
        name: '简约白色',
        price: 99,
        color: '#F5F5F5'
      },
      {
        id: 4,
        name: '复古胡桃',
        price: 189,
        color: '#654321'
      }
    ]
  },

  onLoad() {
    this.loadRecentImages();
  },

  // 加载最近作品
  loadRecentImages() {
    // 模拟数据 - 使用空状态，实际项目中会有真实图片
    this.setData({ recentImages: [] });
  },

  // 导航到AI生成页面
  goGenerate() {
    wx.navigateTo({
      url: '/pages/generate/generate'
    });
  },

  // 选择图片
  async chooseImage() {
    try {
      const res = await wx.chooseImage({ 
        count: 1, 
        sizeType: ['compressed'], 
        sourceType: ['album','camera'] 
      });
      const path = res.tempFilePaths[0];
      
      // 跳转到上传页面
      wx.navigateTo({
        url: `/pages/upload/upload?image=${encodeURIComponent(path)}`
      });
    } catch (e) {
      console.log('选择图片失败', e);
    }
  },

  // 直接选框
  goFrame() {
    wx.navigateTo({
      url: '/pages/frame/frame'
    });
  },

  // 查看订单
  goOrders() {
    wx.switchTab({
      url: '/pages/orders/orders'
    });
  },

  // 选择推荐样式
  selectFeaturedStyle(e) {
    const style = e.currentTarget.dataset.style;
    wx.navigateTo({
      url: `/pages/frame/frame?style=${style.id}`
    });
  }
});
