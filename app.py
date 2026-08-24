import db_handle
from datetime import date
from flask import Flask, jsonify, render_template, redirect, request # 本体作成 / html読み込み

app = Flask(__name__)
DATABASE = "antipig.db"


db_handle.create_table()

# 直近12カ月の日付を計算
def get_recent_months(base_month, count=12):
    year, month = map(int, base_month.split("-"))
    months = []

    for offset in range(count - 1, -1, -1):
        total_month = (year * 12 + month - 1) - offset
        target_year = total_month // 12
        target_month = total_month % 12 + 1
        month.append(f"{target_year:04d}-{target_month:02d}")

    return months

# 入力ページ
@app.route("/", methods=["GET", "POST"])
def index():
    if request.method == "POST":
        return db_handle.add_transaction()

    form_data = {
        "amount": "",
        "category": "",
        "date": "",
        "memo": "",
        "is_income": 0,
    }

    return render_template(
    "index.html",
    form_data=form_data,
    submit_label="登録",
    )

# カレンダーページ
@app.route("/calendar", methods=["GET"])
def calender():
    current_month = date.today().strftime("%Y-%m")
    month = request.args.get("month", current_month)

    transactions = db_handle.get_transactions()
    total = db_handle.get_total()
    month_record = db_handle.get_month_record(month)
    income_total = db_handle.month_income(month)
    expense_total = db_handle.month_expense(month)
    month_total = income_total - expense_total

    return render_template(
        "calendar.html",
        transactions = transactions,
        total = total,
        month_record=month_record,
        month=month,
        month_total=month_total,
        income_total=income_total,
        expense_total=expense_total,
    )

# グラフページ
@app.route("/graph", methods=["GET"])
def graph():
    current_month = date.today().strftime("%Y-%m")
    month = request.args.get("month", current_month)

    expense_records = db_handle.get_category_totals(month, 0)
    income_records = db_handle.get_category_totals(month, 1)
    income_total = db_handle.month_income(month)
    expense_total = db_handle.month_expense(month)
    month_total = income_total - expense_total

    expense_max = max(
        (amount for cateogry, amount in expense_records), 
        default=0,
    )

    income_max = max(
        (amount for cateogry, amount in income_records), 
        default=0,
    )

    return render_template(
        "graph.html",
        month=month,
        expense_records=expense_records,
        income_records=income_records,
        month_total=month_total,
        expense_total=expense_total,
        income_total=income_total,
        expense_max=expense_max,
        income_max=income_max,
        )

# 更新ページ
@app.route("/transactions/<int:transaction_id>/edit", methods=["POST"])
def update(transaction_id):
    amount = request.form.get("amount", type=int)
    category = request.form.get("category", "").strip()
    transaction_date = request.form.get("date", "")
    memo = request.form.get("memo", "").strip()
    is_income = request.form.get("is_income", type=int)

    if (
        amount is None
        or amount <= 0
        or not category
        or not transaction_date
        or is_income not in (0, 1)
    ):
        return "入力内容が不正です", 400

    updated = db_handle.update_transaction(
        transaction_id,
        amount, 
        category,
        transaction_date,
        memo,
        is_income,
    )

    if updated == 0:
        return "記録が見つかりません", 404

    month = transaction_date[:7]
    return redirect(f"/calendar?month={month}")

# 削除ページ
@app.route("/transactions/<int:transaction_id>/delete", methods=["POST"])
def delete(transaction_id):
    month = request.form.get("month", "")

    deleted = db_handle.delete_transaction(transaction_id)

    if deleted == 0:
        return "記録が見つかりません", 400

    return redirect(f"/calendar?month={month}")

@app.route("/transactions/<int:transaction_id>/edit", methods=["GET"])
def edit_page(transaction_id):
    transaction = db_handle.get_transaction(transaction_id)
    if transaction is None:
        return f"記録が見つかりません", 404

    form_data = {
        "amount": transaction[1],
        "category": transaction[2],
        "date": transaction[3],
        "memo": transaction[4],
        "is_income": transaction[5],
    }

    return render_template(
        "edit.html",
        form_data=form_data,
        submit_label="更新",
        transaction_id=transaction_id,
    )

# カテゴリー別推移
@app.route("/api/category-trend", methods=["GET"])
def category_trend():
    current_month = date.today().strftime("%Y-%m")

    month = request.args.get("month", current_month)
    category = request.args.get("category", "").strip()
    is_income = request.args.get("is_income", type=int)

    if not category or is_income not in (0, 1):
        return jsonify({"error": "入力内容が不正です"}), 400

    months = get_recent_months(month)
    records = db_handle.category_month_total(
        category, is_income, month[0], month[1],
    )

    totals_by_month = dict(records)
    amounts = [
        totals_by_month.get(target_month, 0)
        for target_month in months
    ]

    return jsonify({
        "category": category,
        "months": months,
        "amounts": amounts,
    })

if __name__ == "__main__":
    app.run(debug=True) # コード変更時に再度読み込み