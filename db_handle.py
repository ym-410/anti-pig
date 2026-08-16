import sqlite3
from flask import redirect, request # 本体作成 / html読み込み


DATABASE = "antipig.db"

# テーブル作成
def create_table():
    connection = sqlite3.connect(DATABASE)

    connection.execute(
        """
        CREATE TABLE IF NOT EXISTS transactions(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            amount INTEGER NOT NULL,
            category TEXT NOT NULL,
            date TEXT NOT NULL,
            memo TEXT NOT NULL,
            is_income INTEGER NOT NULL
        )            
        """
    )

    connection.close()

# 追加
def add_transaction():
    amount_text = request.form["amount"]
    category = request.form["category"]
    is_income = request.form["is_income"]
    date = request.form["date"]
    memo = request.form["memo"]
    amount = int(amount_text)

    connection = sqlite3.connect(DATABASE)

    connection.execute(
        """
        INSERT INTO transactions (amount, category, date, memo, is_income)
        VALUES (?, ?, ?, ?, ?)
        """,
        (amount, category, date, memo, is_income),
    )

    connection.commit()
    connection.close()

    return redirect("/")

# 読み取り
def get_transactions():
    connection = sqlite3.connect(DATABASE)
    transactions = connection.execute(
        """
        SELECT id, amount, category, date, memo, is_income
        FROM transactions
        ORDER BY id DESC
        """
    ).fetchall()

    connection.close()

    return transactions

# 更新

# 削除


# 月のデータ取得
def get_month_record(month):
    connection = sqlite3.connect(DATABASE)
    month_record = connection.execute(
        """
        SELECT id, amount, category, date, memo, is_income
        FROM transactions
        WHERE substr(date, 1, 7) = ?
        ORDER BY date DESC, id DESC
        """,
        (month,),
    ).fetchall()

    connection.close()

    return month_record

# 月の合計取得
def month_total(month):
    connection = sqlite3.connect(DATABASE)

    month_total = connection.execute(
        """
        SELECT SUM(amount)
        FROM transactions
        WHERE substr(date, 1, 7) = ?
        """,
        (month,),
    ).fetchone()

    connection.close()

    return month_total[0] or 0

# 月の収入合計
def month_income(month):
    connection = sqlite3.connect(DATABASE)

    month_income = connection.execute(
        """ 
        SELECT SUM(amount)
        FROM transactions
        WHERE substr(date, 1, 7) = ? AND is_income = 1
        """,
        (month,),
    ).fetchone()

    connection.close()

    return month_income[0] or 0

# 月の支出合計
def month_expense(month):
    connection = sqlite3.connect(DATABASE)

    month_expense = connection.execute(
        """
        SELECT SUM(amount)
            FROM transactions
            WHERE substr(date, 1, 7) = ? and is_income = 0
        """,
        (month,),
    ).fetchone()

    connection.close()

    return month_expense[0] or 0


# 合計取得
def get_total():
    connection = sqlite3.connect(DATABASE)

    result = connection.execute(
        "SELECT SUM(amount) FROM transactions"
    ).fetchone()

    connection.close()

    return result[0] or 0

# グラフ
## カテゴリー別支出
def get_category_totals(month, is_income):
    connection = sqlite3.connect(DATABASE)

    records = connection.execute(
        """
        SELECT category, SUM(amount) AS total
        FROM transactions
        WHERE substr(date, 1, 7) = ?
            AND is_income = ?
        GROUP BY category
        ORDER BY total DESC
        """,
        (month, is_income),
    ).fetchall()

    connection.close()
    return records