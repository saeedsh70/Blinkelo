package com.saeedsh.islandlink.core;

import java.io.IOException;
import java.security.SecureRandom;
import java.security.Signature;
import java.security.cert.X509Certificate;
import java.security.MessageDigest;
import java.security.spec.MGF1ParameterSpec;
import java.nio.ByteBuffer;
import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.OAEPParameterSpec;
import javax.crypto.spec.PSource;
import javax.crypto.spec.SecretKeySpec;

/** Bind both connection nonces and identities to proof of the certificate's private key. */
public final class BtAuth {
    private BtAuth() {}

    public static String nonce() {
        byte[] bytes = new byte[32];
        new SecureRandom().nextBytes(bytes);
        StringBuilder text = new StringBuilder(64);
        for (byte value : bytes) text.append(String.format(java.util.Locale.US, "%02x", value & 255));
        return text.toString();
    }

    public static byte[] transcript(String sender, String receiver, String senderNonce, String receiverNonce,
                                    String senderFingerprint, String receiverFingerprint) throws IOException {
        if (!sender.matches("[a-zA-Z0-9_-]{32,38}") || !receiver.matches("[a-zA-Z0-9_-]{32,38}")
                || !senderNonce.matches("[a-f0-9]{64}") || !receiverNonce.matches("[a-f0-9]{64}"))
            throw new IOException("invalid Bluetooth authentication identity/nonce");
        return ("island.bt.auth.v2\n" + sender + "\n" + receiver + "\n" + senderNonce + "\n"
                + receiverNonce + "\n" + senderFingerprint + "\n" + receiverFingerprint + "\n").getBytes(Link.UTF8);
    }

    public static byte[] join(byte[] first, byte[] second) {
        byte[] bytes = new byte[first.length + second.length];
        System.arraycopy(first, 0, bytes, 0, first.length);
        System.arraycopy(second, 0, bytes, first.length, second.length);
        return bytes;
    }

    public static byte[] seed() { byte[] bytes = new byte[32]; new SecureRandom().nextBytes(bytes); return bytes; }

    private static OAEPParameterSpec oaep() {
        // Providers differ in their MGF1 default; match Node's explicit SHA-256 for both hashes.
        return new OAEPParameterSpec("SHA-256", "MGF1", MGF1ParameterSpec.SHA256, PSource.PSpecified.DEFAULT);
    }

    public static byte[] sealSeed(X509Certificate receiver, byte[] seed) throws Exception {
        Cipher cipher = Cipher.getInstance("RSA/ECB/OAEPWithSHA-256AndMGF1Padding");
        cipher.init(Cipher.ENCRYPT_MODE, receiver.getPublicKey(), oaep());
        return cipher.doFinal(seed);
    }

    public static byte[] openSeed(Certs.Identity identity, byte[] sealed) throws Exception {
        Cipher cipher = Cipher.getInstance("RSA/ECB/OAEPWithSHA-256AndMGF1Padding");
        cipher.init(Cipher.DECRYPT_MODE, identity.key, oaep());
        byte[] seed = cipher.doFinal(sealed);
        if (seed.length != 32) throw new IOException("invalid Bluetooth session key");
        return seed;
    }

    public static byte[] sessionKey(byte[] seed, byte[] context) throws Exception {
        return MessageDigest.getInstance("SHA-256").digest(join(seed, context));
    }

    public static byte[] crypt(boolean encrypt, byte[] key, byte[] context, long sequence, byte[] data) throws Exception {
        if (sequence < 0 || sequence > 9007199254740991L || key == null || key.length != 32)
            throw new IOException("invalid Bluetooth frame sequence/key");
        byte[] iv = ByteBuffer.allocate(12).putInt(0).putLong(sequence).array();
        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
        cipher.init(encrypt ? Cipher.ENCRYPT_MODE : Cipher.DECRYPT_MODE, new SecretKeySpec(key, "AES"), new GCMParameterSpec(128, iv));
        cipher.updateAAD(context);
        return cipher.doFinal(data);
    }

    public static String sign(Certs.Identity identity, byte[] transcript) throws Exception {
        Signature signer = Signature.getInstance("SHA256withRSA");
        signer.initSign(identity.key); signer.update(transcript);
        return Base64.encode(signer.sign());
    }

    public static void verify(X509Certificate peer, byte[] transcript, String proof) throws Exception {
        if (proof.length() > 1024) throw new IOException("Bluetooth proof too large");
        Signature verifier = Signature.getInstance("SHA256withRSA");
        verifier.initVerify(peer.getPublicKey()); verifier.update(transcript);
        if (!verifier.verify(Base64.decode(proof))) throw new IOException("Bluetooth proof rejected");
    }
}
