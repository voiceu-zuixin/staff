// index.js
Page({
  data: {
    // ... 其他数据
  },

  goToScore: function () {
    wx.navigateTo({
      url: '/pages/score/score'
    });
  }
})
