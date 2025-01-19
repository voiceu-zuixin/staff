Page({
  data: {
    currentNotes: [], // 当前显示的音符数组
    // 修改音符范围，主要分布在五线谱内
    notePositions: [
      { note: 'E4', weight: 1 },  // 第一线
      { note: 'F4', weight: 2 },  // 第一间
      { note: 'G4', weight: 2 },  // 第二线
      { note: 'A4', weight: 3 },  // 第二间
      { note: 'B4', weight: 3 },  // 第三线
      { note: 'C5', weight: 3 },  // 第三间
      { note: 'D5', weight: 2 },  // 第四线
      { note: 'E5', weight: 1 }   // 第四间
    ],
    ctx: null,
    canvas: null,
    canvasWidth: 0,
    canvasHeight: 0,
    // 更新对应的频率表
    frequencyMap: {
      'E4': 329.63,  // 第一线
      'F4': 349.23,  // 第一间
      'G4': 392.00,  // 第二线
      'A4': 440.00,  // 第二间
      'B4': 493.88,  // 第三线
      'C5': 523.25,  // 第三间
      'D5': 587.33,  // 第四线
      'E5': 659.25   // 第四间
    },
    audioContext: null,
    activeNoteIndex: -1,
    staffBaseY: 0,
    lineSpacing: 0
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

    // 计算五线谱的基准位置（第一线的Y坐标）
    const staffBaseY = height / 2 - lineSpacing * 2;

    ctx.clearRect(0, 0, width, height);

    // 首先绘制可点击区域的背景
    const noteSpacing = (width - 100) / 4;
    this.data.currentNotes.forEach((note, index) => {
      const x = 80 + noteSpacing * index;
      ctx.fillStyle = this.data.activeNoteIndex === index ? 'rgba(200, 200, 255, 0.3)' : 'rgba(240, 240, 240, 0.2)';
      ctx.fillRect(x - noteSpacing / 2, 0, noteSpacing, height);
    });

    // 绘制五线谱
    ctx.beginPath();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;

    // 画五条线，从第一线开始
    for (let i = 0; i < 5; i++) {
      const y = staffBaseY + i * lineSpacing;
      ctx.moveTo(30, y);
      ctx.lineTo(width - 30, y);
    }

    // 调整高音谱号位置
    ctx.font = `${lineSpacing * 4}px serif`;
    ctx.fillStyle = '#000';
    ctx.fillText('𝄞', 10, staffBaseY + lineSpacing * 3);

    ctx.stroke();

    // 保存基准位置到 data 中，供 drawNote 使用
    this.setData({
      staffBaseY: staffBaseY,
      lineSpacing: lineSpacing
    });
  },

  drawNote(x, position) {
    const { ctx, canvas, staffBaseY, lineSpacing } = this.data;

    // 重新调整音符位置映射，使其与五线谱位置对应
    const notePositions = {
      'E4': 4,     // 第一线
      'F4': 3.5,   // 第一间
      'G4': 3,     // 第二线
      'A4': 2.5,   // 第二间
      'B4': 2,     // 第三线
      'C5': 1.5,   // 第三间
      'D5': 1,     // 第四线
      'E5': 0.5    // 第四间
    };

    // 使用五线谱基准位置计算音符Y坐标
    const y = staffBaseY + notePositions[position] * lineSpacing;

    // 画音符（黑色实心椭圆）
    ctx.beginPath();
    ctx.fillStyle = '#000';
    ctx.ellipse(x, y, lineSpacing / 2, lineSpacing / 3, 0, 0, 2 * Math.PI);
    ctx.fill();

    // 为五线谱外的音符添加附加线
    if (position === 'E4') {
      // 为E4添加第一线
      ctx.beginPath();
      ctx.moveTo(x - lineSpacing, y);
      ctx.lineTo(x + lineSpacing, y);
      ctx.stroke();
    }
  },

  generateNewScore() {
    const notes = [];
    // 计算权重总和
    const totalWeight = this.data.notePositions.reduce((sum, pos) => sum + pos.weight, 0);

    // 生成4个随机音符
    for (let i = 0; i < 4; i++) {
      // 生成一个随机权重值
      let randomWeight = Math.random() * totalWeight;
      let selectedNote = null;

      // 根据权重选择音符
      for (const position of this.data.notePositions) {
        randomWeight -= position.weight;
        if (randomWeight <= 0) {
          selectedNote = position.note;
          break;
        }
      }

      // 如果没有选中（理论上不会发生），选择最后一个音符
      if (!selectedNote) {
        selectedNote = this.data.notePositions[this.data.notePositions.length - 1].note;
      }

      notes.push(selectedNote);
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
    const touch = event.touches[0];
    const { canvas } = this.data;
    const width = canvas.width / wx.getSystemInfoSync().pixelRatio;
    const noteSpacing = (width - 100) / 4;

    // 计算点击了哪个音符
    const clickX = touch.x;
    const noteIndex = Math.floor((clickX - 80) / noteSpacing);

    if (noteIndex >= 0 && noteIndex < this.data.currentNotes.length) {
      const note = this.data.currentNotes[noteIndex];

      // 更新激活的音符索引
      this.setData({ activeNoteIndex: noteIndex }, () => {
        this.drawStaff();
        // 重新绘制所有音符
        this.data.currentNotes.forEach((note, index) => {
          this.drawNote(80 + noteSpacing * index, note);
        });
      });

      // 创建音频节点
      const oscillator = this.data.audioContext.createOscillator();
      const gainNode = this.data.audioContext.createGain();

      // 设置音色为正弦波，更接近钢琴音色
      oscillator.type = 'sine';

      // 连接节点
      oscillator.connect(gainNode);
      gainNode.connect(this.data.audioContext.destination);

      // 设置音符频率
      oscillator.frequency.value = this.data.frequencyMap[note];

      // 优化音量渐变，使声音更自然
      const now = this.data.audioContext.currentTime;
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.2, now + 0.02);
      gainNode.gain.linearRampToValueAtTime(0.1, now + 0.3);
      gainNode.gain.linearRampToValueAtTime(0, now + 0.4);

      // 开始播放并在0.4秒后停止
      oscillator.start(now);
      oscillator.stop(now + 0.4);

      // 显示正在播放的音符
      wx.showToast({
        title: `播放音符：${note}`,
        icon: 'none',
        duration: 800
      });

      // 0.4秒后清除激活状态
      setTimeout(() => {
        this.setData({ activeNoteIndex: -1 }, () => {
          this.drawStaff();
          // 重新绘制所有音符
          this.data.currentNotes.forEach((note, index) => {
            this.drawNote(80 + noteSpacing * index, note);
          });
        });
      }, 400);
    }
  }
}) 