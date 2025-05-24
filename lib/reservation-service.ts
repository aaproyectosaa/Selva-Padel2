import { ref, set, get, update, push } from "firebase/database"
import { database } from "./firebase"

// Definimos la interfaz para la cancha
export interface Court {
  id: string;
  name: string;
  description: string;
  dayPrice: number;
  nightPrice: number;
  imageUrl?: string; // URL de la imagen de la cancha
}

// Initialize Firebase with sample data if needed
export async function initializeFirebaseData() {
  try {
    // Check if courts exist
    const courtsSnapshot = await get(ref(database, "courts"))
    if (!courtsSnapshot.exists()) {
      // Initialize courts as an empty array if they don't exist
      await set(ref(database, "courts"), {})
    }

    // Check if time slots exist
    const timeSlotsSnapshot = await get(ref(database, "timeSlots"))
    if (!timeSlotsSnapshot.exists()) {
      // Initialize time slots as an empty array if they don't exist
      await set(ref(database, "timeSlots"), [])
    }

    // Check if availability exists
    const availabilitySnapshot = await get(ref(database, "availability"))
    if (!availabilitySnapshot.exists()) {
      // Create default availability structure for the next 30 days
      const today = new Date()
      // Use existing courts or an empty array if none exist
      const courts = courtsSnapshot.exists() ? Object.keys(courtsSnapshot.val() || {}) : []
      // Use existing time slots or an empty array if none exist
      const timeSlots = timeSlotsSnapshot.exists()
        ? timeSlotsSnapshot.val()
        : []

      const availability: Record<string, Record<string, string[]>> = {}

      for (let i = 0; i < 30; i++) {
        const date = new Date(today)
        date.setDate(today.getDate() + i)
        const dateString = date.toISOString().split("T")[0]

        availability[dateString] = {}

        // Initialize availability for existing courts with potentially empty time slots
        courts.forEach((court: string) => {
          availability[dateString][court] = [] // Initialize with empty time slots initially, admin will set them
        })
      }

      await set(ref(database, "availability"), availability)
    }
  } catch (error) {
    console.error("Error initializing Firebase data:", error)
    throw error
  }
}

// Get all available courts
export async function getAvailableCourts(): Promise<Court[]> {
  try {
    const snapshot = await get(ref(database, "courts"))
    if (snapshot.exists()) {
      const courtsData = snapshot.val();
      // Convertir el objeto a un array de objetos Court
      return Object.keys(courtsData).map(id => ({
        id,
        name: courtsData[id].name,
        description: courtsData[id].description || "",
        dayPrice: courtsData[id].dayPrice || 0,
        nightPrice: courtsData[id].nightPrice || 0,
        imageUrl: courtsData[id].imageUrl || ""
      }));
    }
    return []
  } catch (error) {
    console.error("Error getting courts:", error)
    return []
  }
}

// Get all available court names (for backward compatibility)
export async function getAvailableCourtNames(): Promise<string[]> {
  try {
    const courts = await getAvailableCourts();
    return courts.map(court => court.name);
  } catch (error) {
    console.error("Error getting court names:", error)
    return []
  }
}

// Add a new court
export async function addCourt(
  courtName: string, 
  description: string = "", 
  dayPrice: number = 0, 
  nightPrice: number = 0,
  imageUrl: string = ""
): Promise<void> {
  try {
    const snapshot = await get(ref(database, "courts"))
    const courts = snapshot.exists() ? snapshot.val() : {}

    // Verificar si ya existe una cancha con el mismo nombre
    const courtExists = Object.values(courts).some((court: any) => court.name === courtName)

    if (courtExists) {
      throw new Error("Esta cancha ya existe")
    }

    // Generar un ID único para la cancha
    const newCourtRef = push(ref(database, "courts"))
    const courtId = newCourtRef.key

    // Crear el objeto de la cancha
    const courtData = {
      name: courtName,
      description,
      dayPrice,
      nightPrice,
      imageUrl
    }

    // Guardar la cancha con su ID como clave
    await set(ref(database, `courts/${courtId}`), courtData)

    // Admin will manually set availability for the new court.
    // No automatic update to availability here.
  } catch (error) {
    console.error("Error adding court:", error)
    throw error
  }
}

// Remove a court
export async function removeCourt(courtId: string): Promise<void> {
  try {
    const snapshot = await get(ref(database, "courts"))
    if (!snapshot.exists()) {
      throw new Error("No hay canchas disponibles")
    }

    const courts = snapshot.val()

    if (!courts[courtId]) {
      throw new Error("Esta cancha no existe")
    }

    const courtName = courts[courtId].name

    // Eliminar la cancha
    const courtRef = ref(database, `courts/${courtId}`)
    await set(courtRef, null)

    // Update availability to remove the court
    const availabilitySnapshot = await get(ref(database, "availability"))
    if (availabilitySnapshot.exists()) {
      const availability = availabilitySnapshot.val()

      Object.keys(availability).forEach((dateString) => {
        if (availability[dateString][courtName]) {
          delete availability[dateString][courtName]
        }
      })

      await set(ref(database, "availability"), availability)
    }
  } catch (error) {
    console.error("Error removing court:", error)
    throw error
  }
}

// Update a court
export async function updateCourt(
  courtId: string, 
  courtName: string, 
  description: string, 
  dayPrice: number, 
  nightPrice: number,
  imageUrl: string = ""
): Promise<void> {
  try {
    const courtRef = ref(database, `courts/${courtId}`);
    const courtSnapshot = await get(courtRef);
    
    if (!courtSnapshot.exists()) {
      throw new Error("Esta cancha no existe");
    }
    
    const courtData = {
      name: courtName,
      description,
      dayPrice,
      nightPrice,
      imageUrl
    };
    
    await update(courtRef, courtData);
  } catch (error) {
    console.error("Error updating court:", error);
    throw error;
  }
}

// Add a new time slot
export async function addTimeSlot(timeSlot: string): Promise<void> {
  try {
    const snapshot = await get(ref(database, "timeSlots"))
    const timeSlots = snapshot.exists() ? snapshot.val() : []

    if (timeSlots.includes(timeSlot)) {
      throw new Error("Este horario ya existe")
    }

    timeSlots.push(timeSlot)
    await set(ref(database, "timeSlots"), timeSlots)

    // Admin will manually update availability to use the new time slot.
    // No automatic update to availability here.
  } catch (error) {
    console.error("Error adding time slot:", error)
    throw error
  }
}

// Remove a time slot
export async function removeTimeSlot(timeSlot: string): Promise<void> {
  try {
    const snapshot = await get(ref(database, "timeSlots"))
    if (!snapshot.exists()) {
      throw new Error("No hay horarios disponibles")
    }

    const timeSlots = snapshot.val()
    const index = timeSlots.indexOf(timeSlot)

    if (index === -1) {
      throw new Error("Este horario no existe")
    }

    timeSlots.splice(index, 1)
    await set(ref(database, "timeSlots"), timeSlots)

    // Update availability to remove the time slot
    const availabilitySnapshot = await get(ref(database, "availability"))
    if (availabilitySnapshot.exists()) {
      const availability = availabilitySnapshot.val()

      Object.keys(availability).forEach((dateString) => {
        Object.keys(availability[dateString]).forEach((court) => {
          const courtTimes = availability[dateString][court]
          const timeIndex = courtTimes.indexOf(timeSlot)

          if (timeIndex !== -1) {
            courtTimes.splice(timeIndex, 1)
          }
        })
      })

      await set(ref(database, "availability"), availability)
    }
  } catch (error) {
    console.error("Error removing time slot:", error)
    throw error
  }
}

// Get available times for a specific date and court
export async function getAvailableTimes(date: Date, court: string): Promise<string[]> {
  try {
    const dateString = date.toISOString().split("T")[0]

    // Obtenemos todos los horarios posibles
    const allTimeSlotsSnapshot = await get(ref(database, "timeSlots"))
    const allTimeSlots = allTimeSlotsSnapshot.exists() ? allTimeSlotsSnapshot.val() : []
    
    // Get availability for this date and court (excepciones configuradas)
    const availabilityPath = `availability/${dateString}/${court}`
    const availabilitySnapshot = await get(ref(database, availabilityPath))
    
    // Si no hay configuración específica para esta fecha y cancha,
    // consideramos que todos los horarios están disponibles
    let availableTimes = [...allTimeSlots]
    
    // Si hay una configuración específica, esa es la que define qué horarios están disponibles
    if (availabilitySnapshot.exists()) {
      availableTimes = availabilitySnapshot.val()
    }

    // Get all reservations for this date and court
    const reservationsSnapshot = await get(ref(database, "reservations"))
    if (!reservationsSnapshot.exists()) {
      return availableTimes
    }

    const reservations = reservationsSnapshot.val()
    const reservedTimes: string[] = []

    // Find reserved times - exclude cancelled reservations
    Object.values(reservations).forEach((res: any) => {
      const resDate = new Date(res.date)
      const resDateString = resDate.toISOString().split("T")[0]
      // Solo consideramos como reservados los horarios que no estén cancelados
      if (resDateString === dateString && res.court === court && res.status !== "cancelled") {
        reservedTimes.push(res.time)
      }
    })

    // Return available times (those not reserved)
    return availableTimes.filter((time: string) => !reservedTimes.includes(time))
  } catch (error) {
    console.error("Error getting available times:", error)
    return []
  }
}

// Set court availability for a specific date
export async function setCourtAvailability(date: Date, court: string, times: string[]): Promise<void> {
  try {
    const dateString = date.toISOString().split("T")[0]
    const availabilityPath = `availability/${dateString}/${court}`

    await set(ref(database, availabilityPath), times)
  } catch (error) {
    console.error("Error setting court availability:", error)
    throw error
  }
}

// Create a new reservation
export async function createReservation(reservation: any): Promise<string> {
  try {
    // Check if the time slot is already reserved
    const reservationsSnapshot = await get(ref(database, "reservations"))
    if (reservationsSnapshot.exists()) {
      const reservations = reservationsSnapshot.val()
      const newDate = new Date(reservation.date)
      const newDateString = newDate.toISOString().split("T")[0]

      const isTimeSlotReserved = Object.values(reservations).some((res: any) => {
        const resDate = new Date(res.date)
        const resDateString = resDate.toISOString().split("T")[0]

        return resDateString === newDateString && 
               res.court === reservation.court && 
               res.time === reservation.time && 
               res.status !== "cancelled"; // Ignorar reservas canceladas
      })

      if (isTimeSlotReserved) {
        throw new Error("Este horario ya está reservado")
      }
    }

    // Add the reservation
    const newReservationRef = push(ref(database, "reservations"))
    const reservationWithId = {
      ...reservation,
      id: newReservationRef.key,
      status: "pending",
    }

    await set(newReservationRef, reservationWithId)
    return newReservationRef.key as string
  } catch (error) {
    console.error("Error creating reservation:", error)
    throw error
  }
}

// Get all reservations
export async function getAllReservations(): Promise<any[]> {
  try {
    const snapshot = await get(ref(database, "reservations"))
    if (!snapshot.exists()) {
      return []
    }

    const reservations = snapshot.val()
    return Object.values(reservations)
  } catch (error) {
    console.error("Error getting reservations:", error)
    return []
  }
}

// Update reservation status
export async function updateReservationStatus(id: string, status: string): Promise<void> {
  try {
    const reservationRef = ref(database, `reservations/${id}`)
    const snapshot = await get(reservationRef)

    if (!snapshot.exists()) {
      throw new Error("Reserva no encontrada")
    }

    await update(reservationRef, { status })
  } catch (error) {
    console.error("Error updating reservation status:", error)
    throw error
  }
}

// Get a specific reservation by ID
export async function getReservationById(id: string): Promise<any> {
  try {
    const snapshot = await get(ref(database, `reservations/${id}`))
    if (!snapshot.exists()) {
      throw new Error("Reserva no encontrada")
    }

    return snapshot.val()
  } catch (error) {
    console.error("Error getting reservation:", error)
    throw error
  }
}

// Get all time slots
export async function getAllTimeSlots(): Promise<string[]> {
  try {
    const snapshot = await get(ref(database, "timeSlots"))
    if (!snapshot.exists()) {
      return []
    }

    return snapshot.val()
  } catch (error) {
    console.error("Error getting time slots:", error)
    return []
  }
}

// Delete a reservation
export async function deleteReservation(id: string): Promise<void> {
  try {
    const reservationRef = ref(database, `reservations/${id}`)
    const snapshot = await get(reservationRef)

    if (!snapshot.exists()) {
      throw new Error("Reserva no encontrada")
    }

    // Verificar que la reserva esté cancelada antes de permitir eliminarla
    const reservation = snapshot.val()
    if (reservation.status !== "cancelled") {
      throw new Error("Solo se pueden eliminar reservas canceladas")
    }

    // Eliminar la reserva
    await set(reservationRef, null)
  } catch (error) {
    console.error("Error deleting reservation:", error)
    throw error
  }
}
