const amountInput = document.querySelector("#amount");
const addTaxButtons = document.querySelectorAll(".add-tax");

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
