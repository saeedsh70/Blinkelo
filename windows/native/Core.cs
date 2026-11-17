// Blinkelo - native core (compiled at runtime by Windows PowerShell 5.1 Add-Type).
// IMPORTANT: must stay C# 5 compatible (no string interpolation, no ?. , no nameof, no expression bodies).
using System;
using System.Collections.Generic;
using System.Collections.Concurrent;
using System.Diagnostics;
using System.Drawing;
using System.Drawing.Imaging;
using System.Globalization;
using System.IO;
using System.Net;
using System.Net.NetworkInformation;
using System.Net.Sockets;
using System.Reflection;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;
using System.Xml;
using Microsoft.Win32;

namespace IslandNative
{
    // ------------------------------------------------------------------ output
    public static class Out
    {
        private static readonly object Sync = new object();
        private static Stream _stdout;

        // Writes one JSON line. Every non-ASCII char is escaped so encoding never matters.
        public static void Line(string json)
        {
            if (json == null) return;
            StringBuilder sb = new StringBuilder(json.Length + 16);
            for (int i = 0; i < json.Length; i++)
            {
                char ch = json[i];
                if (ch > 126)
                {
                    sb.Append("\\u");
                    sb.Append(((int)ch).ToString("x4"));
                }
                else if (ch == '\r' || ch == '\n')
                {
                    // raw newlines can only be insignificant whitespace in compact JSON
                }
                else sb.Append(ch);
            }
            sb.Append('\n');
            byte[] bytes = Encoding.ASCII.GetBytes(sb.ToString());
            lock (Sync)
            {
                try
                {
                    if (_stdout == null) _stdout = Console.OpenStandardOutput();
                    _stdout.Write(bytes, 0, bytes.Length);
                    _stdout.Flush();
                }
                catch { }
            }
        }

        public static void Log(string level, string msg)
        {
            Line(new JObj().S("type", "log").S("level", level).S("msg", msg).ToString());
        }

        public static void Status(string module, bool ok, string detail)
        {
            Line(new JObj().S("type", "status").S("module", module).B("ok", ok).S("detail", detail).ToString());
        }
    }

    // ------------------------------------------------------------------ tiny JSON builder
    public static class J
    {
        public static string Str(string s)
        {
            if (s == null) return "null";
            StringBuilder sb = new StringBuilder(s.Length + 2);
            sb.Append('"');
            for (int i = 0; i < s.Length; i++)
            {
                char c = s[i];
                switch (c)
                {
                    case '"': sb.Append("\\\""); break;
                    case '\\': sb.Append("\\\\"); break;
                    case '\n': sb.Append("\\n"); break;
                    case '\r': sb.Append("\\r"); break;
                    case '\t': sb.Append("\\t"); break;
                    default:
                        if (c < 32) { sb.Append("\\u"); sb.Append(((int)c).ToString("x4")); }
                        else sb.Append(c);
                        break;
                }
            }
            sb.Append('"');
            return sb.ToString();
        }

        public static string Num(double d)
        {
            if (double.IsNaN(d) || double.IsInfinity(d)) return "0";
            return d.ToString("0.#####", CultureInfo.InvariantCulture);
        }

        public static string StrArr(IList<string> items)
        {
            StringBuilder sb = new StringBuilder();
            sb.Append('[');
            for (int i = 0; i < items.Count; i++)
            {
                if (i > 0) sb.Append(',');
                sb.Append(Str(items[i]));
            }
            sb.Append(']');
            return sb.ToString();
        }

        public static string RawArr(IList<string> rawItems)
        {
            StringBuilder sb = new StringBuilder();
            sb.Append('[');
            for (int i = 0; i < rawItems.Count; i++)
            {
                if (i > 0) sb.Append(',');
                sb.Append(rawItems[i]);
            }
            sb.Append(']');
            return sb.ToString();
        }
    }

    public class JObj
    {
        private readonly StringBuilder _sb = new StringBuilder("{");
        private bool _first = true;

        private JObj Key(string k)
        {
            if (!_first) _sb.Append(',');
            _first = false;
            _sb.Append(J.Str(k));
            _sb.Append(':');
            return this;
        }
        public JObj S(string k, string v) { Key(k); _sb.Append(J.Str(v)); return this; }
        public JObj N(string k, double v) { Key(k); _sb.Append(J.Num(v)); return this; }
        public JObj B(string k, bool v) { Key(k); _sb.Append(v ? "true" : "false"); return this; }
        public JObj Raw(string k, string raw) { Key(k); _sb.Append(raw ?? "null"); return this; }
        public override string ToString() { return _sb.ToString() + "}"; }
    }

    // ------------------------------------------------------------------ host / command dispatch
    public static class Host
    {
        private static bool _started;

        public static void Start()
        {
            if (_started) return;
            _started = true;
            Cmd.Start();
            SafeStart("audio", Audio.Start);
            SafeStart("system", Sys.Start);
            SafeStart("notifications", Notifs.Start);
            SafeStart("players", Players.Start);
        }

        private static void SafeStart(string name, Action a)
        {
            try { a(); }
            catch (Exception ex) { Out.Status(name, false, ex.Message); }
        }
    }

    public static class Cmd
    {
        private static readonly ConcurrentQueue<string[]> PsQueue = new ConcurrentQueue<string[]>();
        private static Thread _thread;

        public static void Start()
        {
            _thread = new Thread(Run);
            _thread.IsBackground = true;
            _thread.Name = "island-stdin";
            _thread.Start();
        }

        // PowerShell polls this for the commands it owns (media.*, uia.*)
        public static string[] NextPs()
        {
            string[] item;
            if (PsQueue.TryDequeue(out item)) return item;
            return null;
        }

        private static string Decode(string s)
        {
            if (string.IsNullOrEmpty(s)) return "";
            try { return Encoding.UTF8.GetString(Convert.FromBase64String(s)); }
            catch { return s; }
        }

        private static void Run()
        {
            try
            {
                StreamReader reader = new StreamReader(Console.OpenStandardInput(), new UTF8Encoding(false));
                string line;
                while ((line = reader.ReadLine()) != null)
                {
                    line = line.Trim();
                    if (line.Length == 0) continue;
                    string[] parts = line.Split('\t');
                    for (int i = 1; i < parts.Length; i++) parts[i] = Decode(parts[i]);
                    try
                    {
                        if (!Handle(parts)) PsQueue.Enqueue(parts);
                    }
                    catch (Exception ex)
                    {
                        Out.Log("error", "command " + parts[0] + " failed: " + ex.Message);
                    }
                }
            }
            catch (Exception ex)
            {
                Out.Log("error", "stdin reader: " + ex.Message);
            }
            // Parent (Electron) went away: shut the helper down.
            Environment.Exit(0);
        }

        private static float F(string s)
        {
            float f;
            if (float.TryParse(s, NumberStyles.Float, CultureInfo.InvariantCulture, out f)) return f;
            return 0f;
        }

        private static string Arg(string[] p, int i)
        {
            return p.Length > i ? p[i] : "";
        }

        private static bool Handle(string[] p)
        {
            switch (p[0])
            {
                case "ping":
                    Out.Line(new JObj().S("type", "pong").ToString());
                    return true;
                case "volume.set":
                    Audio.SetVolume(F(Arg(p, 1)));
                    return true;
                case "volume.delta":
                    Audio.Delta(F(Arg(p, 1)));
                    return true;
                case "volume.mute":
                    Audio.SetMute(Arg(p, 1) == "1");
                    return true;
                case "volume.toggleMute":
                    Audio.ToggleMute();
                    return true;
                case "audio.meter":
                    Audio.MeterEnabled = Arg(p, 1) == "1";
                    return true;
                case "notif.recent":
                    Notifs.RequestRecent(Arg(p, 1));
                    return true;
                case "sys.refresh":
                    Sys.ForceEmit();
                    Audio.ForceEmit();
                    Players.ForceEmit();
                    return true;
                case "win.exstyle":
                    Win.ExStyle(Arg(p, 1), Arg(p, 2), Arg(p, 3));
                    return true;
                case "keys.media":
                    Win.MediaKey(Arg(p, 1));
                    return true;
                case "icon.get":
                    {
                        string id = Arg(p, 1), path = Arg(p, 2), size = Arg(p, 3), mode = Arg(p, 4);
                        Sta.Icons.Post(delegate { ShellIcons.Emit(id, path, size, mode); });
                    }
                    return true;
                case "input.mouse":
                    Input.Mouse(Arg(p, 1), F(Arg(p, 2)), F(Arg(p, 3)));
                    return true;
                case "input.key":
                    Input.Key(Arg(p, 1), Arg(p, 2), Arg(p, 3));
                    return true;
                case "power.lock":
                    Power.Lock();
                    return true;
                case "power.sleep":
                    Power.Sleep();
                    return true;
                case "power.monitoroff":
                    Power.MonitorOff();
                    return true;
                case "bt.want":
                    Bt.Want(Arg(p, 1) == "1");
                    return true;
                case "bt.send":
                    Bt.Send(Arg(p, 1), Arg(p, 2));
                    return true;
                case "bt.close":
                    Bt.Close(Arg(p, 1));
                    return true;
                case "bt.closeAll":
                    Bt.CloseAll();
                    return true;
                default:
                    return false; // handled by PowerShell (media.*, uia.*)
            }
        }
    }

    // ------------------------------------------------------------------ STA workers (clipboard, shell images)
    // Each worker is an STA thread running a real message loop: shell and OLE objects often post window
    // messages back to the creating thread, and a thread that only blocks on a queue never answers them.
    // Clipboard and icons get separate threads so a stuck clipboard owner cannot stall icon requests.
    public sealed class StaWorker
    {
        public delegate void Job();
        private readonly string _name;
        private readonly object _gate = new object();
        private readonly ManualResetEvent _ready = new ManualResetEvent(false);
        private Thread _thread;
        private System.Windows.Forms.Control _ctl;
        private int _pending;

        public StaWorker(string name) { _name = name; }

        private void Ensure()
        {
            lock (_gate)
            {
                if (_thread != null) return;
                _thread = new Thread(Run);
                _thread.IsBackground = true;
                _thread.Name = _name;
                _thread.SetApartmentState(ApartmentState.STA);
                _thread.Start();
            }
        }

        private void Run()
        {
            try
            {
                _ctl = new System.Windows.Forms.Control();
                IntPtr unused = _ctl.Handle; // creates the window on this thread
                _ready.Set();
                System.Windows.Forms.Application.Run();
            }
            catch (Exception ex)
            {
                Out.Log("error", _name + " loop: " + ex.Message);
                _ready.Set();
            }
        }

        public void Post(Job job)
        {
            Ensure();
            if (!_ready.WaitOne(5000) || _ctl == null) { Out.Log("warn", _name + " not ready"); return; }
            if (Interlocked.Increment(ref _pending) > 300) { Interlocked.Decrement(ref _pending); return; }
            try
            {
                _ctl.BeginInvoke(new System.Windows.Forms.MethodInvoker(delegate
                {
                    try { job(); }
                    catch (Exception ex) { Out.Log("warn", _name + " job: " + ex.Message); }
                    finally { Interlocked.Decrement(ref _pending); }
                }));
            }
            catch (Exception ex)
            {
                Interlocked.Decrement(ref _pending);
                Out.Log("warn", _name + " post: " + ex.Message);
            }
        }
    }

    public static class Sta
    {
        public static readonly StaWorker Clip = new StaWorker("island-clip");
        public static readonly StaWorker Icons = new StaWorker("island-icons");
    }

    // ------------------------------------------------------------------ clipboard images
    public static class ClipCapture
    {
        private static string _dir;

        private static string Dir()
        {
            if (_dir != null) return _dir;
            string d = Path.Combine(Path.GetTempPath(), "Blinkelo", "clip");
            Directory.CreateDirectory(d);
            _dir = d;
            return d;
        }

        private static void Cleanup()
        {
            try
            {
                FileInfo[] files = new DirectoryInfo(Dir()).GetFiles("clip-*.png");
                Array.Sort(files, delegate (FileInfo a, FileInfo b) { return b.LastWriteTimeUtc.CompareTo(a.LastWriteTimeUtc); });
                for (int i = 20; i < files.Length; i++) { try { files[i].Delete(); } catch { } }
            }
            catch { }
        }

        private static System.Windows.Forms.IDataObject Read()
        {
            for (int i = 0; i < 4; i++)
            {
                try { return System.Windows.Forms.Clipboard.GetDataObject(); }
                catch { Thread.Sleep(60); } // the writer may still hold the clipboard
            }
            return null;
        }

        public static void Emit(uint seq, bool sensitive)
        {
            JObj o = new JObj().S("type", "clipboard").N("seq", seq);
            if (!sensitive)
            {
                System.Windows.Forms.IDataObject data = Read();
                if (data != null)
                {
                    try
                    {
                        if (data.GetDataPresent("CanIncludeInClipboardHistory"))
                        {
                            MemoryStream ms = data.GetData("CanIncludeInClipboardHistory") as MemoryStream;
                            if (ms != null && ms.Length >= 4)
                            {
                                byte[] b = ms.ToArray();
                                if (BitConverter.ToInt32(b, 0) == 0) sensitive = true;
                            }
                        }
                    }
                    catch { }
                    bool hasText = false;
                    try { hasText = data.GetDataPresent(System.Windows.Forms.DataFormats.UnicodeText); } catch { }
                    o.B("hasText", hasText);
                    if (!sensitive && !hasText) TryImage(data, seq, o);
                }
            }
            o.B("sensitive", sensitive);
            Out.Line(o.ToString());
        }

        private static void TryImage(System.Windows.Forms.IDataObject data, uint seq, JObj o)
        {
            try
            {
                string file = Path.Combine(Dir(), "clip-" + seq + ".png");
                int w = 0, h = 0;
                // PNG keeps transparency; browsers and most editors put it next to the bitmap
                if (data.GetDataPresent("PNG"))
                {
                    MemoryStream ms = data.GetData("PNG") as MemoryStream;
                    if (ms != null && ms.Length > 0)
                    {
                        using (Image img = Image.FromStream(ms))
                        {
                            w = img.Width; h = img.Height;
                            img.Save(file, ImageFormat.Png);
                        }
                    }
                }
                if (w == 0 && data.GetDataPresent(System.Windows.Forms.DataFormats.Bitmap))
                {
                    using (Image img = System.Windows.Forms.Clipboard.GetImage())
                    {
                        if (img != null)
                        {
                            w = img.Width; h = img.Height;
                            img.Save(file, ImageFormat.Png);
                        }
                    }
                }
                if (w > 0 && h > 0)
                {
                    o.S("image", file).N("w", w).N("h", h);
                    Cleanup();
                }
            }
            catch (Exception ex) { Out.Log("warn", "clipboard image: " + ex.Message); }
        }
    }

    // ------------------------------------------------------------------ shell icons / thumbnails (incl. Store apps)
    public static class ShellIcons
    {
        [ComImport, Guid("bcc18b79-ba16-442f-80c4-8a59c30c463b"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
        private interface IShellItemImageFactory
        {
            [PreserveSig]
            int GetImage(SIZE size, int flags, out IntPtr phbm);
        }

        [StructLayout(LayoutKind.Sequential)]
        private struct SIZE { public int cx; public int cy; }

        [DllImport("shell32.dll", CharSet = CharSet.Unicode)]
        private static extern int SHCreateItemFromParsingName(string path, IntPtr pbc, ref Guid riid, [MarshalAs(UnmanagedType.Interface)] out IShellItemImageFactory factory);

        [DllImport("gdi32.dll")]
        private static extern bool DeleteObject(IntPtr hObject);

        private static Guid IID_Factory = new Guid("bcc18b79-ba16-442f-80c4-8a59c30c463b");

        // mode "icon" = icon only, "thumb" = thumbnail when the file has one (images, videos)
        public static void Emit(string id, string path, string sizeText, string mode)
        {
            string data = null;
            try { data = Get(path, sizeText, mode); }
            catch (Exception ex) { Out.Log("warn", "icon " + path + ": " + ex.Message); }
            JObj o = new JObj().S("type", "icon").S("id", id);
            if (data != null) o.S("data", data);
            Out.Line(o.ToString());
        }

        private static string Get(string path, string sizeText, string mode)
        {
            if (string.IsNullOrEmpty(path)) return null;
            int size;
            if (!int.TryParse(sizeText, out size) || size < 16 || size > 256) size = 48;
            string why = "";
            string data = null;
            try { data = FromFactory(path, size, mode, ref why); }
            catch (Exception ex) { why += " factory:" + ex.GetType().Name + " " + ex.Message; }
            if (data != null) return data;
            try { data = FromSysImageList(path, size, ref why); }
            catch (Exception ex) { why += " sysicon:" + ex.GetType().Name + " " + ex.Message; }
            if (data == null) Out.Log("warn", "icon miss " + path + " |" + why);
            return data;
        }

        private static string FromFactory(string path, int size, string mode, ref string why)
        {
            IShellItemImageFactory f;
            int hr = SHCreateItemFromParsingName(path, IntPtr.Zero, ref IID_Factory, out f);
            if (hr != 0 || f == null) { why += " parse:0x" + hr.ToString("X8"); return null; }
            IntPtr hbm = IntPtr.Zero;
            try
            {
                SIZE sz; sz.cx = size; sz.cy = size;
                int flags = mode == "thumb" ? 0x1 /* BIGGERSIZEOK */ : 0x4 | 0x1; /* ICONONLY | BIGGERSIZEOK */
                hr = f.GetImage(sz, flags, out hbm);
                if (hr != 0 || hbm == IntPtr.Zero) { why += " image:0x" + hr.ToString("X8"); return null; }
                using (Bitmap bmp = ToBitmap(hbm)) return Png(bmp, size);
            }
            finally
            {
                if (hbm != IntPtr.Zero) DeleteObject(hbm);
                Marshal.ReleaseComObject(f);
            }
        }

        private static string Png(Bitmap bmp, int size)
        {
            if (bmp == null) return null;
            using (MemoryStream ms = new MemoryStream())
            {
                Bitmap outBmp = bmp;
                bool scaled = false;
                if (bmp.Width > size || bmp.Height > size)
                {
                    double k = Math.Min((double)size / bmp.Width, (double)size / bmp.Height);
                    outBmp = new Bitmap(Math.Max(1, (int)(bmp.Width * k)), Math.Max(1, (int)(bmp.Height * k)), PixelFormat.Format32bppArgb);
                    using (Graphics g = Graphics.FromImage(outBmp))
                    {
                        g.InterpolationMode = System.Drawing.Drawing2D.InterpolationMode.HighQualityBicubic;
                        g.DrawImage(bmp, 0, 0, outBmp.Width, outBmp.Height);
                    }
                    scaled = true;
                }
                outBmp.Save(ms, ImageFormat.Png);
                if (scaled) outBmp.Dispose();
                return "data:image/png;base64," + Convert.ToBase64String(ms.ToArray());
            }
        }

        // ---- fallback: the shell's system image list (the same icons Explorer and the Start menu draw)
        [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
        private struct SHFILEINFO
        {
            public IntPtr hIcon;
            public int iIcon;
            public uint dwAttributes;
            [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 260)] public string szDisplayName;
            [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 80)] public string szTypeName;
        }

        [ComImport, Guid("46EB5926-582E-4017-9FDF-E8998DAA0950"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
        private interface IImageList
        {
            [PreserveSig] int Add(IntPtr hbmImage, IntPtr hbmMask, out int pi);
            [PreserveSig] int ReplaceIcon(int i, IntPtr hicon, out int pi);
            [PreserveSig] int SetOverlayImage(int iImage, int iOverlay);
            [PreserveSig] int Replace(int i, IntPtr hbmImage, IntPtr hbmMask);
            [PreserveSig] int AddMasked(IntPtr hbmImage, int crMask, out int pi);
            [PreserveSig] int Draw(IntPtr pimldp);
            [PreserveSig] int Remove(int i);
            [PreserveSig] int GetIcon(int i, int flags, out IntPtr picon);
        }

        [DllImport("shell32.dll", EntryPoint = "SHGetFileInfoW", CharSet = CharSet.Unicode)]
        private static extern IntPtr SHGetFileInfoPath(string pszPath, uint attr, ref SHFILEINFO psfi, uint cb, uint flags);

        [DllImport("shell32.dll", EntryPoint = "SHGetFileInfoW", CharSet = CharSet.Unicode)]
        private static extern IntPtr SHGetFileInfoPidl(IntPtr pidl, uint attr, ref SHFILEINFO psfi, uint cb, uint flags);

        [DllImport("shell32.dll", CharSet = CharSet.Unicode)]
        private static extern int SHParseDisplayName(string name, IntPtr pbc, out IntPtr pidl, uint sfgaoIn, out uint sfgaoOut);

        [DllImport("shell32.dll", EntryPoint = "SHGetImageList")]
        private static extern int SHGetImageList(int iImageList, ref Guid riid, [MarshalAs(UnmanagedType.Interface)] out IImageList ppv);

        [DllImport("user32.dll")]
        private static extern bool DestroyIcon(IntPtr hIcon);

        private static Guid IID_ImageList = new Guid("46EB5926-582E-4017-9FDF-E8998DAA0950");
        private const uint SHGFI_SYSICONINDEX = 0x4000, SHGFI_PIDL = 0x8;

        private static string FromSysImageList(string path, int size, ref string why)
        {
            SHFILEINFO sfi = new SHFILEINFO();
            uint cb = (uint)Marshal.SizeOf(typeof(SHFILEINFO));
            IntPtr ok;
            if (path.StartsWith("shell:", StringComparison.OrdinalIgnoreCase) || path.StartsWith("::"))
            {
                IntPtr pidl; uint attrs;
                int hr = SHParseDisplayName(path, IntPtr.Zero, out pidl, 0, out attrs);
                if (hr != 0 || pidl == IntPtr.Zero) { why += " pidl:0x" + hr.ToString("X8"); return null; }
                try { ok = SHGetFileInfoPidl(pidl, 0, ref sfi, cb, SHGFI_PIDL | SHGFI_SYSICONINDEX); }
                finally { Marshal.FreeCoTaskMem(pidl); }
            }
            else
            {
                if (!File.Exists(path) && !Directory.Exists(path)) { why += " missing"; return null; }
                ok = SHGetFileInfoPath(path, 0, ref sfi, cb, SHGFI_SYSICONINDEX);
            }
            if (ok == IntPtr.Zero) { why += " sysindex"; return null; }
            IImageList list;
            int listId = size > 48 ? 4 /* SHIL_JUMBO */ : 2 /* SHIL_EXTRALARGE (48px) */;
            int hr2 = SHGetImageList(listId, ref IID_ImageList, out list);
            if (hr2 != 0 || list == null) { why += " imagelist:0x" + hr2.ToString("X8"); return null; }
            IntPtr hicon = IntPtr.Zero;
            try
            {
                hr2 = list.GetIcon(sfi.iIcon, 0x1 /* ILD_TRANSPARENT */, out hicon);
                if (hr2 != 0 || hicon == IntPtr.Zero) { why += " geticon:0x" + hr2.ToString("X8"); return null; }
                using (Icon ic = Icon.FromHandle(hicon))
                using (Bitmap bmp = ic.ToBitmap())
                    return Png(bmp, size);
            }
            finally
            {
                if (hicon != IntPtr.Zero) DestroyIcon(hicon);
                Marshal.ReleaseComObject(list);
            }
        }

        // Image.FromHbitmap drops the alpha channel; re-wrap the raw 32-bit pixels as premultiplied ARGB.
        private static Bitmap ToBitmap(IntPtr hbm)
        {
            using (Bitmap src = Image.FromHbitmap(hbm))
            {
                if (Image.GetPixelFormatSize(src.PixelFormat) != 32) return new Bitmap(src);
                Rectangle r = new Rectangle(0, 0, src.Width, src.Height);
                int rowBytes = checked(r.Width * 4);
                byte[] buf = new byte[checked(rowBytes * r.Height)];
                BitmapData bd = src.LockBits(r, ImageLockMode.ReadOnly, src.PixelFormat);
                try
                {
                    if (bd.Scan0 == IntPtr.Zero || Math.Abs((long)bd.Stride) < rowBytes) return null;
                    // Scan0 is the first logical row. A negative stride places the next row before it.
                    for (int y = 0; y < r.Height; y++)
                        Marshal.Copy(new IntPtr(bd.Scan0.ToInt64() + (long)y * bd.Stride), buf, y * rowBytes, rowBytes);
                }
                finally { src.UnlockBits(bd); }

                bool anyAlpha = false;
                for (int i = 3; i < buf.Length; i += 4) { if (buf[i] != 0) { anyAlpha = true; break; } }
                if (!anyAlpha) return new Bitmap(src); // old-style icon without alpha: keep it opaque

                Bitmap dst = new Bitmap(r.Width, r.Height, PixelFormat.Format32bppPArgb);
                try
                {
                    BitmapData dd = dst.LockBits(r, ImageLockMode.WriteOnly, PixelFormat.Format32bppPArgb);
                    try
                    {
                        if (dd.Scan0 == IntPtr.Zero || Math.Abs((long)dd.Stride) < rowBytes)
                            throw new InvalidOperationException("Invalid bitmap destination stride");
                        for (int y = 0; y < r.Height; y++)
                            Marshal.Copy(buf, y * rowBytes, new IntPtr(dd.Scan0.ToInt64() + (long)y * dd.Stride), rowBytes);
                    }
                    finally { dst.UnlockBits(dd); }
                    return dst;
                }
                catch
                {
                    dst.Dispose();
                    throw;
                }
            }
        }
    }

    // ------------------------------------------------------------------ window styles + media keys
    public static class Win
    {
        [DllImport("user32.dll", EntryPoint = "GetWindowLong")]
        private static extern int GetWindowLong32(IntPtr hWnd, int index);

        [DllImport("user32.dll", EntryPoint = "SetWindowLong")]
        private static extern int SetWindowLong32(IntPtr hWnd, int index, int value);

        [DllImport("user32.dll")]
        private static extern bool IsWindow(IntPtr hWnd);

        [DllImport("user32.dll")]
        private static extern void keybd_event(byte vk, byte scan, uint flags, UIntPtr extra);

        private static int ToInt(string s)
        {
            long v;
            if (long.TryParse(s, NumberStyles.Integer, CultureInfo.InvariantCulture, out v)) return unchecked((int)v);
            return 0;
        }

        // Sets/clears extended window style bits on one of Electron's windows (same user, so cross-process is allowed).
        public static void ExStyle(string hwndText, string setText, string clearText)
        {
            long hv;
            if (!long.TryParse(hwndText, NumberStyles.Integer, CultureInfo.InvariantCulture, out hv) || hv == 0) return;
            IntPtr h = new IntPtr(hv);
            if (!IsWindow(h)) return;
            int set = ToInt(setText);
            int clear = ToInt(clearText);
            int cur = GetWindowLong32(h, -20);
            int next = (cur | set) & ~clear;
            if (next == cur) return;
            SetWindowLong32(h, -20, next);
            Out.Line(new JObj().S("type", "winstyle").N("before", cur).N("after", GetWindowLong32(h, -20)).ToString());
        }

        public static void MediaKey(string which)
        {
            byte vk = 0xB3; // play/pause
            if (which == "next") vk = 0xB0;
            else if (which == "prev") vk = 0xB1;
            else if (which == "stop") vk = 0xB2;
            keybd_event(vk, 0, 1, UIntPtr.Zero);
            keybd_event(vk, 0, 1 | 2, UIntPtr.Zero);
        }
    }

    // ------------------------------------------------------------------ desktop players without Windows media controls
    // VLC 3, PotPlayer, MPC-HC/BE, KMPlayer, GOM, mpv... do not publish to SMTC, but they put the file name in
    // their window title. Playing/paused is estimated from whether the default output is audible.
    public static class Players
    {
        private delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);

        [DllImport("user32.dll")]
        private static extern bool EnumWindows(EnumWindowsProc cb, IntPtr lParam);

        [DllImport("user32.dll", CharSet = CharSet.Unicode)]
        private static extern int GetWindowText(IntPtr hWnd, StringBuilder text, int max);

        [DllImport("user32.dll")]
        private static extern int GetWindowTextLength(IntPtr hWnd);

        [DllImport("user32.dll")]
        private static extern bool IsWindowVisible(IntPtr hWnd);

        [DllImport("user32.dll")]
        private static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint pid);

        [DllImport("user32.dll")]
        private static extern IntPtr GetWindow(IntPtr hWnd, uint cmd);

        public class Known
        {
            public string Exe;
            public string Name;
            public string[] Suffixes;
            public Known(string exe, string name, string[] suffixes) { Exe = exe; Name = name; Suffixes = suffixes; }
        }

        private static readonly Known[] KnownPlayers = new Known[]
        {
            new Known("vlc", "VLC", new string[] { " - VLC media player", " - VLC" }),
            new Known("potplayermini64", "PotPlayer", new string[] { " - PotPlayer" }),
            new Known("potplayermini", "PotPlayer", new string[] { " - PotPlayer" }),
            new Known("potplayer64", "PotPlayer", new string[] { " - PotPlayer" }),
            new Known("potplayer", "PotPlayer", new string[] { " - PotPlayer" }),
            new Known("mpc-hc64", "MPC-HC", new string[] { " - MPC-HC", " - Media Player Classic Home Cinema" }),
            new Known("mpc-hc", "MPC-HC", new string[] { " - MPC-HC", " - Media Player Classic Home Cinema" }),
            new Known("mpc-be64", "MPC-BE", new string[] { " - MPC-BE" }),
            new Known("mpc-be", "MPC-BE", new string[] { " - MPC-BE" }),
            new Known("kmplayer", "KMPlayer", new string[] { " - KMPlayer" }),
            new Known("kmplayer64x", "KMPlayer", new string[] { " - KMPlayer" }),
            new Known("gom", "GOM Player", new string[] { " - GOM Player" }),
            new Known("gomplayer", "GOM Player", new string[] { " - GOM Player" }),
            new Known("mpv", "mpv", new string[] { " - mpv" }),
            new Known("smplayer", "SMPlayer", new string[] { " - SMPlayer" }),
            new Known("wmplayer", "Windows Media Player", new string[] { " - Windows Media Player" }),
            new Known("winamp", "Winamp", new string[] { " - Winamp" }),
            new Known("foobar2000", "foobar2000", new string[] { " [foobar2000]", " - foobar2000" }),
            new Known("aimp", "AIMP", new string[] { " - AIMP" }),
            new Known("musicbee", "MusicBee", new string[] { " - MusicBee" }),
        };

        private static readonly string[] MediaExt = new string[]
        {
            ".mp4", ".mkv", ".avi", ".mov", ".wmv", ".webm", ".flv", ".m4v", ".mpg", ".mpeg", ".ts", ".m2ts", ".3gp",
            ".mp3", ".flac", ".wav", ".m4a", ".aac", ".ogg", ".opus", ".wma", ".ape", ".alac"
        };

        private static readonly Dictionary<uint, string> ProcNames = new Dictionary<uint, string>();
        private static string _lastKey = null;
        private static volatile bool _force;

        public static void ForceEmit() { _force = true; }

        public static void Start()
        {
            Thread t = new Thread(Loop);
            t.IsBackground = true;
            t.Name = "island-players";
            t.Start();
        }

        private static string ProcName(uint pid)
        {
            string name;
            if (ProcNames.TryGetValue(pid, out name)) return name;
            name = "";
            try
            {
                using (Process p = Process.GetProcessById((int)pid)) name = p.ProcessName.ToLowerInvariant();
            }
            catch { }
            if (ProcNames.Count > 400) ProcNames.Clear();
            ProcNames[pid] = name;
            return name;
        }

        private static Known Find(string exe)
        {
            foreach (Known k in KnownPlayers) if (k.Exe == exe) return k;
            return null;
        }

        // Turns "01. Artist - Song.mp3 - VLC media player" into "Artist - Song"; returns null when no media is open.
        public static string CleanTitle(string title, Known k, out bool paused)
        {
            string raw;
            return CleanTitle(title, k, out paused, out raw);
        }

        // ... and also returns the bare file name as the player shows it ("Artist - Song.mp3"), used to find the file.
        public static string CleanTitle(string title, Known k, out bool paused, out string raw)
        {
            paused = false;
            raw = null;
            string t = (title ?? "").Trim();
            if (t.Length == 0) return null;
            foreach (string tag in new string[] { "[Paused]", "[Stopped]", "(Paused)", "[Pause]" })
            {
                int i = t.IndexOf(tag, StringComparison.OrdinalIgnoreCase);
                if (i >= 0) { paused = true; t = (t.Substring(0, i) + t.Substring(i + tag.Length)).Trim(); }
            }
            bool stripped = false;
            foreach (string suf in k.Suffixes)
            {
                if (t.EndsWith(suf, StringComparison.OrdinalIgnoreCase)) { t = t.Substring(0, t.Length - suf.Length).Trim(); stripped = true; break; }
            }
            if (!stripped && (t.Equals(k.Name, StringComparison.OrdinalIgnoreCase) || t.StartsWith(k.Name + " ", StringComparison.OrdinalIgnoreCase))) return null;
            if (t.Equals(k.Name, StringComparison.OrdinalIgnoreCase) || t.Length == 0) return null;
            if (t.EndsWith("Media Player Classic Home Cinema", StringComparison.OrdinalIgnoreCase)) return null;
            // leading playlist numbers "12. "
            int dot = t.IndexOf(". ", StringComparison.Ordinal);
            if (dot > 0 && dot <= 4)
            {
                bool digits = true;
                for (int i = 0; i < dot; i++) if (!char.IsDigit(t[i])) digits = false;
                if (digits) t = t.Substring(dot + 2).Trim();
            }
            raw = t;
            foreach (string ext in MediaExt)
            {
                if (t.EndsWith(ext, StringComparison.OrdinalIgnoreCase)) { t = t.Substring(0, t.Length - ext.Length); break; }
            }
            t = t.Replace('_', ' ').Trim();
            return t.Length == 0 ? null : t;
        }

        private static void Loop()
        {
            while (true)
            {
                try { Scan(); }
                catch (Exception ex) { Out.Log("warn", "players: " + ex.Message); }
                Thread.Sleep(1000);
            }
        }

        private static void Scan()
        {
            string bestTitle = null; Known bestKnown = null; bool bestPaused = false; string bestExe = null;
            string bestRaw = null; uint bestPid = 0;
            EnumWindows(delegate (IntPtr h, IntPtr l)
            {
                if (bestTitle != null) return false;
                if (!IsWindowVisible(h) || GetWindow(h, 4) != IntPtr.Zero) return true; // visible, unowned top-level windows only
                int len = GetWindowTextLength(h);
                if (len <= 0 || len > 1024) return true;
                uint pid;
                GetWindowThreadProcessId(h, out pid);
                string exe = ProcName(pid);
                Known k = Find(exe);
                if (k == null) return true;
                StringBuilder sb = new StringBuilder(len + 1);
                GetWindowText(h, sb, sb.Capacity);
                bool paused;
                string raw;
                string t = CleanTitle(sb.ToString(), k, out paused, out raw);
                if (t == null) return true;
                bestTitle = t; bestKnown = k; bestPaused = paused; bestExe = exe; bestRaw = raw; bestPid = pid;
                return false;
            }, IntPtr.Zero);

            // full path of the playing file (subtitles: moviehash + "save next to the video"); cached per window title
            string bestPath = "";
            if (bestTitle != null)
            {
                try { bestPath = MediaPath.Resolve(bestPid, bestExe, bestRaw) ?? ""; }
                catch (Exception ex) { Out.Log("warn", "media path: " + ex.Message); }
            }

            int since = unchecked(Environment.TickCount - Audio.LastAudibleTick);
            bool audible = Audio.LastAudibleTick != int.MinValue && since >= 0 && since < 2500;
            string key = bestTitle == null ? "none" : bestExe + "|" + bestTitle + "|" + (audible && !bestPaused) + "|" + bestPath;
            if (key == _lastKey && !_force) return;
            _lastKey = key;
            _force = false;
            if (bestTitle == null)
            {
                Out.Line(new JObj().S("type", "player").B("present", false).ToString());
                return;
            }
            Out.Line(new JObj().S("type", "player").B("present", true).S("app", bestKnown.Name).S("exe", bestExe + ".exe")
                .S("title", bestTitle).B("playing", audible && !bestPaused)
                .S("raw", bestRaw ?? "").N("pid", bestPid).S("path", bestPath).ToString());
        }
    }

    // ------------------------------------------------------------------ the file behind a player window (subtitles)
    // Players only show the file name. The full path comes from the process command line (double-click / "Open with"),
    // the player's own recent list, Windows' Recent folder, or - last resort - a shallow look through the usual
    // video folders. Results are cached per (process, file name); misses are retried after a while.
    public static class MediaPath
    {
        [DllImport("ntdll.dll")]
        private static extern int NtQueryInformationProcess(IntPtr h, int infoClass, IntPtr buf, int len, out int retLen);

        [DllImport("kernel32.dll", SetLastError = true)]
        private static extern IntPtr OpenProcess(uint access, bool inherit, uint pid);

        [DllImport("kernel32.dll")]
        private static extern bool CloseHandle(IntPtr h);

        [DllImport("kernel32.dll", CharSet = CharSet.Unicode, SetLastError = true)]
        private static extern bool QueryFullProcessImageName(IntPtr h, int flags, StringBuilder name, ref int size);

        [DllImport("shell32.dll", SetLastError = true)]
        private static extern IntPtr CommandLineToArgvW([MarshalAs(UnmanagedType.LPWStr)] string cmd, out int argc);

        [DllImport("kernel32.dll")]
        private static extern IntPtr LocalFree(IntPtr h);

        private const uint QueryLimited = 0x1000;
        private static readonly string[] VideoExt = new string[]
        {
            ".mkv", ".mp4", ".avi", ".mov", ".wmv", ".webm", ".flv", ".m4v", ".mpg", ".mpeg", ".ts", ".m2ts", ".mts", ".3gp",
            ".vob", ".ogv", ".rmvb", ".divx"
        };

        private class Hit { public string Path; public int Tick; }
        private static readonly Dictionary<string, Hit> Cache = new Dictionary<string, Hit>();

        public static string Resolve(uint pid, string exe, string raw)
        {
            if (string.IsNullOrEmpty(raw)) return "";
            string key = pid + "|" + raw;
            Hit hit;
            if (Cache.TryGetValue(key, out hit))
            {
                if (hit.Path.Length > 0 || unchecked(Environment.TickCount - hit.Tick) < 20000) return hit.Path;
            }
            string found = "";
            try { found = FromCommandLine(pid, raw); } catch { found = ""; }
            if (found.Length == 0) { try { found = FromPlayerLists(pid, exe ?? "", raw); } catch { found = ""; } }
            if (found.Length == 0) { try { found = FromRecent(raw); } catch { found = ""; } }
            if (found.Length == 0 && (hit == null)) { try { found = FromFolders(raw); } catch { found = ""; } }
            if (Cache.Count > 200) Cache.Clear();
            Cache[key] = new Hit { Path = found ?? "", Tick = Environment.TickCount };
            return found ?? "";
        }

        public static bool IsVideo(string p)
        {
            if (string.IsNullOrEmpty(p)) return false;
            foreach (string e in VideoExt) if (p.EndsWith(e, StringComparison.OrdinalIgnoreCase)) return true;
            return false;
        }

        private static string StripExt(string name)
        {
            if (name == null) return "";
            foreach (string e in VideoExt) if (name.EndsWith(e, StringComparison.OrdinalIgnoreCase)) return name.Substring(0, name.Length - e.Length);
            return name;
        }

        private static string FileName(string p)
        {
            if (string.IsNullOrEmpty(p)) return "";
            int i = Math.Max(p.LastIndexOf('\\'), p.LastIndexOf('/'));
            return i >= 0 ? p.Substring(i + 1) : p;
        }

        // letters and digits only: "Show.S01E02_1080p" == "Show S01E02 1080p"
        private static string Norm(string s)
        {
            StringBuilder sb = new StringBuilder();
            foreach (char c in StripExt(s ?? "")) if (char.IsLetterOrDigit(c)) sb.Append(char.ToLowerInvariant(c));
            return sb.ToString();
        }

        private static bool Matches(string file, string raw)
        {
            string a = Norm(FileName(file));
            string b = Norm(raw);
            if (a.Length == 0 || b.Length == 0) return false;
            if (a == b) return true;
            // window titles may be cut off
            return b.Length >= 12 && a.StartsWith(b, StringComparison.Ordinal);
        }

        private static bool Usable(string p)
        {
            if (string.IsNullOrEmpty(p) || p.Length < 5 || p.Length > 1000) return false;
            if (p.IndexOfAny(Path.GetInvalidPathChars()) >= 0) return false;
            try { return IsVideo(p) && File.Exists(p); } catch { return false; }
        }

        private static string FromUrl(string s)
        {
            string v = (s ?? "").Trim().Trim('"');
            if (v.StartsWith("file:", StringComparison.OrdinalIgnoreCase))
            {
                try { return new Uri(v).LocalPath; } catch { return ""; }
            }
            return v;
        }

        private static string Pick(IEnumerable<string> candidates, string raw)
        {
            foreach (string c in candidates)
            {
                string p = FromUrl(c);
                if (Matches(p, raw) && Usable(p)) return p;
            }
            return "";
        }

        private static string InDir(string dir, string raw)
        {
            if (string.IsNullOrEmpty(dir)) return "";
            try
            {
                if (IsVideo(raw) && raw.IndexOfAny(Path.GetInvalidFileNameChars()) < 0)
                {
                    string direct = Path.Combine(dir, raw);
                    if (File.Exists(direct)) return direct;
                }
                int n = 0;
                foreach (string f in Directory.EnumerateFiles(dir))
                {
                    if (++n > 3000) break;
                    if (IsVideo(f) && Matches(f, raw)) return f;
                }
            }
            catch { }
            return "";
        }

        private static string CommandLine(uint pid)
        {
            IntPtr h = OpenProcess(QueryLimited, false, pid);
            if (h == IntPtr.Zero) return null;
            try
            {
                int len;
                NtQueryInformationProcess(h, 60, IntPtr.Zero, 0, out len); // ProcessCommandLineInformation (Windows 8.1+)
                if (len <= 0 || len > 131072) len = 16384;
                IntPtr buf = Marshal.AllocHGlobal(len);
                try
                {
                    int ret;
                    if (NtQueryInformationProcess(h, 60, buf, len, out ret) != 0) return null;
                    int chars = (ushort)Marshal.ReadInt16(buf) / 2;               // UNICODE_STRING.Length (bytes)
                    IntPtr text = Marshal.ReadIntPtr(buf, IntPtr.Size);          // UNICODE_STRING.Buffer
                    if (chars <= 0 || text == IntPtr.Zero) return null;
                    return Marshal.PtrToStringUni(text, chars);
                }
                finally { Marshal.FreeHGlobal(buf); }
            }
            finally { CloseHandle(h); }
        }

        private static string ExePath(uint pid)
        {
            IntPtr h = OpenProcess(QueryLimited, false, pid);
            if (h == IntPtr.Zero) return "";
            try
            {
                StringBuilder sb = new StringBuilder(1024);
                int size = sb.Capacity;
                return QueryFullProcessImageName(h, 0, sb, ref size) ? sb.ToString() : "";
            }
            finally { CloseHandle(h); }
        }

        private static string[] SplitArgs(string cmd)
        {
            int argc;
            IntPtr argv = CommandLineToArgvW(cmd, out argc);
            if (argv == IntPtr.Zero) return new string[0];
            try
            {
                string[] args = new string[argc];
                for (int i = 0; i < argc; i++) args[i] = Marshal.PtrToStringUni(Marshal.ReadIntPtr(argv, i * IntPtr.Size));
                return args;
            }
            finally { LocalFree(argv); }
        }

        private static string FromCommandLine(uint pid, string raw)
        {
            string cmd = CommandLine(pid);
            if (string.IsNullOrEmpty(cmd)) return "";
            string[] args = SplitArgs(cmd);
            string firstDir = null;
            for (int i = 1; i < args.Length; i++)
            {
                string a = FromUrl(args[i]);
                if (!Usable(a)) continue;
                if (Matches(a, raw)) return a;
                if (firstDir == null) firstDir = Path.GetDirectoryName(a);
            }
            // the player moved on to the next file of the folder (series)
            return firstDir != null ? InDir(firstDir, raw) : "";
        }

        private static IEnumerable<string> RegValues(string keyPath)
        {
            List<string> list = new List<string>();
            try
            {
                using (RegistryKey k = Registry.CurrentUser.OpenSubKey(keyPath))
                {
                    if (k == null) return list;
                    foreach (string n in k.GetValueNames()) { object v = k.GetValue(n); if (v is string) list.Add((string)v); }
                    foreach (string sub in k.GetSubKeyNames())
                    {
                        using (RegistryKey s = k.OpenSubKey(sub))
                        {
                            if (s == null) continue;
                            object v = s.GetValue("Filename") ?? s.GetValue("FileName");
                            if (v is string) list.Add((string)v);
                        }
                    }
                }
            }
            catch { }
            return list;
        }

        private static IEnumerable<string> IniValues(string file, string section)
        {
            List<string> list = new List<string>();
            try
            {
                if (!File.Exists(file)) return list;
                bool inSection = section == null;
                foreach (string line in File.ReadAllLines(file))
                {
                    string l = line.Trim();
                    if (l.StartsWith("[")) { inSection = section == null || l.Equals("[" + section + "]", StringComparison.OrdinalIgnoreCase); continue; }
                    if (!inSection) continue;
                    int eq = l.IndexOf('=');
                    if (eq > 0) list.Add(l.Substring(eq + 1));
                }
            }
            catch { }
            return list;
        }

        private static string FromPlayerLists(uint pid, string exe, string raw)
        {
            string appData = Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData);
            string exePath = ExePath(pid);
            string exeDir = exePath.Length > 0 ? Path.GetDirectoryName(exePath) : "";
            string exeName = exePath.Length > 0 ? Path.GetFileNameWithoutExtension(exePath) : exe;
            List<string> c = new List<string>();
            if (exe.StartsWith("vlc"))
            {
                // [RecentsMRL] list=file:///D:/Movies/a.mkv, file:///...
                foreach (string v in IniValues(Path.Combine(appData, "vlc\\vlc-qt-interface.ini"), "RecentsMRL"))
                    foreach (string part in v.Split(new string[] { ", " }, StringSplitOptions.RemoveEmptyEntries)) c.Add(part.Trim().Trim('"'));
            }
            else if (exe.StartsWith("mpc-hc"))
            {
                c.AddRange(RegValues("Software\\MPC-HC\\MPC-HC\\Recent File List"));
                c.AddRange(RegValues("Software\\MPC-HC\\MPC-HC\\MediaHistory"));
                if (exeDir.Length > 0) c.AddRange(IniValues(Path.Combine(exeDir, exeName + ".ini"), "Recent File List"));
            }
            else if (exe.StartsWith("mpc-be"))
            {
                c.AddRange(RegValues("Software\\MPC-BE\\Recent File List"));
                c.AddRange(RegValues("Software\\MPC-BE\\History"));
                if (exeDir.Length > 0) c.AddRange(IniValues(Path.Combine(exeDir, exeName + ".ini"), "Recent File List"));
            }
            else if (exe.StartsWith("potplayer"))
            {
                // playlists: "1*file*D:\Movies\a.mkv"
                List<string> dirs = new List<string>();
                dirs.Add(Path.Combine(Path.Combine(appData, exeName), "Playlist"));
                if (exeDir.Length > 0) dirs.Add(Path.Combine(exeDir, "Playlist"));
                foreach (string d in dirs)
                {
                    try
                    {
                        if (!Directory.Exists(d)) continue;
                        foreach (string f in Directory.GetFiles(d, "*.dpl"))
                            foreach (string line in File.ReadAllLines(f))
                            {
                                int star = line.IndexOf("*file*", StringComparison.OrdinalIgnoreCase);
                                if (star >= 0) c.Add(line.Substring(star + 6));
                            }
                    }
                    catch { }
                }
                c.AddRange(RegValues("Software\\DAUM\\" + exeName + "\\RememberFiles"));
            }
            else if (exe.StartsWith("smplayer"))
            {
                foreach (string v in IniValues(Path.Combine(appData, "SMPlayer\\smplayer.ini"), "history_recents"))
                    foreach (string part in v.Split(',')) c.Add(part.Trim().Trim('"'));
            }
            return Pick(c, raw);
        }

        // Explorer's Recent folder has a shortcut for every file opened from it
        private static string FromRecent(string raw)
        {
            string recent = Environment.GetFolderPath(Environment.SpecialFolder.Recent);
            if (string.IsNullOrEmpty(recent) || !Directory.Exists(recent)) return "";
            List<string> lnks = new List<string>();
            if (IsVideo(raw) && raw.IndexOfAny(Path.GetInvalidFileNameChars()) < 0)
            {
                string direct = Path.Combine(recent, raw + ".lnk");
                if (File.Exists(direct)) lnks.Add(direct);
            }
            if (lnks.Count == 0)
            {
                string want = Norm(raw);
                int n = 0;
                foreach (string f in Directory.EnumerateFiles(recent, "*.lnk"))
                {
                    if (++n > 4000) break;
                    string nm = Path.GetFileNameWithoutExtension(f);
                    if (IsVideo(nm) && Norm(nm) == want) lnks.Add(f);
                }
            }
            foreach (string l in lnks)
            {
                string target = LinkTarget(l);
                if (Usable(target)) return target;
            }
            return "";
        }

        private static string LinkTarget(string lnk)
        {
            object shell = null, sc = null;
            try
            {
                Type t = Type.GetTypeFromProgID("WScript.Shell");
                if (t == null) return "";
                shell = Activator.CreateInstance(t);
                sc = t.InvokeMember("CreateShortcut", BindingFlags.InvokeMethod, null, shell, new object[] { lnk });
                object target = sc.GetType().InvokeMember("TargetPath", BindingFlags.GetProperty, null, sc, null);
                return target as string ?? "";
            }
            catch { return ""; }
            finally
            {
                if (sc != null && Marshal.IsComObject(sc)) Marshal.ReleaseComObject(sc);
                if (shell != null && Marshal.IsComObject(shell)) Marshal.ReleaseComObject(shell);
            }
        }

        // last resort: Videos, Downloads, Desktop (three levels, bounded)
        private static string FromFolders(string raw)
        {
            string home = Environment.GetFolderPath(Environment.SpecialFolder.UserProfile);
            string[] roots = new string[]
            {
                Environment.GetFolderPath(Environment.SpecialFolder.MyVideos),
                string.IsNullOrEmpty(home) ? "" : Path.Combine(home, "Downloads"),
                Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory),
            };
            int budget = 1500;
            foreach (string r in roots)
            {
                if (string.IsNullOrEmpty(r) || !Directory.Exists(r)) continue;
                Queue<KeyValuePair<string, int>> q = new Queue<KeyValuePair<string, int>>();
                q.Enqueue(new KeyValuePair<string, int>(r, 0));
                while (q.Count > 0 && budget > 0)
                {
                    KeyValuePair<string, int> cur = q.Dequeue();
                    budget--;
                    string found = InDir(cur.Key, raw);
                    if (found.Length > 0) return found;
                    if (cur.Value >= 3) continue;
                    try
                    {
                        foreach (string d in Directory.EnumerateDirectories(cur.Key))
                        {
                            string name = FileName(d);
                            if (name.StartsWith(".") || name.StartsWith("$")) continue;
                            q.Enqueue(new KeyValuePair<string, int>(d, cur.Value + 1));
                        }
                    }
                    catch { }
                }
            }
            return "";
        }
    }

    // ------------------------------------------------------------------ Core Audio (volume + peak meter)
    [ComImport, Guid("A95664D2-9614-4F35-A746-DE8DB63617E6"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    internal interface IMMDeviceEnumerator
    {
        [PreserveSig] int EnumAudioEndpoints(int dataFlow, int dwStateMask, out IntPtr ppDevices);
        [PreserveSig] int GetDefaultAudioEndpoint(int dataFlow, int role, out IMMDevice ppEndpoint);
    }

    [ComImport, Guid("D666063F-1587-4E43-81F1-B948E807363F"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    internal interface IMMDevice
    {
        [PreserveSig] int Activate(ref Guid iid, int dwClsCtx, IntPtr pActivationParams, [MarshalAs(UnmanagedType.IUnknown)] out object ppInterface);
        [PreserveSig] int OpenPropertyStore(int stgmAccess, out IntPtr ppProperties);
        [PreserveSig] int GetId([MarshalAs(UnmanagedType.LPWStr)] out string ppstrId);
        [PreserveSig] int GetState(out int pdwState);
    }

    [ComImport, Guid("5CDF2C82-841E-4546-9722-0CF74078229A"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    internal interface IAudioEndpointVolume
    {
        [PreserveSig] int RegisterControlChangeNotify(IntPtr pNotify);
        [PreserveSig] int UnregisterControlChangeNotify(IntPtr pNotify);
        [PreserveSig] int GetChannelCount(out int pnChannelCount);
        [PreserveSig] int SetMasterVolumeLevel(float fLevelDB, IntPtr pguidEventContext);
        [PreserveSig] int SetMasterVolumeLevelScalar(float fLevel, IntPtr pguidEventContext);
        [PreserveSig] int GetMasterVolumeLevel(out float pfLevelDB);
        [PreserveSig] int GetMasterVolumeLevelScalar(out float pfLevel);
        [PreserveSig] int SetChannelVolumeLevel(int nChannel, float fLevelDB, IntPtr pguidEventContext);
        [PreserveSig] int SetChannelVolumeLevelScalar(int nChannel, float fLevel, IntPtr pguidEventContext);
        [PreserveSig] int GetChannelVolumeLevel(int nChannel, out float pfLevelDB);
        [PreserveSig] int GetChannelVolumeLevelScalar(int nChannel, out float pfLevel);
        [PreserveSig] int SetMute([MarshalAs(UnmanagedType.Bool)] bool bMute, IntPtr pguidEventContext);
        [PreserveSig] int GetMute([MarshalAs(UnmanagedType.Bool)] out bool pbMute);
    }

    [ComImport, Guid("C02216F6-8C67-4B5B-9D00-D008E73E0064"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    internal interface IAudioMeterInformation
    {
        [PreserveSig] int GetPeakValue(out float pfPeak);
        [PreserveSig] int GetMeteringChannelCount(out int pnChannelCount);
        [PreserveSig] int GetChannelsPeakValues(int u32ChannelCount, [Out, MarshalAs(UnmanagedType.LPArray, SizeParamIndex = 0)] float[] afPeakValues);
        [PreserveSig] int QueryHardwareSupport(out int pdwHardwareSupportMask);
    }

    public static class Audio
    {
        private static readonly Guid CLSID_MMDeviceEnumerator = new Guid("BCDE0395-E52F-467C-8E3D-C4579291692E");
        private static Guid IID_IAudioEndpointVolume = new Guid("5CDF2C82-841E-4546-9722-0CF74078229A");
        private static Guid IID_IAudioMeterInformation = new Guid("C02216F6-8C67-4B5B-9D00-D008E73E0064");
        private const int CLSCTX_ALL = 23;

        public static volatile bool MeterEnabled;
        // Environment.TickCount of the last moment the default output was audible (used by the player scanner)
        public static volatile int LastAudibleTick = int.MinValue;

        private static readonly ConcurrentQueue<Action> Pending = new ConcurrentQueue<Action>();
        private static IMMDeviceEnumerator _enumerator;
        private static IMMDevice _device;
        private static IAudioEndpointVolume _volume;
        private static IAudioMeterInformation _meter;
        private static string _deviceId = "";
        private static float _lastLevel = -1f;
        private static bool _lastMute;
        private static bool _force = true;
        private static bool _meterWasActive;

        public static void Start()
        {
            Thread t = new Thread(Loop);
            t.IsBackground = true;
            t.Name = "island-audio";
            t.SetApartmentState(ApartmentState.MTA);
            t.Start();
        }

        public static void ForceEmit() { _force = true; }

        public static void SetVolume(float level)
        {
            float v = Math.Max(0f, Math.Min(1f, level));
            Pending.Enqueue(delegate
            {
                if (_volume != null)
                {
                    _volume.SetMasterVolumeLevelScalar(v, IntPtr.Zero);
                    if (v > 0f) _volume.SetMute(false, IntPtr.Zero);
                }
            });
        }

        public static void Delta(float delta)
        {
            Pending.Enqueue(delegate
            {
                if (_volume == null) return;
                float cur;
                if (_volume.GetMasterVolumeLevelScalar(out cur) != 0) return;
                float v = Math.Max(0f, Math.Min(1f, cur + delta));
                _volume.SetMasterVolumeLevelScalar(v, IntPtr.Zero);
                if (delta > 0f) _volume.SetMute(false, IntPtr.Zero);
            });
        }

        public static void SetMute(bool mute)
        {
            Pending.Enqueue(delegate { if (_volume != null) _volume.SetMute(mute, IntPtr.Zero); });
        }

        public static void ToggleMute()
        {
            Pending.Enqueue(delegate
            {
                if (_volume == null) return;
                bool m;
                if (_volume.GetMute(out m) == 0) _volume.SetMute(!m, IntPtr.Zero);
            });
        }

        private static void Release()
        {
            try { if (_meter != null) Marshal.ReleaseComObject(_meter); } catch { }
            try { if (_volume != null) Marshal.ReleaseComObject(_volume); } catch { }
            try { if (_device != null) Marshal.ReleaseComObject(_device); } catch { }
            _meter = null; _volume = null; _device = null; _deviceId = "";
        }

        private static void Acquire()
        {
            if (_enumerator == null)
            {
                Type t = Type.GetTypeFromCLSID(CLSID_MMDeviceEnumerator);
                _enumerator = (IMMDeviceEnumerator)Activator.CreateInstance(t);
            }
            IMMDevice dev;
            // eRender = 0, eMultimedia = 1
            int hr = _enumerator.GetDefaultAudioEndpoint(0, 1, out dev);
            if (hr != 0 || dev == null) { Release(); return; }
            string id;
            dev.GetId(out id);
            if (id == _deviceId && _volume != null)
            {
                Marshal.ReleaseComObject(dev);
                return;
            }
            Release();
            _device = dev;
            _deviceId = id ?? "";
            object o;
            if (_device.Activate(ref IID_IAudioEndpointVolume, CLSCTX_ALL, IntPtr.Zero, out o) == 0)
                _volume = o as IAudioEndpointVolume;
            if (_device.Activate(ref IID_IAudioMeterInformation, CLSCTX_ALL, IntPtr.Zero, out o) == 0)
                _meter = o as IAudioMeterInformation;
            _force = true;
        }

        private static void Loop()
        {
            bool reported = false;
            Stopwatch sw = Stopwatch.StartNew();
            long nextAcquire = 0, nextVolume = 0;
            float[] peaks = new float[2];
            while (true)
            {
                try
                {
                    long now = sw.ElapsedMilliseconds;
                    if (now >= nextAcquire)
                    {
                        Acquire();
                        nextAcquire = now + 2500;
                        if (!reported)
                        {
                            reported = true;
                            Out.Status("audio", _volume != null, _volume != null ? "ok" : "no default output device");
                        }
                    }

                    Action a;
                    while (Pending.TryDequeue(out a))
                    {
                        try { a(); } catch (Exception ex) { Out.Log("warn", "audio command: " + ex.Message); }
                        nextVolume = 0;
                    }

                    if (now >= nextVolume && _volume != null)
                    {
                        nextVolume = now + 120;
                        float level; bool mute;
                        if (_volume.GetMasterVolumeLevelScalar(out level) == 0 && _volume.GetMute(out mute) == 0)
                        {
                            if (_force || Math.Abs(level - _lastLevel) > 0.004f || mute != _lastMute)
                            {
                                bool initial = _force && _lastLevel < 0f;
                                _lastLevel = level; _lastMute = mute; _force = false;
                                Out.Line(new JObj().S("type", "volume").N("level", Math.Round(level, 3)).B("muted", mute).B("initial", initial).ToString());
                            }
                        }
                    }

                    if (!MeterEnabled && _meter != null)
                    {
                        float p0;
                        if (_meter.GetPeakValue(out p0) == 0 && p0 > 0.002f) LastAudibleTick = Environment.TickCount;
                    }
                    if (MeterEnabled && _meter != null)
                    {
                        float peak;
                        if (_meter.GetPeakValue(out peak) == 0)
                        {
                            if (peak > 0.002f) LastAudibleTick = Environment.TickCount;
                            float l = peak, r = peak;
                            int count;
                            if (_meter.GetMeteringChannelCount(out count) == 0 && count >= 2)
                            {
                                if (_meter.GetChannelsPeakValues(2, peaks) == 0) { l = peaks[0]; r = peaks[1]; }
                            }
                            if (peak > 0.0005f || _meterWasActive)
                            {
                                Out.Line(new JObj().S("type", "meter").N("p", Math.Round(peak, 3)).N("l", Math.Round(l, 3)).N("r", Math.Round(r, 3)).ToString());
                            }
                            _meterWasActive = peak > 0.0005f;
                        }
                        Thread.Sleep(40);
                    }
                    else
                    {
                        Thread.Sleep(60);
                    }
                }
                catch (Exception ex)
                {
                    Out.Log("warn", "audio loop: " + ex.Message);
                    Release();
                    nextAcquire = 0;
                    Thread.Sleep(1500);
                }
            }
        }
    }

    // ------------------------------------------------------------------ system state
    public static class Sys
    {
        [StructLayout(LayoutKind.Sequential)]
        private struct SYSTEM_POWER_STATUS
        {
            public byte ACLineStatus;
            public byte BatteryFlag;
            public byte BatteryLifePercent;
            public byte SystemStatusFlag;
            public int BatteryLifeTime;
            public int BatteryFullLifeTime;
        }

        [DllImport("kernel32.dll")]
        private static extern bool GetSystemPowerStatus(out SYSTEM_POWER_STATUS status);

        [DllImport("shell32.dll")]
        private static extern int SHQueryUserNotificationState(out int state);

        [DllImport("user32.dll")]
        private static extern uint GetClipboardSequenceNumber();

        [StructLayout(LayoutKind.Sequential)]
        private struct RECT { public int Left, Top, Right, Bottom; }

        [StructLayout(LayoutKind.Sequential)]
        private struct MONITORINFO { public int cbSize; public RECT rcMonitor; public RECT rcWork; public int dwFlags; }

        [DllImport("user32.dll")]
        private static extern IntPtr GetForegroundWindow();

        [DllImport("user32.dll")]
        private static extern bool GetWindowRect(IntPtr hWnd, out RECT rect);

        [DllImport("user32.dll")]
        private static extern IntPtr MonitorFromWindow(IntPtr hWnd, uint flags);

        [DllImport("user32.dll", CharSet = CharSet.Unicode)]
        private static extern bool GetMonitorInfo(IntPtr hMonitor, ref MONITORINFO info);

        [DllImport("user32.dll", CharSet = CharSet.Unicode)]
        private static extern int GetClassName(IntPtr hWnd, StringBuilder name, int max);

        [DllImport("user32.dll")]
        private static extern bool IsWindowVisible(IntPtr hWnd);

        [DllImport("user32.dll")]
        private static extern bool IsIconic(IntPtr hWnd);

        [DllImport("user32.dll")]
        private static extern int GetWindowLong(IntPtr hWnd, int index);

        [DllImport("user32.dll")]
        private static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint pid);

        // Is the foreground window a real fullscreen window? Returns its monitor rect in mon.
        private static bool ForegroundCoversMonitor(out RECT mon, out bool captioned)
        {
            mon = new RECT();
            captioned = false;
            try
            {
                IntPtr fg = GetForegroundWindow();
                if (fg == IntPtr.Zero || !IsWindowVisible(fg) || IsIconic(fg)) return false;
                StringBuilder cls = new StringBuilder(128);
                GetClassName(fg, cls, cls.Capacity);
                string c = cls.ToString();
                if (c == "Progman" || c == "WorkerW" || c == "Shell_TrayWnd" || c == "Shell_SecondaryTrayWnd"
                    || c == "Windows.UI.Core.CoreWindow" || c == "XamlExplorerHostIslandWindow" || c == "TopLevelWindowForOverflowXamlIsland")
                    return false;
                uint pid;
                GetWindowThreadProcessId(fg, out pid);
                if (pid == (uint)Process.GetCurrentProcess().Id) return false;
                RECT r;
                if (!GetWindowRect(fg, out r)) return false;
                captioned = (GetWindowLong(fg, -16) & 0x00C00000) == 0x00C00000;
                IntPtr hm = MonitorFromWindow(fg, 2);
                MONITORINFO mi = new MONITORINFO();
                mi.cbSize = Marshal.SizeOf(typeof(MONITORINFO));
                if (hm == IntPtr.Zero || !GetMonitorInfo(hm, ref mi)) return false;
                mon = mi.rcMonitor;
                return r.Left <= mon.Left && r.Top <= mon.Top && r.Right >= mon.Right && r.Bottom >= mon.Bottom;
            }
            catch { return false; }
        }

        [DllImport("user32.dll", CharSet = CharSet.Unicode)]
        private static extern uint RegisterClipboardFormat(string name);

        [DllImport("user32.dll")]
        private static extern bool IsClipboardFormatAvailable(uint format);

        private static volatile bool _force = true;
        private static readonly Dictionary<string, string> NameCache = new Dictionary<string, string>();

        public static void Start()
        {
            Thread t = new Thread(Loop);
            t.IsBackground = true;
            t.Name = "island-system";
            t.Start();
            Out.Status("system", true, "ok");
        }

        public static void ForceEmit() { _force = true; }

        private static void Loop()
        {
            Stopwatch sw = Stopwatch.StartNew();
            long nextKeys = 0, nextFs = 0, nextBattery = 0, nextPrivacy = 0, nextNet = 0, nextClip = 0;
            uint lastClipSeq = 0; bool clipInit = false;
            uint fmtExclude = 0, fmtIgnore = 0;
            try
            {
                fmtExclude = RegisterClipboardFormat("ExcludeClipboardContentFromMonitorProcessing");
                fmtIgnore = RegisterClipboardFormat("Clipboard Viewer Ignore");
            }
            catch { }
            bool lastCaps = false, lastNum = false; bool keysInit = false;
            string lastFs = null;
            string lastBattery = null, lastPrivacy = null;
            long lastRx = -1, lastTx = -1; long lastNetMs = 0;
            long nextAccent = 0; string lastAccent = null;
            while (true)
            {
                try
                {
                    long now = sw.ElapsedMilliseconds;
                    bool force = _force; _force = false;

                    if (now >= nextKeys || force)
                    {
                        nextKeys = now + 110;
                        bool caps = System.Windows.Forms.Control.IsKeyLocked(System.Windows.Forms.Keys.CapsLock);
                        bool num = System.Windows.Forms.Control.IsKeyLocked(System.Windows.Forms.Keys.NumLock);
                        if (!keysInit || caps != lastCaps || num != lastNum || force)
                        {
                            Out.Line(new JObj().S("type", "keys").B("caps", caps).B("num", num).B("initial", !keysInit)
                                .S("changed", !keysInit ? "" : (caps != lastCaps ? "caps" : (num != lastNum ? "num" : ""))).ToString());
                            lastCaps = caps; lastNum = num; keysInit = true;
                        }
                    }

                    if (now >= nextFs || force)
                    {
                        nextFs = now + 900;
                        int q;
                        if (SHQueryUserNotificationState(out q) != 0) q = 5;
                        // 2 busy (fullscreen app), 3 D3D fullscreen, 4 presentation, 6 quiet time / focus.
                        // QUNS_BUSY has false positives (desktop focused, the taskbar, some launchers), so confirm
                        // that the foreground window really covers its monitor; also catch borderless fullscreen.
                        RECT mon; bool captioned;
                        bool covers = ForegroundCoversMonitor(out mon, out captioned);
                        // a maximized window with an auto-hidden taskbar also covers the monitor, but it keeps its caption
                        bool busy = q == 3 || q == 4 || (q == 2 && covers) || ((q == 5 || q == 1) && covers && !captioned);
                        string fsKey = q + "|" + busy + "|" + (busy ? mon.Left + "," + mon.Top + "," + mon.Right + "," + mon.Bottom : "");
                        if (fsKey != lastFs || force)
                        {
                            lastFs = fsKey;
                            JObj fo = new JObj().S("type", "fullscreen").B("busy", busy).B("quiet", q == 6).N("state", q);
                            if (busy && covers) fo.N("mx", mon.Left).N("my", mon.Top).N("mw", mon.Right - mon.Left).N("mh", mon.Bottom - mon.Top);
                            Out.Line(fo.ToString());
                        }
                    }

                    if (now >= nextBattery || force)
                    {
                        nextBattery = now + 4000;
                        SYSTEM_POWER_STATUS ps;
                        if (GetSystemPowerStatus(out ps))
                        {
                            bool has = (ps.BatteryFlag & 128) == 0 && ps.BatteryFlag != 255;
                            bool plugged = ps.ACLineStatus == 1;
                            bool charging = (ps.BatteryFlag & 8) != 0 || (plugged && has && ps.BatteryLifePercent < 100);
                            int pct = ps.BatteryLifePercent == 255 ? 100 : ps.BatteryLifePercent;
                            string key = has + "|" + plugged + "|" + charging + "|" + pct;
                            if (key != lastBattery || force)
                            {
                                lastBattery = key;
                                Out.Line(new JObj().S("type", "battery").B("has", has).B("plugged", plugged).B("charging", charging).N("percent", pct)
                                    .N("secondsLeft", ps.BatteryLifeTime).ToString());
                            }
                        }
                    }

                    if (now >= nextPrivacy || force)
                    {
                        nextPrivacy = now + 1500;
                        List<string> mic = InUse("microphone");
                        List<string> cam = InUse("webcam");
                        List<string> loc = InUse("location");
                        string key = string.Join(",", mic.ToArray()) + "|" + string.Join(",", cam.ToArray()) + "|" + string.Join(",", loc.ToArray());
                        if (key != lastPrivacy || force)
                        {
                            lastPrivacy = key;
                            Out.Line(new JObj().S("type", "privacy").Raw("mic", J.StrArr(mic)).Raw("cam", J.StrArr(cam)).Raw("loc", J.StrArr(loc)).ToString());
                        }
                    }

                    if (now >= nextAccent || force)
                    {
                        nextAccent = now + 10000;
                        string accent = AccentColor();
                        if (accent != null && (accent != lastAccent || force))
                        {
                            lastAccent = accent;
                            Out.Line(new JObj().S("type", "accent").S("color", accent).ToString());
                        }
                    }

                    if (now >= nextClip)
                    {
                        nextClip = now + 250;
                        uint seq = GetClipboardSequenceNumber();
                        if (!clipInit) { lastClipSeq = seq; clipInit = true; }
                        else if (seq != lastClipSeq)
                        {
                            lastClipSeq = seq;
                            bool sensitive = false;
                            try
                            {
                                // "CanIncludeInClipboardHistory" is only a privacy flag when its value is 0 (apps set 1 to allow);
                                // its value is checked on the STA worker, the two other formats mean "do not monitor".
                                sensitive = (fmtExclude != 0 && IsClipboardFormatAvailable(fmtExclude))
                                    || (fmtIgnore != 0 && IsClipboardFormatAvailable(fmtIgnore));
                            }
                            catch { }
                            uint s2 = seq; bool sens = sensitive;
                            Sta.Clip.Post(delegate { ClipCapture.Emit(s2, sens); });
                        }
                    }

                    if (now >= nextNet)
                    {
                        nextNet = now + 1500;
                        long rx = 0, tx = 0;
                        foreach (NetworkInterface ni in NetworkInterface.GetAllNetworkInterfaces())
                        {
                            if (ni.OperationalStatus != OperationalStatus.Up) continue;
                            if (ni.NetworkInterfaceType == NetworkInterfaceType.Loopback || ni.NetworkInterfaceType == NetworkInterfaceType.Tunnel) continue;
                            try
                            {
                                IPv4InterfaceStatistics st = ni.GetIPv4Statistics();
                                rx += st.BytesReceived; tx += st.BytesSent;
                            }
                            catch { }
                        }
                        if (lastRx >= 0 && now > lastNetMs)
                        {
                            double secs = (now - lastNetMs) / 1000.0;
                            double down = Math.Max(0, (rx - lastRx) / secs);
                            double up = Math.Max(0, (tx - lastTx) / secs);
                            Out.Line(new JObj().S("type", "net").N("down", Math.Round(down)).N("up", Math.Round(up)).ToString());
                        }
                        lastRx = rx; lastTx = tx; lastNetMs = now;
                    }

                    Thread.Sleep(50);
                }
                catch (Exception ex)
                {
                    Out.Log("warn", "system loop: " + ex.Message);
                    Thread.Sleep(2000);
                }
            }
        }

        // Windows accent color (DWM stores it as 0xAABBGGRR).
        private static string AccentColor()
        {
            try
            {
                using (RegistryKey k = Registry.CurrentUser.OpenSubKey(@"Software\Microsoft\Windows\DWM"))
                {
                    if (k == null) return null;
                    object v = k.GetValue("AccentColor");
                    if (v == null) v = k.GetValue("ColorizationColor");
                    if (v == null) return null;
                    uint c = unchecked((uint)Convert.ToInt32(v));
                    bool abgr = k.GetValue("AccentColor") != null;
                    byte r, g, b;
                    if (abgr) { r = (byte)(c & 0xFF); g = (byte)((c >> 8) & 0xFF); b = (byte)((c >> 16) & 0xFF); }
                    else { b = (byte)(c & 0xFF); g = (byte)((c >> 8) & 0xFF); r = (byte)((c >> 16) & 0xFF); }
                    return "#" + r.ToString("x2") + g.ToString("x2") + b.ToString("x2");
                }
            }
            catch { return null; }
        }

        // Apps currently using a capability (mic / camera / location), from the
        // CapabilityAccessManager consent store (same source as the Windows privacy tray icon).
        private static List<string> InUse(string capability)
        {
            List<string> result = new List<string>();
            string root = @"Software\Microsoft\Windows\CurrentVersion\CapabilityAccessManager\ConsentStore\" + capability;
            try
            {
                using (RegistryKey k = Registry.CurrentUser.OpenSubKey(root))
                {
                    if (k == null) return result;
                    foreach (string sub in k.GetSubKeyNames())
                    {
                        if (sub == "NonPackaged")
                        {
                            using (RegistryKey np = k.OpenSubKey(sub))
                            {
                                if (np == null) continue;
                                foreach (string exeKey in np.GetSubKeyNames())
                                {
                                    using (RegistryKey e = np.OpenSubKey(exeKey))
                                    {
                                        if (IsActive(e)) AddUnique(result, ExeName(exeKey.Replace('#', '\\')));
                                    }
                                }
                            }
                        }
                        else
                        {
                            using (RegistryKey e = k.OpenSubKey(sub))
                            {
                                if (IsActive(e)) AddUnique(result, AppInfo.PrettyPackageName(sub));
                            }
                        }
                    }
                }
            }
            catch { }
            return result;
        }

        private static void AddUnique(List<string> list, string v)
        {
            if (!string.IsNullOrEmpty(v) && !list.Contains(v)) list.Add(v);
        }

        private static bool IsActive(RegistryKey e)
        {
            if (e == null) return false;
            object start = e.GetValue("LastUsedTimeStart");
            object stop = e.GetValue("LastUsedTimeStop");
            if (start == null || stop == null) return false;
            long s = Convert.ToInt64(start);
            long t = Convert.ToInt64(stop);
            return s > 0 && t == 0;
        }

        public static string ExeName(string path)
        {
            string cached;
            lock (NameCache)
            {
                if (NameCache.TryGetValue(path, out cached)) return cached;
            }
            string name = Path.GetFileNameWithoutExtension(path);
            try
            {
                if (File.Exists(path))
                {
                    FileVersionInfo fvi = FileVersionInfo.GetVersionInfo(path);
                    if (!string.IsNullOrEmpty(fvi.FileDescription) && fvi.FileDescription.Length < 40) name = fvi.FileDescription;
                    else if (!string.IsNullOrEmpty(fvi.ProductName) && fvi.ProductName.Length < 40) name = fvi.ProductName;
                }
            }
            catch { }
            lock (NameCache) { NameCache[path] = name; }
            return name;
        }
    }

    // ------------------------------------------------------------------ app identity helpers
    public static class AppInfo
    {
        private static readonly Dictionary<string, string> KnownFolders = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        private static readonly Dictionary<string, string> Known = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);

        static AppInfo()
        {
            string pf = Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles);
            string pfx86 = Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86);
            string win = Environment.GetFolderPath(Environment.SpecialFolder.Windows);
            string local = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
            string roaming = Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData);
            KnownFolders["{6D809377-6AF0-444B-8957-A3773F02200E}"] = pf;
            KnownFolders["{905E63B6-C1BF-494E-B29C-65B732D3D21A}"] = pf;
            KnownFolders["{7C5A40EF-A0FB-4BFC-874A-C0F2E0B9FA8E}"] = pfx86;
            KnownFolders["{F38BF404-1D43-42F2-9305-67DE0B28FC23}"] = win;
            KnownFolders["{1AC14E77-02E7-4E5D-B744-2EB1AE5198B7}"] = Path.Combine(win, "System32");
            KnownFolders["{D65231B0-B2F1-4857-A4CE-A8E7C6EA7D27}"] = Path.Combine(win, "SysWOW64");
            KnownFolders["{F1B32785-6FBA-4FCF-9D55-7B8E7F157091}"] = local;
            KnownFolders["{3EB685DB-65F9-4CF6-A03A-E3EF65729F3D}"] = roaming;
            KnownFolders["{5CD7AEE2-2219-4A67-B85D-6C9CE15660CB}"] = Path.Combine(local, "Programs");

            Known["Microsoft.YourPhone_8wekyb3d8bbwe"] = "Phone Link";
            Known["MicrosoftWindows.CrossDevice_cw5n1h2txyewy"] = "Phone Link";
            Known["5319275A.WhatsAppDesktop_cv1g1gvanyjgm"] = "WhatsApp";
            Known["TelegramMessengerLLP.TelegramDesktop_t4vj0pshhgkwm"] = "Telegram";
            Known["Telegram.TelegramDesktop"] = "Telegram";
            Known["Telegram.TelegramDesktop.Store"] = "Telegram";
            Known["microsoft.windowscommunicationsapps_8wekyb3d8bbwe"] = "Mail";
            Known["Microsoft.OutlookForWindows_8wekyb3d8bbwe"] = "Outlook";
            Known["MSTeams_8wekyb3d8bbwe"] = "Teams";
            Known["com.squirrel.Discord.Discord"] = "Discord";
            Known["Chrome"] = "Google Chrome";
            Known["MSEdge"] = "Microsoft Edge";
            Known["308046B0AF4A39CB"] = "Firefox";
            Known["Microsoft.WindowsStore_8wekyb3d8bbwe"] = "Microsoft Store";
            Known["Microsoft.WindowsTerminal_8wekyb3d8bbwe"] = "Terminal";
            Known["Microsoft.ScreenSketch_8wekyb3d8bbwe"] = "Snipping Tool";
            Known["Microsoft.WindowsAlarms_8wekyb3d8bbwe"] = "Clock";
            Known["SpotifyAB.SpotifyMusic_zpdnekdrzrea0"] = "Spotify";
            Known["Spotify"] = "Spotify";
            Known["Microsoft.ZuneMusic_8wekyb3d8bbwe"] = "Media Player";
            Known["Microsoft.Windows.Explorer"] = "File Explorer";
        }

        public static bool IsPhone(string aumid)
        {
            if (string.IsNullOrEmpty(aumid)) return false;
            return aumid.IndexOf("YourPhone", StringComparison.OrdinalIgnoreCase) >= 0
                || aumid.IndexOf("CrossDevice", StringComparison.OrdinalIgnoreCase) >= 0
                || aumid.IndexOf("PhoneLink", StringComparison.OrdinalIgnoreCase) >= 0;
        }

        public static string PackageFamily(string aumid)
        {
            if (string.IsNullOrEmpty(aumid)) return null;
            int bang = aumid.IndexOf('!');
            string pfn = bang > 0 ? aumid.Substring(0, bang) : aumid;
            return pfn.IndexOf('_') > 0 ? pfn : null;
        }

        public static string ExePath(string aumid)
        {
            if (string.IsNullOrEmpty(aumid)) return null;
            string p = aumid;
            if (p.StartsWith("{"))
            {
                int close = p.IndexOf('}');
                if (close > 0)
                {
                    string guid = p.Substring(0, close + 1);
                    string folder;
                    if (KnownFolders.TryGetValue(guid, out folder)) p = folder + p.Substring(close + 1);
                    else return null;
                }
            }
            if (p.Length > 3 && p[1] == ':' && p.EndsWith(".exe", StringComparison.OrdinalIgnoreCase))
            {
                try { if (File.Exists(p)) return p; } catch { }
            }
            return null;
        }

        public static string PrettyPackageName(string pfnOrId)
        {
            if (string.IsNullOrEmpty(pfnOrId)) return "";
            string known;
            string pfn = pfnOrId;
            int bang = pfn.IndexOf('!');
            if (bang > 0) pfn = pfn.Substring(0, bang);
            if (Known.TryGetValue(pfn, out known)) return known;
            if (Known.TryGetValue(pfnOrId, out known)) return known;
            string s = pfn;
            int us = s.IndexOf('_');
            if (us > 0) s = s.Substring(0, us);
            int dot = s.LastIndexOf('.');
            if (dot >= 0 && dot < s.Length - 1) s = s.Substring(dot + 1);
            // split CamelCase
            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < s.Length; i++)
            {
                char c = s[i];
                if (i > 0 && char.IsUpper(c) && char.IsLower(s[i - 1])) sb.Append(' ');
                sb.Append(c);
            }
            string r = sb.ToString().Replace("Desktop", "").Trim();
            return r.Length == 0 ? s : r;
        }

        public static string DisplayName(string aumid)
        {
            if (string.IsNullOrEmpty(aumid)) return "";
            if (IsPhone(aumid)) return "Phone Link";
            if (aumid.StartsWith("Windows.SystemToast", StringComparison.OrdinalIgnoreCase)) return "Windows";
            string known;
            if (Known.TryGetValue(aumid, out known)) return known;
            string exe = ExePath(aumid);
            if (exe != null) return Sys.ExeName(exe);
            foreach (KeyValuePair<string, string> kv in Known)
            {
                if (aumid.StartsWith(kv.Key + ".", StringComparison.OrdinalIgnoreCase)) return kv.Value;
            }
            int bs = aumid.LastIndexOf('\\');
            if (bs >= 0)
            {
                string fn = aumid.Substring(bs + 1);
                if (fn.EndsWith(".exe", StringComparison.OrdinalIgnoreCase)) fn = fn.Substring(0, fn.Length - 4);
                return fn;
            }
            return PrettyPackageName(aumid);
        }

        // Resolves toast image URIs to local file paths when possible.
        public static string ResolveImage(string src, string aumid)
        {
            if (string.IsNullOrEmpty(src)) return null;
            try
            {
                string pfn = PackageFamily(aumid);
                string lower = src.ToLowerInvariant();
                if (lower.StartsWith("ms-appdata:///") && pfn != null)
                {
                    string rest = Uri.UnescapeDataString(src.Substring("ms-appdata:///".Length)).Replace('/', '\\');
                    string pkg = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "Packages", pfn);
                    string[] map = { "local\\", "LocalState\\", "temp\\", "TempState\\", "roaming\\", "RoamingState\\", "localcache\\", "LocalCache\\" };
                    for (int i = 0; i < map.Length; i += 2)
                    {
                        if (rest.StartsWith(map[i], StringComparison.OrdinalIgnoreCase))
                        {
                            string p = Path.Combine(pkg, map[i + 1] + rest.Substring(map[i].Length));
                            if (File.Exists(p)) return p;
                        }
                    }
                    return null;
                }
                if (lower.StartsWith("file:///"))
                {
                    string p = new Uri(src).LocalPath;
                    return File.Exists(p) ? p : null;
                }
                if (src.Length > 3 && src[1] == ':' && File.Exists(src)) return src;
            }
            catch { }
            return null;
        }
    }

    // ------------------------------------------------------------------ notifications (Windows notification DB)
    internal static class Sqlite
    {
        public const int SQLITE_OK = 0, SQLITE_ROW = 100, SQLITE_DONE = 101;
        public const int SQLITE_OPEN_READONLY = 0x1;

        [DllImport("winsqlite3.dll", EntryPoint = "sqlite3_open_v2", CallingConvention = CallingConvention.StdCall)]
        public static extern int Open(byte[] filename, out IntPtr db, int flags, IntPtr vfs);
        [DllImport("winsqlite3.dll", EntryPoint = "sqlite3_close", CallingConvention = CallingConvention.StdCall)]
        public static extern int Close(IntPtr db);
        [DllImport("winsqlite3.dll", EntryPoint = "sqlite3_busy_timeout", CallingConvention = CallingConvention.StdCall)]
        public static extern int BusyTimeout(IntPtr db, int ms);
        [DllImport("winsqlite3.dll", EntryPoint = "sqlite3_prepare_v2", CallingConvention = CallingConvention.StdCall)]
        public static extern int Prepare(IntPtr db, byte[] sql, int nBytes, out IntPtr stmt, IntPtr tail);
        [DllImport("winsqlite3.dll", EntryPoint = "sqlite3_step", CallingConvention = CallingConvention.StdCall)]
        public static extern int Step(IntPtr stmt);
        [DllImport("winsqlite3.dll", EntryPoint = "sqlite3_reset", CallingConvention = CallingConvention.StdCall)]
        public static extern int Reset(IntPtr stmt);
        [DllImport("winsqlite3.dll", EntryPoint = "sqlite3_finalize", CallingConvention = CallingConvention.StdCall)]
        public static extern int FinalizeStmt(IntPtr stmt);
        [DllImport("winsqlite3.dll", EntryPoint = "sqlite3_bind_int64", CallingConvention = CallingConvention.StdCall)]
        public static extern int BindInt64(IntPtr stmt, int index, long value);
        [DllImport("winsqlite3.dll", EntryPoint = "sqlite3_column_int64", CallingConvention = CallingConvention.StdCall)]
        public static extern long ColumnInt64(IntPtr stmt, int col);
        [DllImport("winsqlite3.dll", EntryPoint = "sqlite3_column_blob", CallingConvention = CallingConvention.StdCall)]
        public static extern IntPtr ColumnBlob(IntPtr stmt, int col);
        [DllImport("winsqlite3.dll", EntryPoint = "sqlite3_column_text", CallingConvention = CallingConvention.StdCall)]
        public static extern IntPtr ColumnText(IntPtr stmt, int col);
        [DllImport("winsqlite3.dll", EntryPoint = "sqlite3_column_bytes", CallingConvention = CallingConvention.StdCall)]
        public static extern int ColumnBytes(IntPtr stmt, int col);
        [DllImport("winsqlite3.dll", EntryPoint = "sqlite3_errmsg", CallingConvention = CallingConvention.StdCall)]
        public static extern IntPtr ErrMsg(IntPtr db);

        public static byte[] Utf8Z(string s)
        {
            byte[] b = Encoding.UTF8.GetBytes(s);
            byte[] z = new byte[b.Length + 1];
            Buffer.BlockCopy(b, 0, z, 0, b.Length);
            return z;
        }

        public static string Error(IntPtr db)
        {
            try
            {
                IntPtr p = ErrMsg(db);
                if (p == IntPtr.Zero) return "unknown";
                int len = 0;
                while (Marshal.ReadByte(p, len) != 0) len++;
                byte[] buf = new byte[len];
                Marshal.Copy(p, buf, 0, len);
                return Encoding.UTF8.GetString(buf);
            }
            catch { return "unknown"; }
        }

        public static byte[] Bytes(IntPtr stmt, int col, bool text)
        {
            IntPtr p = text ? ColumnText(stmt, col) : ColumnBlob(stmt, col);
            int n = ColumnBytes(stmt, col);
            if (p == IntPtr.Zero || n <= 0) return new byte[0];
            byte[] buf = new byte[n];
            Marshal.Copy(p, buf, 0, n);
            return buf;
        }
    }

    public static class Notifs
    {
        private static string _dbPath;
        private static IntPtr _db = IntPtr.Zero;
        // Cursor = newest ArrivalTime seen. Ids are SQLite rowids and get reused when the newest toast is
        // dismissed or replaced (same tag), so an Id cursor silently misses notifications.
        private static long _lastArrival = -1;
        private static readonly HashSet<long> SeenAtCursor = new HashSet<long>();
        private static readonly Dictionary<long, string> ActiveCalls = new Dictionary<long, string>();
        private static volatile string _recentRequest;
        private static bool _usingCopy;

        public static void Start()
        {
            _dbPath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), @"Microsoft\Windows\Notifications\wpndatabase.db");
            Thread t = new Thread(Loop);
            t.IsBackground = true;
            t.Name = "island-notifications";
            t.Start();
        }

        public static void RequestRecent(string count) { _recentRequest = count; }

        private static void CloseDb()
        {
            if (_db != IntPtr.Zero) { try { Sqlite.Close(_db); } catch { } }
            _db = IntPtr.Zero;
        }

        private static bool OpenDb()
        {
            CloseDb();
            if (!File.Exists(_dbPath)) throw new Exception("notification database not found: " + _dbPath);
            string path = _dbPath;
            if (_usingCopy) path = CopyDb();
            IntPtr db;
            int rc = Sqlite.Open(Sqlite.Utf8Z(path), out db, Sqlite.SQLITE_OPEN_READONLY, IntPtr.Zero);
            if (rc != Sqlite.SQLITE_OK)
            {
                string err = db != IntPtr.Zero ? Sqlite.Error(db) : ("rc=" + rc);
                if (db != IntPtr.Zero) Sqlite.Close(db);
                throw new Exception("open failed: " + err);
            }
            Sqlite.BusyTimeout(db, 300);
            _db = db;
            return true;
        }

        // Fallback when the live DB cannot be read directly: read a snapshot copy (db + wal).
        private static string CopyDb()
        {
            string dir = Path.Combine(Path.GetTempPath(), "Blinkelo", "thumbs");
            Directory.CreateDirectory(dir);
            string dst = Path.Combine(dir, "wpn-snapshot.db");
            CopyShared(_dbPath, dst);
            if (File.Exists(_dbPath + "-wal")) CopyShared(_dbPath + "-wal", dst + "-wal");
            else if (File.Exists(dst + "-wal")) File.Delete(dst + "-wal");
            if (File.Exists(dst + "-shm")) { try { File.Delete(dst + "-shm"); } catch { } }
            return dst;
        }

        private static void CopyShared(string src, string dst)
        {
            using (FileStream i = new FileStream(src, FileMode.Open, FileAccess.Read, FileShare.ReadWrite | FileShare.Delete))
            using (FileStream o = new FileStream(dst, FileMode.Create, FileAccess.Write, FileShare.None))
            {
                i.CopyTo(o);
            }
        }

        private static long ScalarLong(string sql, long bind, bool hasBind)
        {
            IntPtr stmt;
            byte[] q = Sqlite.Utf8Z(sql);
            int rc = Sqlite.Prepare(_db, q, q.Length, out stmt, IntPtr.Zero);
            if (rc != Sqlite.SQLITE_OK) throw new Exception("prepare: " + Sqlite.Error(_db));
            try
            {
                if (hasBind) Sqlite.BindInt64(stmt, 1, bind);
                rc = Sqlite.Step(stmt);
                if (rc == Sqlite.SQLITE_ROW) return Sqlite.ColumnInt64(stmt, 0);
                if (rc == Sqlite.SQLITE_DONE) return 0;
                throw new Exception("step: " + Sqlite.Error(_db));
            }
            finally { Sqlite.FinalizeStmt(stmt); }
        }

        private static void Loop()
        {
            bool reported = false;
            int failures = 0;

            while (true)
            {
                try
                {
                    if (_usingCopy || _db == IntPtr.Zero) OpenDb();
                    if (_lastArrival < 0) SeedCursor();
                    Poll();
                    CheckCalls();
                    string req = _recentRequest;
                    if (req != null) { _recentRequest = null; EmitRecent(req); }
                    if (!reported) { reported = true; Out.Status("notifications", true, _usingCopy ? "ok (snapshot mode)" : "ok"); }
                    failures = 0;
                    if (_usingCopy) CloseDb();
                }
                catch (Exception ex)
                {
                    failures++;
                    CloseDb();
                    if (!_usingCopy && failures >= 2)
                    {
                        _usingCopy = true;
                        Out.Log("warn", "live notification DB not readable (" + ex.Message + "), switching to snapshot mode");
                    }
                    else if (failures == 4 || failures % 30 == 0)
                    {
                        Out.Status("notifications", false, ex.Message);
                        reported = true;
                    }
                    Thread.Sleep(Math.Min(10000, 1000 * failures));
                    continue;
                }
                Thread.Sleep(_usingCopy ? 1500 : 700);
            }
        }

        private const string SelectSql =
            "SELECT n.Id, n.ArrivalTime, n.Payload, h.PrimaryId FROM Notification n " +
            "JOIN NotificationHandler h ON n.HandlerId = h.RecordId " +
            "WHERE n.Type = 'toast' AND n.ArrivalTime >= ?1 ORDER BY n.ArrivalTime ASC, n.Id ASC LIMIT 40";

        private static void SeedCursor()
        {
            _lastArrival = ScalarLong("SELECT IFNULL(MAX(ArrivalTime),0) FROM Notification WHERE Type = 'toast'", 0, false);
            SeenAtCursor.Clear();
            IntPtr stmt;
            byte[] q = Sqlite.Utf8Z("SELECT Id FROM Notification WHERE Type = 'toast' AND ArrivalTime = ?1");
            if (Sqlite.Prepare(_db, q, q.Length, out stmt, IntPtr.Zero) != Sqlite.SQLITE_OK) return;
            try
            {
                Sqlite.BindInt64(stmt, 1, _lastArrival);
                while (Sqlite.Step(stmt) == Sqlite.SQLITE_ROW) SeenAtCursor.Add(Sqlite.ColumnInt64(stmt, 0));
            }
            finally { Sqlite.FinalizeStmt(stmt); }
        }

        private static void Poll()
        {
            long max = ScalarLong("SELECT IFNULL(MAX(ArrivalTime),0) FROM Notification WHERE Type = 'toast'", 0, false);
            if (max < _lastArrival) { SeedCursor(); return; } // database reset or clock moved back
            if (max == _lastArrival && SeenAtCursor.Count > 0)
            {
                // fast path: nothing newer; only a same-timestamp sibling could be new (rare), checked below
                long n = ScalarLong("SELECT COUNT(*) FROM Notification WHERE Type = 'toast' AND ArrivalTime = ?1", _lastArrival, true);
                if (n <= SeenAtCursor.Count) return;
            }

            IntPtr stmt;
            byte[] q = Sqlite.Utf8Z(SelectSql);
            if (Sqlite.Prepare(_db, q, q.Length, out stmt, IntPtr.Zero) != Sqlite.SQLITE_OK)
                throw new Exception("prepare: " + Sqlite.Error(_db));
            List<string> lines = new List<string>();
            try
            {
                Sqlite.BindInt64(stmt, 1, _lastArrival);
                int rc;
                while ((rc = Sqlite.Step(stmt)) == Sqlite.SQLITE_ROW)
                {
                    long id = Sqlite.ColumnInt64(stmt, 0);
                    long arrival = Sqlite.ColumnInt64(stmt, 1);
                    if (arrival == _lastArrival && SeenAtCursor.Contains(id)) continue;
                    if (arrival > _lastArrival) { _lastArrival = arrival; SeenAtCursor.Clear(); }
                    SeenAtCursor.Add(id);
                    byte[] payload = Sqlite.Bytes(stmt, 2, false);
                    string aumid = Encoding.UTF8.GetString(Sqlite.Bytes(stmt, 3, true));
                    long unixMs = FileTimeToUnixMs(arrival);
                    long age = UnixNowMs() - unixMs;
                    if (unixMs > 0 && age > 120000) continue; // stale (synced from history), skip
                    string json = BuildToastJson(id, unixMs, DecodePayload(payload), aumid, "toast");
                    if (json != null) lines.Add(json);
                }
                if (rc != Sqlite.SQLITE_DONE) throw new Exception("step: " + Sqlite.Error(_db));
            }
            finally { Sqlite.FinalizeStmt(stmt); }
            foreach (string l in lines) Out.Line(l);
        }

        private static void EmitRecent(string countStr)
        {
            int count;
            if (!int.TryParse(countStr, out count)) count = 20;
            count = Math.Max(1, Math.Min(50, count));
            string sql = "SELECT n.Id, n.ArrivalTime, n.Payload, h.PrimaryId FROM Notification n " +
                         "JOIN NotificationHandler h ON n.HandlerId = h.RecordId WHERE n.Type = 'toast' ORDER BY n.Id DESC LIMIT " + count;
            IntPtr stmt;
            byte[] q = Sqlite.Utf8Z(sql);
            if (Sqlite.Prepare(_db, q, q.Length, out stmt, IntPtr.Zero) != Sqlite.SQLITE_OK) return;
            List<string> items = new List<string>();
            try
            {
                while (Sqlite.Step(stmt) == Sqlite.SQLITE_ROW)
                {
                    long id = Sqlite.ColumnInt64(stmt, 0);
                    long arrival = Sqlite.ColumnInt64(stmt, 1);
                    byte[] payload = Sqlite.Bytes(stmt, 2, false);
                    string aumid = Encoding.UTF8.GetString(Sqlite.Bytes(stmt, 3, true));
                    string json = BuildToastJson(id, FileTimeToUnixMs(arrival), DecodePayload(payload), aumid, "history");
                    if (json != null) items.Add(json);
                }
            }
            finally { Sqlite.FinalizeStmt(stmt); }
            Out.Line(new JObj().S("type", "toastHistory").Raw("items", J.RawArr(items)).ToString());
        }

        private static void CheckCalls()
        {
            if (ActiveCalls.Count == 0) return;
            List<long> gone = new List<long>();
            foreach (long id in ActiveCalls.Keys)
            {
                if (ScalarLong("SELECT COUNT(*) FROM Notification WHERE Id = ?1", id, true) == 0) gone.Add(id);
            }
            foreach (long id in gone)
            {
                ActiveCalls.Remove(id);
                Out.Line(new JObj().S("type", "toastRemoved").N("id", id).ToString());
            }
        }

        private static long FileTimeToUnixMs(long ft)
        {
            if (ft <= 116444736000000000L) return 0;
            return (ft - 116444736000000000L) / 10000L;
        }

        private static long UnixNowMs()
        {
            return (DateTime.UtcNow.ToFileTimeUtc() - 116444736000000000L) / 10000L;
        }

        private static string DecodePayload(byte[] b)
        {
            if (b == null || b.Length == 0) return "";
            if (b.Length >= 2 && b[0] == 0xFF && b[1] == 0xFE) return Encoding.Unicode.GetString(b, 2, b.Length - 2);
            if (b.Length >= 3 && b[0] == 0xEF && b[1] == 0xBB && b[2] == 0xBF) return Encoding.UTF8.GetString(b, 3, b.Length - 3);
            if (b.Length >= 4 && b[1] == 0 && b[3] == 0) return Encoding.Unicode.GetString(b);
            return Encoding.UTF8.GetString(b);
        }

        private static string Attr(XmlElement e, string name)
        {
            if (e == null) return "";
            return e.GetAttribute(name) ?? "";
        }

        public static string BuildToastJson(long id, long unixMs, string xml, string aumid, string type)
        {
            if (string.IsNullOrEmpty(xml)) return null;
            XmlDocument doc = new XmlDocument();
            try { doc.LoadXml(xml); }
            catch { return null; }
            XmlElement toast = doc.DocumentElement;
            if (toast == null || toast.Name != "toast") return null;

            bool phone = AppInfo.IsPhone(aumid);
            string scenario = Attr(toast, "scenario");
            string launch = Attr(toast, "launch");

            List<string> texts = new List<string>();
            string attribution = "";
            List<string> images = new List<string>();
            XmlNodeList bindings = doc.GetElementsByTagName("binding");
            XmlElement binding = bindings.Count > 0 ? bindings[0] as XmlElement : null;
            if (binding != null)
            {
                foreach (XmlNode n in binding.ChildNodes)
                {
                    XmlElement el = n as XmlElement;
                    if (el == null) continue;
                    if (el.Name == "text")
                    {
                        string placement = Attr(el, "placement");
                        string t = el.InnerText ?? "";
                        if (placement == "attribution") attribution = t;
                        else if (t.Length > 0) texts.Add(t);
                    }
                    else if (el.Name == "image")
                    {
                        string src = Attr(el, "src");
                        images.Add(new JObj().S("src", src).S("path", AppInfo.ResolveImage(src, aumid))
                            .S("placement", Attr(el, "placement")).S("crop", Attr(el, "hint-crop")).ToString());
                    }
                    else if (el.Name == "group" || el.Name == "subgroup")
                    {
                        foreach (XmlNode tn in el.GetElementsByTagName("text"))
                        {
                            string t = tn.InnerText ?? "";
                            if (t.Length > 0) texts.Add(t);
                        }
                    }
                }
            }

            List<string> actions = new List<string>();
            List<string> inputs = new List<string>();
            bool hasSuccess = false, hasCritical = false, callWords = false;
            foreach (XmlNode n in doc.GetElementsByTagName("action"))
            {
                XmlElement a = n as XmlElement;
                if (a == null) continue;
                string style = Attr(a, "hint-buttonStyle");
                if (style.Equals("Success", StringComparison.OrdinalIgnoreCase)) hasSuccess = true;
                if (style.Equals("Critical", StringComparison.OrdinalIgnoreCase)) hasCritical = true;
                string args = Attr(a, "arguments");
                string content = Attr(a, "content");
                string al = (args + " " + content).ToLowerInvariant();
                if (al.Contains("accept") || al.Contains("answer") || al.Contains("decline")) callWords = true;
                string img = Attr(a, "imageUri");
                actions.Add(new JObj().S("content", content).S("args", args).S("type", Attr(a, "activationType"))
                    .S("placement", Attr(a, "placement")).S("style", style).S("inputId", Attr(a, "hint-inputId"))
                    .S("image", img).S("imagePath", AppInfo.ResolveImage(img, aumid)).ToString());
            }
            foreach (XmlNode n in doc.GetElementsByTagName("input"))
            {
                XmlElement i = n as XmlElement;
                if (i == null) continue;
                inputs.Add(new JObj().S("id", Attr(i, "id")).S("type", Attr(i, "type"))
                    .S("placeholder", Attr(i, "placeHolderContent")).S("title", Attr(i, "title")).ToString());
            }
            string header = "";
            XmlNodeList headers = doc.GetElementsByTagName("header");
            if (headers.Count > 0) header = Attr(headers[0] as XmlElement, "title");

            bool isCall = scenario.Equals("incomingCall", StringComparison.OrdinalIgnoreCase)
                || (phone && hasSuccess && hasCritical)
                || (phone && callWords && launch.ToLowerInvariant().Contains("call"));

            if (isCall && type == "toast")
            {
                ActiveCalls[id] = aumid;
            }

            JObj app = new JObj().S("aumid", aumid).S("name", AppInfo.DisplayName(aumid)).S("exe", AppInfo.ExePath(aumid))
                .S("family", AppInfo.PackageFamily(aumid)).B("phone", phone);

            return new JObj().S("type", type).N("id", id).N("time", unixMs).Raw("app", app.ToString())
                .S("scenario", scenario).B("call", isCall).S("launch", launch)
                .Raw("texts", J.StrArr(texts)).S("attribution", attribution).S("header", header)
                .Raw("images", J.RawArr(images)).Raw("actions", J.RawArr(actions)).Raw("inputs", J.RawArr(inputs))
                .ToString();
        }
    }

    // ------------------------------------------------------------------ remote input (phone touchpad / keyboard)
    public static class Input
    {
        [StructLayout(LayoutKind.Sequential)]
        private struct MOUSEINPUT { public int dx; public int dy; public uint mouseData; public uint dwFlags; public uint time; public IntPtr dwExtraInfo; }

        [StructLayout(LayoutKind.Sequential)]
        private struct KEYBDINPUT { public ushort wVk; public ushort wScan; public uint dwFlags; public uint time; public IntPtr dwExtraInfo; }

        [StructLayout(LayoutKind.Explicit)]
        private struct InputUnion { [FieldOffset(0)] public MOUSEINPUT mi; [FieldOffset(0)] public KEYBDINPUT ki; }

        [StructLayout(LayoutKind.Sequential)]
        private struct INPUT { public uint type; public InputUnion u; }

        [DllImport("user32.dll", SetLastError = true)]
        private static extern uint SendInput(uint count, INPUT[] inputs, int size);

        [DllImport("user32.dll", CharSet = CharSet.Unicode)]
        private static extern short VkKeyScanW(char ch);

        private const uint MOVE = 0x1, LDOWN = 0x2, LUP = 0x4, RDOWN = 0x8, RUP = 0x10, MDOWN = 0x20, MUP = 0x40, WHEEL = 0x800, HWHEEL = 0x1000;
        private const uint K_EXT = 0x1, K_UP = 0x2, K_UNI = 0x4;
        private static float _accX, _accY;

        private static INPUT M(uint flags, int dx, int dy, int data)
        {
            INPUT i = new INPUT();
            i.type = 0;
            i.u.mi.dx = dx; i.u.mi.dy = dy; i.u.mi.mouseData = unchecked((uint)data); i.u.mi.dwFlags = flags;
            return i;
        }

        private static INPUT K(ushort vk, ushort scan, uint flags)
        {
            INPUT i = new INPUT();
            i.type = 1;
            i.u.ki.wVk = vk; i.u.ki.wScan = scan; i.u.ki.dwFlags = flags;
            return i;
        }

        private static void Send(List<INPUT> list)
        {
            if (list.Count == 0) return;
            SendInput((uint)list.Count, list.ToArray(), Marshal.SizeOf(typeof(INPUT)));
        }

        public static void Mouse(string kind, float dx, float dy)
        {
            List<INPUT> l = new List<INPUT>();
            switch (kind)
            {
                case "move":
                    {
                        _accX += dx; _accY += dy;
                        int ix = (int)_accX, iy = (int)_accY;
                        _accX -= ix; _accY -= iy;
                        if (ix != 0 || iy != 0) l.Add(M(MOVE, ix, iy, 0));
                        break;
                    }
                case "scroll":
                    // natural direction is decided on the phone; 30 px of finger travel ~ one wheel notch
                    if (Math.Abs(dy) >= 0.5f) l.Add(M(WHEEL, 0, 0, (int)Math.Round(-dy * 4)));
                    if (Math.Abs(dx) >= 0.5f) l.Add(M(HWHEEL, 0, 0, (int)Math.Round(dx * 4)));
                    break;
                case "left": l.Add(M(LDOWN, 0, 0, 0)); l.Add(M(LUP, 0, 0, 0)); break;
                case "double": l.Add(M(LDOWN, 0, 0, 0)); l.Add(M(LUP, 0, 0, 0)); l.Add(M(LDOWN, 0, 0, 0)); l.Add(M(LUP, 0, 0, 0)); break;
                case "right": l.Add(M(RDOWN, 0, 0, 0)); l.Add(M(RUP, 0, 0, 0)); break;
                case "middle": l.Add(M(MDOWN, 0, 0, 0)); l.Add(M(MUP, 0, 0, 0)); break;
                case "hold": l.Add(M(LDOWN, 0, 0, 0)); break;
                case "release": l.Add(M(LUP, 0, 0, 0)); break;
            }
            Send(l);
        }

        private static bool Extended(int vk)
        {
            return (vk >= 0x21 && vk <= 0x2E) || vk == 0x5B || vk == 0x5C || vk == 0x5D || (vk >= 0xA6 && vk <= 0xB7) || vk == 0x90 || vk == 0x6F;
        }

        // KDE Connect "specialKey" codes
        private static int SpecialToVk(int code)
        {
            switch (code)
            {
                case 1: return 0x08;  // backspace
                case 2: return 0x09;  // tab
                case 3: return 0x0D;  // linefeed
                case 4: return 0x25;  // left
                case 5: return 0x26;  // up
                case 6: return 0x27;  // right
                case 7: return 0x28;  // down
                case 8: return 0x21;  // page up
                case 9: return 0x22;  // page down
                case 10: return 0x24; // home
                case 11: return 0x23; // end
                case 12: return 0x0D; // return
                case 13: return 0x2E; // delete
                case 14: return 0x1B; // escape
                case 15: return 0x2C; // print screen
                case 16: return 0x91; // scroll lock
            }
            if (code >= 21 && code <= 32) return 0x70 + (code - 21); // F1..F12
            return 0;
        }

        private static void Mods(List<INPUT> l, int mods, bool up)
        {
            int[] vks = { 0x11, 0x12, 0x10, 0x5B }; // ctrl, alt, shift, win
            for (int i = 0; i < 4; i++)
            {
                int idx = up ? 3 - i : i;
                if ((mods & (1 << idx)) == 0) continue;
                int vk = vks[idx];
                l.Add(K((ushort)vk, 0, (Extended(vk) ? K_EXT : 0) | (up ? K_UP : 0)));
            }
        }

        private static void Tap(List<INPUT> l, int vk)
        {
            uint ext = Extended(vk) ? K_EXT : 0;
            l.Add(K((ushort)vk, 0, ext));
            l.Add(K((ushort)vk, 0, ext | K_UP));
        }

        // mode: text | special | vk ; mods bitmask: 1 ctrl, 2 alt, 4 shift, 8 win
        public static void Key(string mode, string value, string modsText)
        {
            int mods = 0;
            int.TryParse(modsText, NumberStyles.Integer, CultureInfo.InvariantCulture, out mods);
            List<INPUT> l = new List<INPUT>();
            if (mode == "special" || mode == "vk")
            {
                int code = 0;
                int.TryParse(value, NumberStyles.Integer, CultureInfo.InvariantCulture, out code);
                int vk = mode == "vk" ? code : SpecialToVk(code);
                if (vk <= 0 || vk > 0xFE) return;
                Mods(l, mods, false);
                Tap(l, vk);
                Mods(l, mods, true);
                Send(l);
                return;
            }
            if (string.IsNullOrEmpty(value)) return;
            if (value.Length > 4000) value = value.Substring(0, 4000);
            if ((mods & (1 | 2 | 8)) != 0)
            {
                // shortcuts (ctrl+c, win+d...) need the real virtual key, not a unicode character
                char c = value[0];
                short scan = VkKeyScanW(c);
                if (scan == -1) return;
                int vk = scan & 0xFF;
                int shiftState = (scan >> 8) & 0xFF;
                int all = mods | ((shiftState & 1) != 0 ? 4 : 0);
                Mods(l, all, false);
                Tap(l, vk);
                Mods(l, all, true);
                Send(l);
                return;
            }
            for (int i = 0; i < value.Length; i++)
            {
                char c = value[i];
                if (c == '\r') continue;
                if (c == '\n') { Tap(l, 0x0D); continue; }
                if (c == '\t') { Tap(l, 0x09); continue; }
                l.Add(K(0, c, K_UNI));
                l.Add(K(0, c, K_UNI | K_UP));
            }
            Send(l);
        }
    }

    // ------------------------------------------------------------------ power actions requested by the phone
    public static class Power
    {
        [DllImport("user32.dll")]
        private static extern bool LockWorkStation();

        [DllImport("powrprof.dll", SetLastError = true)]
        private static extern bool SetSuspendState(bool hibernate, bool forceCritical, bool disableWakeEvent);

        [DllImport("user32.dll", SetLastError = true)]
        private static extern IntPtr SendMessageTimeout(IntPtr hWnd, uint msg, IntPtr wParam, IntPtr lParam, uint flags, uint timeout, out IntPtr result);

        [StructLayout(LayoutKind.Sequential, Pack = 4)]
        private struct TOKEN_PRIVILEGES { public int Count; public long Luid; public int Attr; }

        [DllImport("advapi32.dll", SetLastError = true)]
        private static extern bool OpenProcessToken(IntPtr process, int access, out IntPtr token);

        [DllImport("advapi32.dll", SetLastError = true, CharSet = CharSet.Unicode)]
        private static extern bool LookupPrivilegeValue(string system, string name, out long luid);

        [DllImport("advapi32.dll", SetLastError = true)]
        private static extern bool AdjustTokenPrivileges(IntPtr token, bool disableAll, ref TOKEN_PRIVILEGES state, int len, IntPtr prev, IntPtr retLen);

        [DllImport("kernel32.dll")]
        private static extern IntPtr GetCurrentProcess();

        [DllImport("kernel32.dll")]
        private static extern bool CloseHandle(IntPtr h);

        public static void Lock()
        {
            if (!LockWorkStation()) Out.Log("warn", "LockWorkStation failed " + Marshal.GetLastWin32Error());
        }

        private static void EnableShutdownPrivilege()
        {
            IntPtr token;
            if (!OpenProcessToken(GetCurrentProcess(), 0x20 | 0x8, out token)) return; // ADJUST_PRIVILEGES | QUERY
            try
            {
                TOKEN_PRIVILEGES tp = new TOKEN_PRIVILEGES();
                tp.Count = 1;
                tp.Attr = 2; // SE_PRIVILEGE_ENABLED
                if (LookupPrivilegeValue(null, "SeShutdownPrivilege", out tp.Luid))
                    AdjustTokenPrivileges(token, false, ref tp, 0, IntPtr.Zero, IntPtr.Zero);
            }
            finally { CloseHandle(token); }
        }

        public static void Sleep()
        {
            Thread t = new Thread(delegate ()
            {
                Thread.Sleep(600); // let the "done" reach the phone first
                EnableShutdownPrivilege();
                if (!SetSuspendState(false, false, false)) Out.Log("warn", "SetSuspendState failed " + Marshal.GetLastWin32Error());
            });
            t.IsBackground = true;
            t.Start();
        }

        public static void MonitorOff()
        {
            Thread t = new Thread(delegate ()
            {
                Thread.Sleep(500); // the tap that sent this must not wake the screen again
                IntPtr r;
                SendMessageTimeout(new IntPtr(0xFFFF), 0x0112, new IntPtr(0xF170), new IntPtr(2), 0x2, 2000, out r);
            });
            t.IsBackground = true;
            t.Start();
        }
    }

    // ------------------------------------------------------------------ Bluetooth link to the Blinkelo Link app
    // The phone runs an RFCOMM server (service UUID below). We connect as a client to phones that are paired
    // in Windows. Lines are passed through as-is: {"type":"bt","ev":"open|line|sent|close"...}; Electron runs
    // the protocol. Each connection has its own reader thread and a writer queue so a slow radio never blocks stdin.
    public static class Bt
    {
        private static readonly Guid Service = new Guid("a8d1f0c2-6b7e-4f1a-9c3d-2e5b7a9c1d40");

        [StructLayout(LayoutKind.Sequential)]
        private struct SYSTEMTIME { public ushort y, mo, dw, d, h, mi, s, ms; }

        [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
        private struct BLUETOOTH_DEVICE_INFO
        {
            public int dwSize;
            public ulong Address;
            public uint ulClassofDevice;
            public int fConnected;
            public int fRemembered;
            public int fAuthenticated;
            public SYSTEMTIME stLastSeen;
            public SYSTEMTIME stLastUsed;
            [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 248)]
            public string szName;
        }

        [StructLayout(LayoutKind.Sequential)]
        private struct BLUETOOTH_DEVICE_SEARCH_PARAMS
        {
            public int dwSize;
            public int fReturnAuthenticated;
            public int fReturnRemembered;
            public int fReturnUnknown;
            public int fReturnConnected;
            public int fIssueInquiry;
            public byte cTimeoutMultiplier;
            public IntPtr hRadio;
        }

        [DllImport("bthprops.cpl", SetLastError = true)]
        private static extern IntPtr BluetoothFindFirstDevice(ref BLUETOOTH_DEVICE_SEARCH_PARAMS p, ref BLUETOOTH_DEVICE_INFO info);

        [DllImport("bthprops.cpl", SetLastError = true)]
        private static extern bool BluetoothFindNextDevice(IntPtr h, ref BLUETOOTH_DEVICE_INFO info);

        [DllImport("bthprops.cpl")]
        private static extern bool BluetoothFindDeviceClose(IntPtr h);

        private sealed class BthEndPoint : EndPoint
        {
            public ulong Addr;
            public override AddressFamily AddressFamily { get { return (AddressFamily)32; } }
            public override SocketAddress Serialize()
            {
                SocketAddress sa = new SocketAddress((AddressFamily)32, 30);
                byte[] a = BitConverter.GetBytes(Addr);
                for (int i = 0; i < 8; i++) sa[2 + i] = a[i];
                byte[] g = Service.ToByteArray();
                for (int i = 0; i < 16; i++) sa[10 + i] = g[i];
                // port 0: Windows looks the service up over SDP by its UUID
                return sa;
            }
            public override EndPoint Create(SocketAddress sa) { BthEndPoint e = new BthEndPoint(); return e; }
        }

        private sealed class Conn
        {
            public string Addr;
            public string Name;
            public Socket Sock;
            public readonly BlockingCollection<byte[]> Queue = new BlockingCollection<byte[]>(new ConcurrentQueue<byte[]>());
            public long Written;
            public long Reported;
            public volatile bool Closed;
        }

        private sealed class Peer { public int Fails; public long NextTry; }

        private static readonly object Gate = new object();
        private static readonly Dictionary<string, Conn> Conns = new Dictionary<string, Conn>();
        private static readonly Dictionary<string, Peer> Peers = new Dictionary<string, Peer>();
        private static volatile bool _want;
        private static Thread _scanner;
        private static bool _noRadioLogged;

        public static void Want(bool on)
        {
            _want = on;
            if (on && _scanner == null)
            {
                _scanner = new Thread(ScanLoop);
                _scanner.IsBackground = true;
                _scanner.Name = "island-bt";
                _scanner.Start();
            }
            if (on) lock (Gate) { foreach (Peer p in Peers.Values) { p.NextTry = 0; p.Fails = 0; } }
        }

        private static long Now() { return DateTime.UtcNow.Ticks / 10000; }

        private static string Hex(ulong a) { return a.ToString("X12"); }

        private static List<BLUETOOTH_DEVICE_INFO> Paired()
        {
            List<BLUETOOTH_DEVICE_INFO> list = new List<BLUETOOTH_DEVICE_INFO>();
            BLUETOOTH_DEVICE_SEARCH_PARAMS sp = new BLUETOOTH_DEVICE_SEARCH_PARAMS();
            sp.dwSize = Marshal.SizeOf(typeof(BLUETOOTH_DEVICE_SEARCH_PARAMS));
            sp.fReturnAuthenticated = 1;
            sp.fReturnRemembered = 1;
            sp.fReturnConnected = 1;
            BLUETOOTH_DEVICE_INFO info = new BLUETOOTH_DEVICE_INFO();
            info.dwSize = Marshal.SizeOf(typeof(BLUETOOTH_DEVICE_INFO));
            IntPtr h = BluetoothFindFirstDevice(ref sp, ref info);
            if (h == IntPtr.Zero)
            {
                int err = Marshal.GetLastWin32Error();
                if (err != 259 && !_noRadioLogged) // 259 = no more items (radio present, nothing paired)
                {
                    _noRadioLogged = true;
                    Out.Status("bluetooth", false, "no Bluetooth radio (" + err + ")");
                }
                return list;
            }
            try
            {
                do
                {
                    list.Add(info);
                    info = new BLUETOOTH_DEVICE_INFO();
                    info.dwSize = Marshal.SizeOf(typeof(BLUETOOTH_DEVICE_INFO));
                } while (BluetoothFindNextDevice(h, ref info));
            }
            finally { BluetoothFindDeviceClose(h); }
            return list;
        }

        private static void ScanLoop()
        {
            bool statusSent = false;
            while (true)
            {
                try
                {
                    if (_want)
                    {
                        List<BLUETOOTH_DEVICE_INFO> devs = Paired();
                        if (!statusSent && devs.Count > 0) { statusSent = true; Out.Status("bluetooth", true, devs.Count + " paired"); }
                        foreach (BLUETOOTH_DEVICE_INFO d in devs)
                        {
                            if (!_want) break;
                            uint major = (d.ulClassofDevice >> 8) & 0x1F;
                            if (major != 2) continue; // phones only (connecting to headsets etc. would be rude)
                            string addr = Hex(d.Address);
                            Peer peer;
                            lock (Gate)
                            {
                                if (Conns.ContainsKey(addr)) continue;
                                if (!Peers.TryGetValue(addr, out peer)) { peer = new Peer(); Peers[addr] = peer; }
                            }
                            if (Now() < peer.NextTry) continue;
                            if (TryConnect(d.Address, addr, d.szName)) { peer.Fails = 0; peer.NextTry = 0; }
                            else
                            {
                                peer.Fails++;
                                long wait = Math.Min(120000L, 10000L * (1L << Math.Min(peer.Fails - 1, 4)));
                                peer.NextTry = Now() + wait;
                            }
                        }
                    }
                }
                catch (Exception ex) { Out.Log("warn", "bluetooth scan: " + ex.Message); }
                Thread.Sleep(4000);
            }
        }

        private static bool TryConnect(ulong address, string addr, string name)
        {
            Socket s = null;
            try
            {
                s = new Socket((AddressFamily)32, SocketType.Stream, (ProtocolType)3);
                BthEndPoint ep = new BthEndPoint();
                ep.Addr = address;
                IAsyncResult ar = s.BeginConnect(ep, null, null);
                if (!ar.AsyncWaitHandle.WaitOne(9000)) { s.Close(); return false; }
                s.EndConnect(ar);
                Conn c = new Conn();
                c.Addr = addr; c.Name = name ?? ""; c.Sock = s;
                lock (Gate) Conns[addr] = c;
                Out.Line(new JObj().S("type", "bt").S("ev", "open").S("addr", addr).S("name", c.Name).ToString());
                Thread r = new Thread(delegate () { ReadLoop(c); });
                r.IsBackground = true; r.Name = "island-bt-r";
                r.Start();
                Thread w = new Thread(delegate () { WriteLoop(c); });
                w.IsBackground = true; w.Name = "island-bt-w";
                w.Start();
                return true;
            }
            catch (Exception)
            {
                try { if (s != null) s.Close(); } catch { }
                return false;
            }
        }

        private static void ReadLoop(Conn c)
        {
            byte[] buf = new byte[65536];
            MemoryStream line = new MemoryStream();
            try
            {
                while (!c.Closed)
                {
                    int n = c.Sock.Receive(buf);
                    if (n <= 0) break;
                    int start = 0;
                    for (int i = 0; i < n; i++)
                    {
                        if (buf[i] != 10) continue;
                        line.Write(buf, start, i - start);
                        start = i + 1;
                        if (line.Length > 0)
                        {
                            string text = Encoding.UTF8.GetString(line.GetBuffer(), 0, (int)line.Length).Trim();
                            if (text.Length > 0) Out.Line(new JObj().S("type", "bt").S("ev", "line").S("addr", c.Addr).S("data", text).ToString());
                        }
                        line.SetLength(0);
                    }
                    if (start < n) line.Write(buf, start, n - start);
                    if (line.Length > 8 * 1024 * 1024) break;
                }
            }
            catch (Exception) { }
            Drop(c);
        }

        private static void WriteLoop(Conn c)
        {
            try
            {
                foreach (byte[] data in c.Queue.GetConsumingEnumerable())
                {
                    if (c.Closed) break;
                    int off = 0;
                    while (off < data.Length) off += c.Sock.Send(data, off, data.Length - off, SocketFlags.None);
                    c.Written += data.Length;
                    if (c.Written - c.Reported >= 64 * 1024 || c.Queue.Count == 0)
                    {
                        c.Reported = c.Written;
                        Out.Line(new JObj().S("type", "bt").S("ev", "sent").S("addr", c.Addr).N("total", c.Written).ToString());
                    }
                }
            }
            catch (Exception) { }
            Drop(c);
        }

        public static void Send(string addr, string line)
        {
            Conn c;
            lock (Gate) { if (!Conns.TryGetValue(addr, out c)) return; }
            if (c.Closed) return;
            try { c.Queue.Add(Encoding.UTF8.GetBytes(line + "\n")); } catch { }
        }

        private static void Drop(Conn c)
        {
            lock (Gate)
            {
                if (c.Closed) return;
                c.Closed = true;
                Conn cur;
                if (Conns.TryGetValue(c.Addr, out cur) && cur == c) Conns.Remove(c.Addr);
                Peer p;
                if (Peers.TryGetValue(c.Addr, out p)) p.NextTry = Now() + 5000;
            }
            try { c.Queue.CompleteAdding(); } catch { }
            try { c.Sock.Close(); } catch { }
            Out.Line(new JObj().S("type", "bt").S("ev", "close").S("addr", c.Addr).ToString());
        }

        public static void Close(string addr)
        {
            Conn c;
            lock (Gate) { if (!Conns.TryGetValue(addr, out c)) return; }
            Drop(c);
        }

        public static void CloseAll()
        {
            List<Conn> all;
            lock (Gate) all = new List<Conn>(Conns.Values);
            foreach (Conn c in all) Drop(c);
        }
    }
}
