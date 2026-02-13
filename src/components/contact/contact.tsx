'use client'
import ContactForm from '@/components/contactForm/contactForm';
import Image from 'next/image';
import React from 'react';

export default function Contact() {
    return (
        <div className='w-full flex mt-25 my-20'>
            <div className='w-3/4 m-auto flex flex-col md:flex-row gap-8 md:gap-0'>
                <div className='w-full md:w-1/2 flex flex-col justify-center items-center p-5'>
                    <h1 className='text-4xl font-bold '>Contacto</h1>
                    <p className='text-xl mt-2'>Dejanos tus dudas y comentarios y nosotros nos pondremos en contacto lo antes posible.</p>
                    <p className='text-md mt-2'>Puedes contactarnos a través de los siguientes medios:</p>
                    <p className='text-md mt-2'><span className='font-bold'>Correo</span> admin@wisefacturacion.com</p>
                    <p className='text-md mt-2'><span className='font-bold'>Teléfono</span> (222) 725 4392 </p>
                    <Image
                        src="/images/Lu-wise-contact.jpg"
                        alt="Contact Us"
                        width={400}
                        height={300}
                        className='mask mask-squirclemt-3 mt-4 rounded-[5rem] shadow-xl'
                    />
                </div>
                <div className='w-full md:w-1/2'>
                    <ContactForm />
                </div>
            </div>
        </div>

    );
}
