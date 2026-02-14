# Subscription Expiration System - Deployment Guide

## Environment Variables

You need to add the following environment variable to Vercel:

### CRON_SECRET

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add a new variable:
   - **Name**: `CRON_SECRET`
   - **Value**: Generate a random secret (you can use: `openssl rand -base64 32`)
   - **Environments**: Production, Preview, Development

## Testing the Cron Endpoint

### Manual Test (Local)

```bash
# Set the CRON_SECRET in your .env.local file
CRON_SECRET=your-secret-here

# Test the endpoint
curl -X GET http://localhost:3000/api/cron/check-subscriptions \
  -H "Authorization: Bearer your-secret-here"
```

### Manual Test (Production)

```bash
curl -X GET https://your-domain.vercel.app/api/cron/check-subscriptions \
  -H "Authorization: Bearer your-secret-here"
```

### Expected Response

```json
{
  "success": true,
  "checked": 10,
  "blocked": 2,
  "accounts": ["Comercio A", "Comercio B"],
  "timestamp": "2026-02-14T19:00:00.000Z"
}
```

## Cron Schedule

The cron job runs **daily at 00:00 UTC** (21:00 Argentina time).

You can verify the cron job is configured in your Vercel dashboard:
- Go to **Settings** → **Cron Jobs**
- You should see: `/api/cron/check-subscriptions` scheduled for `0 0 * * *`

## How It Works

### Trial Users (15-day free trial)
- **No grace period**: Account blocked immediately after 15 days
- Condition: `proximo_pago < today AND meses_sin_pagar = 0`

### Paying Customers
- **5-day grace period**: Account blocked 5 days after payment due date
- Condition: `proximo_pago + 5 days < today`

### Middleware Protection
- Every request to `/admin/*` routes checks account status
- If `estado = 'suspendido'` → Redirects to `/suspended`
- If `estado = 'activo'` → Allows access

## Monitoring

Check Vercel logs to monitor cron job executions:
1. Go to your Vercel project
2. Navigate to **Logs**
3. Filter by `/api/cron/check-subscriptions`

## Manual Account Suspension (via Supabase)

If you need to manually suspend an account:

```sql
UPDATE comercios 
SET estado = 'suspendido' 
WHERE id = 'comercio-id-here';
```

To reactivate:

```sql
UPDATE comercios 
SET estado = 'activo',
    proximo_pago = CURRENT_DATE + INTERVAL '30 days'
WHERE id = 'comercio-id-here';
```
