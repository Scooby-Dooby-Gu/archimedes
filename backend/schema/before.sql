  DO $$DECLARE r record;
        DECLARE s TEXT;
      BEGIN
          FOR r IN select table_schema,table_name
                    from information_schema.views
                    where table_schema = 'public'
          LOOP
              s := 'DROP VIEW ' ||  quote_ident(r.table_schema) || '.' || quote_ident(r.table_name) || ';';

              EXECUTE s;

              RAISE NOTICE 's = % ',s;

          END LOOP;
      END$$;