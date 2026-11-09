#!/usr/bin/env python3
"""clean_customers.py — dedupe + normalise a customer CSV, and prove what changed.

Usage:  python3 clean_customers.py messy_customers.csv clean_customers.csv

Same script you get. Run it on next month's file and you get the same result.
"""
import csv, re, sys
from collections import Counter
from datetime import datetime

CITIES = {"delhi": "Delhi", "new delhi": "Delhi", "mumbai": "Mumbai", "bombay": "Mumbai",
          "bengaluru": "Bengaluru", "bangalore": "Bengaluru", "pune": "Pune",
          "chennai": "Chennai", "madras": "Chennai", "jaipur": "Jaipur",
          "lucknow": "Lucknow", "kolkata": "Kolkata", "calcutta": "Kolkata"}
DATE_FMTS = ("%d/%m/%Y", "%Y-%m-%d", "%m/%d/%Y", "%d-%m-%Y", "%d.%m.%Y")


def norm_name(s):
    s = re.sub(r"\s+", " ", (s or "")).strip()
    return " ".join(w.capitalize() if w.islower() or w.isupper() else w for w in s.split())


def norm_phone(s):
    d = re.sub(r"\D", "", s or "")
    if len(d) == 10:
        return "+91 " + d[:5] + " " + d[5:]
    if len(d) == 11 and d.startswith("0"):
        return "+91 " + d[1:6] + " " + d[6:]
    if len(d) == 12 and d.startswith("91"):
        return "+91 " + d[2:7] + " " + d[7:]
    return ""                       # unusable, not guessed at


def norm_date(s):
    s = (s or "").strip()
    for f in DATE_FMTS:
        try:
            return datetime.strptime(s, f).strftime("%Y-%m-%d")
        except ValueError:
            continue
    return ""


def norm_email(s):
    s = (s or "").strip().lower()
    return s if re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", s) else ""


def main(src, dst):
    with open(src, newline="") as fh:
        rows = list(csv.DictReader(fh))
    before = len(rows)

    cleaned, seen, dupe_of = [], {}, 0
    report = Counter()
    for r in rows:
        name = norm_name(r.get("name"))
        email = norm_email(r.get("email"))
        phone = norm_phone(r.get("phone"))
        city = CITIES.get(re.sub(r"\s+", " ", (r.get("city") or "").strip().lower()), "")
        date = norm_date(r.get("signup_date"))
        status = (r.get("status") or "").strip().lower()

        if not name:
            report["dropped: no name"] += 1
            continue
        key = (email or "") + "|" + (phone or "")
        if key.strip("|") and key in seen:
            dupe_of += 1
            report["merged: duplicate person"] += 1
            continue
        seen[key] = True
        if phone == "":
            report["bad: unusable phone"] += 1
        if email == "":
            report["bad: invalid email"] += 1
        if date == "":
            report["bad: unreadable date"] += 1
        cleaned.append({"name": name, "email": email, "phone": phone, "city": city,
                        "signup_date": date, "status": status})

    # a duplicate that had no email and no phone is invisible to the key above;
    # catch it on name+city and keep the first.
    final, seen2 = [], set()
    for r in cleaned:
        k = (r["name"].lower(), r["city"], r["signup_date"])
        if r["phone"] == "" and r["email"] == "" and k in seen2:
            report["merged: duplicate by name"] += 1
            continue
        seen2.add(k)
        final.append(r)

    with open(dst, "w", newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=["name", "email", "phone", "city",
                                           "signup_date", "status"])
        w.writeheader()
        w.writerows(final)

    print(f"rows in : {before}")
    print(f"rows out: {len(final)}")
    print(f"removed : {before - len(final)}")
    for k, v in sorted(report.items()):
        print(f"  {k}: {v}")
    bad = sum(v for k, v in report.items() if k.startswith("bad:"))
    print(f"needs a human eye: {bad}")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "messy_customers.csv",
         sys.argv[2] if len(sys.argv) > 2 else "clean_customers.csv")
