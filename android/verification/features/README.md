# Planner and timer regression tests

2026-11-10: **19 checks passed**, including distinct notifications for colliding timer IDs, persistent offline cancellation and exactly one alert for remote completion. Notification doubles count/tag calls; Android PendingIntent identity and actual delivery still require device validation.

Run `verification/features/run-tests.ps1` from PowerShell with a JDK installed (the script uses Android Studio's JDK by default).

The harness compiles the production `Tasks`, `Timers`, `UiBus`, `Json`, and `Packet` classes. Small Android API doubles provide storage, notification counting, and inert alarm scheduling. It checks task deletion durability across reload, selected-day cleanup, strict date/time parsing, timer alarm and cancel handling after recreation, repeated alarms, duration overflow, and malformed timer state.

These are JVM logic tests. They do not establish delivery timing in Doze, notification display, Bluetooth, URI grants, actual file sharing, or behavior on a physical Android device.
