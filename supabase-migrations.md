# Optional Supabase schema changes for new features

If you use Supabase, add these columns so **Re-analyze**, **document detail page**, and **analysis-done email** work as intended.

## 1. Store extracted text on documents (for Re-analyze)

```sql
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS extracted_text text;
```

The upload API now saves extracted text here so Re-analyze can run without re-uploading.

## 2. Store analysis result on rewrites (for document detail page)

```sql
ALTER TABLE rewrites
ADD COLUMN IF NOT EXISTS analysis_result jsonb;
```

The analyze API now saves `{ summary, issues, rewrites, missing_sections }` here so the document detail page can show full analysis without re-running the model.

After adding these columns, deploy or run migrations as usual.
