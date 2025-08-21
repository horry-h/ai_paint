// pages/checkout/checkout.js
Page({
  data: {
    orderData: null,
    address: null,
    paymentType: 'wechat', // 默认微信支付
  },

  onLoad(options) {
    // 接收订单数据
    if (options.orderData) {
      try {
        const orderData = JSON.parse(decodeURIComponent(options.orderData));
        this.setData({ orderData });
      } catch (error) {
        console.error('解析订单数据失败:', error);
        wx.showToast({
          title: '订单数据错误',
          icon: 'error'
        });
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      }
    }
  },

  // 选择收货地址
  selectAddress() {
    // 这里可以跳转到地址选择页面
    // 暂时使用模拟地址
    const mockAddress = {
      name: '张三',
      phone: '138****8888',
      province: '广东省',
      city: '深圳市',
      district: '南山区',
      detail: '科技园路123号'
    };
    
    this.setData({ address: mockAddress });
    
    wx.showToast({
      title: '地址已选择',
      icon: 'success'
    });
  },

  // 选择支付方式
  selectPayment(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({ paymentType: type });
  },

  // 提交订单
  submitOrder() {
    if (!this.data.address) {
      wx.showToast({
        title: '请选择收货地址',
        icon: 'none'
      });
      return;
    }

    if (!this.data.paymentType) {
      wx.showToast({
        title: '请选择支付方式',
        icon: 'none'
      });
      return;
    }

    // 显示加载状态
    wx.showLoading({
      title: '正在创建订单...'
    });

    // 模拟订单创建
    setTimeout(() => {
      wx.hideLoading();
      
      // 模拟支付流程
      wx.showModal({
        title: '支付确认',
        content: `确认支付 ¥${this.data.orderData.price} 吗？`,
        success: (res) => {
          if (res.confirm) {
            this.processPayment();
          }
        }
      });
    }, 1500);
  },

  // 处理支付
  processPayment() {
    wx.showLoading({
      title: '正在支付...'
    });

    // 模拟支付过程
    setTimeout(() => {
      wx.hideLoading();
      
      // 创建订单
      const order = {
        id: Date.now().toString(),
        orderNumber: 'ORDER' + Date.now(),
        image: this.data.orderData.image,
        aiGeneratedColor: this.data.orderData.aiGeneratedColor,
        styleName: this.data.orderData.styleName,
        sizeName: this.data.orderData.sizeName,
        matName: this.data.orderData.matName,
        price: this.data.orderData.price,
        status: 'paid',
        createTime: new Date().toLocaleString(),
        address: this.data.address
      };

      // 保存订单到本地存储
      const orders = wx.getStorageSync('orders') || [];
      orders.unshift(order); // 添加到列表开头
      wx.setStorageSync('orders', orders);
      
      // 支付成功
      wx.showToast({
        title: '支付成功！',
        icon: 'success'
      });

      // 跳转到订单页面
      setTimeout(() => {
        wx.redirectTo({
          url: '/pages/orders/orders'
        });
      }, 1500);
    }, 2000);
  },

  // 返回上一页
  goBack() {
    wx.navigateBack();
  }
});
