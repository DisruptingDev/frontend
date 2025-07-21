import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    const { name, email, subject, message } = await request.json();

    // Es crucial usar variables de entorno para tus credenciales
    // y no escribirlas directamente en el código.
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: process.env.SMTP_SECURE === 'true', // true para puerto 465, false para otros
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const mailOptions = {
      from: `"Tu Portafolio" <${process.env.SMTP_USER}>`, // Es mejor enviar desde un correo verificado
      replyTo: email, // Para que al responder, le llegue al usuario
      to: process.env.SMTP_RECIPIENT_EMAIL, // El email que recibirá el mensaje
      subject: `Nuevo mensaje de contacto de ${name}: ${subject}`,
      text: message,
      html: `<p>Has recibido un nuevo mensaje de tu portafolio:</p>
             <p><strong>Nombre:</strong> ${name}</p>
             <p><strong>Email:</strong> ${email}</p>
             <p><strong>Mensaje:</strong></p>
             <p>${message}</p>`,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ message: 'Mensaje enviado con éxito' }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error al enviar el mensaje' }, { status: 500 });
  }
}