"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2, AlertCircle, Plus, Trash2, Loader2, Info, Clock, Edit2, Image } from "lucide-react"
import { UploadThingImage } from "@/components/uploadthing"
import {
  addCourt,
  removeCourt,
  updateCourt,
  addTimeSlot,
  removeTimeSlot,
  getAvailableCourts,
  getAvailableTimes,
  setCourtAvailability,
  getAllTimeSlots,
  Court
} from "@/lib/reservation-service"
import { ref, get } from "firebase/database"
import { database } from "@/lib/firebase"
import { normalizarFechaArgentina } from "@/lib/dateUtils"

// Opciones predefinidas para las descripciones de canchas
const COURT_DESCRIPTIONS = [
  "Cemento | Con iluminación",
  "Sintético y Muro | Con iluminación",
  "Sintético y Muro | Con iluminación | Cubierta",
  "Blindex y sintético | Con iluminación"
]

export default function AdminAvailability() {
  const [courts, setCourts] = useState<Court[]>([])
  const [newCourt, setNewCourt] = useState("")
  const [newCourtDescription, setNewCourtDescription] = useState(COURT_DESCRIPTIONS[0])
  const [newCourtDayPrice, setNewCourtDayPrice] = useState<number>(0)
  const [newCourtNightPrice, setNewCourtNightPrice] = useState<number>(0)
  const [newCourtImage, setNewCourtImage] = useState<File | null>(null)
  const [newCourtImageUrl, setNewCourtImageUrl] = useState("")
  const [selectedCourt, setSelectedCourt] = useState("")
  const [editingCourt, setEditingCourt] = useState<Court | null>(null)
  const [date, setDate] = useState<Date | undefined>(undefined)
  const [timeSlots, setTimeSlots] = useState<string[]>([])
  const [newTimeSlot, setNewTimeSlot] = useState("")
  const [unavailableTimeSlots, setUnavailableTimeSlots] = useState<string[]>([])
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isActionLoading, setIsActionLoading] = useState(false)
  const [markedDays, setMarkedDays] = useState<Date[]>([])
  const [startTime, setStartTime] = useState("09:00")
  const [endTime, setEndTime] = useState("22:30")

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        // Load courts
        const availableCourts = await getAvailableCourts()
        setCourts(availableCourts)

        // Load time slots
        const availableTimeSlots = await getAllTimeSlots()
        setTimeSlots(availableTimeSlots)
      } catch (error) {
        console.error("Error loading data:", error)
        setError("Error al cargar los datos. Por favor, recarga la página.")
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  useEffect(() => {
    const loadUnavailableTimes = async () => {
      if (selectedCourt && date) {
        try {
          // Ahora cargamos los horarios disponibles para la fecha y cancha
          const availableTimes = await getAvailableTimes(date, selectedCourt)
          
          // Para obtener los horarios NO disponibles, comparamos con todos los horarios
          const unavailable = timeSlots.filter(slot => !availableTimes.includes(slot))
          setUnavailableTimeSlots(unavailable)
        } catch (error) {
          console.error("Error loading unavailable times:", error)
          setUnavailableTimeSlots([])
        }
      } else {
        setUnavailableTimeSlots([])
      }
    }

    loadUnavailableTimes()
  }, [selectedCourt, date, timeSlots])

  // Cargar días con excepciones (días con al menos un horario NO disponible)
  useEffect(() => {
    const fetchMarkedDays = async () => {
      if (!selectedCourt || timeSlots.length === 0) {
        setMarkedDays([])
        return
      }
      try {
        const availabilitySnapshot = await get(ref(database, "availability"))
        if (!availabilitySnapshot.exists()) {
          setMarkedDays([])
          return
        }
        const availability = availabilitySnapshot.val()
        const days: Date[] = []
        Object.keys(availability).forEach((dateString) => {
          const courtTimes = availability[dateString]?.[selectedCourt]
          if (courtTimes && courtTimes.length < timeSlots.length) {
            // Hay al menos un horario NO disponible
            days.push(normalizarFechaArgentina(dateString))
          }
        })
        setMarkedDays(days)
      } catch (err) {
        setMarkedDays([])
      }
    }
    fetchMarkedDays()
  }, [selectedCourt, timeSlots])

  const handleAddCourt = async () => {
    if (!newCourt.trim()) {
      setError("El nombre de la cancha no puede estar vacío")
      return
    }

    setIsActionLoading(true)
    try {
      await addCourt(
        newCourt.trim(),
        newCourtDescription,
        newCourtDayPrice,
        newCourtNightPrice,
        newCourtImageUrl
      )
      const updatedCourts = await getAvailableCourts()
      setCourts(updatedCourts)
      setNewCourt("")
      setNewCourtDescription(COURT_DESCRIPTIONS[0])
      setNewCourtDayPrice(0)
      setNewCourtNightPrice(0)
      setNewCourtImage(null)
      setNewCourtImageUrl("")
      setSuccess(`Cancha "${newCourt}" añadida correctamente`)
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      setError(err.message || "Error al añadir la cancha")
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleRemoveCourt = async (court: Court) => {
    setIsActionLoading(true)
    try {
      await removeCourt(court.id)
      const updatedCourts = await getAvailableCourts()
      setCourts(updatedCourts)
      if (selectedCourt === court.name) {
        setSelectedCourt("")
      }
      setSuccess(`Cancha "${court.name}" eliminada correctamente`)
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      setError(err.message || "Error al eliminar la cancha")
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleEditCourt = (court: Court) => {
    setEditingCourt(court)
  }

  const handleUpdateCourt = async () => {
    if (!editingCourt) return

    setIsActionLoading(true)
    try {
      await updateCourt(
        editingCourt.id,
        editingCourt.name,
        editingCourt.description,
        editingCourt.dayPrice,
        editingCourt.nightPrice,
        editingCourt.imageUrl
      )
      const updatedCourts = await getAvailableCourts()
      setCourts(updatedCourts)
      setEditingCourt(null)
      setNewCourtImage(null)
      setNewCourtImageUrl("")
      setSuccess(`Cancha "${editingCourt.name}" actualizada correctamente`)
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      setError(err.message || "Error al actualizar la cancha")
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleCancelEdit = () => {
    setEditingCourt(null)
  }

  const handleAddTimeSlot = async () => {
    if (!newTimeSlot.trim()) {
      setError("El horario no puede estar vacío")
      return
    }

    setIsActionLoading(true)
    try {
      await addTimeSlot(newTimeSlot.trim())
      const updatedTimeSlots = await getAllTimeSlots()
      setTimeSlots(updatedTimeSlots)
      setNewTimeSlot("")
      setSuccess(`Horario "${newTimeSlot}" añadido correctamente`)
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      setError(err.message || "Error al añadir el horario")
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleRemoveTimeSlot = async (timeSlot: string) => {
    setIsActionLoading(true)
    try {
      await removeTimeSlot(timeSlot)
      const updatedTimeSlots = await getAllTimeSlots()
      setTimeSlots(updatedTimeSlots)
      setSuccess(`Horario "${timeSlot}" eliminado correctamente`)
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      setError(err.message || "Error al eliminar el horario")
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleToggleTimeSlot = (timeSlot: string) => {
    const newUnavailableTimeSlots = [...unavailableTimeSlots]

    if (newUnavailableTimeSlots.includes(timeSlot)) {
      // Si estaba marcado como no disponible, ahora lo hacemos disponible
      const index = newUnavailableTimeSlots.indexOf(timeSlot)
      newUnavailableTimeSlots.splice(index, 1)
    } else {
      // Si estaba disponible, ahora lo hacemos no disponible
      newUnavailableTimeSlots.push(timeSlot)
    }

    setUnavailableTimeSlots(newUnavailableTimeSlots)
  }

  const handleSaveAvailability = async () => {
    if (!selectedCourt || !date) {
      setError("Debes seleccionar una cancha y una fecha")
      return
    }

    setIsActionLoading(true)
    try {
      // Calculamos los horarios disponibles (todos menos los marcados como no disponibles)
      const availableTimeSlots = timeSlots.filter(slot => !unavailableTimeSlots.includes(slot))
      
      // Y enviamos los disponibles a la base de datos
      await setCourtAvailability(date, selectedCourt, availableTimeSlots)
      setSuccess("Disponibilidad guardada correctamente")
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      setError(err.message || "Error al guardar la disponibilidad")
    } finally {
      setIsActionLoading(false)
    }
  }

  // Función para generar horarios preestablecidos cada 1:30 horas
  const generateTimeSlots = async () => {
    if (!startTime || !endTime) {
      setError("Debes especificar horario de inicio y fin")
      return
    }
    
    setIsActionLoading(true)
    try {
      // Convertir startTime y endTime a minutos para facilitar cálculos
      const [startHour, startMinute] = startTime.split(":").map(Number)
      const [endHour, endMinute] = endTime.split(":").map(Number)
      
      let startMinutes = startHour * 60 + startMinute
      const endMinutes = endHour * 60 + endMinute
      
      if (startMinutes >= endMinutes) {
        throw new Error("La hora de inicio debe ser anterior a la hora de fin")
      }
      
      const intervalMinutes = 90 // 1 hora y 30 minutos
      const generatedSlots: string[] = []
      
      // Generar los rangos de horarios
      while (startMinutes + intervalMinutes <= endMinutes) {
        const slotStartHour = Math.floor(startMinutes / 60)
        const slotStartMinute = startMinutes % 60
        
        const slotEndMinutes = startMinutes + intervalMinutes
        const slotEndHour = Math.floor(slotEndMinutes / 60)
        const slotEndMinute = slotEndMinutes % 60
        
        const formattedStartTime = `${slotStartHour.toString().padStart(2, '0')}:${slotStartMinute.toString().padStart(2, '0')}`
        const formattedEndTime = `${slotEndHour.toString().padStart(2, '0')}:${slotEndMinute.toString().padStart(2, '0')}`
        
        const timeSlot = `${formattedStartTime} - ${formattedEndTime}`
        generatedSlots.push(timeSlot)
        
        // Avanzar al siguiente horario
        startMinutes += intervalMinutes
      }
      
      // Limpiar horarios existentes y añadir los nuevos
      // Primero obtenemos los horarios actuales para eliminarlos
      const currentTimeSlots = await getAllTimeSlots()
      
      // Eliminamos cada horario existente
      for (const slot of currentTimeSlots) {
        await removeTimeSlot(slot)
      }
      
      // Añadimos los nuevos horarios generados
      for (const slot of generatedSlots) {
        await addTimeSlot(slot)
      }
      
      // Actualizamos la lista de horarios
      const updatedTimeSlots = await getAllTimeSlots()
      setTimeSlots(updatedTimeSlots)
      
      setSuccess(`Se han generado ${generatedSlots.length} horarios cada 1:30 horas`)
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      setError(err.message || "Error al generar horarios")
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleImageUpload = (url: string) => {
    setNewCourtImageUrl(url);
  }

  const handleEditImageUpload = (url: string) => {
    if (editingCourt) {
      setEditingCourt({...editingCourt, imageUrl: url});
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin text-green-700" />
          <p className="mt-4 text-green-800">Cargando datos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-4 bg-green-50 text-green-800 border-green-200">
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <div className="grid md:grid-cols-2 gap-8">
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-green-800 mb-4">Gestión de Canchas</h3>

            <div className="space-y-4 mb-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="court-name">Nombre de la cancha</Label>
                  <Input
                    id="court-name"
                    placeholder="Nombre de la cancha"
                    value={newCourt}
                    onChange={(e) => setNewCourt(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="court-description">Descripción</Label>
                  <Select value={newCourtDescription} onValueChange={setNewCourtDescription}>
                    <SelectTrigger id="court-description">
                      <SelectValue placeholder="Selecciona una descripción" />
                    </SelectTrigger>
                    <SelectContent>
                      {COURT_DESCRIPTIONS.map((desc) => (
                        <SelectItem key={desc} value={desc}>
                          {desc}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="day-price">Precio Día</Label>
                    <Input
                      id="day-price"
                      type="number"
                      value={newCourtDayPrice}
                      onChange={(e) => setNewCourtDayPrice(parseInt(e.target.value) || 0)}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="night-price">Precio Noche</Label>
                    <Input
                      id="night-price"
                      type="number"
                      value={newCourtNightPrice}
                      onChange={(e) => setNewCourtNightPrice(parseInt(e.target.value) || 0)}
                      placeholder="0"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="court-image">Imagen de la cancha</Label>
                  <div className="flex items-center gap-4 mt-1">
                    <UploadThingImage
                      onUploadComplete={handleImageUpload}
                      value={newCourtImageUrl}
                    />
                  </div>
                </div>

                <Button 
                  onClick={handleAddCourt} 
                  className="bg-green-700 hover:bg-green-800 w-full" 
                  disabled={isActionLoading}
                >
                  {isActionLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-1" />
                      Añadir Cancha
                    </>
                  )}
                </Button>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Canchas disponibles:</h4>
                {courts.length === 0 ? (
                  <p className="text-gray-500 text-sm">No hay canchas disponibles</p>
                ) : (
                  <div className="space-y-3">
                    {courts.map((court) => (
                      <div key={court.id} className="bg-gray-50 rounded-lg p-3 shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h5 className="font-semibold">{court.name}</h5>
                            <p className="text-sm text-gray-600">{court.description}</p>
                          </div>
                          <div className="flex space-x-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditCourt(court)}
                              className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                              disabled={isActionLoading}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveCourt(court)}
                          className="text-red-600 hover:text-red-800 hover:bg-red-50"
                          disabled={isActionLoading}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="bg-green-50 p-2 rounded-md">
                            <span className="font-medium">Precio Día:</span> ${court.dayPrice}
                          </div>
                          <div className="bg-indigo-50 p-2 rounded-md">
                            <span className="font-medium">Precio Noche:</span> ${court.nightPrice}
                          </div>
                        </div>
                        {court.imageUrl && (
                          <div className="mt-2 bg-gray-100 rounded-md overflow-hidden h-24 relative">
                            <img 
                              src={court.imageUrl} 
                              alt={`${court.name}`} 
                              className="object-cover w-full h-full"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal de edición de cancha */}
            {editingCourt && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
                  <h3 className="text-lg font-semibold mb-4">Editar Cancha</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="edit-court-name">Nombre</Label>
                      <Input
                        id="edit-court-name"
                        value={editingCourt.name}
                        onChange={(e) => setEditingCourt({...editingCourt, name: e.target.value})}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="edit-court-description">Descripción</Label>
                      <Select 
                        value={editingCourt.description} 
                        onValueChange={(value) => setEditingCourt({...editingCourt, description: value})}
                      >
                        <SelectTrigger id="edit-court-description">
                          <SelectValue placeholder="Selecciona una descripción" />
                        </SelectTrigger>
                        <SelectContent>
                          {COURT_DESCRIPTIONS.map((desc) => (
                            <SelectItem key={desc} value={desc}>
                              {desc}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="edit-day-price">Precio Día</Label>
                        <Input
                          id="edit-day-price"
                          type="number"
                          value={editingCourt.dayPrice}
                          onChange={(e) => setEditingCourt({
                            ...editingCourt, 
                            dayPrice: parseInt(e.target.value) || 0
                          })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-night-price">Precio Noche</Label>
                        <Input
                          id="edit-night-price"
                          type="number"
                          value={editingCourt.nightPrice}
                          onChange={(e) => setEditingCourt({
                            ...editingCourt, 
                            nightPrice: parseInt(e.target.value) || 0
                          })}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="edit-court-image">Imagen de la cancha</Label>
                      <div className="flex items-center gap-4 mt-1">
                        <UploadThingImage
                          onUploadComplete={handleEditImageUpload}
                          value={editingCourt?.imageUrl}
                        />
                      </div>
                    </div>
                    
                    <div className="flex space-x-3 pt-2">
                      <Button
                        onClick={handleUpdateCourt}
                        className="flex-1 bg-green-700 hover:bg-green-800"
                        disabled={isActionLoading}
                      >
                        {isActionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar"}
                      </Button>
                      <Button
                        onClick={handleCancelEdit}
                        variant="outline"
                        className="flex-1"
                        disabled={isActionLoading}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <h3 className="text-lg font-semibold text-green-800 mb-4">Gestión de Horarios</h3>

            <div className="space-y-4">
              <div className="flex flex-col space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start-time">Hora de inicio</Label>
                    <Input
                      id="start-time"
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="end-time">Hora de fin</Label>
                    <Input
                      id="end-time"
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                    />
                  </div>
                </div>
                <Button
                  onClick={generateTimeSlots}
                  className="bg-amber-600 hover:bg-amber-700 w-full"
                  disabled={isActionLoading}
                >
                  {isActionLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Clock className="h-4 w-4 mr-1" />
                      Generar Horarios de 1:30h
                    </>
                  )}
                </Button>
                <p className="text-xs text-gray-500 text-center">
                  Esta acción reemplazará todos los horarios existentes con nuevos horarios de 1:30h
                </p>
              </div>

              <div className="flex space-x-2 mt-4">
                <div className="flex-1">
                  <Input
                    placeholder="Horario (ej: 09:00 - 10:30)"
                    value={newTimeSlot}
                    onChange={(e) => setNewTimeSlot(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (!isActionLoading) {
                          handleAddTimeSlot();
                        }
                      }
                    }}
                  />
                </div>
                <Button
                  onClick={handleAddTimeSlot}
                  className="bg-green-700 hover:bg-green-800"
                  disabled={isActionLoading}
                >
                  {isActionLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-1" />
                      Añadir
                    </>
                  )}
                </Button>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Horarios disponibles:</h4>
                {timeSlots.length === 0 ? (
                  <p className="text-gray-500 text-sm">No hay horarios disponibles</p>
                ) : (
                  <ul className="space-y-2">
                    {timeSlots.map((timeSlot) => (
                      <li key={timeSlot} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span>{timeSlot}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveTimeSlot(timeSlot)}
                          className="text-red-600 hover:text-red-800 hover:bg-red-50"
                          disabled={isActionLoading}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-green-800 mb-4">Configurar Excepciones</h3>
            
            <div className="flex items-center mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <Info className="h-5 w-5 text-amber-600 mr-2 flex-shrink-0" />
              <p className="text-sm text-amber-700">
                Por defecto, todas las canchas están disponibles con todos los horarios. 
                Aquí puedes marcar excepciones para días específicos.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="court-select">Selecciona una cancha</Label>
                <Select value={selectedCourt} onValueChange={setSelectedCourt}>
                  <SelectTrigger id="court-select">
                    <SelectValue placeholder="Selecciona una cancha" />
                  </SelectTrigger>
                  <SelectContent>
                    {courts.map((court) => (
                      <SelectItem key={court.id} value={court.name}>
                        {court.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Selecciona una fecha</Label>
                <div className="border rounded-md p-4">
                  <Calendar mode="single" selected={date} onSelect={setDate} className="mx-auto" markedDays={markedDays} />
                </div>
              </div>

              {selectedCourt && date && (
                <div className="space-y-2">
                  <Label>Marca los horarios NO disponibles</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {timeSlots.map((timeSlot) => (
                      <Button
                        key={timeSlot}
                        variant={unavailableTimeSlots.includes(timeSlot) ? "destructive" : "outline"}
                        onClick={() => handleToggleTimeSlot(timeSlot)}
                      >
                        {timeSlot}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4">
                <Button
                  onClick={handleSaveAvailability}
                  disabled={!selectedCourt || !date || isActionLoading}
                  className="w-full bg-green-700 hover:bg-green-800"
                >
                  {isActionLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    "Guardar Excepciones"
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
