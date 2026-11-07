"use strict";

/* ==========================================
   REDVECINAL
   MODELO LOGÍSTICO

   P' = rP(1 - P/K)
   CONDICIÓN INICIAL: P(0) = P0

   UNIDAD DE TIEMPO: MESES
========================================== */

const $ = id => document.getElementById(id);

let resultados = null;
let historial = [];
let simulaciones = 0;

let chartIndex = 0;
let chartTimer = null;
let chartPlaying = false;
let chartData = null;

const TIEMPO_UNIDAD = "meses";

/* ==========================================
   NAVEGACIÓN
========================================== */

function cambiarSeccion(nombre) {

    document.querySelectorAll(".page-section").forEach(section => {
        section.classList.remove("active");
    });

    const destino = $(nombre);

    if (!destino) return;

    destino.classList.add("active");

    document.querySelectorAll("[data-section]").forEach(btn => {
        btn.classList.toggle(
            "active",
            btn.dataset.section === nombre
        );
    });

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

    if (nombre === "resultados" && resultados) {
        setTimeout(dibujarGrafica, 100);
    }
}

document.querySelectorAll("[data-section]").forEach(btn => {

    btn.addEventListener("click", () => {
        cambiarSeccion(btn.dataset.section);
    });

});

/* Navegación de botones que llevan a otra sección */

document.addEventListener("click", event => {

    const boton = event.target.closest("[data-go]");

    if (!boton) return;

    cambiarSeccion(boton.dataset.go);

});

/* ==========================================
   PARTÍCULAS
========================================== */

const particleContainer = $("particles");

for (let i = 0; i < 45; i++) {

    const particle = document.createElement("span");

    particle.className = "particle";

    particle.style.left = Math.random() * 100 + "%";
    particle.style.top = Math.random() * 100 + "%";

    particle.style.animationDelay =
        Math.random() * 7 + "s";

    particle.style.animationDuration =
        (5 + Math.random() * 6) + "s";

    particleContainer.appendChild(particle);

}

/* ==========================================
   MENSAJES
========================================== */

let toastTimeout;

function mostrarToast(mensaje) {

    const toast = $("toast");

    toast.textContent = mensaje;

    toast.classList.add("show");

    clearTimeout(toastTimeout);

    toastTimeout = setTimeout(() => {

        toast.classList.remove("show");

    }, 2800);

}

/* ==========================================
   MODELO LOGÍSTICO
========================================== */

function funcion(t, P, r, K) {

    return r * P * (1 - P / K);

}

/* ==========================================
   SOLUCIÓN ANALÍTICA
========================================== */

function solucionExacta(t, P0, r, K) {

    const factor = (K - P0) / P0;

    return K / (
        1 + factor * Math.exp(-r * t)
    );

}

/* ==========================================
   MÉTODO DE HEUN
========================================== */

function metodoHeun(P0, r, K, T, h) {

    const datos = [];

    let t = 0;
    let P = P0;

    datos.push({ t, P });

    let iteracion = 0;

    while (t < T - 1e-10) {

        const paso = Math.min(h, T - t);

        const k1 = funcion(t, P, r, K);

        const predictor = P + paso * k1;

        const k2 = funcion(
            t + paso,
            predictor,
            r,
            K
        );

        P = P + (paso / 2) * (k1 + k2);

        t = Math.min(T, t + paso);

        datos.push({ t, P });

        iteracion++;

        if (iteracion > 5000) {
            break;
        }

    }

    return datos;

}

/* ==========================================
   MÉTODO RUNGE-KUTTA DE CUARTO ORDEN
========================================== */

function metodoRK4(P0, r, K, T, h) {

    const datos = [];

    let t = 0;
    let P = P0;

    datos.push({ t, P });

    let iteracion = 0;

    while (t < T - 1e-10) {

        const paso = Math.min(h, T - t);

        const k1 = funcion(
            t,
            P,
            r,
            K
        );

        const k2 = funcion(
            t + paso / 2,
            P + paso * k1 / 2,
            r,
            K
        );

        const k3 = funcion(
            t + paso / 2,
            P + paso * k2 / 2,
            r,
            K
        );

        const k4 = funcion(
            t + paso,
            P + paso * k3,
            r,
            K
        );

        P = P + (paso / 6) *
            (k1 + 2 * k2 + 2 * k3 + k4);

        t = Math.min(T, t + paso);

        datos.push({ t, P });

        iteracion++;

        if (iteracion > 5000) {
            break;
        }

    }

    return datos;

}

/* ==========================================
   INTERPOLACIÓN
========================================== */

function valorEnTiempo(datos, tiempo) {

    if (!datos || datos.length === 0) {
        return 0;
    }

    if (tiempo <= datos[0].t) {
        return datos[0].P;
    }

    for (let i = 1; i < datos.length; i++) {

        if (tiempo <= datos[i].t + 1e-10) {

            const anterior = datos[i - 1];
            const actual = datos[i];

            const diferencia = actual.t - anterior.t;

            if (diferencia === 0) {
                return actual.P;
            }

            const proporcion =
                (tiempo - anterior.t) / diferencia;

            return anterior.P +
                proporcion * (actual.P - anterior.P);

        }

    }

    return datos[datos.length - 1].P;

}

/* ==========================================
   FUNCIONES NUMÉRICAS
========================================== */

function formato(valor, decimales = 6) {

    if (!Number.isFinite(valor)) {
        return "—";
    }

    return Number(valor).toFixed(decimales);

}

/* ERROR ABSOLUTO */

function errorAbsoluto(real, aproximado) {

    return Math.abs(real - aproximado);

}

/* ERROR RELATIVO PORCENTUAL */

function errorRelativoPorcentual(real, aproximado) {

    if (Math.abs(real) < 1e-14) {
        return null;
    }

    const absoluto = errorAbsoluto(real, aproximado);

    return (absoluto / Math.abs(real)) * 100;

}

/* FORMATO DEL ERROR RELATIVO */

function formatoRelativo(real, aproximado, decimales = 6) {

    const error = errorRelativoPorcentual(
        real,
        aproximado
    );

    if (error === null) {
        return "No definido";
    }

    return formato(error, decimales) + " %";

}

/* PORCENTAJE DE REDUCCIÓN DEL ERROR */

function porcentajeMejora(errorOriginal, errorNuevo) {

    if (errorOriginal === 0) {

        if (errorNuevo === 0) return 0;

        return null;
    }

    return (
        (errorOriginal - errorNuevo) /
        errorOriginal
    ) * 100;

}

/* ==========================================
   VALIDACIÓN DE PARÁMETROS
========================================== */

function validarParametros(P0, r, K, T, h) {

    const valores = [P0, r, K, T, h];

    for (let i = 0; i < valores.length; i++) {

        if (!Number.isFinite(valores[i])) {
            return "Todos los parámetros deben ser números válidos.";
        }

    }

    if (
        P0 <= 0 ||
        r <= 0 ||
        K <= 0 ||
        T <= 0 ||
        h <= 0
    ) {

        return "Todos los parámetros deben ser positivos.";

    }

    if (P0 >= K) {

        return "Los hogares iniciales P₀ deben ser menores que la capacidad máxima K.";

    }

    if (T / (h / 2) > 5000) {

        return "El paso es demasiado pequeño. Reduce la cantidad de iteraciones.";

    }

    return null;

}

/* ==========================================
   EJECUTAR SIMULACIÓN
========================================== */

function ejecutarSimulacion() {

    detenerAnimacion();

    const P0 = Number($("p0").value);
    const r = Number($("r").value);
    const K = Number($("capacity").value);
    const T = Number($("tf").value);
    const h = Number($("h").value);

    const errorValidacion = validarParametros(
        P0,
        r,
        K,
        T,
        h
    );

    if (errorValidacion) {

        mostrarToast(errorValidacion);

        return;

    }

    /* CÁLCULOS PARA h */

    const heun = metodoHeun(
        P0,
        r,
        K,
        T,
        h
    );

    const rk4 = metodoRK4(
        P0,
        r,
        K,
        T,
        h
    );

    /* CÁLCULOS PARA h/2 */

    const heunMitad = metodoHeun(
        P0,
        r,
        K,
        T,
        h / 2
    );

    const rk4Mitad = metodoRK4(
        P0,
        r,
        K,
        T,
        h / 2
    );

    /* VALORES FINALES */

    const exactoFinal = solucionExacta(
        T,
        P0,
        r,
        K
    );

    const heunFinal = heun[heun.length - 1].P;

    const rk4Final = rk4[rk4.length - 1].P;

    const heunMitadFinal =
        heunMitad[heunMitad.length - 1].P;

    const rk4MitadFinal =
        rk4Mitad[rk4Mitad.length - 1].P;

    /* ERRORES ABSOLUTOS */

    const errorHeun = errorAbsoluto(
        exactoFinal,
        heunFinal
    );

    const errorRK4 = errorAbsoluto(
        exactoFinal,
        rk4Final
    );

    const errorHeunMitad = errorAbsoluto(
        exactoFinal,
        heunMitadFinal
    );

    const errorRK4Mitad = errorAbsoluto(
        exactoFinal,
        rk4MitadFinal
    );

    /* ERRORES RELATIVOS */

    const relativoHeun = errorRelativoPorcentual(
        exactoFinal,
        heunFinal
    );

    const relativoRK4 = errorRelativoPorcentual(
        exactoFinal,
        rk4Final
    );

    const relativoHeunMitad = errorRelativoPorcentual(
        exactoFinal,
        heunMitadFinal
    );

    const relativoRK4Mitad = errorRelativoPorcentual(
        exactoFinal,
        rk4MitadFinal
    );

    /* ALMACENAR RESULTADOS */

    resultados = {

        P0,
        r,
        K,
        T,
        h,

        exactoFinal,

        heunFinal,
        rk4Final,

        heunMitadFinal,
        rk4MitadFinal,

        errorHeun,
        errorRK4,

        errorHeunMitad,
        errorRK4Mitad,

        relativoHeun,
        relativoRK4,

        relativoHeunMitad,
        relativoRK4Mitad,

        heun,
        rk4,

        heunMitad,
        rk4Mitad

    };

    simulaciones++;

    $("simulationCount").textContent = simulaciones;

    /* ACTUALIZAR INTERFAZ */

    actualizarResultados();

    generarTabla();

    generarConclusionesIndividuales();

    generarComparacion();

    generarConclusionGeneral();

    guardarHistorial();

    /* ASISTENTE */

    $("assistantFace").textContent = "🐶";

    $("assistantTitle").textContent =
        "¡Simulación completada!";

    $("assistantText").textContent =
        "Los resultados están listos. Se han calculado las soluciones " +
        "analítica, Heun y RK4, junto con sus errores absolutos y relativos. " +
        "También puedes revisar la comparación utilizando h y h/2.";

    $("resultStatus").textContent =
        "● SIMULACIÓN COMPLETADA";

    /* MOSTRAR RESULTADOS */

    cambiarSeccion("resultados");

    prepararGrafica();

    reproducirAnimacion();

    mostrarToast("Simulación calculada correctamente.");

}

$("calculateBtn").addEventListener(
    "click",
    ejecutarSimulacion
);

/* ==========================================
   ACTUALIZAR MÉTRICAS
========================================== */

function actualizarResultados() {

    const d = resultados;

    $("metricExact").textContent =
        formato(d.exactoFinal, 3);

    $("metricHeunAbs").textContent =
        formato(d.errorHeun, 7);

    $("metricHeunRel").textContent =
        formato(d.relativoHeun, 6) + " %";

    $("metricRK4Abs").textContent =
        formato(d.errorRK4, 7);

    $("metricRK4Rel").textContent =
        formato(d.relativoRK4, 6) + " %";

    $("metricStep").textContent =
        formato(d.h, 3) + " / " +
        formato(d.h / 2, 3);

    $("exactValue").textContent =
        formato(d.exactoFinal, 8) + " hogares";

    $("heunValue").textContent =
        formato(d.heunFinal, 8) + " hogares";

    $("rk4Value").textContent =
        formato(d.rk4Final, 8) + " hogares";

    $("heunError").textContent =
        "Error absoluto: " +
        formato(d.errorHeun, 10) +
        " hogares · Error relativo: " +
        formato(d.relativoHeun, 8) +
        " %";

    $("rk4Error").textContent =
        "Error absoluto: " +
        formato(d.errorRK4, 10) +
        " hogares · Error relativo: " +
        formato(d.relativoRK4, 8) +
        " %";

}

/* ==========================================
   TABLAS COMPARATIVAS
========================================== */

function construirTabla(nombre, datosHeun, datosRK4) {

    const d = resultados;

    let html = "";

    html += `
        <div class="table-caption">
            Resultados utilizando h = ${nombre} ${TIEMPO_UNIDAD}
        </div>

        <p class="table-description">
            Los errores se calculan en cada iteración respecto al valor
            obtenido mediante la solución analítica.
        </p>

        <table class="results-table">
            <thead>
                <tr>
                    <th>Iteración</th>
                    <th>Tiempo (${TIEMPO_UNIDAD})</th>
                    <th>Analítica</th>
                    <th>Heun</th>
                    <th>Error abs. Heun</th>
                    <th>Error rel. Heun (%)</th>
                    <th>RK4</th>
                    <th>Error abs. RK4</th>
                    <th>Error rel. RK4 (%)</th>
                </tr>
            </thead>

            <tbody>
    `;

    for (let i = 0; i < datosHeun.length; i++) {

        const tiempo = datosHeun[i].t;

        const exacto = solucionExacta(
            tiempo,
            d.P0,
            d.r,
            d.K
        );

        const valorHeun = datosHeun[i].P;

        const valorRK4 = datosRK4[i].P;

        const absHeun = errorAbsoluto(
            exacto,
            valorHeun
        );

        const absRK4 = errorAbsoluto(
            exacto,
            valorRK4
        );

        const relHeun = errorRelativoPorcentual(
            exacto,
            valorHeun
        );

        const relRK4 = errorRelativoPorcentual(
            exacto,
            valorRK4
        );

        html += `
            <tr>
                <td>${i}</td>

                <td>${formato(tiempo, 4)}</td>

                <td>${formato(exacto, 8)}</td>

                <td>${formato(valorHeun, 8)}</td>

                <td>${formato(absHeun, 9)}</td>

                <td>${formato(relHeun, 7)}</td>

                <td>${formato(valorRK4, 8)}</td>

                <td>${formato(absRK4, 9)}</td>

                <td>${formato(relRK4, 7)}</td>
            </tr>
        `;

    }

    html += `
            </tbody>
        </table>
    `;

    return html;

}

function generarTabla() {

    const d = resultados;

    const tablaH = construirTabla(
        formato(d.h, 4),
        d.heun,
        d.rk4
    );

    const tablaMitad = construirTabla(
        formato(d.h / 2, 4),
        d.heunMitad,
        d.rk4Mitad
    );

    $("tableContainer").innerHTML =
        tablaH + tablaMitad;

}

/* MOSTRAR / OCULTAR TABLAS */

$("showTableBtn").addEventListener("click", () => {

    if (!resultados) {

        mostrarToast("Primero ejecuta una simulación.");

        return;

    }

    $("tableContainer").classList.toggle("hidden");

    $("showTableBtn").textContent =
        $("tableContainer").classList.contains("hidden")
            ? "Ver tablas"
            : "Ocultar tablas";

});

/* ==========================================
   DETERMINAR MÉTODO CON MENOR ERROR
========================================== */

function determinarMejorMetodo() {

    const d = resultados;

    let ganadorH;

    let ganadorMitad;

    if (d.errorRK4 < d.errorHeun) {
        ganadorH = "RK4";
    } else if (d.errorHeun < d.errorRK4) {
        ganadorH = "Heun";
    } else {
        ganadorH = "ambos métodos";
    }

    if (d.errorRK4Mitad < d.errorHeunMitad) {
        ganadorMitad = "RK4";
    } else if (d.errorHeunMitad < d.errorRK4Mitad) {
        ganadorMitad = "Heun";
    } else {
        ganadorMitad = "ambos métodos";
    }

    if (ganadorH === ganadorMitad) {

        if (ganadorH === "ambos métodos") {

            return "Ambos métodos obtuvieron el mismo error en los dos ensayos.";

        }

        return ganadorH +
            " presentó el menor error tanto con h como con h/2.";

    }

    return "Con h, el menor error correspondió a " +
        ganadorH +
        ", mientras que con h/2 correspondió a " +
        ganadorMitad +
        ". La ventaja depende del tamaño de paso utilizado.";

}

/* ==========================================
   CONCLUSIONES INDIVIDUALES
========================================== */

function generarConclusionesIndividuales() {

    const d = resultados;

    const porcentajeFinal =
        (d.exactoFinal / d.K) * 100;

    const hogaresFaltantes =
        Math.max(0, d.K - d.exactoFinal);

    const porcentajeRestante =
        100 - porcentajeFinal;

    const mejorMetodo = determinarMejorMetodo();

    /* ======================================
       SOLUCIÓN ANALÍTICA
    ====================================== */

    $("exactReal").textContent =

        `La solución analítica establece que, partiendo de ` +
        `${formato(d.P0, 2)} hogares participantes, la red alcanzaría ` +
        `aproximadamente ${formato(d.exactoFinal, 2)} hogares al finalizar ` +
        `el periodo de ${formato(d.T, 2)} meses. Este crecimiento representa ` +
        `la incorporación progresiva de nuevos hogares interesados en ` +
        `colaborar con la difusión de reportes y la búsqueda de mascotas ` +
        `extraviadas. Al aproximarse a la capacidad máxima de ` +
        `${formato(d.K, 2)} hogares, el crecimiento se desacelera, por lo ` +
        `que la comunidad tiende a estabilizarse en lugar de aumentar ` +
        `indefinidamente.`;

    $("exactSystems").textContent =

        `Desde Ingeniería de Sistemas, esta solución proporciona una ` +
        `referencia teórica para planificar el crecimiento de una plataforma ` +
        `comunitaria. Conocer la cantidad estimada de participantes permite ` +
        `proyectar necesidades de almacenamiento, capacidad del servidor, ` +
        `administración de usuarios y disponibilidad de los servicios. ` +
        `En este escenario, la red alcanzaría aproximadamente el ` +
        `${formato(porcentajeFinal, 2)} % de su capacidad estimada, dejando ` +
        `un margen aproximado de ${formato(hogaresFaltantes, 2)} hogares, ` +
        `equivalente al ${formato(porcentajeRestante, 2)} % de la capacidad. ` +
        `Esta información puede utilizarse como referencia para anticipar ` +
        `el crecimiento de la infraestructura tecnológica.`;

    /* ======================================
       MÉTODO DE HEUN
    ====================================== */

    $("heunReal").textContent =

        `El método de Heun aproxima la evolución de los hogares ` +
        `participantes utilizando dos pendientes por intervalo. Para los ` +
        `parámetros establecidos y un paso de ${formato(d.h, 4)} meses, ` +
        `obtiene ${formato(d.heunFinal, 2)} hogares al finalizar la ` +
        `simulación, frente a ${formato(d.exactoFinal, 2)} hogares de la ` +
        `solución analítica. Su error absoluto es de ` +
        `${formato(d.errorHeun, 8)} hogares y su error relativo es de ` +
        `${formato(d.relativoHeun, 6)} %. Esta diferencia representa ` +
        `el grado de aproximación del método al crecimiento real descrito ` +
        `matemáticamente por el modelo.`;

    $("heunSystems").textContent =

        `En Ingeniería de Sistemas, Heun puede utilizarse como una ` +
        `herramienta de estimación para estudiar el comportamiento de ` +
        `una plataforma cuando aumenta su número de participantes. ` +
        `Sus aproximaciones permiten elaborar escenarios de demanda ` +
        `y anticipar necesidades de recursos tecnológicos. Aunque ` +
        `presenta una diferencia respecto de la solución exacta, su ` +
        `procedimiento de predicción y corrección permite obtener ` +
        `estimaciones sucesivas de manera relativamente sencilla. ` +
        `Al reducir el paso a ${formato(d.h / 2, 4)} meses, su error ` +
        `absoluto cambia a ${formato(d.errorHeunMitad, 8)} hogares, ` +
        `lo cual permite evaluar si la mayor cantidad de iteraciones ` +
        `mejora la precisión del cálculo.`;

    /* ======================================
       MÉTODO RK4
    ====================================== */

    $("rk4Real").textContent =

        `El método Runge-Kutta de cuarto orden utiliza cuatro pendientes ` +
        `ponderadas para aproximar el crecimiento de los hogares. En este ` +
        `caso obtiene ${formato(d.rk4Final, 2)} hogares al finalizar ` +
        `el intervalo, con una diferencia de ${formato(d.errorRK4, 8)} ` +
        `hogares respecto de la solución analítica. Su error relativo ` +
        `porcentual es de ${formato(d.relativoRK4, 6)} %. El resultado ` +
        `permite observar el mismo comportamiento logístico: crecimiento ` +
        `de la participación comunitaria y desaceleración progresiva ` +
        `cuando la red se aproxima a su capacidad máxima de ` +
        `${formato(d.K, 2)} hogares.`;

    $("rk4Systems").textContent =

        `Para Ingeniería de Sistemas, una aproximación numérica precisa ` +
        `permite realizar estimaciones más confiables al planificar ` +
        `servicios tecnológicos. En una plataforma como RedVecinal, ` +
        `este tipo de cálculo puede apoyar la evaluación de la capacidad ` +
        `necesaria para atender participantes, almacenar reportes y ` +
        `mantener disponibles los servicios. Con un paso de ` +
        `${formato(d.h / 2, 4)} meses, RK4 obtiene un error absoluto ` +
        `de ${formato(d.errorRK4Mitad, 8)} hogares. La comparación de ` +
        `ambos tamaños de paso permite comprobar cómo responde el ` +
        `método ante una mayor cantidad de iteraciones. En estos ` +
        `ensayos, ${mejorMetodo.toLowerCase()}`;

}

/* ==========================================
   COMPARACIÓN h Y h/2
========================================== */

function textoMejora(errorOriginal, errorNuevo) {

    const mejora = porcentajeMejora(
        errorOriginal,
        errorNuevo
    );

    if (mejora === null) {

        return "No es posible calcular el porcentaje de variación porque el error original es cero.";

    }

    if (mejora > 0) {

        return `El error se redujo aproximadamente un ${formato(mejora, 4)} %.`;

    }

    if (mejora < 0) {

        return `El error aumentó aproximadamente un ${formato(Math.abs(mejora), 4)} %.`;

    }

    return "El error se mantuvo sin variación.";

}

function generarComparacion() {

    const d = resultados;

    const mejoraHeun = textoMejora(
        d.errorHeun,
        d.errorHeunMitad
    );

    const mejoraRK4 = textoMejora(
        d.errorRK4,
        d.errorRK4Mitad
    );

    $("stepComparison").innerHTML = `

        <div class="comparison-block">

            <h3>1. Método de Heun</h3>

            <p>
                <strong>Paso original h:</strong>
                ${formato(d.h, 4)} meses.
            </p>

            <p>
                <strong>Resultado:</strong>
                ${formato(d.heunFinal, 8)} hogares.
            </p>

            <p>
                <strong>Error absoluto:</strong>
                ${formato(d.errorHeun, 10)} hogares.
            </p>

            <p>
                <strong>Error relativo:</strong>
                ${formato(d.relativoHeun, 8)} %.
            </p>

            <p>
                <strong>Paso reducido h/2:</strong>
                ${formato(d.h / 2, 4)} meses.
            </p>

            <p>
                <strong>Nuevo resultado:</strong>
                ${formato(d.heunMitadFinal, 8)} hogares.
            </p>

            <p>
                <strong>Error absoluto:</strong>
                ${formato(d.errorHeunMitad, 10)} hogares.
            </p>

            <p>
                <strong>Error relativo:</strong>
                ${formato(d.relativoHeunMitad, 8)} %.
            </p>

            <p>
                <strong>Variación del error:</strong>
                ${mejoraHeun}
            </p>

        </div>

        <div class="comparison-block">

            <h3>2. Método Runge-Kutta RK4</h3>

            <p>
                <strong>Paso original h:</strong>
                ${formato(d.h, 4)} meses.
            </p>

            <p>
                <strong>Resultado:</strong>
                ${formato(d.rk4Final, 8)} hogares.
            </p>

            <p>
                <strong>Error absoluto:</strong>
                ${formato(d.errorRK4, 10)} hogares.
            </p>

            <p>
                <strong>Error relativo:</strong>
                ${formato(d.relativoRK4, 8)} %.
            </p>

            <p>
                <strong>Paso reducido h/2:</strong>
                ${formato(d.h / 2, 4)} meses.
            </p>

            <p>
                <strong>Nuevo resultado:</strong>
                ${formato(d.rk4MitadFinal, 8)} hogares.
            </p>

            <p>
                <strong>Error absoluto:</strong>
                ${formato(d.errorRK4Mitad, 10)} hogares.
            </p>

            <p>
                <strong>Error relativo:</strong>
                ${formato(d.relativoRK4Mitad, 8)} %.
            </p>

            <p>
                <strong>Variación del error:</strong>
                ${mejoraRK4}
            </p>

        </div>

        <div class="comparison-block">

            <h3>3. Comparación de precisión</h3>

            <p>
                <strong>Solución analítica:</strong>
                ${formato(d.exactoFinal, 8)} hogares.
            </p>

            <p>
                <strong>Menor error con h:</strong>
                ${
                    d.errorRK4 < d.errorHeun
                        ? "RK4"
                        : d.errorHeun < d.errorRK4
                            ? "Heun"
                            : "Ambos métodos presentan el mismo error."
                }
            </p>

            <p>
                <strong>Menor error con h/2:</strong>
                ${
                    d.errorRK4Mitad < d.errorHeunMitad
                        ? "RK4"
                        : d.errorHeunMitad < d.errorRK4Mitad
                            ? "Heun"
                            : "Ambos métodos presentan el mismo error."
                }
            </p>

        </div>

    `;

    /* CONCLUSIÓN AUTOMÁTICA */

    let texto = "";

    const heunMejora =
        d.errorHeunMitad < d.errorHeun;

    const rk4Mejora =
        d.errorRK4Mitad < d.errorRK4;

    if (heunMejora && rk4Mejora) {

        texto =
            `Al reducir el paso de integración de h = ${formato(d.h, 4)} ` +
            `a h/2 = ${formato(d.h / 2, 4)} meses, tanto Heun como RK4 ` +
            `disminuyeron sus errores respecto a la solución analítica. ` +
            `Esto demuestra que, para los parámetros estudiados, utilizar ` +
            `intervalos más pequeños permitió obtener aproximaciones ` +
            `más cercanas al resultado exacto. En el contexto de RedVecinal, ` +
            `una mejor aproximación contribuye a estimar con mayor precisión ` +
            `la evolución de los hogares participantes.`;

    } else if (heunMejora && !rk4Mejora) {

        texto =
            `Al reducir el paso de integración, Heun disminuyó su error, ` +
            `mientras que RK4 no presentó una reducción en esta comparación. ` +
            `Esto muestra que el efecto de disminuir el tamaño del paso ` +
            `debe analizarse individualmente para cada método. La elección ` +
            `de una aproximación adecuada depende del error obtenido y ` +
            `de la cantidad de iteraciones necesarias para realizar el cálculo.`;

    } else if (!heunMejora && rk4Mejora) {

        texto =
            `Al reducir el paso de integración, RK4 disminuyó su error, ` +
            `mientras que Heun no presentó una reducción en esta comparación. ` +
            `Esto permite observar que los métodos pueden responder de ` +
            `manera diferente ante un cambio en el tamaño del intervalo. ` +
            `Por ello, es importante comparar los resultados numéricos ` +
            `con la solución analítica y no asumir que ambos métodos ` +
            `mejorarán necesariamente en la misma proporción.`;

    } else {

        texto =
            `En este ensayo, reducir el paso a la mitad no produjo una ` +
            `disminución del error para ambos métodos. Este comportamiento ` +
            `puede presentarse cuando las aproximaciones ya son muy cercanas ` +
            `al valor exacto o por efectos del cálculo numérico. Por ello, ` +
            `la comparación debe basarse en los errores obtenidos y en ` +
            `la precisión alcanzada por cada procedimiento.`;

    }

    texto +=
        ` Para la planificación de RedVecinal, estos resultados ayudan ` +
        `a evaluar qué procedimiento proporciona una estimación más ` +
        `adecuada del crecimiento de la comunidad.`;

    $("comparisonConclusion").textContent = texto;

}

/* ==========================================
   CONCLUSIÓN GENERAL
========================================== */

function generarConclusionGeneral() {

    const d = resultados;

    const porcentaje =
        (d.exactoFinal / d.K) * 100;

    const faltantes =
        Math.max(0, d.K - d.exactoFinal);

    const mejorMetodo = determinarMejorMetodo();

    $("generalReal").textContent =

        `La simulación representa el crecimiento de una comunidad que ` +
        `incorpora hogares para colaborar con la difusión de reportes y ` +
        `el reencuentro de mascotas extraviadas. A partir de ` +
        `${formato(d.P0, 2)} hogares iniciales, el modelo estima que al ` +
        `cabo de ${formato(d.T, 2)} meses se alcanzaría una participación ` +
        `aproximada de ${formato(d.exactoFinal, 2)} hogares. Esto equivale ` +
        `al ${formato(porcentaje, 2)} % de la capacidad máxima establecida, ` +
        `de ${formato(d.K, 2)} hogares. Todavía existiría un margen teórico ` +
        `de ${formato(faltantes, 2)} hogares antes de alcanzar esa ` +
        `capacidad. El comportamiento logístico muestra que el crecimiento ` +
        `disminuye a medida que la red se aproxima a su límite. Estos ` +
        `valores son hipotéticos y dependen de los parámetros introducidos, ` +
        `por lo que no constituyen una predicción real de participación.`;

    $("generalSystems").textContent =

        `Desde la perspectiva de Ingeniería de Sistemas, el análisis ` +
        `permite comprender cómo un servicio digital puede evolucionar ` +
        `cuando aumenta su cantidad de participantes y cómo una capacidad ` +
        `máxima influye en su crecimiento. La estimación de hogares ` +
        `puede servir como referencia para planificar servidores, ` +
        `almacenamiento, disponibilidad, mantenimiento y otros recursos ` +
        `tecnológicos. La comparación de los métodos permite observar ` +
        `las diferencias entre sus errores absolutos y relativos cuando ` +
        `se utiliza h y h/2. En estos ensayos, ${mejorMetodo.toLowerCase()} ` +
        `Sin embargo, para una planificación real también sería necesario ` +
        `incorporar datos observados, cambios en la tasa de incorporación, ` +
        `niveles de actividad de los hogares y restricciones propias ` +
        `de la infraestructura tecnológica.`;

}

/* ==========================================
   PREPARAR GRÁFICA
========================================== */

function prepararGrafica() {

    const d = resultados;

    const cantidad = 180;

    chartData = [];

    for (let i = 0; i <= cantidad; i++) {

        const t = d.T * i / cantidad;

        chartData.push({

            t,

            exacto: solucionExacta(
                t,
                d.P0,
                d.r,
                d.K
            ),

            heun: valorEnTiempo(
                d.heun,
                t
            ),

            rk4: valorEnTiempo(
                d.rk4,
                t
            )

        });

    }

    chartIndex = 0;

    dibujarGrafica();

}

/* ==========================================
   DIBUJAR GRÁFICA
========================================== */

function dibujarGrafica() {

    const canvas = $("mainChart");

    if (!canvas || !chartData || !resultados) {
        return;
    }

    const rect = canvas.getBoundingClientRect();

    const width = Math.max(300, rect.width);

    const height = 300;

    const ratio = window.devicePixelRatio || 1;

    canvas.width = width * ratio;
    canvas.height = height * ratio;

    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    ctx.setTransform(
        ratio,
        0,
        0,
        ratio,
        0,
        0
    );

    ctx.clearRect(
        0,
        0,
        width,
        height
    );

    const margen = {

        left: 58,
        right: 25,
        top: 25,
        bottom: 45

    };

    const ancho =
        width - margen.left - margen.right;

    const alto =
        height - margen.top - margen.bottom;

    const visibles =
        chartData.slice(0, chartIndex + 1);

    const maxY =
        resultados.K * 1.08;

    const x = t =>

        margen.left +
        (t / resultados.T) * ancho;

    const y = valor =>

        margen.top +
        alto -
        (valor / maxY) * alto;

    /* ESTILOS */

    ctx.font = "11px Nunito";

    ctx.fillStyle = "#c4b5d2";

    ctx.strokeStyle = "rgba(190,160,215,.18)";

    ctx.lineWidth = 1;

    /* EJES HORIZONTALES */

    for (let i = 0; i <= 5; i++) {

        const valor = maxY * i / 5;

        const posY = y(valor);

        ctx.beginPath();

        ctx.moveTo(
            margen.left,
            posY
        );

        ctx.lineTo(
            width - margen.right,
            posY
        );

        ctx.stroke();

        ctx.fillText(
            formato(valor, 0),
            7,
            posY + 4
        );

    }

    /* EJES VERTICALES */

    for (let i = 0; i <= 5; i++) {

        const tiempo =
            resultados.T * i / 5;

        const posX = x(tiempo);

        ctx.beginPath();

        ctx.moveTo(
            posX,
            margen.top
        );

        ctx.lineTo(
            posX,
            height - margen.bottom
        );

        ctx.stroke();

        ctx.fillText(
            formato(tiempo, 1),
            posX - 10,
            height - 15
        );

    }

    /* LÍNEA DE CAPACIDAD */

    ctx.beginPath();

    ctx.setLineDash([6, 5]);

    ctx.strokeStyle = "rgba(255,255,255,.5)";

    ctx.lineWidth = 1.5;

    ctx.moveTo(
        margen.left,
        y(resultados.K)
    );

    ctx.lineTo(
        width - margen.right,
        y(resultados.K)
    );

    ctx.stroke();

    ctx.setLineDash([]);

    ctx.fillStyle = "#d8c5e8";

    ctx.fillText(
        "Capacidad K",
        width - 100,
        y(resultados.K) - 8
    );

    /* NOMBRES DE EJES */

    ctx.fillStyle = "#cbb9d9";

    ctx.fillText(
        "Hogares",
        margen.left,
        14
    );

    ctx.fillText(
        "Tiempo (meses)",
        width - 115,
        height - 4
    );

    /* DIBUJAR CADA MÉTODO */

    function trazar(propiedad, color) {

        if (visibles.length === 0) {
            return;
        }

        ctx.beginPath();

        ctx.strokeStyle = color;

        ctx.lineWidth = 2.7;

        ctx.lineJoin = "round";

        visibles.forEach((p, i) => {

            const px = x(p.t);

            const py = y(p[propiedad]);

            if (i === 0) {

                ctx.moveTo(px, py);

            } else {

                ctx.lineTo(px, py);

            }

        });

        ctx.stroke();

    }

    trazar("exacto", "#e8a3d5");

    trazar("heun", "#9b91f3");

    trazar("rk4", "#8de1b6");

    /* PROGRESO */

    const porcentaje = Math.round(

        chartIndex /
        (chartData.length - 1) *
        100

    );

    $("chartProgress").textContent =
        "Progreso de animación: " +
        porcentaje +
        "%";

}

/* ==========================================
   ANIMACIÓN DE GRÁFICA
========================================== */

function detenerAnimacion() {

    if (chartTimer !== null) {

        clearInterval(chartTimer);

        chartTimer = null;

    }

    chartPlaying = false;

    if ($("playChartBtn")) {

        $("playChartBtn").textContent =
            "▶ Reproducir";

    }

}

function reproducirAnimacion() {

    if (!chartData) return;

    if (chartIndex >= chartData.length - 1) {

        chartIndex = 0;

    }

    if (chartPlaying) return;

    chartPlaying = true;

    $("playChartBtn").textContent =
        "Ⅱ Pausar";

    chartTimer = setInterval(() => {

        if (chartIndex < chartData.length - 1) {

            chartIndex += 2;

            if (chartIndex >= chartData.length - 1) {

                chartIndex = chartData.length - 1;

            }

            dibujarGrafica();

        } else {

            detenerAnimacion();

            $("chartProgress").textContent =
                "Animación completada · 100%";

        }

    }, 35);

}

/* REPRODUCIR / PAUSAR */

$("playChartBtn").addEventListener("click", () => {

    if (!chartData) {

        mostrarToast("Primero ejecuta una simulación.");

        return;

    }

    if (chartPlaying) {

        detenerAnimacion();

    } else {

        reproducirAnimacion();

    }

});

/* REINICIAR GRÁFICA */

$("restartChartBtn").addEventListener("click", () => {

    if (!chartData) {

        mostrarToast("Primero ejecuta una simulación.");

        return;

    }

    detenerAnimacion();

    chartIndex = 0;

    dibujarGrafica();

    reproducirAnimacion();

});

/* ACTUALIZAR AL CAMBIAR EL TAMAÑO DE VENTANA */

window.addEventListener("resize", () => {

    if (chartData) {

        dibujarGrafica();

    }

});

/* ==========================================
   HISTORIAL
========================================== */

function guardarHistorial() {

    const d = resultados;

    const registro = {

        fecha: new Date().toLocaleString("es-BO"),

        P0: d.P0,
        r: d.r,
        K: d.K,
        T: d.T,
        h: d.h,

        exacto: d.exactoFinal,

        heun: d.heunFinal,
        rk4: d.rk4Final,

        heunMitad: d.heunMitadFinal,
        rk4Mitad: d.rk4MitadFinal,

        errorHeun: d.errorHeun,
        errorRK4: d.errorRK4,

        relativoHeun: d.relativoHeun,
        relativoRK4: d.relativoRK4

    };

    historial.unshift(registro);

    persistirHistorial();

    mostrarHistorial();

}

function persistirHistorial() {

    try {

        localStorage.setItem(
            "redvecinal_historial",
            JSON.stringify(historial)
        );

    } catch (error) {

        console.warn(
            "No se pudo guardar el historial.",
            error
        );

        mostrarToast(
            "No se pudo guardar el historial en este navegador."
        );

    }

}

function cargarHistorial() {

    try {

        const guardado = localStorage.getItem(
            "redvecinal_historial"
        );

        if (guardado) {

            historial = JSON.parse(guardado);

            if (!Array.isArray(historial)) {

                historial = [];

            }

        }

    } catch (error) {

        historial = [];

    }

    simulaciones = historial.length;

    $("simulationCount").textContent =
        simulaciones;

    mostrarHistorial();

}

function mostrarHistorial() {

    const contenedor = $("historyList");

    if (historial.length === 0) {

        contenedor.innerHTML = `

            <div class="empty-state">

                <span>◷</span>

                <h2>Sin registros todavía</h2>

                <p>
                    Las simulaciones realizadas aparecerán aquí.
                </p>

                <button
                    class="primary-btn"
                    data-go="laboratorio"
                >
                    Ir al laboratorio
                </button>

            </div>

        `;

        return;

    }

    contenedor.innerHTML = "";

    historial.forEach((registro, indice) => {

        const elemento = document.createElement("div");

        elemento.className = "history-item";

        elemento.innerHTML = `

            <div>

                <h3>
                    Simulación ${historial.length - indice}
                </h3>

                <p>${registro.fecha}</p>

                <p>
                    P₀: ${formato(registro.P0, 2)} ·
                    r: ${formato(registro.r, 3)} ·
                    K: ${formato(registro.K, 2)} ·
                    T: ${formato(registro.T, 2)} meses
                </p>

                <p>
                    Analítica: ${formato(registro.exacto)} |
                    Heun: ${formato(registro.heun)} |
                    RK4: ${formato(registro.rk4)}
                </p>

                <p>
                    Error relativo Heun:
                    ${formato(registro.relativoHeun, 6)} % |
                    Error relativo RK4:
                    ${formato(registro.relativoRK4, 6)} %
                </p>

            </div>

            <div class="history-actions">

                <button
                    class="secondary-btn small-btn"
                    data-load="${indice}"
                >
                    Cargar parámetros
                </button>

                <button
                    class="secondary-btn small-btn"
                    data-delete="${indice}"
                >
                    Eliminar
                </button>

            </div>

        `;

        contenedor.appendChild(elemento);

    });

}

/* EVENTOS DEL HISTORIAL */

$("historyList").addEventListener("click", event => {

    const botonCargar = event.target.closest("[data-load]");

    const botonEliminar = event.target.closest("[data-delete]");

    /* CARGAR PARÁMETROS */

    if (botonCargar) {

        const indice = Number(
            botonCargar.dataset.load
        );

        const registro = historial[indice];

        if (!registro) return;

        $("p0").value = registro.P0;

        $("r").value = registro.r;

        $("capacity").value = registro.K;

        $("tf").value = registro.T;

        $("h").value = registro.h;

        cambiarSeccion("laboratorio");

        mostrarToast("Parámetros recuperados.");

    }

    /* ELIMINAR UN REGISTRO */

    if (botonEliminar) {

        const indice = Number(
            botonEliminar.dataset.delete
        );

        historial.splice(indice, 1);

        persistirHistorial();

        simulaciones = historial.length;

        $("simulationCount").textContent =
            simulaciones;

        mostrarHistorial();

        mostrarToast("Registro eliminado.");

    }

});

/* ELIMINAR TODO EL HISTORIAL */

$("clearHistoryBtn").addEventListener("click", () => {

    if (historial.length === 0) {

        mostrarToast("El historial ya está vacío.");

        return;

    }

    if (confirm("¿Deseas eliminar todas las simulaciones guardadas?")) {

        historial = [];

        localStorage.removeItem(
            "redvecinal_historial"
        );

        simulaciones = 0;

        $("simulationCount").textContent = "0";

        mostrarHistorial();

        mostrarToast("Historial eliminado.");

    }

});

/* ==========================================
   RESTABLECER PARÁMETROS Y RESULTADOS
========================================== */

function limpiarResultados() {

    resultados = null;

    chartData = null;

    chartIndex = 0;

    detenerAnimacion();

    /* MÉTRICAS */

    $("metricExact").textContent = "—";

    $("metricHeunAbs").textContent = "—";

    $("metricHeunRel").textContent = "—";

    $("metricRK4Abs").textContent = "—";

    $("metricRK4Rel").textContent = "—";

    $("metricStep").textContent = "—";

    /* RESULTADOS */

    $("exactValue").textContent = "—";

    $("heunValue").textContent = "—";

    $("rk4Value").textContent = "—";

    $("heunError").textContent =
        "Error absoluto: — · Error relativo: —";

    $("rk4Error").textContent =
        "Error absoluto: — · Error relativo: —";

    /* CONCLUSIONES */

    $("exactReal").textContent =
        "La interpretación aparecerá después de la simulación.";

    $("exactSystems").textContent =
        "La aplicación aparecerá después de la simulación.";

    $("heunReal").textContent =
        "La interpretación aparecerá después de la simulación.";

    $("heunSystems").textContent =
        "La aplicación aparecerá después de la simulación.";

    $("rk4Real").textContent =
        "La interpretación aparecerá después de la simulación.";

    $("rk4Systems").textContent =
        "La aplicación aparecerá después de la simulación.";

    $("comparisonConclusion").textContent =
        "La conclusión aparecerá después de la simulación.";

    $("generalReal").textContent =
        "La interpretación general aparecerá después de la simulación.";

    $("generalSystems").textContent =
        "La aplicación aparecerá después de la simulación.";

    $("stepComparison").innerHTML =
        "<p>Ejecuta una simulación para visualizar la comparación.</p>";

    /* TABLAS */

    $("tableContainer").innerHTML =
        '<p class="muted">Los datos aparecerán después de ejecutar una simulación.</p>';

    $("tableContainer").classList.remove("hidden");

    $("showTableBtn").textContent =
        "Ocultar tablas";

    /* GRÁFICA */

    const canvas = $("mainChart");

    const ctx = canvas.getContext("2d");

    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    $("chartProgress").textContent =
        "Ejecuta una simulación para generar la gráfica.";

    $("resultStatus").textContent =
        "ESPERANDO SIMULACIÓN";

}

$("resetBtn").addEventListener("click", () => {

    $("p0").value = 20;

    $("r").value = 0.25;

    $("capacity").value = 200;

    $("tf").value = 20;

    $("h").value = 1;

    limpiarResultados();

    $("assistantFace").textContent = "🐶";

    $("assistantTitle").textContent =
        "¡Preparado para ayudar!";

    $("assistantText").textContent =
        "Introduce los parámetros y ejecuta la simulación para estudiar el crecimiento de la red comunitaria.";

    mostrarToast(
        "Parámetros y resultados restablecidos."
    );

});

/* ==========================================
   PROCEDIMIENTO DESPLEGABLE
========================================== */

$("toggleProcedure").addEventListener("click", () => {

    const contenido = $("procedureContent");

    contenido.classList.toggle("hidden");

    $("toggleProcedure").textContent =

        contenido.classList.contains("hidden")
            ? "Mostrar procedimiento ＋"
            : "Ocultar procedimiento −";

});

/* ==========================================
   ASISTENTE
========================================== */

let assistantState = 0;

$("floatingAssistant").addEventListener("click", () => {

    assistantState++;

    const mensajes = [

        {
            cara: "🐶",

            titulo: "¡Hola! Soy tu asistente.",

            texto:
                "El modelo logístico representa un crecimiento que se desacelera cuando la cantidad de participantes se aproxima a la capacidad máxima."
        },

        {
            cara: "🐕",

            titulo: "Consejo matemático",

            texto:
                "Prueba reducir h a la mitad y compara los errores absolutos y relativos obtenidos con Heun y RK4."
        },

        {
            cara: "🐾",

            titulo: "Aplicación tecnológica",

            texto:
                "Conocer el crecimiento de hogares participantes ayuda a planificar servidores, almacenamiento y otros recursos de una plataforma."
        },

        {
            cara: "🐶",

            titulo: "Recuerda las unidades",

            texto:
                "En esta simulación, el tiempo se expresa en meses y la tasa de crecimiento en meses inversos."
        },

        {
            cara: "🐕",

            titulo: "Precisión numérica",

            texto:
                "El error absoluto mide la diferencia entre el resultado exacto y el aproximado. El error relativo expresa esa diferencia como porcentaje."
        }

    ];

    const mensaje =
        mensajes[(assistantState - 1) % mensajes.length];

    $("assistantFace").textContent =
        mensaje.cara;

    $("assistantTitle").textContent =
        mensaje.titulo;

    $("assistantText").textContent =
        mensaje.texto;

    cambiarSeccion("laboratorio");

});

/* ==========================================
   CONFIGURACIÓN Y MODO CLARO
========================================== */

$("themeBtn").addEventListener("click", () => {

    document.body.classList.toggle("light-mode");

    mostrarToast(

        document.body.classList.contains("light-mode")
            ? "Modo claro activado."
            : "Modo oscuro activado."

    );

    if (chartData) {

        dibujarGrafica();

    }

});

/* ABRIR CONFIGURACIÓN */

$("settingsBtn").addEventListener("click", () => {

    $("settingsModal").classList.remove("hidden");

});

/* CERRAR CONFIGURACIÓN */

$("closeSettings").addEventListener("click", () => {

    $("settingsModal").classList.add("hidden");

});

/* CERRAR AL PRESIONAR FUERA */

$("settingsModal").addEventListener("click", event => {

    if (event.target === $("settingsModal")) {

        $("settingsModal").classList.add("hidden");

    }

});

/* ==========================================
   IMPRIMIR / GUARDAR PDF
========================================== */

$("printBtn").addEventListener("click", () => {

    $("settingsModal").classList.add("hidden");

    if (!resultados) {

        mostrarToast("Primero realiza una simulación.");

        return;

    }

    cambiarSeccion("resultados");

    setTimeout(() => {

        dibujarGrafica();

        window.print();

    }, 400);

});

/* ==========================================
   INICIALIZACIÓN
========================================== */

cargarHistorial();

console.log("RedVecinal iniciado correctamente.");

console.log("Modelo logístico: P' = rP(1 - P/K)");

console.log("Condición inicial: P(0) = P0");

console.log("Unidad temporal: meses");