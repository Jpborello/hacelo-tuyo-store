'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Loader2, X, Save, Upload } from 'lucide-react';
import Image from 'next/image';
import type { Producto } from '@/lib/types/database';
import imageCompression from 'browser-image-compression';

interface ProductEditProps {
    product: Producto;
    onClose: () => void;
    onProductUpdated: () => void;
}

export default function ProductEdit({ product, onClose, onProductUpdated }: ProductEditProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string>(product.imagen_url || '');

    const [formData, setFormData] = useState({
        nombre: product.nombre,
        descripcion: product.descripcion || '',
        precio: product.precio,
        stock: product.stock,
        activo: product.activo
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;

        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked;
            setFormData(prev => ({ ...prev, [name]: checked }));
        } else if (name === 'precio' || name === 'stock') {
            setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validar tipo de archivo
        if (!file.type.startsWith('image/')) {
            setError('Por favor seleccioná una imagen');
            return;
        }

        // Validar tamaño (max 10MB antes de comprimir)
        if (file.size > 10 * 1024 * 1024) {
            setError('La imagen no puede pesar más de 10MB');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // Comprimir imagen automáticamente
            const options = {
                maxSizeMB: 0.5, // Máximo 500KB
                maxWidthOrHeight: 1920, // Máximo 1920px
                useWebWorker: true,
                fileType: 'image/webp' // Convertir a WebP
            };

            const compressedFile = await imageCompression(file, options);

            // Log de compresión
            const originalSizeMB = (file.size / 1024 / 1024).toFixed(2);
            const compressedSizeMB = (compressedFile.size / 1024 / 1024).toFixed(2);
            console.log(`Imagen comprimida: ${originalSizeMB}MB → ${compressedSizeMB}MB`);

            setImageFile(compressedFile);

            // Preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(compressedFile);
        } catch (err) {
            setError('Error al comprimir la imagen');
            console.error('Compression error:', err);
        } finally {
            setLoading(false);
        }
    };

    const uploadImage = async (file: File): Promise<string> => {
        const supabase = createClient();
        // Usar .webp para archivos comprimidos
        const fileName = `${Math.random().toString(36).substring(2)}.webp`;
        const filePath = `productos/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('productos')
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
            .from('productos')
            .getPublicUrl(filePath);

        return publicUrl;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const supabase = createClient();

            // Subir nueva imagen si hay
            let imagenUrl = product.imagen_url;
            if (imageFile) {
                imagenUrl = await uploadImage(imageFile);
            }

            // Actualizar producto
            const { error: updateError } = await supabase
                .from('productos')
                .update({
                    nombre: formData.nombre,
                    descripcion: formData.descripcion,
                    precio: formData.precio,
                    stock: formData.stock,
                    activo: formData.activo,
                    imagen_url: imagenUrl
                })
                .eq('id', product.id);

            if (updateError) throw updateError;

            onProductUpdated();
            onClose();

        } catch (err: any) {
            console.error('Error:', err);
            setError(err.message || 'Error al actualizar producto');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-900">Editar Producto</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Imagen */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Imagen del Producto
                        </label>
                        <div className="flex items-start gap-4">
                            {imagePreview && (
                                <div className="relative w-32 h-32 rounded-lg overflow-hidden border-2 border-gray-200">
                                    <Image
                                        src={imagePreview}
                                        alt="Preview"
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                            )}
                            <label className="flex-1 cursor-pointer">
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
                                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                    <p className="text-sm text-gray-600">
                                        Click para cambiar imagen
                                    </p>
                                </div>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileSelect}
                                    className="hidden"
                                />
                            </label>
                        </div>
                    </div>

                    {/* Nombre */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nombre del Producto
                        </label>
                        <input
                            type="text"
                            name="nombre"
                            value={formData.nombre}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                        />
                    </div>

                    {/* Descripción */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Descripción
                        </label>
                        <textarea
                            name="descripcion"
                            value={formData.descripcion}
                            onChange={handleChange}
                            rows={3}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                        />
                    </div>

                    {/* Precio y Stock */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Precio
                            </label>
                            <input
                                type="number"
                                name="precio"
                                value={formData.precio}
                                onChange={handleChange}
                                required
                                min="0"
                                step="0.01"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Stock
                            </label>
                            <input
                                type="number"
                                name="stock"
                                value={formData.stock}
                                onChange={handleChange}
                                required
                                min="0"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                            />
                        </div>
                    </div>

                    {/* Activo */}
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            name="activo"
                            checked={formData.activo}
                            onChange={handleChange}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label className="text-sm font-medium text-gray-700">
                            Producto activo (visible en el catálogo)
                        </label>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    {/* Buttons */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Guardando...
                                </>
                            ) : (
                                <>
                                    <Save className="w-5 h-5" />
                                    Guardar Cambios
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
