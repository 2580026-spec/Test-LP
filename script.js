// HTMLの要素を取得
const title = document.getElementById('title');
const message = document.getElementById('message');
const button = document.getElementById('change-btn');

// メッセージのリスト
const greetings = [
  { title: "こんにちは、世界！", desc: "日本語のあいさつです。" },
  { title: "Bonjour le monde!", desc: "フランス語のあいさつです。" },
  { title: "Hola Mundo!", desc: "スペイン語のあいさつです。" },
  { title: "Hello World!", desc: "英語のあいさつです。" }
];

let currentIndex = 0;

// ボタンがクリックされたときの処理
button.addEventListener('click', () => {
  // 次のあいさつへ切り替え
  currentIndex = (currentIndex + 1) % greetings.length;
  
  // 画面のテキストを更新
  title.textContent = greetings[currentIndex].title;
  message.textContent = greetings[currentIndex].desc;
});