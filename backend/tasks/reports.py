from extensions import celery
from models import Company, Student, PlacementDrive, Application
from flask import current_app, render_template_string
from datetime import datetime, date
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText


REPORT_TEMPLATE = """
<!DOCTYPE html>
<html>
<head><style>
body { font-family: Arial, sans-serif; max-width: 700px; margin: auto; color: #333; }
h1 { color: #1a1a2e; } h2 { color: #2563eb; border-bottom: 1px solid #eee; padding-bottom: 6px; }
table { width: 100%; border-collapse: collapse; } th, td { padding: 8px 12px; text-align: left; }
th { background: #f1f5f9; } tr:nth-child(even) { background: #f8f9fa; }
.stat { display: inline-block; padding: 12px 20px; background: #f1f5f9; border-radius: 8px; margin: 6px; text-align: center; }
.stat-num { font-size: 2em; font-weight: bold; color: #2563eb; }
</style></head>
<body>
<h1>Monthly Placement Report</h1>
<p>Generated: {{ now }}</p>
<h2>Summary</h2>
<div>
    <div class="stat"><div class="stat-num">{{ total_drives }}</div><div>Drives This Month</div></div>
    <div class="stat"><div class="stat-num">{{ total_apps }}</div><div>Applications</div></div>
    <div class="stat"><div class="stat-num">{{ selected }}</div><div>Selected</div></div>
    <div class="stat"><div class="stat-num">{{ companies }}</div><div>Active Companies</div></div>
</div>
<h2>Drives Conducted</h2>
<table>
    <tr><th>Company</th><th>Job Title</th><th>Applicants</th><th>Selected</th></tr>
    {% for d in drives %}
    <tr>
        <td>{{ d.company.name }}</td>
        <td>{{ d.job_title }}</td>
        <td>{{ d.applicant_count }}</td>
        <td>{{ d.selected_count }}</td>
    </tr>
    {% endfor %}
</table>
</body></html>
"""


from datetime import datetime, timezone, date

@celery.task(name='tasks.reports.generate_monthly_report')
def generate_monthly_report():
    now = datetime.now(timezone.utc)
    start = date(now.year, now.month, 1)

    drives = PlacementDrive.query.filter(
        PlacementDrive.created_at >= start
    ).all()

    for d in drives:
        d.applicant_count = d.applications.count()
        d.selected_count = d.applications.filter_by(status='placed').count()

    total_apps = sum(d.applicant_count for d in drives)
    selected = sum(d.selected_count for d in drives)
    companies = Company.query.filter_by(approval_status='approved').count()

    html = render_template_string(
        REPORT_TEMPLATE,
        now=now.strftime('%d %B %Y'),
        total_drives=len(drives),
        total_apps=total_apps,
        selected=selected,
        companies=companies,
        drives=drives
    )

    admin_email = current_app.config['ADMIN_EMAIL']
    username = current_app.config['MAIL_USERNAME']
    password = current_app.config['MAIL_PASSWORD']

    if not username or not password:
        print(f'[REPORT] Would send to {admin_email}. Mail not configured.')
        return 'report generated (mail not configured)'

    msg = MIMEMultipart('alternative')
    msg['Subject'] = f'Monthly Placement Report — {now.strftime("%B %Y")}'
    msg['From'] = username
    msg['To'] = admin_email
    msg.attach(MIMEText(html, 'html'))

    with smtplib.SMTP('smtp.gmail.com', 587) as server:
        server.starttls()
        server.login(username, password)
        server.send_message(msg)

    return f'Report sent to {admin_email}'
