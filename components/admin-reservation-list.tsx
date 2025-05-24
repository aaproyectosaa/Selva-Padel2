"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updateReservationStatus, deleteReservation } from "@/lib/reservation-service"
import { Search, Loader2, AlertCircle, Trash2, Info, User } from "lucide-react"
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface AdminReservationListProps {
  reservations: any[]
  onReservationUpdated: () => void
}

export default function AdminReservationList({ reservations, onReservationUpdated }: AdminReservationListProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [filter, setFilter] = useState("all")
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [openClientDialog, setOpenClientDialog] = useState<string | null>(null)

  const filteredReservations = reservations
    .filter((res) => {
      if (filter === "all") return true
      return res.status === filter
    })
    .filter((res) => {
      if (!searchTerm) return true
      const searchLower = searchTerm.toLowerCase()
      return (
        res.name?.toLowerCase().includes(searchLower) ||
        res.email?.toLowerCase().includes(searchLower) ||
        res.id?.toLowerCase().includes(searchLower) ||
        res.court?.toLowerCase().includes(searchLower)
      )
    })

  const handleStatusChange = async (id: string, newStatus: string) => {
    setUpdatingId(id)
    try {
      await updateReservationStatus(id, newStatus)
      onReservationUpdated()
      setError(null)
    } catch (error: any) {
      console.error("Error updating reservation status:", error)
      setError(error.message || "Error al actualizar el estado de la reserva")
    } finally {
      setUpdatingId(null)
      setConfirmCancelId(null)
    }
  }

  const handleDeleteReservation = async (id: string) => {
    setUpdatingId(id)
    try {
      await deleteReservation(id)
      onReservationUpdated()
      setError(null)
    } catch (error: any) {
      console.error("Error deleting reservation:", error)
      setError(error.message || "Error al eliminar la reserva")
    } finally {
      setUpdatingId(null)
      setConfirmDeleteId(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Completado</Badge>
      case "cancelled":
        return <Badge className="bg-red-100 text-red-800">Cancelado</Badge>
      default:
        return <Badge className="bg-yellow-100 text-yellow-800">Pendiente</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex items-start">
          <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}
      
      <div className="flex flex-col md:flex-row gap-4 md:items-end">
        <div className="flex-1 space-y-2">
          <Label htmlFor="search">Buscar reservas</Label>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              id="search"
              placeholder="Buscar por nombre, email o ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        <div className="flex space-x-2">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            onClick={() => setFilter("all")}
            className={filter === "all" ? "bg-green-700" : ""}
          >
            Todos
          </Button>
          <Button
            variant={filter === "pending" ? "default" : "outline"}
            onClick={() => setFilter("pending")}
            className={filter === "pending" ? "bg-yellow-600" : ""}
          >
            Pendientes
          </Button>
          <Button
            variant={filter === "completed" ? "default" : "outline"}
            onClick={() => setFilter("completed")}
            className={filter === "completed" ? "bg-green-700" : ""}
          >
            Completados
          </Button>
          <Button
            variant={filter === "cancelled" ? "default" : "outline"}
            onClick={() => setFilter("cancelled")}
            className={filter === "cancelled" ? "bg-red-600" : ""}
          >
            Cancelados
          </Button>
        </div>
      </div>

      {filteredReservations.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No se encontraron reservas</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-green-50">
                <th className="px-4 py-2 text-left">ID</th>
                <th className="px-4 py-2 text-left">Nombre</th>
                <th className="px-4 py-2 text-left">Cancha</th>
                <th className="px-4 py-2 text-left">Detalles</th>
                <th className="px-4 py-2 text-left">Cliente</th>
                <th className="px-4 py-2 text-left">Fecha</th>
                <th className="px-4 py-2 text-left">Hora</th>
                <th className="px-4 py-2 text-left">Precio</th>
                <th className="px-4 py-2 text-left">Estado</th>
                <th className="px-4 py-2 text-left">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredReservations.map((reservation) => {
                const date = new Date(reservation.date)
                const formattedDate = date.toLocaleDateString("es-ES")
                const isUpdating = updatingId === reservation.id

                return (
                  <tr key={reservation.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3">{reservation.id.substring(0, 8)}...</td>
                    <td className="px-4 py-3">{reservation.name}</td>
                    <td className="px-4 py-3">{reservation.court}</td>
                    <td className="px-4 py-3">
                      {reservation.courtDescription ? (
                        <TooltipProvider delayDuration={100}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button className="flex items-center text-blue-600 text-sm">
                                <Info className="h-4 w-4 mr-1" />
                                Ver detalles
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="font-medium">{reservation.courtDescription}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Dialog open={openClientDialog === reservation.id} onOpenChange={(open) => {
                        setOpenClientDialog(open ? reservation.id : null);
                      }}>
                        <DialogTrigger asChild>
                          <button className="flex items-center text-green-600 text-sm">
                            <User className="h-4 w-4 mr-1" />
                            Ver cliente
                          </button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle>Datos del cliente</DialogTitle>
                            <DialogDescription>
                              Información de contacto del cliente que realizó la reserva
                            </DialogDescription>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label className="text-right font-bold">Nombre:</Label>
                              <div className="col-span-3">{reservation.name}</div>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label className="text-right font-bold">Email:</Label>
                              <div className="col-span-3">{reservation.email}</div>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label className="text-right font-bold">Teléfono:</Label>
                              <div className="col-span-3">{reservation.phone || "No proporcionado"}</div>
                            </div>
                            {reservation.comments && (
                              <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right font-bold">Comentarios:</Label>
                                <div className="col-span-3">{reservation.comments}</div>
                              </div>
                            )}
                            {reservation.dni && (
                              <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right font-bold">DNI:</Label>
                                <div className="col-span-3">{reservation.dni}</div>
                              </div>
                            )}
                          </div>
                          <DialogFooter>
                            <Button 
                              type="button" 
                              variant="secondary" 
                              className="w-full"
                              onClick={() => setOpenClientDialog(null)}
                            >
                              Cerrar
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </td>
                    <td className="px-4 py-3">{formattedDate}</td>
                    <td className="px-4 py-3">{reservation.time}</td>
                    <td className="px-4 py-3">
                      {reservation.price ? (
                        <span className="font-medium">${reservation.price}</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(reservation.status)}
                    </td>
                    <td className="px-4 py-3">
                      {isUpdating ? (
                        <Button size="sm" disabled className="bg-gray-300">
                          <Loader2 className="h-4 w-4 animate-spin mr-1" />
                          Actualizando
                        </Button>
                      ) : (
                        <div className="flex space-x-2">
                          {reservation.status === "pending" && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleStatusChange(reservation.id, "completed")}
                                className="bg-green-700 hover:bg-green-800"
                              >
                                Completar
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                  >
                                    Cancelar
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>¿Deseas cancelar esta reserva?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Esta acción liberará el horario para que otros usuarios puedan reservar.
                                      La cancelación no se puede deshacer.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Volver</AlertDialogCancel>
                                    <AlertDialogAction 
                                      onClick={() => handleStatusChange(reservation.id, "cancelled")}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Cancelar Reserva
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </>
                          )}
                          {reservation.status === "completed" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStatusChange(reservation.id, "pending")}
                            >
                              Marcar Pendiente
                            </Button>
                          )}
                          {reservation.status === "cancelled" && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleStatusChange(reservation.id, "pending")}
                              >
                                Reactivar
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>¿Eliminar esta reserva?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Esta acción eliminará permanentemente la reserva y no podrá recuperarse.
                                      Solo se pueden eliminar reservas que estén canceladas.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction 
                                      onClick={() => handleDeleteReservation(reservation.id)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Eliminar
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
