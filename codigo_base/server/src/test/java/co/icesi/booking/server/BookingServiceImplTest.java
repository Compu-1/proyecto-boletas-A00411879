package co.icesi.booking.server;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;

import java.util.concurrent.atomic.AtomicLong;

import org.junit.Before;
import org.junit.Test;

import BookingApp.LockResult;
import BookingApp.Seat;
import BookingApp.SeatState;

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
}
