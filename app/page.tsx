"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import { CalendarIcon, Users, ClipboardList, Loader2, MapPin, Star } from "lucide-react"
import { Footer } from "@/components/ui/footer"
import { initializeFirebaseData, getAvailableCourts, getAvailableTimes, Court } from "@/lib/reservation-service"
import { normalizarFechaArgentina, sonFechasIguales } from "@/lib/dateUtils"
import { ref, onValue, off } from "firebase/database"
import { database } from "@/lib/firebase"
import Image from "next/image"

export default function Home() {
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

  // Actualizar detalles de la cancha seleccionada
  useEffect(() => {
    if (court && availableCourts.length > 0) {
      const courtDetails = availableCourts.find(c => c.name === court) || null
      setSelectedCourtDetails(courtDetails)
    } else {
      setSelectedCourtDetails(null)
    }
  }, [court, availableCourts])

  // Escuchar en tiempo real la disponibilidad
  useEffect(() => {
    const availabilityRef = ref(database, "availability")
    const handleValue = (snapshot: any) => {
      setAvailabilityData(snapshot.exists() ? snapshot.val() : {})
    }
    onValue(availabilityRef, handleValue)
    return () => off(availabilityRef, "value", handleValue)
  }, [])

  const handleContinue = () => {
    if (date && court && time && selectedCourtDetails) {
      const reservationData = {
        date: date.toISOString(),
        court,
        time,
        price: selectedCourtDetails.dayPrice, // Por defecto usamos precio de día
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-green-100">
      <header className="bg-white shadow-sm py-3">
        <div className="container mx-auto px-3 flex justify-between items-center">
          <h1 className="text-xl font-bold text-green-700">PadelReserva</h1>
          <Link href="/admin/login">
            <Button variant="outline" size="sm" className="text-green-700 border-green-700">
              Acceso Admin
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-3 py-5">
        <section className="text-center mb-5">
          <h2 className="text-3xl font-bold text-green-800 mb-1">Reserva tu turno de pádel</h2>
          <p className="text-sm text-gray-600 max-w-xl mx-auto">
            Reserva fácilmente tu cancha de pádel en pocos pasos. Sin necesidad de registro.
          </p>
        </section>

        {/* Información de la cancha con imagen */}
        <div className="max-w-md mx-auto mb-4 overflow-hidden rounded-lg shadow">
          <div className="relative h-48 w-full">
            {selectedCourtDetails && selectedCourtDetails.imageUrl ? (
              <Image 
                src={selectedCourtDetails.imageUrl} 
                alt={selectedCourtDetails.name} 
                fill 
                className="object-cover"
                priority
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-500">
                <span>Selva Padel Club</span>
              </div>
            )}
            <div className="absolute bottom-0 right-0 m-3">
              <div className="bg-orange-400 rounded-full h-10 w-10 flex items-center justify-center">
                <MapPin className="text-white h-5 w-5" />
              </div>
            </div>
          </div>
          <div className="bg-white p-3">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">Selva Padel Club</h3>
              <div className="flex items-center">
                <span className="text-base font-bold text-green-700 mr-1">5</span>
                <Star className="h-4 w-4 fill-green-700 text-green-700" />
              </div>
            </div>
            <div className="flex items-center text-gray-500 mt-0.5">
              <MapPin className="h-3 w-3 mr-1" />
              <span className="text-xs">Selva 1000 , Selva</span>
            </div>
          </div>
          <div className="border-t flex">
            <button className="flex-1 py-2 text-sm text-green-700 font-medium bg-white">
              RESERVAR
            </button>
            <button className="flex-1 py-2 text-sm text-gray-400 font-medium bg-white border-l">
              INFO GENERAL
            </button>
          </div>
        </div>

        {/* Formulario de reserva */}
        <section className="max-w-md mx-auto mb-8">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="flex flex-col items-center">
                <Loader2 className="h-8 w-8 animate-spin text-green-700" />
                <p className="mt-2 text-green-800">Cargando datos...</p>
              </div>
            </div>
          ) : (
            <Card className="bg-white border-0 rounded-lg overflow-hidden shadow">
              <CardHeader className="bg-green-700 py-3 px-3">
                <CardTitle className="text-base text-center text-white font-medium">Selecciona tu reserva</CardTitle>
              </CardHeader>
              <CardContent className="p-3">
                {/* Selección de cancha */}
                <div className="mb-3">
                  <Label htmlFor="court" className="text-sm text-gray-700 mb-1 block">Cancha</Label>
                  <Select value={court} onValueChange={setCourt}>
                    <SelectTrigger id="court" className="border rounded-md w-full h-9">
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
                    <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                      <p className="font-medium">{selectedCourtDetails.description}</p>
                      <div className="flex gap-2 mt-1">
                        <span className="bg-green-100 text-green-800 px-1 py-0.5 rounded">
                          Día: ${selectedCourtDetails.dayPrice}
                        </span>
                        <span className="bg-blue-100 text-blue-800 px-1 py-0.5 rounded">
                          Noche: ${selectedCourtDetails.nightPrice}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Selección de fecha */}
                <div className="mb-3">
                  <Label className="text-sm text-gray-700 mb-1 block">Fecha</Label>
                  <div className="grid grid-cols-7 gap-1">
                    {next7Days.map((dayDate) => {
                      const { dayName, dayNumber, month } = formatDate(dayDate)
                      const isSelected = date && sonFechasIguales(date, dayDate);
                      return (
                        <button
                          key={dayDate.toISOString()}
                          onClick={() => setDate(dayDate)}
                          className={`flex flex-col items-center justify-center p-1 rounded-md text-center ${
                            isSelected
                              ? 'bg-green-700 text-white'
                              : 'bg-white hover:bg-gray-50 border'
                          }`}
                        >
                          <span className="text-[10px] font-medium">{dayName}</span>
                          <span className="text-base font-bold leading-tight">{dayNumber}</span>
                          <span className="text-[10px]">{month}</span>
                          {isToday(dayDate) && (
                            <span className="text-[10px] font-bold leading-tight">
                              HOY
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Selección de hora */}
                {date && court && (
                  <div className="mb-3">
                    <Label htmlFor="time" className="text-sm text-gray-700 mb-1 block">Horario</Label>
                    {isLoadingTimes ? (
                      <div className="flex justify-center py-3">
                        <Loader2 className="h-5 w-5 animate-spin text-green-700" />
                      </div>
                    ) : (
                      <>
                        {availableTimes.length > 0 ? (
                          <div className="grid grid-cols-3 gap-2">
                            {availableTimes.map((timeSlot) => (
                              <button
                                key={timeSlot}
                                onClick={() => setTime(timeSlot)}
                                className={`px-1 py-1.5 border rounded-md text-sm text-center ${
                                  time === timeSlot
                                    ? 'bg-green-700 text-white border-green-700'
                                    : 'bg-white hover:bg-gray-50'
                                }`}
                              >
                                {timeSlot}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="p-3 text-center bg-red-50 rounded-md border border-red-200">
                            <p className="text-red-600 text-xs">No hay horarios disponibles para esta fecha y cancha</p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* Botón de continuar */}
                <div className="flex justify-center">
                  <button
                    onClick={handleContinue}
                    disabled={!date || !court || !time}
                    className={`w-full py-2 rounded-md text-white text-sm font-medium text-center transition-colors ${
                      !date || !court || !time
                        ? 'bg-gray-300 cursor-not-allowed'
                        : 'bg-green-500 hover:bg-green-600'
                    }`}
                  >
                    Continuar
                  </button>
                </div>
              </CardContent>
            </Card>
          )}
        </section>

        {/* Tres tarjetas informativas */}
        <section className="grid md:grid-cols-3 gap-4 mb-6">
          <Card className="bg-white shadow hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-2">
                <CalendarIcon className="w-6 h-6 text-green-700" />
              </div>
              <h3 className="text-base font-semibold mb-1">Elige tu horario</h3>
              <p className="text-xs text-gray-600">Selecciona la cancha, fecha y hora que prefieras para jugar.</p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-2">
                <Users className="w-6 h-6 text-green-700" />
              </div>
              <h3 className="text-base font-semibold mb-1">Reserva sin registro</h3>
              <p className="text-xs text-gray-600">Solo necesitas proporcionar tu nombre, email y teléfono.</p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-2">
                <ClipboardList className="w-6 h-6 text-green-700" />
              </div>
              <h3 className="text-base font-semibold mb-1">Recibe tu QR</h3>
              <p className="text-xs text-gray-600">Obtén un código QR con los detalles de tu reserva.</p>
            </CardContent>
          </Card>
        </section>
      </main>

      <Footer />
    </div>
  )
}
