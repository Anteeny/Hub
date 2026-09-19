import { useCallback, useEffect, useState } from "react";
import { supabase } from "./lib/supabase";
import { BackButton } from "./BackButton";

export type TeamMember = {
  id: string;
  tenant_id: string;
  user_id?: string | null;
  display_name?: string | null;
  email?: string | null;
  role: "owner" | "manager" | "cashier";
  pin_hash?: string | null;
  active: boolean;
  created_at?: string;
  profiles?: {
    display_name?: string | null;
    email?: string | null;
  } | null;
};

const demoTeamMembers: TeamMember[] = [
  {
    id: "demo-owner",
    tenant_id: "preview",
    user_id: "demo-user-1",
    display_name: "Store Owner",
    email: "owner@northline.test",
    role: "owner",
    pin_hash: "set",
    active: true,
  },
  {
    id: "demo-manager",
    tenant_id: "preview",
    user_id: "demo-user-2",
    display_name: "David Obi",
    email: "david@northline.test",
    role: "manager",
    pin_hash: "set",
    active: true,
  },
  {
    id: "demo-cashier-1",
    tenant_id: "preview",
    user_id: null,
    display_name: "Amina Yusuf",
    email: "amina@northline.test",
    role: "cashier",
    pin_hash: "set",
    active: true,
  },
  {
    id: "demo-cashier-2",
    tenant_id: "preview",
    user_id: null,
    display_name: "John (Register 2)",
    email: null,
    role: "cashier",
    pin_hash: "set",
    active: true,
  },
];

type Props = {
  tenantId?: string;
  preview?: boolean;
  currentUserRole?: string;
  onBack: () => void;
};

export function TeamScreen({ tenantId, preview = false, currentUserRole = "owner", onBack }: Props) {
  const [members, setMembers] = useState<TeamMember[]>(() => (preview || !tenantId ? demoTeamMembers : []));
  const [loading, setLoading] = useState(() => !(preview || !tenantId));
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "owner" | "manager" | "cashier">("all");
  const [showInactive, setShowInactive] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formRole, setFormRole] = useState<"manager" | "cashier">("cashier");
  const [formPin, setFormPin] = useState("");
  const [formActive, setFormActive] = useState(true);
  const [formSaving, setFormSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const loadTeam = useCallback(async () => {
    if (preview || !tenantId || !supabase) {
      setMembers(demoTeamMembers);
      return;
    }

    try {
      const { data, error: fetchErr } = await supabase
        .from("tenant_members")
        .select(`
          id,
          tenant_id,
          user_id,
          role,
          pin_hash,
          active,
          display_name,
          email,
          created_at,
          profiles (
            display_name,
            email
          )
        `)
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: true });

      if (fetchErr) {
        // Fallback: If columns are not yet in remote schema, fetch basic columns
        const { data: fallbackData, error: fallbackErr } = await supabase
          .from("tenant_members")
          .select("id, tenant_id, user_id, role, pin_hash, active, created_at")
          .eq("tenant_id", tenantId);

        if (fallbackErr) {
          setError(fallbackErr.message);
        } else if (fallbackData) {
          setMembers(fallbackData as TeamMember[]);
        }
      } else if (data) {
        setMembers(data as unknown as TeamMember[]);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load team members.");
    } finally {
      setLoading(false);
    }
  }, [tenantId, preview]);

  useEffect(() => {
    loadTeam();
  }, [loadTeam]);

  function openAddModal() {
    setEditingMember(null);
    setFormName("");
    setFormEmail("");
    setFormRole("cashier");
    setFormPin("");
    setFormActive(true);
    setFormError("");
    setIsModalOpen(true);
  }

  function openEditModal(member: TeamMember) {
    setEditingMember(member);
    setFormName(member.display_name || member.profiles?.display_name || "");
    setFormEmail(member.email || member.profiles?.email || "");
    setFormRole(member.role === "owner" ? "manager" : member.role);
    setFormPin(""); // Keep empty unless user wants to change it
    setFormActive(member.active);
    setFormError("");
    setIsModalOpen(true);
  }

  async function handleSaveMember(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");

    if (!formName.trim()) {
      setFormError("Please enter a name for this team member.");
      return;
    }

    if (formPin && !/^\d{4}$/.test(formPin)) {
      setFormError("PIN must be exactly 4 digits (e.g. 1234).");
      return;
    }

    setFormSaving(true);

    if (preview || !tenantId || !supabase) {
      // Preview mode update
      if (editingMember) {
        setMembers((prev) =>
          prev.map((m) =>
            m.id === editingMember.id
              ? {
                  ...m,
                  display_name: formName.trim(),
                  email: formEmail.trim() || null,
                  role: formRole,
                  pin_hash: formPin ? "set" : m.pin_hash,
                  active: formActive,
                }
              : m
          )
        );
      } else {
        const newMember: TeamMember = {
          id: `demo-${Date.now()}`,
          tenant_id: "preview",
          user_id: null,
          display_name: formName.trim(),
          email: formEmail.trim() || null,
          role: formRole,
          pin_hash: formPin ? "set" : null,
          active: true,
        };
        setMembers((prev) => [...prev, newMember]);
      }
      setFormSaving(false);
      setIsModalOpen(false);
      setSuccessMessage(editingMember ? "Member updated successfully!" : "Team member added!");
      setTimeout(() => setSuccessMessage(""), 3500);
      return;
    }

async function hashPinClientSide(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`storeflow_pin_salt_${pin}`);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return "sha256_" + hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

    try {
      // Try calling upsert_team_member RPC first
      const { error: rpcErr } = await supabase.rpc("upsert_team_member", {
        target_tenant_id: tenantId,
        member_id: editingMember ? editingMember.id : null,
        member_name: formName.trim(),
        member_email: formEmail.trim() || null,
        member_role: formRole,
        member_pin: formPin || null,
        is_active: formActive,
      });

      if (rpcErr) {
        // Direct table fallback with client-side SHA-256 cryptographic hash if RPC isn't run in remote DB yet
        const pinValue = formPin ? await hashPinClientSide(formPin) : undefined;

        if (editingMember) {
          const updatePayload: Record<string, unknown> = {
            display_name: formName.trim(),
            email: formEmail.trim() || null,
            role: formRole,
            active: formActive,
          };
          if (formPin) {
            updatePayload.pin_hash = pinValue;
          }

          const { error: updateErr } = await supabase
            .from("tenant_members")
            .update(updatePayload)
            .eq("id", editingMember.id)
            .eq("tenant_id", tenantId);

          if (updateErr) throw updateErr;
        } else {
          const insertPayload: Record<string, unknown> = {
            tenant_id: tenantId,
            display_name: formName.trim(),
            email: formEmail.trim() || null,
            role: formRole,
            active: true,
          };
          if (formPin) {
            insertPayload.pin_hash = pinValue;
          }

          const { error: insertErr } = await supabase
            .from("tenant_members")
            .insert(insertPayload);

          if (insertErr) throw insertErr;
        }
      }

      // Trigger Supabase Auth invitation email if email is provided
      let emailStatus = "";
      if (formEmail.trim() && (!editingMember || formEmail.trim() !== editingMember.email)) {
        const { error: authErr } = await supabase.auth.signInWithOtp({
          email: formEmail.trim(),
          options: {
            shouldCreateUser: true,
            emailRedirectTo: window.location.origin,
          },
        });
        if (authErr) {
          emailStatus = ` (Email notice: ${authErr.message})`;
        } else {
          emailStatus = " (Invite email dispatched!)";
        }
      }

      setIsModalOpen(false);
      setSuccessMessage(
        (editingMember ? "Member updated successfully!" : "Member added successfully!") + emailStatus
      );
      setTimeout(() => setSuccessMessage(""), 7000);
      await loadTeam();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Failed to save team member.");
    } finally {
      setFormSaving(false);
    }
  }

  async function handleDeleteMember(member: TeamMember) {
    if (currentUserRole === "cashier") {
      alert("Permission denied: Cashiers cannot delete team members.");
      return;
    }
    if (member.role === "owner") {
      alert("The Store Owner account cannot be deleted.");
      return;
    }

    const displayName = member.display_name || member.profiles?.display_name || "this team member";
    if (!window.confirm(`Are you sure you want to remove "${displayName}" from your store team?`)) {
      return;
    }

    if (preview || !tenantId || !supabase) {
      setMembers((prev) => prev.filter((m) => m.id !== member.id));
      setSuccessMessage(`Removed "${displayName}" from team.`);
      setTimeout(() => setSuccessMessage(""), 3500);
      if (editingMember?.id === member.id) setIsModalOpen(false);
      return;
    }

    try {
      const { error: rpcErr } = await supabase.rpc("delete_team_member", {
        target_tenant_id: tenantId,
        target_member_id: member.id,
      });

      if (rpcErr) {
        // Fallback to direct table delete
        const { error: deleteErr } = await supabase
          .from("tenant_members")
          .delete()
          .eq("id", member.id)
          .eq("tenant_id", tenantId);

        if (deleteErr) throw deleteErr;
      }

      setMembers((prev) => prev.filter((m) => m.id !== member.id));
      setSuccessMessage(`Removed "${displayName}" from store team.`);
      setTimeout(() => setSuccessMessage(""), 3500);
      if (editingMember?.id === member.id) setIsModalOpen(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete team member.");
    }
  }

  const filteredMembers = members.filter((member) => {
    if (!showInactive && !member.active) return false;
    if (roleFilter !== "all" && member.role !== roleFilter) return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      const name = (member.display_name || member.profiles?.display_name || "").toLowerCase();
      const email = (member.email || member.profiles?.email || "").toLowerCase();
      const role = member.role.toLowerCase();
      return name.includes(q) || email.includes(q) || role.includes(q);
    }
    return true;
  });

  return (
    <main className="catalog-shell">
      <header className="catalog-header team-header">
        <BackButton onClick={onBack} label="Home" />
        <div style={{ textAlign: "right" }}>
          <p className="eyebrow">PEOPLE & SHIFTS</p>
          <h1>Team & cashiers</h1>
        </div>
      </header>

      {successMessage && <div className="form-notice team-banner">{successMessage}</div>}
      {error && <div className="form-error team-banner">{error}</div>}

      <section className="catalog-toolbar">
        <input
          type="search"
          placeholder="Search team by name, email, or role..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="category-tabs">
          <button
            type="button"
            className={roleFilter === "all" ? "active" : ""}
            onClick={() => setRoleFilter("all")}
          >
            All roles
          </button>
          <button
            type="button"
            className={roleFilter === "manager" ? "active" : ""}
            onClick={() => setRoleFilter("manager")}
          >
            Managers
          </button>
          <button
            type="button"
            className={roleFilter === "cashier" ? "active" : ""}
            onClick={() => setRoleFilter("cashier")}
          >
            Cashiers
          </button>
        </div>

        <label className="show-inactive-toggle">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
          />
          Show inactive
        </label>

        <div className="catalog-actions">
          <button className="primary-button" type="button" onClick={openAddModal}>
            Add team member <span>+</span>
          </button>
        </div>
      </section>

      <section className="team-roster" aria-label="Team roster">
        {loading ? (
          <div className="empty-state">
            <strong>Loading team...</strong>
            <span>Fetching store staff and cashiers.</span>
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="empty-state">
            <strong>No members found</strong>
            <span>Try adjusting your search or add your first cashier.</span>
          </div>
        ) : (
          filteredMembers.map((member) => {
            const displayName =
              member.display_name ||
              member.profiles?.display_name ||
              (member.role === "owner" ? "Store Owner" : "Unnamed Member");
            const email = member.email || member.profiles?.email;
            const initials = displayName
              .split(" ")
              .filter(Boolean)
              .map((w) => w[0])
              .slice(0, 2)
              .join("")
              .toUpperCase() || "SF";

            return (
              <article
                className={`team-member-card ${!member.active ? "inactive" : ""}`}
                key={member.id}
              >
                <div className="member-avatar">{initials}</div>

                <div className="member-main-info">
                  <div className="member-name-row">
                    <strong>{displayName}</strong>
                    <span className={`role-badge ${member.role}`}>
                      {member.role === "owner" ? "Owner" : member.role === "manager" ? "Manager" : "Cashier"}
                    </span>
                    {!member.active && <span className="status-badge inactive">Inactive</span>}
                  </div>

                  <div className="member-meta">
                    {email ? (
                      <span className="member-email">
                        ✉ {email}{" "}
                        {member.user_id ? (
                          <span className="account-tag linked">Account linked</span>
                        ) : (
                          <>
                            <span className="account-tag pending">Invite pending</span>
                            <button
                              type="button"
                              className="settings-link"
                              style={{ fontSize: "10px", padding: "2px 7px", marginLeft: "6px" }}
                              onClick={() => {
                                const link = `${window.location.origin}/?invite=${encodeURIComponent(email)}`;
                                navigator.clipboard.writeText(link);
                                alert(`Invite link copied to clipboard:\n\n${link}\n\nYou can send this link to ${displayName} directly!`);
                              }}
                            >
                              📋 Copy invite link
                            </button>
                          </>
                        )}
                      </span>
                    ) : (
                      <span className="member-email pin-only">
                        🔒 PIN-only cashier (POS Register)
                      </span>
                    )}
                  </div>
                </div>

                <div className="member-pin-status">
                  {member.pin_hash ? (
                    <span className="pin-pill has-pin">
                      <span className="pin-dot green" /> PIN set
                    </span>
                  ) : (
                    <span className="pin-pill no-pin">
                      <span className="pin-dot grey" /> No PIN
                    </span>
                  )}
                </div>

                <div className="member-actions" style={{ display: "flex", gap: "6px" }}>
                  {member.role !== "owner" ? (
                    <>
                      <button
                        type="button"
                        className="row-action"
                        onClick={() => openEditModal(member)}
                        title="Edit member details"
                      >
                        ···
                      </button>
                      <button
                        type="button"
                        className="row-action"
                        style={{ color: "#c93b2b", borderColor: "#f7d4d0" }}
                        onClick={() => handleDeleteMember(member)}
                        title="Remove member"
                      >
                        🗑
                      </button>
                    </>
                  ) : null}
                </div>
              </article>
            );
          })
        )}
      </section>

      {/* Add / Edit Member Modal */}
      {isModalOpen && (
        <div className="modal-backdrop" role="presentation">
          <section
            className="product-modal team-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="team-modal-heading"
          >
            <div className="modal-heading">
              <div>
                <p className="eyebrow">
                  {editingMember ? "Edit Member" : "New Team Member"}
                </p>
                <h2 id="team-modal-heading">
                  {editingMember ? "Update Staff Details" : "Invite or Add Staff"}
                </h2>
                <p className="modal-subtitle">
                  {editingMember
                    ? "Update role, active status, or reset 4-digit PIN."
                    : "Add an email to invite them to log in, or set a PIN for register-only cashiers."}
                </p>
              </div>
              <button
                type="button"
                className="close-button"
                onClick={() => setIsModalOpen(false)}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSaveMember}>
              <div className="form-section">
                <h3>Member Profile</h3>
                <label>
                  Full Name <span className="required">*</span>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Amina Yusuf"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                  />
                </label>

                <label>
                  Email address <span className="optional">(for email invite / web login)</span>
                  <input
                    type="email"
                    placeholder="e.g. amina@store.com"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                  />
                  <p className="field-help">
                    Optional for POS cashiers. If provided, they can log into Storeflow with their own account.
                  </p>
                </label>
              </div>

              <div className="form-section">
                <h3>Role & Permissions</h3>
                <label>
                  Store Role
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value as "manager" | "cashier")}
                  >
                    <option value="cashier">Cashier — Register checkout & sales shifts</option>
                    <option value="manager">Manager — Manage products, stock, team & reports</option>
                  </select>
                </label>
              </div>

              <div className="form-section">
                <h3>Register Security</h3>
                <label>
                  4-Digit Cashier PIN{" "}
                  <span className="optional">
                    {editingMember ? "(leave blank to keep current PIN)" : "(optional)"}
                  </span>
                  <input
                    type="password"
                    maxLength={4}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="••••"
                    value={formPin}
                    onChange={(e) => setFormPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  />
                  <p className="field-help">
                    4 numeric digits. Cashiers use this to unlock registers and clock in to shifts quickly.
                  </p>
                </label>

                {editingMember && (
                  <label className="toggle-label" style={{ marginTop: "14px" }}>
                    <input
                      type="checkbox"
                      checked={formActive}
                      onChange={(e) => setFormActive(e.target.checked)}
                    />
                    Active member (uncheck to deactivate this member)
                  </label>
                )}
              </div>

              {formError && <div className="form-error">{formError}</div>}

              <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
                {editingMember && editingMember.role !== "owner" && (
                  <button
                    type="button"
                    className="secondary-button"
                    style={{ color: "#c93b2b", borderColor: "#f7d4d0", background: "#fdf2f0" }}
                    onClick={() => handleDeleteMember(editingMember)}
                  >
                    🗑 Delete member
                  </button>
                )}
                <button
                  className="primary-button auth-submit"
                  type="submit"
                  style={{ marginTop: 0 }}
                  disabled={formSaving}
                >
                  {formSaving
                    ? "Saving..."
                    : editingMember
                    ? "Save Changes"
                    : formEmail
                    ? "Send Invite / Add Member"
                    : "Add Cashier"}
                  <span>→</span>
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
