const amountInput = document.querySelector("#amount");
const addTaxButtons = document.querySelectorAll(".add-tax");
const dateInput = document.querySelector("#date");
const categoryList = document.querySelector("#category-list");
const typeInputs = document.querySelectorAll('input[name="is_income"]');
const calendarTypeInputs = document.querySelectorAll('input[name="or_income"]');
const dateHeaders = document.querySelectorAll(".score-date");
const graphTypeInputs = document.querySelectorAll('input[name="graph_type"]');

// カレンダー月 自動入力
if (dateInput && !dateInput.value) {
    const today = new Date();
    const timezoneOffset = today.getTimezoneOffset() * 60 * 1000;
    const localDate = new Date(today.getTime() - timezoneOffset);

    dateInput.value = localDate.toISOString().split("T")[0];
}

// 税込みボタン
addTaxButtons.forEach((button) => {
    button.addEventListener("click", () => {
        const amount = Number(amountInput.value);
        const taxRate = Number(button.dataset.taxRate);

        if (!Number.isFinite(amount) || amount <= 0) {
            amountInput.focus();
            return;
        }

        amountInput.value = Math.floor(amount * taxRate);
    });
});

// カテゴリー入れ替えボタン
const categories = {
    0: ["食費", "日用品", "衣服", "交際費", "嗜好品", "ガソリン代", "ガジェット", "公共", "美容", "医療費", "交通費", "車"],
    1: ["給与", "仕送り", "臨時収入", "その他"],
};

function changeCategories() {
    const checkedInput = document.querySelector('input[name="is_income"]:checked');

    if (!checkedInput || !categoryList) {
        return;
    }

    const type = checkedInput.value;
    const selectedCategory = categoryList.dataset.selectedCategory || "";

    categoryList.innerHTML = categories[type]
        .map((category) => {
            const checked = category === selectedCategory ? "checked" : "";

            return `
                <label class="category-button">
                    <input
                        type="radio"
                        name="category"
                        value="${category}"
                        ${checked}
                        required
                    >
                    <span>${category}</span>
                </label>
            `;
        }).join("");
        
    categoryList.dataset.selectedCategory = "";
}

// 支出・収入切り替え時のイベント登録
typeInputs.forEach((input) => {
    input.addEventListener("change", changeCategories);
});


// カレンダー収支タブ切り替え

function changeCalendarRecords() {
    const checkedInput = document.querySelector('input[name="or_income"]:checked');

    if (!checkedInput) {
        return;
    }

    const type = checkedInput.value;
    const rows = document.querySelectorAll(".score-row");

    rows.forEach((row) => {
        row.hidden = row.dataset.isIncome !== type;
    });
    
    // カレンダーの日付非表示
    dateHeaders.forEach((header) => {
        let element = header.nextElementSibling;
        let hasVisibleRow = false;

        while(element && !element.classList.contains("score-date")) {
            if (element.classList.contains("score-row") && !element.hidden) {
                hasVisibleRow = true;
            }
            element = element.nextElementSibling;
            }
        header.hidden = !hasVisibleRow;
        
    })

}

calendarTypeInputs.forEach((input) => {
    input.addEventListener("change", changeCalendarRecords);
});

// 円グラフ描画
const graphColors = [

    "#6085ff",
    "#ff7d7d",
    "#d6a85f",
    "#75a88c",
    "#a27db8",
    "#c98465",
    "#6fa6b8",
    "#b5a55f",
    "#b86f85",
    "#809d62",
];

// 1パネルのグラフを作る
function drawPieChart(panel) {

    const dataElement = panel.querySelector(".pie-data"); // Pythonから渡されるデータ
    const chart = panel.querySelector(".pie-chart"); // 円グラフ本体
    const legend = panel.querySelector(".pie-legend"); // 凡例

    if (!dataElement || !chart || !legend) {
        return;
    }

    const records = JSON.parse(dataElement.textContent);
    const total = records.reduce((sum, record) => {
        return sum + record[1];
    }, 0);

    if (total === 0) {
        return;
    }

    let currentPercent = 0;
    const gradientParts = [];

    records.forEach((record, index) => {
        const category = record[0];
        const amount = record[1];

        const percent = amount / total * 100;
        const nextPercent = currentPercent + percent; // 円グラフの区切り
        const color = graphColors[index % graphColors.length];

        gradientParts.push(
            `${color} ${currentPercent}% ${nextPercent}%`
        );

        const item = document.createElement("li");

        item.className = "pie-legend-row";
        item.innerHTML = `
            <span
                class="pie-legend-color"
                style="background-color: ${color}"
            ></span>

            <span class="pie-legend-category">
                ${category}
            </span>

            <span class="pie-legend-amount">
                ${amount.toLocaleString()}円
                (${percent.toFixed(1)}%)
            </span>
        `;

        legend.appendChild(item);
        currentPercent = nextPercent;
           
    });

    chart.style.background = `conic-gradient(${gradientParts.join(",")})`;

}


function drawPieCharts() {
    const panel = document.querySelectorAll(".graph-panel");

    panel.forEach((panel) => {
        drawPieChart(panel);
    });
}

function changeGraph() {
    const checkedInput = document.querySelector('input[name="graph_type"]:checked');

    if (!checkedInput) {
        return;
    }

    const selectType = checkedInput.value;
    const panel = document.querySelectorAll(".graph-panel");

    panel.forEach((panel) => {
        const panelType = panel.dataset.isIncome;
        panel.hidden = panelType !== selectType;
    });
}



// 初期表示
// 入力：カテゴリータブ
if (typeInputs.length > 0) {
    changeCategories();
}

// カレンダータブ
if (calendarTypeInputs.length > 0) {
    changeCalendarRecords();
}

// グラフ
graphTypeInputs.forEach((input) => {
    input.addEventListener("change", changeGraph);
});

if (graphTypeInputs.length > 0) {
    drawPieCharts();
    changeGraph();
}