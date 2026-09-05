import React, { useEffect, useState } from 'react';

import {
  Factory,
  Zap,
  Truck,
  CheckCircle,
  BarChart3,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';

import { supabase } from '../lib/supabase';


const Calculator = () => {

  // =========================================================
  // ESTADO INICIAL
  // =========================================================

  const estadoInicial = {
    nombrePeriodo: '',
    anio: '2026',

    gasolina: 0,
    diesel: 0,
    glp: 0,

    electricidad: 0,

    vuelos: 0,
    residuos: 0
  };


  const getInitialState = (key, defaultValue) => {

    try {

      const saved = localStorage.getItem(key);

      if (!saved) {
        return defaultValue;
      }

      return JSON.parse(saved);

    } catch (error) {

      console.error(
        `Error leyendo ${key} desde localStorage:`,
        error
      );

      localStorage.removeItem(key);

      return defaultValue;
    }
  };


  const [step, setStep] = useState(() =>
    getInitialState(
      'ecoHuella_step',
      1
    )
  );


  const [formData, setFormData] = useState(() =>
    getInitialState(
      'ecoHuella_formData',
      estadoInicial
    )
  );


  const [factores, setFactores] = useState({});

  const [isSaving, setIsSaving] = useState(false);


  // =========================================================
  // LOCAL STORAGE
  // =========================================================

  useEffect(() => {

    localStorage.setItem(
      'ecoHuella_step',
      JSON.stringify(step)
    );

  }, [step]);


  useEffect(() => {

    localStorage.setItem(
      'ecoHuella_formData',
      JSON.stringify(formData)
    );

  }, [formData]);


  // =========================================================
  // CARGAR FACTORES DE EMISIÓN
  // =========================================================

  useEffect(() => {

    const cargarFactores = async () => {

      try {

        const {
          data,
          error
        } = await supabase
          .from('factores_emision')
          .select('*');


        if (error) {

          console.error(
            'Error cargando factores de emisión:',
            error
          );

          return;
        }


        const factorMap = {};


        (data || []).forEach((factor) => {

          factorMap[factor.fuente] =
            Number(factor.factor);

        });


        setFactores(factorMap);


        console.log(
          'Factores cargados desde Supabase:',
          factorMap
        );


      } catch (error) {

        console.error(
          'Error inesperado cargando factores:',
          error
        );

      }
    };


    cargarFactores();

  }, []);


  // =========================================================
  // CAMBIOS EN EL FORMULARIO
  // =========================================================

  const handleChange = (e) => {

    const {
      name,
      value
    } = e.target;


    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };


  // =========================================================
  // CÁLCULO DE RESULTADOS
  // =========================================================

  const calcularResultados = () => {

    // Factores desde Supabase.
    // Si por algún motivo todavía no cargaron,
    // se utilizan los valores de respaldo.

    const factorGasolina =
      factores.gasolina ?? 2.31;

    const factorDiesel =
      factores.diesel ?? 2.68;

    const factorGLP =
      factores.glp ?? 2.98;

    const factorElectricidad =
      factores.electricidad ?? 0.549;

    const factorVuelos =
      factores.vuelos ?? 0.255;

    const factorResiduos =
      factores.residuos ?? 0.572;


    // ---------------------------------------------------------
    // EMISIONES INDIVIDUALES
    // Conversión kg CO2eq -> toneladas CO2eq
    // ---------------------------------------------------------

    const gasolina =
      (
        (Number(formData.gasolina) || 0) *
        factorGasolina
      ) / 1000;


    const diesel =
      (
        (Number(formData.diesel) || 0) *
        factorDiesel
      ) / 1000;


    const glp =
      (
        (Number(formData.glp) || 0) *
        factorGLP
      ) / 1000;


    const electricidad =
      (
        (Number(formData.electricidad) || 0) *
        factorElectricidad
      ) / 1000;


    const vuelos =
      (
        (Number(formData.vuelos) || 0) *
        factorVuelos
      ) / 1000;


    const residuos =
      (
        (Number(formData.residuos) || 0) *
        factorResiduos
      ) / 1000;


    // ---------------------------------------------------------
    // ALCANCES
    // ---------------------------------------------------------

    const a1 =
      gasolina +
      diesel +
      glp;


    const a2 =
      electricidad;


    const a3 =
      vuelos +
      residuos;


    return {

      gasolina,
      diesel,
      glp,
      electricidad,
      vuelos,
      residuos,

      a1,
      a2,
      a3,

      total:
        a1 +
        a2 +
        a3
    };
  };


  const resultados =
    calcularResultados();


  // =========================================================
  // GUARDAR RESULTADOS EN SUPABASE
  // =========================================================

  const guardarResultados = async () => {

    if (isSaving) {
      return;
    }


    setIsSaving(true);


    try {

      // =====================================================
      // 1. COMPROBAR SESIÓN DE SUPABASE
      // =====================================================

      const {
        data: sessionData,
        error: sessionError
      } = await supabase.auth.getSession();


      if (
        sessionError ||
        !sessionData?.session
      ) {

        console.error(
          'No existe sesión activa:',
          sessionError
        );


        alert(
          'Tu sesión no está activa. Cierra sesión e inicia sesión nuevamente.'
        );

        return;
      }


      // =====================================================
      // 2. OBTENER USUARIO AUTENTICADO
      // =====================================================

      const {
        data: { user },
        error: userError
      } = await supabase.auth.getUser();


      if (
        userError ||
        !user
      ) {

        console.error(
          'No se pudo obtener el usuario:',
          userError
        );


        alert(
          'No se pudo identificar al usuario conectado. Inicia sesión nuevamente.'
        );

        return;
      }


      console.log(
        'Usuario autenticado:',
        user.id
      );


      // =====================================================
      // 3. GUARDAR CÁLCULO PRINCIPAL
      // =====================================================

      const nuevoCalculo = {

        // MUY IMPORTANTE:
        // permite que RLS sepa quién es dueño del cálculo.

        user_id:
          user.id,


        nombre_periodo:
          formData.nombrePeriodo.trim() ||
          'Sin nombre',


        anio:
          formData.anio,


        total_emisiones:
          resultados.total
      };


      const {
        data: calculoData,
        error: calculoError
      } = await supabase
        .from('calculos')
        .insert([
          nuevoCalculo
        ])
        .select()
        .single();


      if (calculoError) {

        console.error(
          'Error guardando cálculo:',
          calculoError
        );


        alert(
          `No se pudo guardar el cálculo.\n\n${calculoError.message}`
        );

        return;
      }


      if (!calculoData) {

        alert(
          'Supabase no devolvió el cálculo creado.'
        );

        return;
      }


      const calculoId =
        calculoData.id;


      console.log(
        'Cálculo creado:',
        calculoId
      );


      // =====================================================
      // 4. GUARDAR DETALLE DE ALCANCES
      // =====================================================

      const {
        error: alcanceError
      } = await supabase
        .from('detalle_alcances')
        .insert([
          {

            calculo_id:
              calculoId,

            alcance1:
              resultados.a1,

            alcance2:
              resultados.a2,

            alcance3:
              resultados.a3
          }
        ]);


      if (alcanceError) {

        console.error(
          'Error guardando detalle_alcances:',
          alcanceError
        );


        alert(
          `El cálculo principal se guardó, pero hubo un problema guardando los alcances.\n\n${alcanceError.message}`
        );

        return;
      }


      // =====================================================
      // 5. PREPARAR DETALLE POR FUENTE
      // =====================================================

      const fuentesData = [

        // -----------------------------------------------------
        // GASOLINA
        // -----------------------------------------------------

        {
          calculo_id:
            calculoId,

          fuente:
            'gasolina',

          cantidad:
            Number(
              formData.gasolina
            ) || 0,

          unidad:
            'L',

          factor:
            factores.gasolina ??
            2.31,

          emisiones_tco2eq:
            resultados.gasolina
        },


        // -----------------------------------------------------
        // DIÉSEL
        // -----------------------------------------------------

        {
          calculo_id:
            calculoId,

          fuente:
            'diesel',

          cantidad:
            Number(
              formData.diesel
            ) || 0,

          unidad:
            'L',

          factor:
            factores.diesel ??
            2.68,

          emisiones_tco2eq:
            resultados.diesel
        },


        // -----------------------------------------------------
        // GLP
        // -----------------------------------------------------

        {
          calculo_id:
            calculoId,

          fuente:
            'glp',

          cantidad:
            Number(
              formData.glp
            ) || 0,

          unidad:
            'kg',

          factor:
            factores.glp ??
            2.98,

          emisiones_tco2eq:
            resultados.glp
        },


        // -----------------------------------------------------
        // ELECTRICIDAD
        // -----------------------------------------------------

        {
          calculo_id:
            calculoId,

          fuente:
            'electricidad',

          cantidad:
            Number(
              formData.electricidad
            ) || 0,

          unidad:
            'kWh',

          factor:
            factores.electricidad ??
            0.549,

          emisiones_tco2eq:
            resultados.electricidad
        },


        // -----------------------------------------------------
        // VUELOS
        // -----------------------------------------------------

        {
          calculo_id:
            calculoId,

          fuente:
            'vuelos',

          cantidad:
            Number(
              formData.vuelos
            ) || 0,

          unidad:
            'km',

          factor:
            factores.vuelos ??
            0.255,

          emisiones_tco2eq:
            resultados.vuelos
        },


        // -----------------------------------------------------
        // RESIDUOS
        // -----------------------------------------------------

        {
          calculo_id:
            calculoId,

          fuente:
            'residuos',

          cantidad:
            Number(
              formData.residuos
            ) || 0,

          unidad:
            'kg',

          factor:
            factores.residuos ??
            0.572,

          emisiones_tco2eq:
            resultados.residuos
        }
      ];


      // =====================================================
      // 6. GUARDAR DETALLE POR FUENTE
      // =====================================================

      const {
        error: fuentesError
      } = await supabase
        .from('detalle_fuentes')
        .insert(
          fuentesData
        );


      if (fuentesError) {

        console.error(
          'Error guardando detalle_fuentes:',
          fuentesError
        );


        alert(
          `El cálculo y los alcances se guardaron, pero hubo un problema guardando el detalle por fuente.\n\n${fuentesError.message}`
        );

        return;
      }


      // =====================================================
      // 7. TODO SE GUARDÓ CORRECTAMENTE
      // =====================================================

      console.log(
        'Cálculo completo guardado correctamente.'
      );


      localStorage.removeItem(
        'ecoHuella_formData'
      );


      localStorage.removeItem(
        'ecoHuella_step'
      );


      setStep(5);


    } catch (error) {

      console.error(
        'Error inesperado guardando resultados:',
        error
      );


      alert(
        `Ocurrió un error inesperado.\n\n${error.message}`
      );


    } finally {

      setIsSaving(false);

    }
  };


  // =========================================================
  // CALCULAR NUEVAMENTE
  // =========================================================

  const calcularDeNuevo = () => {

    setFormData({
      ...estadoInicial
    });


    setStep(1);
  };


  // =========================================================
  // NAVEGACIÓN
  // =========================================================

  const nextStep = () => {

    if (step === 4) {

      guardarResultados();

      return;
    }


    setStep(
      (prev) =>
        prev + 1
    );
  };


  const prevStep = () => {

    if (step <= 1) {
      return;
    }


    setStep(
      (prev) =>
        prev - 1
    );
  };


  // =========================================================
  // INDICADOR DE PASOS
  // =========================================================

  const StepIndicator = () => (

    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '3rem',
        position: 'relative'
      }}
    >

      {/* LÍNEA DE FONDO */}

      <div
        style={{
          position: 'absolute',
          top: '24px',
          left: 0,
          right: 0,

          height: '4px',

          backgroundColor:
            'var(--color-border)',

          zIndex: 0,

          transform:
            'translateY(-50%)'
        }}
      />


      {/* PROGRESO */}

      <div
        style={{
          position: 'absolute',
          top: '24px',
          left: 0,

          width:
            `${((step - 1) / 4) * 100}%`,

          height: '4px',

          backgroundColor:
            'var(--color-primary)',

          zIndex: 0,

          transform:
            'translateY(-50%)',

          transition:
            'width 0.3s'
        }}
      />


      {[
        {
          id: 1,
          label: 'Inicio',
          icon:
            <CheckCircle size={20} />
        },

        {
          id: 2,
          label: 'Alcance 1',
          icon:
            <Factory size={20} />
        },

        {
          id: 3,
          label: 'Alcance 2',
          icon:
            <Zap size={20} />
        },

        {
          id: 4,
          label: 'Alcance 3',
          icon:
            <Truck size={20} />
        },

        {
          id: 5,
          label: 'Resultados',
          icon:
            <BarChart3 size={20} />
        }

      ].map((s) => (

        <div
          key={s.id}

          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',

            zIndex: 1,

            gap: '0.5rem',

            width: '20%'
          }}
        >

          <div
            style={{

              width: '48px',
              height: '48px',

              backgroundColor:
                step >= s.id
                  ? 'var(--color-primary)'
                  : 'var(--color-bg-card)',

              border:
                step >= s.id
                  ? '2px solid var(--color-primary)'
                  : '2px solid var(--color-border)',

              color:
                step >= s.id
                  ? 'white'
                  : 'var(--color-text-muted)',

              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',

              transition:
                'all 0.3s'
            }}
          >

            {s.icon}

          </div>


          <span
            style={{

              fontWeight:
                step >= s.id
                  ? '700'
                  : '500',

              color:
                step >= s.id
                  ? 'var(--color-text-main)'
                  : 'var(--color-text-muted)',

              fontSize:
                '0.875rem',

              textAlign:
                'center'
            }}
          >

            {s.label}

          </span>

        </div>

      ))}

    </div>
  );


  // =========================================================
  // INTERFAZ
  // =========================================================

  return (

    <div
      className="container"

      style={{
        maxWidth: '800px'
      }}
    >

      <h1
        className="h2 text-center mb-2"
      >
        Medición de Huella de Carbono
      </h1>


      <StepIndicator />


      <div className="card">


        {/* ===================================================
            PASO 1
        =================================================== */}

        {step === 1 && (

          <div className="fade-in">

            <h2 className="h3">
              1. Datos Generales del Período
            </h2>


            <p className="text-muted mb-2">
              Defina los parámetros básicos de su medición para poder identificarla posteriormente en su historial.
            </p>


            <div
              className="grid"

              style={{
                gap: '1.5rem',
                marginBottom: '2rem'
              }}
            >

              {/* NOMBRE */}

              <div>

                <label
                  style={{
                    display: 'block',
                    fontWeight: '600',
                    marginBottom: '0.5rem'
                  }}
                >
                  Nombre del Período / Proyecto
                </label>


                <input
                  type="text"

                  name="nombrePeriodo"

                  value={
                    formData.nombrePeriodo
                  }

                  onChange={
                    handleChange
                  }

                  placeholder="Ej. Medición agosto"
                />

              </div>


              {/* AÑO */}

              <div>

                <label
                  style={{
                    display: 'block',
                    fontWeight: '600',
                    marginBottom: '0.5rem'
                  }}
                >
                  Año de Medición
                </label>


                <select
                  name="anio"

                  value={
                    formData.anio
                  }

                  onChange={
                    handleChange
                  }
                >

                  <option value="2027">
                    2027
                  </option>

                  <option value="2026">
                    2026
                  </option>

                  <option value="2025">
                    2025
                  </option>

                  <option value="2024">
                    2024
                  </option>

                </select>

              </div>

            </div>


            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end'
              }}
            >

              <button
                onClick={
                  nextStep
                }
              >

                Siguiente Paso

                <ArrowRight
                  size={20}
                />

              </button>

            </div>

          </div>

        )}


        {/* ===================================================
            PASO 2
        =================================================== */}

        {step === 2 && (

          <div className="fade-in">

            <h2 className="h3">
              2. Alcance 1: Emisiones Directas
            </h2>


            <p className="text-muted mb-2">
              Ingrese el consumo de combustibles en instalaciones o vehículos de su propiedad.
            </p>


            <div
              className="grid"

              style={{
                gap: '1.5rem',
                marginBottom: '2rem'
              }}
            >

              {/* GASOLINA */}

              <div>

                <label
                  style={{
                    display: 'block',
                    fontWeight: '600',
                    marginBottom: '0.5rem'
                  }}
                >
                  Gasolina (Litros)
                </label>


                <input
                  type="number"
                  min="0"

                  name="gasolina"

                  value={
                    formData.gasolina
                  }

                  onChange={
                    handleChange
                  }

                  placeholder="0"
                />

              </div>


              {/* DIÉSEL */}

              <div>

                <label
                  style={{
                    display: 'block',
                    fontWeight: '600',
                    marginBottom: '0.5rem'
                  }}
                >
                  Diésel (Litros)
                </label>


                <input
                  type="number"
                  min="0"

                  name="diesel"

                  value={
                    formData.diesel
                  }

                  onChange={
                    handleChange
                  }

                  placeholder="0"
                />

              </div>


              {/* GLP */}

              <div>

                <label
                  style={{
                    display: 'block',
                    fontWeight: '600',
                    marginBottom: '0.5rem'
                  }}
                >
                  GLP (Kilogramos)
                </label>


                <input
                  type="number"
                  min="0"

                  name="glp"

                  value={
                    formData.glp
                  }

                  onChange={
                    handleChange
                  }

                  placeholder="0"
                />

              </div>

            </div>


            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between'
              }}
            >

              <button
                className="outline"

                onClick={
                  prevStep
                }
              >

                <ArrowLeft
                  size={20}
                />

                Anterior

              </button>


              <button
                onClick={
                  nextStep
                }
              >

                Siguiente Paso

                <ArrowRight
                  size={20}
                />

              </button>

            </div>

          </div>

        )}


        {/* ===================================================
            PASO 3
        =================================================== */}

        {step === 3 && (

          <div className="fade-in">

            <h2 className="h3">
              3. Alcance 2: Emisiones Indirectas
            </h2>


            <p className="text-muted mb-2">
              Ingrese el consumo total de electricidad de la red pública.
            </p>


            <div
              className="grid"

              style={{
                gap: '1.5rem',
                marginBottom: '2rem'
              }}
            >

              <div>

                <label
                  style={{
                    display: 'block',
                    fontWeight: '600',
                    marginBottom: '0.5rem'
                  }}
                >
                  Electricidad Consumida (kWh)
                </label>


                <input
                  type="number"
                  min="0"

                  name="electricidad"

                  value={
                    formData.electricidad
                  }

                  onChange={
                    handleChange
                  }

                  placeholder="0"
                />


                <p
                  style={{
                    fontSize: '0.875rem',
                    marginTop: '0.5rem',

                    color:
                      'var(--color-text-muted)'
                  }}
                >
                  Puede encontrar este dato en sus recibos de electricidad.
                </p>

              </div>

            </div>


            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between'
              }}
            >

              <button
                className="outline"

                onClick={
                  prevStep
                }
              >

                <ArrowLeft
                  size={20}
                />

                Anterior

              </button>


              <button
                onClick={
                  nextStep
                }
              >

                Siguiente Paso

                <ArrowRight
                  size={20}
                />

              </button>

            </div>

          </div>

        )}


        {/* ===================================================
            PASO 4
        =================================================== */}

        {step === 4 && (

          <div className="fade-in">

            <h2 className="h3">
              4. Alcance 3: Otras Emisiones Indirectas
            </h2>


            <p className="text-muted mb-2">
              Ingrese datos de actividades de terceros como viajes de negocios y gestión de residuos.
            </p>


            <div
              className="grid"

              style={{
                gap: '1.5rem',
                marginBottom: '2rem'
              }}
            >

              {/* VUELOS */}

              <div>

                <label
                  style={{
                    display: 'block',
                    fontWeight: '600',
                    marginBottom: '0.5rem'
                  }}
                >
                  Vuelos Aéreos (Kilómetros recorridos)
                </label>


                <input
                  type="number"
                  min="0"

                  name="vuelos"

                  value={
                    formData.vuelos
                  }

                  onChange={
                    handleChange
                  }

                  placeholder="0"
                />

              </div>


              {/* RESIDUOS */}

              <div>

                <label
                  style={{
                    display: 'block',
                    fontWeight: '600',
                    marginBottom: '0.5rem'
                  }}
                >
                  Residuos Sólidos Generados (Kilogramos)
                </label>


                <input
                  type="number"
                  min="0"

                  name="residuos"

                  value={
                    formData.residuos
                  }

                  onChange={
                    handleChange
                  }

                  placeholder="0"
                />

              </div>

            </div>


            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between'
              }}
            >

              <button
                className="outline"

                onClick={
                  prevStep
                }

                disabled={
                  isSaving
                }
              >

                <ArrowLeft
                  size={20}
                />

                Anterior

              </button>


              <button
                onClick={
                  guardarResultados
                }

                disabled={
                  isSaving
                }
              >

                {
                  isSaving
                    ? 'Guardando...'
                    : 'Calcular Resultados'
                }

                <BarChart3
                  size={20}
                />

              </button>

            </div>

          </div>

        )}


        {/* ===================================================
            PASO 5 - RESULTADOS
        =================================================== */}

        {step === 5 && (

          <div
            className="fade-in text-center"
          >

            {/* CHECK */}

            <div
              style={{

                display:
                  'inline-block',

                backgroundColor:
                  '#D1FAE5',

                color:
                  'var(--color-primary-dark)',

                padding:
                  '1rem',

                borderRadius:
                  '50%',

                marginBottom:
                  '1rem'
              }}
            >

              <CheckCircle
                size={48}
              />

            </div>


            <h2 className="h2 mb-2">
              ¡Cálculo Completado!
            </h2>


            <p className="text-muted mb-2">

              Su Huella de Carbono para{' '}

              {
                formData.nombrePeriodo ||
                'el período'
              }

              {' '}

              ha sido calculada y guardada exitosamente.

            </p>


            {/* TOTAL */}

            <div
              style={{

                backgroundColor:
                  'var(--color-bg-main)',

                padding:
                  '2rem',

                border:
                  '1px solid var(--color-border)',

                margin:
                  '2rem 0'
              }}
            >

              <h3
                style={{

                  fontSize:
                    '1.25rem',

                  color:
                    'var(--color-text-muted)',

                  marginBottom:
                    '0.5rem'
                }}
              >
                Total Emisiones
              </h3>


              <p
                style={{

                  fontSize:
                    '4rem',

                  fontWeight:
                    '700',

                  color:
                    'var(--color-secondary)',

                  lineHeight:
                    1
                }}
              >

                {
                  resultados.total
                    .toFixed(2)
                }

                {' '}

                <span
                  style={{
                    fontSize:
                      '1.5rem',

                    fontWeight:
                      '400'
                  }}
                >
                  tCO₂eq
                </span>

              </p>

            </div>


            {/* =================================================
                RESULTADOS POR ALCANCE
            ================================================= */}

            <div
              className="grid"

              style={{

                gridTemplateColumns:
                  'repeat(3, 1fr)',

                gap:
                  '1rem',

                marginBottom:
                  '2rem'
              }}
            >

              {[
                {
                  nombre:
                    'Alcance 1',

                  valor:
                    resultados.a1
                },

                {
                  nombre:
                    'Alcance 2',

                  valor:
                    resultados.a2
                },

                {
                  nombre:
                    'Alcance 3',

                  valor:
                    resultados.a3
                }

              ].map((alcance) => (

                <div
                  key={
                    alcance.nombre
                  }

                  style={{

                    padding:
                      '1rem',

                    border:
                      '1px solid var(--color-border)',

                    backgroundColor:
                      '#F8FAFC'
                  }}
                >

                  <div
                    style={{

                      fontWeight:
                        '600',

                      color:
                        'var(--color-secondary)'
                    }}
                  >
                    {
                      alcance.nombre
                    }
                  </div>


                  <div
                    style={{

                      fontSize:
                        '1.5rem',

                      fontWeight:
                        '700'
                    }}
                  >
                    {
                      alcance.valor
                        .toFixed(4)
                    }
                  </div>


                  <div
                    style={{

                      fontSize:
                        '0.875rem',

                      color:
                        'var(--color-text-muted)'
                    }}
                  >
                    tCO₂eq
                  </div>

                </div>

              ))}

            </div>


            {/* =================================================
                DESGLOSE POR FUENTE
            ================================================= */}

            <div
              style={{
                textAlign: 'left',
                marginBottom: '2rem'
              }}
            >

              <h3 className="h3">
                Desglose por fuente
              </h3>


              <p
                className="text-muted"

                style={{
                  marginBottom:
                    '1rem'
                }}
              >
                Emisiones generadas por cada fuente utilizada en esta medición.
              </p>


              <div
                style={{
                  overflowX:
                    'auto'
                }}
              >

                <table
                  style={{
                    width:
                      '100%',

                    borderCollapse:
                      'collapse'
                  }}
                >

                  <thead>

                    <tr>

                      <th
                        style={{
                          textAlign:
                            'left',

                          padding:
                            '0.75rem'
                        }}
                      >
                        Fuente
                      </th>


                      <th
                        style={{
                          textAlign:
                            'left',

                          padding:
                            '0.75rem'
                        }}
                      >
                        Consumo
                      </th>


                      <th
                        style={{
                          textAlign:
                            'left',

                          padding:
                            '0.75rem'
                        }}
                      >
                        Factor
                      </th>


                      <th
                        style={{
                          textAlign:
                            'left',

                          padding:
                            '0.75rem'
                        }}
                      >
                        Emisiones
                      </th>

                    </tr>

                  </thead>


                  <tbody>

                    {[
                      {
                        nombre:
                          'Gasolina',

                        cantidad:
                          Number(formData.gasolina) || 0,

                        unidad:
                          'L',

                        factor:
                          factores.gasolina ?? 2.31,

                        emisiones:
                          resultados.gasolina
                      },


                      {
                        nombre:
                          'Diésel',

                        cantidad:
                          Number(formData.diesel) || 0,

                        unidad:
                          'L',

                        factor:
                          factores.diesel ?? 2.68,

                        emisiones:
                          resultados.diesel
                      },


                      {
                        nombre:
                          'GLP',

                        cantidad:
                          Number(formData.glp) || 0,

                        unidad:
                          'kg',

                        factor:
                          factores.glp ?? 2.98,

                        emisiones:
                          resultados.glp
                      },


                      {
                        nombre:
                          'Electricidad',

                        cantidad:
                          Number(formData.electricidad) || 0,

                        unidad:
                          'kWh',

                        factor:
                          factores.electricidad ?? 0.549,

                        emisiones:
                          resultados.electricidad
                      },


                      {
                        nombre:
                          'Vuelos',

                        cantidad:
                          Number(formData.vuelos) || 0,

                        unidad:
                          'km',

                        factor:
                          factores.vuelos ?? 0.255,

                        emisiones:
                          resultados.vuelos
                      },


                      {
                        nombre:
                          'Residuos',

                        cantidad:
                          Number(formData.residuos) || 0,

                        unidad:
                          'kg',

                        factor:
                          factores.residuos ?? 0.572,

                        emisiones:
                          resultados.residuos
                      }

                    ].map((fuente) => (

                      <tr
                        key={
                          fuente.nombre
                        }
                      >

                        <td
                          style={{
                            padding:
                              '0.75rem',

                            borderTop:
                              '1px solid var(--color-border)',

                            fontWeight:
                              '600'
                          }}
                        >
                          {
                            fuente.nombre
                          }
                        </td>


                        <td
                          style={{
                            padding:
                              '0.75rem',

                            borderTop:
                              '1px solid var(--color-border)'
                          }}
                        >

                          {
                            fuente.cantidad
                              .toFixed(2)
                          }

                          {' '}

                          {
                            fuente.unidad
                          }

                        </td>


                        <td
                          style={{
                            padding:
                              '0.75rem',

                            borderTop:
                              '1px solid var(--color-border)'
                          }}
                        >

                          {
                            Number(
                              fuente.factor
                            ).toFixed(3)
                          }

                        </td>


                        <td
                          style={{
                            padding:
                              '0.75rem',

                            borderTop:
                              '1px solid var(--color-border)'
                          }}
                        >

                          {
                            fuente.emisiones
                              .toFixed(4)
                          }

                          {' '}

                          tCO₂eq

                        </td>

                      </tr>

                    ))}

                  </tbody>

                </table>

              </div>

            </div>


            {/* =================================================
                BOTONES
            ================================================= */}

            <div
              style={{

                display:
                  'flex',

                gap:
                  '1rem',

                justifyContent:
                  'center',

                flexWrap:
                  'wrap'
              }}
            >

              <button
                className="outline"

                onClick={
                  calcularDeNuevo
                }
              >
                Calcular de Nuevo
              </button>


              <button
                onClick={() => {

                  window.location.href =
                    '/dashboard';

                }}
              >
                Ir a Mi Panel
              </button>

            </div>

          </div>

        )}

      </div>


      {/* =====================================================
          ANIMACIÓN
      ===================================================== */}

      <style>
        {`

          .fade-in {

            animation:
              fadeIn 0.4s ease-in-out;

          }


          @keyframes fadeIn {

            from {

              opacity: 0;

              transform:
                translateY(10px);

            }


            to {

              opacity: 1;

              transform:
                translateY(0);

            }

          }

        `}
      </style>

    </div>
  );
};


export default Calculator;