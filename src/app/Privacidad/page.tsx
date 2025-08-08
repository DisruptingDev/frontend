"use client";
import AppAppBar from "@/components/AppAppBar/AppAppBar";
import Contact from "@/components/contact/contact";
import Footer from "@/components/Footer/Footer";
import { useRouter } from "next/navigation";

export default function Privacidad() {
  const router = useRouter();
  return (
    <div className="bg-white w-3/4 m-auto">
      <AppAppBar />
      <div className="mt-10 mb-10">
        <div className="text-center pt-20">
          <h1 className="font-bold text-2xl">Políticas de privacidad</h1>
        </div>
        <div className="text-justify p-20 pt-10">
          <p>
            En Wise Facturación (&quot;nosotros&quot;, &quot;nuestro&quot;, &quot;la Empresa&quot;), la
            privacidad y seguridad de los datos de nuestros usuarios es nuestra
            máxima prioridad. Esta Política de Privacidad describe cómo
            recopilamos, usamos, protegemos y, en casos específicos, compartimos
            su información personal y la de sus clientes cuando utiliza nuestro
            sistema de facturación en línea (el &quot;Servicio&quot;).
          </p>
          <p className="mt-2">
            Al registrarse y utilizar nuestro Servicio, usted declara haber
            leído, entendido y aceptado los términos expuestos en la presente
            política.
          </p>
          <h2 className="font-bold text-xl mt-3 mb-3">
            1. Identidad y Domicilio del Responsable del Tratamiento de Datos
          </h2>
          <p>
            El responsable del tratamiento de los datos personales que usted
            proporciona es Wise Facturación, con domicilio en Calle 18 #40 San
            Jose vista Hermosa Puebla Pue. y correo electrónico de contacto
            admin@wisefacturacion.com.
          </p>
          <h2 className="font-bold text-xl mt-3 mb-3">
            2. Información que Recopilamos
          </h2>
          <p>
            Recopilamos diferentes tipos de datos para proporcionar y mejorar
            nuestro Servicio.
          </p>
          <ul>
            <li>
              <h3>Datos de Registro de Usuario:</h3>
              <ul>
                <li>
                  Nombre completo: Para identificarlo como titular de la cuenta.
                </li>
                <li>
                  Dirección de correo electrónico: Para la comunicación,
                  notificaciones del servicio y recuperación de cuenta.
                </li>
                <li>
                  Contraseña segura (cifrada): Para proteger el acceso a su
                  cuenta.
                </li>
              </ul>
            </li>
            <li>
              <h3>Datos de la Empresa del Usuario:</h3>
              <ul>
                <li>Razón Social o Nombre Comercial.</li>
                <li>
                  Registro Federal de Contribuyentes (RFC) o identificador
                  fiscal equivalente.
                </li>
                <li>Domicilio Fiscal.</li>
                <li>Régimen Fiscal.</li>
                <li>
                  Certificados de Sello Digital (CSD) y/o e.firma (FIEL) para el
                  timbrado de facturas.
                </li>
              </ul>
            </li>
            <li>
              <h3>Datos de los Clientes de la Empresa (Terceros):</h3>
              <ul>
                <li>Nombre, Razón Social o Denominación.</li>
                <li>RFC o identificador fiscal.</li>
                <li>Domicilio Fiscal.</li>
                <li>Régimen Fiscal.</li>
                <li>Correo electrónico para el envío de facturas.</li>
              </ul>
            </li>
            <li>
              <h3>Datos de Facturación y Transacciones:</h3>
              <ul>
                <li>
                  Información contenida en las facturas que usted emite, como
                  conceptos, importes, impuestos (IVA, ISR, etc.), fechas y
                  folios.
                </li>
              </ul>
            </li>
          </ul>
          <h2 className="font-bold text-xl mt-3 mb-3">
            Aviso Importante sobre Datos de Terceros:
          </h2>
          <p>
            Usted, como usuario del Servicio, declara y garantiza que cuenta con
            el consentimiento y la autorización necesarios de sus clientes para
            registrar, tratar y transferir sus datos en nuestra plataforma con
            el fin de generar los comprobantes fiscales correspondientes. Usted
            asume la responsabilidad frente a sus clientes sobre dicho
            tratamiento.
          </p>
          <h2 className="font-bold text-xl mt-3 mb-3">
            3. Finalidades del Tratamiento de Datos
          </h2>
          <p>
            Sus datos personales son utilizados para las siguientes finalidades:
          </p>

          <ul>
            <li>
              <h3>Finalidades Primarias (Esenciales para el Servicio):</h3>
              <ul>
                <li>
                  Crear y gestionar su cuenta de usuario en la plataforma.
                </li>
                <li>
                  Validar su identidad y la de su empresa para cumplir con las
                  normativas fiscales.
                </li>
                <li>
                  Generar, timbrar y certificar las facturas (CFDI) ante el
                  Proveedor Autorizado de Certificación (PAC) y el Servicio de
                  Administración Tributaria (SAT).
                </li>
                <li>
                  Enviar automáticamente las facturas generadas a los correos
                  electrónicos de sus clientes.
                </li>
                <li>Almacenar y organizar su historial de facturación.</li>
                <li>
                  Brindar soporte técnico y resolver problemas relacionados con
                  el uso del Servicio.
                </li>
                <li>
                  Enviar notificaciones importantes sobre el servicio, como
                  alertas de seguridad, cambios en los términos o vencimiento de
                  su plan.
                </li>
                <li>
                  Cumplir con las obligaciones legales y fiscales requeridas por
                  la autoridad competente.
                </li>
              </ul>
            </li>
            <li>
              <h3>Finalidades Secundarias (Non Primarias):</h3>
              <ul>
                <li>
                  Enviarle comunicaciones sobre promociones, nuevos productos o
                  mejoras en el Servicio.
                </li>
                <li>
                  Realizar encuestas de satisfacción para mejorar la calidad de
                  nuestra plataforma.
                </li>
                <li>
                  Generar estadísticas y análisis sobre el uso del Servicio de
                  forma anonimizada.
                </li>
              </ul>
            </li>
          </ul>
          <p>
            Si no desea que sus datos sean tratados para estas finalidades
            secundarias, puede comunicárnoslo en cualquier momento a través de
            nuestro correo de contacto: admin@wisefacturacion.com
          </p>
          <h2 className="font-bold text-xl mt-3 mb-3">
            4. Transferencia de Datos a Terceros
          </h2>
          <p>
            No venderemos, alquilaremos ni cederemos sus datos personales a
            terceros, con excepción de:
          </p>
          <ul>
            <li>
              Autoridades Fiscales y Gubernamentales: Principalmente el SAT,
              como parte indispensable del proceso de timbrado de facturas y en
              cumplimiento de la ley
            </li>
            <li>
              Proveedores de Servicios Tecnológicos: Compartimos información con
              proveedores que nos asisten en la operación del Servicio, como
              servicios de hosting (ej. Amazon Web Services, Google Cloud),
              proveedores de bases de datos y servicios de envío de correo
              electrónico. Estos proveedores actúan como &quot;Encargados&quot; y están
              contractualmente obligados a proteger la información.
            </li>
            <li>
              Asesores Profesionales: En caso de ser necesario, con nuestros
              asesores legales o contables para cumplir con nuestras propias
              obligaciones.
            </li>
          </ul>
          <p>
            Toda transferencia se realiza con las medidas de seguridad adecuadas
            y en estricto apego a la legislación aplicable.
          </p>
          <h2 className="font-bold text-xl mt-3 mb-3">
            5. Derechos ARCO (Acceso, Rectificación, Cancelación y Oposición)
          </h2>
          <p>Usted tiene derecho a:</p>
          <ul>
            <li>Acceder a los datos personales que poseemos sobre usted.</li>
            <li>Rectificar sus datos si son inexactos o incompletos.</li>
            <li>
              Cancelar el uso de sus datos personales cuando considere que no se
              están utilizando conforme a los principios y deberes establecidos
              en la normativa.
            </li>
            <li>
              Oponerse al tratamiento de sus datos para fines específicos.
            </li>
          </ul>
          <p>
            Para ejercer sus derechos ARCO, por favor envíe una solicitud a
            admin@wisefacturacion.com, incluyendo su nombre completo, copia de
            una identificación oficial y una descripción clara y precisa del
            derecho que desea ejercer.
          </p>
          <h2 className="font-bold text-xl mt-3 mb-3">
            6. Seguridad y Conservación de los Datos
          </h2>
          <p>
            Implementamos medidas de seguridad administrativas, técnicas y
            físicas para proteger su información contra daño, pérdida,
            alteración, destrucción o el uso, acceso o tratamiento no
            autorizado. Esto incluye el uso de cifrado SSL/TLS para la
            transmisión de datos y la encriptación de información sensible en
            reposo.
          </p>
          <p>
            Conservaremos sus datos mientras mantenga una cuenta activa en
            nuestro Servicio y, posteriormente, por el tiempo que la legislación
            fiscal y comercial nos exija (generalmente 5 años) para poder
            atender posibles requerimientos de autoridades.
          </p>
          <h2 className="font-bold text-xl mt-3 mb-3">
            7. Modificaciones a la Política de Privacidad
          </h2>
          <p>
            Nos reservamos el derecho de efectuar en cualquier momento
            modificaciones o actualizaciones al presente aviso de privacidad. Le
            notificaremos sobre cambios significativos a través de un correo
            electrónico a la dirección registrada o mediante un aviso prominente
            en nuestro Servicio antes de que el cambio entre en vigor.
          </p>
          <p>
            Si tiene alguna duda sobre esta Política de Privacidad, no dude en
            contactarnos.
          </p>
          <p className="font-bold">
            Wise Facturacion www.wisefacturacion.com admin@wisefacturacion.com
          </p>
        </div>
      </div>
      <div className="mt-10 mb-10">
        <Contact />
      </div>
      <Footer />
    </div>
  );
}
