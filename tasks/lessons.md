# Lecciones

## Configurar permisos ANTES de empezar una tanda de edits (2026-08-05)

**Qué pasó:** al agregar el chatbot a toda la web, cada `Edit` disparó un prompt
de permiso. Matías: *"es imposible hacer esto porque pedis tantos permisos, como
5 por minuto es insufrible"*.

**Causa raíz:** `.claude/settings.local.json` no tenía `permissions.defaultMode`.
Aunque `Edit`/`Write` estaban en el allowlist, sin `defaultMode: "acceptEdits"`
el harness igual pregunta. Y faltaban los comandos git de escritura
(`commit`, `push`, `mv`, `checkout`), así que el commit/push también frenaba.

**Regla:** si una tarea implica tocar 3+ archivos, revisar
`.claude/settings.local.json` en el primer paso y completarlo antes de editar.
No arrancar la tanda y descubrir los prompts a mitad de camino.

## No romper JSX al convertir un `className` a template literal (2026-08-05)

**Qué pasó:** al pasar `className="..."` a `` className={`...`} `` en
`StickyMobileCTA.tsx`, el reemplazo se comió la `a` de `<a href=...>` y el build
falló con *"Unexpected token `div`. Expected jsx identifier"*.

**Regla:** al editar la apertura de un tag, incluir el nombre del tag completo en
`old_string` y `new_string`. Y correr `npm run build` antes de decir "listo" —
el error no aparece en el diff a simple vista.

## Mirar el working tree antes de commitear lo que pidió el usuario (2026-08-05)

**Qué pasó:** "comitea y pushea" llegó con ~900 líneas del rework del CRM inbox
sin commitear, más una migración pendiente en Neon (`last_read_at`, `is_demo`).
Commitear todo habría deployado código de `/admin` que consulta columnas que no
existen en prod.

**Regla:** `git status` + `git diff db/schema.sql` antes de commitear. Si hay
trabajo ajeno al pedido, commitear solo lo pedido y avisar. Si el diff toca
schema, la migración va **antes** del deploy.

## `defaultMode` del proyecto pisa el global — usar `auto` (2026-08-22)

**Qué pasó:** Matías tiene `defaultMode: "auto"` en `~/.claude/settings.json`,
pero `.claude/settings.local.json` de este repo tenía `"acceptEdits"`. El local
gana, así que todo lo que no fuera un edit (curl, python3, vercel) pedía
confirmación una por una. Frustración justificada: "es imposible trabajar así".

**Regla:** los settings del proyecto **pisan** los globales. Al arrancar en un
repo, comparar `.claude/settings.local.json` con `~/.claude/settings.json`; si el
global está en `auto`, el local no debe bajarlo a `acceptEdits`. Y allowlistear
la familia entera (`Bash(python3 -c:*)`), no el comando literal exacto — los
one-liners nunca se repiten byte a byte.

## El repo vive en una carpeta con espacio al final (2026-10-21)

**Qué pasó:** el path real es `.../GitHub/MCP Muebles Santa Fe ` (con espacio final).
Un `Write` a `.../MCP Muebles Santa Fe/tasks/...` (sin el espacio) creó una carpeta
hermana nueva fuera del repo, y los `Edit` fallaban con "File does not exist".

**Regla:** usar siempre el path con el espacio final, entre comillas, y si un archivo
"no existe" cuando debería, mirar `pwd | od -c` antes de seguir.
