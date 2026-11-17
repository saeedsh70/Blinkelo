// Blinkelo - UI Automation actions (answer/decline Phone Link calls, quick reply).
// Compiled separately so a failure here never breaks the core helper. C# 5 only.
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Text;
using System.Threading;
using System.Windows.Automation;

namespace IslandUia
{
    public static class Uia
    {
        private static readonly object Sync = new object();
        private static Stream _stdout;

        private static readonly string[] HostProcesses =
        {
            "ShellExperienceHost", "ShellHost", "PhoneExperienceHost", "YourPhone", "PhoneLink",
            "CrossDeviceService", "CrossDeviceResume"
        };

        private static readonly string[] AcceptWords = { "accept", "answer" };
        private static readonly string[] DeclineWords = { "decline", "reject", "dismiss" };
        private static readonly string[] EndWords = { "end call", "hang up", "end" };
        private static readonly string[] SendWords = { "send", "reply" };

        private static void Emit(string id, bool ok, string detail)
        {
            string json = "{\"type\":\"uia\",\"id\":" + Str(id) + ",\"ok\":" + (ok ? "true" : "false") + ",\"detail\":" + Str(detail) + "}";
            StringBuilder sb = new StringBuilder();
            foreach (char ch in json)
            {
                if (ch > 126) { sb.Append("\\u"); sb.Append(((int)ch).ToString("x4")); }
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

        private static string Str(string s)
        {
            if (s == null) return "null";
            StringBuilder sb = new StringBuilder("\"");
            foreach (char c in s)
            {
                if (c == '"') sb.Append("\\\"");
                else if (c == '\\') sb.Append("\\\\");
                else if (c < 32) { sb.Append("\\u"); sb.Append(((int)c).ToString("x4")); }
                else sb.Append(c);
            }
            sb.Append('"');
            return sb.ToString();
        }

        // kind: accept | decline | end | button ; label: the toast action's content (may be empty)
        public static void InvokeAsync(string id, string kind, string label)
        {
            Thread t = new Thread(delegate ()
            {
                try
                {
                    string detail;
                    bool ok = InvokeButton(kind, label, out detail);
                    Emit(id, ok, detail);
                }
                catch (Exception ex) { Emit(id, false, ex.Message); }
            });
            t.IsBackground = true;
            t.SetApartmentState(ApartmentState.MTA);
            t.Start();
        }

        public static void ReplyAsync(string id, string text, string sendLabel)
        {
            Thread t = new Thread(delegate ()
            {
                try
                {
                    string detail;
                    bool ok = Reply(text, sendLabel, out detail);
                    Emit(id, ok, detail);
                }
                catch (Exception ex) { Emit(id, false, ex.Message); }
            });
            t.IsBackground = true;
            t.SetApartmentState(ApartmentState.MTA);
            t.Start();
        }

        private static HashSet<int> HostPids()
        {
            HashSet<int> pids = new HashSet<int>();
            foreach (string name in HostProcesses)
            {
                try
                {
                    foreach (Process p in Process.GetProcessesByName(name)) pids.Add(p.Id);
                }
                catch { }
            }
            return pids;
        }

        private static List<AutomationElement> CandidateWindows(bool phoneOnly)
        {
            List<AutomationElement> result = new List<AutomationElement>();
            HashSet<int> pids = HostPids();
            AutomationElementCollection children = AutomationElement.RootElement.FindAll(TreeScope.Children, Condition.TrueCondition);
            List<AutomationElement> late = new List<AutomationElement>();
            foreach (AutomationElement w in children)
            {
                try
                {
                    int pid = w.Current.ProcessId;
                    string cls = w.Current.ClassName ?? "";
                    string name = (w.Current.Name ?? "").ToLowerInvariant();
                    bool isToast = name.Contains("notification") || cls == "Windows.UI.Core.CoreWindow";
                    bool isPhone = name.Contains("phone link");
                    if (phoneOnly)
                    {
                        if (isPhone || (pids.Contains(pid) && !isToast)) result.Add(w);
                        continue;
                    }
                    if (pids.Contains(pid) && isToast) result.Add(w);
                    else if (isPhone || pids.Contains(pid)) late.Add(w);
                }
                catch { }
            }
            result.AddRange(late);
            return result;
        }

        private static bool Matches(string name, string label, string[] words)
        {
            if (string.IsNullOrEmpty(name)) return false;
            string n = name.Trim().ToLowerInvariant();
            if (!string.IsNullOrEmpty(label))
            {
                string l = label.Trim().ToLowerInvariant();
                if (n == l || n.StartsWith(l + " ") || n.StartsWith(l + ",")) return true;
            }
            if (words != null)
            {
                foreach (string w in words)
                {
                    if (n == w || n.StartsWith(w + " ") || n.StartsWith(w + ",") || n.Contains(" " + w)) return true;
                }
            }
            return false;
        }

        private static bool InvokeButton(string kind, string label, out string detail)
        {
            string[] words = null;
            if (kind == "accept") words = AcceptWords;
            else if (kind == "decline") words = DeclineWords;
            else if (kind == "end") words = EndWords;

            bool phoneOnly = kind == "end";
            // Toast banners may need a moment to be in the tree; retry briefly.
            for (int attempt = 0; attempt < 3; attempt++)
            {
                foreach (AutomationElement win in CandidateWindows(phoneOnly))
                {
                    AutomationElementCollection buttons;
                    try
                    {
                        buttons = win.FindAll(TreeScope.Descendants,
                            new PropertyCondition(AutomationElement.ControlTypeProperty, ControlType.Button));
                    }
                    catch { continue; }
                    foreach (AutomationElement b in buttons)
                    {
                        string name;
                        try { name = b.Current.Name; } catch { continue; }
                        if (!Matches(name, label, words)) continue;
                        object pattern;
                        if (b.TryGetCurrentPattern(InvokePattern.Pattern, out pattern))
                        {
                            ((InvokePattern)pattern).Invoke();
                            detail = "invoked '" + name + "'";
                            return true;
                        }
                    }
                }
                Thread.Sleep(250);
            }
            detail = "button not found (" + kind + " / " + label + ")";
            return false;
        }

        private static bool Reply(string text, string sendLabel, out string detail)
        {
            for (int attempt = 0; attempt < 2; attempt++)
            {
                foreach (AutomationElement win in CandidateWindows(false))
                {
                    AutomationElement edit;
                    try
                    {
                        edit = win.FindFirst(TreeScope.Descendants,
                            new PropertyCondition(AutomationElement.ControlTypeProperty, ControlType.Edit));
                    }
                    catch { continue; }
                    if (edit == null) continue;
                    object vp;
                    if (!edit.TryGetCurrentPattern(ValuePattern.Pattern, out vp)) continue;
                    ((ValuePattern)vp).SetValue(text);
                    Thread.Sleep(120);
                    AutomationElementCollection buttons = win.FindAll(TreeScope.Descendants,
                        new PropertyCondition(AutomationElement.ControlTypeProperty, ControlType.Button));
                    foreach (AutomationElement b in buttons)
                    {
                        string name;
                        try { name = b.Current.Name; } catch { continue; }
                        if (!Matches(name, sendLabel, SendWords)) continue;
                        object ip;
                        if (b.TryGetCurrentPattern(InvokePattern.Pattern, out ip))
                        {
                            ((InvokePattern)ip).Invoke();
                            detail = "sent";
                            return true;
                        }
                    }
                    detail = "text set, send button not found";
                    return false;
                }
                Thread.Sleep(300);
            }
            detail = "reply box not found (the notification banner may have closed)";
            return false;
        }
    }
}
