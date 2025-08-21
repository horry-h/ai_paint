// pages/orders/orders.js
Page({
  data: {
    orders: []
  },

  onLoad() {
    this.loadOrders();
  },

  onShow() {
    // 每次显示页面时刷新订单列表
    this.loadOrders();
  },

  // 加载订单列表
  loadOrders() {
    // 从本地存储获取订单数据
    const orders = wx.getStorageSync('orders') || [];
    this.setData({ orders });
  },

  // 支付订单
  payOrder(e) {
    const orderId = e.currentTarget.dataset.id;
    const order = this.data.orders.find(item => item.id === orderId);
    
    if (!order) {
      wx.showToast({
        title: '订单不存在',
        icon: 'error'
      });
      return;
    }

    wx.showModal({
      title: '支付确认',
      content: `确认支付 ¥${order.price} 吗？`,
      success: (res) => {
        if (res.confirm) {
          this.processPayment(orderId);
        }
      }
    });
  },

  // 处理支付
  processPayment(orderId) {
    wx.showLoading({
      title: '正在支付...'
    });

    setTimeout(() => {
      wx.hideLoading();
      
      // 更新订单状态
      const orders = this.data.orders.map(order => {
        if (order.id === orderId) {
          return { ...order, status: 'paid' };
        }
        return order;
      });
      
      this.setData({ orders });
      
      // 保存到本地存储
      wx.setStorageSync('orders', orders);
      
      wx.showToast({
        title: '支付成功！',
        icon: 'success'
      });
    }, 2000);
  },

  // 查看订单详情
  viewDetail(e) {
    const orderId = e.currentTarget.dataset.id;
    const order = this.data.orders.find(item => item.id === orderId);
    
    if (!order) {
      wx.showToast({
        title: '订单不存在',
        icon: 'error'
      });
      return;
    }

    // 跳转到订单详情页面（这里可以创建一个新的详情页面）
    wx.showModal({
      title: '订单详情',
      content: `订单号：${order.orderNumber}\n商品：${order.styleName} · ${order.sizeName} · ${order.matName}\n价格：¥${order.price}\n状态：${order.status === 'paid' ? '已支付' : '待支付'}\n创建时间：${order.createTime}`,
      showCancel: false
    });
  },

  // 去购物
  goShop() {
    wx.switchTab({
      url: '/pages/index/index'
    });
  }
});
