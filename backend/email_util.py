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
    """Fire-and-forget send. Returns True on success, False (with a log) on failure."""
    ok, _ = send_email_with_error(smtp_cfg, to_email, subject, body_html)
    return ok


def send_email_with_error(smtp_cfg: dict, to_email: str, subject: str, body_html: str) -> tuple[bool, str]:
    """Send email and return (ok, error_message). error_message is '' on success."""
    if not smtp_cfg.get("enabled"):
        return False, "SMTP is disabled — turn on 'Enable SMTP' in settings"
    if not smtp_cfg.get("host"):
        return False, "SMTP host is empty"
    if not smtp_cfg.get("from_email"):
        return False, "From Email is required"
    if not to_email:
        return False, "Recipient email is required"

    host = smtp_cfg["host"]
    port = int(smtp_cfg.get("port", 587))
    username = smtp_cfg.get("username") or ""
    password = smtp_cfg.get("password") or ""
    use_tls = bool(smtp_cfg.get("use_tls", True))
    server = None
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{smtp_cfg.get('from_name', 'GlowCamp')} <{smtp_cfg['from_email']}>"
        msg["To"] = to_email
        msg.attach(MIMEText(body_html, "html"))

        if use_tls:
            server = smtplib.SMTP(host, port, timeout=15)
            server.ehlo()
            server.starttls()
            server.ehlo()
        else:
            server = smtplib.SMTP_SSL(host, port, timeout=15)

        if username:
            server.login(username, password)

        server.sendmail(smtp_cfg["from_email"], [to_email], msg.as_string())
        return True, ""
    except smtplib.SMTPAuthenticationError as e:
        return False, f"Authentication failed ({e.smtp_code}): {e.smtp_error.decode('utf-8', 'replace') if isinstance(e.smtp_error, bytes) else e.smtp_error}. If using Gmail, generate an App Password."
    except smtplib.SMTPConnectError as e:
        return False, f"Could not connect to {host}:{port} — {e}"
    except smtplib.SMTPServerDisconnected as e:
        return False, f"Server disconnected — likely wrong port or TLS/SSL mismatch. Try port 465 with TLS off (SSL) or port 587 with TLS on. Detail: {e}"
    except smtplib.SMTPRecipientsRefused as e:
        return False, f"Recipient refused: {e.recipients}"
    except smtplib.SMTPException as e:
        return False, f"SMTP error: {e}"
    except (OSError, TimeoutError) as e:
        return False, f"Network error connecting to {host}:{port} — {e}. Check host, port and that your VPS can reach the SMTP server."
    except Exception as e:
        logger.exception("Unexpected SMTP failure")
        return False, f"Unexpected error: {type(e).__name__}: {e}"
    finally:
        if server is not None:
            try:
                server.quit()
            except Exception:
                pass
