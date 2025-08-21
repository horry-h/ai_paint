// 上传页面
Page({
  data: {
    selectedImage: '',
    selectedRatio: '1:1',
    cropRatios: [
      { name: '正方形', value: '1:1' },
      { name: '竖版', value: '3:4' },
      { name: '横版', value: '4:3' },
      { name: '宽幅', value: '16:9' }
    ]
  },

  onLoad(options) {
    // 如果有传入的图片参数
    if (options.image) {
      this.setData({
        selectedImage: decodeURIComponent(options.image)
      });
    }
  },

  // 选择图片
  async chooseImage() {
    try {
      const res = await wx.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera']
      });
      
      this.setData({
        selectedImage: res.tempFilePaths[0]
      });
    } catch (error) {
      console.log('选择图片失败', error);
    }
  },

  // 选择裁切比例
  selectRatio(e) {
    const value = e.currentTarget.dataset.value;
    this.setData({ selectedRatio: value });
  },

  // 重新选择图片
  resetImage() {
    this.setData({ selectedImage: '' });
  },

  // 使用图片
  useImage() {
    if (!this.data.selectedImage) {
      wx.showToast({
        title: '请先选择图片',
        icon: 'none'
      });
      return;
    }

    // 跳转到选框页面
    wx.navigateTo({
      url: `/pages/frame/frame?image=${encodeURIComponent(this.data.selectedImage)}&ratio=${this.data.selectedRatio}`
    });
  }
});
