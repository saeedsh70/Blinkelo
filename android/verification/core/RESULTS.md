# Protocol regression checks

Run `verification/core/run.ps1` from PowerShell. It uses `JAVA_HOME` when configured, otherwise Android Studio's bundled JDK. No dependencies or Android device are required. The TCP tests use localhost without sending discovery broadcasts; a permission policy that blocks local sockets must allow the JVM test process.

Result on 2026-11-10: **49 Core checks + 13 security/policy checks passed**. These cover private-key proof, RSA-OAEP session exchange, AES-GCM frame tamper rejection, replay rejection, explicit selected-PC policy and safe disconnection. Unpaired/stalled Bluetooth payload cleanup is also covered.

Coverage:

- Discovery invoked from a UI-like caller runs both interface enumeration and UDP sending on an IO worker, returns while a simulated send is blocked, and preserves the actual identity/listening port. The new test failed on the previous synchronous implementation with a simulated Android main-thread network-policy exception, then passed after the fix. This is a thread-behavior regression, not a test on an Android device.

- Actual Core-to-Core TLS v8 handshake, matching verification code, explicit pairing, persisted trust reconnect, UTF-8 packets, rejection of a changed paired certificate.
- Pairing derives its verification code and trusted certificate from the requesting transport. Another transport cannot replace an already connected peer with a different certificate.
- Actual binary and zero-byte LAN file transfer, completion callbacks, and an attempted outgoing payload connection using a third certificate: no file bytes disclosed.
- Bluetooth exact payload sizes, empty files, invalid base64, early final chunks, oversized chunks, sequence order, 150 MiB size limit, bounded concurrent transfer state, partial-file replacement, consumed cache deletion, active/queued send cancellation with exactly one failure callback.
- Bluetooth authentication: fresh signatures bind both nonces, identities and certificate fingerprints. Copying a public certificate or replaying an old proof cannot reuse LAN trust. The old address-only helper and its tests have been removed.
- Lifecycle: temporary stop preserves reusable workers, permanent idempotent close terminates all worker executors and cancels delayed tasks, closed instances cannot restart, and late Bluetooth transports are closed without scheduling work.

These are desktop JVM protocol tests. They do not verify radio interoperability or Android permissions/service behavior on a phone. Bluetooth now proves possession of the paired private key and encrypts application frames. Both Android 1.0.3 and Windows 1.4.1 must be upgraded together. The implementation-2026-11-10/bt-interop.cjs check verifies four cross-language cases: LAN trust over authenticated Bluetooth, an empty payload and encrypted multi-chunk payloads in both directions over process pipes, without a radio.
