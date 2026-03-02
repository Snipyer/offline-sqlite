use sha2::{Digest, Sha256};
use sysinfo::System;
use std::fs;

/// Generate a SHA-256 hardware fingerprint from multiple system signals.
/// Returns the hex-encoded hash **and** the individual signal hashes (for fuzzy matching).
pub fn generate_fingerprint() -> (String, Vec<String>) {
    let signals = collect_signals();
    let mut individual_hashes: Vec<String> = Vec::new();
    let mut combined = Sha256::new();

    for signal in &signals {
        if let Some(s) = signal {
            let h = sha256_hex(s.as_bytes());
            individual_hashes.push(h.clone());
            combined.update(s.as_bytes());
        }
    }

    // Salt to prevent rainbow tables
    combined.update(b"offline-sqlite-v1-salt");

    let fingerprint = hex::encode(combined.finalize());
    (fingerprint, individual_hashes)
}

// ── signal collection ───────────────────────────────────
fn collect_signals() -> Vec<Option<String>> {
    vec![
        get_cpu_id(),
        get_os_install_id(),
        get_hostname(),
        get_disk_serial(),
        get_mac_address(),
    ]
}

fn get_cpu_id() -> Option<String> {
    let sys = System::new_with_specifics(
        sysinfo::RefreshKind::new().with_cpu(sysinfo::CpuRefreshKind::new()),
    );
    let cpus = sys.cpus();
    if cpus.is_empty() {
        return None;
    }
    let c = &cpus[0];
    Some(format!("{}:{}", c.brand(), cpus.len()))
}

fn get_hostname() -> Option<String> {
    System::host_name()
}

fn get_os_install_id() -> Option<String> {
    #[cfg(target_os = "linux")]
    {
        fs::read_to_string("/etc/machine-id").ok().map(|s| s.trim().to_string())
    }
    #[cfg(target_os = "macos")]
    {
        use std::process::Command;
        Command::new("ioreg")
            .args(["-rd1", "-c", "IOPlatformExpertDevice"])
            .output()
            .ok()
            .and_then(|o| {
                let s = String::from_utf8_lossy(&o.stdout);
                s.lines()
                    .find(|l| l.contains("IOPlatformUUID"))
                    .map(|l| l.split('"').nth(3).unwrap_or("").to_string())
            })
    }
    #[cfg(target_os = "windows")]
    {
        use std::process::Command;
        Command::new("reg")
            .args([
                "query",
                r"HKLM\SOFTWARE\Microsoft\Cryptography",
                "/v",
                "MachineGuid",
            ])
            .output()
            .ok()
            .and_then(|o| {
                let s = String::from_utf8_lossy(&o.stdout);
                s.lines()
                    .find(|l| l.contains("MachineGuid"))
                    .map(|l| l.split_whitespace().last().unwrap_or("").to_string())
            })
    }
}

fn get_disk_serial() -> Option<String> {
    #[cfg(target_os = "linux")]
    {
        // Try to get root disk serial via lsblk
        use std::process::Command;
        Command::new("lsblk")
            .args(["-dno", "SERIAL", "/dev/sda"])
            .output()
            .ok()
            .and_then(|o| {
                let s = String::from_utf8_lossy(&o.stdout).trim().to_string();
                if s.is_empty() { None } else { Some(s) }
            })
            .or_else(|| {
                // Fallback: use /dev/disk/by-id first entry
                fs::read_dir("/dev/disk/by-id")
                    .ok()
                    .and_then(|mut rd| rd.next())
                    .and_then(|entry| entry.ok())
                    .map(|e| e.file_name().to_string_lossy().to_string())
            })
    }
    #[cfg(target_os = "macos")]
    {
        use std::process::Command;
        Command::new("system_profiler")
            .args(["SPSerialATADataType"])
            .output()
            .ok()
            .and_then(|o| {
                let s = String::from_utf8_lossy(&o.stdout);
                s.lines()
                    .find(|l| l.contains("Serial Number"))
                    .map(|l| l.split(':').nth(1).unwrap_or("").trim().to_string())
            })
    }
    #[cfg(target_os = "windows")]
    {
        use std::process::Command;
        Command::new("wmic")
            .args(["diskdrive", "get", "SerialNumber"])
            .output()
            .ok()
            .and_then(|o| {
                let s = String::from_utf8_lossy(&o.stdout);
                s.lines()
                    .nth(1)
                    .map(|l| l.trim().to_string())
                    .filter(|l| !l.is_empty())
            })
    }
}

fn get_mac_address() -> Option<String> {
    #[cfg(target_os = "linux")]
    {
        // Read the MAC of the first non-loopback interface
        if let Ok(entries) = fs::read_dir("/sys/class/net") {
            for entry in entries.flatten() {
                let name = entry.file_name().to_string_lossy().to_string();
                if name == "lo" {
                    continue;
                }
                let path = entry.path().join("address");
                if let Ok(mac) = fs::read_to_string(path) {
                    let mac = mac.trim().to_string();
                    if !mac.is_empty() && mac != "00:00:00:00:00:00" {
                        return Some(mac);
                    }
                }
            }
        }
        None
    }
    #[cfg(target_os = "macos")]
    {
        use std::process::Command;
        Command::new("ifconfig")
            .arg("en0")
            .output()
            .ok()
            .and_then(|o| {
                let s = String::from_utf8_lossy(&o.stdout);
                s.lines()
                    .find(|l| l.contains("ether"))
                    .map(|l| l.split_whitespace().nth(1).unwrap_or("").to_string())
            })
    }
    #[cfg(target_os = "windows")]
    {
        use std::process::Command;
        Command::new("getmac")
            .args(["/FO", "CSV", "/NH"])
            .output()
            .ok()
            .and_then(|o| {
                let s = String::from_utf8_lossy(&o.stdout);
                s.lines()
                    .next()
                    .and_then(|l| l.split(',').next())
                    .map(|m| m.trim_matches('"').to_string())
            })
    }
}

fn sha256_hex(data: &[u8]) -> String {
    let mut h = Sha256::new();
    h.update(data);
    hex::encode(h.finalize())
}
