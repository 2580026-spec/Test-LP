/* ==========================================================================
   JavaScript インタラクティブ・シミュレーター & 音声読み上げ制御
   ========================================================================== */

// 状態管理用変数
let requiredItems = ['折りたたみ傘', '役所の申請書類', 'ノートPC'];
let currentPackedItems = new Set();
let draggedElement = null;

// 音声読み上げ用のSpeechSynthesisAPIの管理
let synth = window.speechSynthesis;

document.addEventListener('DOMContentLoaded', () => {
  initDragAndDrop();
  initEventListeners();
});

// ドラッグ＆ドロップ初期化
function initDragAndDrop() {
  const draggables = document.querySelectorAll('.item-chip');
  const dropZone = document.getElementById('drop-zone');
  const palette = document.getElementById('palette-items');

  draggables.forEach(item => {
    item.addEventListener('dragstart', handleDragStart);
    item.addEventListener('dragend', handleDragEnd);
  });

  dropZone.addEventListener('dragover', handleDragOver);
  dropZone.addEventListener('dragenter', handleDragEnter);
  dropZone.addEventListener('dragleave', handleDragLeave);
  dropZone.addEventListener('drop', handleDrop);

  palette.addEventListener('dragover', handleDragOver);
  palette.addEventListener('drop', handlePaletteDrop);
}

// イベントリスナー設定
function initEventListeners() {
  // リセットボタン
  document.getElementById('btn-reset').addEventListener('click', resetSimulator);

  // 音声再生ボタン
  document.getElementById('btn-speak').addEventListener('click', toggleSpeech);

  // タブボタン
  const tabButtons = document.querySelectorAll('.tab-btn');
  tabButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const tabId = e.currentTarget.getAttribute('data-tab');
      switchTab(e, tabId);
    });
  });

  // プリセットリンク
  const presetNotices = document.querySelectorAll('.preset-notice');
  presetNotices.forEach(notice => {
    notice.addEventListener('click', (e) => {
      const presetType = e.currentTarget.getAttribute('data-preset');
      applyPreset(presetType);
    });
  });
}

// --- 音声読み上げ（SpeechSynthesis）制御 ---

function speakText(text) {
  if (!('speechSynthesis' in window)) {
    alert('お使いのブラウザは音声読み上げ機能に対応していません。');
    return;
  }

  // 再生中の音声があれば停止
  synth.cancel();

  // カギカッコなどの記号を一部除去して聞きやすくする
  const cleanText = text.replace(/「|」/g, '');

  const utterance = new SpeechSynthesisUtterance(cleanText);
  utterance.lang = 'ja-JP';
  utterance.rate = 1.0; // 読み上げ速度
  utterance.pitch = 1.1; // 声の高さを少し高めに設定（AIアシスタント風）

  const speakBtn = document.getElementById('btn-speak');

  // 開始時の表示変化
  utterance.onstart = () => {
    speakBtn.classList.add('is-speaking');
  };

  // 終了時の表示変化
  utterance.onend = () => {
    speakBtn.classList.remove('is-speaking');
  };

  utterance.onerror = () => {
    speakBtn.classList.remove('is-speaking');
  };

  synth.speak(utterance);
}

function toggleSpeech() {
  if (synth.speaking) {
    synth.cancel();
    document.getElementById('btn-speak').classList.remove('is-speaking');
  } else {
    const text = document.getElementById('audio-text').textContent.trim();
    speakText(text);
  }
}

// --- ドラッグ＆ドロップ処理 ---

function handleDragStart(e) {
  draggedElement = this;
  this.classList.add('dragging');
  e.dataTransfer.setData('text/plain', this.id);
  e.dataTransfer.effectAllowed = 'move';
}

function handleDragEnd(e) {
  this.classList.remove('dragging');
  draggedElement = null;
}

function handleDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
}

function handleDragEnter(e) {
  e.preventDefault();
  if (this.classList.contains('drop-zone-container')) {
    this.classList.add('drag-over');
  }
}

function handleDragLeave(e) {
  if (this.classList.contains('drop-zone-container')) {
    this.classList.remove('drag-over');
  }
}

function handleDrop(e) {
  e.preventDefault();
  const dropZone = document.getElementById('drop-zone');
  dropZone.classList.remove('drag-over');

  if (!draggedElement) return;

  const bagArea = document.getElementById('bag-items');
  const emptyHint = document.getElementById('empty-hint');

  // バッグに追加
  if (!bagArea.contains(draggedElement)) {
    bagArea.appendChild(draggedElement);
    draggedElement.classList.add('packed');
    
    const itemName = draggedElement.getAttribute('data-name');
    currentPackedItems.add(itemName);

    if (emptyHint) emptyHint.style.display = 'none';

    updateSimulatorState();
  }
}

function handlePaletteDrop(e) {
  e.preventDefault();
  if (!draggedElement) return;

  const palette = document.getElementById('palette-items');
  const emptyHint = document.getElementById('empty-hint');
  const bagArea = document.getElementById('bag-items');

  if (bagArea.contains(draggedElement)) {
    palette.appendChild(draggedElement);
    draggedElement.classList.remove('packed');

    const itemName = draggedElement.getAttribute('data-name');
    currentPackedItems.delete(itemName);

    if (bagArea.children.length === 1 && emptyHint) {
      emptyHint.style.display = 'block';
    }

    updateSimulatorState();
  }
}

// --- シミュレーター状態更新 ---

function updateSimulatorState() {
  const audioText = document.getElementById('audio-text');
  const itemCountBadge = document.getElementById('item-count');

  // 必須アイテムの計算
  const packedRequired = requiredItems.filter(item => currentPackedItems.has(item));
  const missingRequired = requiredItems.filter(item => !currentPackedItems.has(item));

  itemCountBadge.textContent = `${packedRequired.length} / ${requiredItems.length} 必須準備済`;

  let newSpeechText = "";

  // 音声ガイダンスの文言更新
  if (packedRequired.length === 0) {
    newSpeechText = "「夕方から雨の予報です。折りたたみ傘、役所の書類、ノートPCを持つのをお忘れなく。」";
  } else if (missingRequired.length > 0) {
    newSpeechText = `「順調に準備が進んでいます。あと『${missingRequired.join('・')}』をバッグに入れましょう。」`;
  } else {
    newSpeechText = "「完璧です！今日の準備がすべて整いました。忘れ物はありません。行ってらっしゃいませ！」";
  }

  audioText.textContent = newSpeechText;

  // 持ち物が移動したら自動で音声を再生する
  speakText(newSpeechText);
}

function resetSimulator() {
  synth.cancel();
  const palette = document.getElementById('palette-items');
  const bagArea = document.getElementById('bag-items');
  const emptyHint = document.getElementById('empty-hint');
  const items = document.querySelectorAll('.item-chip');

  items.forEach(item => {
    palette.appendChild(item);
    item.classList.remove('packed');
  });

  currentPackedItems.clear();
  if (emptyHint) emptyHint.style.display = 'block';
  updateSimulatorState();
}

// --- タブ＆プリセット制御 ---

function switchTab(event, tabId) {
  const contents = document.querySelectorAll('.tab-content');
  contents.forEach(content => content.classList.remove('active'));

  const buttons = document.querySelectorAll('.tab-btn');
  buttons.forEach(btn => btn.classList.remove('active'));

  document.getElementById(tabId).classList.add('active');
  event.currentTarget.classList.add('active');
}

function applyPreset(presetType) {
  resetSimulator();
  const audioText = document.getElementById('audio-text');
  let presetText = "";

  if (presetType === 'worker') {
    requiredItems = ['折りたたみ傘', '役所の申請書類', 'ノートPC'];
    presetText = "「【社会人モード】雨の予報です。折りたたみ傘、役所の申請書類、ノートPCをチェックしてください。」";
  } else if (presetType === 'parent') {
    requiredItems = ['折りたたみ傘', '社員証・ID'];
    presetText = "「【子育てモード】本日は参観日です。保護者証・IDと傘を持ったか確認しましょう。」";
  } else if (presetType === 'student') {
    requiredItems = ['折りたたみ傘', 'ノートPC'];
    presetText = "「【学生モード】午後から降水確率80%です。折りたたみ傘と講義用ノートPCをカバンに入れましょう。」";
  }

  audioText.textContent = presetText;
  speakText(presetText);

  document.querySelector('.simulator-section').scrollIntoView({ behavior: 'smooth' });
}
