// Blinkelo - gaming mode (FPS counter, sensors, foreground game, optimize primitives).
// Compiled separately so a failure here never breaks the core helper. C# 5 only
// (no string interpolation, no ?. , no nameof, no expression bodies, no out var).
//
// FPS: a real-time ETW session counts presents per process, the same signals PresentMon uses:
//   Microsoft-Windows-DXGI Present_Start (42), Microsoft-Windows-D3D9 Present_Start (1) and, for
//   Vulkan/OpenGL ("other" runtimes), Microsoft-Windows-DxgKrnl Present_Info (184).
//   Starting an ETW session needs administrator rights or the "Performance Log Users" group.
//   Without that, RivaTuner Statistics Server's shared memory is used when RTSS is running.
// Temperatures: LibreHardwareMonitor / OpenHardwareMonitor WMI, HWiNFO shared memory, then ACPI thermal zones.
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Globalization;
using System.Management;
using System.Net.NetworkInformation;
using System.Reflection;
using System.Runtime.InteropServices;
using System.Security.Principal;
using System.Text;
using System.Threading;
using Microsoft.Win32;

namespace IslandGame
{
    // ------------------------------------------------------------------ output (shares the core's stdout lock)
    internal static class O
    {
        private static readonly object Sync = new object();
        private static MethodInfo _line;
        private static bool _looked;
        private static System.IO.Stream _stdout;

        public static void Line(string json)
        {
            if (!_looked)
            {
                _looked = true;
                try
                {
                    foreach (Assembly a in AppDomain.CurrentDomain.GetAssemblies())
                    {
                        Type t = a.GetType("IslandNative.Out", false);
                        if (t != null) { _line = t.GetMethod("Line", new Type[] { typeof(string) }); break; }
                    }
                }
                catch { }
            }
            if (_line != null)
            {
                try { _line.Invoke(null, new object[] { json }); return; }
                catch { }
            }
            StringBuilder sb = new StringBuilder(json.Length + 8);
            foreach (char ch in json)
            {
                if (ch > 126) { sb.Append("\\u"); sb.Append(((int)ch).ToString("x4")); }
                else if (ch != '\r' && ch != '\n') sb.Append(ch);
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
            Line("{\"type\":\"log\",\"level\":" + J.Str(level) + ",\"msg\":" + J.Str("game: " + msg) + "}");
        }
    }

    internal static class J
    {
        public static string Str(string s)
        {
            if (s == null) return "null";
            StringBuilder sb = new StringBuilder(s.Length + 2);
            sb.Append('"');
            foreach (char c in s)
            {
                switch (c)
                {
                    case '"': sb.Append("\\\""); break;
                    case '\\': sb.Append("\\\\"); break;
                    case '\n': sb.Append("\\n"); break;
                    case '\r': sb.Append("\\r"); break;
                    case '\t': sb.Append("\\t"); break;
                    default:
                        if (c < 32) sb.Append("\\u" + ((int)c).ToString("x4"));
                        else sb.Append(c);
                        break;
                }
            }
            sb.Append('"');
            return sb.ToString();
        }

        public static string Num(double d)
        {
            if (double.IsNaN(d) || double.IsInfinity(d)) return "null";
            return Math.Round(d, 2).ToString("0.##", CultureInfo.InvariantCulture);
        }
    }

    internal sealed class Obj
    {
        private readonly StringBuilder _sb = new StringBuilder("{");
        private bool _first = true;
        private void Key(string k) { if (!_first) _sb.Append(','); _first = false; _sb.Append(J.Str(k)).Append(':'); }
        public Obj S(string k, string v) { Key(k); _sb.Append(J.Str(v)); return this; }
        public Obj N(string k, double v) { Key(k); _sb.Append(J.Num(v)); return this; }
        public Obj Nn(string k, double v) { Key(k); _sb.Append(v < 0 || double.IsNaN(v) ? "null" : J.Num(v)); return this; }
        public Obj B(string k, bool v) { Key(k); _sb.Append(v ? "true" : "false"); return this; }
        public Obj Raw(string k, string raw) { Key(k); _sb.Append(raw ?? "null"); return this; }
        public override string ToString() { return _sb.ToString() + "}"; }
    }

    // ------------------------------------------------------------------ native
    internal static class N
    {
        [DllImport("kernel32.dll", SetLastError = true)]
        public static extern IntPtr OpenProcess(uint access, bool inherit, uint pid);
        [DllImport("kernel32.dll")]
        public static extern bool CloseHandle(IntPtr h);
        [DllImport("kernel32.dll", CharSet = CharSet.Unicode)]
        public static extern bool QueryFullProcessImageName(IntPtr h, int flags, StringBuilder name, ref int size);
        [DllImport("kernel32.dll")]
        public static extern bool GetExitCodeProcess(IntPtr h, out uint code);
        [DllImport("kernel32.dll", EntryPoint = "K32EmptyWorkingSet")]
        public static extern bool EmptyWorkingSet(IntPtr h);
        [DllImport("kernel32.dll")]
        public static extern uint WTSGetActiveConsoleSessionId();

        [StructLayout(LayoutKind.Sequential)]
        public struct MEMORYSTATUSEX
        {
            public uint dwLength; public uint dwMemoryLoad; public ulong ullTotalPhys; public ulong ullAvailPhys;
            public ulong ullTotalPageFile; public ulong ullAvailPageFile; public ulong ullTotalVirtual; public ulong ullAvailVirtual;
            public ulong ullAvailExtendedVirtual;
        }
        [DllImport("kernel32.dll")]
        public static extern bool GlobalMemoryStatusEx(ref MEMORYSTATUSEX m);

        [StructLayout(LayoutKind.Sequential)]
        public struct RECT { public int Left, Top, Right, Bottom; }
        [StructLayout(LayoutKind.Sequential)]
        public struct MONITORINFO { public int cbSize; public RECT rcMonitor; public RECT rcWork; public int dwFlags; }

        [DllImport("user32.dll")]
        public static extern IntPtr GetForegroundWindow();
        [DllImport("user32.dll")]
        public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint pid);
        [DllImport("user32.dll", CharSet = CharSet.Unicode)]
        public static extern int GetWindowText(IntPtr hWnd, StringBuilder text, int max);
        [DllImport("user32.dll", CharSet = CharSet.Unicode)]
        public static extern int GetClassName(IntPtr hWnd, StringBuilder name, int max);
        [DllImport("user32.dll")]
        public static extern bool GetWindowRect(IntPtr hWnd, out RECT rect);
        [DllImport("user32.dll")]
        public static extern IntPtr MonitorFromWindow(IntPtr hWnd, uint flags);
        [DllImport("user32.dll", CharSet = CharSet.Unicode)]
        public static extern bool GetMonitorInfo(IntPtr hMonitor, ref MONITORINFO info);
        [DllImport("user32.dll")]
        public static extern bool IsWindowVisible(IntPtr hWnd);
        [DllImport("user32.dll")]
        public static extern bool IsIconic(IntPtr hWnd);
        [DllImport("user32.dll")]
        public static extern int GetWindowLong(IntPtr hWnd, int index);
        [DllImport("shell32.dll")]
        public static extern int SHQueryUserNotificationState(out int state);
        // TRUE while some program really owns a display (classic exclusive fullscreen)
        [DllImport("gdi32.dll")]
        [return: MarshalAs(UnmanagedType.U1)]
        public static extern bool D3DKMTCheckExclusiveOwnership();

        [DllImport("kernel32.dll", CharSet = CharSet.Unicode, SetLastError = true)]
        public static extern IntPtr OpenFileMapping(uint access, bool inherit, string name);
        [DllImport("kernel32.dll", SetLastError = true)]
        public static extern IntPtr MapViewOfFile(IntPtr h, uint access, uint hi, uint lo, UIntPtr size);
        [DllImport("kernel32.dll")]
        public static extern bool UnmapViewOfFile(IntPtr p);

        public const uint QUERY_LIMITED = 0x1000;
        public const uint SET_QUOTA = 0x0100;

        public static string ImagePath(uint pid)
        {
            IntPtr h = OpenProcess(QUERY_LIMITED, false, pid);
            if (h == IntPtr.Zero) return "";
            try
            {
                StringBuilder sb = new StringBuilder(1024);
                int size = sb.Capacity;
                return QueryFullProcessImageName(h, 0, sb, ref size) ? sb.ToString() : "";
            }
            finally { CloseHandle(h); }
        }

        public static bool Alive(uint pid)
        {
            IntPtr h = OpenProcess(QUERY_LIMITED, false, pid);
            if (h == IntPtr.Zero) return Marshal.GetLastWin32Error() == 5; // access denied = it exists
            try
            {
                uint code;
                return GetExitCodeProcess(h, out code) && code == 259;
            }
            finally { CloseHandle(h); }
        }

        public static ulong AvailPhys()
        {
            MEMORYSTATUSEX m = new MEMORYSTATUSEX();
            m.dwLength = (uint)Marshal.SizeOf(typeof(MEMORYSTATUSEX));
            return GlobalMemoryStatusEx(ref m) ? m.ullAvailPhys : 0;
        }
    }

    // ------------------------------------------------------------------ frame timing (ETW + RTSS)
    internal sealed class PidFrames
    {
        public const int Cap = 8192;
        public readonly long[] Ts = new long[Cap]; // 100 ns system time of each counted present
        public int Head;                           // next write slot
        public int Count;
        public bool HasRuntime;                    // DXGI / D3D9 seen: kernel presents are then ignored
        public long Last;
        public string Api = "";

        public void Add(long ts)
        {
            Ts[Head] = ts;
            Head = (Head + 1) % Cap;
            if (Count < Cap) Count++;
            Last = ts;
        }

        public void Clear() { Head = 0; Count = 0; }
    }

    // Session-wide frame-time histogram (0.1 ms buckets up to 200 ms) for the tracked game.
    internal sealed class FrameHist
    {
        public readonly int[] B = new int[2001];
        public long Frames;
        public double Ms;

        public void Add(double ms)
        {
            if (ms <= 0 || ms > 1000) return; // pauses (loading, alt-tab) are not frames
            int i = (int)(ms * 10);
            if (i > 2000) i = 2000;
            B[i]++;
            Frames++;
            Ms += ms;
        }

        public double AvgFps() { return Ms > 0 ? Frames * 1000.0 / Ms : -1; }

        // average fps of the slowest 1 % of frames
        public double Low1()
        {
            if (Frames < 100) return -1;
            long want = Math.Max(1, Frames / 100);
            long got = 0; double sum = 0;
            for (int i = 2000; i >= 0 && got < want; i--)
            {
                if (B[i] == 0) continue;
                long take = Math.Min(B[i], want - got);
                got += take;
                sum += take * ((i + 0.5) / 10.0);
            }
            return got > 0 && sum > 0 ? got * 1000.0 / sum : -1;
        }
    }

    internal static class Frames
    {
        private static readonly object Sync = new object();
        private static readonly Dictionary<uint, PidFrames> ByPid = new Dictionary<uint, PidFrames>();
        public static volatile uint Tracked;
        public static FrameHist Hist = new FrameHist();

        public static void OnPresent(uint pid, long ts, bool runtime, string api)
        {
            lock (Sync)
            {
                PidFrames f;
                if (!ByPid.TryGetValue(pid, out f))
                {
                    if (ByPid.Count > 64) Prune(ts);
                    f = new PidFrames();
                    ByPid[pid] = f;
                }
                if (runtime && !f.HasRuntime) { f.HasRuntime = true; f.Clear(); }
                if (!runtime && f.HasRuntime) return;
                if (f.Count > 0 && pid == Tracked) Hist.Add((ts - f.Last) / 10000.0);
                f.Api = api;
                f.Add(ts);
            }
        }

        private static void Prune(long now)
        {
            List<uint> old = new List<uint>();
            foreach (KeyValuePair<uint, PidFrames> kv in ByPid) if (now - kv.Value.Last > 15L * 10000000) old.Add(kv.Key);
            foreach (uint p in old) ByPid.Remove(p);
        }

        public static void Track(uint pid)
        {
            lock (Sync)
            {
                Tracked = pid;
                Hist = new FrameHist();
            }
        }

        public static void Reset() { lock (Sync) { ByPid.Clear(); } }

        // fps over the last second, average frame time, live 1 % low over the last 20 s
        public static bool Stats(uint pid, out double fps, out double ft, out double low1, out string api)
        {
            fps = -1; ft = -1; low1 = -1; api = "";
            lock (Sync)
            {
                PidFrames f;
                if (!ByPid.TryGetValue(pid, out f) || f.Count == 0) return false;
                long now = DateTime.UtcNow.ToFileTimeUtc();
                api = f.Api;
                // stale: nothing presented for 2.5 s
                if (now - f.Last > 25000000) { fps = 0; return true; }
                long end = f.Last;
                int inSec = 0;
                List<double> iv = new List<double>(2048);
                long prev = 0;
                for (int k = 0; k < f.Count; k++)
                {
                    int idx = (f.Head - 1 - k + PidFrames.Cap * 2) % PidFrames.Cap;
                    long t = f.Ts[idx];
                    if (end - t > 200000000) break;     // 20 s
                    if (end - t <= 10000000) inSec++;    // 1 s
                    if (prev != 0)
                    {
                        double ms = (prev - t) / 10000.0;
                        if (ms > 0 && ms < 1000) iv.Add(ms);
                    }
                    prev = t;
                }
                fps = inSec;
                ft = inSec > 0 ? 1000.0 / inSec : -1;
                if (iv.Count >= 50)
                {
                    iv.Sort();
                    int n = Math.Max(1, iv.Count / 100);
                    double sum = 0;
                    for (int k = iv.Count - n; k < iv.Count; k++) sum += iv[k];
                    low1 = sum > 0 ? n * 1000.0 / sum : -1;
                    // a more precise frame time from the measured intervals of the last second
                    double s1 = 0; int c1 = 0;
                    long tEdge = end - 10000000;
                    for (int k = 0; k < Math.Min(inSec, f.Count) - 1; k++)
                    {
                        int a = (f.Head - 1 - k + PidFrames.Cap * 2) % PidFrames.Cap;
                        int b = (f.Head - 2 - k + PidFrames.Cap * 2) % PidFrames.Cap;
                        if (f.Ts[b] < tEdge) break;
                        s1 += (f.Ts[a] - f.Ts[b]) / 10000.0; c1++;
                    }
                    if (c1 > 0) ft = s1 / c1;
                }
                return true;
            }
        }

        public static void Session(out double avg, out double low1, out long frames)
        {
            lock (Sync)
            {
                avg = Hist.AvgFps();
                low1 = Hist.Low1();
                frames = Hist.Frames;
            }
        }
    }

    internal static class Etw
    {
        private const string Name = "BlinkeloFrames";
        private const uint WNODE_FLAG_TRACED_GUID = 0x00020000;
        private const uint EVENT_TRACE_REAL_TIME_MODE = 0x00000100;
        private const uint PROCESS_TRACE_MODE_REAL_TIME = 0x00000100;
        private const uint PROCESS_TRACE_MODE_EVENT_RECORD = 0x10000000;
        private const uint EVENT_CONTROL_CODE_ENABLE_PROVIDER = 1;
        private const uint EVENT_TRACE_CONTROL_STOP = 1;
        private const int PROPS_SIZE = 120;
        private const int PROPS_TOTAL = PROPS_SIZE + 2 * 128;

        private static Guid DXGI = new Guid("CA11C036-0102-4A2D-A6AD-F03CFED5D3C9");
        private static Guid D3D9 = new Guid("783ACA0A-790E-4D7F-8451-AA850511C6B9");
        private static Guid DXGKRNL = new Guid("802EC45A-1E99-4B83-9920-87C98277BA9D");
        private const int DXGI_D1 = unchecked((int)0xCA11C036);
        private const int D3D9_D1 = 0x783ACA0A;
        private const int DXGK_D1 = unchecked((int)0x802EC45A);

        [UnmanagedFunctionPointer(CallingConvention.StdCall)]
        private delegate void EventRecordCallback(IntPtr record);

        [DllImport("advapi32.dll", CharSet = CharSet.Unicode, EntryPoint = "StartTraceW")]
        private static extern uint StartTrace(out ulong handle, string name, IntPtr props);
        [DllImport("advapi32.dll", CharSet = CharSet.Unicode, EntryPoint = "ControlTraceW")]
        private static extern uint ControlTrace(ulong handle, string name, IntPtr props, uint code);
        [DllImport("advapi32.dll")]
        private static extern uint EnableTraceEx2(ulong handle, ref Guid provider, uint code, byte level, ulong any, ulong all, uint timeout, IntPtr parms);
        [DllImport("advapi32.dll", EntryPoint = "OpenTraceW")]
        private static extern ulong OpenTrace(IntPtr logfile);
        [DllImport("advapi32.dll")]
        private static extern uint ProcessTrace(ulong[] handles, uint count, IntPtr start, IntPtr end);
        [DllImport("advapi32.dll")]
        private static extern uint CloseTrace(ulong handle);

        private static readonly object Gate = new object();
        private static EventRecordCallback _cb;     // kept alive while ETW may call it
        private static Thread _thread;
        private static volatile bool _want;
        private static ulong _session;
        private static ulong _trace;
        public static volatile string State = "off"; // off | starting | ok | denied | error | unsupported
        public static volatile string Detail = "";

        static Etw()
        {
            try { AppDomain.CurrentDomain.ProcessExit += delegate { StopSession(); }; } catch { }
        }

        private static IntPtr Props()
        {
            IntPtr p = Marshal.AllocHGlobal(PROPS_TOTAL);
            for (int i = 0; i < PROPS_TOTAL; i++) Marshal.WriteByte(p, i, 0);
            Marshal.WriteInt32(p, 0, PROPS_TOTAL);           // Wnode.BufferSize
            Marshal.WriteInt32(p, 40, 1);                    // Wnode.ClientContext: QPC
            Marshal.WriteInt32(p, 44, (int)WNODE_FLAG_TRACED_GUID);
            Marshal.WriteInt32(p, 48, 64);                   // BufferSize (KB)
            Marshal.WriteInt32(p, 52, 4);                    // MinimumBuffers
            Marshal.WriteInt32(p, 56, 32);                   // MaximumBuffers
            Marshal.WriteInt32(p, 64, (int)EVENT_TRACE_REAL_TIME_MODE);
            Marshal.WriteInt32(p, 68, 1);                    // FlushTimer (s)
            Marshal.WriteInt32(p, 116, PROPS_SIZE);          // LoggerNameOffset
            return p;
        }

        private static void StopSession()
        {
            IntPtr p = Props();
            try { ControlTrace(0, Name, p, EVENT_TRACE_CONTROL_STOP); }
            catch { }
            finally { Marshal.FreeHGlobal(p); }
        }

        public static void Set(bool on)
        {
            lock (Gate)
            {
                _want = on;
                if (on && _thread == null)
                {
                    if (IntPtr.Size != 8) { State = "unsupported"; Detail = "32-bit"; return; }
                    _thread = new Thread(Run);
                    _thread.IsBackground = true;
                    _thread.Name = "island-etw";
                    State = "starting";
                    _thread.Start();
                }
                else if (!on && _thread != null)
                {
                    StopSession(); // ProcessTrace returns once the session is gone
                }
            }
        }

        private static IntPtr FilterParams(ushort[] ids, out IntPtr filterMem, out IntPtr descMem)
        {
            filterMem = Marshal.AllocHGlobal(4 + 2 * ids.Length);
            Marshal.WriteByte(filterMem, 0, 1);              // FilterIn
            Marshal.WriteByte(filterMem, 1, 0);
            Marshal.WriteInt16(filterMem, 2, (short)ids.Length);
            for (int i = 0; i < ids.Length; i++) Marshal.WriteInt16(filterMem, 4 + 2 * i, (short)ids[i]);
            descMem = Marshal.AllocHGlobal(16);
            Marshal.WriteInt64(descMem, 0, filterMem.ToInt64());
            Marshal.WriteInt32(descMem, 8, 4 + 2 * ids.Length);
            Marshal.WriteInt32(descMem, 12, unchecked((int)0x80000200)); // EVENT_FILTER_TYPE_EVENT_ID
            IntPtr parms = Marshal.AllocHGlobal(48);
            for (int i = 0; i < 48; i++) Marshal.WriteByte(parms, i, 0);
            Marshal.WriteInt32(parms, 0, 2);                 // ENABLE_TRACE_PARAMETERS_VERSION_2
            Marshal.WriteInt64(parms, 32, descMem.ToInt64()); // EnableFilterDesc
            Marshal.WriteInt32(parms, 40, 1);                // FilterDescCount
            return parms;
        }

        private static uint Enable(ulong session, Guid provider, ulong keywords, ushort[] ids)
        {
            IntPtr f = IntPtr.Zero, d = IntPtr.Zero, parms = IntPtr.Zero;
            try
            {
                parms = FilterParams(ids, out f, out d);
                uint rc = EnableTraceEx2(session, ref provider, EVENT_CONTROL_CODE_ENABLE_PROVIDER, 4, keywords, 0, 0, parms);
                if (rc == 0) return 0;
                // older systems: no event-id filtering
                return EnableTraceEx2(session, ref provider, EVENT_CONTROL_CODE_ENABLE_PROVIDER, 4, keywords, 0, 0, IntPtr.Zero);
            }
            finally
            {
                if (parms != IntPtr.Zero) Marshal.FreeHGlobal(parms);
                if (d != IntPtr.Zero) Marshal.FreeHGlobal(d);
                if (f != IntPtr.Zero) Marshal.FreeHGlobal(f);
            }
        }

        private static void OnEvent(IntPtr rec)
        {
            try
            {
                int d1 = Marshal.ReadInt32(rec, 24);
                ushort id = (ushort)Marshal.ReadInt16(rec, 40);
                if (d1 == DXGI_D1) { if (id != 42) return; Frames.OnPresent((uint)Marshal.ReadInt32(rec, 12), Marshal.ReadInt64(rec, 16), true, "dxgi"); }
                else if (d1 == D3D9_D1) { if (id != 1) return; Frames.OnPresent((uint)Marshal.ReadInt32(rec, 12), Marshal.ReadInt64(rec, 16), true, "d3d9"); }
                else if (d1 == DXGK_D1) { if (id != 184) return; Frames.OnPresent((uint)Marshal.ReadInt32(rec, 12), Marshal.ReadInt64(rec, 16), false, "other"); }
            }
            catch { }
        }

        private static void Run()
        {
            IntPtr props = IntPtr.Zero, logfile = IntPtr.Zero, name = IntPtr.Zero;
            try
            {
                while (_want)
                {
                    props = Props();
                    ulong session;
                    uint rc = StartTrace(out session, Name, props);
                    if (rc == 183) // a session left behind by a crashed helper
                    {
                        StopSession();
                        Marshal.FreeHGlobal(props);
                        props = Props();
                        rc = StartTrace(out session, Name, props);
                    }
                    if (rc == 5) { State = "denied"; Detail = "access denied"; Status(); return; }
                    if (rc != 0) { State = "error"; Detail = "StartTrace " + rc; Status(); return; }
                    _session = session;
                    uint e1 = Enable(session, DXGI, 0x2, new ushort[] { 42 });
                    uint e2 = Enable(session, D3D9, 0x2, new ushort[] { 1 });
                    uint e3 = Enable(session, DXGKRNL, 0x8000000, new ushort[] { 184 });
                    if (e1 != 0 && e3 != 0) { State = "error"; Detail = "EnableTraceEx2 " + e1 + "/" + e2 + "/" + e3; StopSession(); Status(); return; }

                    logfile = Marshal.AllocHGlobal(448);
                    for (int i = 0; i < 448; i++) Marshal.WriteByte(logfile, i, 0);
                    name = Marshal.StringToHGlobalUni(Name);
                    _cb = new EventRecordCallback(OnEvent);
                    Marshal.WriteInt64(logfile, 8, name.ToInt64());                                     // LoggerName
                    Marshal.WriteInt32(logfile, 28, unchecked((int)(PROCESS_TRACE_MODE_REAL_TIME | PROCESS_TRACE_MODE_EVENT_RECORD)));
                    Marshal.WriteInt64(logfile, 424, Marshal.GetFunctionPointerForDelegate(_cb).ToInt64()); // EventRecordCallback
                    ulong trace = OpenTrace(logfile);
                    if (trace == ulong.MaxValue) { State = "error"; Detail = "OpenTrace " + Marshal.GetLastWin32Error(); StopSession(); Status(); return; }
                    _trace = trace;
                    State = "ok"; Detail = ""; Status();
                    ProcessTrace(new ulong[] { trace }, 1, IntPtr.Zero, IntPtr.Zero); // blocks until the session stops
                    CloseTrace(trace);
                    Marshal.FreeHGlobal(logfile); logfile = IntPtr.Zero;
                    Marshal.FreeHGlobal(name); name = IntPtr.Zero;
                    Marshal.FreeHGlobal(props); props = IntPtr.Zero;
                    Frames.Reset();
                    if (_want) Thread.Sleep(1500); // the session was stopped by someone else: start again
                }
                State = "off"; Status();
            }
            catch (Exception ex)
            {
                State = "error"; Detail = ex.Message; Status();
            }
            finally
            {
                if (logfile != IntPtr.Zero) Marshal.FreeHGlobal(logfile);
                if (name != IntPtr.Zero) Marshal.FreeHGlobal(name);
                if (props != IntPtr.Zero) Marshal.FreeHGlobal(props);
                lock (Gate) { _thread = null; }
            }
        }

        public static void Status()
        {
            O.Line(new Obj().S("type", "game.etw").S("state", State).S("detail", Detail).ToString());
        }
    }

    // RivaTuner Statistics Server (ships with MSI Afterburner) publishes per-application frame rates.
    internal static class Rtss
    {
        public static bool Available;

        // RivaTuner is running when its shared memory exists (checked every tick; Read() only runs without ETW)
        public static bool Probe()
        {
            IntPtr h = N.OpenFileMapping(4, false, "RTSSSharedMemoryV2");
            if (h == IntPtr.Zero) { Available = false; return false; }
            N.CloseHandle(h);
            Available = true;
            return true;
        }

        public static bool Read(uint pid, out double fps, out double ft)
        {
            fps = -1; ft = -1;
            IntPtr h = N.OpenFileMapping(4, false, "RTSSSharedMemoryV2");
            if (h == IntPtr.Zero) { Available = false; return false; }
            IntPtr p = IntPtr.Zero;
            try
            {
                p = N.MapViewOfFile(h, 4, 0, 0, UIntPtr.Zero);
                if (p == IntPtr.Zero) return false;
                Available = true;
                if (Marshal.ReadInt32(p, 0) != 0x52545353) return false; // 'RTSS'
                int entrySize = Marshal.ReadInt32(p, 8);
                int arrOffset = Marshal.ReadInt32(p, 12);
                int arrSize = Marshal.ReadInt32(p, 16);
                if (entrySize < 284 || arrSize <= 0 || arrSize > 1024) return false;
                for (int i = 0; i < arrSize; i++)
                {
                    IntPtr e = new IntPtr(p.ToInt64() + arrOffset + (long)i * entrySize);
                    if ((uint)Marshal.ReadInt32(e, 0) != pid) continue;
                    uint t0 = (uint)Marshal.ReadInt32(e, 268), t1 = (uint)Marshal.ReadInt32(e, 272);
                    uint frames = (uint)Marshal.ReadInt32(e, 276), frameTime = (uint)Marshal.ReadInt32(e, 280);
                    if (t1 > t0) fps = frames * 1000.0 / (t1 - t0);
                    if (frameTime > 0) ft = frameTime / 1000.0;
                    return fps >= 0;
                }
                return false;
            }
            catch { return false; }
            finally
            {
                if (p != IntPtr.Zero) N.UnmapViewOfFile(p);
                N.CloseHandle(h);
            }
        }
    }


    // Draws our text through RivaTuner's on-screen display. RTSS hooks the game's own renderer, so this is
    // visible in every mode, including exclusive fullscreen, and it is the overlay route anti-cheats accept.
    // Layout (RTSSSharedMemory.h v2.x): header dwOSDEntrySize @20, dwOSDArrOffset @24, dwOSDArrSize @28,
    // dwOSDFrame @32; entry szOSD[256] @0, szOSDOwner[256] @256, szOSDEx[4096] @512 (v2.7+). Slot 0 belongs to RTSS.
    internal static class Osd
    {
        private const string Owner = "Blinkelo";
        private static int _slot;
        private static string _last = "";

        private static bool Open(out IntPtr h, out IntPtr p)
        {
            p = IntPtr.Zero;
            h = N.OpenFileMapping(0x0002 | 0x0004, false, "RTSSSharedMemoryV2"); // FILE_MAP_WRITE | FILE_MAP_READ
            if (h == IntPtr.Zero) return false;
            p = N.MapViewOfFile(h, 0x0002 | 0x0004, 0, 0, UIntPtr.Zero);
            if (p == IntPtr.Zero) { N.CloseHandle(h); h = IntPtr.Zero; return false; }
            int ver = Marshal.ReadInt32(p, 4);
            if (Marshal.ReadInt32(p, 0) != 0x52545353 || (ver >> 16) != 2) { Close(h, p); h = IntPtr.Zero; p = IntPtr.Zero; return false; }
            return true;
        }

        private static void Close(IntPtr h, IntPtr p)
        {
            if (p != IntPtr.Zero) N.UnmapViewOfFile(p);
            if (h != IntPtr.Zero) N.CloseHandle(h);
        }

        private static string Ansi(IntPtr at, int max)
        {
            byte[] b = new byte[max];
            Marshal.Copy(at, b, 0, max);
            int n = Array.IndexOf(b, (byte)0);
            return Encoding.ASCII.GetString(b, 0, n < 0 ? max : n);
        }

        private static void WriteAnsi(IntPtr at, string text, int max)
        {
            byte[] b = Encoding.Default.GetBytes(text ?? "");
            int n = Math.Min(b.Length, max - 1);
            Marshal.Copy(b, 0, at, n);
            Marshal.WriteByte(at, n, 0);
        }

        // returns false when RTSS isn't running
        public static bool Update(string text)
        {
            IntPtr h, p;
            if (!Open(out h, out p)) { _slot = 0; return false; }
            try
            {
                int ver = Marshal.ReadInt32(p, 4);
                int size = Marshal.ReadInt32(p, 20), off = Marshal.ReadInt32(p, 24), count = Marshal.ReadInt32(p, 28);
                if (size < 512 || count <= 1 || count > 256) return false;
                bool ex = (ver & 0xFFFF) >= 7 && size >= 512 + 4096;
                for (int pass = 0; pass < 2; pass++)
                {
                    for (int i = 1; i < count; i++)
                    {
                        if (pass == 0 && _slot != 0 && i != _slot) continue;
                        IntPtr e = new IntPtr(p.ToInt64() + off + (long)i * size);
                        IntPtr owner = new IntPtr(e.ToInt64() + 256);
                        string o = Ansi(owner, 256);
                        if (pass == 1 && o.Length == 0) { WriteAnsi(owner, Owner, 256); o = Owner; }
                        if (o != Owner) continue;
                        _slot = i;
                        if (text != _last || pass == 1)
                        {
                            if (ex) WriteAnsi(new IntPtr(e.ToInt64() + 512), text, 4096);
                            else WriteAnsi(e, text, 256);
                            Marshal.WriteInt32(p, 32, Marshal.ReadInt32(p, 32) + 1); // dwOSDFrame: redraw
                            _last = text;
                        }
                        return true;
                    }
                    _slot = 0;
                }
                return false;
            }
            catch { return false; }
            finally { Close(h, p); }
        }

        public static void Release()
        {
            IntPtr h, p;
            _last = "";
            if (!Open(out h, out p)) { _slot = 0; return; }
            try
            {
                int size = Marshal.ReadInt32(p, 20), off = Marshal.ReadInt32(p, 24), count = Marshal.ReadInt32(p, 28);
                if (size < 512 || count > 256) return;
                for (int i = 1; i < count; i++)
                {
                    IntPtr e = new IntPtr(p.ToInt64() + off + (long)i * size);
                    if (Ansi(new IntPtr(e.ToInt64() + 256), 256) != Owner) continue;
                    int clear = Math.Min(size, 512 + 4096);
                    for (int k = 0; k < clear; k++) Marshal.WriteByte(e, k, 0);
                    Marshal.WriteInt32(p, 32, Marshal.ReadInt32(p, 32) + 1);
                }
            }
            catch { }
            finally { _slot = 0; Close(h, p); }
        }

        static Osd()
        {
            try { AppDomain.CurrentDomain.ProcessExit += delegate { Release(); }; } catch { }
        }
    }

    // ------------------------------------------------------------------ GPU usage / VRAM (all vendors, no admin)
    internal static class Gpu
    {
        private static Dictionary<string, CounterSample> _prev = new Dictionary<string, CounterSample>();
        private static bool _broken;
        private static long _vramTotal = -2;

        public static void Sample(out double usage, out double vramUsed, out double vramTotal)
        {
            usage = -1; vramUsed = -1; vramTotal = -1;
            if (_broken) return;
            try
            {
                PerformanceCounterCategory cat = new PerformanceCounterCategory("GPU Engine");
                InstanceDataCollectionCollection all = cat.ReadCategory();
                InstanceDataCollection util = all["Utilization Percentage"];
                Dictionary<string, CounterSample> next = new Dictionary<string, CounterSample>();
                Dictionary<string, double> sums = new Dictionary<string, double>();
                if (util != null)
                {
                    foreach (InstanceData d in util.Values)
                    {
                        string inst = d.InstanceName;
                        CounterSample s = d.Sample;
                        next[inst] = s;
                        CounterSample old;
                        if (!_prev.TryGetValue(inst, out old)) continue;
                        float v = CounterSample.Calculate(old, s);
                        if (v <= 0 || float.IsNaN(v)) continue;
                        int li = inst.IndexOf("luid_", StringComparison.Ordinal);
                        int pi = inst.IndexOf("_phys", StringComparison.Ordinal);
                        int ei = inst.IndexOf("engtype_", StringComparison.Ordinal);
                        string key = (li >= 0 && pi > li ? inst.Substring(li, pi - li) : "") + "|" + (ei >= 0 ? inst.Substring(ei + 8) : "");
                        double cur;
                        sums.TryGetValue(key, out cur);
                        sums[key] = cur + v;
                    }
                }
                bool first = _prev.Count == 0;
                _prev = next;
                if (!first)
                {
                    double max = 0;
                    foreach (double v in sums.Values) if (v > max) max = v;
                    usage = Math.Min(100, max);
                }
            }
            catch (Exception ex) { _broken = true; O.Log("warn", "gpu engine counters: " + ex.Message); }
            try
            {
                PerformanceCounterCategory mem = new PerformanceCounterCategory("GPU Adapter Memory");
                InstanceDataCollection ded = mem.ReadCategory()["Dedicated Usage"];
                if (ded != null)
                {
                    double max = -1;
                    foreach (InstanceData d in ded.Values) if (d.RawValue > max) max = d.RawValue;
                    vramUsed = max;
                }
            }
            catch { }
            if (_vramTotal == -2) _vramTotal = VramTotal();
            vramTotal = _vramTotal;
        }

        private static long VramTotal()
        {
            long best = -1;
            try
            {
                using (RegistryKey cls = Registry.LocalMachine.OpenSubKey(@"SYSTEM\CurrentControlSet\Control\Class\{4d36e968-e325-11ce-bfc1-08002be10318}"))
                {
                    if (cls == null) return -1;
                    foreach (string sub in cls.GetSubKeyNames())
                    {
                        try
                        {
                            using (RegistryKey k = cls.OpenSubKey(sub))
                            {
                                if (k == null) continue;
                                object q = k.GetValue("HardwareInformation.qwMemorySize");
                                long v = -1;
                                if (q is long) v = (long)q;
                                else if (q is byte[] && ((byte[])q).Length >= 8) v = BitConverter.ToInt64((byte[])q, 0);
                                else if (q is int) v = (uint)(int)q;
                                if (v <= 0)
                                {
                                    object m = k.GetValue("HardwareInformation.MemorySize");
                                    if (m is int) v = (uint)(int)m;
                                    else if (m is byte[] && ((byte[])m).Length >= 4) v = BitConverter.ToUInt32((byte[])m, 0);
                                }
                                if (v > best) best = v;
                            }
                        }
                        catch { }
                    }
                }
            }
            catch { }
            return best;
        }
    }

    // ------------------------------------------------------------------ temperatures
    // Monotonic milliseconds since the helper started. Environment.TickCount is a signed 32-bit value that turns
    // negative after 24.9 days of uptime (common with Fast Startup), which breaks "now >= deadline" comparisons.
    internal static class Clock
    {
        private static readonly Stopwatch Sw = Stopwatch.StartNew();
        public static long Ms { get { return Sw.ElapsedMilliseconds; } }
    }

    internal static class Temps
    {
        private static long _wmiRetryAt;
        private static string _wmiNs;         // namespace that worked last time
        private static bool _acpiBroken;

        public static void Read(out double cpu, out string cpuSrc, out double gpu, out string gpuSrc)
        {
            cpu = -1; gpu = -1; cpuSrc = ""; gpuSrc = "";
            long now = Clock.Ms;
            if (_wmiNs != null || now - _wmiRetryAt >= 0)
            {
                string[] spaces = _wmiNs != null ? new string[] { _wmiNs } : new string[] { @"root\LibreHardwareMonitor", @"root\OpenHardwareMonitor" };
                bool any = false;
                foreach (string ns in spaces)
                {
                    if (FromWmi(ns, ref cpu, ref gpu)) { any = true; _wmiNs = ns; string src = ns.EndsWith("LibreHardwareMonitor") ? "lhm" : "ohm"; if (cpu >= 0) cpuSrc = src; if (gpu >= 0) gpuSrc = src; break; }
                }
                if (!any) { _wmiNs = null; _wmiRetryAt = now + 30000; }
            }
            if (cpu < 0 || gpu < 0)
            {
                double c2 = -1, g2 = -1;
                if (FromHwinfo(ref c2, ref g2))
                {
                    if (cpu < 0 && c2 >= 0) { cpu = c2; cpuSrc = "hwinfo"; }
                    if (gpu < 0 && g2 >= 0) { gpu = g2; gpuSrc = "hwinfo"; }
                }
            }
            if (cpu < 0 && !_acpiBroken)
            {
                double a = Acpi();
                if (a >= 0) { cpu = a; cpuSrc = "acpi"; }
            }
        }

        private static bool FromWmi(string ns, ref double cpu, ref double gpu)
        {
            try
            {
                ManagementScope scope = new ManagementScope(ns);
                scope.Options.Timeout = TimeSpan.FromSeconds(2);
                scope.Connect();
                ObjectQuery q = new ObjectQuery("SELECT Identifier, Name, Value FROM Sensor WHERE SensorType='Temperature'");
                double cpuPkg = -1, cpuMax = -1, gpuCore = -1, gpuMax = -1;
                using (ManagementObjectSearcher s = new ManagementObjectSearcher(scope, q))
                using (ManagementObjectCollection res = s.Get())
                {
                    foreach (ManagementBaseObject o in res)
                    {
                        string id = Convert.ToString(o["Identifier"]) ?? "";
                        string nm = (Convert.ToString(o["Name"]) ?? "").ToLowerInvariant();
                        double v = Convert.ToDouble(o["Value"], CultureInfo.InvariantCulture);
                        if (v <= 0 || v > 130) continue;
                        if (id.StartsWith("/intelcpu", StringComparison.OrdinalIgnoreCase) || id.StartsWith("/amdcpu", StringComparison.OrdinalIgnoreCase))
                        {
                            if (nm.Contains("package") || nm.Contains("tctl") || nm.Contains("tdie")) cpuPkg = Math.Max(cpuPkg, v);
                            if (!nm.Contains("distance")) cpuMax = Math.Max(cpuMax, v);
                        }
                        else if (id.StartsWith("/gpu", StringComparison.OrdinalIgnoreCase))
                        {
                            if (nm == "gpu core" || nm == "gpu temperature") gpuCore = Math.Max(gpuCore, v);
                            if (!nm.Contains("memory") && !nm.Contains("hot spot")) gpuMax = Math.Max(gpuMax, v);
                        }
                    }
                }
                cpu = cpuPkg >= 0 ? cpuPkg : cpuMax;
                gpu = gpuCore >= 0 ? gpuCore : gpuMax;
                return true;
            }
            catch { return false; }
        }

        private static string Ansi(IntPtr p, int off, int max)
        {
            byte[] b = new byte[max];
            Marshal.Copy(new IntPtr(p.ToInt64() + off), b, 0, max);
            int n = Array.IndexOf(b, (byte)0);
            return Encoding.Default.GetString(b, 0, n < 0 ? max : n);
        }

        private static bool FromHwinfo(ref double cpu, ref double gpu)
        {
            IntPtr h = N.OpenFileMapping(4, false, "Global\\HWiNFO_SENS_SM2");
            if (h == IntPtr.Zero) return false;
            IntPtr p = IntPtr.Zero;
            try
            {
                p = N.MapViewOfFile(h, 4, 0, 0, UIntPtr.Zero);
                if (p == IntPtr.Zero) return false;
                if (Marshal.ReadInt32(p, 0) == 0x44414544) return false; // 'DEAD'
                int off = Marshal.ReadInt32(p, 32), size = Marshal.ReadInt32(p, 36), count = Marshal.ReadInt32(p, 40);
                if (size < 292 || count <= 0 || count > 20000) return false;
                int cpuRank = 99, gpuRank = 99;
                for (int i = 0; i < count; i++)
                {
                    IntPtr r = new IntPtr(p.ToInt64() + off + (long)i * size);
                    if (Marshal.ReadInt32(r, 0) != 1) continue; // SENSOR_TYPE_TEMP
                    string label = Ansi(r, 12, 128).ToLowerInvariant();
                    double v = BitConverter.Int64BitsToDouble(Marshal.ReadInt64(r, 284));
                    if (v <= 0 || v > 130) continue;
                    int cr = label == "cpu package" ? 0 : label.Contains("tctl/tdie") ? 1 : label == "cpu (tctl/tdie)" ? 1 : label == "core max" ? 2 : label == "cpu die (average)" ? 3 : 99;
                    if (cr < cpuRank) { cpuRank = cr; cpu = v; }
                    int gr = label == "gpu temperature" ? 0 : label == "gpu core" ? 1 : 99;
                    if (gr < gpuRank) { gpuRank = gr; gpu = v; }
                }
                return cpu >= 0 || gpu >= 0;
            }
            catch { return false; }
            finally
            {
                if (p != IntPtr.Zero) N.UnmapViewOfFile(p);
                N.CloseHandle(h);
            }
        }

        // ACPI thermal zones: often the motherboard, not the CPU package, so the UI marks it as approximate.
        private static double Acpi()
        {
            try
            {
                PerformanceCounterCategory cat = new PerformanceCounterCategory("Thermal Zone Information");
                InstanceDataCollectionCollection all = cat.ReadCategory();
                InstanceDataCollection hp = null;
                try { hp = all["High Precision Temperature"]; } catch { }
                double best = -1;
                if (hp != null && hp.Count > 0)
                {
                    foreach (InstanceData d in hp.Values) best = Math.Max(best, d.RawValue / 10.0 - 273.15);
                }
                else
                {
                    InstanceDataCollection t = all["Temperature"];
                    if (t != null) foreach (InstanceData d in t.Values) best = Math.Max(best, d.RawValue - 273.15);
                }
                return best > 5 && best < 125 ? best : -1;
            }
            catch { _acpiBroken = true; return -1; }
        }
    }

    // ------------------------------------------------------------------ power plan
    internal static class Power
    {
        [DllImport("powrprof.dll")]
        private static extern uint PowerGetActiveScheme(IntPtr root, out IntPtr guid);
        [DllImport("powrprof.dll")]
        private static extern uint PowerSetActiveScheme(IntPtr root, ref Guid guid);
        [DllImport("powrprof.dll")]
        private static extern uint PowerReadFriendlyName(IntPtr root, ref Guid scheme, IntPtr sub, IntPtr setting, IntPtr buffer, ref uint size);
        [DllImport("powrprof.dll", EntryPoint = "PowerGetEffectiveOverlayScheme")]
        private static extern uint GetOverlay(out Guid guid);
        [DllImport("powrprof.dll", EntryPoint = "PowerSetActiveOverlayScheme")]
        private static extern uint SetOverlay(Guid guid);
        [DllImport("kernel32.dll")]
        private static extern IntPtr LocalFree(IntPtr p);

        public static readonly Guid HighPerformance = new Guid("8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c");
        public static readonly Guid Ultimate = new Guid("e9a42b02-d5df-448d-aa00-03f14749eb61");
        public static readonly Guid Balanced = new Guid("381b4222-f694-41f0-9685-ff5bb260df2e");
        public static readonly Guid OverlayBest = new Guid("ded574b5-45a0-4f42-8737-46345c09c238");

        public static string Active()
        {
            IntPtr p;
            if (PowerGetActiveScheme(IntPtr.Zero, out p) != 0 || p == IntPtr.Zero) return "";
            try { return ((Guid)Marshal.PtrToStructure(p, typeof(Guid))).ToString(); }
            finally { LocalFree(p); }
        }

        private static bool Exists(Guid g)
        {
            uint size = 0;
            return PowerReadFriendlyName(IntPtr.Zero, ref g, IntPtr.Zero, IntPtr.Zero, IntPtr.Zero, ref size) == 0 && size > 0;
        }

        public static string Overlay()
        {
            try { Guid g; return GetOverlay(out g) == 0 ? g.ToString() : ""; }
            catch { return ""; }
        }

        private static bool TrySetOverlay(string g)
        {
            try { return SetOverlay(new Guid(g)) == 0; }
            catch { return false; }
        }

        // switches to the fastest plan; returns what was active so it can be restored
        public static string Perf(string id)
        {
            string prev = Active(), prevOv = Overlay();
            string mode = "";
            bool ok = false;
            Guid target = Guid.Empty;
            if (prev == HighPerformance.ToString() || prev == Ultimate.ToString()) { ok = true; mode = "already"; }
            else if (Exists(HighPerformance)) target = HighPerformance;
            else if (Exists(Ultimate)) target = Ultimate;
            if (!ok && target != Guid.Empty)
            {
                Guid t = target;
                ok = PowerSetActiveScheme(IntPtr.Zero, ref t) == 0;
                if (ok) mode = target == HighPerformance ? "high" : "ultimate";
            }
            if (!ok && prevOv != "")
            {
                // modern-standby PCs only have Balanced: use the "Best performance" power mode instead
                if (prevOv == OverlayBest.ToString()) { ok = true; mode = "already"; }
                else if (TrySetOverlay(OverlayBest.ToString())) { ok = true; mode = "overlay"; }
            }
            return new Obj().S("type", "game.result").S("id", id).S("op", "power").B("ok", ok).S("mode", mode)
                .S("prevScheme", prev).S("prevOverlay", prevOv).S("scheme", Active()).ToString();
        }

        public static string Restore(string id, string scheme, string overlay)
        {
            bool ok = true;
            try
            {
                if (scheme.Length == 36)
                {
                    Guid g = new Guid(scheme);
                    if (Active() != scheme) ok = PowerSetActiveScheme(IntPtr.Zero, ref g) == 0;
                }
                if (overlay.Length == 36 && Overlay() != overlay) ok = TrySetOverlay(overlay) && ok;
            }
            catch { ok = false; }
            return new Obj().S("type", "game.result").S("id", id).S("op", "powerRestore").B("ok", ok).S("scheme", Active()).ToString();
        }
    }


    // Registry side of the game library (Node parses the launcher files). Unicode-safe, unlike reg.exe output.
    internal static class Lib
    {
        private static string Str(RegistryKey k, string name)
        {
            try { object v = k.GetValue(name); return v == null ? "" : Convert.ToString(v, CultureInfo.InvariantCulture); }
            catch { return ""; }
        }

        private static void Uninstall(RegistryKey root, string path, StringBuilder sb, ref bool first)
        {
            try
            {
                using (RegistryKey u = root.OpenSubKey(path))
                {
                    if (u == null) return;
                    foreach (string sub in u.GetSubKeyNames())
                    {
                        bool steam = sub.StartsWith("Steam App ", StringComparison.OrdinalIgnoreCase);
                        bool ubi = sub.StartsWith("Uplay Install ", StringComparison.OrdinalIgnoreCase);
                        bool rtss = sub.Equals("RTSS", StringComparison.OrdinalIgnoreCase);
                        if (!steam && !ubi && !rtss) continue;
                        using (RegistryKey k = u.OpenSubKey(sub))
                        {
                            if (k == null) continue;
                            if (!first) sb.Append(',');
                            first = false;
                            sb.Append(new Obj().S("key", sub).S("name", Str(k, "DisplayName")).S("icon", Str(k, "DisplayIcon")).S("loc", Str(k, "InstallLocation")).ToString());
                        }
                    }
                }
            }
            catch { }
        }

        public static void Scan(string id)
        {
            Obj o = new Obj().S("type", "game.lib").S("id", id);
            string steam = "";
            try { using (RegistryKey k = Registry.CurrentUser.OpenSubKey(@"Software\Valve\Steam")) if (k != null) steam = Str(k, "SteamPath"); } catch { }
            if (steam.Length == 0) try { using (RegistryKey k = Registry.LocalMachine.OpenSubKey(@"SOFTWARE\WOW6432Node\Valve\Steam")) if (k != null) steam = Str(k, "InstallPath"); } catch { }
            o.S("steam", steam);

            StringBuilder gog = new StringBuilder("[");
            bool gf = true;
            foreach (string gp in new string[] { @"SOFTWARE\WOW6432Node\GOG.com\Games", @"SOFTWARE\GOG.com\Games" })
            {
                try
                {
                    using (RegistryKey g = Registry.LocalMachine.OpenSubKey(gp))
                    {
                        if (g == null) continue;
                        foreach (string sub in g.GetSubKeyNames())
                        {
                            using (RegistryKey k = g.OpenSubKey(sub))
                            {
                                if (k == null) continue;
                                if (!gf) gog.Append(',');
                                gf = false;
                                gog.Append(new Obj().S("id", sub).S("name", Str(k, "gameName")).S("exe", Str(k, "exe")).S("path", Str(k, "path"))
                                    .S("args", Str(k, "launchParam")).S("workingDir", Str(k, "workingDir")).S("dlc", Str(k, "dependsOn")).ToString());
                            }
                        }
                    }
                    if (!gf) break;
                }
                catch { }
            }
            o.Raw("gog", gog.Append(']').ToString());

            StringBuilder ubi = new StringBuilder("[");
            bool uf = true;
            try
            {
                using (RegistryKey u = Registry.LocalMachine.OpenSubKey(@"SOFTWARE\WOW6432Node\Ubisoft\Launcher\Installs"))
                {
                    if (u != null)
                        foreach (string sub in u.GetSubKeyNames())
                            using (RegistryKey k = u.OpenSubKey(sub))
                            {
                                if (k == null) continue;
                                if (!uf) ubi.Append(',');
                                uf = false;
                                ubi.Append(new Obj().S("id", sub).S("dir", Str(k, "InstallDir")).ToString());
                            }
                }
            }
            catch { }
            o.Raw("ubi", ubi.Append(']').ToString());

            StringBuilder un = new StringBuilder("[");
            bool nf = true;
            Uninstall(Registry.LocalMachine, @"SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall", un, ref nf);
            Uninstall(Registry.LocalMachine, @"SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall", un, ref nf);
            Uninstall(Registry.CurrentUser, @"Software\Microsoft\Windows\CurrentVersion\Uninstall", un, ref nf);
            o.Raw("uninstall", un.Append(']').ToString());

            string rtss = "";
            foreach (string rp in new string[] { @"SOFTWARE\WOW6432Node\Unwinder\RTSS", @"SOFTWARE\Unwinder\RTSS" })
            {
                try { using (RegistryKey k = Registry.LocalMachine.OpenSubKey(rp)) if (k != null) { rtss = Str(k, "InstallDir"); if (rtss.Length == 0) rtss = Str(k, "InstallPath"); } } catch { }
                if (rtss.Length > 0) break;
            }
            o.S("rtss", rtss).S("programData", Environment.GetFolderPath(Environment.SpecialFolder.CommonApplicationData));
            O.Line(o.ToString());
        }
    }

    // ------------------------------------------------------------------ main controller
    public static class Game
    {
        private static readonly object Gate = new object();
        private static Thread _watch;
        private static volatile bool _watchOn, _metricsOn;
        private static volatile string _pingHost = "";
        private static volatile int _pingMs = -1;
        private static Thread _pinger;
        private static string _lastFg = "";
        private static bool _xfsBroken;
        private static int _osdState = -1; // RivaTuner overlay: -1 not reported yet, 0 RivaTuner missing, 1 shown

        private static readonly string[] Critical =
        {
            "system", "idle", "smss", "csrss", "wininit", "winlogon", "services", "lsass", "lsaiso", "dwm", "audiodg", "fontdrvhost",
            "memory compression", "registry", "secure system", "msmpeng", "nissrv", "sihost", "ctfmon", "textinputhost", "searchhost",
            "startmenuexperiencehost", "shellexperiencehost", "runtimebroker", "taskhostw", "powershell", "electron", "blinkelo", "dynamic island",
        };

        public static void Command(string[] p)
        {
            string name = p[0];
            string a1 = p.Length > 1 ? p[1] : "", a2 = p.Length > 2 ? p[2] : "", a3 = p.Length > 3 ? p[3] : "";
            switch (name)
            {
                case "game.watch": SetWatch(a1 == "1"); break;
                case "game.metrics": _metricsOn = a1 == "1"; break;
                case "game.fps": Etw.Set(a1 == "1"); if (a1 != "1") Etw.Status(); break;
                case "game.ping": SetPing(a1); break;
                case "game.track": { uint pid; uint.TryParse(a1, out pid); Frames.Track(pid); } break;
                case "game.access": Access(); break;
                case "game.procs": Background(delegate { Procs(a1); }); break;
                case "game.lib": Background(delegate { Lib.Scan(a1); }); break;
                case "game.trim": Background(delegate { Trim(a1, a2); }); break;
                case "game.close": Background(delegate { Close(a1, a2, a3 == "1"); }); break;
                case "game.power":
                    Background(delegate
                    {
                        if (a2 == "perf") O.Line(Power.Perf(a1));
                        else O.Line(Power.Restore(a1, a3.Split('|')[0], a3.IndexOf('|') >= 0 ? a3.Split('|')[1] : ""));
                    });
                    break;
                case "game.state": O.Line(new Obj().S("type", "game.state").S("scheme", Power.Active()).S("overlay", Power.Overlay()).ToString()); break;
                case "game.osd":
                    if (a1.Length == 0) { Osd.Release(); _osdState = -1; }
                    else
                    {
                        // the first answer after every switch-on is always sent, also "RivaTuner is not running":
                        // the app waits for it before it falls back to the window bar
                        int state = Osd.Update(a1) ? 1 : 0;
                        if (state != _osdState) { _osdState = state; O.Line(new Obj().S("type", "game.osd").B("ok", state == 1).ToString()); }
                    }
                    break;
            }
        }

        private static void Background(ThreadStart fn)
        {
            Thread t = new Thread(delegate ()
            {
                try { fn(); }
                catch (Exception ex) { O.Log("error", ex.Message); }
            });
            t.IsBackground = true;
            t.Start();
        }

        private static void SetWatch(bool on)
        {
            lock (Gate)
            {
                _watchOn = on;
                if (on && _watch == null)
                {
                    _lastFg = "";
                    _watch = new Thread(Loop);
                    _watch.IsBackground = true;
                    _watch.Name = "island-game";
                    _watch.Start();
                }
            }
        }

        private static void SetPing(string host)
        {
            host = (host ?? "").Trim();
            if (host.Length > 120) host = host.Substring(0, 120);
            _pingHost = host;
            _pingMs = -1;
            lock (Gate)
            {
                if (host.Length > 0 && _pinger == null)
                {
                    _pinger = new Thread(PingLoop);
                    _pinger.IsBackground = true;
                    _pinger.Name = "island-ping";
                    _pinger.Start();
                }
            }
        }

        private static void PingLoop()
        {
            try
            {
                using (Ping ping = new Ping())
                {
                    while (_pingHost.Length > 0)
                    {
                        string host = _pingHost;
                        try
                        {
                            PingReply r = ping.Send(host, 1000);
                            _pingMs = r != null && r.Status == IPStatus.Success ? (int)r.RoundtripTime : -2;
                        }
                        catch { _pingMs = -2; }
                        for (int i = 0; i < 20 && _pingHost == host; i++) Thread.Sleep(100);
                    }
                }
            }
            finally { lock (Gate) { _pinger = null; } }
        }

        private static void Loop()
        {
            long nextTemps = 0;
            double cpuT = -1, gpuT = -1; string cpuSrc = "", gpuSrc = "";
            try
            {
                while (_watchOn)
                {
                    long t0 = Clock.Ms;
                    uint fgPid = 0;
                    try { fgPid = Foreground(); } catch (Exception ex) { O.Log("warn", "foreground: " + ex.Message); }

                    uint pid = Frames.Tracked != 0 ? Frames.Tracked : fgPid;
                    bool rtssUp = Rtss.Probe();
                    double fps = -1, ft = -1, low = -1; string api = "", src = "";
                    if (Etw.State == "ok" && Frames.Stats(pid, out fps, out ft, out low, out api)) src = "etw";
                    else if (Rtss.Read(pid, out fps, out ft)) src = "rtss";
                    Obj m = new Obj().S("type", "game.metrics").N("pid", pid).N("fg", fgPid).S("src", src).S("api", api)
                        .Nn("fps", fps).Nn("ft", ft).Nn("low1", low).S("etw", Etw.State).B("rtss", rtssUp);

                    if (Frames.Tracked != 0)
                    {
                        double avg, slow; long n;
                        Frames.Session(out avg, out slow, out n);
                        m.Nn("savg", avg).Nn("slow1", slow).N("frames", n);
                        if (!N.Alive(Frames.Tracked)) O.Line(new Obj().S("type", "game.exit").N("pid", Frames.Tracked).ToString());
                    }

                    if (_metricsOn)
                    {
                        double gu, vu, vt;
                        Gpu.Sample(out gu, out vu, out vt);
                        m.Nn("gpu", gu).Nn("vram", vu).Nn("vramTotal", vt);
                        if (t0 - nextTemps >= 0)
                        {
                            nextTemps = t0 + 2000;
                            Temps.Read(out cpuT, out cpuSrc, out gpuT, out gpuSrc);
                        }
                        m.Nn("cpuTemp", cpuT).S("cpuTempSrc", cpuSrc).Nn("gpuTemp", gpuT).S("gpuTempSrc", gpuSrc);
                        if (_pingHost.Length > 0) m.N("ping", _pingMs);
                    }
                    O.Line(m.ToString());

                    int spent = (int)(Clock.Ms - t0);
                    Thread.Sleep(Math.Max(150, 1000 - spent));
                }
            }
            catch (Exception ex) { O.Log("error", "watch loop: " + ex.Message); }
            finally { lock (Gate) { _watch = null; } }
        }

        // SHQueryUserNotificationState says "Direct3D full screen" for every fullscreen game. With Windows' fullscreen
        // optimizations most of them are really presented like a borderless window, and other windows (our bar) can be
        // shown on top. Only when a program owns the display exclusively is nothing else visible.
        private static bool Exclusive()
        {
            if (_xfsBroken) return false;
            try { return N.D3DKMTCheckExclusiveOwnership(); }
            catch (Exception ex) { _xfsBroken = true; O.Log("warn", "exclusive fullscreen check unavailable: " + ex.Message); return false; }
        }

        private static uint Foreground()
        {
            IntPtr fg = N.GetForegroundWindow();
            uint pid = 0;
            if (fg != IntPtr.Zero) N.GetWindowThreadProcessId(fg, out pid);
            StringBuilder cls = new StringBuilder(128);
            StringBuilder title = new StringBuilder(256);
            bool covers = false, captioned = false;
            if (fg != IntPtr.Zero)
            {
                N.GetClassName(fg, cls, cls.Capacity);
                N.GetWindowText(fg, title, title.Capacity);
                N.RECT r;
                if (N.IsWindowVisible(fg) && !N.IsIconic(fg) && N.GetWindowRect(fg, out r))
                {
                    captioned = (N.GetWindowLong(fg, -16) & 0x00C00000) == 0x00C00000;
                    IntPtr hm = N.MonitorFromWindow(fg, 2);
                    N.MONITORINFO mi = new N.MONITORINFO();
                    mi.cbSize = Marshal.SizeOf(typeof(N.MONITORINFO));
                    if (hm != IntPtr.Zero && N.GetMonitorInfo(hm, ref mi))
                        covers = r.Left <= mi.rcMonitor.Left && r.Top <= mi.rcMonitor.Top && r.Right >= mi.rcMonitor.Right && r.Bottom >= mi.rcMonitor.Bottom;
                }
            }
            int q;
            if (N.SHQueryUserNotificationState(out q) != 0) q = 0;
            bool fs = q == 3 || (covers && !captioned);
            bool xfs = q == 3 && Exclusive();
            string key = pid + "|" + fs + "|" + xfs + "|" + title + "|" + cls;
            if (key != _lastFg)
            {
                _lastFg = key;
                string path = pid != 0 ? N.ImagePath(pid) : "";
                O.Line(new Obj().S("type", "game.fg").N("pid", pid).S("path", path).S("title", title.ToString()).S("cls", cls.ToString())
                    .B("fs", fs).B("d3dfs", q == 3).B("xfs", xfs).ToString());
            }
            return pid;
        }

        private static void Access()
        {
            bool admin = false, perfLog = false;
            try
            {
                WindowsPrincipal pr = new WindowsPrincipal(WindowsIdentity.GetCurrent());
                admin = pr.IsInRole(WindowsBuiltInRole.Administrator);
                perfLog = pr.IsInRole(new SecurityIdentifier("S-1-5-32-559"));
            }
            catch { }
            O.Line(new Obj().S("type", "game.access").B("admin", admin).B("perfLog", perfLog).S("etw", Etw.State).S("detail", Etw.Detail)
                .B("x64", IntPtr.Size == 8).ToString());
        }

        private static string ProcName(Process p)
        {
            try { return p.ProcessName; } catch { return ""; }
        }

        private static void Procs(string id)
        {
            int self = Process.GetCurrentProcess().Id;
            int session = Process.GetCurrentProcess().SessionId;
            List<KeyValuePair<long, string>> rows = new List<KeyValuePair<long, string>>();
            foreach (Process p in Process.GetProcesses())
            {
                try
                {
                    if (p.Id == self || p.SessionId != session) continue;
                    string nm = ProcName(p);
                    if (Array.IndexOf(Critical, nm.ToLowerInvariant()) >= 0) continue;
                    long mem = 0;
                    try { mem = p.WorkingSet64; } catch { }
                    IntPtr hw = IntPtr.Zero; string title = "";
                    try { hw = p.MainWindowHandle; title = p.MainWindowTitle; } catch { }
                    if (hw == IntPtr.Zero && mem < 60L * 1024 * 1024) continue;
                    string path = N.ImagePath((uint)p.Id);
                    rows.Add(new KeyValuePair<long, string>(mem, new Obj().N("pid", p.Id).S("name", nm).S("path", path).N("mem", mem)
                        .S("title", title).B("win", hw != IntPtr.Zero).ToString()));
                }
                catch { }
                finally { p.Dispose(); }
            }
            rows.Sort(delegate (KeyValuePair<long, string> a, KeyValuePair<long, string> b) { return b.Key.CompareTo(a.Key); });
            StringBuilder sb = new StringBuilder("[");
            for (int i = 0; i < rows.Count && i < 60; i++) { if (i > 0) sb.Append(','); sb.Append(rows[i].Value); }
            sb.Append(']');
            O.Line(new Obj().S("type", "game.procs").S("id", id).Raw("list", sb.ToString()).ToString());
        }

        private static HashSet<int> Pids(string csv)
        {
            HashSet<int> set = new HashSet<int>();
            foreach (string s in (csv ?? "").Split(','))
            {
                int v;
                if (int.TryParse(s.Trim(), out v) && v > 0) set.Add(v);
            }
            return set;
        }

        // Trims the working sets of background processes of this user (idle pages go to the standby list,
        // so the game can take them without waiting). Never touches the game, the foreground window or system processes.
        private static void Trim(string id, string excludeCsv)
        {
            HashSet<int> skip = Pids(excludeCsv);
            int self = Process.GetCurrentProcess().Id;
            int session = Process.GetCurrentProcess().SessionId;
            uint fg = 0;
            try { N.GetWindowThreadProcessId(N.GetForegroundWindow(), out fg); } catch { }
            ulong before = N.AvailPhys();
            int done = 0, tried = 0;
            foreach (Process p in Process.GetProcesses())
            {
                try
                {
                    if (p.Id == self || p.Id == (int)fg || skip.Contains(p.Id) || p.SessionId != session) continue;
                    if (Array.IndexOf(Critical, ProcName(p).ToLowerInvariant()) >= 0) continue;
                    tried++;
                    IntPtr h = N.OpenProcess(N.QUERY_LIMITED | N.SET_QUOTA, false, (uint)p.Id);
                    if (h == IntPtr.Zero) continue;
                    try { if (N.EmptyWorkingSet(h)) done++; }
                    finally { N.CloseHandle(h); }
                }
                catch { }
                finally { p.Dispose(); }
            }
            Thread.Sleep(400);
            ulong after = N.AvailPhys();
            double freed = after > before ? (double)(after - before) : 0;
            O.Line(new Obj().S("type", "game.result").S("id", id).S("op", "trim").B("ok", done > 0).N("count", done).N("tried", tried)
                .N("freed", freed).N("avail", after).ToString());
        }

        // Asks windows to close (like clicking X). force = end the process if it has no window or ignores the request.
        private static void Close(string id, string csv, bool force)
        {
            HashSet<int> pids = Pids(csv);
            List<string> closed = new List<string>(), failed = new List<string>();
            List<Process> waiting = new List<Process>();
            foreach (int pid in pids)
            {
                try
                {
                    Process p = Process.GetProcessById(pid);
                    if (Array.IndexOf(Critical, ProcName(p).ToLowerInvariant()) >= 0) { failed.Add(pid.ToString()); continue; }
                    bool asked = false;
                    try { asked = p.CloseMainWindow(); } catch { }
                    if (!asked && force) { try { p.Kill(); asked = true; } catch { } }
                    if (asked) waiting.Add(p); else failed.Add(pid.ToString());
                }
                catch (ArgumentException) { closed.Add(pid.ToString()); } // already gone
                catch { failed.Add(pid.ToString()); }
            }
            foreach (Process p in waiting)
            {
                try
                {
                    bool gone = p.WaitForExit(3500);
                    if (!gone && force) { try { p.Kill(); gone = p.WaitForExit(1500); } catch { } }
                    (gone ? closed : failed).Add(p.Id.ToString());
                }
                catch { failed.Add(p.Id.ToString()); }
            }
            O.Line(new Obj().S("type", "game.result").S("id", id).S("op", "close").B("ok", failed.Count == 0)
                .Raw("closed", "[" + string.Join(",", closed.ToArray()) + "]").Raw("failed", "[" + string.Join(",", failed.ToArray()) + "]").ToString());
        }
    }
}
