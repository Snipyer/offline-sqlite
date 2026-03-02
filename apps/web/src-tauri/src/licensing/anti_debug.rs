/// Anti-debugging checks. In production builds we detect attached debuggers and
/// delay startup rather than outright crashing (to avoid making the check easy to find).

#[cfg(target_os = "windows")]
pub fn is_debugger_present() -> bool {
    extern "system" {
        fn IsDebuggerPresent() -> i32;
    }
    unsafe { IsDebuggerPresent() != 0 }
}

#[cfg(target_os = "linux")]
pub fn is_debugger_present() -> bool {
    use std::fs;
    if let Ok(status) = fs::read_to_string("/proc/self/status") {
        for line in status.lines() {
            if line.starts_with("TracerPid:") {
                let pid: i32 = line
                    .split(':')
                    .nth(1)
                    .unwrap_or("0")
                    .trim()
                    .parse()
                    .unwrap_or(0);
                return pid != 0;
            }
        }
    }
    false
}

#[cfg(target_os = "macos")]
pub fn is_debugger_present() -> bool {
    use std::process::Command;
    // P_TRACED flag detection via sysctl
    if let Ok(output) = Command::new("sysctl").args(["kern.proc.pid"]).output() {
        let s = String::from_utf8_lossy(&output.stdout);
        return s.contains("P_TRACED");
    }
    false
}

/// Run the anti-debug check and log a warning if a debugger is detected.
/// In release builds, introduce a random delay to make it harder to locate.
pub fn check_debugger() {
	if cfg!(debug_assertions) {
		return;
	}

    if !is_debugger_present() {
        return;
    }

    log::warn!("Debugger detected — the application may not function correctly.");

    // In release builds, introduce a small random sleep to frustrate timers
    #[cfg(not(debug_assertions))]
    {
        let delay_ms: u64 = rand::random::<u64>() % 3000 + 500;
        std::thread::sleep(std::time::Duration::from_millis(delay_ms));
    }
}
