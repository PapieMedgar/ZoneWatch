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


def build_query(
    start_date: Optional[date],
    end_date: Optional[date],
    *,
    users_table: str,
    users_pk: str,
    users_name_expr: str,
    checkins_table: str,
    checkins_pk: str,
    checkins_user_id_col: str,
    checkins_time_col: str,
    include_visit_response: bool,
    visit_response_table: str,
    vr_checkin_id_col: str,
) -> tuple[str, list]:
    where_clauses = [
        # Ensure we only count valid checkins associated with a visit response if required by schema
        # If visit_response is optional, LEFT JOIN will still allow counts
        "1=1",
    ]
    params: list = []

    if start_date is not None:
        where_clauses.append(f"DATE(c.`{checkins_time_col}`) >= %s")
        params.append(start_date.isoformat())
    if end_date is not None:
        where_clauses.append(f"DATE(c.`{checkins_time_col}`) <= %s")
        params.append(end_date.isoformat())

    where_sql = " AND ".join(where_clauses)

    # Table and column names can be overridden via environment variables to match your schema
    # Note: We backtick-quote identifiers to tolerate reserved names like `user`.
    # users_name_expr is a SQL expression referencing alias `u` (already includes quoting as needed)
    vr_join = (
        f" LEFT JOIN `{visit_response_table}` vr ON vr.`{vr_checkin_id_col}` = c.`{checkins_pk}`\n"
        if include_visit_response
        else ""
    )

    query = f"""
        SELECT
            {users_name_expr} AS user_name,
            DATE(c.`{checkins_time_col}`) AS visit_date,
            COUNT(c.`{checkins_pk}`) AS total_visits
        FROM `{users_table}` u
        JOIN `{checkins_table}` c ON c.`{checkins_user_id_col}` = u.`{users_pk}`
        {vr_join}
        WHERE {where_sql}
        GROUP BY {users_name_expr}, DATE(c.`{checkins_time_col}`)
        ORDER BY {users_name_expr} ASC, visit_date ASC
    """
    return query, params


def table_exists(connection, table_name: str) -> bool:
    cursor = connection.cursor()
    try:
        cursor.execute(
            """
            SELECT COUNT(*)
            FROM information_schema.tables
            WHERE table_schema = DATABASE() AND table_name = %s
            """,
            (table_name,),
        )
        count = cursor.fetchone()[0]
        return bool(count)
    finally:
        try:
            cursor.close()
        except Exception:
            pass


def resolve_table_name(connection, candidates: list[str]) -> Optional[str]:
    for name in [c for c in candidates if c]:
        if table_exists(connection, name):
            return name
    return None


def get_primary_key_column(connection, table_name: str) -> Optional[str]:
    cursor = connection.cursor()
    try:
        cursor.execute(
            """
            SELECT k.COLUMN_NAME
            FROM information_schema.table_constraints t
            JOIN information_schema.key_column_usage k
              ON t.CONSTRAINT_NAME = k.CONSTRAINT_NAME
             AND t.TABLE_SCHEMA = k.TABLE_SCHEMA
             AND t.TABLE_NAME = k.TABLE_NAME
            WHERE t.TABLE_SCHEMA = DATABASE()
              AND t.TABLE_NAME = %s
              AND t.CONSTRAINT_TYPE = 'PRIMARY KEY'
            ORDER BY k.ORDINAL_POSITION
            LIMIT 1
            """,
            (table_name,),
        )
        row = cursor.fetchone()
        return row[0] if row else None
    finally:
        try:
            cursor.close()
        except Exception:
            pass


def get_columns_for_table(connection, table_name: str) -> list[tuple[str, str]]:
    """Return list of (column_name, data_type) for the given table in current DB."""
    cursor = connection.cursor()
    try:
        cursor.execute(
            """
            SELECT COLUMN_NAME, DATA_TYPE
            FROM information_schema.columns
            WHERE table_schema = DATABASE() AND table_name = %s
            """,
            (table_name,),
        )
        return [(name, dtype) for name, dtype in cursor.fetchall()]
    finally:
        try:
            cursor.close()
        except Exception:
            pass


def infer_users_name_expr(connection, users_table: str) -> str:
    # Highest priority: explicit env var
    override_col = os.getenv("SALESYNC_USERS_NAME_COLUMN")
    if override_col:
        return f"u.`{override_col}`"

    columns = dict(get_columns_for_table(connection, users_table))
    # Candidate single-column names in priority order
    candidates = [
        "name",
        "full_name",
        "display_name",
        "username",
        "user_name",
    ]
    for col in candidates:
        if col in columns:
            return f"u.`{col}`"

    # Fallback: CONCAT first_name and last_name if both exist
    if "first_name" in columns and "last_name" in columns:
        return "CONCAT_WS(' ', u.`first_name`, u.`last_name`)"

    # Last resort: any varchar-like column containing 'name'
    for col, dtype in columns.items():
        if "name" in col.lower():
            return f"u.`{col}`"

    # Absolute fallback: primary key as string
    users_pk = get_primary_key_column(connection, users_table) or "id"
    return f"CAST(u.`{users_pk}` AS CHAR)"


def infer_checkins_columns(connection, checkins_table: str, users_table: str) -> tuple[str, str, str]:
    """Infer (checkins_pk, checkins_user_id_col, checkins_time_col)."""
    # Primary key
    checkins_pk = os.getenv("SALESYNC_CHECKINS_PK") or get_primary_key_column(connection, checkins_table) or "id"

    # User FK column: try explicit env, then FK metadata, then name heuristics
    user_fk_override = os.getenv("SALESYNC_CHECKINS_USER_ID_COLUMN")
    if user_fk_override:
        checkins_user_id_col = user_fk_override
    else:
        cursor = connection.cursor()
        try:
            cursor.execute(
                """
                SELECT COLUMN_NAME
                FROM information_schema.key_column_usage
                WHERE table_schema = DATABASE()
                  AND table_name = %s
                  AND REFERENCED_TABLE_NAME = %s
                ORDER BY ORDINAL_POSITION
                LIMIT 1
                """,
                (checkins_table, users_table),
            )
            row = cursor.fetchone()
            if row:
                checkins_user_id_col = row[0]
            else:
                # Heuristics based on actual columns present
                cols = [c for c, _ in get_columns_for_table(connection, checkins_table)]
                cols_lower = {c.lower(): c for c in cols}
                preferred_exact = [
                    "user_id",
                    "userid",
                    "userId",
                    "users_id",
                    "id_user",
                    "user",
                    "employee_id",
                    "staff_id",
                    "agent_id",
                    "rep_id",
                    "sales_rep_id",
                    "salesperson_id",
                    "salesman_id",
                    "field_officer_id",
                    "created_by_id",
                    "created_by",
                    "owner_id",
                ]
                chosen = None
                for name in preferred_exact:
                    if name.lower() in cols_lower:
                        chosen = cols_lower[name.lower()]
                        break
                if not chosen:
                    # Any column containing 'user'
                    for c in cols:
                        if "user" in c.lower():
                            chosen = c
                            break
                if not chosen:
                    # Any column ending with '_id'
                    for c in cols:
                        if c.lower().endswith("_id"):
                            chosen = c
                            break
                if not chosen:
                    # Hard fallback to first column to avoid SQL error; user should override via env var
                    chosen = cols[0] if cols else "user_id"
                checkins_user_id_col = chosen
        finally:
            try:
                cursor.close()
            except Exception:
                pass

    # Time column: explicit override, then by type and naming heuristics
    time_override = os.getenv("SALESYNC_CHECKINS_TIME_COLUMN")
    if time_override:
        checkins_time_col = time_override
    else:
        columns = get_columns_for_table(connection, checkins_table)
        # Prefer datetime/timestamp typed columns
        datetime_like = [
            (name, dtype) for name, dtype in columns if dtype.lower() in ("datetime", "timestamp", "date")
        ]
        name_priority = [
            "checkin_time",
            "check_in_time",
            "visited_at",
            "visit_time",
            "visit_date",
            "checkin_at",
            "created_at",
            "created_on",
            "time_in",
            "time",
            "date",
        ]
        checkins_time_col = None
        for candidate in name_priority:
            for name, dtype in datetime_like:
                if name.lower() == candidate:
                    checkins_time_col = name
                    break
            if checkins_time_col:
                break
        if not checkins_time_col:
            # Any datetime/timestamp column
            for name, dtype in datetime_like:
                checkins_time_col = name
                break
        if not checkins_time_col:
            # Last resort: any column containing 'date' or 'time'
            for name, dtype in columns:
                if "date" in name.lower() or "time" in name.lower():
                    checkins_time_col = name
                    break
        if not checkins_time_col:
            # Hard fallback
            checkins_time_col = "checkin_time"

    return checkins_pk, checkins_user_id_col, checkins_time_col


def get_earliest_visit_date(connection, checkins_table: str, checkins_time_col: str) -> Optional[date]:
    cursor = connection.cursor()
    try:
        query = f"SELECT DATE(MIN(`{checkins_time_col}`)) FROM `{checkins_table}`"
        cursor.execute(query)
        row = cursor.fetchone()
        if not row:
            return None
        value = row[0]
        if isinstance(value, datetime):
            return value.date()
        if isinstance(value, date):
            return value
        if value is None:
            return None
        # Attempt ISO parse
        try:
            return date.fromisoformat(str(value))
        except Exception:
            return None
    finally:
        try:
            cursor.close()
        except Exception:
            pass


def fetch_daily_visits(start_date: Optional[date], end_date: Optional[date]):
    connection = mysql.connector.connect(**DATABASE_CONFIG)
    try:
        # Resolve table names (allow env overrides, then common defaults)
        users_table = resolve_table_name(
            connection,
            [os.getenv("SALESYNC_TABLE_USERS"), "users", "user"],
        ) or "users"
        checkins_table = resolve_table_name(
            connection,
            [os.getenv("SALESYNC_TABLE_CHECKINS"), "checkins", "checkin", "visits", "visit"],
        ) or "checkins"
        vr_table_resolved = resolve_table_name(
            connection,
            [os.getenv("SALESYNC_TABLE_VISIT_RESPONSE"), "visit_response", "visitresponses", "visit_responses", "visitresponse"],
        )
        include_vr = bool(vr_table_resolved)
        visit_response_table = vr_table_resolved or "visit_response"

        # Infer columns/expressions
        users_pk = os.getenv("SALESYNC_USERS_PK") or get_primary_key_column(connection, users_table) or "id"
        users_name_expr = infer_users_name_expr(connection, users_table)
        checkins_pk, checkins_user_id_col, checkins_time_col = infer_checkins_columns(connection, checkins_table, users_table)
        vr_checkin_id_col = os.getenv("SALESYNC_VISIT_RESPONSE_CHECKIN_ID_COLUMN", "checkin_id")

        # If start_date is not provided, compute earliest from DB
        if start_date is None:
            start_date = get_earliest_visit_date(connection, checkins_table, checkins_time_col)

        cursor = connection.cursor(dictionary=True)
        query, params = build_query(
            start_date,
            end_date,
            users_table=users_table,
            users_pk=users_pk,
            users_name_expr=users_name_expr,
            checkins_table=checkins_table,
            checkins_pk=checkins_pk,
            checkins_user_id_col=checkins_user_id_col,
            checkins_time_col=checkins_time_col,
            include_visit_response=include_vr,
            visit_response_table=visit_response_table,
            vr_checkin_id_col=vr_checkin_id_col,
        )
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

