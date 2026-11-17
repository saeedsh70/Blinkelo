package com.saeedsh.islandlink.core;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.math.BigInteger;
import java.nio.charset.Charset;
import java.security.KeyFactory;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.MessageDigest;
import java.security.PrivateKey;
import java.security.SecureRandom;
import java.security.Signature;
import java.security.cert.CertificateFactory;
import java.security.cert.X509Certificate;
import java.security.spec.PKCS8EncodedKeySpec;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;
import java.util.TimeZone;

/**
 * Self-signed certificate creation with a hand written DER encoder (no BouncyCastle needed),
 * plus the fingerprint / verification-key helpers the protocol uses.
 */
public final class Certs {
    private Certs() {}

    private static final Charset UTF8 = Charset.forName("UTF-8");

    public static final class Identity {
        public final PrivateKey key;
        public final X509Certificate cert;
        public final byte[] certDer;
        public Identity(PrivateKey key, X509Certificate cert) throws Exception {
            this.key = key;
            this.cert = cert;
            this.certDer = cert.getEncoded();
        }
    }

    // ------------------------------------------------------------------ creation
    public static Identity create(String deviceId) throws Exception {
        KeyPairGenerator kpg = KeyPairGenerator.getInstance("RSA");
        kpg.initialize(2048, new SecureRandom());
        KeyPair kp = kpg.generateKeyPair();
        byte[] der = selfSigned(kp, deviceId);
        return new Identity(kp.getPrivate(), parseCert(der));
    }

    public static Identity load(byte[] pkcs8, byte[] certDer) throws Exception {
        PrivateKey key = KeyFactory.getInstance("RSA").generatePrivate(new PKCS8EncodedKeySpec(pkcs8));
        return new Identity(key, parseCert(certDer));
    }

    public static X509Certificate parseCert(byte[] der) throws Exception {
        CertificateFactory cf = CertificateFactory.getInstance("X.509");
        return (X509Certificate) cf.generateCertificate(new ByteArrayInputStream(der));
    }

    static byte[] selfSigned(KeyPair kp, String cn) throws Exception {
        long now = System.currentTimeMillis();
        Date notBefore = new Date(now - 365L * 86400000L);
        Date notAfter = new Date(now + 10L * 365L * 86400000L);
        byte[] name = seq(
                set(seq(oid("2.5.4.3"), utf8(cn))),
                set(seq(oid("2.5.4.10"), utf8("KDE"))),
                set(seq(oid("2.5.4.11"), utf8("KDE Connect"))));
        byte[] algId = seq(oid("1.2.840.113549.1.1.11"), new byte[] {0x05, 0x00});
        byte[] serial = integer(new BigInteger(64, new SecureRandom()).abs().add(BigInteger.ONE));
        byte[] tbs = seq(
                tagged(0xA0, integer(BigInteger.valueOf(2))), // v3
                serial,
                algId,
                name,
                seq(time(notBefore), time(notAfter)),
                name,
                kp.getPublic().getEncoded()); // SubjectPublicKeyInfo is already DER
        Signature sig = Signature.getInstance("SHA256withRSA");
        sig.initSign(kp.getPrivate());
        sig.update(tbs);
        byte[] signature = sig.sign();
        return seq(tbs, algId, bitString(signature));
    }

    // ------------------------------------------------------------------ DER helpers
    private static byte[] tlv(int tag, byte[] value) {
        ByteArrayOutputStream out = new ByteArrayOutputStream(value.length + 6);
        out.write(tag);
        int len = value.length;
        if (len < 0x80) out.write(len);
        else if (len < 0x100) { out.write(0x81); out.write(len); }
        else if (len < 0x10000) { out.write(0x82); out.write(len >> 8); out.write(len & 0xff); }
        else { out.write(0x83); out.write(len >> 16); out.write((len >> 8) & 0xff); out.write(len & 0xff); }
        out.write(value, 0, value.length);
        return out.toByteArray();
    }

    private static byte[] concat(byte[]... parts) {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        for (byte[] p : parts) out.write(p, 0, p.length);
        return out.toByteArray();
    }

    private static byte[] seq(byte[]... parts) { return tlv(0x30, concat(parts)); }
    private static byte[] set(byte[]... parts) { return tlv(0x31, concat(parts)); }
    private static byte[] tagged(int tag, byte[] inner) { return tlv(tag, inner); }
    private static byte[] integer(BigInteger v) { return tlv(0x02, v.toByteArray()); }
    private static byte[] utf8(String s) { return tlv(0x0C, s.getBytes(UTF8)); }

    private static byte[] bitString(byte[] data) {
        byte[] v = new byte[data.length + 1];
        System.arraycopy(data, 0, v, 1, data.length);
        return tlv(0x03, v);
    }

    private static byte[] time(Date d) {
        SimpleDateFormat utc = new SimpleDateFormat("yyMMddHHmmss'Z'", Locale.US);
        utc.setTimeZone(TimeZone.getTimeZone("UTC"));
        SimpleDateFormat gen = new SimpleDateFormat("yyyyMMddHHmmss'Z'", Locale.US);
        gen.setTimeZone(TimeZone.getTimeZone("UTC"));
        int year = Integer.parseInt(gen.format(d).substring(0, 4));
        if (year >= 1950 && year < 2050) return tlv(0x17, utc.format(d).getBytes(UTF8));
        return tlv(0x18, gen.format(d).getBytes(UTF8));
    }

    private static byte[] oid(String dotted) {
        String[] parts = dotted.split("\\.");
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        out.write(Integer.parseInt(parts[0]) * 40 + Integer.parseInt(parts[1]));
        for (int i = 2; i < parts.length; i++) {
            long v = Long.parseLong(parts[i]);
            byte[] tmp = new byte[10];
            int n = 0;
            tmp[n++] = (byte) (v & 0x7f);
            v >>= 7;
            while (v > 0) { tmp[n++] = (byte) (0x80 | (v & 0x7f)); v >>= 7; }
            for (int k = n - 1; k >= 0; k--) out.write(tmp[k]);
        }
        return tlv(0x06, out.toByteArray());
    }

    // ------------------------------------------------------------------ fingerprints & verification key
    public static String sha256Hex(byte[] data) {
        try {
            byte[] h = MessageDigest.getInstance("SHA-256").digest(data);
            return hex(h);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    public static String hex(byte[] h) {
        StringBuilder sb = new StringBuilder(h.length * 2);
        for (byte b : h) sb.append(String.format(Locale.US, "%02x", b & 0xff));
        return sb.toString();
    }

    /** Unsigned lexicographic compare, shorter prefix first (same as Node's Buffer.compare). */
    static int compare(byte[] a, byte[] b) {
        int n = Math.min(a.length, b.length);
        for (int i = 0; i < n; i++) {
            int x = a[i] & 0xff, y = b[i] & 0xff;
            if (x != y) return x < y ? -1 : 1;
        }
        return Integer.compare(a.length, b.length);
    }

    /** 8-char code shown on both screens while pairing (KDE Connect v8 style). */
    public static String verificationKey(byte[] ownSpki, byte[] theirSpki, long timestamp) {
        try {
            byte[] first = compare(ownSpki, theirSpki) < 0 ? theirSpki : ownSpki;
            byte[] second = first == ownSpki ? theirSpki : ownSpki;
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            md.update(first);
            md.update(second);
            md.update(Long.toString(timestamp).getBytes(UTF8));
            return hex(md.digest()).substring(0, 8).toUpperCase(Locale.US);
        } catch (Exception e) {
            return "";
        }
    }
}
