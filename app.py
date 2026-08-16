import db_handle
from datetime import date
from flask import Flask, render_template, request # 本体作成 / html読み込み

app = Flask(__name__)
DATABASE = "antipig.db"


db_handle.create_table()

# 入力ページ
@app.route("/", methods=["GET", "POST"])
def index():
    if request.method == "POST":
        return db_handle.add_transaction()

    return render_template(
    "index.html",
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
        expense_max=expense_max,
        income_max=income_max,
        )

if __name__ == "__main__":
    app.run(debug=True) # コード変更時に再度読み込み