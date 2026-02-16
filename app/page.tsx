'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Package, ArrowRight, Zap } from 'lucide-react';
import Link from 'next/link';

const planes = [
    {
        id: 'prueba',
        nombre: 'Prueba',
        precio: 0,
        limite: 10,
        descripcion: 'Para probar sin compromiso',
        features: [
            'Hasta 10 productos',
            '15 días de prueba gratis',
            'Catálogo online básico',
            'Sin tarjeta de crédito'
        ],
        popular: false
    },
    {
        id: 'basico',
        nombre: 'Básico',
        precio: 50000,
        limite: 20,
        descripcion: 'Ideal para empezar',
        features: [
            'Hasta 20 productos',
            'Catálogo online personalizado',
            'Gestión de pedidos',
            'WhatsApp integrado',
            'Soporte por email'
        ],
        popular: false
    },
    {
        id: 'estandar',
        nombre: 'Estándar',
        precio: 70000,
        limite: 50,
        descripcion: 'El más elegido',
        features: [
            'Hasta 50 productos',
            'Catálogo online personalizado',
            'Gestión de pedidos',
            'WhatsApp integrado',
            'Soporte prioritario',
            'Estadísticas básicas'
        ],
        popular: true
    },
    {
        id: 'premium',
        nombre: 'Premium',
        precio: 80000,
        limite: 100,
        descripcion: 'Para crecer sin límites',
        features: [
            'Hasta 100 productos',
            'Catálogo online personalizado',
            'Gestión de pedidos',
            'WhatsApp integrado',
            'Soporte 24/7',
            'Estadísticas avanzadas',
            'Reportes personalizados'
        ],
        popular: false
    }
];

export default function LandingPage() {
    const router = useRouter();

    const handleSelectPlan = (planId: string) => {
        // Guardar plan seleccionado en localStorage
        localStorage.setItem('selectedPlan', planId);
        // Redirigir a registro
        router.push('/register');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
            {/* Header */}
            <header className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Zap className="w-8 h-8 text-blue-600" />
                        <h1 className="text-2xl font-bold text-gray-900">Hacelotuyo</h1>
                    </div>
                    <div className="flex gap-4">
                        <Link
                            href="/login"
                            className="text-gray-600 hover:text-gray-900 font-medium"
                        >
                            Iniciar Sesión
                        </Link>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="max-w-7xl mx-auto px-4 py-12 md:py-20 text-center">
                <div className="inline-block bg-green-100 text-green-800 px-6 py-2 rounded-full text-sm font-semibold mb-6">
                    🎉 Prueba Gratis por 15 Días
                </div>
                <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
                    Tu Catálogo Online para
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                        {' '}Mayoristas
                    </span>
                </h1>
                <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
                    Creá tu catálogo digital en minutos. Tus clientes hacen pedidos desde el catálogo.
                    Vos gestionás todo desde tu panel de control.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center px-4">
                    <button
                        onClick={() => handleSelectPlan('prueba')}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-4 px-8 rounded-xl text-lg shadow-lg transition-all cursor-pointer w-full sm:w-auto"
                    >
                        Empezar Prueba Gratis
                    </button>
                    <Link
                        href="/login"
                        className="bg-white hover:bg-gray-50 text-gray-900 font-bold py-4 px-8 rounded-xl text-lg shadow-lg transition-all border-2 border-gray-200 w-full sm:w-auto text-center"
                    >
                        Ya tengo cuenta
                    </Link>
                </div>
                <p className="text-sm text-gray-500 mt-4">
                    Sin tarjeta de crédito • Cancelá cuando quieras
                </p>
            </section>

            {/* Features */}
            <section className="max-w-7xl mx-auto px-4 py-12 md:py-20">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Package className="w-8 h-8 text-blue-600" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                            Catálogo Digital
                        </h3>
                        <p className="text-gray-600">
                            Cargá tus productos con fotos, precios y stock. Tus clientes ven todo actualizado en tiempo real.
                        </p>
                    </div>
                    <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                            Pedidos Online
                        </h3>
                        <p className="text-gray-600">
                            Tus clientes arman su pedido desde el catálogo y lo envían con un click. Sin llamadas ni mensajes.
                        </p>
                    </div>
                    <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
                        <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                            Panel de Control
                        </h3>
                        <p className="text-gray-600">
                            Todos los pedidos en tu panel admin. Sabés exactamente qué y cuánto comprar de cada producto.
                        </p>
                    </div>
                </div>
            </section>

            {/* Planes Section */}
            <section id="planes" className="max-w-7xl mx-auto px-4 py-12 md:py-20">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                        Elegí tu Plan
                    </h2>
                    <p className="text-lg md:text-xl text-gray-600 mb-4">
                        Potenciá tu negocio con nuestras herramientas premium
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {planes.filter(p => p.id !== 'prueba').map((plan) => (
                        <div
                            key={plan.id}
                            className="relative bg-white rounded-2xl shadow-lg p-8 hover:shadow-2xl transition-all"
                        >
                            {plan.popular && (
                                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                                    <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-1 rounded-full text-sm font-semibold shadow-lg">
                                        Más Popular
                                    </span>
                                </div>
                            )}

                            <div className="text-center mb-6">
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                                    {plan.nombre}
                                </h3>
                                <p className="text-gray-600 mb-4">{plan.descripcion}</p>
                                <div className="mb-4">
                                    <span className="text-5xl font-bold text-gray-900">
                                        ${(plan.precio / 1000).toFixed(0)}k
                                    </span>
                                    <span className="text-gray-600">/mes</span>
                                </div>
                                <div className="flex items-center justify-center gap-2 text-blue-600 font-semibold">
                                    <Package className="w-5 h-5" />
                                    <span>Hasta {plan.limite} productos</span>
                                </div>
                            </div>

                            <ul className="space-y-3 mb-8">
                                {plan.features.map((feature, index) => (
                                    <li key={index} className="flex items-start gap-3">
                                        <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                        <span className="text-gray-700">{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <button
                                onClick={() => handleSelectPlan(plan.id)}
                                className={`w-full py-3 px-6 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${plan.popular
                                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg'
                                    : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                                    }`}
                            >
                                Suscribirme al {plan.nombre}
                                <ArrowRight className="w-5 h-5" />
                            </button>
                        </div>
                    ))}
                </div>
            </section>

            {/* Contact Section */}
            <section className="max-w-7xl mx-auto px-4 py-12 md:py-20">
                <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-3xl shadow-2xl p-8 md:p-12 text-center text-white">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">
                        ¿Necesitás ayuda con tus productos?
                    </h2>
                    <p className="text-lg md:text-xl mb-8 opacity-90">
                        Envianos tu lista de productos por WhatsApp y nosotros te los cargamos
                    </p>
                    <a
                        href="https://wa.me/5493416419999?text=Hola!%20Necesito%20ayuda%20para%20cargar%20mis%20productos"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-3 bg-white text-green-600 font-bold py-4 px-8 rounded-xl text-lg shadow-lg hover:shadow-xl transition-all w-full sm:w-auto"
                    >
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                        </svg>
                        Contactar por WhatsApp
                    </a>
                    <p className="text-sm mt-4 opacity-75">
                        341 641 9999 • Respondemos en minutos
                    </p>
                </div>
            </section>


            {/* Footer */}
            <footer className="bg-gray-900 text-white py-12">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <p className="text-gray-400 mb-2">
                        © 2026 Hacelotuyo. Todos los derechos reservados.
                    </p>
                    <p className="text-gray-500 text-sm">
                        WhatsApp: 341 641 9999
                    </p>
                </div>
            </footer>
        </div>
    );
}
