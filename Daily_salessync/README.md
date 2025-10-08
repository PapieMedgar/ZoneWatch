Daily salessync - Daily Visits Report

This repository contains a script that connects to the `salessync` MySQL database and exports a daily visits report in wide CSV format.

Files
- `db_config.py`: Database credentials/config.
- `scripts/daily_visits_report.py`: Report generator script.
- `requirements.txt`: Python dependencies.

Install
```bash
python3 -m pip install -r requirements.txt
```

Run
- Auto-detect earliest start date; write to `reports/daily_visits.csv`:
```bash
python3 scripts/daily_visits_report.py
```
- Specify date range and output path:
```bash
python3 scripts/daily_visits_report.py 2025-10-01 2025-10-08 /path/to/output.csv
```

The CSV layout is:
```
Date,<User1>,<User2>,...  # Date formatted as dd-MMM-yy
```

Environment Overrides (optional)
If your table/column names differ, create a `.env` file with any of the following:
```
SALESYNC_TABLE_USERS=users
SALESYNC_TABLE_CHECKINS=checkins
SALESYNC_TABLE_VISIT_RESPONSE=visit_response
SALESYNC_USERS_PK=id
SALESYNC_USERS_NAME_COLUMN=name
SALESYNC_CHECKINS_PK=id
SALESYNC_CHECKINS_USER_ID_COLUMN=user_id
SALESYNC_CHECKINS_TIME_COLUMN=checkin_time
SALESYNC_VISIT_RESPONSE_CHECKIN_ID_COLUMN=checkin_id
```
