"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import Link from "next/link"
import QRCode from "@/components/qr-code"
import { getReservationById } from "@/lib/reservation-service"
import { Loader2, Info } from "lucide-react"

export default function ConfirmacionPage() {
  const router = useRouter()
  const [reservation, setReservation] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchReservation = async () => {
      const reservationId = localStorage.getItem("lastReservationId")
      if (!reservationId) {
        router.push("/reservar")
        return
      }

      try {
        const reservationData = await getReservationById(reservationId)
        setReservation(reservationData)
      } catch (error) {
        console.error("Error fetching reservation:", error)
        router.push("/reservar")
      } finally {
        setIsLoading(false)
      }
    }

    fetchReservation()
  }, [router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin text-green-700" />
          <p className="mt-4 text-green-800">Cargando datos de la reserva...</p>
        </div>
      </div>
    )
  }

  if (!reservation) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-600">No se pudo cargar la información de la reserva.</p>
      </div>
    )
  }

  const date = new Date(reservation.date)
  const formattedDate = date.toLocaleDateString("es-ES", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-green-100 py-12">
      <div className="container mx-auto px-4">
        <Card className="max-w-xl mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-green-800">¡Reserva Confirmada!</CardTitle>
            <CardDescription>Tu reserva ha sido registrada correctamente</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 bg-green-50 rounded-md">
              <h3 className="font-semibold text-green-800 mb-2">Detalles de la reserva:</h3>
              <p>
                <span className="font-medium">ID de Reserva:</span> {reservation.id}
              </p>
              <p>
                <span className="font-medium">Nombre:</span> {reservation.name}
              </p>
              <p>
                <span className="font-medium">Cancha:</span> {reservation.court}
              </p>
              {reservation.courtDescription && (
                <p className="flex items-start">
                  <span className="font-medium mr-1">Características:</span> 
                  <span>{reservation.courtDescription}</span>
                </p>
              )}
              <p>
                <span className="font-medium">Fecha:</span> {formattedDate}
              </p>
              <p>
                <span className="font-medium">Hora:</span> {reservation.time}
              </p>
              {reservation.price !== undefined && (
                <p className="mt-2 pt-2 border-t border-green-200">
                  <span className="font-medium">Precio:</span>{" "}
                  <span className="font-bold text-green-800">${reservation.price}</span>
                </p>
              )}
            </div>

            <div className="flex flex-col items-center">
              <h3 className="font-semibold text-green-800 mb-4">Tu código QR</h3>
              <div className="bg-white p-4 rounded-md">
                <QRCode data={JSON.stringify(reservation)} size={200} />
              </div>
              <p className="mt-4 text-sm text-gray-600 text-center">
                Presenta este código QR al llegar a la cancha para confirmar tu reserva
              </p>
            </div>

            <div className="flex flex-col space-y-4">
              <div className="p-3 bg-amber-50 rounded-md flex items-start">
                <Info className="h-5 w-5 text-amber-600 mr-2 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-700">
                  El pago se realizará en el lugar. Por favor, llega al menos 10 minutos antes de tu horario reservado.
                </p>
              </div>
              
              <div className="flex justify-center pt-2 space-x-4">
                <Link href="/">
                  <Button variant="outline" className="border-green-700 text-green-700">
                    Volver al inicio
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
