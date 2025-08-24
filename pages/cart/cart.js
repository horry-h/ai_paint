// 购物车页面
Page({
  data: {
    cartItems: []
  },
  
  onLoad() {
    // 页面加载
  },
  
  goShopping() {
    wx.switchTab({
      url: '/pages/index/index'
    })
  }
})
