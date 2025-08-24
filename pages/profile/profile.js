// 个人中心页面
Page({
  data: {
    userInfo: null
  },
  
  onLoad() {
    // 页面加载
  },
  
  goHome() {
    wx.switchTab({
      url: '/pages/index/index'
    })
  }
})
