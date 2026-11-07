# RedVecinal — Modelación del crecimiento de una red comunitaria

**Desafío individual: Modelar un problema real con ecuaciones diferenciales**

**Estudiante:** [Nombre completo]  
**Materia:** COM-254 — Métodos Numéricos I  
**Área de aplicación:** Bienestar animal y colaboración comunitaria  
**Modelo matemático:** Ecuación diferencial logística de primer orden  
**Métodos numéricos:** Heun (RK2) y Runge-Kutta de cuarto orden (RK4)

---

## 1. Descripción del proyecto

RedVecinal es una aplicación web de simulación numérica que representa el crecimiento de una red comunitaria de hogares participantes en una plataforma destinada a facilitar el reencuentro de mascotas extraviadas.

La propuesta busca representar cómo aumenta progresivamente la participación de los hogares interesados en colaborar mediante la difusión de reportes, el intercambio de información y la comunicación entre vecinos.

Sin embargo, el crecimiento de la comunidad no puede ser ilimitado, debido a que existe una cantidad máxima estimada de hogares que podrían incorporarse dentro del área de cobertura considerada.

Para estudiar este comportamiento se utiliza un modelo logístico de crecimiento, cuya solución se calcula mediante una expresión analítica y se aproxima mediante los métodos numéricos de Heun y Runge-Kutta de cuarto orden.

## 2. Objetivo

Estudiar la evolución de los hogares participantes de RedVecinal durante un intervalo de tiempo determinado, estimar su aproximación a la capacidad máxima de la red y comparar la precisión de los métodos numéricos utilizados frente a la solución analítica.

La aplicación permite modificar los parámetros del modelo, ejecutar simulaciones y analizar los resultados mediante gráficas, tablas comparativas y conclusiones.

## 3. Problema planteado

La incorporación de hogares participantes en una plataforma comunitaria puede aumentar conforme esta empieza a ser conocida y recomendada por sus primeros miembros.

Inicialmente, el crecimiento puede ser acelerado debido a la incorporación progresiva de nuevos participantes. Posteriormente, la tasa de crecimiento disminuye cuando la cantidad de hogares se aproxima a la capacidad máxima estimada de la comunidad.

Por ello, se plantea la siguiente pregunta:

**¿Cómo evolucionará la cantidad de hogares participantes durante el periodo estudiado y qué tan cerca estará de alcanzar la capacidad máxima estimada de la red?**

## 4. Modelo matemático

Para representar el crecimiento de los participantes se utiliza la ecuación diferencial logística:

\[
\frac{dP}{dt}=rP\left(1-\frac{P}{K}\right)
\]

La condición inicial del problema es:

\[
P(0)=P_0
\]

Donde:

| Símbolo | Descripción | Unidad |
|---|---|---|
| \(P(t)\) | Cantidad de hogares participantes | Hogares |
| \(t\) | Tiempo transcurrido | Meses |
| \(P_0\) | Cantidad inicial de hogares | Hogares |
| \(r\) | Tasa proporcional de crecimiento | Mes\(^{-1}\) |
| \(K\) | Capacidad máxima estimada | Hogares |
| \(T\) | Tiempo final de simulación | Meses |
| \(h\) | Paso de integración | Meses |

El intervalo de simulación está definido por:

\[
0\leq t\leq T
\]

### Parámetros iniciales

La aplicación proporciona los siguientes valores predeterminados, que pueden modificarse para estudiar diferentes escenarios:

| Parámetro | Valor inicial |
|---|---:|
| Hogares iniciales (\(P_0\)) | 20 |
| Tasa de crecimiento (\(r\)) | 0.25 |
| Capacidad máxima (\(K\)) | 200 |
| Tiempo final (\(T\)) | 20 meses |
| Paso de integración (\(h\)) | 1 mes |

Los valores son hipotéticos y se utilizan con fines de simulación académica.

## 5. Solución analítica

La solución exacta de la ecuación diferencial logística se expresa mediante:

\[
P(t)=\frac{K}{1+\left(\frac{K-P_0}{P_0}\right)e^{-rt}}
\]

Esta expresión permite calcular la cantidad teórica de hogares participantes en cualquier instante del intervalo estudiado.

### Verificación de la condición inicial

Sustituyendo \(t=0\):

\[
P(0)=\frac{K}{1+\frac{K-P_0}{P_0}e^0}
\]

Como \(e^0=1\):

\[
P(0)=\frac{K}{1+\frac{K-P_0}{P_0}}
\]

Simplificando:

\[
P(0)=\frac{K}{\frac{K}{P_0}}=P_0
\]

Por tanto, la solución satisface la condición inicial.

### Verificación de la ecuación diferencial

Definiendo:

\[
A=\frac{K-P_0}{P_0}
\]

La solución puede escribirse como:

\[
P(t)=\frac{K}{1+Ae^{-rt}}
\]

Al derivar:

\[
P'(t)=\frac{rKAe^{-rt}}{(1+Ae^{-rt})^2}
\]

Por otra parte:

\[
rP\left(1-\frac{P}{K}\right)
=
\frac{rKAe^{-rt}}{(1+Ae^{-rt})^2}
\]

Ambas expresiones coinciden, por lo que la solución también satisface la ecuación diferencial.

## 6. Métodos numéricos implementados

La aplicación implementa dos procedimientos numéricos para aproximar la solución de la ecuación diferencial.

### 6.1. Método de Heun (Runge-Kutta de segundo orden)

Este método utiliza dos pendientes por intervalo. Primero calcula una pendiente inicial, después obtiene un valor predictor y finalmente promedia las dos pendientes para calcular el siguiente valor.

Las expresiones utilizadas son:

\[
k_1=f(t_n,P_n)
\]

\[
k_2=f(t_n+h,P_n+hk_1)
\]

\[
P_{n+1}=P_n+\frac{h}{2}(k_1+k_2)
\]

### 6.2. Método Runge-Kutta de cuarto orden (RK4)

Este procedimiento utiliza cuatro pendientes ponderadas para obtener una aproximación más precisa en cada intervalo.

Sus expresiones son:

\[
k_1=f(t_n,P_n)
\]

\[
k_2=f\left(t_n+\frac{h}{2},P_n+\frac{hk_1}{2}\right)
\]

\[
k_3=f\left(t_n+\frac{h}{2},P_n+\frac{hk_2}{2}\right)
\]

\[
k_4=f(t_n+h,P_n+hk_3)
\]

La actualización de la solución es:

\[
P_{n+1}=P_n+\frac{h}{6}(k_1+2k_2+2k_3+k_4)
\]

Ambos métodos utilizan los mismos parámetros, la misma condición inicial y el mismo intervalo de simulación para garantizar una comparación coherente.

## 7. Cálculo de errores

Para evaluar la precisión de las aproximaciones numéricas se utilizan dos medidas.

**Error absoluto:**

\[
E_a=|P_{\text{exacta}}-P_{\text{aproximada}}|
\]

**Error relativo porcentual:**

\[
E_r(\%)=
\frac{|P_{\text{exacta}}-P_{\text{aproximada}}|}
{|P_{\text{exacta}}|}\times100
\]

El error relativo se calcula cuando el valor exacto es diferente de cero.

Estos indicadores permiten medir la diferencia entre los resultados numéricos y la solución analítica.

## 8. Comparación de tamaños de paso

Para analizar la influencia del tamaño de paso en la precisión se ejecutan los métodos con dos valores:

- Paso original: \(h\).
- Paso reducido: \(h/2\).

La aplicación presenta dos tablas comparativas, una para cada tamaño de paso. En ellas se muestran los valores de la solución analítica, Heun y RK4 en cada iteración, junto con sus respectivos errores absolutos y relativos porcentuales.

También se presenta una comparación final que permite identificar cuál método obtuvo menor error en cada ensayo y cómo cambian los resultados al reducir el intervalo de integración.

## 9. Funcionalidades de la aplicación

RedVecinal incorpora las siguientes características:

- **Menú principal:** permite acceder a las diferentes secciones de la aplicación.
- **Laboratorio numérico:** permite ingresar y modificar los parámetros del modelo.
- **Validación de datos:** verifica que los valores sean numéricos y positivos, y que \(0<P_0<K\).
- **Solución analítica:** calcula el resultado exacto del modelo.
- **Método de Heun:** aproxima la solución mediante dos pendientes.
- **Método RK4:** aproxima la solución mediante cuatro pendientes.
- **Comparación de errores:** muestra errores absolutos y relativos porcentuales.
- **Tablas comparativas:** presenta los resultados para \(h\) y \(h/2\).
- **Gráfica animada:** representa la evolución de la solución analítica, Heun y RK4 durante el intervalo estudiado.
- **Conclusiones individuales:** presenta la interpretación del resultado de cada método y su aplicación a Ingeniería de Sistemas.
- **Conclusión general:** resume el comportamiento del modelo y su importancia para el problema planteado.
- **Historial:** almacena las simulaciones realizadas y permite recuperar sus parámetros.
- **Asistente:** proporciona información y recomendaciones relacionadas con el modelo.
- **Modo claro y oscuro:** permite cambiar la apariencia de la interfaz.
- **Impresión y PDF:** permite imprimir los resultados y guardarlos mediante la opción de impresión del navegador.

## 10. Herramientas y tecnologías utilizadas

El proyecto fue desarrollado mediante tecnologías web:

| Tecnología | Utilización |
|---|---|
| HTML5 | Estructura y contenido de la aplicación. |
| CSS3 | Diseño visual, distribución de componentes y adaptación a diferentes pantallas. |
| JavaScript | Implementación de las ecuaciones, métodos numéricos, validaciones y funcionalidades interactivas. |
| Canvas API | Representación gráfica de las soluciones. |
| LocalStorage | Almacenamiento local del historial de simulaciones. |
| GitHub | Administración y publicación del código fuente. |
| GitHub Pages | Publicación de la aplicación web. |

No se requiere un servidor backend para realizar las simulaciones.

## 11. Estructura del proyecto

La organización de los archivos es la siguiente:

```text
RedVecinal/
│
├── index.html
│
├── style.css
│
├── script.js
│
├── img/
│   └── fondo.jpg
│
└── README.md
```

Descripción de los archivos:

- `index.html`: contiene la estructura de las secciones, los formularios, las tablas y los elementos de la aplicación.
- `style.css`: define los estilos visuales, colores, paneles, animaciones y diseño adaptable.
- `script.js`: contiene la solución analítica, los métodos numéricos, los cálculos de errores, la generación de tablas, las gráficas y las funcionalidades interactivas.
- `img/fondo.jpg`: imagen utilizada como fondo de la pantalla principal.
- `README.md`: documentación del proyecto y explicación del modelo matemático.

## 12. Instrucciones de ejecución

### Ejecución local

1. Descargar o clonar el repositorio de GitHub.
2. Abrir la carpeta del proyecto en Visual Studio Code.
3. Comprobar que los tres archivos principales y la carpeta `img` estén en la misma estructura indicada.
4. Abrir `index.html` mediante un navegador o utilizar la extensión Live Server de Visual Studio Code.
5. Ingresar a la sección Laboratorio y modificar los parámetros según el escenario que se desea estudiar.
6. Presionar el botón Ejecutar simulación para obtener los resultados.

No se necesita instalar bibliotecas matemáticas ni utilizar un servidor backend.

### Publicación mediante GitHub Pages

Para publicar la aplicación:

1. Subir los archivos del proyecto al repositorio de GitHub.
2. Ingresar a la sección **Settings** del repositorio.
3. Seleccionar **Pages**.
4. En la configuración de publicación, elegir la rama principal (`main`) y la carpeta raíz (`/root`).
5. Guardar los cambios.
6. Acceder a la URL pública generada por GitHub Pages.

La aplicación podrá utilizarse desde un navegador sin necesidad de instalación.

## 13. Supuestos y limitaciones

El modelo considera que la tasa proporcional de crecimiento permanece constante durante el intervalo estudiado y que existe una capacidad máxima de hogares previamente estimada.

También se supone que todos los hogares se contabilizan de la misma manera, sin diferenciar su nivel de actividad, frecuencia de colaboración o participación efectiva en la búsqueda de mascotas.

En una situación real, el crecimiento dependería de otros factores, como la difusión de la plataforma, la confianza de los usuarios, la conectividad y la disponibilidad de dispositivos tecnológicos.

Por esta razón, los resultados deben interpretarse como escenarios matemáticos hipotéticos y no como predicciones comprobadas de adopción.

Asimismo, el modelo estudia el crecimiento de los hogares participantes, pero no calcula directamente la cantidad de mascotas recuperadas.

## 14. Aplicación a Ingeniería de Sistemas

El modelo permite estudiar cómo puede evolucionar una plataforma digital cuando aumenta su cantidad de participantes y cómo una capacidad máxima influye en su crecimiento.

Los resultados pueden utilizarse como referencia académica para analizar necesidades de almacenamiento, capacidad de servidores, administración de usuarios, disponibilidad de servicios y planificación de recursos tecnológicos.

La comparación entre la solución analítica, Heun y RK4 también permite comprender la importancia de la precisión numérica al realizar simulaciones y estimaciones de sistemas.

## 15. Conclusión

RedVecinal demuestra la aplicación de una ecuación diferencial ordinaria de primer orden con condición inicial a una situación comunitaria relacionada con el bienestar animal.

Mediante la solución analítica y los métodos numéricos de Heun y Runge-Kutta de cuarto orden es posible estudiar el crecimiento de los hogares participantes, comparar los resultados obtenidos y evaluar la precisión de las aproximaciones mediante sus errores absolutos y relativos porcentuales.

De esta manera, la aplicación integra conceptos matemáticos y herramientas de desarrollo web para representar un problema verosímil y analizar su posible aplicación en la planificación de servicios tecnológicos.

---

**Aplicación web:** [Agregar URL pública de GitHub Pages]

**Repositorio:** [Agregar URL del repositorio]

**Video explicativo:** [Agregar URL del video]

**Estudiante:** [Nombre completo]  
**Materia:** COM-254 — Métodos Numéricos I  
**Desafío:** RedVecinal — Modelación del crecimiento de una red comunitaria mediante una ecuación diferencial logística.
