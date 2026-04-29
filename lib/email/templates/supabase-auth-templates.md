# Supabase Auth Email Templates

Copy-paste each HTML block into:
**Supabase Dashboard → Authentication → Email Templates**

Supabase variables used:
- `{{ .ConfirmationURL }}` — full click-to-confirm link
- `{{ .Token }}` — 6-digit OTP code
- `{{ .Email }}` — recipient's email address
- `{{ .SiteURL }}` — your site URL

---

## 1. Magic Link (Login)

**Subject line:**
```
Your EduDraftAI sign-in link
```

**Body:**
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#F4F7F6;font-family:Arial,sans-serif;color:#1A202C;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F4F7F6;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border-radius:16px;overflow:hidden;border:1px solid #E2E8F0;max-width:560px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:#0D1F3C;padding:28px 40px;">
              <p style="margin:0;font-size:22px;font-weight:800;color:#FFFFFF;letter-spacing:-0.5px;">
                EduDraft<span style="color:#00B4A6;">AI</span>
              </p>
              <p style="margin:4px 0 0;font-size:12px;color:#94A3B8;">by Yuktra AI</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#0D1F3C;">
                Your magic sign-in link
              </h1>
              <p style="margin:0 0 32px;font-size:15px;line-height:1.6;color:#4A5568;">
                Click the button below to sign in to EduDraftAI. No password needed — this link expires in <strong>10 minutes</strong>.
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                <tr>
                  <td align="center">
                    <a href="{{ .ConfirmationURL }}"
                       style="display:inline-block;background:#00B4A6;color:#FFFFFF;font-size:15px;font-weight:700;text-decoration:none;padding:16px 48px;border-radius:8px;">
                      Sign in to EduDraftAI
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 12px;font-size:13px;color:#A0AEC0;line-height:1.6;">
                If the button doesn't work, copy and paste this link into your browser:
              </p>
              <p style="margin:0 0 24px;font-size:12px;color:#718096;word-break:break-all;">
                {{ .ConfirmationURL }}
              </p>

              <p style="margin:0;font-size:13px;color:#A0AEC0;line-height:1.6;">
                If you didn't request this link, you can safely ignore this email — your account is not at risk.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#F4F7F6;padding:20px 40px;border-top:1px solid #E2E8F0;">
              <p style="margin:0;font-size:12px;color:#A0AEC0;text-align:center;">
                © 2026 Yuktra AI &nbsp;·&nbsp;
                <a href="https://edudraftai.com" style="color:#00B4A6;text-decoration:none;">edudraftai.com</a>
                &nbsp;·&nbsp;
                <a href="mailto:info@yuktraai.com" style="color:#A0AEC0;text-decoration:none;">info@yuktraai.com</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 2. Confirm Signup

**Subject line:**
```
Confirm your EduDraftAI account
```

**Body:**
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#F4F7F6;font-family:Arial,sans-serif;color:#1A202C;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F4F7F6;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border-radius:16px;overflow:hidden;border:1px solid #E2E8F0;max-width:560px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:#0D1F3C;padding:28px 40px;">
              <p style="margin:0;font-size:22px;font-weight:800;color:#FFFFFF;letter-spacing:-0.5px;">
                EduDraft<span style="color:#00B4A6;">AI</span>
              </p>
              <p style="margin:4px 0 0;font-size:12px;color:#94A3B8;">by Yuktra AI</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#0D1F3C;">
                Welcome to EduDraftAI!
              </h1>
              <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#4A5568;">
                You're one step away. Click the button below to confirm your email address and activate your account.
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                <tr>
                  <td align="center">
                    <a href="{{ .ConfirmationURL }}"
                       style="display:inline-block;background:#00B4A6;color:#FFFFFF;font-size:15px;font-weight:700;text-decoration:none;padding:14px 40px;border-radius:8px;">
                      Confirm My Account
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 8px;font-size:13px;color:#718096;">
                This link expires in 24 hours. If you didn't create an account on EduDraftAI, you can safely ignore this email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#F4F7F6;padding:20px 40px;border-top:1px solid #E2E8F0;">
              <p style="margin:0;font-size:12px;color:#A0AEC0;text-align:center;">
                © 2026 Yuktra AI &nbsp;·&nbsp;
                <a href="https://edudraftai.com" style="color:#00B4A6;text-decoration:none;">edudraftai.com</a>
                &nbsp;·&nbsp;
                <a href="mailto:info@yuktraai.com" style="color:#A0AEC0;text-decoration:none;">info@yuktraai.com</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 3. Invite User

**Subject line:**
```
You've been invited to EduDraftAI
```

**Body:**
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#F4F7F6;font-family:Arial,sans-serif;color:#1A202C;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F4F7F6;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border-radius:16px;overflow:hidden;border:1px solid #E2E8F0;max-width:560px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:#0D1F3C;padding:28px 40px;">
              <p style="margin:0;font-size:22px;font-weight:800;color:#FFFFFF;letter-spacing:-0.5px;">
                EduDraft<span style="color:#00B4A6;">AI</span>
              </p>
              <p style="margin:4px 0 0;font-size:12px;color:#94A3B8;">by Yuktra AI</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#0D1F3C;">
                You've been invited!
              </h1>
              <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#4A5568;">
                Your college admin has invited you to <strong>EduDraftAI</strong> — the AI-powered teaching content platform for SCTEVT Odisha diploma colleges.
              </p>
              <p style="margin:0 0 28px;font-size:15px;line-height:1.6;color:#4A5568;">
                Click the button below to accept the invitation and set up your account.
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                <tr>
                  <td align="center">
                    <!--
                      IMPORTANT: Use token_hash directly (not ConfirmationURL) to bypass PKCE.
                      ConfirmationURL sends a ?code= param that requires a code_verifier cookie
                      stored in the browser — which doesn't exist when clicking from an email client.
                      token_hash + type=invite uses verifyOtp() server-side — no cookie needed.
                    -->
                    <a href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=invite"
                       style="display:inline-block;background:#00B4A6;color:#FFFFFF;font-size:15px;font-weight:700;text-decoration:none;padding:14px 40px;border-radius:8px;">
                      Accept Invitation
                    </a>
                  </td>
                </tr>
              </table>

              <!-- What you can do -->
              <table width="100%" cellpadding="0" cellspacing="0"
                     style="background:#F4F7F6;border-radius:10px;margin-bottom:28px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#0D1F3C;text-transform:uppercase;letter-spacing:0.5px;">
                      What you can do on EduDraftAI
                    </p>
                    <p style="margin:0 0 6px;font-size:13px;color:#4A5568;">📝 &nbsp;Generate syllabus-locked lesson notes</p>
                    <p style="margin:0 0 6px;font-size:13px;color:#4A5568;">✅ &nbsp;Create MCQ banks and question papers</p>
                    <p style="margin:0 0 6px;font-size:13px;color:#4A5568;">🗓️ &nbsp;Build SCTEVT-pattern internal test plans</p>
                    <p style="margin:0;font-size:13px;color:#4A5568;">📄 &nbsp;Export to Word and print instantly</p>
                  </td>
                </tr>
              </table>

              <p style="margin:0;font-size:13px;color:#A0AEC0;line-height:1.6;">
                This invitation link expires in 24 hours. If you weren't expecting this, you can ignore this email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#F4F7F6;padding:20px 40px;border-top:1px solid #E2E8F0;">
              <p style="margin:0;font-size:12px;color:#A0AEC0;text-align:center;">
                © 2026 Yuktra AI &nbsp;·&nbsp;
                <a href="https://edudraftai.com" style="color:#00B4A6;text-decoration:none;">edudraftai.com</a>
                &nbsp;·&nbsp;
                <a href="mailto:info@yuktraai.com" style="color:#A0AEC0;text-decoration:none;">info@yuktraai.com</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 4. Change Email Address

**Subject line:**
```
Confirm your new email address — EduDraftAI
```

**Body:**
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#F4F7F6;font-family:Arial,sans-serif;color:#1A202C;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F4F7F6;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border-radius:16px;overflow:hidden;border:1px solid #E2E8F0;max-width:560px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:#0D1F3C;padding:28px 40px;">
              <p style="margin:0;font-size:22px;font-weight:800;color:#FFFFFF;letter-spacing:-0.5px;">
                EduDraft<span style="color:#00B4A6;">AI</span>
              </p>
              <p style="margin:4px 0 0;font-size:12px;color:#94A3B8;">by Yuktra AI</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#0D1F3C;">
                Confirm your new email
              </h1>
              <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#4A5568;">
                You requested an email address change on EduDraftAI. Click the button below to confirm your new address. This link expires in 1 hour.
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                <tr>
                  <td align="center">
                    <a href="{{ .ConfirmationURL }}"
                       style="display:inline-block;background:#00B4A6;color:#FFFFFF;font-size:15px;font-weight:700;text-decoration:none;padding:14px 40px;border-radius:8px;">
                      Confirm New Email
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0;font-size:13px;color:#A0AEC0;line-height:1.6;">
                If you didn't request this change, please contact us immediately at
                <a href="mailto:info@yuktraai.com" style="color:#00B4A6;text-decoration:none;">info@yuktraai.com</a>.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#F4F7F6;padding:20px 40px;border-top:1px solid #E2E8F0;">
              <p style="margin:0;font-size:12px;color:#A0AEC0;text-align:center;">
                © 2026 Yuktra AI &nbsp;·&nbsp;
                <a href="https://edudraftai.com" style="color:#00B4A6;text-decoration:none;">edudraftai.com</a>
                &nbsp;·&nbsp;
                <a href="mailto:info@yuktraai.com" style="color:#A0AEC0;text-decoration:none;">info@yuktraai.com</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## Setup Checklist

1. **Supabase → Settings → Authentication → SMTP**
   - Host: `smtp.resend.com`
   - Port: `465`
   - Username: `resend`
   - Password: *(your RESEND_API_KEY)*
   - Sender name: `EduDraftAI`
   - Sender email: `noreply@edudraftai.com`

2. **Supabase → Authentication → Email Templates**
   - Paste each template above into the corresponding slot
   - Save each one

3. **Supabase → Authentication → URL Configuration**
   - Site URL: `https://edudraftai.com`
   - Redirect URLs: `https://edudraftai.com/**`
