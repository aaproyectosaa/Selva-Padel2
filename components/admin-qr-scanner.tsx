"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { updateReservationStatus, getReservationById } from "@/lib/reservation-service"
import { CheckCircle2, AlertCircle, Camera, CameraOff, Loader2 } from "lucide-react"

interface AdminQrScannerProps {
  onReservationUpdated: () => void
}

export default function AdminQrScanner({ onReservationUpdated }: AdminQrScannerProps) {
  const [scanning, setScanning] = useState(false)
  const [scanResult, setScanResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    let videoElement: HTMLVideoElement | null = null
    let canvasElement: HTMLCanvasElement | null = null
    let stream: MediaStream | null = null
    let animationFrameId: number | null = null

    const startScanner = async () => {
      try {
        // Create video and canvas elements
        videoElement = document.createElement("video")
        canvasElement = document.createElement("canvas")
        const scannerContainer = document.getElementById("qr-scanner-container")

        if (!scannerContainer) return

        // Clear container
        scannerContainer.innerHTML = ""

        // Add video element to the DOM
        videoElement.style.width = "100%"
        videoElement.style.maxWidth = "400px"
        videoElement.style.height = "auto"
        scannerContainer.appendChild(videoElement)

        // Get user media
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        })

        videoElement.srcObject = stream
        videoElement.setAttribute("playsinline", "true") // required for iOS
        videoElement.play()

        // Set up canvas
        canvasElement.width = 400
        canvasElement.height = 300
        const context = canvasElement.getContext("2d")

        // Import QR code library dynamically
        const jsQR = (await import("jsqr")).default

        // Scan function
        const scan = () => {
          if (videoElement && videoElement.readyState === videoElement.HAVE_ENOUGH_DATA && context) {
            // Draw video frame to canvas
            context.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height)

            // Get image data
            const imageData = context.getImageData(0, 0, canvasElement.width, canvasElement.height)

            // Scan for QR code
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: "dontInvert",
            })

            if (code) {
              // QR code found
              try {
                const data = JSON.parse(code.data)

                // Process the scanned reservation
                processScannedReservation(data)

                // Stop scanning
                if (stream) {
                  stream.getTracks().forEach((track) => track.stop())
                }
                if (animationFrameId !== null) {
                  cancelAnimationFrame(animationFrameId)
                }
                setScanning(false)
                return
              } catch (e) {
                setError("QR inválido. No contiene datos de reserva.")
                // Continue scanning
                animationFrameId = requestAnimationFrame(scan)
              }
            } else {
              // Continue scanning
              animationFrameId = requestAnimationFrame(scan)
            }
          } else {
            // Wait for video to be ready
            animationFrameId = requestAnimationFrame(scan)
          }
        }

        // Start scanning
        scan()
      } catch (err) {
        console.error("Error accessing camera:", err)
        setError("No se pudo acceder a la cámara. Por favor, verifica los permisos.")
        setScanning(false)
      }
    }

    if (scanning) {
      startScanner()
    }

    return () => {
      // Clean up
      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
      }
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId)
      }
    }
  }, [scanning])

  const processScannedReservation = async (data: any) => {
    setIsProcessing(true)
    setError(null)
    setSuccess(null)

    try {
      // If we have an ID, fetch the latest reservation data
      if (data.id) {
        // Get the latest reservation data from Firebase
        const reservation = await getReservationById(data.id)
        setScanResult(reservation)

        // Update reservation status if it's pending
        if (reservation.status === "pending") {
          await updateReservationStatus(data.id, "completed")
          setSuccess(`Reserva ${data.id.substring(0, 8)}... completada con éxito`)
          onReservationUpdated()
        } else {
          setSuccess(`Reserva ${data.id.substring(0, 8)}... ya estaba completada`)
        }
      } else {
        setError("QR inválido. No contiene ID de reserva.")
      }
    } catch (err) {
      console.error("Error processing reservation:", err)
      setError("Error al procesar la reserva. Por favor, inténtalo de nuevo.")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleStartScan = () => {
    setScanResult(null)
    setError(null)
    setSuccess(null)
    setScanning(true)
  }

  const handleStopScan = () => {
    setScanning(false)
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-4">
        <h2 className="text-xl font-semibold text-green-800 mb-2">Escáner de Códigos QR</h2>
        <p className="text-gray-600">Escanea el código QR de una reserva para marcarla como completada</p>
      </div>

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

      <Card>
        <CardContent className="p-6">
          <div
            id="qr-scanner-container"
            className="flex justify-center mb-4 min-h-[300px] items-center bg-gray-100 rounded-md"
          >
            {!scanning && !scanResult && !isProcessing && (
              <div className="text-center text-gray-500">
                <Camera className="mx-auto h-12 w-12 mb-2" />
                <p>Haz clic en "Iniciar Escaneo" para activar la cámara</p>
              </div>
            )}

            {isProcessing && (
              <div className="text-center text-gray-500">
                <Loader2 className="mx-auto h-12 w-12 mb-2 animate-spin" />
                <p>Procesando QR...</p>
              </div>
            )}
          </div>

          <div className="flex justify-center space-x-4">
            {!scanning ? (
              <Button onClick={handleStartScan} className="bg-green-700 hover:bg-green-800" disabled={isProcessing}>
                <Camera className="mr-2 h-4 w-4" />
                Iniciar Escaneo
              </Button>
            ) : (
              <Button onClick={handleStopScan} variant="outline" className="border-red-600 text-red-600">
                <CameraOff className="mr-2 h-4 w-4" />
                Detener Escaneo
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {scanResult && (
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold text-green-800 mb-4">Resultado del Escaneo:</h3>
            <div className="space-y-2">
              <p>
                <span className="font-medium">ID de Reserva:</span> {scanResult.id}
              </p>
              <p>
                <span className="font-medium">Nombre:</span> {scanResult.name}
              </p>
              <p>
                <span className="font-medium">Email:</span> {scanResult.email}
              </p>
              <p>
                <span className="font-medium">Teléfono:</span> {scanResult.phone}
              </p>
              <p>
                <span className="font-medium">Cancha:</span> {scanResult.court}
              </p>
              <p>
                <span className="font-medium">Fecha:</span> {new Date(scanResult.date).toLocaleDateString("es-ES")}
              </p>
              <p>
                <span className="font-medium">Hora:</span> {scanResult.time}
              </p>
              <p>
                <span className="font-medium">Estado:</span>{" "}
                {scanResult.status === "completed" ? "Completado" : "Pendiente"}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
