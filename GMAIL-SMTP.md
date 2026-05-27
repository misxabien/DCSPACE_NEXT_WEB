# Send verification codes by Gmail

Registration codes are sent with **nodemailer** over Gmail SMTP. They only go to the **terminal** if SMTP is missing or `VERIFICATION_LOG_CODE=true`.

## 1. Create a Gmail App Password

1. Use a Google account (school `@sdca.edu.ph` if that is your sender).
2. Turn on **2-Step Verification**: https://myaccount.google.com/security
3. Create an **App Password**: https://myaccount.google.com/apppasswords  
   - App: Mail  
   - Device: Other → “DC Space”  
4. Copy the **16-character** password (no spaces).

## 2. Set `.env.local` (repo root)

Used by `npm run dev` on port 3000:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your.name@sdca.edu.ph
SMTP_PASS=xxxx xxxx xxxx xxxx
SMTP_FROM=DC Space <your.name@sdca.edu.ph>
VERIFICATION_LOG_CODE=false
```

Use the same values in **`backend-user/.env`** if you run `npm run dev:all`.

## 3. Restart

```bash
npm run dev
```

Click **Verify Account** — the code should arrive in the **school email inbox** (check spam).

## Troubleshooting

| Problem | Fix |
|--------|-----|
| Still shows terminal code | Set `VERIFICATION_LOG_CODE=false` and fill `SMTP_USER` / `SMTP_PASS` |
| “Email is not set up” | All three: `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` must be non-empty in `.env.local` |
| Gmail auth failed | Use an **App Password**, not your normal Gmail password |
| Message not received | Check spam; `SMTP_USER` should match the Gmail account that owns the app password |
