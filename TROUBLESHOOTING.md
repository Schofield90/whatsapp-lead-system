# Troubleshooting Guide

## Common Issues with Adding SOPs

### 1. "Failed to create knowledge entry" Error

This error typically occurs due to one of these issues:

#### A. Missing or Incorrect Environment Variables
**Symptoms:** Error on first attempt to add SOP
**Solution:** 
1. Check your `.env.local` file has correct values:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```
2. If deploying to Vercel, ensure all environment variables are also set in Vercel dashboard

#### B. Row Level Security (RLS) Policy Issues
**Symptoms:** Environment variables are correct but still getting errors
**Solution:**
1. Run the SQL script `supabase/fix-rls-policies.sql` in your Supabase SQL Editor
2. This will create proper RLS policies that allow both anon and service role access

#### C. Knowledge Table Missing
**Symptoms:** Table-related errors in logs
**Solution:**
1. Run the SQL script `supabase/new-knowledge-schema.sql` in your Supabase SQL Editor
2. Verify table creation with `supabase/test-connection.sql`

### 2. Testing Your Setup

#### Quick Test API
Visit: `http://localhost:3000/api/test-supabase` (or your domain)

This endpoint will:
- Check all environment variables
- Test both anon and admin client connections
- Verify table structure
- Provide specific recommendations

#### Manual Database Test
In Supabase SQL Editor, run:
```sql
-- Test insert with anon role
INSERT INTO knowledge (type, content) VALUES ('test', 'Test entry');
-- If this works, your RLS policies are correct

-- Clean up
DELETE FROM knowledge WHERE type = 'test';
```

### 3. Environment Variable Checklist

#### Local Development (.env.local)
- [ ] `NEXT_PUBLIC_SUPABASE_URL` - Your project URL
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Anon/public key  
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Service role key (optional but recommended)

#### Vercel Deployment
- [ ] All environment variables copied to Vercel dashboard
- [ ] Variables are available in all environments (Production, Preview, Development)

### 4. Common Error Codes

| Error Code | Meaning | Solution |
|------------|---------|----------|
| `42501` | RLS Policy Error | Run `fix-rls-policies.sql` |
| `23505` | Duplicate Entry | Entry already exists |
| `42P01` | Table Missing | Run `new-knowledge-schema.sql` |
| JWT errors | Authentication | Check Supabase keys |

### 5. Quick Fixes

#### Option 1: Disable RLS (Quick but less secure)
```sql
ALTER TABLE knowledge DISABLE ROW LEVEL SECURITY;
```

#### Option 2: Enable RLS with proper policies (Recommended)
Run the complete `fix-rls-policies.sql` script.

### 6. Getting Help

1. Check browser console for detailed error messages
2. Check server logs in Vercel dashboard
3. Test with `/api/test-supabase` endpoint
4. Verify database setup with test queries

## Debugging Steps

1. **Check Environment Variables**
   - Use `/api/test-supabase` endpoint
   - Verify all keys are correctly set

2. **Test Database Connection**  
   - Run test queries in Supabase SQL Editor
   - Check RLS policies

3. **Test API Endpoints**
   - Try adding a simple SOP through the UI
   - Check browser console for errors
   - Check server logs

4. **Verify Table Structure**
   - Ensure `knowledge` table exists
   - Check column names and types match schema