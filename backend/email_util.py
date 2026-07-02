"""SMTP email helper - safely no-ops if SMTP is not configured.

Encryption modes (`security`):
  - "auto": choose based on port (465→SSL, 587/25→STARTTLS). If chosen mode fails
           with a disconnect/protocol error, try the other one as fallback.
  - "tls":  STARTTLS (usually port 587)
  - "ssl":  Implicit SSL (usually port 465)
  - "none": plaintext (rare)

Backward-compat: if `security` is missing but legacy `use_tls` is False, we treat
that as SSL to preserve prior behaviour.
"""
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import logging

logger = logging.getLogger(__name__)

_SSL_PORTS = {465}
_TLS_PORTS = {587, 25, 2525}


def render(template: str, ctx: dict) -> str:
    out = template
    for k, v in ctx.items():
        out = out.replace("{{" + k + "}}", str(v))
    return out


def _resolve_security(smtp_cfg: dict) -> str:
    """Return one of tls | ssl | none based on config."""
    sec = (smtp_cfg.get("security") or "").lower().strip()
    if sec in ("tls", "ssl", "none"):
        return sec
    # auto or unset — infer from port
    port = int(smtp_cfg.get("port", 587))
    if port in _SSL_PORTS:
        return "ssl"
    if port in _TLS_PORTS:
        return "tls"
    # Legacy fallback based on `use_tls` for old configs
    if smtp_cfg.get("use_tls", True):
        return "tls"
    return "ssl"


def send_email(smtp_cfg: dict, to_email: str, subject: str, body_html: str) -> bool:
    """Fire-and-forget send. Returns True on success, False (with a log) on failure."""
    ok, _ = send_email_with_error(smtp_cfg, to_email, subject, body_html)
    return ok


def _try_send(host: str, port: int, mode: str, username: str, password: str,
              from_email: str, from_name: str, to_email: str,
              subject: str, body_html: str) -> tuple[bool, str]:
    server = None
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{from_name} <{from_email}>"
        msg["To"] = to_email
        msg.attach(MIMEText(body_html, "html"))

        if mode == "ssl":
            server = smtplib.SMTP_SSL(host, port, timeout=20)
        else:
            server = smtplib.SMTP(host, port, timeout=20)
            server.ehlo()
            if mode == "tls":
                server.starttls()
                server.ehlo()

        if username:
            server.login(username, password)

        server.sendmail(from_email, [to_email], msg.as_string())
        return True, ""
    except smtplib.SMTPAuthenticationError as e:
        detail = e.smtp_error.decode("utf-8", "replace") if isinstance(e.smtp_error, bytes) else e.smtp_error
        return False, f"Authentication failed ({e.smtp_code}): {detail}. If using Gmail, generate an App Password at https://myaccount.google.com/apppasswords"
    except smtplib.SMTPConnectError as e:
        return False, f"Could not connect to {host}:{port} — {e}"
    except smtplib.SMTPServerDisconnected as e:
        return False, f"Server disconnected — likely wrong port or SSL/TLS mismatch. Detail: {e}"
    except smtplib.SMTPRecipientsRefused as e:
        return False, f"Recipient refused: {e.recipients}"
    except smtplib.SMTPException as e:
        return False, f"SMTP error: {e}"
    except (OSError, TimeoutError) as e:
        return False, f"Network error connecting to {host}:{port} — {e}. Check host, port and that your VPS can reach the SMTP server."
    except Exception as e:  # noqa: BLE001
        logger.exception("Unexpected SMTP failure")
        return False, f"Unexpected error: {type(e).__name__}: {e}"
    finally:
        if server is not None:
            try:
                server.quit()
            except Exception:
                pass


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

    host = smtp_cfg["host"].strip()
    port = int(smtp_cfg.get("port", 587))
    username = smtp_cfg.get("username") or ""
    password = smtp_cfg.get("password") or ""
    from_email = smtp_cfg["from_email"].strip()
    from_name = smtp_cfg.get("from_name") or "GlowCamp"

    mode = _resolve_security(smtp_cfg)
    ok, err = _try_send(host, port, mode, username, password, from_email, from_name,
                        to_email, subject, body_html)
    if ok:
        return True, ""

    # Auto mode → attempt the other encryption on transient/protocol errors.
    should_fallback = (
        (smtp_cfg.get("security") or "auto").lower() == "auto"
        and ("disconnected" in err.lower() or "protocol" in err.lower() or "unknown" in err.lower())
    )
    if should_fallback:
        alt_mode = "ssl" if mode == "tls" else "tls"
        alt_port = 465 if alt_mode == "ssl" else 587
        logger.info("SMTP auto-fallback: retrying with %s on port %s", alt_mode, alt_port)
        ok2, err2 = _try_send(host, alt_port, alt_mode, username, password, from_email, from_name,
                              to_email, subject, body_html)
        if ok2:
            return True, ""
        # Return the original error but hint we also tried the fallback
        return False, f"{err} (also tried {alt_mode.upper()} on port {alt_port}: {err2})"

    return False, err
