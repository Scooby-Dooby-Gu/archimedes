DO
$do$
BEGIN 
  IF NOT (SELECT EXISTS(SELECT 1 FROM information_schema.schemata 
              WHERE schema_name = 'private'))
     OR obj_description('private'::regnamespace, 'pg_namespace') is null
     OR obj_description('private'::regnamespace, 'pg_namespace')::bigint < '1634316771'::bigint THEN
    
    RAISE LOG 'Migrating 1634316771.sql';


update lessons
set content_html = content_html || (
CASE WHEN supplementary_materials_html ~ '\w' THEN
  '<h2>Supplementary materials</h2>' || supplementary_materials_html
ELSE
  ''
END
) || (
CASE WHEN actionable_advice_html ~ '\w' THEN
  '<h2>Actionable advice</h2>' || actionable_advice_html
ELSE
  ''
END) || (
CASE WHEN glossary_html ~ '\w' THEN
  '<h2>Glossary</h2>' || 
  regexp_replace(
    regexp_replace(
      regexp_replace(
        glossary_html, 
        '</h3>', '</figcaption><div class="card-content">', 'ig'
      ),
      '<h3>', '</figure><figure class="card card-definition with-title with-content" expandable="expandable" type="definition"><figcaption class="card-title">', 'ig'
    ),
    '^</figure>', '', 'i'
  )
  || '</figure>'
ELSE
  ''
END
);


alter table "public"."lessons" drop column "actionable_advice_html";

alter table "public"."lessons" drop column "glossary_html";

alter table "public"."lessons" drop column "supplementary_materials_html";

    COMMENT ON SCHEMA private IS '1634316771';
  END IF;
END;
$do$;
