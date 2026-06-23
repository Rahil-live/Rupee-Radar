import re
from datetime import datetime

SKIP_PATTERNS = re.compile(r"opening balance|closing balance|total", re.I)


def parse_amount(value: str) -> float | None:
    cleaned = (
        value.strip()
        .replace(",", "")
        .replace("₹", "")
        .replace("Rs.", "")
        .replace("Rs", "")
        .replace(" ", "")
    )
    if not cleaned or cleaned in ("-", "N/A", "n/a", "NA", "nil", "Nil"):
        return None
    try:
        return float(cleaned)
    except ValueError:
        return None


def parse_date(value: str) -> str | None:
    value = value.strip()
    if not value:
        return None
    for fmt in (
        # numeric formats
        "%d/%m/%y",       # 01/09/24
        "%d/%m/%Y",       # 01/09/2024
        "%d-%m-%Y",       # 01-09-2024
        "%d-%m-%y",       # 01-09-24
        "%Y-%m-%d",       # 2024-09-01  (ISO)
        "%Y/%m/%d",       # 2024/09/01
        "%d.%m.%Y",       # 01.09.2024
        "%d.%m.%y",       # 01.09.24
        "%m/%d/%Y",       # 09/01/2024  (US format — tried last to avoid ambiguity)
        # month-name formats
        "%d %b %Y",       # 01 Sep 2024
        "%d-%b-%Y",       # 01-Sep-2024
        "%d/%b/%Y",       # 01/Sep/2024
        "%d %B %Y",       # 01 September 2024
        "%d-%B-%Y",       # 01-September-2024
        "%d %b %y",       # 01 Sep 24
        "%d-%b-%y",       # 01-Sep-24
        "%b %d, %Y",      # Sep 01, 2024
        "%B %d, %Y",      # September 01, 2024
        "%d %b, %Y",      # 01 Sep, 2024
    ):
        try:
            return datetime.strptime(value, fmt).date().isoformat()
        except ValueError:
            continue
    return None
