/* ==========================================================================
   JavaScript インタラクティブ・シミュレーター制御
   ========================================================================== */

// 状態管理用変数
let requiredItems = ['折りたたみ傘', '役所の申請書類', 'ノートPC'];
let currentPackedItems = new Set();
let draggedElement = null;

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

// その他のイベントリスナー設定
function initEventListeners() {
  // リセットボタン
  document.getElementById('btn-reset').addEventListener('click', resetSimulator);

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

  // 音声ガイダンスの文言更新
  if (packedRequired.length === 0) {
    audioText.textContent = "「夕方から雨の予報です。折りたたみ傘、役所の書類、ノートPCを持つのをお忘れなく。」";
  } else if (missingRequired.length > 0) {
    audioText.textContent = `「順調に準備が進んでいます。あと『${missingRequired.join('・')}』をバッグに入れましょう。」`;
  } else {
    audioText.textContent = "「完璧です！今日の準備がすべて整いました。忘れ物はありません。行ってらっしゃいませ！」";
  }
}

function resetSimulator() {
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

  if (presetType === 'worker') {
    requiredItems = ['折りたたみ傘', '役所の申請書類', 'ノートPC'];
    audioText.textContent = "「【社会人モード】雨の予報です。折りたたみ傘、役所の申請書類、ノートPCをチェックしてください。」";
  } else if (presetType === 'parent') {
    requiredItems = ['折りたたみ傘', '社員証・ID'];
    audioText.textContent = "「【子育てモード】本日は参観日です。保護者証・IDと傘を持ったか確認しましょう。」";
  } else if (presetType === 'student') {
    requiredItems = ['折りたたみ傘', 'ノートPC'];
    audioText.textContent = "「【学生モード】午後から降水確率80%です。折りたたみ傘と講義用ノートPCをカバンに入れましょう。」";
  }

  document.querySelector('.simulator-section').scrollIntoView({ behavior: 'smooth' });
}