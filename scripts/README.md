
# ArenaCUP Automation Scripts

## 1. Setup Database
Run the SQL in `setup_tables.sql` in your Supabase SQL Editor to create the necessary tables for dynamic content.

## 2. Daily Updates
The script `fetch_updates.ts` is designed to run daily. It fetches (or simulates fetching) new data for:
- News
- Curiosities
- City Weather
- Stadium Status

### Prerequisites
1. Ensure you have `ts-node` or use `npx tsx`.
2. Create a `.env` file in the root or set environment variables:
   ```bash
   SUPABASE_URL="your-project-url"
   SUPABASE_SERVICE_ROLE_KEY="your-service-role-key" 
   # WARNING: Use Service Role Key for backend scripts to bypass RLS policies if writing.
   # For local dev, publishable key might work if policies allow public inserts (not recommended for production).
   ```

### Running Locally
```bash
npx tsx scripts/fetch_updates.ts
```

### Automating with GitHub Actions
Create a file `.github/workflows/daily-update.yml`:

```yaml
name: Daily Copa Update

on:
  schedule:
    - cron: '0 8 * * *' # Runs every day at 8am UTC
  workflow_dispatch:

jobs:
  update-data:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install Dependencies
        run: npm ci
      - name: Run Update Script
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
        run: npx tsx scripts/fetch_updates.ts
```

## 3. Integrating into App
To use this dynamic data, update your React components to fetch from Supabase:

```typescript
// Example hook usage
const { data: news } = useQuery({
  queryKey: ['news'],
  queryFn: async () => {
    const { data } = await supabase.from('news').select('*').order('published_at', { ascending: false }).limit(5);
    return data;
  }
});
```
