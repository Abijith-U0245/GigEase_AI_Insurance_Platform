-- GigEase: example queries against gigease.db
-- From repository root:
--   sqlite3 gigease.db < database/example_queries.sql
-- From database/ folder:
--   sqlite3 ../gigease.db < example_queries.sql

-- 1) List all user tables (should show T001_enriched … T008_enriched)
SELECT name FROM sqlite_master
WHERE type = 'table' AND name NOT LIKE 'sqlite_%'
ORDER BY name;

-- 2) Row counts per table
SELECT 'T001_enriched' AS tbl, COUNT(*) AS n FROM T001_enriched
UNION ALL SELECT 'T002_enriched', COUNT(*) FROM T002_enriched
UNION ALL SELECT 'T003_enriched', COUNT(*) FROM T003_enriched
UNION ALL SELECT 'T004_enriched', COUNT(*) FROM T004_enriched
UNION ALL SELECT 'T005_enriched', COUNT(*) FROM T005_enriched
UNION ALL SELECT 'T006_enriched', COUNT(*) FROM T006_enriched
UNION ALL SELECT 'T007_enriched', COUNT(*) FROM T007_enriched
UNION ALL SELECT 'T008_enriched', COUNT(*) FROM T008_enriched;

-- 3) Peek at schema + sample rows for one table (replace T001_enriched if needed)
PRAGMA table_info(T001_enriched);
SELECT * FROM T001_enriched LIMIT 5;
