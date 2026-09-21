// ------------------------------
// 認証状態と認証情報の保持
// ------------------------------
let verifiedQuestion = false;
let verifiedParticipant = false;

let savedFormId = null;
let savedFormPw = null;
let savedParticipantId = null;
let savedNickname = null;

let questionToken = null;
let participantToken = null;


// ------------------------------
// 画面遷移
// ------------------------------
function showScreen(n) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  document.getElementById("screen" + n).classList.add("active");
}
function goToScreen2() { showScreen(2); }
function goToScreen3() { showScreen(3); }
function goToScreen4() { showScreen(4); }


// ------------------------------
// ① QRコード情報の読み込み → 問題認証
// ------------------------------
const url = new URL(location.href);
const api = url.searchParams.get("api");
const id  = url.searchParams.get("id");
const pw  = url.searchParams.get("pw");

savedFormId = id;
savedFormPw = pw;

async function verifyQuestion() {
  document.getElementById("loadingSpinner").style.display = "block";

  try {
    const verifyUrl = `${api}?mode=verifyQuestion&id=${encodeURIComponent(id)}&pw=${encodeURIComponent(pw)}`;
    const res = await fetch(verifyUrl);
    const data = await res.json();

    if (data.status === "OK") {
      verifiedQuestion = true;
      questionToken = data.token;

      await loadQuestionHtml();

      document.getElementById("loadingSpinner").style.display = "none";
      goToScreen2();
    } else {
      alert("問題認証に失敗しました");
    }
  } catch (error) {
    document.getElementById("loadingSpinner").style.display = "none";
    document.querySelector("#screen1 p").textContent =
      "問題認証に失敗しました。API URL、通信状態、CORS設定を確認してください。";
  }
}

verifyQuestion();


// ------------------------------
// ③ 問題HTMLを JSON で受信して表示
// ------------------------------
async function loadQuestionHtml() {
  const requestUrl = `${api}?mode=getQuestion` +
    `&tokenQuestion=${encodeURIComponent(questionToken)}` +
    `&formId=${encodeURIComponent(savedFormId)}`;

  const res = await fetch(requestUrl);
  const data = await res.json();

  if (data.status === "OK") {
    document.getElementById("questionNo").textContent = "問題No. " + id;
    document.getElementById("questionArea").innerHTML = data.html;
  } else {
    throw new Error("問題データの取得に失敗しました");
  }
}


// ------------------------------
// ② 参加者認証
// ------------------------------
async function verifyParticipant() {
  const pid = document.getElementById("participantId").value;
  const nick = document.getElementById("nickname").value;

  try {
    const verifyUrl = `${api}?mode=verifyParticipant&pid=${encodeURIComponent(pid)}&nick=${encodeURIComponent(nick)}`;
    const res = await fetch(verifyUrl);
    const data = await res.json();

    if (data.status === "OK") {
      verifiedParticipant = true;
      savedParticipantId = pid;
      savedNickname = nick;
      participantToken = data.token;

      goToScreen3();
    } else {
      alert("参加者認証に失敗しました");
    }
  } catch (error) {
    console.error("参加者認証 API エラー:", error);
  }
}


// ------------------------------
// ④ 回答保存
// ------------------------------
async function submitAnswers() {
  if (!verifiedQuestion || !verifiedParticipant) {
    alert("認証が完了していません");
    return;
  }

  const params = new URLSearchParams({
    mode: "saveAnswer",
    formId: savedFormId,
    formPw: savedFormPw,
    pid: savedParticipantId,
    nick: savedNickname,
    tokenQuestion: questionToken,
    tokenParticipant: participantToken,
  });

  for (const input of document.querySelectorAll("#screen3 input")) {
    params.set(input.id, input.value);
  }

  try {
    const res = await fetch(`${api}?${params.toString()}`);
    const data = await res.json();

    if (data.status === "OK") {
      const result = data.result;

      document.getElementById("resultText").textContent =
        `獲得ポイント: ${result.earnedPoints} / ${result.totalPoints}`;

      goToScreen4();

    } else {
      alert(data.message || "回答保存に失敗しました");
    }
  } catch (error) {
    alert("回答保存中にエラーが発生しました");
  }
}
