// AI生成页面
Page({
  data: {
    prompt: '',
    tags: [
      { text: '人像', active: false },
      { text: '风景', active: false },
      { text: '油画', active: false },
      { text: '黑白', active: false },
      { text: '胶片', active: false },
      { text: '复古', active: false },
      { text: '现代', active: false },
      { text: '抽象', active: false }
    ],
    models: ['写实风格', '艺术风格', '卡通风格', '极简风格'],
    modelIndex: 0,
    genImages: [],
    selectedIndex: -1,
    isGenerating: false
  },

  onLoad() {
    // 页面加载
  },

  // 提示词输入
  onPromptInput(e) {
    this.setData({ prompt: e.detail.value });
  },

  // 切换标签
  toggleTag(e) {
    const index = e.currentTarget.dataset.index;
    const tags = this.data.tags.slice();
    tags[index].active = !tags[index].active;
    this.setData({ tags });
  },

  // 选择生成风格
  onModelChange(e) {
    this.setData({ modelIndex: Number(e.detail.value) });
  },

  // 生成图片
  async onGenerate() {
    if (!this.data.prompt.trim()) {
      wx.showToast({
        title: '请输入提示词',
        icon: 'none'
      });
      return;
    }

    this.setData({ isGenerating: true });

    try {
      // 模拟生成过程
      await this.simulateGeneration();
      
      // 生成图片URL - 使用颜色块
      const text = this.data.prompt.trim();
      const images = [];
      const colors = ['#4A90E2', '#50C878', '#FF6B6B', '#F39C12', '#9B59B6', '#E74C3C'];
      for (let i = 0; i < 6; i++) {
        images.push(colors[i]);
      }

      this.setData({ 
        genImages: images, 
        selectedIndex: -1,
        isGenerating: false 
      });

      wx.showToast({
        title: '生成完成',
        icon: 'success'
      });

    } catch (error) {
      this.setData({ isGenerating: false });
      wx.showToast({
        title: '生成失败，请重试',
        icon: 'none'
      });
    }
  },

  // 模拟生成过程
  simulateGeneration() {
    return new Promise((resolve) => {
      setTimeout(resolve, 2000);
    });
  },

  // 选择结果
  selectResult(e) {
    const index = e.currentTarget.dataset.index;
    this.setData({ selectedIndex: index });
  },

  // 重新生成
  regenerate() {
    this.setData({ 
      genImages: [], 
      selectedIndex: -1 
    });
    this.onGenerate();
  },

  // 使用所选图片
  useSelected() {
    if (this.data.selectedIndex === -1) {
      wx.showToast({
        title: '请选择一张图片',
        icon: 'none'
      });
      return;
    }

    const selectedImage = this.data.genImages[this.data.selectedIndex];
    
    // 跳转到选框页面，传递颜色值和来源标识
    wx.navigateTo({
      url: `/pages/frame/frame?color=${encodeURIComponent(selectedImage)}&source=ai`
    });
  }
});
