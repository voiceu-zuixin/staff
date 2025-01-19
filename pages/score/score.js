Page({
  data: {
    currentNotes: [], // 当前显示的音符数组
    notePositions: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'], // 音符位置
    ctx: null,
    canvas: null,
    canvasWidth: 0,
    canvasHeight: 0,
    // 音符对应的频率（Hz）
    frequencyMap: {
      'C4': 261.63,
      'D4': 293.66,
      'E4': 329.63,
      'F4': 349.23,
      'G4': 392.00,
      'A4': 440.00,
      'B4': 493.88,
      'C5': 523.25
    },
    audioContext: null
  },

  onLoad: function () {
    this.initCanvas();
    // 初始化 WebAudio 上下文
    this.setData({
      audioContext: wx.createWebAudioContext()
    });
  },

  onUnload: function () {
    // 页面卸载时销毁音频上下文
    if (this.data.audioContext) {
      this.data.audioContext.destroy();
    }
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

  playNote: function (event) {
    // 获取点击位置
    const touch = event.touches[0];
    const { canvas } = this.data;
    const width = canvas.width / wx.getSystemInfoSync().pixelRatio;
    const noteSpacing = (width - 100) / 4;

    // 计算点击了哪个音符
    const clickX = touch.x;
    const noteIndex = Math.floor((clickX - 80) / noteSpacing);

    if (noteIndex >= 0 && noteIndex < this.data.currentNotes.length) {
      const note = this.data.currentNotes[noteIndex];

      // 创建音频节点
      const oscillator = this.data.audioContext.createOscillator();
      const gainNode = this.data.audioContext.createGain();

      // 连接节点
      oscillator.connect(gainNode);
      gainNode.connect(this.data.audioContext.destination);

      // 设置音符频率
      oscillator.frequency.value = this.data.frequencyMap[note];

      // 设置音量渐变（让声音更自然）
      const now = this.data.audioContext.currentTime;
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.3, now + 0.1);
      gainNode.gain.linearRampToValueAtTime(0, now + 0.5);

      // 开始播放并在0.5秒后停止
      oscillator.start(now);
      oscillator.stop(now + 0.5);

      // 显示正在播放的音符
      wx.showToast({
        title: `播放音符：${note}`,
        icon: 'none',
        duration: 1000
      });
    }
  }
}) 