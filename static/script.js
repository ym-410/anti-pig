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

// カテゴリークリック時の処理
async function showCategoryTrend(panel, category, color) {
    // 選択されている月を取得
    const page = document.querySelector(".record");
    const month = page.dataset.selectedMonth;

    const isIncome = panel.dataset.isIncome;
    const trendPanel = panel.querySelector(".trend-panel")
    const loading = panel.querySelector(".trend-loading");
    const error = panel.querySelector(".trend-error");

    trendPanel.hidden = false;
    loading.hidden = false;
    error.hidden = true;

    // APIに渡すURLパラメータを作成
    const params = new URLSearchParams({
        month: month,
        category: category,
        is_income: isIncome,
    });

    try {
        // FlaskのAPIへデータを要求
        const response = await fetch(`/api/category-trend?${params}`);

        if (!response.ok) {
            throw new Error("データ取得に失敗しました");
        }

        const data = await response.json();
        console.log(data);

        // 棒グラフ描画
        drawBarChart(panel, data, color);
        drawCategoryRecords(panel, data)

    } catch (fetchError) {
        console.error(fetchError);
        error.hidden = false;
    } finally {
        loading.hidden = true;
    }

}

// 1パネルの円グラフを作る
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

        // クリック
        item.addEventListener("click", () => {
            showCategoryTrend(panel, category, color);
        });

        legend.appendChild(item);
        currentPercent = nextPercent;
           
    });

    chart.style.background = `conic-gradient(${gradientParts.join(",")})`;

}

// 円グラフを統合し描画
function drawPieCharts() {
    const panel = document.querySelectorAll(".graph-panel");

    panel.forEach((panel) => {
        drawPieChart(panel);
    });
}

// 棒グラフ描画
function drawBarChart(panel, data, color) {
    const chart = panel.querySelector(".bar-chart");
    const title = panel.querySelector(".trend-title");
    const scrollArea = panel.querySelector(".bar-chart-scroll");
    const maxAmount = Math.max(...data.amounts, 0);

    title.textContent = `${data.category}の月別推移`;
    chart.replaceChildren(); // 前に表示したグラフの削除
    data.months.forEach((month, index) => {
        const amount = data.amounts[index];
        const height = maxAmount === 0 ? 0 : amount / maxAmount * 100;
    
        const column = document.createElement("div");
        column.className = "bar-column";

        // 金額表示
        const amountElement = document.createElement("span");
        amountElement.className = "bar-amount";
        amountElement.textContent = `${amount.toLocaleString()}円`;
        
        // 棒
        const bar = document.createElement("div");
        bar.className = "bar";
        bar.style.height = `${height}%`;
        bar.style.backgroundColor = color;

        // 月表示
        const monthElement = document.createElement("span");
        monthElement.className = "bar-month";
        monthElement.textContent = `${month.slice(5, 7)}月`;

        // 1カ月分を組み立てる
        column.append(
            amountElement,
            bar,
            monthElement,
        );

        // グラフへ追加
        chart.appendChild(column);        
    });

    requestAnimationFrame(() => {
        scrollArea.scrollLeft = scrollArea.scrollWidth;
    })

}

// カテゴリー別月別データ表示
function drawCategoryRecords(panel, data) {
    const page = document.querySelector(".record")
    const month = page.dataset.selectedMonth;

    const list = panel.querySelector(".category-records-list");
    const title = panel.querySelector(".category-records-title");
    const emptyMessage = panel.querySelector(".category-records-empty")
    
    if (!list || !title || !emptyMessage) {
        return;
    }
    
    list.replaceChildren();
    
    title.textContent = `${data.category}の明細（${month}）`

    if (data.records.length === 0) {
        list.hidden = true;
        emptyMessage.hidden = false;
        return;
    }

    list.hidden = false;
    emptyMessage.hidden = true;

    let previousDate = "";

    data.records.forEach((record) => {
        const transactionDate = record[3];

        // 前の明細と日付が違う場合に日付行を追加
        if (transactionDate !== previousDate) {
            list.appendChild(createDateRow(transactionDate));
            previousDate = transactionDate;
        }

        list.appendChild(createRecordRow(record));
    });
}

// 日付行を作る関数
function createDateRow(date) {
    const dateRow = document.createElement("li");

    dateRow.className = "score-date";
    dateRow.textContent = date;

    return dateRow;
}

// 明細行を作る関数
function createRecordRow(record) {
    const transactionId = record[0];
    const amount = record[1];
    const category = record[2];
    const memo = record[4];

    const row = document.createElement("li");
    row.className = "score-row";

    const link = document.createElement("a");
    link.className = "score-row-link";
    link.href = `/transactions/${transactionId}/edit`;

    const categoryElement = document.createElement("p");
    categoryElement.className = "score-category";
    categoryElement.textContent = category;

    const memoElement = document.createElement("p");
    memoElement.className = "score-memo";
    memoElement.textContent = memo;

    const amountElement = document.createElement("p");
    amountElement.className = "score-amount";
    amountElement.textContent = `${amount.toLocaleString()}円`;

    link.append(
        categoryElement,
        memoElement,
        amountElement,
    );

    row.appendChild(link);
    return row;
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