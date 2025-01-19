Page({
  data: {
    currentNotes: [], // 当前显示的音符数组
    notePositions: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'], // 音符位置
    ctx: null,
    canvas: null,
    canvasWidth: 0,
    canvasHeight: 0
  },

  onLoad: function () {
    this.initCanvas();
  },

  async initCanvas() {
    const query = wx.createSelectorQuery();
    query.select('#scoreCanvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        const canvas = res[0].node;
        const ctx = canvas.getContext('2d');

        // 获取实际设备信息
        const sysInfo = wx.getSystemInfoSync();
        const dpr = sysInfo.pixelRatio;

        // 设置 canvas 的实际尺寸
        canvas.width = res[0].width * dpr;
        canvas.height = res[0].height * dpr;

        // 缩放所有绘制操作
        ctx.scale(dpr, dpr);

        this.setData({
          ctx,
          canvas,
          canvasWidth: res[0].width,
          canvasHeight: res[0].height
        });

        // 立即生成新的五线谱
        this.generateNewScore();
      });
  },

  drawStaff() {
    const { ctx, canvas } = this.data;
    const width = canvas.width / wx.getSystemInfoSync().pixelRatio;
    const height = canvas.height / wx.getSystemInfoSync().pixelRatio;
    const lineSpacing = height / 16;

    ctx.clearRect(0, 0, width, height);
    ctx.beginPath();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;

    // 画五线谱的五条线
    for (let i = 0; i < 5; i++) {
      const y = height / 2 - lineSpacing * 2 + i * lineSpacing;
      ctx.moveTo(30, y);
      ctx.lineTo(width - 30, y);
    }

    // 画高音谱号
    ctx.font = `${lineSpacing * 4}px serif`;
    ctx.fillText('𝄞', 10, height / 2 + lineSpacing);

    ctx.stroke();
  },

  drawNote(x, position) {
    const { ctx, canvas } = this.data;
    const height = canvas.height / wx.getSystemInfoSync().pixelRatio;
    const lineSpacing = height / 16;
    const notePositions = {
      'C4': 7,
      'D4': 6.5,
      'E4': 6,
      'F4': 5.5,
      'G4': 5,
      'A4': 4.5,
      'B4': 4,
      'C5': 3.5
    };

    const y = height / 2 - lineSpacing * 2 + notePositions[position] * lineSpacing;

    // 画音符
    ctx.beginPath();
    ctx.ellipse(x, y, lineSpacing / 2, lineSpacing / 3, 0, 0, 2 * Math.PI);
    ctx.fill();
  },

  generateNewScore() {
    const notes = [];
    // 生成4个随机音符
    for (let i = 0; i < 4; i++) {
      const randomNote = this.data.notePositions[
        Math.floor(Math.random() * this.data.notePositions.length)
      ];
      notes.push(randomNote);
    }

    this.setData({ currentNotes: notes }, () => {
      this.drawStaff();

      // 画音符
      const { canvas } = this.data;
      const width = canvas.width / wx.getSystemInfoSync().pixelRatio;
      const noteSpacing = (width - 100) / 4;

      notes.forEach((note, index) => {
        this.drawNote(80 + noteSpacing * index, note);
      });
    });
  },

  nextScore: function () {
    this.generateNewScore();
  },

  prevScore: function () {
    this.generateNewScore();
  },

  playNote: function () {
    // 这里可以根据currentNotes中的音符播放对应的音频
    wx.showToast({
      title: '播放音符：' + this.data.currentNotes.join(','),
      icon: 'none'
    });
  }
}) 