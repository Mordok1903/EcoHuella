import React, {
  useEffect,
  useState
} from 'react';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';

import {
  Bar,
  Doughnut
} from 'react-chartjs-2';

import {
  Download,
  Plus,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';

import {
  Link
} from 'react-router-dom';

import jsPDF from 'jspdf';

import {
  supabase
} from '../lib/supabase';


ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend
);


const Dashboard = () => {

  // =========================================================
  // ESTADOS
  // =========================================================

  const [
    calculos,
    setCalculos
  ] = useState([]);

  const [
    detallesPorCalculo,
    setDetallesPorCalculo
  ] = useState({});

  const [
    fuentesActuales,
    setFuentesActuales
  ] = useState([]);

  const [
    fuentesAnteriores,
    setFuentesAnteriores
  ] = useState([]);

  const [
    loading,
    setLoading
  ] = useState(true);


  // =========================================================
  // NOMBRES
  // =========================================================

  const nombresFuentes = {
    gasolina: 'Gasolina',
    diesel: 'Diésel',
    glp: 'GLP',
    electricidad: 'Electricidad',
    vuelos: 'Vuelos',
    residuos: 'Residuos'
  };


  // =========================================================
  // FECHAS
  // =========================================================

  const formatearFecha = (fecha) => {

    if (!fecha) {
      return '-';
    }

    return new Date(fecha)
      .toLocaleString(
        'es-PE',
        {
          dateStyle: 'medium',
          timeStyle: 'short'
        }
      );
  };


  // =========================================================
  // VARIACIÓN
  // =========================================================

  const calcularVariacion = (
    actual,
    anterior
  ) => {

    const actualNum =
      Number(actual) || 0;

    const anteriorNum =
      Number(anterior) || 0;


    if (
      anteriorNum === 0 &&
      actualNum === 0
    ) {
      return 0;
    }


    if (
      anteriorNum === 0 &&
      actualNum > 0
    ) {
      return null;
    }


    return (
      (
        actualNum -
        anteriorNum
      ) /
      anteriorNum
    ) * 100;
  };


  // =========================================================
  // CARGAR DATOS
  // =========================================================

  useEffect(() => {

    const cargarDashboard = async () => {

      setLoading(true);

      try {

        // -----------------------------------------------------
        // USUARIO ACTUAL
        // -----------------------------------------------------

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

          setLoading(false);

          return;
        }


        // -----------------------------------------------------
        // CÁLCULOS DEL USUARIO
        // -----------------------------------------------------

        const {
          data: calcData,
          error: calcError
        } = await supabase
          .from('calculos')
          .select('*')
          .eq(
            'user_id',
            user.id
          )
          .order(
            'fecha_creacion',
            {
              ascending: false
            }
          );


        if (calcError) {
          throw calcError;
        }


        const listaCalculos =
          calcData || [];


        setCalculos(
          listaCalculos
        );


        if (
          listaCalculos.length === 0
        ) {

          setDetallesPorCalculo({});
          setFuentesActuales([]);
          setFuentesAnteriores([]);
          setLoading(false);

          return;
        }


        // -----------------------------------------------------
        // IDS DE LOS CÁLCULOS
        // -----------------------------------------------------

        const ids =
          listaCalculos.map(
            (calculo) =>
              calculo.id
          );


        // -----------------------------------------------------
        // DETALLES DE ALCANCES
        // -----------------------------------------------------

        const {
          data: detallesData,
          error: detallesError
        } = await supabase
          .from('detalle_alcances')
          .select('*')
          .in(
            'calculo_id',
            ids
          );


        if (detallesError) {
          throw detallesError;
        }


        const detallesMap = {};


        (
          detallesData || []
        ).forEach(
          (detalle) => {

            detallesMap[
              detalle.calculo_id
            ] = detalle;

          }
        );


        setDetallesPorCalculo(
          detallesMap
        );


        // -----------------------------------------------------
        // FUENTES DEL CÁLCULO MÁS RECIENTE
        // -----------------------------------------------------

        const calculoActual =
          listaCalculos[0];


        const {
          data: fuentesActualData,
          error: fuentesActualError
        } = await supabase
          .from('detalle_fuentes')
          .select('*')
          .eq(
            'calculo_id',
            calculoActual.id
          );


        if (fuentesActualError) {
          throw fuentesActualError;
        }


        setFuentesActuales(
          fuentesActualData || []
        );


        // -----------------------------------------------------
        // FUENTES DEL CÁLCULO ANTERIOR
        // -----------------------------------------------------

        if (
          listaCalculos.length >= 2
        ) {

          const calculoAnterior =
            listaCalculos[1];


          const {
            data: fuentesAnteriorData,
            error: fuentesAnteriorError
          } = await supabase
            .from('detalle_fuentes')
            .select('*')
            .eq(
              'calculo_id',
              calculoAnterior.id
            );


          if (fuentesAnteriorError) {
            throw fuentesAnteriorError;
          }


          setFuentesAnteriores(
            fuentesAnteriorData || []
          );

        } else {

          setFuentesAnteriores([]);

        }


      } catch (error) {

        console.error(
          'Error cargando Dashboard:',
          error
        );

      } finally {

        setLoading(false);

      }
    };


    cargarDashboard();

  }, []);


  // =========================================================
  // MEDICIONES ACTUAL Y ANTERIOR
  // =========================================================

  const ultimoCalculo =
    calculos[0] || null;

  const calculoAnterior =
    calculos[1] || null;


  const detallesUltimo =
    ultimoCalculo
      ? detallesPorCalculo[
          ultimoCalculo.id
        ]
      : null;


  // =========================================================
  // COMPARACIÓN POR FUENTES
  // =========================================================

  const comparacionFuentes =
    fuentesActuales.map(
      (actual) => {

        const anterior =
          fuentesAnteriores.find(
            (item) =>
              item.fuente ===
              actual.fuente
          );


        const cantidadAnterior =
          anterior
            ? Number(
                anterior.cantidad
              )
            : 0;


        const cantidadActual =
          Number(
            actual.cantidad
          ) || 0;


        return {

          fuente:
            actual.fuente,

          nombre:
            nombresFuentes[
              actual.fuente
            ] ||
            actual.fuente,

          anterior:
            cantidadAnterior,

          actual:
            cantidadActual,

          unidad:
            actual.unidad,

          emisiones:
            Number(
              actual.emisiones_tco2eq
            ) || 0,

          variacion:
            calcularVariacion(
              cantidadActual,
              cantidadAnterior
            )
        };

      }
    );


  // =========================================================
  // MAYOR AUMENTO / REDUCCIÓN
  // =========================================================

  const variacionesNumericas =
    comparacionFuentes.filter(
      (item) =>
        item.variacion !== null
    );


  const mayorAumento =
    variacionesNumericas.length > 0
      ? variacionesNumericas.reduce(
          (max, item) =>
            item.variacion >
            max.variacion
              ? item
              : max
        )
      : null;


  const mayorReduccion =
    variacionesNumericas.length > 0
      ? variacionesNumericas.reduce(
          (min, item) =>
            item.variacion <
            min.variacion
              ? item
              : min
        )
      : null;


  // =========================================================
  // GRÁFICO DE BARRAS - ALCANCES
  // =========================================================

  const barData = {

    labels: [
      'Alcance 1',
      'Alcance 2',
      'Alcance 3'
    ],

    datasets: [
      {
        label:
          'Emisiones (tCO₂eq)',

        data:
          detallesUltimo
            ? [
                Number(
                  detallesUltimo.alcance1
                ),
                Number(
                  detallesUltimo.alcance2
                ),
                Number(
                  detallesUltimo.alcance3
                )
              ]
            : [
                0,
                0,
                0
              ],

        backgroundColor:
          'rgba(16, 185, 129, 0.8)',

        borderColor:
          '#059669',

        borderWidth: 1
      }
    ]
  };


  // =========================================================
  // GRÁFICO CIRCULAR - ALCANCES
  // =========================================================

  const doughnutData = {

    labels: [
      'Alcance 1',
      'Alcance 2',
      'Alcance 3'
    ],

    datasets: [
      {
        data:
          detallesUltimo
            ? [
                Number(
                  detallesUltimo.alcance1
                ),
                Number(
                  detallesUltimo.alcance2
                ),
                Number(
                  detallesUltimo.alcance3
                )
              ]
            : [
                0,
                0,
                0
              ],

        backgroundColor: [
          '#0EA5E9',
          '#10B981',
          '#F59E0B'
        ],

        borderWidth: 0
      }
    ]
  };


  // =========================================================
  // FORMATO DE VARIACIÓN
  // =========================================================

  const mostrarVariacion = (
    variacion
  ) => {

    if (
      variacion === null
    ) {

      return (
        <span
          style={{
            fontWeight: '700',
            color: '#2563EB'
          }}
        >
          Nuevo consumo
        </span>
      );
    }


    if (
      variacion > 0
    ) {

      return (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.25rem',
            color: '#DC2626',
            fontWeight: '700'
          }}
        >

          <TrendingUp
            size={16}
          />

          +{
            variacion.toFixed(1)
          }%

        </span>
      );
    }


    if (
      variacion < 0
    ) {

      return (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.25rem',
            color: '#059669',
            fontWeight: '700'
          }}
        >

          <TrendingDown
            size={16}
          />

          {
            variacion.toFixed(1)
          }%

        </span>
      );
    }


    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.25rem',
          color:
            'var(--color-text-muted)',
          fontWeight: '700'
        }}
      >

        <Minus size={16} />

        0.0%

      </span>
    );
  };


  // =========================================================
  // PDF
  // =========================================================

  const generarPDF = () => {

    if (
      !ultimoCalculo
    ) {
      return;
    }


    const doc =
      new jsPDF();


    let y = 20;


    const revisarEspacio = (
      espacioNecesario = 15
    ) => {

      if (
        y +
        espacioNecesario >
        270
      ) {

        doc.addPage();

        y = 20;
      }
    };


    // ---------------------------------------------------------
    // TÍTULO
    // ---------------------------------------------------------

    doc.setFont(
      'helvetica',
      'bold'
    );

    doc.setFontSize(18);

    doc.text(
      'Reporte de Medición de Huella de Carbono',
      20,
      y
    );


    y += 8;


    doc.setFontSize(11);

    doc.setFont(
      'helvetica',
      'normal'
    );

    doc.text(
      'EcoHuella Perú',
      20,
      y
    );


    y += 15;


    // ---------------------------------------------------------
    // INFORMACIÓN GENERAL
    // ---------------------------------------------------------

    doc.setFont(
      'helvetica',
      'bold'
    );

    doc.setFontSize(13);

    doc.text(
      'Información de la medición',
      20,
      y
    );


    y += 8;


    doc.setFont(
      'helvetica',
      'normal'
    );

    doc.setFontSize(10);


    doc.text(
      `Nombre del período: ${ultimoCalculo.nombre_periodo}`,
      20,
      y
    );


    y += 6;


    doc.text(
      `Fecha de registro: ${formatearFecha(ultimoCalculo.fecha_creacion)}`,
      20,
      y
    );


    y += 12;


    // ---------------------------------------------------------
    // TOTAL
    // ---------------------------------------------------------

    doc.setFont(
      'helvetica',
      'bold'
    );

    doc.setFontSize(13);

    doc.text(
      'Emisiones totales',
      20,
      y
    );


    y += 8;


    doc.setFontSize(16);

    doc.text(
      `${Number(
        ultimoCalculo.total_emisiones
      ).toFixed(4)} tCO2eq`,
      20,
      y
    );


    y += 14;


    // ---------------------------------------------------------
    // ALCANCES
    // ---------------------------------------------------------

    if (
      detallesUltimo
    ) {

      revisarEspacio(40);


      doc.setFontSize(13);

      doc.text(
        'Emisiones por alcance',
        20,
        y
      );


      y += 8;


      doc.setFont(
        'helvetica',
        'normal'
      );

      doc.setFontSize(10);


      doc.text(
        `Alcance 1 - Emisiones directas: ${Number(detallesUltimo.alcance1).toFixed(4)} tCO2eq`,
        20,
        y
      );


      y += 6;


      doc.text(
        `Alcance 2 - Electricidad adquirida: ${Number(detallesUltimo.alcance2).toFixed(4)} tCO2eq`,
        20,
        y
      );


      y += 6;


      doc.text(
        `Alcance 3 - Otras emisiones indirectas: ${Number(detallesUltimo.alcance3).toFixed(4)} tCO2eq`,
        20,
        y
      );


      y += 14;
    }


    // ---------------------------------------------------------
    // DETALLE POR FUENTE
    // ---------------------------------------------------------

    revisarEspacio(30);


    doc.setFont(
      'helvetica',
      'bold'
    );

    doc.setFontSize(13);

    doc.text(
      'Detalle por fuente',
      20,
      y
    );


    y += 8;


    doc.setFontSize(9);

    doc.setFont(
      'helvetica',
      'normal'
    );


    fuentesActuales.forEach(
      (fuente) => {

        revisarEspacio(10);


        const nombre =
          nombresFuentes[
            fuente.fuente
          ] ||
          fuente.fuente;


        doc.text(
          `${nombre}: ${Number(fuente.cantidad).toFixed(2)} ${fuente.unidad} | Factor: ${Number(fuente.factor).toFixed(3)} | ${Number(fuente.emisiones_tco2eq).toFixed(4)} tCO2eq`,
          20,
          y
        );


        y += 6;

      }
    );


    y += 8;


    // ---------------------------------------------------------
    // COMPARACIÓN
    // ---------------------------------------------------------

    if (
      calculoAnterior &&
      comparacionFuentes.length > 0
    ) {

      revisarEspacio(35);


      doc.setFont(
        'helvetica',
        'bold'
      );

      doc.setFontSize(13);

      doc.text(
        'Comparación con la medición anterior',
        20,
        y
      );


      y += 8;


      doc.setFont(
        'helvetica',
        'normal'
      );

      doc.setFontSize(9);


      doc.text(
        `${calculoAnterior.nombre_periodo} (${formatearFecha(calculoAnterior.fecha_creacion)})`,
        20,
        y
      );


      y += 5;


      doc.text(
        `vs. ${ultimoCalculo.nombre_periodo} (${formatearFecha(ultimoCalculo.fecha_creacion)})`,
        20,
        y
      );


      y += 8;


      comparacionFuentes.forEach(
        (item) => {

          revisarEspacio(10);


          let textoVariacion;


          if (
            item.variacion === null
          ) {

            textoVariacion =
              'Nuevo consumo';

          } else {

            textoVariacion =
              `${
                item.variacion > 0
                  ? '+'
                  : ''
              }${item.variacion.toFixed(1)}%`;
          }


          doc.text(
            `${item.nombre}: ${item.anterior.toFixed(2)} ${item.unidad} -> ${item.actual.toFixed(2)} ${item.unidad} | ${textoVariacion}`,
            20,
            y
          );


          y += 6;

        }
      );


      // -------------------------------------------------------
      // PRINCIPALES CAMBIOS
      // -------------------------------------------------------

      revisarEspacio(35);


      y += 6;


      doc.setFont(
        'helvetica',
        'bold'
      );

      doc.setFontSize(13);

      doc.text(
        'Principales cambios',
        20,
        y
      );


      y += 8;


      doc.setFont(
        'helvetica',
        'normal'
      );

      doc.setFontSize(10);


      if (
        mayorAumento &&
        mayorAumento.variacion > 0
      ) {

        doc.text(
          `Mayor aumento: ${mayorAumento.nombre} (+${mayorAumento.variacion.toFixed(1)}%)`,
          20,
          y
        );

        y += 6;
      }


      if (
        mayorReduccion &&
        mayorReduccion.variacion < 0
      ) {

        doc.text(
          `Mayor reducción: ${mayorReduccion.nombre} (${mayorReduccion.variacion.toFixed(1)}%)`,
          20,
          y
        );

        y += 6;
      }

    }


    // ---------------------------------------------------------
    // PIE DE PÁGINA
    // ---------------------------------------------------------

    const totalPaginas =
      doc.getNumberOfPages();


    for (
      let pagina = 1;
      pagina <= totalPaginas;
      pagina++
    ) {

      doc.setPage(pagina);

      doc.setFont(
        'helvetica',
        'normal'
      );

      doc.setFontSize(8);

      doc.setTextColor(120);


      doc.text(
        'Reporte generado automáticamente por EcoHuella Perú.',
        20,
        287
      );


      doc.text(
        `Página ${pagina} de ${totalPaginas}`,
        190,
        287,
        {
          align: 'right'
        }
      );
    }


    // ---------------------------------------------------------
    // NOMBRE DEL ARCHIVO
    // ---------------------------------------------------------

    const nombreArchivo =
      (
        ultimoCalculo
          .nombre_periodo ||
        'medicion'
      )
        .replace(
          /[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ_-]/g,
          '_'
        );


    doc.save(
      `EcoHuella_${nombreArchivo}.pdf`
    );
  };


  // =========================================================
  // CARGANDO
  // =========================================================

  if (loading) {

    return (
      <div className="container">
        <p>
          Cargando panel...
        </p>
      </div>
    );
  }


  // =========================================================
  // SIN CÁLCULOS
  // =========================================================

  if (
    calculos.length === 0
  ) {

    return (

      <div
        className="container"
        style={{
          textAlign: 'center'
        }}
      >

        <h1 className="h2">
          Mi Panel
        </h1>

        <div className="card">

          <h2 className="h3">
            Aún no tienes mediciones
          </h2>

          <p
            className="text-muted"
            style={{
              marginBottom: '1.5rem'
            }}
          >
            Realiza tu primera medición de Huella de Carbono.
          </p>

          <Link
            to="/calculator"
          >

            <button>
              <Plus size={18} />
              Nueva medición
            </button>

          </Link>

        </div>

      </div>
    );
  }


  // =========================================================
  // INTERFAZ PRINCIPAL
  // =========================================================

  return (

    <div className="container">

      <div
        style={{
          display: 'flex',
          justifyContent:
            'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '2rem'
        }}
      >

        <div>

          <h1 className="h2">
            Mi Panel
          </h1>

          <p className="text-muted">
            Seguimiento de sus mediciones de Huella de Carbono.
          </p>

        </div>


        <div
          style={{
            display: 'flex',
            gap: '0.75rem',
            flexWrap: 'wrap'
          }}
        >

          <button
            className="outline"
            onClick={generarPDF}
          >
            <Download size={18} />
            Descargar PDF
          </button>


          <Link to="/calculator">
            <button>
              <Plus size={18} />
              Nueva medición
            </button>
          </Link>

        </div>

      </div>


      {/* =====================================================
          RESUMEN
      ===================================================== */}

      <div
        className="grid"
        style={{
          gridTemplateColumns:
            'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem'
        }}
      >

        <div className="card">

          <p className="text-muted">
            Emisiones totales
          </p>

          <h2>
            {Number(
              ultimoCalculo.total_emisiones
            ).toFixed(2)}
          </h2>

          <p className="text-muted">
            tCO₂eq
          </p>

        </div>


        <div className="card">

          <p className="text-muted">
            Cálculos realizados
          </p>

          <h2>
            {calculos.length}
          </h2>

          <p className="text-muted">
            mediciones
          </p>

        </div>


        <div className="card">

          <p className="text-muted">
            Equivalencia aproximada
          </p>

          <h2>
            {
              (
                Number(
                  ultimoCalculo.total_emisiones
                ) * 46
              ).toFixed(0)
            }
          </h2>

          <p className="text-muted">
            árboles
          </p>

        </div>

      </div>


      {/* =====================================================
          GRÁFICOS POR ALCANCES
      ===================================================== */}

      <div
        className="grid"
        style={{
          gridTemplateColumns:
            'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem'
        }}
      >

        <div className="card">

          <h2 className="h3">
            Emisiones por Alcance
          </h2>

          <Bar
            data={barData}
            options={{
              responsive: true,
              plugins: {
                legend: {
                  display: false
                }
              }
            }}
          />

        </div>


        <div className="card">

          <h2 className="h3">
            Distribución por Alcance
          </h2>

          <div
            style={{
              maxWidth: '350px',
              margin: '0 auto'
            }}
          >

            <Doughnut
              data={doughnutData}
              options={{
                responsive: true
              }}
            />

          </div>

        </div>

      </div>


      {/* =====================================================
          DETALLE POR FUENTE
      ===================================================== */}

      <div
        className="card"
        style={{
          marginBottom: '2rem'
        }}
      >

        <h2 className="h3">
          Detalle por fuente
        </h2>


        <div
          style={{
            overflowX: 'auto'
          }}
        >

          <table
            style={{
              width: '100%',
              borderCollapse:
                'collapse'
            }}
          >

            <thead>

              <tr>
                <th
                  style={{
                    padding: '0.75rem',
                    textAlign: 'left'
                  }}
                >
                  Fuente
                </th>

                <th
                  style={{
                    padding: '0.75rem',
                    textAlign: 'left'
                  }}
                >
                  Consumo
                </th>

                <th
                  style={{
                    padding: '0.75rem',
                    textAlign: 'left'
                  }}
                >
                  Factor
                </th>

                <th
                  style={{
                    padding: '0.75rem',
                    textAlign: 'left'
                  }}
                >
                  Emisiones
                </th>
              </tr>

            </thead>


            <tbody>

              {fuentesActuales.map(
                (fuente) => (

                  <tr
                    key={
                      fuente.id
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
                        nombresFuentes[
                          fuente.fuente
                        ] ||
                        fuente.fuente
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
                      {Number(
                        fuente.cantidad
                      ).toFixed(2)}{' '}
                      {fuente.unidad}
                    </td>


                    <td
                      style={{
                        padding:
                          '0.75rem',
                        borderTop:
                          '1px solid var(--color-border)'
                      }}
                    >
                      {Number(
                        fuente.factor
                      ).toFixed(3)}
                    </td>


                    <td
                      style={{
                        padding:
                          '0.75rem',
                        borderTop:
                          '1px solid var(--color-border)'
                      }}
                    >
                      {Number(
                        fuente.emisiones_tco2eq
                      ).toFixed(4)}{' '}
                      tCO₂eq
                    </td>

                  </tr>

                )
              )}

            </tbody>

          </table>

        </div>

      </div>


      {/* =====================================================
          COMPARACIÓN
      ===================================================== */}

      {
        calculoAnterior &&
        comparacionFuentes.length > 0 &&
        (

          <div
            className="card"
            style={{
              marginBottom: '2rem'
            }}
          >

            <h2 className="h3">
              Comparación entre mediciones
            </h2>


            <p
              className="text-muted"
              style={{
                marginBottom: '1.5rem'
              }}
            >

              <strong>
                {
                  calculoAnterior
                    .nombre_periodo
                }
              </strong>

              {' '}
              (
              {
                formatearFecha(
                  calculoAnterior
                    .fecha_creacion
                )
              }
              )

              {' → '}

              <strong>
                {
                  ultimoCalculo
                    .nombre_periodo
                }
              </strong>

              {' '}
              (
              {
                formatearFecha(
                  ultimoCalculo
                    .fecha_creacion
                )
              }
              )

            </p>


            <div
              className="grid"
              style={{
                gridTemplateColumns:
                  'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '1rem',
                marginBottom: '1.5rem'
              }}
            >

              <div
                style={{
                  padding: '1rem',
                  backgroundColor:
                    '#FEF2F2',
                  border:
                    '1px solid #FECACA'
                }}
              >

                <p
                  style={{
                    fontWeight: '700'
                  }}
                >
                  Mayor aumento
                </p>

                <p>

                  {
                    mayorAumento &&
                    mayorAumento.variacion > 0
                      ? `${mayorAumento.nombre} (+${mayorAumento.variacion.toFixed(1)}%)`
                      : 'Sin aumentos'
                  }

                </p>

              </div>


              <div
                style={{
                  padding: '1rem',
                  backgroundColor:
                    '#ECFDF5',
                  border:
                    '1px solid #A7F3D0'
                }}
              >

                <p
                  style={{
                    fontWeight: '700'
                  }}
                >
                  Mayor reducción
                </p>

                <p>

                  {
                    mayorReduccion &&
                    mayorReduccion.variacion < 0
                      ? `${mayorReduccion.nombre} (${mayorReduccion.variacion.toFixed(1)}%)`
                      : 'Sin reducciones'
                  }

                </p>

              </div>

            </div>


            <div
              style={{
                overflowX: 'auto'
              }}
            >

              <table
                style={{
                  width: '100%',
                  borderCollapse:
                    'collapse'
                }}
              >

                <thead>

                  <tr>

                    <th
                      style={{
                        padding:
                          '0.75rem',
                        textAlign:
                          'left'
                      }}
                    >
                      Fuente
                    </th>

                    <th
                      style={{
                        padding:
                          '0.75rem',
                        textAlign:
                          'left'
                      }}
                    >
                      Anterior
                    </th>

                    <th
                      style={{
                        padding:
                          '0.75rem',
                        textAlign:
                          'left'
                      }}
                    >
                      Actual
                    </th>

                    <th
                      style={{
                        padding:
                          '0.75rem',
                        textAlign:
                          'left'
                      }}
                    >
                      Variación
                    </th>

                    <th
                      style={{
                        padding:
                          '0.75rem',
                        textAlign:
                          'left'
                      }}
                    >
                      Emisiones actuales
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {
                    comparacionFuentes.map(
                      (item) => (

                        <tr
                          key={
                            item.fuente
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
                            {item.nombre}
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
                              item.anterior
                                .toFixed(2)
                            }{' '}
                            {
                              item.unidad
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
                              item.actual
                                .toFixed(2)
                            }{' '}
                            {
                              item.unidad
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
                              mostrarVariacion(
                                item.variacion
                              )
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
                              item.emisiones
                                .toFixed(4)
                            }{' '}
                            tCO₂eq
                          </td>

                        </tr>

                      )
                    )
                  }

                </tbody>

              </table>

            </div>

          </div>

        )
      }


      {/* =====================================================
          HISTORIAL
      ===================================================== */}

      <div className="card">

        <h2 className="h3">
          Historial de mediciones
        </h2>


        <div
          style={{
            overflowX: 'auto'
          }}
        >

          <table
            style={{
              width: '100%',
              borderCollapse:
                'collapse'
            }}
          >

            <thead>

              <tr>

                <th
                  style={{
                    padding: '0.75rem',
                    textAlign: 'left'
                  }}
                >
                  Nombre
                </th>

                <th
                  style={{
                    padding: '0.75rem',
                    textAlign: 'left'
                  }}
                >
                  Fecha
                </th>

                <th
                  style={{
                    padding: '0.75rem',
                    textAlign: 'left'
                  }}
                >
                  Alcance 1
                </th>

                <th
                  style={{
                    padding: '0.75rem',
                    textAlign: 'left'
                  }}
                >
                  Alcance 2
                </th>

                <th
                  style={{
                    padding: '0.75rem',
                    textAlign: 'left'
                  }}
                >
                  Alcance 3
                </th>

                <th
                  style={{
                    padding: '0.75rem',
                    textAlign: 'left'
                  }}
                >
                  Total
                </th>

              </tr>

            </thead>


            <tbody>

              {
                calculos.map(
                  (calculo) => {

                    const detalle =
                      detallesPorCalculo[
                        calculo.id
                      ];


                    return (

                      <tr
                        key={
                          calculo.id
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
                            calculo
                              .nombre_periodo
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
                            formatearFecha(
                              calculo
                                .fecha_creacion
                            )
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
                            detalle
                              ? Number(
                                  detalle.alcance1
                                ).toFixed(4)
                              : '-'
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
                            detalle
                              ? Number(
                                  detalle.alcance2
                                ).toFixed(4)
                              : '-'
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
                            detalle
                              ? Number(
                                  detalle.alcance3
                                ).toFixed(4)
                              : '-'
                          }
                        </td>


                        <td
                          style={{
                            padding:
                              '0.75rem',
                            borderTop:
                              '1px solid var(--color-border)',
                            fontWeight:
                              '700'
                          }}
                        >
                          {
                            Number(
                              calculo
                                .total_emisiones
                            ).toFixed(4)
                          }{' '}
                          tCO₂eq
                        </td>

                      </tr>

                    );

                  }
                )
              }

            </tbody>

          </table>

        </div>

      </div>

    </div>
  );
};


export default Dashboard;