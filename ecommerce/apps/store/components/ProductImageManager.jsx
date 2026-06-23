'use client'

import { useState, useCallback } from 'react'
import { CldUploadWidget } from 'next-cloudinary'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, arrayMove, useSortable, rectSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Star, Trash2, Plus, ImageIcon } from 'lucide-react'

function SortableImage({ image, onSetPrimary, onDelete, index }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: image.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style}
      className="relative group aspect-square rounded-xl overflow-hidden border-2 border-border bg-warm"
    >
      <img
        src={image.imageUrl}
        alt={image.altText || `Product image ${index + 1}`}
        className="w-full h-full object-cover"
      />

      {image.isPrimary && (
        <div className="absolute top-2 left-2 bg-amber text-white text-xs font-sans font-medium px-2 py-1 rounded-full">
          Primary
        </div>
      )}

      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
        <button {...attributes} {...listeners}
          className="w-9 h-9 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center cursor-grab active:cursor-grabbing"
          title="Drag to reorder">
          <GripVertical size={16} className="text-white" />
        </button>

        {!image.isPrimary && (
          <button onClick={() => onSetPrimary(image.id)}
            className="w-9 h-9 bg-amber/80 hover:bg-amber rounded-lg flex items-center justify-center"
            title="Set as primary image">
            <Star size={16} className="text-white" />
          </button>
        )}

        <button onClick={() => onDelete(image.id)}
          className="w-9 h-9 bg-danger/80 hover:bg-danger rounded-lg flex items-center justify-center"
          title="Delete image">
          <Trash2 size={16} className="text-white" />
        </button>
      </div>

      <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs font-sans px-1.5 py-0.5 rounded">
        {index + 1}
      </div>
    </div>
  )
}

export default function ProductImageManager({ productId, initialImages = [], onChange }) {
  const [images, setImages] = useState(initialImages)
  const [isDeleting, setIsDeleting] = useState(null)

  const maxImages = 8
  const canAddMore = images.length < maxImages

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  function getToken() {
    return localStorage.getItem('admin_token')
  }

  const handleUploadSuccess = useCallback(async (result) => {
    const imageUrl = result.info.secure_url

    try {
      const response = await fetch(`/api/store/admin/products/${productId}/images`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({
          imageUrl,
          isPrimary: images.length === 0,
          altText: '',
        }),
      })

      const data = await response.json()
      if (data.data) {
        const newImages = [...images, data.data]
        setImages(newImages)
        onChange?.(newImages)
      }
    } catch (error) {
      console.error('Failed to save image:', error)
    }
  }, [productId, images, onChange])

  const handleDragEnd = useCallback(async (event) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = images.findIndex(img => img.id === active.id)
    const newIndex = images.findIndex(img => img.id === over.id)
    const reordered = arrayMove(images, oldIndex, newIndex)

    setImages(reordered)
    onChange?.(reordered)

    try {
      await fetch(`/api/store/admin/products/${productId}/images/reorder`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({
          images: reordered.map((img, index) => ({ id: img.id, order: index })),
        }),
      })
    } catch (error) {
      console.error('Failed to save order:', error)
    }
  }, [productId, images, onChange])

  const handleSetPrimary = useCallback(async (imageId) => {
    const updated = images.map(img => ({ ...img, isPrimary: img.id === imageId }))
    setImages(updated)
    onChange?.(updated)

    try {
      await fetch(`/api/store/admin/products/${productId}/images/${imageId}/primary`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${getToken()}` },
      })
    } catch (error) {
      console.error('Failed to set primary:', error)
    }
  }, [productId, images, onChange])

  const handleDelete = useCallback(async (imageId) => {
    if (isDeleting) return
    const confirmed = window.confirm('Delete this image? This cannot be undone.')
    if (!confirmed) return

    setIsDeleting(imageId)
    try {
      await fetch(`/api/store/admin/products/${productId}/images/${imageId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      })

      const updated = images.filter(img => img.id !== imageId)
      if (updated.length > 0 && !updated.some(img => img.isPrimary)) {
        updated[0].isPrimary = true
      }
      setImages(updated)
      onChange?.(updated)
    } catch (error) {
      console.error('Failed to delete image:', error)
    } finally {
      setIsDeleting(null)
    }
  }, [productId, images, isDeleting, onChange])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-sans font-medium text-ink">Product Images</h3>
          <p className="text-xs text-ink-secondary font-sans mt-0.5">
            {images.length} / {maxImages} images. Drag to reorder. First image is shown on product cards.
          </p>
        </div>
        <span className={`text-xs font-sans px-2 py-1 rounded-full ${
          images.length >= maxImages
            ? 'bg-danger/10 text-danger'
            : 'bg-forest-light text-forest'
        }`}>
          {maxImages - images.length} slots remaining
        </span>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={images.map(img => img.id)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
            {images.map((image, index) => (
              <SortableImage
                key={image.id}
                image={image}
                index={index}
                onSetPrimary={handleSetPrimary}
                onDelete={handleDelete}
              />
            ))}

            {canAddMore && (
              <CldUploadWidget
                uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'forwardiq-products'}
                onSuccess={handleUploadSuccess}
                options={{
                  maxFiles: maxImages - images.length,
                  multiple: true,
                  resourceType: 'image',
                  clientAllowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
                  maxFileSize: 10485760,
                  cropping: false,
                  showSkipCropButton: true,
                  sources: ['local', 'camera'],
                  styles: {
                    palette: {
                      window: '#FFFFFF',
                      windowBorder: '#E2E0DB',
                      tabIcon: '#1B3A2D',
                      menuIcons: '#1B3A2D',
                      textDark: '#1A1A18',
                      textLight: '#FFFFFF',
                      link: '#1B3A2D',
                      action: '#D4890A',
                      inactiveTabIcon: '#6B6B67',
                      error: '#B94040',
                      inProgress: '#1B3A2D',
                      complete: '#2D6A4F',
                      sourceBg: '#F7F5F1',
                    },
                  },
                }}
              >
                {({ open }) => (
                  <button onClick={() => open()}
                    className="aspect-square rounded-xl border-2 border-dashed border-border hover:border-forest hover:bg-forest-light/30 transition-colors flex flex-col items-center justify-center gap-2 group"
                  >
                    <div className="w-10 h-10 rounded-full bg-warm group-hover:bg-forest-light flex items-center justify-center transition-colors">
                      <Plus size={20} className="text-ink-secondary group-hover:text-forest transition-colors" />
                    </div>
                    <span className="text-xs text-ink-secondary group-hover:text-forest font-sans transition-colors text-center px-2">
                      Add photo
                    </span>
                  </button>
                )}
              </CldUploadWidget>
            )}
          </div>
        </SortableContext>
      </DndContext>

      {images.length === 0 && (
        <div className="border-2 border-dashed border-border rounded-xl p-8 text-center">
          <ImageIcon size={32} className="text-ink-light mx-auto mb-3" />
          <p className="font-sans text-ink-secondary text-sm">No images yet</p>
          <p className="font-sans text-ink-light text-xs mt-1">
            Upload photos to show clients what the product looks like
          </p>
        </div>
      )}

      <div className="bg-amber-light border border-amber/20 rounded-xl p-3">
        <p className="text-xs font-sans text-amber-dark font-medium">Photo tips for better sales</p>
        <ul className="mt-1 space-y-0.5">
          <li className="text-xs font-sans text-ink-secondary">• Take photos in natural daylight</li>
          <li className="text-xs font-sans text-ink-secondary">• Show the product from multiple angles</li>
          <li className="text-xs font-sans text-ink-secondary">• Include a close-up of the material and finish</li>
          <li className="text-xs font-sans text-ink-secondary">• First photo is shown on the store — make it the best one</li>
        </ul>
      </div>
    </div>
  )
}
