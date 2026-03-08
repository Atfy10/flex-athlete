import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ApiError } from "@/lib/api";
import { ProfileViewLayout, ProfileSection } from "@/components/profile/ProfileViewLayout";
import { useToast } from "@/hooks/use-toast";
import { BaseModal } from "@/components/modals/BaseModal";
import { FormInput } from "@/components/modals/FormInput";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail, Phone, Shield, User, Calendar, KeyRound } from "lucide-react";
import { getMyProfile, changePassword, MyProfileDto } from "@/services/auth.services";

export default function MyProfile() {
  const { token, devUser } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  const [profile, setProfile] = useState<MyProfileDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Password change modal
  const [pwOpen, setPwOpen] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwErrors, setPwErrors] = useState<string[]>([]);
  const [pwForm, setPwForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Auto-open modals from URL ?tab= param
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "password") setPwOpen(true);
  }, [searchParams]);

  // ── Decode JWT as fallback ──────────────────────────────────────────────────
  const decodeJwtPayload = (t: string): Record<string, unknown> => {
    try {
      return JSON.parse(atob(t.split(".")[1]));
    } catch {
      return {};
    }
  };

  // ── Fetch profile ───────────────────────────────────────────────────────────
  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getMyProfile();
      if (res.isSuccess && res.data) {
        setProfile(res.data);
        setLoading(false);
        return;
      }
    } catch {
      // fall through to JWT fallback
    }

    // Fallback 1: JWT claims
    if (token) {
      const payload = decodeJwtPayload(token) as {
        sub?: string;
        email?: string;
        unique_name?: string;
        name?: string;
        phone_number?: string;
        role?: string | string[];
      };
      setProfile({
        id: payload.sub ?? "",
        userName: payload.unique_name ?? payload.name ?? "User",
        email: payload.email ?? "",
        phoneNumber: payload.phone_number ?? undefined,
        roles: Array.isArray(payload.role)
          ? payload.role
          : payload.role
          ? [payload.role]
          : undefined,
      });
      setLoading(false);
      return;
    }

    // Fallback 2: dev session
    if (devUser) {
      setProfile({
        id: devUser.id,
        userName: devUser.name,
        email: devUser.email,
        roles: [devUser.role],
      });
      setLoading(false);
      return;
    }

    setError("Could not load profile.");
    setLoading(false);
  };

  useEffect(() => {
    fetchProfile();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, devUser]);

  // ── Password change ─────────────────────────────────────────────────────────
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwErrors([]);
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwErrors(["New password and confirm password do not match."]);
      return;
    }
    if (pwForm.newPassword.length < 6) {
      setPwErrors(["Password must be at least 6 characters."]);
      return;
    }
    setPwLoading(true);
    try {
      await changePassword(pwForm.currentPassword, pwForm.newPassword);
      toast({ title: "Password changed successfully." });
      setPwOpen(false);
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      setPwErrors([
        err instanceof ApiError ? err.message : "Failed to change password.",
      ]);
    } finally {
      setPwLoading(false);
    }
  };

  // ── Derived display values ──────────────────────────────────────────────────
  const isEmailUsername = profile?.userName === profile?.email;
  const displayName = isEmailUsername
    ? (profile?.email ?? "My Profile")
    : (profile?.userName ?? "My Profile");

  // Primary role for the badge (first role, or "User" as default)
  const primaryRole = profile?.roles?.[0] ?? "User";

  // ── Sections ────────────────────────────────────────────────────────────────
  const sections: ProfileSection[] = profile
    ? [
        {
          title: "Account Information",
          fields: [
            !isEmailUsername
              ? {
                  label: "Username",
                  value: profile.userName,
                  icon: <User className="h-3.5 w-3.5" />,
                }
              : null,
            {
              label: "Email",
              value: profile.email,
              icon: <Mail className="h-3.5 w-3.5" />,
            },
            profile.phoneNumber
              ? {
                  label: "Phone",
                  value: profile.phoneNumber,
                  icon: <Phone className="h-3.5 w-3.5" />,
                }
              : null,
            profile.createdAt
              ? {
                  label: "Member Since",
                  value: new Date(profile.createdAt).toLocaleDateString(
                    "en-US",
                    { year: "numeric", month: "long", day: "numeric" },
                  ),
                  icon: <Calendar className="h-3.5 w-3.5" />,
                }
              : null,
          ].filter(Boolean) as ProfileSection["fields"],
        },
        ...(profile.roles && profile.roles.length > 0
          ? [
              {
                title: "Assigned Roles",
                fields: [
                  {
                    label: "Roles",
                    value: (
                      <div className="flex flex-wrap gap-1 justify-end">
                        {profile.roles.map((role, i) => (
                          <Badge
                            key={i}
                            variant="secondary"
                            className="text-xs"
                          >
                            <Shield className="h-3 w-3 mr-1" />
                            {role}
                          </Badge>
                        ))}
                      </div>
                    ),
                    icon: <Shield className="h-3.5 w-3.5" />,
                  },
                ],
              },
            ]
          : []),
      ]
    : [];

  return (
    <>
      <ProfileViewLayout
        loading={loading}
        error={error}
        fullName={displayName}
        roleBadge={primaryRole}
        roleBadgeVariant="secondary"
        statusBadge="Active"
        statusBadgeClass="bg-success/10 text-success"
        sections={sections}
        backPath="/"
        onEdit={() => setPwOpen(true)}
        toggleLabel="Change Password"
        editModal={null}
        extraActions={
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => setPwOpen(true)}
          >
            <KeyRound className="h-4 w-4" />
            Change Password
          </Button>
        }
      />

      {/* Change Password Modal */}
      <BaseModal
        open={pwOpen}
        onOpenChange={(open) => {
          setPwOpen(open);
          if (!open) {
            setPwErrors([]);
            setPwForm({
              currentPassword: "",
              newPassword: "",
              confirmPassword: "",
            });
          }
        }}
        title="Change Password"
        description="Enter your current password and choose a new one."
        onSubmit={handlePasswordChange}
        loading={pwLoading}
        submitLabel="Change Password"
        errors={pwErrors}
      >
        <FormInput
          id="currentPassword"
          label="Current Password"
          type="password"
          value={pwForm.currentPassword}
          onChange={(v) => setPwForm((p) => ({ ...p, currentPassword: v }))}
          required
        />
        <FormInput
          id="newPassword"
          label="New Password"
          type="password"
          value={pwForm.newPassword}
          onChange={(v) => setPwForm((p) => ({ ...p, newPassword: v }))}
          required
          hint="Minimum 6 characters"
        />
        <FormInput
          id="confirmPassword"
          label="Confirm New Password"
          type="password"
          value={pwForm.confirmPassword}
          onChange={(v) => setPwForm((p) => ({ ...p, confirmPassword: v }))}
          required
        />
      </BaseModal>
    </>
  );
}
