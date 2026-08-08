import sqlite3
from flask import Flask, redirect, render_template, request # 本体作成 / html読み込み

app = Flask(__name__)
DATABASE = "antipig.db"

def add_transaction():
    amount_text = request.form["amount"]
    category = request.form["category"]
    date = request.form["date"]
    memo = request.form["memo"]
    amount = int(amount_text)

    connection = sqlite3.connect(DATABASE)

    connection.execute(
        """
        INSERT INTO transactions (amount, category, date, memo)
        VALUES (?, ?, ?, ?)
        """,
        (amount, category, date, memo),
    )

    connection.commit()
    connection.close()

    return redirect("/")

def get_transactions():
    connection = sqlite3.connect(DATABASE)
    transactions = connection.execute(
        """
        SELECT id, amount, category, date, memo
        FROM transactions
        ORDER BY id DESC
        """
    ).fetchall()

    connection.close()

    return transactions




def create_table():
    connection = sqlite3.connect(DATABASE)

    connection.execute(
        """
        CREATE TABLE IF NOT EXISTS transactions(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            amount INTEGER NOT NULL,
            category TEXT NOT NULL,
            date TEXT NOT NULL,
            memo TEXT NOT NULL
        )            
        """
    )

    connection.close()

def get_total():
    connection = sqlite3.connect(DATABASE)

    result = connection.execute(
        "SELECT SUM(amount) FROM transactions"
    ).fetchone()

    connection.close()

    return result[0] or 0

def get_month_total(month):
    connection = sqlite3.connect(DATABASE)

    result = connection.execute(
        """
        SELECT SUM(amount)
        FROM transactions
        WHERE substr(date, 1, 7) = ?
        """,
        (month,),
    ).fetchone()

    connection.close()

    return result[0] or 0

create_table()

@app.route("/", methods=["GET", "POST"])
def index():
    if request.method == "POST":
        return add_transaction()

    month = request.args.get("month", "2026-08")

    transactions = get_transactions()
    total = get_total()
    month_total = get_month_total(month)

    return render_template(
    "index.html",
    transactions = transactions,
    total = total,
    month_total=month_total,
    month=month,
)

@app.route("/calendar", methods=["GET"])
def calender():
    return render_template("calendar.html")

@app.route("/graph", methods=["GET"])
def graph():
    return render_template("graph.html")

if __name__ == "__main__":
    app.run(debug=True) # コード変更時に再度読み込み