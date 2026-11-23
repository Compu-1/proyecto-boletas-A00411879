package co.icesi.booking.server;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;

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

import BookingApp.LockResult;
import BookingApp.Seat;
import BookingApp.SeatNotAvailableException;
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
                    assertTrue(((SeatNotAvailableException) result).reason
                            .startsWith("La silla A-1 ya no se encuentra disponible"));
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
}
