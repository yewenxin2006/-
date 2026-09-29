/* 狗头军师 Web —— 行为内核来自仓库 SKILL.md，按话题自动加载参考资料 */
(function () {
  'use strict';

  var DATA = window.GTJS_DATA || {};
  var SKILL_TEXT = DATA['SKILL.md'] || '';
  var FALLBACK_SKILL = [
    '你是「狗头军师」，恋爱军师与情绪支持助手。',
    '核心原则：先接住情绪，再分清事实，最后给能执行的选择。',
    '每次分析：情绪落地、事实拆分（已知/推测/未知）、利益判断、明确建议、行动收束。',
    '保持真实、互惠、可退出；不操控、不读心、不保证结果；明确拒绝时停止推进。',
    '危险情境（家暴、跟踪、胁迫、自伤风险）先确认当下安全并建议联系可信支持或紧急服务。'
  ].join('\n');

  var LS = { settings: 'gtjs.settings.v1', profile: 'gtjs.profile.v1', chat: 'gtjs.chat.v1' };
  var CHAT_LIMIT = 40;
  var HISTORY_LIMIT = 16;

  var PROVIDERS = {
    deepseek: { base: 'https://api.deepseek.com/v1', model: 'deepseek-chat' },
    zhipu: { base: 'https://open.bigmodel.cn/api/paas/v4', model: 'glm-4.5-flash' },
    qwen: { base: 'https://dashscope.aliyuncs.com/compatible-mode/v1', model: 'qwen-plus' },
    openai: { base: 'https://api.openai.com/v1', model: 'gpt-4o-mini' },
    custom: { base: '', model: '' }
  };

  var ROUTES = [
    { file: 'practical/实战话术编排器：从一句回复到后续分支.md', title: '实战话术编排器', keys: ['怎么回', '该回', '回复', '话术', '开场', '邀约', '约出来', '约她', '约他', '怎么聊', '聊什么', '撩', '表白', '演练', '发消息', '第一条消息'] },
    { file: 'practical/场景感、松弛感与社交校准：从接话到关系推进.md', title: '松弛感与社交校准', keys: ['松弛', '冷场', '现场', '接不上', '放不开', '紧张', '调情', '自然一点', '社交'] },
    { file: 'knowledge/20-经典社交体系的机制、证据与风险边界.md', title: '经典社交体系', keys: ['blueprint', '自然流', 'mystery', '迷男', '冷读', '内在状态', '框架'] },
    { file: 'practical/自然流、内在状态与结构化互动：伦理能力转译.md', title: '自然流转译', keys: ['自然流', '结构化互动', '冷读实战'] },
    { file: 'knowledge/05-PUA操控与伦理替代.md', title: 'PUA与伦理边界', keys: ['pua', '推拉', '服从', '打压', '煤气灯', '操控', '贬低'] },
    { file: 'knowledge/09-在线约会与数字关系.md', title: '在线约会与数字关系', keys: ['截图', '微信', 'qq', '网聊', '线上', '探探', 'soul', '相亲软件', '已读不回', '不回消息', '幽灵', '诈骗', '杀猪盘'] },
    { file: 'practical/ChatLab聊天记录分析适配.md', title: 'ChatLab适配', keys: ['chatlab', '导出', '聊天文件', 'k线', '趋势'] },
    { file: 'practical/长期记忆与关系档案.md', title: '长期记忆规则', keys: ['记住我', '档案', '记忆', '删除记录', '隐私'] },
    { file: 'practical/主动表达、第一次见面与自然接触.md', title: '主动表达与见面', keys: ['见面', '第一次约会', '约会安排', '牵手', '肢体', '接触', '告白', '主动'] },
    { file: 'practical/关系投入失衡：互惠判断、降级投入与退出决策.md', title: '投入失衡与退出', keys: ['冷淡', '失衡', '付出', '不值得', '退出', '止损', '断联', '降级', '单方面'] },
    { file: 'knowledge/03-依恋理论与情绪调节.md', title: '依恋与情绪调节', keys: ['依恋', '焦虑型', '回避型', '内耗', '患得患失', '安全感', '情绪崩'] },
    { file: 'knowledge/04-MBTI人格与匹配.md', title: 'MBTI与匹配', keys: ['mbti', 'intj', 'intp', 'entj', 'entp', 'infj', 'infp', 'enfj', 'enfp', 'istj', 'istp', 'estj', 'estp', 'isfj', 'isfp', 'esfj', 'esfp', '人格', '性格'] },
    { file: 'knowledge/07-沟通冲突与修复.md', title: '冲突与修复', keys: ['吵架', '冲突', '矛盾', '道歉', '冷暴力', '和好', '生气了'] },
    { file: 'knowledge/08-同意边界性与亲密.md', title: '同意与亲密边界', keys: ['同意', '亲密', '发生关系', '边界', '越界'] },
    { file: 'knowledge/11-婚姻家庭与生命周期.md', title: '婚姻与家庭', keys: ['结婚', '婚姻', '订婚', '求婚', '领证', '婆媳', '双方父母', '见家长'] },
    { file: 'knowledge/12-金钱家务育儿与双方家庭.md', title: '金钱家务育儿', keys: ['彩礼', '家务', '育儿', '孩子', '买房', 'aa', '花钱'] },
    { file: 'knowledge/15-分手背叛与关系修复.md', title: '分手背叛与复合', keys: ['分手', '前任', '复合', '出轨', '背叛', '挽回', '失恋'] },
    { file: 'knowledge/17-中国法律安全与危机转介.md', title: '法律安全与危机', keys: ['家暴', '暴力', '跟踪', '骚扰', '威胁', '报警', '法律', '离婚', '抚养权', '自伤', '自杀', '危机', '骗'] },
    { file: 'knowledge/01-证据分级与内容边界.md', title: '证据分级', keys: ['证据', '研究', '来源', '科学', '靠谱'] },
    { file: 'knowledge/19-核心书单与论文索引.md', title: '书单与论文', keys: ['书单', '书', '论文', '阅读'] },
    { file: 'practical/被孤立如何破局：从自我调适到建立连接的实用指南.md', title: '被孤立破局', keys: ['孤立', '排挤', '小团体'] },
    { file: 'practical/高情商拒绝他人：体面护边界的实用指南.md', title: '高情商拒绝', keys: ['拒绝', '怎么拒', '不好意思拒绝'] },
    { file: 'practical/万能夸人的话术技巧：真诚认可的实用指南.md', title: '真诚夸人', keys: ['夸', '赞美', '夸奖'] },
    { file: 'practical/万能吵架技巧：理性冲突处理指南.md', title: '理性吵架', keys: ['吵起来', '对峙'] },
    { file: 'practical/为他人提供情绪价值：温暖且有效的回应指南.md', title: '情绪价值', keys: ['情绪价值', '安慰', '哄'] },
    { file: 'practical/化解尴尬：轻松救场的实用指南.md', title: '化解尴尬', keys: ['尴尬'] },
    { file: 'practical/聊天化被动为主动：引导互动的实用指南.md', title: '化被动为主动', keys: ['被动', '引导', '主导'] },
    { file: 'practical/巧妙接话技巧：让沟通更流畅的实用指南.md', title: '巧妙接话', keys: ['接话'] },
    { file: 'practical/提高气场：从内到外的力量感塑造指南.md', title: '提高气场', keys: ['气场', '自信'] },
    { file: 'practical/提升表达逻辑性：从混乱到清晰的实用指南.md', title: '表达逻辑', keys: ['逻辑', '表达不清', '词不达意'] },
    { file: 'practical/托人办事的高效话术指南.md', title: '托人办事', keys: ['托人', '求人办事', '帮忙'] },
    { file: 'practical/有效拓展人脉：从建立到维护的实用指南.md', title: '拓展人脉', keys: ['人脉', '社交圈'] },
    { file: 'practical/废话文学回复指南：轻松应对各类场景.md', title: '废话文学', keys: ['废话文学', '打太极'] },
    { file: 'practical/公开表达案例的伦理转译.md', title: '公开表达', keys: ['公开表达', '演讲', '发言'] }
  ];

  var FALLBACK_ROUTE = ['practical/00-导读与使用分级.md'];

  var QUICK_CHIPS = [
    { label: '这句话怎么回？', text: '这句话怎么回：' },
    { label: '帮我分析这段聊天', text: '帮我分析这段聊天记录：' },
    { label: 'TA 还在意我吗？', text: '帮我分析 TA 的态度，最近的互动如下：' },
    { label: '我想体面退出', text: '我对这段关系很疲惫，想体面退出：' }
  ];

  var GOAL_LABELS = {
    '推进关系': '推进', '确认关系': '确认', '修复冲突': '修复',
    '比较多人选择': '比较选择', '退出或止损': '退出', '先聊聊看': '先聊聊看'
  };

  // ---------- state ----------

  var settings = load(LS.settings, {
    provider: 'zhipu',
    base: PROVIDERS.zhipu.base,
    key: '',
    model: PROVIDERS.zhipu.model,
    docCap: 9000
  });

  // 旧默认（DeepSeek 且未填 Key）迁移到智谱 GLM
  if (!settings.key && settings.provider === 'deepseek' && settings.model === 'deepseek-chat') {
    settings = {
      provider: 'zhipu',
      base: PROVIDERS.zhipu.base,
      key: '',
      model: PROVIDERS.zhipu.model,
      docCap: settings.docCap || 9000
    };
    save(LS.settings, settings);
  }

  var profile = load(LS.profile, null);
  var sessionProfile = null; // 未同意持久化时仅本次会话有效
  var messages = load(LS.chat, []);
  var pendingImages = [];
  var streaming = false;
  var aborter = null;

  // ---------- dom ----------

  var $ = function (id) { return document.getElementById(id); };
  var chatEl = $('chat');
  var inputEl = $('input');
  var sendBtn = $('btn-send');
  var fileInput = $('file-input');
  var pendingEl = $('pending');
  var toastEl = $('toast');

  // ---------- utils ----------

  function load(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) { return fallback; }
  }

  function save(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch (e) { return false; }
  }

  function esc(s) {
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  var toastTimer = null;
  function toast(text) {
    toastEl.textContent = text;
    toastEl.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.hidden = true; }, 2400);
  }

  function currentProfile() { return profile || sessionProfile || null; }

  function profileText(p) {
    if (!p) return '';
    var lines = [];
    var me = 'MBTI ' + (p.me.mbti || '未知') + '；评分 ' + (p.me.score || '未填') +
      (p.me.notes ? '；优势短板：' + p.me.notes : '');
    lines.push('用户：' + me);
    (p.targets || []).forEach(function (t, i) {
      if (!t.name && !t.mbti && !t.score && !t.status) return;
      lines.push('对象' + (i === 0 ? 'A' : 'B') + (t.name ? '「' + t.name + '」' : '') + '：MBTI ' +
        (t.mbti || '未知') + '；评分 ' + (t.score || '未填') +
        (t.status ? '；关系：' + t.status : '；关系：未填'));
    });
    if (p.story) lines.push('经过：' + p.story);
    if (p.goal) lines.push('目标：' + (GOAL_LABELS[p.goal] || p.goal));
    if (p.emotion || p.intensity !== '') {
      lines.push('情绪：' + (p.emotion || '未填') + '，强度 ' + (p.intensity || 0) + '/10');
    }
    return lines.join('\n');
  }

  // ---------- markdown-lite ----------

  function renderMd(src) {
    var lines = String(src).split(/\r?\n/);
    var out = [];
    var para = [];
    var list = null; // 'ul' | 'ol'
    var code = null;

    function flushPara() {
      if (para.length) { out.push('<p>' + para.map(inline).join('<br>') + '</p>'); para = []; }
    }
    function flushList() {
      if (list) { out.push('</' + list + '>'); list = null; }
    }
    function inline(s) {
      s = esc(s);
      s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
      s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
      s = s.replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
      return s;
    }

    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];

      if (code !== null) {
        if (/^\s*```/.test(line)) { out.push('<pre><code>' + esc(code.join('\n')) + '</code></pre>'); code = null; }
        else code.push(line);
        continue;
      }
      if (/^\s*```/.test(line)) { flushPara(); flushList(); code = []; continue; }

      if (/^\s*$/.test(line)) { flushPara(); flushList(); continue; }

      var h = line.match(/^(#{1,4})\s+(.*)/);
      if (h) { flushPara(); flushList(); out.push('<h4>' + inline(h[2]) + '</h4>'); continue; }

      var ul = line.match(/^\s*[-*]\s+(.*)/);
      var ol = line.match(/^\s*\d+[.、]\s+(.*)/);
      if (ul || ol) {
        flushPara();
        var want = ul ? 'ul' : 'ol';
        if (list !== want) { flushList(); out.push('<' + want + '>'); list = want; }
        out.push('<li>' + inline((ul || ol)[1]) + '</li>');
        continue;
      }

      var bq = line.match(/^\s*>\s?(.*)/);
      if (bq) { flushPara(); flushList(); out.push('<blockquote>' + inline(bq[1]) + '</blockquote>'); continue; }

      flushList();
      para.push(line);
    }
    if (code !== null) out.push('<pre><code>' + esc(code.join('\n')) + '</code></pre>');
    flushPara(); flushList();
    return out.join('');
  }

  // ---------- routing ----------

  function routeDocs(text) {
    var q = (text || '').toLowerCase();
    var scored = [];
    ROUTES.forEach(function (r) {
      var score = 0;
      r.keys.forEach(function (k) {
        if (q.indexOf(k.toLowerCase()) !== -1) score += k.length;
      });
      if (score > 0) scored.push({ route: r, score: score });
    });
    scored.sort(function (a, b) { return b.score - a.score; });
    var picked = scored.slice(0, 3).map(function (s) { return s.route; });
    var docs = picked.map(function (r) {
      var content = DATA[r.file];
      if (!content) return null;
      var body = content;
      var cap = Number(settings.docCap) || 9000;
      if (body.length > cap) body = body.slice(0, cap) + '\n…（已截断）';
      return { title: r.title, body: body };
    }).filter(Boolean);
    if (!docs.length) {
      FALLBACK_ROUTE.forEach(function (f) {
        if (DATA[f]) docs.push({ title: '使用导读', body: DATA[f].slice(0, 4000) });
      });
    }
    return docs;
  }

  function buildSystem(docs) {
    var sys = SKILL_TEXT || FALLBACK_SKILL;
    var p = currentProfile();
    if (p) {
      sys += '\n\n【用户本机档案（用户提供，供参考）】\n' + profileText(p);
    }
    docs.forEach(function (d) {
      sys += '\n\n【参考资料：' + d.title + '（截选）】\n' + d.body;
    });
    if (sys.length > 60000) sys = sys.slice(0, 60000);
    return sys;
  }

  // ---------- chat state ----------

  function persistChat() {
    var slim = messages.slice(-CHAT_LIMIT).map(function (m, i, arr) {
      if (m.images && i < arr.length - 1) return { role: m.role, text: m.text };
      return m;
    });
    if (!save(LS.chat, slim)) {
      try { localStorage.setItem(LS.chat, JSON.stringify(slim.slice(-10))); } catch (e) { /* 满则放弃 */ }
    }
  }

  function toApiMessage(m) {
    if (m.role === 'assistant') return { role: 'assistant', content: m.text || '' };
    if (m.images && m.images.length) {
      var parts = [{ type: 'text', text: m.text || '请分析这些聊天截图。' }];
      m.images.forEach(function (u) {
        parts.push({ type: 'image_url', image_url: { url: u } });
      });
      return { role: 'user', content: parts };
    }
    return { role: 'user', content: m.text || '' };
  }

  function buildPayload(docs) {
    var history = messages.slice(-HISTORY_LIMIT);
    var api = [{ role: 'system', content: buildSystem(docs) }];
    var merged = [];
    history.forEach(function (m) {
      var msg = toApiMessage(m);
      var last = merged[merged.length - 1];
      if (last && last.role === msg.role && typeof last.content === 'string' && typeof msg.content === 'string') {
        last.content += '\n\n' + msg.content;
      } else {
        merged.push(msg);
      }
    });
    return api.concat(merged);
  }

  // ---------- rendering ----------

  function icon(name) { return ICONS[name] || ''; }

  function nearBottom() {
    return chatEl.scrollHeight - chatEl.scrollTop - chatEl.clientHeight < 120;
  }
  function scrollBottom(force) {
    if (force || nearBottom()) chatEl.scrollTop = chatEl.scrollHeight;
  }

  function render() {
    var stick = nearBottom();
    if (!messages.length) {
      chatEl.innerHTML =
        '<div class="empty">' +
        '<div class="empty-mark">' + icon('message') + '</div>' +
        '<h1>狗头军师</h1>' +
        '<p>先说说你的局面</p>' +
        '<div class="chips">' +
        QUICK_CHIPS.map(function (c) {
          return '<button class="chip" type="button" data-fill="' + esc(c.text) + '">' + esc(c.label) + '</button>';
        }).join('') +
        '</div></div>';
      return;
    }
    var html = '';
    messages.forEach(function (m, i) { html += renderMessage(m, i); });
    chatEl.innerHTML = html;
    scrollBottom(stick);
  }

  function renderMessage(m, idx) {
    if (m.role === 'user') {
      var thumbs = '';
      if (m.images && m.images.length) {
        thumbs = '<div class="thumbs">' + m.images.map(function (u) {
          return '<img src="' + u + '" alt="截图">';
        }).join('') + '</div>';
      }
      return '<div class="msg user"><div>' + thumbs +
        '<div class="bubble">' + esc(m.text || '') + '</div></div></div>';
    }
    var cls = m.error ? 'bubble error' : 'bubble';
    var meta = '';
    if (m.docs && m.docs.length) {
      meta = '<div class="meta">' + icon('book') + '<span>参考：' + esc(m.docs.join('、')) + '</span>' +
        '<button class="copybtn" type="button" data-copy="' + idx + '">' + icon('copy') + '复制</button></div>';
    } else {
      meta = '<div class="meta"><button class="copybtn" type="button" data-copy="' + idx + '">' +
        icon('copy') + '复制</button></div>';
    }
    return '<div class="msg assistant"><div class="' + cls + '">' + renderMd(m.text || '') + '</div>' + meta + '</div>';
  }

  chatEl.addEventListener('click', function (e) {
    var chip = e.target.closest('.chip');
    if (chip) {
      inputEl.value = chip.getAttribute('data-fill');
      inputEl.focus();
      autosize();
      return;
    }
    var copy = e.target.closest('[data-copy]');
    if (copy) {
      var m = messages[Number(copy.getAttribute('data-copy'))];
      copyText(m && m.text || '').then(function () { toast('已复制'); });
    }
  });

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).catch(function () { return legacyCopy(text); });
    }
    return Promise.resolve(legacyCopy(text));
  }
  function legacyCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch (e) { /* ignore */ }
    document.body.removeChild(ta);
  }

  // ---------- composer ----------

  function autosize() {
    inputEl.style.height = 'auto';
    inputEl.style.height = Math.min(inputEl.scrollHeight, 140) + 'px';
  }
  inputEl.addEventListener('input', autosize);

  var coarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
  inputEl.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey && !coarse) {
      e.preventDefault();
      send();
    }
  });

  function renderPending() {
    if (!pendingImages.length) { pendingEl.hidden = true; pendingEl.innerHTML = ''; return; }
    pendingEl.hidden = false;
    pendingEl.innerHTML = pendingImages.map(function (u, i) {
      return '<div class="pending-item"><img src="' + u + '" alt="待发送截图">' +
        '<button type="button" data-rm="' + i + '" aria-label="移除">x</button></div>';
    }).join('');
  }
  pendingEl.addEventListener('click', function (e) {
    var b = e.target.closest('[data-rm]');
    if (b) {
      pendingImages.splice(Number(b.getAttribute('data-rm')), 1);
      renderPending();
    }
  });

  $('btn-attach').addEventListener('click', function () { fileInput.click(); });
  fileInput.addEventListener('change', function () {
    Array.prototype.slice.call(fileInput.files, 0, 4).forEach(function (f) {
      compressImage(f).then(function (url) {
        if (pendingImages.length < 4) { pendingImages.push(url); renderPending(); }
      });
    });
    fileInput.value = '';
  });

  function compressImage(file) {
    return new Promise(function (resolve) {
      var reader = new FileReader();
      reader.onload = function () {
        var img = new Image();
        img.onload = function () {
          var max = 1024;
          var w = img.width, h = img.height;
          if (Math.max(w, h) > max) {
            var k = max / Math.max(w, h);
            w = Math.round(w * k); h = Math.round(h * k);
          }
          var canvas = document.createElement('canvas');
          canvas.width = w; canvas.height = h;
          canvas.getContext('2d').drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        };
        img.onerror = function () { resolve(String(reader.result)); };
        img.src = String(reader.result);
      };
      reader.readAsDataURL(file);
    });
  }

  // ---------- send / stream ----------

  sendBtn.addEventListener('click', function () {
    if (streaming) { if (aborter) aborter.abort(); return; }
    send();
  });

  function setStreamingUI(on) {
    streaming = on;
    sendBtn.innerHTML = icon(on ? 'stop' : 'send');
    sendBtn.setAttribute('aria-label', on ? '停止' : '发送');
    sendBtn.disabled = false;
  }

  function send() {
    var text = inputEl.value.trim();
    if (!text && !pendingImages.length) return;
    if (!settings.key) { openSettings(); toast('请先配置模型接口'); return; }
    if (!settings.base || !settings.model) { openSettings(); toast('请补全接口地址和模型名'); return; }

    messages.push({ role: 'user', text: text, images: pendingImages.slice() });
    inputEl.value = ''; autosize();
    pendingImages = []; renderPending();
    persistChat(); render();
    scrollBottom(true);

    var docs = routeDocs(text);
    var docTitles = docs.map(function (d) { return d.title; });
    var apiMessages = buildPayload(docs);
    var replyIdx = messages.length;
    messages.push({ role: 'assistant', text: '', docs: docTitles });
    appendStreamNode(replyIdx, docTitles);

    aborter = new AbortController();
    setStreamingUI(true);

    fetch(settings.base.replace(/\/+$/, '') + '/chat/completions', {
      method: 'POST',
      signal: aborter.signal,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + settings.key
      },
      body: JSON.stringify({
        model: settings.model,
        messages: apiMessages,
        stream: true,
        temperature: 0.8
      })
    }).then(function (res) {
      if (!res.ok) {
        return res.text().then(function (t) {
          var msg = 'HTTP ' + res.status;
          try { msg = JSON.parse(t).error.message || msg; } catch (e) { if (t) msg += ' ' + t.slice(0, 200); }
          throw new Error(msg);
        });
      }
      return readStream(res, function (chunk) {
        messages[replyIdx].text += chunk;
        updateStreamNode(replyIdx);
      });
    }).then(function () {
      finalize(replyIdx);
    }).catch(function (err) {
      if (err && err.name === 'AbortError') {
        messages[replyIdx].text += '\n\n（已停止）';
        finalize(replyIdx);
        return;
      }
      messages[replyIdx].text = '请求失败：' + (err && err.message || err);
      messages[replyIdx].error = true;
      finalize(replyIdx);
    });
  }

  function readStream(res, onChunk) {
    var reader = res.body.getReader();
    var dec = new TextDecoder();
    var buf = '';
    return new Promise(function (resolve, reject) {
      function pump() {
        reader.read().then(function (r) {
          if (r.done) { resolve(); return; }
          buf += dec.decode(r.value, { stream: true });
          var idx;
          while ((idx = buf.indexOf('\n')) >= 0) {
            var line = buf.slice(0, idx).trim();
            buf = buf.slice(idx + 1);
            if (line.indexOf('data:') !== 0) continue;
            var payload = line.slice(5).trim();
            if (payload === '[DONE]') { resolve(); return; }
            try {
              var j = JSON.parse(payload);
              if (j.error) throw new Error(j.error.message || '接口返回错误');
              var d = j.choices && j.choices[0] && j.choices[0].delta;
              if (d && d.content) onChunk(d.content);
            } catch (e) {
              if (e instanceof SyntaxError) continue; // 半截 JSON，等下一段
              reject(e);
              return;
            }
          }
          pump();
        }).catch(reject);
      }
      pump();
    });
  }

  var streamBubble = null;
  function appendStreamNode(idx, docTitles) {
    var wrap = document.createElement('div');
    wrap.className = 'msg assistant';
    wrap.innerHTML = '<div class="bubble"></div><div class="meta">' +
      (docTitles.length ? icon('book') + '<span>参考：' + esc(docTitles.join('、')) + '</span>' : '') +
      '</div>';
    chatEl.appendChild(wrap);
    streamBubble = wrap.querySelector('.bubble');
    scrollBottom(true);
  }
  function updateStreamNode(idx) {
    if (streamBubble) {
      streamBubble.innerHTML = renderMd(messages[idx].text);
      scrollBottom(false);
    }
  }
  function finalize(idx) {
    streamBubble = null;
    aborter = null;
    setStreamingUI(false);
    if (!messages[idx].text) {
      messages[idx].text = '（没有返回内容，请重试）';
      messages[idx].error = true;
    }
    persistChat();
    render();
  }

  // ---------- onboarding ----------

  var obOverlay = $('overlay-onboarding');

  function openOnboarding(prefill) {
    var p = prefill || {};
    $('ob-me-mbti').value = p.me && p.me.mbti || '';
    $('ob-me-score').value = p.me && p.me.score || '';
    $('ob-me-notes').value = p.me && p.me.notes || '';
    var a = (p.targets && p.targets[0]) || {};
    $('ob-a-name').value = a.name || '';
    $('ob-a-mbti').value = a.mbti || '';
    $('ob-a-score').value = a.score || '';
    $('ob-a-status').value = a.status || '';
    var b = (p.targets && p.targets[1]) || {};
    $('ob-b-name').value = b.name || '';
    $('ob-b-mbti').value = b.mbti || '';
    $('ob-b-score').value = b.score || '';
    $('ob-b-status').value = b.status || '';
    $('ob-story').value = p.story || '';
    $('ob-goal').value = p.goal || '先聊聊看';
    $('ob-emotion').value = p.emotion || '';
    $('ob-intensity').value = p.intensity !== undefined && p.intensity !== '' ? p.intensity : 5;
    $('ob-intensity-val').textContent = $('ob-intensity').value;
    $('ob-consent').checked = !!(p && p.consent);
    obOverlay.hidden = false;
  }
  function closeOnboarding() { obOverlay.hidden = true; }

  $('ob-intensity').addEventListener('input', function () {
    $('ob-intensity-val').textContent = this.value;
  });
  $('ob-close').addEventListener('click', closeOnboarding);
  $('ob-skip').addEventListener('click', function () {
    sessionProfile = null;
    closeOnboarding();
  });
  $('ob-start').addEventListener('click', function () {
    var p = {
      me: {
        mbti: $('ob-me-mbti').value.trim(),
        score: $('ob-me-score').value,
        notes: $('ob-me-notes').value.trim()
      },
      targets: [
        {
          name: $('ob-a-name').value.trim(), mbti: $('ob-a-mbti').value.trim(),
          score: $('ob-a-score').value, status: $('ob-a-status').value.trim()
        },
        {
          name: $('ob-b-name').value.trim(), mbti: $('ob-b-mbti').value.trim(),
          score: $('ob-b-score').value, status: $('ob-b-status').value.trim()
        }
      ],
      story: $('ob-story').value.trim(),
      goal: $('ob-goal').value,
      emotion: $('ob-emotion').value.trim(),
      intensity: $('ob-intensity').value,
      consent: $('ob-consent').checked,
      savedAt: new Date().toISOString()
    };
    if (p.consent) {
      profile = p;
      sessionProfile = null;
      toast(save(LS.profile, p) ? '档案已保存到本机' : '保存失败，档案仅本次有效');
    } else {
      profile = null;
      sessionProfile = p;
      toast('未保存档案，仅本次会话有效');
    }
    closeOnboarding();
  });

  // ---------- settings ----------

  var stOverlay = $('overlay-settings');

  function openSettings() {
    $('st-provider').value = settings.provider || 'deepseek';
    $('st-base').value = settings.base || '';
    $('st-key').value = settings.key || '';
    $('st-model').value = settings.model || '';
    $('st-doccap').value = String(settings.docCap || 9000);
    stOverlay.hidden = false;
  }
  function closeSettings() { stOverlay.hidden = true; }

  $('btn-settings').addEventListener('click', openSettings);
  $('st-close').addEventListener('click', closeSettings);
  $('st-cancel').addEventListener('click', closeSettings);
  $('st-provider').addEventListener('change', function () {
    var p = PROVIDERS[this.value] || PROVIDERS.custom;
    if (p.base) { $('st-base').value = p.base; $('st-model').value = p.model; }
  });
  $('st-save').addEventListener('click', function () {
    settings = {
      provider: $('st-provider').value,
      base: $('st-base').value.trim(),
      key: $('st-key').value.trim(),
      model: $('st-model').value.trim(),
      docCap: Number($('st-doccap').value) || 9000
    };
    if (save(LS.settings, settings)) { toast('设置已保存'); } else { toast('保存失败，请检查浏览器存储权限'); }
    closeSettings();
  });

  $('st-export').addEventListener('click', function () {
    var payload = JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), settings: settings, profile: profile, chat: messages.slice(-CHAT_LIMIT) }, null, 2);
    var blob = new Blob([payload], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'goutoujunshi-backup.json';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
    toast('已导出到下载目录（含 Key，注意保管）');
  });

  $('st-import').addEventListener('click', function () { $('import-file').click(); });
  $('import-file').addEventListener('change', function () {
    var f = this.files[0];
    this.value = '';
    if (!f) return;
    var r = new FileReader();
    r.onload = function () {
      try {
        var d = JSON.parse(String(r.result));
        if (d.settings) { settings = d.settings; save(LS.settings, settings); }
        if (d.profile) { profile = d.profile; save(LS.profile, profile); sessionProfile = null; }
        if (Array.isArray(d.chat)) { messages = d.chat; persistChat(); }
        render();
        toast('记忆已导入');
      } catch (e) { toast('导入失败：文件格式不对'); }
    };
    r.readAsText(f);
  });

  // ---------- profile drawer ----------

  var pfOverlay = $('overlay-profile');

  function openProfile() {
    var p = currentProfile();
    var body = $('pf-body');
    if (!p) {
      body.innerHTML = '<p class="pf-empty">还没有档案。填写后军师能结合你的局面给更准的建议。</p>';
    } else {
      var where = profile ? '存储：本机浏览器（可随时删除）' : '存储：仅本次会话';
      body.innerHTML =
        '<p class="sheet-hint">' + where + (p.savedAt ? ' · 更新于 ' + esc(p.savedAt.slice(0, 10)) : '') + '</p>' +
        '<div class="pf-text">' + esc(profileText(p)) + '</div>';
    }
    pfOverlay.hidden = false;
  }
  function closeProfile() { pfOverlay.hidden = true; }

  $('btn-profile').addEventListener('click', openProfile);
  $('pf-close').addEventListener('click', closeProfile);
  $('pf-edit').addEventListener('click', function () {
    closeProfile();
    openOnboarding(currentProfile() || {});
  });
  $('pf-delete').addEventListener('click', function () {
    profile = null;
    sessionProfile = null;
    localStorage.removeItem(LS.profile);
    toast('档案已删除');
    closeProfile();
  });

  // ---------- topbar ----------

  $('btn-new').addEventListener('click', function () {
    if (messages.length && !window.confirm('清空当前对话？')) return;
    messages = [];
    persistChat();
    render();
  });

  // ---------- icons ----------

  var ICONS = {
    message: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>',
    user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
    refresh: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>',
    settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>',
    send: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>',
    stop: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="12" height="12" x="6" y="6" rx="2"/></svg>',
    image: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>',
    x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>',
    copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>',
    book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>'
  };

  function mountIcons(root) {
    (root || document).querySelectorAll('[data-icon]').forEach(function (el) {
      el.innerHTML = icon(el.getAttribute('data-icon'));
    });
  }

  // ---------- init ----------

  mountIcons();
  render();
  setStreamingUI(false);
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
    navigator.serviceWorker.register('sw.js').catch(function () { /* file:// 或非安全上下文跳过 */ });
  }
  if (!currentProfile()) {
    setTimeout(function () { openOnboarding({}); }, 350);
  }
})();
