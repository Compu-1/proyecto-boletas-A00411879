package co.icesi.booking.server;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotSame;
import static org.junit.Assert.assertTrue;
import static org.junit.Assert.fail;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.atomic.AtomicLong;

import org.junit.Before;
import org.junit.Test;

import BookingApp.BookingException;
import BookingApp.BookingRecord;
import BookingApp.BookingResult;
import BookingApp.EventInfo;
import BookingApp.LockResult;
import BookingApp.Seat;
import BookingApp.SeatNotAvailableException;
import BookingApp.SeatState;
import BookingApp.SeatZone;

public class BookingServiceImplTest {

    private static final long LOCK_MILLIS = 90_000L;

    // Reloj falso: las pruebas adelantan el tiempo sin esperar
    private AtomicLong now;
    private BookingServiceImpl service;

    @Before
    public void setUp() {
        now = new AtomicLong(1_000_000L);
        service = new BookingServiceImpl(now::get);
    }

    // Suelta todas las tareas a la vez (latch) y devuelve cada resultado o la excepción que lanzó
    private List<Object> runAtOnce(List<Callable<Object>> tasks) throws Exception {
        ExecutorService pool = Executors.newFixedThreadPool(tasks.size());
        CountDownLatch ready = new CountDownLatch(tasks.size());
        CountDownLatch go = new CountDownLatch(1);
        List<Future<Object>> futures = new ArrayList<>();
        for (Callable<Object> task : tasks) {
            futures.add(pool.submit(() -> {
                ready.countDown();
                go.await();
                try {
                    return task.call();
                } catch (Exception e) {
                    return e;
                }
            }));
        }
        ready.await();
        go.countDown();
        List<Object> results = new ArrayList<>();
        for (Future<Object> future : futures) {
            results.add(future.get());
        }
        pool.shutdown();
        return results;
    }

    // HU-01: Retener una silla disponible
    @Test
    public void hu01_retenerDisponible() throws Exception {
        LockResult result = service.lockSeat("A-1", "Ana", null);

        assertTrue(result.success);
        assertEquals(now.get() + LOCK_MILLIS, result.expiresAt);
        Seat seenByOthers = service.getSeat("A-1", null);
        assertEquals(SeatState.LOCKED, seenByOthers.state);
        assertEquals("Ana", seenByOthers.lockedByClientId);
    }

    // HU-07: Elegir una silla vendida muestra el mensaje del spec
    @Test
    public void hu07_sillaVendida_mensaje() throws Exception {
        service.lockSeat("B-3", "Ana", null);
        pay("Ana", "B-3");

        try {
            service.lockSeat("B-3", "Beto", null);
            fail("Debía rechazar la silla vendida");
        } catch (SeatNotAvailableException e) {
            assertEquals("La silla B-3 ya no está disponible", e.reason);
        }
        assertEquals(SeatState.BOOKED, service.getSeat("B-3", null).state);
    }

    // HU-01: Renovar la retención de una silla propia
    @Test
    public void hu01_renovar() throws Exception {
        service.lockSeat("A-1", "Ana", null);
        now.addAndGet(60_000L);

        LockResult renewed = service.lockSeat("A-1", "Ana", null);

        assertEquals(now.get() + LOCK_MILLIS, renewed.expiresAt);
    }

    // HU-03: Otro comprador retiene la silla vencida (justo a los 90 s)
    @Test
    public void hu03_otroRetieneVencida() throws Exception {
        service.lockSeat("A-1", "Ana", null);
        now.addAndGet(LOCK_MILLIS);

        LockResult result = service.lockSeat("A-1", "Beto", null);

        assertTrue(result.success);
        assertEquals("Beto", service.getSeat("A-1", null).lockedByClientId);
    }

    // HU-10: Quitar una silla propia la libera de inmediato y otro comprador puede retenerla
    @Test
    public void hu10_quitarPropia_otroLaRetiene() throws Exception {
        service.lockSeat("A-1", "Ana", null);

        assertTrue(service.releaseSeat("A-1", "Ana", null));

        assertEquals(SeatState.AVAILABLE, service.getSeat("A-1", null).state);
        assertTrue(service.lockSeat("A-1", "Beto", null).success);
        assertEquals("Beto", service.getSeat("A-1", null).lockedByClientId);
    }

    // HU-10: Quitar una silla que ya venció y tomó otro comprador no se la quita al nuevo dueño
    @Test
    public void hu10_quitarVencidaYaTomada_noLibera() throws Exception {
        service.lockSeat("A-1", "Ana", null);
        now.addAndGet(LOCK_MILLIS);
        service.lockSeat("A-1", "Beto", null);

        assertEquals(false, service.releaseSeat("A-1", "Ana", null));

        Seat seat = service.getSeat("A-1", null);
        assertEquals(SeatState.LOCKED, seat.state);
        assertEquals("Beto", seat.lockedByClientId);
    }

    // HU-01: Varios compradores eligen la misma silla en el mismo instante (2, 10 y 50)
    @Test
    public void hu01_mismaSillaMismoInstante_ganaUno() throws Exception {
        for (int buyers : new int[] {2, 10, 50}) {
            service.resetSeats(null);
            List<Callable<Object>> tasks = new ArrayList<>();
            for (int i = 0; i < buyers; i++) {
                String clientId = "comprador-" + i;
                tasks.add(() -> service.lockSeat("A-1", clientId, null));
            }

            List<Object> results = runAtOnce(tasks);

            int winners = 0;
            int rejected = 0;
            for (Object result : results) {
                if (result instanceof LockResult) {
                    winners++;
                } else if (result instanceof SeatNotAvailableException) {
                    assertEquals("La silla A-1 ya no está disponible", ((SeatNotAvailableException) result).reason);
                    rejected++;
                }
            }
            assertEquals("ganadores con " + buyers + " compradores", 1, winners);
            assertEquals("rechazados con " + buyers + " compradores", buyers - 1, rejected);
        }
    }

    // HU-01: Compradores eligen sillas distintas en el mismo instante
    @Test
    public void hu01_sillasDistintas_todosGanan() throws Exception {
        List<Callable<Object>> tasks = new ArrayList<>();
        for (int i = 1; i <= 10; i++) {
            String seatId = "C-" + i;
            String clientId = "comprador-" + i;
            tasks.add(() -> service.lockSeat(seatId, clientId, null));
        }

        List<Object> results = runAtOnce(tasks);

        for (Object result : results) {
            assertTrue("se esperaba éxito y llegó: " + result, result instanceof LockResult);
        }
        assertEquals(80, service.getEventInfo(null).availableSeats);
        assertEquals(10, service.getEventInfo(null).lockedSeats);
        assertEquals(0, service.getEventInfo(null).bookedSeats);
    }

    // Suma de sillas por estado en una lista; cada silla cuenta una sola vez (RN-07)
    private int countByState(Seat[] seats, SeatState state) {
        int count = 0;
        for (Seat seat : seats) {
            if (seat.state == state) {
                count++;
            }
        }
        return count;
    }

    private Seat find(Seat[] seats, String seatId) {
        for (Seat seat : seats) {
            if (seat.id.equals(seatId)) {
                return seat;
            }
        }
        throw new AssertionError("no aparece la silla " + seatId);
    }

    // HU-03: Estado de la silla a los 89 s (retenida) y a los 90 s (disponible) en toda consulta
    @Test
    public void hu03_estadoSegunTiempo() throws Exception {
        service.lockSeat("A-1", "Ana", null);

        now.addAndGet(89_000L);
        assertEquals(SeatState.LOCKED, service.getSeat("A-1", null).state);
        assertEquals(SeatState.LOCKED, find(service.getAllSeats(null), "A-1").state);
        EventInfo at89 = service.getEventInfo(null);
        assertEquals(89, at89.availableSeats);
        assertEquals(1, at89.lockedSeats);
        assertEquals(0, at89.bookedSeats);

        now.addAndGet(1_000L);
        Seat at90 = service.getSeat("A-1", null);
        assertEquals(SeatState.AVAILABLE, at90.state);
        assertEquals("", at90.lockedByClientId);
        assertEquals(0L, at90.lockTimestamp);
        Seat[] all = service.getAllSeats(null);
        assertEquals(SeatState.AVAILABLE, find(all, "A-1").state);
        assertEquals(90, countByState(all, SeatState.AVAILABLE));
        assertEquals(SeatState.AVAILABLE, find(service.getSeatsByZone(SeatZone.ZONEVIP, null), "A-1").state);
        EventInfo at90Info = service.getEventInfo(null);
        assertEquals(90, at90Info.availableSeats);
        assertEquals(0, at90Info.lockedSeats);
        assertEquals(0, at90Info.bookedSeats);
    }

    // HU-03: El comprador original pierde la silla vencida
    @Test
    public void hu03_originalPierde() throws Exception {
        service.lockSeat("A-1", "Ana", null);
        assertEquals(1, service.getMyLockedSeats("Ana", null).length);

        now.addAndGet(LOCK_MILLIS);

        assertEquals(0, service.getMyLockedSeats("Ana", null).length);
    }

    // D3 (RN-07): cada consulta devuelve una foto propia, no las instancias internas
    @Test
    public void hu03_consultasDevuelvenCopias() throws Exception {
        service.lockSeat("A-1", "Ana", null);

        assertNotSame(service.getSeat("A-1", null), service.getSeat("A-1", null));
        assertNotSame(find(service.getAllSeats(null), "A-1"), find(service.getAllSeats(null), "A-1"));
        assertNotSame(find(service.getSeatsByZone(SeatZone.ZONEVIP, null), "A-1"),
                find(service.getSeatsByZone(SeatZone.ZONEVIP, null), "A-1"));
        assertNotSame(service.getMyLockedSeats("Ana", null)[0], service.getMyLockedSeats("Ana", null)[0]);
        assertNotSame(service.getEventInfo(null), service.getEventInfo(null));

        service.confirmBooking(new String[] {"A-1"}, "Ana", "Ana Pérez", "ana@correo.com", null);
        BookingRecord first = service.getMyBookings("Ana", null)[0];
        first.totalAmount = 1.0;
        assertEquals(120000.0, service.getMyBookings("Ana", null)[0].totalAmount, 0.0);
    }

    private BookingResult pay(String clientId, String... seatIds) throws Exception {
        return service.confirmBooking(seatIds, clientId, clientId + " Prueba", clientId.toLowerCase() + "@correo.com", null);
    }

    // HU-02: Pagar sillas retenidas y vigentes
    @Test
    public void hu02_pagarVigentes() throws Exception {
        service.lockSeat("A-1", "Ana", null);
        service.lockSeat("A-2", "Ana", null);
        now.addAndGet(30_000L);

        BookingResult result = pay("Ana", "A-1", "A-2");

        assertTrue(result.success);
        assertTrue(result.bookingCode, result.bookingCode.matches("RES-[0-9A-F]{8}"));
        assertEquals(240000.0, result.totalAmount, 0.0);
        assertEquals(SeatState.BOOKED, service.getSeat("A-1", null).state);
        assertEquals(SeatState.BOOKED, service.getSeat("A-2", null).state);
        assertEquals(1, service.getMyBookings("Ana", null).length);
    }

    // HU-02: Ana envía dos veces el mismo pago en el mismo instante
    @Test
    public void hu02_pagoDobleSimultaneo() throws Exception {
        service.lockSeat("A-1", "Ana", null);
        service.lockSeat("A-2", "Ana", null);
        List<Callable<Object>> tasks = new ArrayList<>();
        for (int i = 0; i < 2; i++) {
            tasks.add(() -> pay("Ana", "A-1", "A-2"));
        }

        List<Object> results = runAtOnce(tasks);

        int paid = 0;
        int rejected = 0;
        for (Object result : results) {
            if (result instanceof BookingResult) {
                paid++;
            } else if (result instanceof BookingException) {
                assertTrue(((BookingException) result).reason.startsWith("La silla A-1 ya fue vendida definitivamente"));
                rejected++;
            }
        }
        assertEquals(1, paid);
        assertEquals(1, rejected);
        assertEquals(1, service.getMyBookings("Ana", null).length);
    }

    // HU-02: Ana y Beto pagan la misma silla en el mismo instante
    @Test
    public void hu02_dosCompradoresMismaSilla() throws Exception {
        service.lockSeat("A-1", "Ana", null);
        List<Callable<Object>> tasks = new ArrayList<>();
        tasks.add(() -> pay("Ana", "A-1"));
        tasks.add(() -> pay("Beto", "A-1"));

        List<Object> results = runAtOnce(tasks);

        assertTrue("Ana debía recibir código: " + results.get(0), results.get(0) instanceof BookingResult);
        assertTrue("Beto no debía recibir código: " + results.get(1), results.get(1) instanceof BookingException);
        assertEquals(0, service.getMyBookings("Beto", null).length);
        assertEquals(1, service.getMyBookings("Ana", null).length);
        Seat sold = service.getSeat("A-1", null);
        assertEquals(SeatState.BOOKED, sold.state);
        assertEquals("Ana", sold.lockedByClientId);
    }

    // HU-02: El pago se rechaza completo si una silla no es válida (casos del spec y vencida de otro)
    @Test
    public void hu02_sillaInvalida_noVendeNinguna() throws Exception {
        String[][] cases = {
            {"disponible", "La silla C-5 no está retenida a tu nombre"},
            {"retenidaPorBeto", "La silla C-5 se encuentra bloqueada por otro comprador"},
            {"vendida", "La silla C-5 ya fue vendida definitivamente"},
            {"retenidaPorAnaVencida", "El bloqueo temporal de la silla C-5 ha expirado"},
            {"retenidaPorBetoVencida", "La silla C-5 no está retenida a tu nombre"},
        };
        for (String[] row : cases) {
            service.resetSeats(null);
            int booked = 0;
            switch (row[0]) {
                case "retenidaPorBeto":
                    service.lockSeat("C-5", "Beto", null);
                    break;
                case "vendida":
                    service.lockSeat("C-5", "Beto", null);
                    pay("Beto", "C-5");
                    booked = 1;
                    break;
                case "retenidaPorAnaVencida":
                    service.lockSeat("C-5", "Ana", null);
                    now.addAndGet(60_000L);
                    break;
                case "retenidaPorBetoVencida":
                    service.lockSeat("C-5", "Beto", null);
                    now.addAndGet(60_000L);
                    break;
                default:
                    break;
            }
            service.lockSeat("A-1", "Ana", null);
            now.addAndGet(30_000L);

            try {
                pay("Ana", "A-1", "C-5");
                fail(row[0] + ": el pago debía rechazarse");
            } catch (BookingException e) {
                assertTrue(row[0] + ": " + e.reason, e.reason.startsWith(row[1]));
            }

            assertEquals(row[0], 0, service.getMyBookings("Ana", null).length);
            Seat a1 = service.getSeat("A-1", null);
            assertEquals(row[0], SeatState.LOCKED, a1.state);
            assertEquals(row[0], "Ana", a1.lockedByClientId);
            assertEquals(row[0], booked, countByState(service.getAllSeats(null), SeatState.BOOKED));
        }
    }
}
