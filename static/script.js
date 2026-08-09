const amountInput = document.querySelector("#amount");
const addTaxButtons = document.querySelectorAll(".add-tax");
const dateInput = document.querySelector("#date");


if (dateInput && !dateInput.value) {
    const today = new Date();
    const timezoneOffset = today.getTimezoneOffset() * 60 * 1000;
    const localDate = new Date(today.getTime() - timezoneOffset);

    dateInput.value = localDate.toISOString().split("T")[0];
}


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

