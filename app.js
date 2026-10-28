const DATA_URL = "questions.json";
let data,
  section = "mc",
  index = 0;
const answers = { mc: {}, tf: {} };
const $ = (id) => document.getElementById(id);
const escapeHtml = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const getItems = () =>
  section === "mc" ? data.multipleChoice : data.trueFalse;
const answeredMC = () => Object.keys(answers.mc).length;
const answeredTF = () =>
  Object.values(answers.tf).reduce((n, v) => n + Object.keys(v).length, 0);
function save() {
  localStorage.setItem("hoa12-answers-v1", JSON.stringify(answers));
}
function load() {
  try {
    const old = JSON.parse(localStorage.getItem("hoa12-answers-v1") || "null");
    if (old) {
      answers.mc = old.mc || {};
      answers.tf = old.tf || {};
    }
  } catch (e) {}
}
function render() {
  const items = getItems();
  if (index < 0) index = 0;
  if (index >= items.length) index = items.length - 1;
  const q = items[index];
  const area = $("questionArea");
  if (section === "mc") {
    area.innerHTML = `<div class="q-header"><div class="q-number">${q.number}</div><div><div class="q-kind">Câu hỏi trắc nghiệm</div><h2 class="q-title">Câu ${q.number}</h2></div></div><div class="q-content">${escapeHtml(q.text)}</div>
      <div class="options">${(q.options || []).map((o) => `<div class="option ${answers.mc[q.number] === o.key ? "selected" : ""}" data-answer="${escapeHtml(o.key)}"><span class="radio">${escapeHtml(o.key)}</span><span class="option-text">${escapeHtml(o.text)}</span></div>`).join("")}</div>
      ${q.note ? `<div class="note">⚠️ ${escapeHtml(q.note)}</div>` : ""}
      ${!(q.options || []).length ? `<div class="note">Câu này chưa trích xuất được lựa chọn đầy đủ từ file Word. Hãy đối chiếu đề gốc.</div>` : ""}`;
    area.querySelectorAll(".option").forEach((el) =>
      el.addEventListener("click", () => {
        answers.mc[q.number] = el.dataset.answer;
        save();
        update();
        render();
      }),
    );
  } else {
    area.innerHTML = `<div class="q-header"><div class="q-number">${q.number}</div><div><div class="q-kind">Phát biểu đúng / sai</div><h2 class="q-title">Câu ${q.number}</h2></div></div><div class="q-content">${escapeHtml(q.text)}</div><div class="tf-statements">${(
      q.statements || []
    )
      .map((s) => {
        const v = (answers.tf[q.number] || {})[s.key];
        return `<div class="tf-row"><div class="tf-statement"><strong>${s.key.toUpperCase()})</strong> ${escapeHtml(s.text)}</div><div class="tf-buttons"><button class="tf-choice ${v === "Đúng" ? "selected true" : ""}" data-key="${s.key}" data-value="Đúng">✓ Đúng</button><button class="tf-choice ${v === "Sai" ? "selected false" : ""}" data-key="${s.key}" data-value="Sai">✕ Sai</button></div></div>`;
      })
      .join("")}</div>`;
    area.querySelectorAll(".tf-choice").forEach((el) =>
      el.addEventListener("click", () => {
        if (!answers.tf[q.number]) answers.tf[q.number] = {};
        answers.tf[q.number][el.dataset.key] = el.dataset.value;
        save();
        update();
        render();
      }),
    );
  }
  $("positionText").textContent = `Câu ${index + 1} / ${items.length}`;
  $("prevBtn").disabled = index === 0;
  $("nextBtn").disabled = index === items.length - 1;
  $("prevBtn").style.opacity = index === 0 ? ".45" : "1";
  $("nextBtn").style.opacity = index === items.length - 1 ? ".45" : "1";
  renderGrid();
  update();
}
function renderGrid() {
  const items = getItems();
  $("questionGrid").innerHTML = items
    .map((q, i) => {
      const done =
        section === "mc"
          ? answers.mc[q.number] !== undefined
          : Object.keys(answers.tf[q.number] || {}).length ===
            (q.statements || []).length;
      return `<button class="q-jump ${i === index ? "active" : ""} ${done ? "done" : ""}" data-index="${i}" title="Câu ${q.number}">${q.number}</button>`;
    })
    .join("");
  $("questionGrid")
    .querySelectorAll("button")
    .forEach((b) =>
      b.addEventListener("click", () => {
        index = Number(b.dataset.index);
        render();
      }),
    );
}
function update() {
  const totalMC = data.multipleChoice.length,
    totalTF = data.trueFalse.reduce(
      (n, q) => n + (q.statements || []).length,
      0,
    );
  const doneMC = answeredMC(),
    doneTF = answeredTF(),
    done = doneMC + doneTF,
    total = totalMC + totalTF;
  $("progressText").textContent = `Đã trả lời ${done} / ${total} ý`;
  $("progressPercent").textContent = `${Math.round((done / total) * 100)}%`;
  $("progressBar").style.width = `${(done / total) * 100}%`;
  $("answeredCount").textContent = done;
  $("mcCount").textContent = `${doneMC} / ${totalMC}`;
  $("tfCount").textContent = `${doneTF} / ${totalTF} ý`;
}
function switchSection(s) {
  section = s;
  index = 0;
  document
    .querySelectorAll(".tab")
    .forEach((t) => t.classList.toggle("active", t.dataset.section === s));
  render();
}
function showResults() {
  const missingMC = data.multipleChoice.filter(
    (q) => answers.mc[q.number] === undefined,
  ).length;
  const totalTF = data.trueFalse.reduce(
    (n, q) => n + (q.statements || []).length,
    0,
  );
  const doneTF = answeredTF();
  $("resultBody").innerHTML =
    `<div class="result-stat"><span>Trắc nghiệm đã chọn</span><strong>${answeredMC()} / ${data.multipleChoice.length}</strong></div><div class="result-stat"><span>Câu trắc nghiệm còn trống</span><strong>${missingMC}</strong></div><div class="result-stat"><span>Ý đúng/sai đã chọn</span><strong>${doneTF} / ${totalTF}</strong></div><div class="result-stat"><span>Tổng tiến độ</span><strong>${Math.round(((answeredMC() + doneTF) / (data.multipleChoice.length + totalTF)) * 100)}%</strong></div><p class="muted">Chưa có đáp án chuẩn trong file đề cương, vì vậy website chưa thể tính điểm đúng/sai.</p>`;
  $("resultModal").classList.remove("hidden");
}
$("prevBtn").addEventListener("click", () => {
  if (index > 0) {
    index--;
    render();
  }
});
$("nextBtn").addEventListener("click", () => {
  if (index < getItems().length - 1) {
    index++;
    render();
  }
});
document
  .querySelectorAll(".tab")
  .forEach((t) =>
    t.addEventListener("click", () => switchSection(t.dataset.section)),
  );
$("submitBtn").addEventListener("click", showResults);
$("closeModal").addEventListener("click", () =>
  $("resultModal").classList.add("hidden"),
);
$("continueBtn").addEventListener("click", () =>
  $("resultModal").classList.add("hidden"),
);
$("resultModal").addEventListener("click", (e) => {
  if (e.target === $("resultModal")) $("resultModal").classList.add("hidden");
});
$("resetBtn").addEventListener("click", () => {
  if (confirm("Bạn có chắc muốn xóa toàn bộ đáp án đã khoanh?")) {
    answers.mc = {};
    answers.tf = {};
    save();
    render();
  }
});
fetch(DATA_URL)
  .then((r) => {
    if (!r.ok) throw new Error("Không tải được questions.json");
    return r.json();
  })
  .then((d) => {
    data = d;
    load();
    render();
  })
  .catch((err) => {
    $("questionArea").innerHTML =
      `<div class="note">Không tải được dữ liệu câu hỏi. Hãy mở thư mục bằng Live Server trong VS Code, không mở trực tiếp file HTML. Chi tiết: ${escapeHtml(err.message)}</div>`;
  });
