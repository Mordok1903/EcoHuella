# 🍃 EcoHuella Perú

Plataforma web profesional para la medición, gestión y seguimiento de la huella de carbono basada en la normativa internacional **NTP ISO 14064-1** y los estándares del Ministerio del Ambiente (MINAM).

Diseñada para **Personas Naturales, Mypes y Empresas Corporativas** que buscan tomar acción climática con un sistema amigable, preciso y escalable.

---

## ✨ Características Principales

1. **Calculadora por Alcances (Wizard):**
   - **Alcance 1:** Emisiones directas (Gasolina, Diésel, GLP).
   - **Alcance 2:** Emisiones indirectas por energía importada (Electricidad - Factor Red Perú).
   - **Alcance 3:** Otras emisiones indirectas (Vuelos, Residuos sólidos).
   - *Persistencia de datos:* El progreso no se pierde si se recarga la página o se pierde la conexión a internet.
2. **Panel de Control (Dashboard):**
   - Gráficos interactivos de distribución de emisiones (Chart.js).
   - Historial detallado de todas las mediciones pasadas.
   - Cálculo de equivalencias (ej. árboles necesarios para absorber las emisiones).
3. **Generación de Reportes PDF:**
   - Exportación de "Certificados de Medición" listos para auditorías usando `jsPDF`.
4. **Sistema de Autenticación Completo:**
   - Registro diferenciado para Personas o Empresas (captura de DNI/RUC y Razón Social).
   - Inicio de sesión seguro gestionado por Supabase Auth.
   - Rutas protegidas (No se puede acceder al Dashboard sin estar logueado).

---

## 🛠️ Arquitectura y Tecnologías (Stack Técnico)

- **Frontend:** React.js (Scaffolded con Vite)
- **Estilos:** Vanilla CSS corporativo (Diseño Flat/Geométrico, `--radius: 0`)
- **Enrutamiento:** React Router DOM (Single Page Application - SPA)
- **Gráficos:** Chart.js & React-Chartjs-2
- **Iconos:** Lucide React
- **Backend as a Service (BaaS):** Supabase (PostgreSQL + Auth)
- **Exportación PDF:** jsPDF

---

## 📂 Estructura del Proyecto

```text
EcoHuella_Peru/
├── src/
│   ├── assets/            # Imágenes y recursos estáticos
│   ├── components/
│   │   └── layout/        # Componentes estructurales (Navbar, Layout principal)
│   ├── lib/
│   │   └── supabase.js    # Cliente de conexión a la base de datos
│   ├── pages/
│   │   ├── Home.jsx       # Landing page pública
│   │   ├── Auth.jsx       # Pantalla de Login y Registro inteligente
│   │   ├── Calculator.jsx # Asistente de medición de huella
│   │   └── Dashboard.jsx  # Panel de control privado (Protegido)
│   ├── App.jsx            # Configuración de Rutas y ProtectedRoutes
│   └── index.css          # Sistema de diseño global (Variables y Utilidades)
```

---

## 🚀 Guía de Instalación y Uso (Desarrollo Local)

Si eres un colaborador o profesor y deseas correr este proyecto en tu máquina local, sigue estos pasos:

### 1. Clonar el repositorio
```bash
git clone https://github.com/Mordok1903/EcoHuella.git
cd EcoHuella_Peru
```

### 2. Instalar dependencias
Asegúrate de tener [Node.js](https://nodejs.org/) instalado.
```bash
npm install
```

### 3. Configurar Base de Datos (Supabase)
La aplicación requiere tablas específicas para guardar los cálculos. En tu editor SQL de Supabase, debes ejecutar el siguiente *schema*:

```sql
CREATE TABLE calculos (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    nombre_periodo TEXT NOT NULL,
    anio TEXT NOT NULL,
    total_emisiones DECIMAL NOT NULL,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE detalle_alcances (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    calculo_id UUID REFERENCES calculos(id) ON DELETE CASCADE,
    alcance1 DECIMAL NOT NULL,
    alcance2 DECIMAL NOT NULL,
    alcance3 DECIMAL NOT NULL
);

CREATE TABLE factores_emision (
    id SERIAL PRIMARY KEY,
    fuente TEXT UNIQUE NOT NULL,
    factor DECIMAL NOT NULL,
    unidad TEXT NOT NULL
);

-- Factores de ejemplo
INSERT INTO factores_emision (fuente, factor, unidad) VALUES
('gasolina', 2.31, 'kg/litro'), ('diesel', 2.68, 'kg/litro'),
('glp', 2.98, 'kg/kg'), ('electricidad', 0.549, 'kg/kWh'),
('vuelos', 0.255, 'kg/km'), ('residuos', 0.572, 'kg/kg');
```

*(No olvides configurar las credenciales de Supabase en `src/lib/supabase.js` en caso de usar un entorno distinto al principal).*

### 4. Iniciar el Servidor
```bash
npm run dev
```
La aplicación estará disponible en `http://localhost:5173`.

---

## 👥 Flujo de Trabajo Colaborativo

- Todo el trabajo debe enviarse a través de **Pull Requests** hacia la rama `main`.
- Por favor, utiliza los estándares de commits semánticos (`feat:`, `fix:`, `docs:`, `refactor:`).
- Antes de subir código, asegúrate de que no haya errores en consola y que las dependencias estén al día.

**Desarrollado como proyecto académico para FUNBIO.**
