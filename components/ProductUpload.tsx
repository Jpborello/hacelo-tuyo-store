'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Upload, Loader2, X } from 'lucide-react';
import Image from 'next/image';
import imageCompression from 'browser-image-compression';

interface ProductUploadProps {
    comercioSlug: string;
    onProductCreated?: (productId: string) => void;
}

export default function ProductUpload({ comercioSlug, onProductCreated }: ProductUploadProps) {
    const supabase = createClient();

    const [formData, setFormData] = useState({
        nombre: '',
        descripcion: '',
        precio: '',
        stock: '',
        unidad_medida: 'bulto' as 'bulto' | 'granel',
    });

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string>('');
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string>('');
    const [success, setSuccess] = useState(false);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];

        if (!file) return;

        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            setError('Solo se permiten archivos JPG, PNG y WebP');
            return;
        }

        const maxSize = 10 * 1024 * 1024; // Aumentado a 10MB porque vamos a comprimir
        if (file.size > maxSize) {
            setError('La imagen no debe superar los 10MB');
            return;
        }

        setError('');
        setUploading(true);

        try {
            // Comprimir imagen automáticamente
            const options = {
                maxSizeMB: 0.5, // Máximo 500KB
                maxWidthOrHeight: 1920, // Máximo 1920px
                useWebWorker: true,
                fileType: 'image/webp' // Convertir a WebP para mejor compresión
            };

            const compressedFile = await imageCompression(file, options);

            // Mostrar info de compresión
            const originalSizeMB = (file.size / 1024 / 1024).toFixed(2);
            const compressedSizeMB = (compressedFile.size / 1024 / 1024).toFixed(2);
            console.log(`Imagen comprimida: ${originalSizeMB}MB → ${compressedSizeMB}MB`);

            setSelectedFile(compressedFile);

            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(compressedFile);
        } catch (err) {
            setError('Error al comprimir la imagen');
            console.error('Compression error:', err);
        } finally {
            setUploading(false);
        }
    };

    const uploadImage = async (file: File): Promise<string> => {
        // Siempre usar .webp como extensión para archivos comprimidos
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.webp`;
        const filePath = `${comercioSlug}/${fileName}`;

        const { error } = await supabase.storage
            .from('productos-hacelotuyo')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false,
            });

        if (error) {
            throw new Error(`Error al subir imagen: ${error.message}`);
        }

        const { data: { publicUrl } } = supabase.storage
            .from('productos-hacelotuyo')
            .getPublicUrl(filePath);

        return publicUrl;
    };

    const getComercioId = async (): Promise<string> => {
        const { data, error } = await supabase
            .from('comercios')
            .select('id')
            .eq('slug', comercioSlug)
            .single();

        if (error || !data) {
            throw new Error('No se pudo encontrar el comercio');
        }

        return data.id;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess(false);
        setUploading(true);

        try {
            if (!formData.nombre || !formData.precio) {
                throw new Error('Nombre y precio son obligatorios');
            }

            let imagenUrl = null;
            if (selectedFile) {
                imagenUrl = await uploadImage(selectedFile);
            }

            const comercioId = await getComercioId();

            // Check product limit based on plan
            const { data: comercio, error: comercioError } = await supabase
                .from('comercios')
                .select('plan')
                .eq('id', comercioId)
                .single();

            if (comercioError) {
                throw new Error('Error al verificar el plan');
            }

            const { count, error: countError } = await supabase
                .from('productos')
                .select('*', { count: 'exact', head: true })
                .eq('comercio_id', comercioId);

            if (countError) {
                throw new Error('Error al contar productos');
            }

            // Plan limits
            const limits: Record<string, number> = {
                prueba: 10,
                basico: 20,
                estandar: 50,
                premium: 100
            };

            const currentPlan = comercio.plan || 'prueba';
            const limit = limits[currentPlan];

            if (count !== null && count >= limit) {
                throw new Error(`Has alcanzado el límite de ${limit} productos del plan ${currentPlan.toUpperCase()}. Mejorá tu plan para agregar más productos.`);
            }

            const { data: producto, error: dbError } = await supabase
                .from('productos')
                .insert({
                    comercio_id: comercioId,
                    nombre: formData.nombre,
                    descripcion: formData.descripcion || null,
                    precio: parseFloat(formData.precio),
                    stock: parseInt(formData.stock) || 0,
                    unidad_medida: formData.unidad_medida,
                    imagen_url: imagenUrl,
                })
                .select()
                .single();

            if (dbError) {
                throw new Error(`Error al crear producto: ${dbError.message}`);
            }

            setSuccess(true);
            setFormData({
                nombre: '',
                descripcion: '',
                precio: '',
                stock: '',
                unidad_medida: 'bulto',
            });
            setSelectedFile(null);
            setPreviewUrl('');

            if (onProductCreated && producto) {
                onProductCreated(producto.id);
            }

            setTimeout(() => setSuccess(false), 3000);

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error desconocido');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="max-w-2xl bg-white rounded-lg shadow-md p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Imagen */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Imagen del Producto
                    </label>

                    <div className="flex items-center gap-4">
                        <label className="cursor-pointer bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition flex items-center gap-2">
                            <Upload className="w-5 h-5" />
                            <input
                                type="file"
                                accept="image/jpeg,image/jpg,image/png"
                                onChange={handleFileSelect}
                                className="hidden"
                                disabled={uploading}
                            />
                            Seleccionar Imagen
                        </label>

                        {selectedFile && (
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-600">
                                    {selectedFile.name}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedFile(null);
                                        setPreviewUrl('');
                                    }}
                                    className="text-red-500 hover:text-red-700"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>

                    {previewUrl && (
                        <div className="mt-4">
                            <div className="relative w-48 h-48">
                                <Image
                                    src={previewUrl}
                                    alt="Preview"
                                    fill
                                    className="object-cover rounded-md border-2 border-gray-200"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Nombre */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nombre del Producto *
                    </label>
                    <input
                        type="text"
                        value={formData.nombre}
                        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Ej: Arroz Integral 1kg"
                        required
                        disabled={uploading}
                    />
                </div>

                {/* Descripción */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Descripción
                    </label>
                    <textarea
                        value={formData.descripcion}
                        onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Descripción del producto..."
                        rows={3}
                        disabled={uploading}
                    />
                </div>

                {/* Precio y Stock */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Precio *
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={formData.precio}
                            onChange={(e) => setFormData({ ...formData, precio: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="0.00"
                            required
                            disabled={uploading}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Stock
                        </label>
                        <input
                            type="number"
                            min="0"
                            value={formData.stock}
                            onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="0"
                            disabled={uploading}
                        />
                    </div>
                </div>

                {/* Unidad de Medida */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Unidad de Medida *
                    </label>
                    <div className="flex gap-4">
                        <label className="flex items-center">
                            <input
                                type="radio"
                                value="bulto"
                                checked={formData.unidad_medida === 'bulto'}
                                onChange={(e) => setFormData({ ...formData, unidad_medida: e.target.value as 'bulto' })}
                                className="mr-2"
                                disabled={uploading}
                            />
                            Bulto
                        </label>
                        <label className="flex items-center">
                            <input
                                type="radio"
                                value="granel"
                                checked={formData.unidad_medida === 'granel'}
                                onChange={(e) => setFormData({ ...formData, unidad_medida: e.target.value as 'granel' })}
                                className="mr-2"
                                disabled={uploading}
                            />
                            Granel
                        </label>
                    </div>
                </div>

                {/* Mensajes */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
                        ✅ Producto creado exitosamente
                    </div>
                )}

                {/* Botón Submit */}
                <button
                    type="submit"
                    disabled={uploading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-md transition disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {uploading ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Subiendo...
                        </>
                    ) : (
                        'Crear Producto'
                    )}
                </button>
            </form>
        </div>
    );
}
