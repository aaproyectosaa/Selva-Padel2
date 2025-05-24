"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getAllReservations } from "@/lib/reservation-service"
import AdminReservationList from "@/components/admin-reservation-list"
import AdminQrScanner from "@/components/admin-qr-scanner"
import AdminAvailability from "@/components/admin-availability"
import { Loader2 } from "lucide-react"
import { onAuthStateChanged, signOut } from "firebase/auth"
import { auth } from "@/lib/firebase"

export default function AdminDashboardPage() {
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)
  const [isAuthChecking, setIsAuthChecking] = useState(true)
  const [reservations, setReservations] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if admin is logged in
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.email === "admin@admin.com") {
        setIsAdmin(true)
        loadReservations()
      } else {
        router.push("/admin/login")
      }
      setIsAuthChecking(false)
    })

    return () => unsubscribe()
  }, [router])

  const loadReservations = async () => {
    setIsLoading(true)
    try {
      const allReservations = await getAllReservations()
      setReservations(allReservations)
    } catch (error) {
      console.error("Error loading reservations:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await signOut(auth)
      router.push("/")
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  if (isAuthChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin text-green-700" />
          <p className="mt-4 text-green-800">Verificando acceso...</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-600">No tienes permisos para acceder a esta página.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-green-100">
      <header className="bg-white shadow-md">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-green-700">Panel de Administración</h1>
          <Button variant="outline" onClick={handleLogout} className="text-red-600 border-red-600">
            Cerrar Sesión
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-green-800">Gestión de Reservas</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="reservations">
              <TabsList className="grid grid-cols-3 mb-8">
                <TabsTrigger value="reservations">Reservas</TabsTrigger>
                <TabsTrigger value="scanner">Escanear QR</TabsTrigger>
                <TabsTrigger value="availability">Disponibilidad</TabsTrigger>
              </TabsList>

              <TabsContent value="reservations">
                {isLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-green-700" />
                  </div>
                ) : (
                  <AdminReservationList reservations={reservations} onReservationUpdated={loadReservations} />
                )}
              </TabsContent>

              <TabsContent value="scanner">
                <AdminQrScanner onReservationUpdated={loadReservations} />
              </TabsContent>

              <TabsContent value="availability">
                <AdminAvailability />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
