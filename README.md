# Peña Boca Juniors · Gestión de socios

Web para administrar los socios de la peña y el pago de las cuotas mensuales.
Reemplaza la planilla de Excel: cada socio tiene sus datos y una fila de 12 meses
donde se marca (con un click) si pagó la cuota.

- **Socios**: listado con buscador y filtros, grilla de meses del año (click para marcar/desmarcar pago).
- **Deudores**: socios activos con cuotas sin pagar, con botón que abre WhatsApp con el mensaje de aviso ya escrito.
- **Ficha de socio**: editar datos, ver/marcar cuotas por año, eliminar.

## Stack

- Next.js 16 (App Router + Server Actions)
- Prisma **6** + PostgreSQL en [Neon](https://neon.tech)
- Tailwind CSS 4 (paleta azul y amarillo de Boca)

## Puesta en marcha

1. Instalar dependencias:

   ```bash
   npm install
   ```

2. Crear un proyecto en Neon y copiar las cadenas de conexión. Crear `.env` a partir de `.env.example`:

   ```bash
   cp .env.example .env
   ```

   - `DATABASE_URL`: cadena **con pooler** (host con `-pooler`).
   - `DIRECT_URL`: cadena **directa** (sin pooler), la usa Prisma para migrar.
   - `NEXT_PUBLIC_NOMBRE_PENA`: nombre de la peña (encabezado y mensajes de WhatsApp).

3. Crear las tablas:

   ```bash
   npm run db:migrate
   ```

4. (Opcional) Cargar socios de ejemplo:

   ```bash
   npm run db:seed
   ```

5. Levantar la app:

   ```bash
   npm run dev
   ```

   Abrir http://localhost:3000.

## Scripts

| Script            | Qué hace                                           |
| ----------------- | -------------------------------------------------- |
| `npm run dev`     | Servidor de desarrollo                             |
| `npm run build`   | Build de producción                                |
| `npm run db:migrate` | Crea/aplica migraciones en desarrollo           |
| `npm run db:deploy`  | Aplica migraciones en producción (Vercel, etc.) |
| `npm run db:seed` | Inserta socios de ejemplo (solo si la tabla está vacía) |
| `npm run db:studio` | Abre Prisma Studio para ver/editar datos         |
| `npm run typecheck` | Chequeo de tipos                                 |
| `npm run lint`    | ESLint                                             |

## Modelo de datos

- `Socio`: nombre, apellido, nroSocio (único), dni (único), localidad, dirección, teléfono,
  estado (`ACTIVO` / `INACTIVO`), carnet, metodoPago (`TRANSFERENCIA` / `DEBITO_AUTOMATICO` / `COBRADOR`).
- `Pago`: una fila por cuota marcada (`socioId`, `anio`, `mes`, `estado`). `estado` es `PAGO` (la cruz del Excel)
  o `NULO` (no corresponde cobrarla, por ejemplo los meses previos al alta de un socio nuevo).
  Si no hay fila, la cuota está impaga. Al tocar un mes se rota: impago → pagado → nulo → impago.

La deuda se calcula **contra el mes de hoy** y **se arrastra entre años**: cuenta todos los meses
sin marcar (ni pagados ni nulos) desde enero del primer año con cuotas registradas en el sistema
hasta el mes actual. Ej.: en febrero 2027, si no pagó noviembre ni diciembre 2026 ni enero 2027,
debe 3 cuotas. Los socios inactivos no cuentan como deudores.

Cada socio tiene una **fecha de alta** obligatoria (mes/año, por defecto el mes actual). Al crear o
guardar un socio, todas las cuotas anteriores a ese mes que no tengan registro pasan a **nulas**
automáticamente, así no le figuran como deuda. No se modifican las ya pagadas ni las nulas que ya existan.
Cualquier mes se puede anular o desanular a mano tocándolo en la grilla.

Los socios cargados antes de empezar a usar la app pueden quedar con el mes de carga como fecha de alta:
no importa la fecha exacta, solo sirve para que no se les cuenten cuotas previas.

Al pasar un socio a **Inactivo** se pide el mes de baja. Con las fechas de alta y de baja, el listado
muestra arriba un recuento mensual de altas y bajas del año seleccionado.

Los socios con **débito automático** no tienen casillas de meses: la cuota se les descuenta
todos los meses, así que no se marcan pagos a mano y nunca figuran como deudores.

El selector de año sirve para ver o corregir el historial; la deuda siempre se calcula hasta hoy.

## Login y roles

La app pide usuario y contraseña. Hay dos usuarios fijos definidos en `.env` (no hay tabla de usuarios):

- **Administrador** (`ADMIN_USUARIO` / `ADMIN_CLAVE`): acceso a todo menos a la sección Sorteo.
- **Super administrador** (`SUPERADMIN_USUARIO` / `SUPERADMIN_CLAVE`): acceso a todo.

La sesión es una cookie firmada con `AUTH_SECRET` que dura 30 días. El archivo `src/proxy.ts`
(el middleware de Next 16) redirige al login si no hay sesión y bloquea `/sorteo` para el admin.

## Sorteo

En **Sorteo** participan solo los socios activos al día (incluidos los de débito automático).
Se elige título y cantidad de ganadores, y la animación corre a pantalla completa en formato
vertical 9:16 para grabar la pantalla y subirla a Instagram: los nombres giran, se frenan y
revelan a cada ganador con confeti; al final queda la lista completa. Los ganadores se eligen
con el generador aleatorio del navegador antes de empezar y un socio no puede salir dos veces.
El resultado no se guarda en la base.

## Rendimiento

- Cada ruta tiene un `loading.tsx`: el encabezado y un esqueleto llegan al instante mientras
  se consultan los datos (el primer byte tarda ~10 ms en lugar de esperar a la base).
- `experimental.staleTimes.dynamic = 30`: el router reutiliza por 30 s las páginas visitadas al
  navegar; las server actions invalidan esa caché con `revalidatePath`.
- `src/instrumentation.ts` abre la conexión a la base al arrancar el servidor.
- El listado renderiza una sola vista según el dispositivo (tarjetas en celular, tabla en el
  resto) y las 12 casillas de cada socio son un único componente cliente con estilos en CSS
  (`.cuota`) e íconos de un sprite compartido: ~9 KB por socio en vez de ~37 KB.
- El tiempo total de cada página depende de la latencia a Neon (región `sa-east-1`). Desplegar
  la app en esa misma región (por ejemplo Vercel en `gru1`) lo reduce de ~150 ms a ~30 ms.

## Celular

La app está pensada para usarse desde el teléfono: barra de navegación inferior, tarjetas por
socio con la grilla de 12 meses y botón de WhatsApp a ancho completo. En pantallas grandes se
muestra la tabla completa.

## WhatsApp

El teléfono se guarda tal cual se carga (ej. `11 2345 6789`). Al armar el link de
WhatsApp se normaliza al formato internacional argentino (`549` + área + número),
quitando el `0` inicial y el `15` si estuvieran.
