# UAI · Inventario y Préstamo de Documentos

Aplicación web para gestionar el inventario y préstamo de documentos de auditoría.
React + TypeScript + Vite + Supabase + Netlify.

Instrucciones completas de puesta en marcha: ver el mensaje de entrega o los
comentarios dentro de `supabase/schema.sql`.

Resumen rápido:
1. Crea un proyecto en https://supabase.com
2. Pega y ejecuta UNA vez `supabase/schema.sql` en el SQL Editor de Supabase.
3. Crea el bucket de Storage `documentos-uai` (puede ser privado).
4. Crea tu primer usuario en Authentication → Add user, y conviértelo en
   administrador con el UPDATE indicado en las instrucciones.
5. Copia `.env.example` a `.env` y coloca tu Project URL y anon key.
6. Sube este proyecto a un repositorio de GitHub y conéctalo en Netlify
   (Netlify instala dependencias y compila automáticamente).
7. En Netlify, agrega las mismas dos variables de entorno
   (VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY) y despliega.
