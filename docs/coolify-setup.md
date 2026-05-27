# Coolify Deployment Setup

One-time manual steps to wire up the Coolify app on `haverford-droplet`.

**Prerequisites:** GitHub Actions must have pushed `ghcr.io/leebaroneau/website:latest` at least once (push to `main` triggers this).

---

## Step 1 — Make GHCR image public

Go to `https://github.com/users/leebaroneau/packages/container/website` → **Package settings** → Change visibility to **Public**.

This avoids needing registry credentials on the Coolify side.

---

## Step 2 — Create the app in Coolify

In Coolify dashboard → **New Resource → Docker Image**:

| Field | Value |
| :---- | :---- |
| Image | `ghcr.io/leebaroneau/website:latest` |
| Port | `3000` |
| Domain | your domain (e.g. `leebarone.dev`) |

---

## Step 3 — Add environment variables

In the app's **Environment Variables** section:

```
RESEND_API_KEY=re_your_actual_key
CONTACT_EMAIL=lee@haverford.com.au
RESEND_FROM_EMAIL=hello@<verified-domain>
PORT=3000
```

**Before setting `RESEND_FROM_EMAIL`:** verify the sending domain in Resend first.
1. Go to `resend.com` → **Domains → Add Domain**
2. Add the DNS records to your domain registrar
3. Wait for verification (usually < 5 min)
4. Use `hello@<verified-domain>` as the value

---

## Step 4 — Deploy and verify

Click **Deploy** in Coolify. Once the container starts, check:

| Path | Expected |
| :--- | :------- |
| `/` | Gateway page |
| `/live/index.html` | Public portfolio |
| `/live/resume.html` | Resume page |
| `/dashboard/index.html` | Private dashboard |

---

## Step 5 — Wire up the deploy webhook

In Coolify → app settings → **Webhooks** → copy the deploy webhook URL.

Go to `https://github.com/leebaroneau/website/settings/secrets/actions` → **New repository secret**:

| Name | Value |
| :--- | :---- |
| `COOLIFY_DEPLOY_WEBHOOK` | webhook URL from Coolify |

Push any commit to `main` — GitHub Actions will build, push, and trigger Coolify to redeploy automatically.

---

## Step 6 — End-to-end verification

After the next Actions run completes:

1. Check Coolify deploy logs — should show a new deploy triggered by the webhook
2. Visit the live site — content should match latest `main`
3. Fill in the contact form — you should receive an email at `lee@haverford.com.au`
