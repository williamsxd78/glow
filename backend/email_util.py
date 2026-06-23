"""SMTP email helper - safely no-ops if SMTP is not configured."""
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import logging

logger = logging.getLogger(__name__)


def render(template: str, ctx: dict) -> str:
    out = template
    for k, v in ctx.items():
        out = out.replace("{{" + k + "}}", str(v))
    return out


def send_email(smtp_cfg: dict, to_email: str, subject: str, body_html: str) -> bool:
    if not smtp_cfg.get("enabled") or not smtp_cfg.get("host"):
        logger.info("SMTP disabled or not configured - skipping email to %s", to_email)
        return False
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{smtp_cfg.get('from_name', 'GlowCamp')} <{smtp_cfg.get('from_email')}>"
        msg["To"] = to_email
        msg.attach(MIMEText(body_html, "html"))
        port = int(smtp_cfg.get("port", 587))
        if smtp_cfg.get("use_tls", True):
            server = smtplib.SMTP(smtp_cfg["host"], port, timeout=10)
            server.starttls()
        else:
            server = smtplib.SMTP_SSL(smtp_cfg["host"], port, timeout=10)
        if smtp_cfg.get("username"):
            server.login(smtp_cfg["username"], smtp_cfg["password"])
        server.sendmail(smtp_cfg.get("from_email"), [to_email], msg.as_string())
        server.quit()
        return True
    except Exception as e:
        logger.exception("Failed to send email: %s", e)
        return False
