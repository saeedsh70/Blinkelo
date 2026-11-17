package com.saeedsh.islandlink.core;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.charset.StandardCharsets;
public class Core {
    public static String readText(File f) throws IOException { return new String(Files.readAllBytes(f.toPath()), StandardCharsets.UTF_8); }
    public static void writeText(File f, String text) throws IOException { Files.write(f.toPath(), text.getBytes(StandardCharsets.UTF_8)); }
}
