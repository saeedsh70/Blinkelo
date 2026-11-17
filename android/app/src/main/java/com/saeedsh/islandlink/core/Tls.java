package com.saeedsh.islandlink.core;

import java.io.IOException;
import java.net.Socket;
import java.security.Principal;
import java.security.PrivateKey;
import java.security.cert.CertificateException;
import java.security.cert.X509Certificate;
import java.util.ArrayList;
import java.util.List;

import javax.net.ssl.KeyManager;
import javax.net.ssl.SSLContext;
import javax.net.ssl.SSLEngine;
import javax.net.ssl.SSLSocket;
import javax.net.ssl.SSLSocketFactory;
import javax.net.ssl.TrustManager;
import javax.net.ssl.X509ExtendedKeyManager;
import javax.net.ssl.X509ExtendedTrustManager;

/**
 * TLS with our self-signed identity. Peers are not verified by a CA: after the handshake the
 * caller pins the peer certificate's SHA-256 (trust-on-first-pair, like KDE Connect).
 */
public final class Tls {
    private final SSLContext ctx;

    public Tls(Certs.Identity id) throws Exception {
        ctx = SSLContext.getInstance("TLS");
        ctx.init(new KeyManager[] {new OwnKeyManager(id)}, new TrustManager[] {new AcceptAll()}, null);
    }

    /** Wraps an already connected plain socket. {@code server} = we take the TLS server role. */
    public SSLSocket wrap(Socket plain, boolean server) throws IOException {
        SSLSocketFactory f = ctx.getSocketFactory();
        String host = plain.getInetAddress() != null ? plain.getInetAddress().getHostAddress() : "peer";
        SSLSocket s = (SSLSocket) f.createSocket(plain, host, plain.getPort(), true);
        s.setUseClientMode(!server);
        if (server) s.setNeedClientAuth(true);
        enableModernProtocols(s);
        s.setSoTimeout(12000);
        try {
            s.startHandshake();
            s.setSoTimeout(0);
            return s;
        } catch (IOException e) {
            try { s.close(); } catch (IOException ignored) { /* ignore */ }
            throw e;
        }
    }

    /** Payload sockets must authenticate the same certificate as the paired control link. */
    public static void requirePeer(SSLSocket s, String fingerprint) throws IOException {
        X509Certificate cert = peerCert(s);
        try {
            if (cert != null && fingerprint != null && !fingerprint.isEmpty()
                    && fingerprint.equals(Certs.sha256Hex(cert.getEncoded()))) return;
        } catch (Exception ignored) { /* reject invalid certificates */ }
        try { s.close(); } catch (IOException ignored) { /* ignore */ }
        throw new IOException("payload peer certificate mismatch");
    }

    private static void enableModernProtocols(SSLSocket s) {
        List<String> want = new ArrayList<String>();
        for (String p : s.getSupportedProtocols()) {
            if ("TLSv1.2".equals(p) || "TLSv1.3".equals(p)) want.add(p);
        }
        if (!want.isEmpty()) s.setEnabledProtocols(want.toArray(new String[0]));
    }

    public static X509Certificate peerCert(SSLSocket s) {
        try {
            java.security.cert.Certificate[] chain = s.getSession().getPeerCertificates();
            if (chain != null && chain.length > 0 && chain[0] instanceof X509Certificate) return (X509Certificate) chain[0];
        } catch (Exception ignored) { /* none */ }
        return null;
    }

    public static String commonName(X509Certificate c) {
        if (c == null) return "";
        String dn = c.getSubjectX500Principal().getName();
        for (String part : dn.split(",")) {
            String t = part.trim();
            if (t.startsWith("CN=")) return t.substring(3);
        }
        return "";
    }

    // ------------------------------------------------------------------ managers
    private static final class OwnKeyManager extends X509ExtendedKeyManager {
        private static final String ALIAS = "island";
        private final Certs.Identity id;
        OwnKeyManager(Certs.Identity id) { this.id = id; }

        @Override public String[] getClientAliases(String keyType, Principal[] issuers) { return new String[] {ALIAS}; }
        @Override public String chooseClientAlias(String[] keyType, Principal[] issuers, Socket socket) { return ALIAS; }
        @Override public String[] getServerAliases(String keyType, Principal[] issuers) { return new String[] {ALIAS}; }
        @Override public String chooseServerAlias(String keyType, Principal[] issuers, Socket socket) { return ALIAS; }
        @Override public String chooseEngineClientAlias(String[] keyType, Principal[] issuers, SSLEngine engine) { return ALIAS; }
        @Override public String chooseEngineServerAlias(String keyType, Principal[] issuers, SSLEngine engine) { return ALIAS; }
        @Override public X509Certificate[] getCertificateChain(String alias) { return new X509Certificate[] {id.cert}; }
        @Override public PrivateKey getPrivateKey(String alias) { return id.key; }
    }

    private static final class AcceptAll extends X509ExtendedTrustManager {
        @Override public void checkClientTrusted(X509Certificate[] chain, String authType) throws CertificateException { requireOne(chain); }
        @Override public void checkServerTrusted(X509Certificate[] chain, String authType) throws CertificateException { requireOne(chain); }
        @Override public void checkClientTrusted(X509Certificate[] chain, String authType, Socket socket) throws CertificateException { requireOne(chain); }
        @Override public void checkServerTrusted(X509Certificate[] chain, String authType, Socket socket) throws CertificateException { requireOne(chain); }
        @Override public void checkClientTrusted(X509Certificate[] chain, String authType, SSLEngine engine) throws CertificateException { requireOne(chain); }
        @Override public void checkServerTrusted(X509Certificate[] chain, String authType, SSLEngine engine) throws CertificateException { requireOne(chain); }
        @Override public X509Certificate[] getAcceptedIssuers() { return new X509Certificate[0]; }

        private static void requireOne(X509Certificate[] chain) throws CertificateException {
            if (chain == null || chain.length == 0) throw new CertificateException("no certificate");
        }
    }
}
