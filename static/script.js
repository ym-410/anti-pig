const amountInput = document.querySelector("#amount");
const addTaxButtons = document.querySelectorAll(".add-tax");
const dateInput = document.querySelector("#date");
const categoryList = document.querySelector("#category-list");
const typeInputs = document.querySelectorAll('input[name="is_income"]');
const calendarTypeInputs = document.querySelectorAll('input[name="or_income"]');
const dateHeaders = document.querySelectorAll(".score-date")

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
    const type = document.querySelector('input[name="is_income"]:checked').value;

    categoryList.innerHTML = categories[type]
        .map((category) => {
            return `
                <label class="category-button">
                    <input
                        type="radio"
                        name="category"
                        value="${category}"
                        required
                    >
                    <span>${category}</span>
                </label>
            `;
        }).join("");
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




// 初期表示
if (typeInputs.length > 0) {
    changeCategories();
}

if (calendarTypeInputs.length > 0) {
    changeCalendarRecords();
}
