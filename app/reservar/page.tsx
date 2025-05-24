"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { initializeFirebaseData, getAvailableCourts, getAvailableTimes } from "@/lib/reservation-service"
import { Loader2, Info } from "lucide-react"
import { normalizarFechaArgentina, sonFechasIguales } from "@/lib/dateUtils"
import { ref, onValue, off } from "firebase/database"
import { database } from "@/lib/firebase"
import { Court } from "@/lib/reservation-service"

export default function ReservarPage() {
  const router = useRouter()
  const [date, setDate] = useState<Date | undefined>(undefined)
  const [court, setCourt] = useState<string>("")
  const [time, setTime] = useState<string>("")
  const [availableCourts, setAvailableCourts] = useState<Court[]>([])
  const [availableTimes, setAvailableTimes] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingTimes, setIsLoadingTimes] = useState(false)
  const [next7Days, setNext7Days] = useState<Date[]>([])
  const [availabilityData, setAvailabilityData] = useState<any>(null)
  const [selectedCourtDetails, setSelectedCourtDetails] = useState<Court | null>(null)
  const [isNightTime, setIsNightTime] = useState(false)

  // Generar los próximos 7 días al cargar
  useEffect(() => {
    const days: Date[] = []
    const today = new Date()
    for (let i = 0; i < 7; i++) {
      const nextDay = new Date(today)
      nextDay.setDate(today.getDate() + i)
      days.push(nextDay)
    }
    setNext7Days(days)
  }, [])

  useEffect(() => {
    const initializeData = async () => {
      try {
        // Initialize Firebase with sample data if needed
        await initializeFirebaseData()

        // Get available courts
        const courts = await getAvailableCourts()
        setAvailableCourts(courts)
      } catch (error) {
        console.error("Error initializing data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    initializeData()
  }, [])

  useEffect(() => {
    const loadAvailableTimes = async () => {
      if (date && court) {
        setIsLoadingTimes(true)
        try {
          const times = await getAvailableTimes(date, court)
          setAvailableTimes(times)
        } catch (error) {
          console.error("Error loading available times:", error)
          setAvailableTimes([])
        } finally {
          setIsLoadingTimes(false)
        }
      } else {
        setAvailableTimes([])
      }
    }

    loadAvailableTimes()
  }, [date, court])

  // Escuchar en tiempo real la disponibilidad
  useEffect(() => {
    const availabilityRef = ref(database, "availability")
    const handleValue = (snapshot: any) => {
      setAvailabilityData(snapshot.exists() ? snapshot.val() : {})
    }
    onValue(availabilityRef, handleValue)
    return () => off(availabilityRef, "value", handleValue)
  }, [])

  // Actualizar detalles de la cancha seleccionada
  useEffect(() => {
    if (court && availableCourts.length > 0) {
      const courtDetails = availableCourts.find(c => c.name === court) || null
      setSelectedCourtDetails(courtDetails)
    } else {
      setSelectedCourtDetails(null)
    }
  }, [court, availableCourts])

  // Determinar si es horario nocturno
  useEffect(() => {
    if (time) {
      const hourParts = time.split(" - ")[0].split(":")
      const hour = parseInt(hourParts[0])
      setIsNightTime(hour >= 18 || hour < 8)
    } else {
      setIsNightTime(false)
    }
  }, [time])

  const handleContinue = () => {
    if (date && court && time && selectedCourtDetails) {
      const price = isNightTime ? selectedCourtDetails.nightPrice : selectedCourtDetails.dayPrice
      const reservationData = {
        date: date.toISOString(),
        court,
        time,
        price,
        courtDescription: selectedCourtDetails.description
      }
      localStorage.setItem("currentReservation", JSON.stringify(reservationData))
      router.push("/reservar/datos")
    }
  }

  // Función para formatear la fecha en español
  const formatDate = (date: Date) => {
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
    
    return {
      dayName: days[date.getDay()],
      dayNumber: date.getDate(),
      month: months[date.getMonth()]
    }
  }

  // Verificar si una fecha es hoy
  const isToday = (date: Date) => {
    const today = new Date()
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
  }

  // Función para obtener el precio actual
  const getCurrentPrice = () => {
    if (!selectedCourtDetails) return null;
    return isNightTime ? selectedCourtDetails.nightPrice : selectedCourtDetails.dayPrice;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-green-100 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin text-green-700" />
          <p className="mt-4 text-green-800">Cargando datos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="container mx-auto px-4">
        <Card className="max-w-4xl mx-auto shadow-md border-0 rounded-xl overflow-hidden">
          <CardHeader className="bg-[#38b178] text-white">
            <CardTitle className="text-2xl text-center">Selecciona tu reserva</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 pb-8 px-6">
            {/* Selección de cancha */}
            <div className="mb-6">
              <Label htmlFor="court" className="text-gray-700 font-medium mb-2 block">Cancha</Label>
              <Select value={court} onValueChange={setCourt}>
                <SelectTrigger id="court" className="border-gray-300 focus:ring-[#38b178] focus:border-[#38b178]">
                  <SelectValue placeholder="Selecciona una cancha" />
                </SelectTrigger>
                <SelectContent>
                  {availableCourts.map((courtItem) => (
                    <SelectItem key={courtItem.id} value={courtItem.name}>
                      {courtItem.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedCourtDetails && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-start">
                    <Info className="h-5 w-5 text-[#38b178] mt-0.5 mr-2 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">{selectedCourtDetails.description}</p>
                      <div className="flex flex-wrap gap-3 mt-2">
                        <div className="text-xs bg-[#38b178] bg-opacity-15 text-[#38b178] px-2 py-1 rounded">
                          <span className="font-medium">Tarifa día:</span> ${selectedCourtDetails.dayPrice}
                        </div>
                        <div className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded">
                          <span className="font-medium">Tarifa noche:</span> ${selectedCourtDetails.nightPrice}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Selección de fecha - Estilo ATC Sports */}
            <div className="mb-6">
              <Label className="text-gray-700 font-medium mb-2 block">Fecha</Label>
              <div className="grid grid-cols-7 gap-2">
                {next7Days.map((dayDate) => {
                  const { dayName, dayNumber, month } = formatDate(dayDate)
                  return (
                    <Button
                      key={dayDate.toISOString()}
                      onClick={() => setDate(dayDate)}
                      variant="outline"
                      className={`h-auto py-3 px-2 flex flex-col items-center rounded-lg transition-all ${
                        date && sonFechasIguales(date, dayDate) 
                        ? 'bg-[#38b178] text-white border-[#38b178]' 
                        : 'hover:border-[#38b178] hover:text-[#38b178]'
                      }`}
                    >
                      <span className="text-xs font-semibold">{dayName}</span>
                      <span className="text-xl font-bold my-1">{dayNumber}</span>
                      <span className="text-xs">{month}</span>
                      {isToday(dayDate) && <span className="text-xs font-semibold mt-1">HOY</span>}
                    </Button>
                  )
                })}
              </div>
            </div>

            {/* Selección de hora */}
            {date && court && (
              <div className="mb-6">
                <Label htmlFor="time" className="text-gray-700 font-medium mb-2 block">Horario</Label>
                {isLoadingTimes ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="h-6 w-6 animate-spin text-[#38b178]" />
                  </div>
                ) : (
                  <>
                    {availableTimes.length > 0 ? (
                      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                        {availableTimes.map((timeSlot) => (
                          <Button
                            key={timeSlot}
                            variant="outline"
                            className={`px-4 py-2 border rounded-md transition-all ${
                              time === timeSlot 
                              ? 'bg-[#38b178] text-white border-[#38b178]' 
                              : 'hover:border-[#38b178] hover:text-[#38b178]'
                            }`}
                            onClick={() => setTime(timeSlot)}
                          >
                            {timeSlot}
                          </Button>
                        ))}
                      </div>
                    ) : (
                      <div className="p-6 text-center bg-red-50 rounded-md border border-red-200">
                        <p className="text-red-600">No hay horarios disponibles para esta fecha y cancha</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Mostrar precio cuando se ha seleccionado cancha y horario */}
            {court && time && selectedCourtDetails && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800 font-medium text-center">
                  Precio de la reserva: <span className="text-xl font-bold">${getCurrentPrice()}</span>
                  <span className="ml-2 text-sm font-normal">
                    ({isNightTime ? 'Tarifa nocturna' : 'Tarifa diurna'})
                  </span>
                </p>
              </div>
            )}

            {/* Botón de continuar */}
            <div className="flex justify-end pt-4">
              <Button
                onClick={handleContinue}
                disabled={!date || !court || !time}
                className="bg-[#38b178] hover:bg-[#2d9964] text-white px-6 py-2 rounded-md transition-all"
              >
                Continuar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
