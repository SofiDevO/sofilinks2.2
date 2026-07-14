import { useState } from "react";
import type { Ban } from "@features/dashboard/types/dashboard.types";
import "./dashboard.css";

interface Props {
  initialBans: Ban[];
}

async function proxyFetch(
  path: string,
  method: string,
  body?: object,
) {
  const res = await fetch("/api/dashboard/proxy", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path, method, body }),
  });
  return res.json();
}

export default function BansPanel({ initialBans }: Props) {
  const [bans, setBans] = useState<Ban[]>(initialBans);
  const [unbanningIp, setUnbanningIp] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleUnban = async (ip: string) => {
    if (!confirm(`¿Desbanear la IP ${ip}?`)) return;

    setUnbanningIp(ip);
    setError(null);

    try {
      const res = await proxyFetch(`/api/v1/admin/bans/${ip}`, "DELETE");

      if (!res.success) {
        throw new Error(res.error || "Error al desbanear");
      }

      setBans((prev) => prev.filter((b) => b.ipAddress !== ip));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUnbanningIp(null);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("es-MX", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="panel-container">
      {error && (
        <div className="panel-error">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="error-close">x</button>
        </div>
      )}

      {bans.length === 0 ? (
        <div className="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.4">
            <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <p>No hay IPs baneadas</p>
          <span>Todas las IPs tienen acceso permitido</span>
        </div>
      ) : (
        <div className="bans-table-wrapper">
          <table className="bans-table">
            <thead>
              <tr>
                <th>IP</th>
                <th>Razón</th>
                <th>Fecha de baneo</th>
                <th style={{ width: "100px" }}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {bans.map((ban) => (
                <tr key={ban.ipAddress}>
                  <td>
                    <span className="ip-badge">{ban.ipAddress}</span>
                  </td>
                  <td>{ban.reason || "--"}</td>
                  <td>{formatDate(ban.bannedAt)}</td>
                  <td>
                    <button
                      onClick={() => handleUnban(ban.ipAddress)}
                      disabled={unbanningIp === ban.ipAddress}
                      className="btn-unban"
                    >
                      {unbanningIp === ban.ipAddress ? (
                        <div className="progress-spinner small" />
                      ) : (
                        "Desbanear"
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
