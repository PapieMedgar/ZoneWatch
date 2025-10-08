#!/usr/bin/env python3
import csv
import os
import sys
from datetime import datetime, date
from typing import Optional

import mysql.connector
from dotenv import load_dotenv

try:
    # Allow running from repo root or scripts directory
    sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
    from db_config import DATABASE_CONFIG
except Exception as import_error:  # pragma: no cover
    print(f"Failed to import DATABASE_CONFIG: {import_error}")
    sys.exit(1)


def parse_date(date_str: Optional[str]) -> Optional[date]:
    if not date_str:
        return None
    try:
        return datetime.strptime(date_str, "%Y-%m-%d").date()
    except ValueError as exc:
        raise SystemExit(f"Invalid date format '{date_str}'. Use YYYY-MM-DD.") from exc


def build_query(start_date: Optional[date], end_date: Optional[date]) -> tuple[str, list]:
    where_clauses = [
        # Ensure we only count valid checkins associated with a visit response if required by schema
        # If visit_response is optional, LEFT JOIN will still allow counts
        "1=1",
    ]
    params: list = []

    if start_date is not None:
        where_clauses.append("DATE(c.checkin_time) >= %s")
        params.append(start_date.isoformat())
    if end_date is not None:
        where_clauses.append("DATE(c.checkin_time) <= %s")
        params.append(end_date.isoformat())

    where_sql = " AND ".join(where_clauses)

    # Table and column names can be overridden via environment variables to match your schema
    users_table = os.getenv("SALESYNC_TABLE_USERS", "users")
    checkins_table = os.getenv("SALESYNC_TABLE_CHECKINS", "checkins")
    visit_response_table = os.getenv("SALESYNC_TABLE_VISIT_RESPONSE", "visit_response")

    users_pk = os.getenv("SALESYNC_USERS_PK", "id")
    users_name_col = os.getenv("SALESYNC_USERS_NAME_COLUMN", "name")

    checkins_pk = os.getenv("SALESYNC_CHECKINS_PK", "id")
    checkins_user_id_col = os.getenv("SALESYNC_CHECKINS_USER_ID_COLUMN", "user_id")
    checkins_time_col = os.getenv("SALESYNC_CHECKINS_TIME_COLUMN", "checkin_time")

    vr_checkin_id_col = os.getenv("SALESYNC_VISIT_RESPONSE_CHECKIN_ID_COLUMN", "checkin_id")

    # Note: We backtick-quote identifiers to tolerate reserved names like `user`.
    # Assumptions (adjust via env vars above if needed):
    # - users: primary key in users_pk, display name in users_name_col
    # - checkins: references users via checkins_user_id_col, timestamp in checkins_time_col
    # - visit_response: references checkins via vr_checkin_id_col (optional)
    query = f"""
        SELECT
            u.`{users_name_col}` AS user_name,
            DATE(c.`{checkins_time_col}`) AS visit_date,
            COUNT(c.`{checkins_pk}`) AS total_visits
        FROM `{users_table}` u
        JOIN `{checkins_table}` c ON c.`{checkins_user_id_col}` = u.`{users_pk}`
        LEFT JOIN `{visit_response_table}` vr ON vr.`{vr_checkin_id_col}` = c.`{checkins_pk}`
        WHERE {where_sql}
        GROUP BY u.`{users_name_col}`, DATE(c.`{checkins_time_col}`)
        ORDER BY u.`{users_name_col}` ASC, visit_date ASC
    """
    return query, params


def fetch_daily_visits(start_date: Optional[date], end_date: Optional[date]):
    connection = mysql.connector.connect(**DATABASE_CONFIG)
    try:
        cursor = connection.cursor(dictionary=True)
        query, params = build_query(start_date, end_date)
        cursor.execute(query, params)
        for row in cursor:
            yield {
                "user_name": row["user_name"],
                "date": row["visit_date"],
                "total_visits": int(row["total_visits"]) if row["total_visits"] is not None else 0,
            }
    finally:
        try:
            cursor.close()
        except Exception:
            pass
        connection.close()


def write_pivot_csv(rows, output_path: str):
    # Build set of users and map of date -> {user: count}
    user_names: set[str] = set()
    date_to_user_counts: dict[date, dict[str, int]] = {}

    for row in rows:
        user_name = str(row["user_name"]) if row["user_name"] is not None else ""
        raw_date = row["date"]
        if isinstance(raw_date, datetime):
            d = raw_date.date()
        elif isinstance(raw_date, date):
            d = raw_date
        else:
            # Expecting ISO string 'YYYY-MM-DD' from DB driver; fallback to safe parse
            try:
                d = date.fromisoformat(str(raw_date))
            except Exception:
                # If parsing fails, skip this row to avoid corrupting CSV structure
                continue

        user_names.add(user_name)
        if d not in date_to_user_counts:
            date_to_user_counts[d] = {}
        date_to_user_counts[d][user_name] = int(row.get("total_visits", 0) or 0)

    # Prepare header: Date + sorted user names
    sorted_users = sorted(user_names)
    header = ["Date", *sorted_users]

    # Prepare rows ordered by date ascending
    ordered_dates = sorted(date_to_user_counts.keys())
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, mode="w", newline="", encoding="utf-8") as csv_file:
        writer = csv.writer(csv_file)
        writer.writerow(header)
        for d in ordered_dates:
            # Format like '14-Sep-25'
            display_date = d.strftime("%d-%b-%y")
            row_values = [display_date]
            counts_for_day = date_to_user_counts.get(d, {})
            for user in sorted_users:
                row_values.append(counts_for_day.get(user, 0))
            writer.writerow(row_values)


def main():
    # Load environment variables from a .env file if present
    load_dotenv()
    # Optional CLI args: start_date end_date output_csv
    start_date = parse_date(sys.argv[1]) if len(sys.argv) > 1 and sys.argv[1] else None
    end_date = parse_date(sys.argv[2]) if len(sys.argv) > 2 and sys.argv[2] else None
    output_csv = sys.argv[3] if len(sys.argv) > 3 else os.path.join("reports", "daily_visits.csv")

    rows = list(fetch_daily_visits(start_date, end_date))
    write_pivot_csv(rows, output_csv)
    print(f"Wrote {len(rows)} rows to {output_csv}")


if __name__ == "__main__":
    main()

