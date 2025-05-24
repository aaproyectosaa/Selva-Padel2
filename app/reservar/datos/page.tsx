"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createReservation } from "@/lib/reservation-service"
import { Loader2 } from "lucide-react"

export default function DatosPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [reservationData, setReservationData] = useState<any>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const storedData = localStorage.getItem("currentReservation")
    if (!storedData) {
      router.push("/reservar")
      return
    }
    setReservationData(JSON.parse(storedData))
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    if (!reservationData) return

    try {
      const fullReservation = {
        ...reservationData,
        name,
        email,
        phone,
        status: "pending",
      }

      const reservationId = await createReservation(fullReservation)

      // Store the reservation ID for the confirmation page
      localStorage.setItem("lastReservationId", reservationId)
      router.push("/reservar/confirmacion")
    } catch (error) {
      console.error("Error creating reservation:", error)
      alert("Error al crear la reserva. Por favor, inténtalo de nuevo.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!reservationData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-green-700" />
      </div>
    )
  }

  const date = new Date(reservationData.date)
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
          <CardHeader>
            <CardTitle className="text-2xl text-center text-green-800">Completa tus datos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-6 p-4 bg-green-50 rounded-md">
              <h3 className="font-semibold text-green-800 mb-2">Resumen de tu reserva:</h3>
              <p>
                <span className="font-medium">Cancha:</span> {reservationData.court}
              </p>
              {reservationData.courtDescription && (
                <p className="text-sm text-gray-600 ml-4 mb-1">
                  {reservationData.courtDescription}
                </p>
              )}
              <p>
                <span className="font-medium">Fecha:</span> {formattedDate}
              </p>
              <p>
                <span className="font-medium">Hora:</span> {reservationData.time}
              </p>
              {reservationData.price !== undefined && (
                <p className="mt-2 pt-2 border-t border-green-200">
                  <span className="font-medium">Precio:</span>{" "}
                  <span className="font-bold text-green-800">${reservationData.price}</span>
                </p>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre completo</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required />
              </div>

              <div className="flex justify-end pt-4">
                <Button type="submit" className="bg-green-700 hover:bg-green-800" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    "Confirmar Reserva"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
